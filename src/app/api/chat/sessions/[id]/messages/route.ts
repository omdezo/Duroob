import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { runAgent, type AgentMessage } from '@/lib/mcp/agent';
import { chatLimiter, checkRateLimit } from '@/lib/rateLimit';
import { getDb } from '@/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  // Rate limit
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = await checkRateLimit(chatLimiter, ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { content, locale = 'en', history = [] } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Run the agent
    const response = await runAgent(
      content,
      history as AgentMessage[],
      locale,
    );

    // Track chat messages in DB
    const sql = getDb();
    const userMsg = content.slice(0, 200);
    const assistantMsg = response.text.slice(0, 200);
    const hasPlan = !!response.plan;

    // Upsert for user message
    await sql`
      INSERT INTO chat_sessions (id, message_count, has_plan, last_message, created_at, updated_at)
      VALUES (${sessionId}, 1, false, ${userMsg}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        message_count = chat_sessions.message_count + 1,
        last_message = ${userMsg},
        updated_at = NOW()
    `;

    // Upsert for assistant message
    await sql`
      INSERT INTO chat_sessions (id, message_count, has_plan, last_message, created_at, updated_at)
      VALUES (${sessionId}, 1, ${hasPlan}, ${assistantMsg}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        message_count = chat_sessions.message_count + 1,
        has_plan = chat_sessions.has_plan OR ${hasPlan},
        last_message = ${assistantMsg},
        updated_at = NOW()
    `;

    // Persist full chat messages for history
    try {
      await sql`INSERT INTO chat_messages (session_id, role, content) VALUES (${sessionId}, 'user', ${content})`;
      await sql`INSERT INTO chat_messages (session_id, role, content, plan_json) VALUES (${sessionId}, 'assistant', ${response.text}, ${response.plan ? JSON.stringify(response.plan) : null})`;
    } catch {}

    // Track trip if plan was generated
    if (response.plan && response.scores) {
      const duration = response.plan.days.length;
      const tier = response.plan.inputs.budgetTier;
      const regions = [...new Set(response.plan.days.map((d: any) => d.region))];
      const totalCost = response.plan.costBreakdown.grandTotal;
      const safetyScore = response.scores.safety;
      const enjoymentScore = response.scores.enjoyment;
      const overall = response.scores.overall;

      await sql`
        INSERT INTO trip_analytics (duration, tier, regions, total_cost, safety_score, enjoyment_score, overall)
        VALUES (${duration}, ${tier}, ${regions}, ${totalCost}, ${safetyScore}, ${enjoymentScore}, ${String(overall)})
      `;
    }

    // Stream response via SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        send('status', { phase: 'thinking' });

        if (response.parsedInputs) {
          send('parsed_inputs', response.parsedInputs);
        }

        if (response.plan) {
          send('tool_result', {
            tool: 'plan_trip',
            result: { plan: response.plan, scores: response.scores },
          });
        }

        send('text', { content: response.text });
        send('done', { sessionId, type: response.type });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
