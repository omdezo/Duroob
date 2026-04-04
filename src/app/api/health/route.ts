import { getDb } from '@/db';

export async function GET() {
  try {
    const sql = getDb();
    await sql`SELECT 1`;
    return Response.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ status: 'error', db: 'disconnected' }, { status: 500 });
  }
}
