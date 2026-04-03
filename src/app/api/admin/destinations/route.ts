import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDestinations, addDestination, addAuditEntry } from '@/lib/adminStore';

export async function GET() {
  return NextResponse.json({ destinations: getDestinations() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validate required fields
    if (!body.id || !body.name?.en || !body.name?.ar) {
      return NextResponse.json({ error: 'id, name.en, name.ar are required' }, { status: 400 });
    }

    const dest = {
      id: body.id,
      name: { en: body.name.en, ar: body.name.ar },
      lat: body.lat || 23.5,
      lng: body.lng || 58.4,
      region: body.region || { en: 'muscat', ar: '\u0645\u0633\u0642\u0637' },
      categories: body.categories || ['culture'],
      company: body.company || { en: 'Tourism', ar: '\u0627\u0644\u0633\u064a\u0627\u062d\u0629' },
      avg_visit_duration_minutes: body.avg_visit_duration_minutes || 60,
      ticket_cost_omr: body.ticket_cost_omr || 0,
      recommended_months: body.recommended_months || [1,2,3,10,11,12],
      crowd_level: body.crowd_level || 3,
    };

    addDestination(dest as any);
    addAuditEntry({
      admin: 'admin',
      action: 'destination_created',
      targetType: 'destination',
      targetId: dest.id,
      details: `Created destination: ${dest.name.en}`,
    });

    return NextResponse.json({ success: true, destination: dest }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
