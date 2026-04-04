import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';
import { requireAdmin } from '@/lib/requireAdmin';

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const check = await requireAdmin();
    if ('error' in check && check.error instanceof NextResponse) return check.error;

    const { id } = await params;
    const body = await req.json();
    const sql = getDb();

    const nameEn = body.name?.en ?? body.nameEn ?? null;
    const nameAr = body.name?.ar ?? body.nameAr ?? null;
    const lat = body.lat ?? null;
    const lng = body.lng ?? null;
    const regionEn = body.region?.en ?? body.region ?? null;
    const regionAr = body.region?.ar ?? null;
    const categories = body.categories ?? null;
    const companyEn = body.company?.en ?? null;
    const companyAr = body.company?.ar ?? null;
    const avgVisitMin = body.avg_visit_duration_minutes ?? body.visitMin ?? null;
    const ticketCost = body.ticket_cost_omr ?? body.ticketCost ?? null;
    const crowdLevel = body.crowd_level ?? body.crowdLevel ?? null;
    const recommendedMonths = body.recommended_months ?? null;

    const rows = await sql`
      UPDATE destinations SET
        name_en = COALESCE(${nameEn}, name_en),
        name_ar = COALESCE(${nameAr}, name_ar),
        lat = COALESCE(${lat}, lat),
        lng = COALESCE(${lng}, lng),
        region_en = COALESCE(${regionEn}, region_en),
        region_ar = COALESCE(${regionAr}, region_ar),
        categories = COALESCE(${categories}, categories),
        company_en = COALESCE(${companyEn}, company_en),
        company_ar = COALESCE(${companyAr}, company_ar),
        avg_visit_min = COALESCE(${avgVisitMin}, avg_visit_min),
        ticket_cost = COALESCE(${ticketCost}, ticket_cost),
        crowd_level = COALESCE(${crowdLevel}, crowd_level),
        recommended_months = COALESCE(${recommendedMonths}, recommended_months),
        updated_at = NOW()
      WHERE id = ${id} AND is_active = true
      RETURNING *
    `;

    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await sql`
      INSERT INTO audit_log (admin_email, action, target_type, target_id, details)
      VALUES (${'admin'}, ${'destination_updated'}, ${'destination'}, ${id}, ${`Updated: ${rows[0].name_en}`})
    `;

    return NextResponse.json({ destination: toDestination(rows[0]) });
  } catch (error) {
    console.error('[API] PUT error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const check = await requireAdmin();
    if ('error' in check && check.error instanceof NextResponse) return check.error;

    const { id } = await params;
    const sql = getDb();

    const rows = await sql`
      UPDATE destinations SET is_active = false, updated_at = NOW()
      WHERE id = ${id} AND is_active = true
      RETURNING id
    `;

    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await sql`
      INSERT INTO audit_log (admin_email, action, target_type, target_id, details)
      VALUES (${'admin'}, ${'destination_deleted'}, ${'destination'}, ${id}, ${`Deleted: ${id}`})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
