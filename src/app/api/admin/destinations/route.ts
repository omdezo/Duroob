import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';

// Transform DB row to frontend Destination shape
function toDestination(row: any) {
  return {
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
  };
}

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM destinations WHERE is_active = true ORDER BY id`;
    const destinations = rows.map(toDestination);
    return NextResponse.json({ destinations });
  } catch (error) {
    console.error('[API] GET /api/admin/destinations error:', error);
    return NextResponse.json({ destinations: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept both nested (name.en) and flat (nameEn) formats
    const nameEn = body.name?.en || body.nameEn;
    const nameAr = body.name?.ar || body.nameAr;

    if (!body.id || !nameEn || !nameAr) {
      return NextResponse.json({ error: 'id, name (en + ar) are required' }, { status: 400 });
    }

    const sql = getDb();

    const id = body.id;
    const lat = body.lat || 23.5;
    const lng = body.lng || 58.4;
    const regionEn = body.region?.en || body.region || 'muscat';
    const regionArMap: Record<string, string> = { muscat: 'مسقط', dakhiliya: 'الداخلية', sharqiya: 'الشرقية', dhofar: 'ظفار', batinah: 'الباطنة', dhahira: 'الظاهرة' };
    const regionAr = body.region?.ar || regionArMap[regionEn] || regionEn;
    const categories = body.categories || ['culture'];
    const companyEn = body.company?.en || 'Tourism';
    const companyAr = body.company?.ar || 'السياحة';
    const avgVisitMin = body.avg_visit_duration_minutes || body.avg_visit_min || 60;
    const ticketCost = body.ticket_cost_omr || body.ticketCost || 0;
    const crowdLevel = body.crowd_level || body.crowdLevel || 3;
    const recommendedMonths = body.recommended_months || [1, 2, 3, 10, 11, 12];

    const rows = await sql`
      INSERT INTO destinations (id, name_en, name_ar, lat, lng, region_en, region_ar, categories, company_en, company_ar, avg_visit_min, ticket_cost, crowd_level, recommended_months, is_active)
      VALUES (${id}, ${nameEn}, ${nameAr}, ${lat}, ${lng}, ${regionEn}, ${regionAr}, ${categories}, ${companyEn}, ${companyAr}, ${avgVisitMin}, ${ticketCost}, ${crowdLevel}, ${recommendedMonths}, true)
      RETURNING *
    `;

    await sql`
      INSERT INTO audit_log (admin_email, action, target_type, target_id, details)
      VALUES (${'admin'}, ${'destination_created'}, ${'destination'}, ${id}, ${`Created: ${nameEn}`})
    `;

    return NextResponse.json({ success: true, destination: toDestination(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/admin/destinations error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
