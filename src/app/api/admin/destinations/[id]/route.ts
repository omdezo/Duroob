import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const sql = getDb();

    // Build SET clause from body fields
    const nameEn = body.name?.en;
    const nameAr = body.name?.ar;
    const lat = body.lat;
    const lng = body.lng;
    const regionEn = body.region?.en;
    const regionAr = body.region?.ar;
    const categories = body.categories;
    const companyEn = body.company?.en;
    const companyAr = body.company?.ar;
    const avgVisitMin = body.avg_visit_duration_minutes;
    const ticketCost = body.ticket_cost_omr;
    const crowdLevel = body.crowd_level;
    const recommendedMonths = body.recommended_months;

    const rows = await sql`
      UPDATE destinations SET
        name_en = COALESCE(${nameEn ?? null}, name_en),
        name_ar = COALESCE(${nameAr ?? null}, name_ar),
        lat = COALESCE(${lat ?? null}, lat),
        lng = COALESCE(${lng ?? null}, lng),
        region_en = COALESCE(${regionEn ?? null}, region_en),
        region_ar = COALESCE(${regionAr ?? null}, region_ar),
        categories = COALESCE(${categories ?? null}, categories),
        company_en = COALESCE(${companyEn ?? null}, company_en),
        company_ar = COALESCE(${companyAr ?? null}, company_ar),
        avg_visit_min = COALESCE(${avgVisitMin ?? null}, avg_visit_min),
        ticket_cost = COALESCE(${ticketCost ?? null}, ticket_cost),
        crowd_level = COALESCE(${crowdLevel ?? null}, crowd_level),
        recommended_months = COALESCE(${recommendedMonths ?? null}, recommended_months),
        updated_at = NOW()
      WHERE id = ${id} AND is_active = true
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await sql`
      INSERT INTO audit_log (admin_email, action, target_type, target_id, details)
      VALUES (${'admin'}, ${'destination_updated'}, ${'destination'}, ${id}, ${`Updated destination: ${rows[0].name_en}`})
    `;

    return NextResponse.json({ destination: rows[0] });
  } catch (error) {
    console.error('[API] PUT /api/admin/destinations/[id] error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();

    const rows = await sql`
      UPDATE destinations SET is_active = false, updated_at = NOW()
      WHERE id = ${id} AND is_active = true
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await sql`
      INSERT INTO audit_log (admin_email, action, target_type, target_id, details)
      VALUES (${'admin'}, ${'destination_deleted'}, ${'destination'}, ${id}, ${`Deleted destination: ${id}`})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/admin/destinations/[id] error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
