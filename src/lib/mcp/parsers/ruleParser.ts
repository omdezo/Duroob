/**
 * Smart rule-based intent parser v3.
 *
 * Fixes from v2:
 * - Arabic word boundary awareness (don't match "أمان" inside "الأماكن")
 * - Unknown region handling ("مسندم" → helpful error, not silence)
 * - Context-aware: knows about previous plan for modifications
 * - Defaults to plan_trip when any location/activity is mentioned
 */

import type { McpToolCall } from '../types';
import type { Region, Category } from '@/types/destination';

// ─── Word-boundary-aware matching ─────────────────────────────────────────
// Arabic doesn't have word boundaries like English. We use space/start/end delimiters.

function matchWord(text: string, words: string[]): boolean {
  for (const word of words) {
    // For Arabic: check with spaces or start/end of string
    const re = new RegExp(`(?:^|\\s|[،.!?])${escapeRegex(word)}(?:$|\\s|[،.!?])`, 'i');
    if (re.test(text) || re.test(` ${text} `)) return true;
    // For English: use word boundary
    if (/^[a-z]+$/i.test(word)) {
      const reEn = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
      if (reEn.test(text)) return true;
    }
  }
  return false;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w.toLowerCase()) || text.includes(w));
}

// ─── Duration ─────────────────────────────────────────────────────────────

function parseDuration(msg: string): number | null {
  const numDays = msg.match(/(\d+)\s*(?:days?|أيام|يوم|ايام)/i);
  if (numDays) return Math.min(Math.max(parseInt(numDays[1]), 1), 7);
  if (/يومين|يومان/.test(msg)) return 2;
  if (matchWord(msg, ['weekend', 'عطلة', 'عطله'])) return 2;
  if (matchWord(msg, ['week', 'اسبوع', 'أسبوع'])) return 7;
  // Bare number in context
  const bare = msg.match(/\b([1-7])\b/);
  if (bare) return parseInt(bare[1]);
  return null;
}

// ─── Budget ───────────────────────────────────────────────────────────────

function parseBudget(msg: string): { amount?: number; tier?: string } {
  const r: { amount?: number; tier?: string } = {};
  const amt = msg.match(/(\d+)\s*(?:omr|rial|ريال|ر\.ع)/i);
  if (amt) r.amount = parseInt(amt[1]);
  if (matchWord(msg, ['budget', 'cheap', 'اقتصادي', 'رخيص', 'بسيط'])) r.tier = 'low';
  else if (matchWord(msg, ['luxury', 'premium', 'فاخر', 'فخم', 'غالي', 'راقي'])) r.tier = 'luxury';
  else if (matchWord(msg, ['comfort', 'مريح', 'متوسط'])) r.tier = 'medium';
  return r;
}

// ─── Regions ──────────────────────────────────────────────────────────────

// Regions we HAVE data for
const KNOWN_REGIONS: Record<string, Region> = {
  muscat: 'muscat', مسقط: 'muscat',
  dakhiliya: 'dakhiliya', الداخلية: 'dakhiliya', الداخليه: 'dakhiliya',
  nizwa: 'dakhiliya', نزوى: 'dakhiliya', نزوا: 'dakhiliya',
  bahla: 'dakhiliya', بهلاء: 'dakhiliya', بهلا: 'dakhiliya',
  sharqiya: 'sharqiya', الشرقية: 'sharqiya', الشرقيه: 'sharqiya',
  sur: 'sharqiya', صور: 'sharqiya', wahiba: 'sharqiya',
  dhofar: 'dhofar', ظفار: 'dhofar', salalah: 'dhofar', صلالة: 'dhofar', صلاله: 'dhofar',
  batinah: 'batinah', الباطنة: 'batinah', الباطنه: 'batinah',
  sohar: 'batinah', صحار: 'batinah', nakhal: 'batinah', نخل: 'batinah',
  dhahira: 'dhahira', الظاهرة: 'dhahira', الظاهره: 'dhahira',
  ibri: 'dhahira', عبري: 'dhahira',
};

// Regions/places we KNOW about but DON'T have data for
const UNSUPPORTED_PLACES = [
  'مسندم', 'musandam', 'خصب', 'khasab',
  'بريمي', 'buraimi', 'البريمي',
  'الوسطى', 'wusta', 'duqm', 'دقم',
  'مصيرة', 'masirah',
  'هرمز', 'hormuz',
];

function parseRegions(msg: string): { found: Region[]; unsupported: string[] } {
  const lower = msg.toLowerCase();
  const found = new Set<Region>();
  const unsupported: string[] = [];

  for (const [alias, region] of Object.entries(KNOWN_REGIONS)) {
    if (lower.includes(alias.toLowerCase()) || msg.includes(alias)) {
      found.add(region);
    }
  }

  for (const place of UNSUPPORTED_PLACES) {
    if (lower.includes(place.toLowerCase()) || msg.includes(place)) {
      unsupported.push(place);
    }
  }

  return { found: [...found], unsupported };
}

