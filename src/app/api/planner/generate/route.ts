import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { generateItinerary } from '@/lib/planner/itineraryEngine';
import { scorePlan } from '@/lib/planner/tripScorer';
import { getDb } from '@/db';

const PlannerInputsSchema = z.object({
  durationDays: z.number().int().min(1).max(7),
  budgetTier: z.enum(['low', 'medium', 'luxury']),
  customBudgetOmr: z.number().positive().optional(),
  travelMonth: z.number().int().min(1).max(12),
  intensity: z.enum(['relaxed', 'balanced', 'packed']),
  preferredCategories: z.array(
    z.enum(['mountain', 'beach', 'culture', 'desert', 'nature', 'food']),
  ),
  preferredRegions: z
    .array(
      z.enum([
        'muscat',
        'dakhiliya',
        'sharqiya',
        'dhofar',
        'batinah',
        'dhahira',
      ]),
    )
    .optional(),
  budgetAllocation: z
    .object({
      transport: z.number().min(0).max(100),
      accommodation: z.number().min(0).max(100),
      activities: z.number().min(0).max(100),
      safety: z.number().min(0).max(100),
      food: z.number().min(0).max(100),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = PlannerInputsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const inputs = parsed.data;
    const plan = generateItinerary(inputs as Parameters<typeof generateItinerary>[0]);
    const scores = scorePlan(plan);

    // Track for analytics in DB
    try {
      const sql = getDb();
      const duration = plan.days.length;
      const tier = plan.inputs.budgetTier;
      const regions = [...new Set(plan.days.map((d: any) => d.region))];
      const totalCost = plan.costBreakdown.grandTotal;
      const safetyScore = scores.safety;
      const enjoymentScore = scores.enjoyment;
      const overall = scores.overall;

      await sql`
        INSERT INTO trip_analytics (duration, tier, regions, total_cost, safety_score, enjoyment_score, overall)
        VALUES (${duration}, ${tier}, ${regions}, ${totalCost}, ${safetyScore}, ${enjoymentScore}, ${String(overall)})
      `;
    } catch (dbError) {
      // Don't fail the request if analytics tracking fails
      console.error('[API] Failed to track trip analytics:', dbError);
    }

    return NextResponse.json({ plan, scores });
  } catch (error) {
    console.error('[API] POST /api/planner/generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 },
    );
  }
}
