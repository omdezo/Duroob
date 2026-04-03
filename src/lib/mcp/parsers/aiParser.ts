import { GoogleGenerativeAI } from '@google/generative-ai';
import type { McpToolCall } from '../types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

const SYSTEM_PROMPT = `You are the intent parser for Duroob (دُروب), an Oman tourism platform.

Your ONLY job is to extract structured tool calls from user messages about travel in Oman.
You must respond with ONLY valid JSON — no markdown, no explanation, no extra text.

Available tools:

1. plan_trip — Generate a trip itinerary
   Fields: durationDays (1-7, required), budgetTier ("low"|"medium"|"luxury"), customBudgetOmr (number), travelMonth (1-12), intensity ("relaxed"|"balanced"|"packed"), preferredCategories (array of "mountain"|"beach"|"culture"|"desert"|"nature"|"food"), preferredRegions (array of "muscat"|"dakhiliya"|"sharqiya"|"dhofar"|"batinah"|"dhahira")

2. modify_plan — Modify an existing plan
   Fields: action ("swap_stop"|"change_budget"|"change_duration"|"regenerate"), dayNumber (number), stopIndex (number), newCategory (string), newBudgetOmr (number)

3. search_destinations — Search for destinations
   Fields: query (string), category (string), region (string), maxCost (number)

4. get_recommendations — Get travel recommendations
   Fields: context ("trending_now"|"tier_for_duration"|"best_month_for_region"), duration (number), region (string)

5. get_travel_info — Get travel information about Oman
   Fields: topic ("weather"|"visa"|"safety"|"transport"|"food_guide"|"currency"|"emergency"), region (string)

RULES:
- Respond ONLY with a JSON array of tool calls: [{"tool":"tool_name","input":{...}}]
- If you cannot determine the intent, respond with: []
- "Muscat" = region "muscat", "Salalah"/"Dhofar" = region "dhofar", "Nizwa" = region "dakhiliya"
- Map Arabic: "مسقط"=muscat, "ظفار"=dhofar, "صلالة"=dhofar, "نزوى"=dakhiliya, "الشرقية"=sharqiya, "الباطنة"=batinah, "الظاهرة"=dhahira
- Extract ONLY what is explicitly stated or clearly implied. Do not guess.
- Budget amounts are in OMR.
- "cheap"/"budget"/"اقتصادي" = tier "low", "comfort"/"مريح" = "medium", "luxury"/"فاخر" = "luxury"
- If the user asks about weather/visa/safety etc., use get_travel_info
- If the user wants to find/search places, use search_destinations
- If the user asks what's popular/trending/recommended, use get_recommendations`;

export async function parseWithAI(
  message: string,
  locale: string,
  hasPlan: boolean
): Promise<McpToolCall[] | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const contextNote = hasPlan
      ? '\nThe user has an active trip plan. If they want changes, use modify_plan.'
      : '';

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `${SYSTEM_PROMPT}${contextNote}\n\nUser message (${locale}): "${message}"\n\nRespond with JSON array only:` }],
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 500,
      },
    });

    const text = result.response.text().trim();

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return null;

    // Validate shape
    const toolCalls: McpToolCall[] = parsed
      .filter((item: any) => item.tool && typeof item.tool === 'string' && item.input)
      .map((item: any) => ({
        tool: item.tool,
        input: item.input,
      }));

    return toolCalls.length > 0 ? toolCalls : null;
  } catch (error) {
    console.error('Gemini AI parser error:', error);
    return null; // Fallback to rule parser
  }
}
