/**
 * Duroob Agentic Chat Engine
 *
 * This is the brain. It handles ALL messages intelligently:
 * 1. Tries Gemini AI first (when available)
 * 2. Falls back to a smart conversational engine (not dumb keywords)
 *
 * The conversational engine:
 * - Maintains context (knows what was said before)
 * - Understands vague Arabic/English naturally
 * - NEVER shows the same generic welcome twice
 * - Always tries to be helpful, even with gibberish
 * - Uses the MCP tools as actions it can take
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { executeTool } from './registry';
import { DESTINATIONS } from '@/data/destinations';
import { generateItinerary } from '@/lib/planner/itineraryEngine';
import { scorePlan, type TripScores } from '@/lib/planner/tripScorer';
import type { McpContext, McpToolCall, McpToolResult } from './types';
import type { ItineraryPlan } from '@/types/itinerary';
import type { PlannerInputs } from '@/types/planner';
import type { Region, Category } from '@/types/destination';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  text: string;
  plan?: ItineraryPlan;
  scores?: TripScores;
  parsedInputs?: Record<string, any>;
  type: 'plan' | 'info' | 'search' | 'recommendation' | 'greeting' | 'conversation';
}

// ─── Region / Category data ───────────────────────────────────────────────

const REGION_NAMES_AR: Record<string, string> = {
  muscat: 'مسقط', dakhiliya: 'الداخلية', sharqiya: 'الشرقية',
  dhofar: 'ظفار', batinah: 'الباطنة', dhahira: 'الظاهرة',
};

const ALL_REGIONS: Region[] = ['muscat', 'dakhiliya', 'sharqiya', 'dhofar', 'batinah', 'dhahira'];

const REGION_ALIASES: Record<string, Region> = {
  muscat: 'muscat', مسقط: 'muscat',
  dakhiliya: 'dakhiliya', الداخلية: 'dakhiliya', الداخليه: 'dakhiliya',
  nizwa: 'dakhiliya', نزوى: 'dakhiliya', نزوا: 'dakhiliya',
  bahla: 'dakhiliya', بهلاء: 'dakhiliya', بهلا: 'dakhiliya',
  sharqiya: 'sharqiya', الشرقية: 'sharqiya', الشرقيه: 'sharqiya',
  sur: 'sharqiya', صور: 'sharqiya',
  dhofar: 'dhofar', ظفار: 'dhofar', salalah: 'dhofar', صلالة: 'dhofar', صلاله: 'dhofar',
  batinah: 'batinah', الباطنة: 'batinah', الباطنه: 'batinah',
  sohar: 'batinah', صحار: 'batinah', nakhal: 'batinah', نخل: 'batinah',
  dhahira: 'dhahira', الظاهرة: 'dhahira', الظاهره: 'dhahira',
  ibri: 'dhahira', عبري: 'dhahira',
};

const UNSUPPORTED_PLACES: Record<string, string> = {
  مسندم: 'Musandam', musandam: 'Musandam', خصب: 'Khasab',
  البريمي: 'Al Buraimi', buraimi: 'Al Buraimi',
  الوسطى: 'Al Wusta', دقم: 'Duqm', duqm: 'Duqm',
  مصيرة: 'Masirah',
};

const CAT_ALIASES: Record<string, Category> = {
  beach: 'beach', beaches: 'beach', شاطئ: 'beach', شواطئ: 'beach', بحر: 'beach', سباحة: 'beach',
  culture: 'culture', cultural: 'culture', heritage: 'culture', history: 'culture', fort: 'culture', mosque: 'culture', museum: 'culture',
  ثقافة: 'culture', ثقافي: 'culture', تراث: 'culture', تاريخ: 'culture', تاريخي: 'culture', متحف: 'culture', قلعة: 'culture', قلاع: 'culture', حصن: 'culture', مسجد: 'culture',
  mountain: 'mountain', mountains: 'mountain', hiking: 'mountain', جبل: 'mountain', جبال: 'mountain',
  desert: 'desert', sand: 'desert', dunes: 'desert', safari: 'desert', صحراء: 'desert', رمال: 'desert',
  nature: 'nature', wadi: 'nature', wildlife: 'nature', طبيعة: 'nature', وادي: 'nature',
  food: 'food', dining: 'food', restaurant: 'food', eat: 'food', طعام: 'food', أكل: 'food', اكل: 'food', مطعم: 'food',
};

// ─── Gemini AI Agent ──────────────────────────────────────────────────────

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? '';

const SYSTEM_PROMPT = `You are Duroob (دُروب), a smart and friendly AI travel assistant for Oman tourism.

You have these TOOLS you can call by outputting a JSON object:

1. plan_trip: {"tool":"plan_trip","input":{"durationDays":N,"preferredRegions":["muscat"],"preferredCategories":["culture"],"customBudgetOmr":200}}
2. search_destinations: {"tool":"search_destinations","input":{"query":"text","region":"muscat","category":"beach"}}
3. get_recommendations: {"tool":"get_recommendations","input":{"context":"trending_now"}}
4. get_travel_info: {"tool":"get_travel_info","input":{"topic":"weather|visa|safety|transport|food_guide|currency|emergency"}}

Available regions: muscat, dakhiliya, sharqiya, dhofar, batinah, dhahira
Available categories: mountain, beach, culture, desert, nature, food
Unsupported regions (not in our data yet): Musandam (مسندم), Al Buraimi, Al Wusta, Masirah

RULES:
- ALWAYS respond in the SAME LANGUAGE the user writes in. If Arabic → Arabic. If English → English.
- If the user wants a trip/plan, call plan_trip. Default to 3 days if not specified.
- If the user asks "what places" or "what's in [region]", call search_destinations.
- If the user asks about weather/visa/safety, call get_travel_info.
- If the user says something like "what do you recommend", call get_recommendations.
- If the user mentions a place we don't have (like Musandam), explain it's not available yet and list our 6 regions.
- If the user confirms something (نعم, yes, خليها, OK) after you suggested expanding regions, call plan_trip WITHOUT preferredRegions to get a multi-region trip.
- For greetings, introduce yourself warmly. If user says their name, greet them by name.
- Keep responses SHORT (2-3 sentences). The plan data is shown as a card — don't describe every stop.
- Be conversational and warm, like a local friend giving advice. Use Omani cultural references.
- When outputting a tool call, put the JSON on its own line, then your text response after it.
- If NOT calling any tool, just respond conversationally.
- NEVER refuse to help. If you don't understand, ask a clarifying question.`;

async function tryGemini(message: string, history: AgentMessage[], _locale: string): Promise<{ toolCall?: McpToolCall; text: string } | null> {
  if (!GEMINI_KEY) return null;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const historyFormatted = history.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood. I am Duroob, ready to help plan trips in Oman.' }] },
        ...historyFormatted,
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
    });

    const raw = result.response.text().trim();

    // Try to extract a tool call JSON from the response
    // Handle nested objects and arrays properly
    const jsonStart = raw.indexOf('{"tool"');
    if (jsonStart !== -1) {
      // Find matching closing brace by counting depth
      let depth = 0;
      let jsonEnd = -1;
      for (let i = jsonStart; i < raw.length; i++) {
        if (raw[i] === '{' || raw[i] === '[') depth++;
        if (raw[i] === '}' || raw[i] === ']') depth--;
        if (depth === 0) { jsonEnd = i + 1; break; }
      }
      if (jsonEnd > jsonStart) {
        try {
          const jsonStr = raw.slice(jsonStart, jsonEnd);
          const toolCall = JSON.parse(jsonStr) as McpToolCall;
          const text = (raw.slice(0, jsonStart) + raw.slice(jsonEnd)).trim();
          return { toolCall, text };
        } catch { /* not valid JSON */ }
      }
    }

    // Also try extracting from markdown code blocks
    const codeBlockMatch = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        const toolCall = JSON.parse(codeBlockMatch[1]) as McpToolCall;
        const text = raw.replace(codeBlockMatch[0], '').trim();
        return { toolCall, text };
      } catch { /* not valid JSON */ }
    }

    return { text: raw };
  } catch (err) {
    console.error('Gemini agent error:', (err as Error).message?.slice(0, 80));
    return null;
  }
}

