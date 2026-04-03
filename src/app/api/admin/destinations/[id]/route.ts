import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateDestination, deleteDestination, addAuditEntry } from '@/lib/adminStore';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = updateDestination(id, body);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    addAuditEntry({
      admin: 'admin',
      action: 'destination_updated',
      targetType: 'destination',
      targetId: id,
      details: `Updated destination: ${updated.name.en}`,
    });

    return NextResponse.json({ destination: updated });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteDestination(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  addAuditEntry({
    admin: 'admin',
    action: 'destination_deleted',
    targetType: 'destination',
    targetId: id,
    details: `Deleted destination: ${id}`,
  });

  return NextResponse.json({ success: true });
}
