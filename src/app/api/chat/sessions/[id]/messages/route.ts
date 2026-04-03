import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { runAgent, type AgentMessage } from '@/lib/mcp/agent';
import { chatLimiter, checkRateLimit } from '@/lib/rateLimit';
import { trackChatMessage, trackTrip } from '@/lib/adminStore';

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

    // Track in admin store
    trackChatMessage(sessionId, 'user', content, false);
    trackChatMessage(sessionId, 'assistant', response.text.slice(0, 200), !!response.plan);

    // Track trip if plan was generated
    if (response.plan && response.scores) {
      trackTrip({
        duration: response.plan.days.length,
        tier: response.plan.inputs.budgetTier,
        regions: [...new Set(response.plan.days.map(d => d.region))],
        totalCost: response.plan.costBreakdown.grandTotal,
        safetyScore: response.scores.safety,
        enjoymentScore: response.scores.enjoyment,
        overall: response.scores.overall,
      });
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