// ─── Smart Conversational Fallback ────────────────────────────────────────
// When AI is unavailable, this handles the conversation intelligently.

function smartFallback(
  message: string,
  history: AgentMessage[],
  locale: string,
): { toolCall?: McpToolCall; text: string } {
  const msg = message.trim();
  const lower = msg.toLowerCase();
  const isAr = locale === 'ar';

  // Extract entities from the message
  const duration = extractDuration(msg);
  const regions = extractRegions(msg);
  const unsupported = extractUnsupported(msg);
  const categories = extractCategories(msg);
  const budget = extractBudget(msg);

  // Also check conversation history for context
  const lastPlan = history.findLast(m => m.role === 'assistant' && m.content.includes('محطة'));
  const hasPlanContext = !!lastPlan;

  // 1. Unsupported region
  if (unsupported.length > 0 && regions.length === 0) {
    const place = unsupported[0];
    const regionList = ALL_REGIONS.map(r => isAr ? `• ${REGION_NAMES_AR[r]}` : `• ${r.charAt(0).toUpperCase() + r.slice(1)}`).join('\n');
    return {
      text: isAr
        ? `عذراً، "${place}" غير متوفرة حالياً في قاعدة بياناتنا.\n\nالمناطق المتوفرة:\n${regionList}\n\nقول لي أي منطقة تبيها وكم يوم وأنا أخطط لك!`
        : `Sorry, "${place}" isn't in our database yet.\n\nAvailable regions:\n${regionList}\n\nTell me which region and how many days, and I'll plan it!`,
    };
  }

  // 2. Asking about places/destinations — CHECK BEFORE trip generation
  //    "ويش الاماكن في نخل" is a QUESTION, not a trip request
  if (hasPlaceQuestion(lower, msg)) {
    if (regions.length > 0) {
      return { toolCall: { tool: 'search_destinations', input: { region: regions[0] } }, text: '' };
    }
    // General "what places" — list all regions
    const regionList = ALL_REGIONS.map(r => {
      const count = DESTINATIONS.filter(d => d.region.en === r).length;
      const name = isAr ? REGION_NAMES_AR[r] : r.charAt(0).toUpperCase() + r.slice(1);
      return `• ${name} (${count} ${isAr ? 'وجهة' : 'destinations'})`;
    }).join('\n');
    return {
      text: isAr
        ? `عندنا 31 وجهة سياحية في 6 مناطق:\n\n${regionList}\n\nأي منطقة تبي تعرف عنها أكثر؟`
        : `We have 31 destinations across 6 regions:\n\n${regionList}\n\nWhich region would you like to explore?`,
    };
  }

  // 3. Confirmation / "yes expand" — when previous message asked about expanding
  const isConfirm = containsAny(lower, ['نعم', 'اي', 'ايه', 'أيوه', 'ايوه', 'خليها', 'أضف', 'اضف', 'yes', 'yeah', 'sure', 'ok', 'yep', 'expand', 'add']);
  const prevAskedExpand = history.some(m => m.role === 'assistant' && (m.content.includes('أضيف مناطق') || m.content.includes('add nearby')));
  if (isConfirm && prevAskedExpand && duration) {
    // User confirmed expanding — remove region restriction, keep duration
    return { toolCall: { tool: 'plan_trip', input: { durationDays: duration } }, text: '' };
  }
  // Also handle "نعم خليها 5 ايام" — has duration + confirmation
  if (isConfirm && duration && hasPlanContext) {
    // Re-plan without region restriction for the requested days
    return { toolCall: { tool: 'plan_trip', input: { durationDays: duration } }, text: '' };
  }

  // 4. Weather / travel info — check BEFORE trip so "how's the weather" doesn't become a trip
  const infoTopic = detectInfoTopic(lower, msg);
  if (infoTopic) {
    return { toolCall: { tool: 'get_travel_info', input: { topic: infoTopic } }, text: '' };
  }

  // 5. Trip request — explicit trip words OR duration + region/category
  const hasTripWord = hasAnyTripWord(lower, msg);
  const hasWant = hasWantWord(lower, msg);
  const hasTripSignal = duration || (hasTripWord && (regions.length > 0 || categories.length > 0));
  const isWantTrip = hasWant && (regions.length > 0 || categories.length > 0 || duration);

  if (hasTripSignal || isWantTrip || (duration && duration > 1)) {
    const input: Record<string, any> = { durationDays: duration ?? 3 };
    if (regions.length) input.preferredRegions = regions;
    if (categories.length) input.preferredCategories = categories;
    if (budget) input.customBudgetOmr = budget;
    return { toolCall: { tool: 'plan_trip', input }, text: '' };
  }

  // 5. Recommendations
  if (hasRecommendWord(lower, msg)) {
    return { toolCall: { tool: 'get_recommendations', input: { context: 'trending_now' } }, text: '' };
  }

  // 6. Change/modify request with plan context
  if (hasPlanContext && hasChangeWord(lower, msg)) {
    // If they mention a new region, plan for that region
    if (regions.length > 0) {
      return { toolCall: { tool: 'plan_trip', input: { durationDays: duration ?? 3, preferredRegions: regions } }, text: '' };
    }
    return {
      text: isAr
        ? 'تبي تغير الخطة؟ قول لي ايش تبي — مثلاً: "أبي مسقط بدال" أو "زد يوم" أو "شواطئ فقط"'
        : 'Want to change the plan? Tell me what — e.g. "switch to Muscat", "add a day", or "beaches only"',
    };
  }

  // 7. "I want [region]" without explicit trip word — still a trip
  if (hasWant && regions.length > 0) {
    return { toolCall: { tool: 'plan_trip', input: { durationDays: duration ?? 3, preferredRegions: regions } }, text: '' };
  }

  // 8. Greeting — detect name and personalize
  if (isGreeting(lower, msg)) {
    // Check if user said their name: "مرحبا انا عمر" or "hi I'm Omar"
    const nameMatch = msg.match(/(?:انا|أنا|اسمي|i'm|i am|my name is)\s+(\S+)/i);
    const name = nameMatch ? nameMatch[1] : '';
    const nameGreet = name ? (isAr ? ` يا ${name}` : `, ${name}`) : '';

    return {
      text: isAr
        ? `أهلاً وسهلاً${nameGreet}! أنا دُروب 🇴🇲\n\nأقدر أساعدك تخطط رحلتك في عُمان. قول لي:\n• وين تبي تروح؟\n• كم يوم؟\n• ايش يعجبك؟ (شواطئ، ثقافة، جبال، صحراء..)\n\nأو جرب قول: "3 أيام مسقط" وأنا أسوي لك خطة!`
        : `Welcome${nameGreet}! I'm Duroob 🇴🇲\n\nI'll help you plan your Oman trip. Tell me:\n• Where do you want to go?\n• How many days?\n• What do you enjoy? (beaches, culture, mountains, desert..)\n\nOr just say: "3 days Muscat" and I'll make you a plan!`,
    };
  }

  // 9. ANYTHING else — be helpful, don't repeat the same welcome
  // Try to be smart about what they might mean
  if (regions.length > 0) {
    return { toolCall: { tool: 'plan_trip', input: { durationDays: 3, preferredRegions: regions } }, text: '' };
  }
  if (categories.length > 0) {
    return { toolCall: { tool: 'search_destinations', input: { category: categories[0] } }, text: '' };
  }

  // Truly unrecognizable — be conversational, NOT repeat welcome
  const responses = isAr ? [
    'ما فهمت بالضبط، بس أقدر أساعدك في:\n\n🗺️ تخطيط رحلة — "3 أيام مسقط"\n🔍 البحث عن أماكن — "شواطئ في ظفار"\n🌤️ معلومات — "كيف الطقس"\n⭐ توصيات — "ايش أفضل مكان"\n\nجرب تقول لي ايش تبي!',
    'أنا هنا أساعدك! جرب تقول:\n• اسم منطقة مثل "مسقط" أو "ظفار"\n• نوع نشاط مثل "شواطئ" أو "ثقافة"\n• أو سؤال مثل "كيف الطقس"',
    'ما قدرت أفهم طلبك. ممكن تقول لي بطريقة ثانية؟\n\nمثلاً: "أبي رحلة 3 أيام شواطئ" أو "ويش الأماكن في مسقط"',
  ] : [
    'I didn\'t quite catch that. I can help with:\n\n🗺️ Trip planning — "3 days in Muscat"\n🔍 Finding places — "beaches in Dhofar"\n🌤️ Travel info — "how\'s the weather"\n⭐ Tips — "what do you recommend"\n\nTry telling me what you\'d like!',
    'I\'m here to help! Try:\n• A region name like "Muscat" or "Dhofar"\n• An activity like "beaches" or "culture"\n• A question like "visa info"',
    'Could you rephrase that? Try something like:\n"plan 3 day beach trip" or "what places are in Muscat"',
  ];

  // Pick a different response based on how many unrecognized messages in a row
  const failCount = history.filter(m => m.role === 'assistant' && m.content.includes(isAr ? 'ما فهمت' : 'didn\'t quite')).length;
  return { text: responses[Math.min(failCount, responses.length - 1)] };
}

// ─── Entity extractors ────────────────────────────────────────────────────

function containsAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some(w => lower.includes(w) || text.includes(w));
}

function extractDuration(msg: string): number | null {
  // Digit + days word
  const m = msg.match(/(\d+)\s*(?:days?|أيام|يوم|ايام)/i);
  if (m) return Math.min(Math.max(parseInt(m[1]), 1), 7);

  // Arabic written numbers + days
  const arabicNums: Record<string, number> = {
    'واحد': 1, 'يوم واحد': 1,
    'يومين': 2, 'يومان': 2,
    'ثلاث': 3, 'ثلاثة': 3, 'ثلاث أيام': 3, 'ثلاثة أيام': 3, 'ثلاث ايام': 3,
    'اربع': 4, 'أربع': 4, 'أربعة': 4, 'اربعة': 4, 'أربع أيام': 4, 'اربع ايام': 4,
    'خمس': 5, 'خمسة': 5, 'خمس أيام': 5, 'خمسة أيام': 5, 'خمس ايام': 5, 'خمسة ايام': 5,
    'ست': 6, 'ستة': 6, 'ست أيام': 6, 'ستة أيام': 6, 'ست ايام': 6,
    'سبع': 7, 'سبعة': 7, 'سبع أيام': 7, 'سبعة أيام': 7, 'سبع ايام': 7,
  };
  for (const [word, num] of Object.entries(arabicNums)) {
    if (msg.includes(word)) return num;
  }

  // English written numbers
  const engNums: Record<string, number> = {
    'one day': 1, 'two days': 2, 'three days': 3, 'four days': 4,
    'five days': 5, 'six days': 6, 'seven days': 7, 'a week': 7,
  };
  const lower = msg.toLowerCase();
  for (const [word, num] of Object.entries(engNums)) {
    if (lower.includes(word)) return num;
  }

  if (/يومين|يومان/.test(msg)) return 2;
  if (/weekend|عطلة|عطله/i.test(msg)) return 2;
  if (/week|اسبوع|أسبوع/i.test(msg)) return 7;
  return null;
}

function extractRegions(msg: string): Region[] {
  const lower = msg.toLowerCase();
  const found = new Set<Region>();
  for (const [alias, region] of Object.entries(REGION_ALIASES)) {
    if (lower.includes(alias.toLowerCase()) || msg.includes(alias)) found.add(region);
  }
  return [...found];
}

function extractUnsupported(msg: string): string[] {
  const lower = msg.toLowerCase();
  return Object.entries(UNSUPPORTED_PLACES)
    .filter(([key]) => lower.includes(key.toLowerCase()) || msg.includes(key))
    .map(([, name]) => name);
}

function extractCategories(msg: string): Category[] {
  const lower = msg.toLowerCase();
  const found = new Set<Category>();
  for (const [alias, cat] of Object.entries(CAT_ALIASES)) {
    if (lower.includes(alias.toLowerCase()) || msg.includes(alias)) found.add(cat);
  }
  return [...found];
}

function extractBudget(msg: string): number | null {
  const m = msg.match(/(\d+)\s*(?:omr|rial|ريال|ر\.ع)/i);
  return m ? parseInt(m[1]) : null;
}

function hasAnyTripWord(lower: string, msg: string): boolean {
  const words = ['trip', 'plan', 'travel', 'visit', 'go', 'tour', 'explore', 'holiday',
    'رحلة', 'رحله', 'خطط', 'سافر', 'سفر', 'أريد', 'اريد', 'اريدها', 'أريدها',
    'أبي', 'ابي', 'ابيها', 'أبغي', 'ابغي', 'ابغاها', 'ابغيها',
    'زيارة', 'جولة', 'نزهة', 'عطلة', 'إجازة', 'اجازة',
    'ويش عن', 'شو عن', 'ايش عن', 'ماذا عن', 'what about'];
  return words.some(w => lower.includes(w) || msg.includes(w));
}

function hasWantWord(lower: string, msg: string): boolean {
  return ['want', 'i want', 'أريد', 'اريد', 'اريدها', 'أريدها', 'أبي', 'ابي', 'أبغي', 'ابغي', 'ابغى', 'أبغى', 'ابيها', 'أبيها', 'ابغاها', 'ابغيها']
    .some(w => lower.includes(w) || msg.includes(w));
}

function hasPlaceQuestion(lower: string, msg: string): boolean {
  return ['places', 'attractions', 'things to do', 'what to see', 'destinations', 'activities',
    'أماكن', 'الأماكن', 'اماكن', 'السياحية', 'سياحية', 'معالم', 'وجهات', 'الوجهات',
    'ايش فيه', 'ويش فيه', 'ايش يوجد', 'ماذا يوجد', 'الموجودة', 'الموجوده',
    'ايش اسوي', 'ويش اسوي', 'ايش اشوف', 'ويش اشوف']
    .some(w => lower.includes(w) || msg.includes(w));
}

function hasRecommendWord(lower: string, msg: string): boolean {
  return ['recommend', 'suggest', 'best', 'popular', 'trending', 'advice',
    'تنصح', 'أنصح', 'انصح', 'اقترح', 'أفضل', 'افضل', 'شائع', 'مميز',
    'ايش تنصح', 'ويش تنصح', 'شو تنصح']
    .some(w => lower.includes(w) || msg.includes(w));
}

function hasChangeWord(lower: string, msg: string): boolean {
  return ['change', 'swap', 'replace', 'different', 'instead', 'modify',
    'غيرت', 'غير', 'بدل', 'عدل', 'بديل', 'غيرت رأيي', 'غيرت رايي']
    .some(w => lower.includes(w) || msg.includes(w));
}

function detectInfoTopic(lower: string, msg: string): string | null {
  // Use containsAny but avoid false matches like "أمان" inside "الأماكن"
  const topics: [string, string[]][] = [
    ['weather', ['weather', 'climate', 'temperature', 'طقس', 'الطقس', 'مناخ', 'المناخ', 'حرارة']],
    ['visa', ['visa', 'تأشيرة', 'تاشيرة', 'جواز']],
    ['safety', ['safety', 'safe']],  // Only English — Arabic "أمان" is too risky
    ['transport', ['transport', 'drive', 'car', 'taxi', 'airport', 'نقل', 'مواصلات', 'سيارة', 'مطار']],
    ['currency', ['currency', 'money', 'exchange', 'عملة', 'عمله', 'صرف']],
    ['emergency', ['emergency', 'hospital', 'doctor', 'طوارئ', 'مستشفى', 'طبيب']],
    ['food_guide', ['cuisine', 'dish']],  // "food" is also a category, so only specific words
  ];
  for (const [topic, words] of topics) {
    if (words.some(w => lower.includes(w) || msg.includes(w))) return topic;
  }
  return null;
}

function isGreeting(lower: string, msg: string): boolean {
  // Only pure greetings — NOT if message has info words
  const infoWords = ['طقس', 'الطقس', 'تأشيرة', 'weather', 'visa', 'أماكن', 'الأماكن', 'places'];
  if (infoWords.some(w => lower.includes(w) || msg.includes(w))) return false;

  return ['hello', 'hi', 'hey', 'good morning', 'good evening',
    'مرحبا', 'مرحبًا', 'السلام عليكم', 'سلام', 'هلا', 'هاي', 'اهلا', 'أهلا',
    'صباح الخير', 'مساء الخير']
    .some(w => lower.includes(w) || msg.includes(w));
}

// ─── Main Agent Entry Point ───────────────────────────────────────────────

export async function runAgent(
  message: string,
  history: AgentMessage[],
  locale: string,
): Promise<AgentResponse> {
  const isAr = locale === 'ar';

  // Build MCP context
  const ctx: McpContext = {
    locale: locale as 'en' | 'ar',
    destinations: DESTINATIONS,
  };

  // Step 1: Try Gemini AI
  let aiResult = await tryGemini(message, history, locale);

  // Step 2: If AI failed, use smart fallback
  if (!aiResult) {
    aiResult = smartFallback(message, history, locale);
  }

  // Step 3: Execute tool call if any
  if (aiResult.toolCall) {
    const result = executeTool(aiResult.toolCall.tool, aiResult.toolCall.input, ctx);

    if (result.plan && result.scores) {
      let plan = result.plan;
      let scores = result.scores;
      const requestedDays = aiResult.toolCall.input.durationDays ?? 3;
      let actualDays = plan.days.length;

      // AUTO-EXPAND: if engine returned fewer days than requested and we had a region filter,
      // automatically retry WITHOUT the region filter to fill all requested days
      if (actualDays < requestedDays && aiResult.toolCall.input.preferredRegions?.length) {
        const expandedInput = { ...aiResult.toolCall.input };
        delete expandedInput.preferredRegions; // Remove region restriction
        const expanded = executeTool('plan_trip', expandedInput, ctx);
        if (expanded.plan && expanded.plan.days.length > actualDays) {
          plan = expanded.plan;
          scores = expanded.scores!;
          actualDays = plan.days.length;
        }
      }

      const stops = plan.days.reduce((s, d) => s + d.stops.length, 0);
      const regionNames = [...new Set(plan.days.map(d => isAr ? (d.regionAr || REGION_NAMES_AR[d.region] || d.region) : d.region))];
      const overall = scores.overall;
      const ratingText = isAr
        ? { excellent: 'ممتازة', good: 'جيدة', fair: 'مقبولة' }[overall]
        : overall.charAt(0).toUpperCase() + overall.slice(1);

      let text = aiResult.text || (isAr
        ? `إليك رحلتك لمدة ${actualDays} أيام! ستزور ${stops} مكان في ${regionNames.join(' و ')}. التكلفة: ${plan.costBreakdown.grandTotal} ر.ع. — رحلة ${ratingText}!`
        : `Here's your ${actualDays}-day trip! ${stops} stops across ${regionNames.join(' & ')}. Total: ${plan.costBreakdown.grandTotal} OMR — ${ratingText} trip!`);

      // If we auto-expanded, mention it
      if (regionNames.length > 1 && aiResult.toolCall.input.preferredRegions?.length === 1) {
        const originalRegion = isAr
          ? (REGION_NAMES_AR[aiResult.toolCall.input.preferredRegions[0]] || aiResult.toolCall.input.preferredRegions[0])
          : aiResult.toolCall.input.preferredRegions[0];
        text += isAr
          ? `\n\n📝 أضفت مناطق قريبة من ${originalRegion} لتغطية ${requestedDays} أيام كاملة.`
          : `\n\n📝 I added nearby regions to ${originalRegion} to cover the full ${requestedDays} days.`;
      }

      return {
        text,
        plan,
        scores,
        parsedInputs: aiResult.toolCall.input,
        type: 'plan',
      };
    }

    if (result.info) {
      return { text: aiResult.text || result.info.content, type: 'info' };
    }

    if (result.destinations) {
      const names = result.destinations.slice(0, 5).map(d => isAr ? d.name.ar : d.name.en);
      const text = aiResult.text || (isAr
        ? `وجدت ${result.destinations.length} وجهة: ${names.join('، ')}`
        : `Found ${result.destinations.length} destinations: ${names.join(', ')}`);
      return { text, type: 'search' };
    }

    if (result.recommendation) {
      return { text: aiResult.text || result.recommendation.summary, type: 'recommendation' };
    }
  }

  // No tool call — just return text
  return {
    text: aiResult.text,
    type: aiResult.text.includes('🇴🇲') ? 'greeting' : 'conversation',
  };
}