// ─── Categories ───────────────────────────────────────────────────────────

const CAT_WORDS: Record<Category, string[]> = {
  beach: ['beach', 'beaches', 'coast', 'swimming', 'شاطئ', 'شواطئ', 'بحر', 'سباحة'],
  culture: ['culture', 'cultural', 'heritage', 'history', 'museum', 'fort', 'mosque',
            'ثقافة', 'ثقافي', 'تراث', 'تاريخ', 'تاريخي', 'متحف', 'قلعة', 'قلاع', 'حصن', 'مسجد'],
  mountain: ['mountain', 'mountains', 'hiking', 'trek', 'جبل', 'جبال', 'جبلي', 'تسلق'],
  desert: ['desert', 'sand', 'dunes', 'safari', 'camping', 'صحراء', 'صحراوي', 'رمال', 'كثبان', 'تخييم'],
  nature: ['nature', 'wadi', 'wadis', 'wildlife', 'oasis', 'طبيعة', 'طبيعي', 'وادي', 'أودية', 'واحة'],
  food: ['food', 'dining', 'restaurant', 'cuisine', 'eat', 'طعام', 'أكل', 'اكل', 'مطعم', 'مطاعم', 'مطبخ'],
};

function parseCategories(msg: string): Category[] {
  const found = new Set<Category>();
  for (const [cat, words] of Object.entries(CAT_WORDS) as [Category, string[]][]) {
    if (matchWord(msg, words) || containsAny(msg, words)) {
      found.add(cat);
    }
  }
  return [...found];
}

// ─── Month ────────────────────────────────────────────────────────────────

function parseMonth(msg: string): number | null {
  const months: Record<string, number> = {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
    april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
    august: 8, aug: 8, september: 9, sep: 9, october: 10, oct: 10,
    november: 11, nov: 11, december: 12, dec: 12,
    يناير: 1, فبراير: 2, مارس: 3, أبريل: 4, ابريل: 4, مايو: 5,
    يونيو: 6, يوليو: 7, أغسطس: 8, اغسطس: 8, سبتمبر: 9,
    أكتوبر: 10, اكتوبر: 10, نوفمبر: 11, ديسمبر: 12,
    صيف: 6, شتاء: 12, شتا: 12, ربيع: 3, خريف: 10,
  };
  const lower = msg.toLowerCase();
  for (const [k, v] of Object.entries(months)) {
    if (lower.includes(k) || msg.includes(k)) return v;
  }
  return null;
}

// ─── Info topic detection (with word boundaries!) ─────────────────────────

function detectInfoTopic(msg: string): string | null {
  // Use matchWord to avoid "أمان" matching inside "الأماكن"
  if (matchWord(msg, ['weather', 'climate', 'temperature', 'طقس', 'الطقس', 'مناخ', 'المناخ', 'حرارة', 'مطر'])) return 'weather';
  if (matchWord(msg, ['visa', 'تأشيرة', 'تاشيرة', 'جواز'])) return 'visa';
  if (matchWord(msg, ['safe', 'safety', 'أمان', 'امان', 'أمن'])) return 'safety';
  if (matchWord(msg, ['transport', 'drive', 'car', 'taxi', 'airport', 'نقل', 'مواصلات', 'سيارة', 'مطار'])) return 'transport';
  if (matchWord(msg, ['currency', 'money', 'exchange', 'عملة', 'عمله', 'صرف'])) return 'currency';
  if (matchWord(msg, ['emergency', 'hospital', 'doctor', 'طوارئ', 'مستشفى', 'طبيب'])) return 'emergency';
  return null;
}

// ─── Main parser ──────────────────────────────────────────────────────────

