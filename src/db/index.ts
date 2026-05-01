import { neon } from '@neondatabase/serverless';
import type { Destination, Category, Region, Month } from '@/types/destination';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export async function getActiveDestinations(): Promise<Destination[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM destinations WHERE is_active = true ORDER BY id`;
  return rows.map((row: any) => ({
    id: row.id as string,
    name: { en: row.name_en as string, ar: row.name_ar as string },
    lat: Number(row.lat),
    lng: Number(row.lng),
    region: { en: row.region_en as Region, ar: row.region_ar as string },
    categories: (row.categories || []) as Category[],
    company: { en: row.company_en || '', ar: row.company_ar || '' },
    avg_visit_duration_minutes: Number(row.avg_visit_min),
    ticket_cost_omr: parseFloat(row.ticket_cost) || 0,
    crowd_level: row.crowd_level as Destination['crowd_level'],
    recommended_months: (row.recommended_months || []) as Month[],
  }));
}
