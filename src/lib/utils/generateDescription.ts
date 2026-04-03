import type { Destination } from '@/types/destination';

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  mountain: 'a stunning highland destination offering dramatic landscapes and cool breezes',
  beach: 'a pristine coastal escape with crystal-clear waters and golden sands',
  culture: 'a historic landmark rich in Omani heritage and architectural splendour',
  desert: 'a captivating expanse of rolling dunes revealing the timeless soul of Arabia',
  nature: 'a breathtaking natural sanctuary showcasing Oman\'s remarkable biodiversity',
  food: 'a vibrant culinary hub where traditional Omani flavours come alive',
};

const SEASON_LABELS: Record<number, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April',
  5: 'May', 6: 'June', 7: 'July', 8: 'August',
  9: 'September', 10: 'October', 11: 'November', 12: 'December',
};

const REGION_CONTEXT: Record<string, string> = {
  muscat: 'the vibrant capital of Oman',
  dakhiliya: 'the historic heartland of Oman',
  sharqiya: 'the adventurous eastern coastline',
  dhofar: 'the lush southern highlands of Oman',
  batinah: 'the fertile northern coastal plain',
  dhahira: 'the remote and ancient western interior',
};

/** Deterministic placeholder description generated from destination fields. */
export function generateDescription(dest: Destination, locale: 'en' | 'ar' = 'en'): string {
  if (locale === 'ar') {
    // Simplified Arabic placeholder — production would use translated strings
    return `${dest.name.ar} وجهة سياحية رائدة في منطقة ${dest.region.ar}، تقدم تجربة لا تُنسى للزوار على مدار العام.`;
  }

  const primaryCategory = dest.categories[0];
  const categoryDesc = CATEGORY_DESCRIPTIONS[primaryCategory] ?? 'a remarkable destination';
  const regionCtx = REGION_CONTEXT[dest.region.en] ?? dest.region.en;
  const bestMonths = dest.recommended_months
    .slice(0, 3)
    .map((m) => SEASON_LABELS[m])
    .join(', ');

  const crowdDesc =
    dest.crowd_level <= 2
      ? 'It remains an off-the-beaten-path gem'
      : dest.crowd_level >= 4
      ? 'It draws visitors from around the world'
      : 'It offers a well-balanced visitor experience';

  const costNote =
    dest.ticket_cost_omr === 0
      ? 'Entry is free of charge.'
      : `Admission is ${dest.ticket_cost_omr} OMR.`;

  return (
    `${dest.name.en} is ${categoryDesc}, located in ${regionCtx}. ` +
    `${crowdDesc}, with an average visit duration of ${dest.avg_visit_duration_minutes} minutes. ` +
    `Best visited in ${bestMonths}. ${costNote}`
  );
}