export function parseWithRules(
  message: string,
  _locale: string,
  hasPlan: boolean,
): McpToolCall[] | null {
  const msg = message.trim();
  if (!msg) return null;

  const duration = parseDuration(msg);
  const budget = parseBudget(msg);
  const { found: regions, unsupported } = parseRegions(msg);
  const categories = parseCategories(msg);
  const month = parseMonth(msg);

  // ── Handle unsupported places explicitly ──
  if (unsupported.length > 0 && regions.length === 0) {
    // User asked about a place we don't have — return a special "not available" tool call
    return [{ tool: 'get_travel_info', input: {
      topic: '_unsupported_region',
      _place: unsupported[0],
    }}];
  }

  // ── Info questions (with WORD BOUNDARY matching) ──
  // Check BEFORE trip detection — "how is the weather" is info, not a trip
  const infoTopic = detectInfoTopic(msg);
  if (infoTopic && !duration) {
    return [{ tool: 'get_travel_info', input: { topic: infoTopic } }];
  }

  // ── "What places" / "What to do" type questions ──
  const isPlaceQuestion = matchWord(msg, [
    'places', 'attractions', 'things to do', 'what to see', 'activities',
    'أماكن', 'الأماكن', 'اماكن', 'السياحية', 'سياحية', 'معالم', 'وجهات',
    'ايش فيه', 'ويش فيه', 'ايش يوجد', 'ماذا يوجد', 'ايش اسوي', 'ويش اسوي',
  ]);
  if (isPlaceQuestion) {
    if (regions.length > 0) {
      // "What tourist places in Muscat?" → search that region
      return [{ tool: 'search_destinations', input: { region: regions[0], query: msg } }];
    }
    return [{ tool: 'search_destinations', input: { query: msg } }];
  }

  // ── Modify existing plan ──
  if (hasPlan && matchWord(msg, [
    'change', 'swap', 'replace', 'modify', 'different', 'instead', 'switch',
    'غيرت', 'غير', 'بدل', 'عدل', 'استبدل', 'بديل', 'ثاني', 'مختلف',
    'غيرت رأيي', 'غيرت رايي', 'أبي غير', 'ابي غير',
  ])) {
    const input: Record<string, any> = { action: 'regenerate' };
    if (budget.amount) input.newBudgetOmr = budget.amount;
    if (duration) input.newDuration = duration;
    if (regions.length > 0) input.preferredRegions = regions;
    if (categories.length > 0) input.newCategory = categories[0];
    return [{ tool: 'modify_plan', input }];
  }

  // ── Plan a trip (be very lenient) ──
  const hasTripSignal = duration || regions.length > 0 || categories.length > 0;
  const hasTripWord = matchWord(msg, [
    'trip', 'plan', 'travel', 'visit', 'go', 'tour', 'explore', 'holiday', 'vacation',
    'رحلة', 'رحله', 'خطط', 'خطة', 'سافر', 'سفر', 'أريد', 'اريد', 'أبغي', 'ابغي', 'أبي', 'ابي',
    'زيارة', 'زور', 'أزور', 'ازور', 'نزهة', 'جولة', 'إجازة', 'اجازة', 'عطلة',
  ]);
  // Also treat bare "اريد + region" as a trip request
  const isWantRegion = matchWord(msg, ['أريد', 'اريد', 'أبي', 'ابي', 'أبغي', 'ابغي', 'want', 'i want']) && regions.length > 0;

  if (hasTripSignal || hasTripWord || isWantRegion) {
    const input: Record<string, any> = { durationDays: duration ?? 3 };
    if (budget.amount) input.customBudgetOmr = budget.amount;
    if (budget.tier) input.budgetTier = budget.tier;
    if (month) input.travelMonth = month;
    if (categories.length > 0) input.preferredCategories = categories;
    if (regions.length > 0) input.preferredRegions = regions;
    return [{ tool: 'plan_trip', input }];
  }

  // ── Recommendations ──
  if (matchWord(msg, [
    'recommend', 'suggest', 'best', 'popular', 'trending', 'advice',
    'تنصح', 'أنصح', 'انصح', 'اقترح', 'أقترح', 'أفضل', 'افضل', 'شائع', 'مميز',
    'ايش تنصح', 'ويش تنصح', 'شو تنصح', 'ماذا تقترح',
  ])) {
    return [{ tool: 'get_recommendations', input: { context: 'trending_now' } }];
  }

  // ── Search ──
  if (matchWord(msg, [
    'find', 'search', 'show', 'where', 'look', 'list',
    'أبحث', 'ابحث', 'أرني', 'ارني', 'وريني', 'وين', 'أين', 'اين',
  ])) {
    return [{ tool: 'search_destinations', input: { query: msg } }];
  }

  // ── Greeting (but NOT if it contains info keywords like طقس) ──
  const hasInfoWord = containsAny(msg, ['طقس', 'الطقس', 'تأشيرة', 'تاشيرة', 'أمان', 'weather', 'visa', 'safety', 'عملة', 'طوارئ']);
  if (!hasInfoWord && matchWord(msg, [
    'hello', 'hi', 'hey', 'good morning', 'good evening',
    'مرحبا', 'مرحبًا', 'السلام', 'سلام', 'هلا', 'هاي', 'اهلا', 'أهلا',
    'صباح الخير', 'مساء الخير', 'كيف الحال', 'كيف حالك', 'شلونك',
  ])) {
    return null; // Let the API send a friendly welcome
  }

  // ── Last resort: if we have ANY extracted info, plan a trip ──
  if (regions.length > 0 || categories.length > 0) {
    const input: Record<string, any> = { durationDays: duration ?? 3 };
    if (regions.length > 0) input.preferredRegions = regions;
    if (categories.length > 0) input.preferredCategories = categories;
    return [{ tool: 'plan_trip', input }];
  }

  return null;
}
