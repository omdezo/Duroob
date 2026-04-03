export type Region = 'muscat' | 'dakhiliya' | 'sharqiya' | 'dhofar' | 'batinah' | 'dhahira';
export type Category = 'mountain' | 'beach' | 'culture' | 'desert' | 'nature' | 'food';
export type CrowdLevel = 1 | 2 | 3 | 4 | 5;
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type Locale = 'en' | 'ar';

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface Destination {
  id: string;
  name: LocalizedString;
  lat: number;
  lng: number;
  region: {
    en: Region;
    ar: string;
  };
  categories: Category[];
  company: LocalizedString;
  avg_visit_duration_minutes: number;
  ticket_cost_omr: number;
  recommended_months: Month[];
  crowd_level: CrowdLevel;
}

export interface LatLng {
  lat: number;
  lng: number;
}
