export const REGION_NAMES: Record<string, { en: string; ar: string }> = {
  muscat: { en: 'Muscat', ar: 'مسقط' },
  dakhiliya: { en: 'Dakhiliya', ar: 'الداخلية' },
  sharqiya: { en: 'Sharqiya', ar: 'الشرقية' },
  dhofar: { en: 'Dhofar', ar: 'ظفار' },
  batinah: { en: 'Batinah', ar: 'الباطنة' },
  dhahira: { en: 'Dhahira', ar: 'الظاهرة' },
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  mountain: '\u26F0\uFE0F', beach: '\uD83C\uDFD6\uFE0F', culture: '\uD83D\uDD4C',
  desert: '\uD83C\uDFDC\uFE0F', nature: '\uD83C\uDF3F', food: '\uD83C\uDF7D\uFE0F',
};

export const ALL_REGIONS = ['muscat', 'dakhiliya', 'sharqiya', 'dhofar', 'batinah', 'dhahira'] as const;
export const ALL_CATEGORIES = ['mountain', 'beach', 'culture', 'desert', 'nature', 'food'] as const;

// Approximate region centers — used by weather lookups.
export const REGION_CENTERS: Record<string, { lat: number; lng: number }> = {
  muscat:    { lat: 23.588, lng: 58.408 },
  dakhiliya: { lat: 22.933, lng: 57.533 },
  sharqiya:  { lat: 22.566, lng: 59.532 },
  dhofar:    { lat: 17.019, lng: 54.089 },
  batinah:   { lat: 24.341, lng: 56.729 },
  dhahira:   { lat: 23.298, lng: 56.124 },
};
