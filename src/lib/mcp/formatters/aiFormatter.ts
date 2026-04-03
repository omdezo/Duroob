import { GoogleGenerativeAI } from '@google/generative-ai';
import type { McpToolResult } from '../types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

export async function formatWithAI(
  toolName: string,
  result: McpToolResult,
  locale: string
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build a concise summary of the result for the AI to format
    let dataSummary = '';

    if (toolName === 'plan_trip' && result.plan) {
      const stops = result.plan.days.reduce((s, d) => s + d.stops.length, 0);
      const regions = [...new Set(result.plan.days.map((d) => d.region))];
      const stopNames = result.plan.days.flatMap((d) =>
        d.stops.map((s) => s.destination.name[locale as 'en' | 'ar'] ?? s.destination.name.en)
      );
      dataSummary = `Trip: ${result.plan.days.length} days, ${stops} stops, regions: ${regions.join(', ')}, cost: ${result.plan.costBreakdown.grandTotal} OMR, safety: ${result.scores?.safety?.toFixed(0)}/100, enjoyment: ${result.scores?.enjoyment?.toFixed(0)}/100, overall: ${result.scores?.overall}. Destinations: ${stopNames.join(', ')}`;
    } else if (toolName === 'search_destinations' && result.destinations) {
      const names = result.destinations.slice(0, 5).map((d) => d.name[locale as 'en' | 'ar'] ?? d.name.en);
      dataSummary = `Found ${result.destinations.length} destinations: ${names.join(', ')}`;
    } else if (toolName === 'get_travel_info' && result.info) {
      dataSummary = `Travel info: ${result.info.content.slice(0, 200)}`;
    } else if (toolName === 'get_recommendations' && result.recommendation) {
      dataSummary = `Recommendation: ${result.recommendation.summary}`;
    } else if (toolName === 'modify_plan') {
      dataSummary = `Plan modified. Changes: ${result.changes?.map((c) => `Day ${c.day}: ${c.removed} → ${c.added}`).join('; ') ?? 'regenerated'}`;
    } else {
      return null; // No data to format
    }

    const langInstruction = locale === 'ar'
      ? 'Respond in Arabic (العربية). Be warm and use Omani cultural references.'
      : 'Respond in English. Be friendly and enthusiastic about Oman.';

    const prompt = `You are Duroob (دُروب), a friendly Oman travel assistant. ${langInstruction}

Summarize this ${toolName} result in 2-3 sentences. Be concise, warm, and helpful. Don't repeat exact numbers — the data is shown as a card. Add personality and local flavor. Don't use emojis.

Data: ${dataSummary}`;

    const genResult = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      },
    });

    const text = genResult.response.text().trim();
    return text || null;
  } catch (error) {
    console.error('Gemini AI formatter error:', error);
    return null;
  }
}
