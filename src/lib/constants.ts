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
