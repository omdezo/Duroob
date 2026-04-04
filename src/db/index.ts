import { neon } from '@neondatabase/serverless';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export async function getActiveDestinations() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM destinations WHERE is_active = true ORDER BY id`;
  return rows.map((row: any) => ({
    id: row.id,
    name: { en: row.name_en, ar: row.name_ar },
    lat: row.lat,
    lng: row.lng,
    region: { en: row.region_en, ar: row.region_ar },
    categories: row.categories || [],
    company: { en: row.company_en || '', ar: row.company_ar || '' },
    avg_visit_duration_minutes: row.avg_visit_min,
    ticket_cost_omr: parseFloat(row.ticket_cost) || 0,
    crowd_level: row.crowd_level,
    recommended_months: row.recommended_months || [],
  }));
}
