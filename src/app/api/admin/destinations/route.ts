import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';

export async function GET() {
  try {
    const sql = getDb();
    const destinations = await sql`SELECT * FROM destinations WHERE is_active = true ORDER BY id`;
    return NextResponse.json({ destinations });
  } catch (error) {
    console.error('[API] GET /api/admin/destinations error:', error);
    return NextResponse.json({ destinations: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id || !body.name?.en || !body.name?.ar) {
      return NextResponse.json({ error: 'id, name.en, name.ar are required' }, { status: 400 });
    }

    const sql = getDb();

    const id = body.id;
    const nameEn = body.name.en;
    const nameAr = body.name.ar;
    const lat = body.lat || 23.5;
    const lng = body.lng || 58.4;
    const regionEn = body.region?.en || 'muscat';
    const regionAr = body.region?.ar || '\u0645\u0633\u0642\u0637';
    const categories = body.categories || ['culture'];
    const companyEn = body.company?.en || 'Tourism';
    const companyAr = body.company?.ar || '\u0627\u0644\u0633\u064a\u0627\u062d\u0629';
    const avgVisitMin = body.avg_visit_duration_minutes || 60;
    const ticketCost = body.ticket_cost_omr || 0;
    const crowdLevel = body.crowd_level || 3;
    const recommendedMonths = body.recommended_months || [1, 2, 3, 10, 11, 12];

    const rows = await sql`
      INSERT INTO destinations (id, name_en, name_ar, lat, lng, region_en, region_ar, categories, company_en, company_ar, avg_visit_min, ticket_cost, crowd_level, recommended_months, is_active)
      VALUES (${id}, ${nameEn}, ${nameAr}, ${lat}, ${lng}, ${regionEn}, ${regionAr}, ${categories}, ${companyEn}, ${companyAr}, ${avgVisitMin}, ${ticketCost}, ${crowdLevel}, ${recommendedMonths}, true)
      RETURNING *
    `;

    await sql`
      INSERT INTO audit_log (admin_email, action, target_type, target_id, details)
      VALUES (${'admin'}, ${'destination_created'}, ${'destination'}, ${id}, ${`Created destination: ${nameEn}`})
    `;

    return NextResponse.json({ success: true, destination: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/admin/destinations error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
