import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { generateItinerary } from '@/lib/planner/itineraryEngine';
import { scorePlan } from '@/lib/planner/tripScorer';
import type { BudgetTier } from '@/types/planner';

const CompareInputsSchema = z.object({
  durationDays: z.number().int().min(1).max(7),
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

const TIERS: BudgetTier[] = ['low', 'medium', 'luxury'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = CompareInputsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const baseInputs = parsed.data;

    const comparisons = TIERS.map((tier) => {
      const inputs = { ...baseInputs, budgetTier: tier };
      const plan = generateItinerary(inputs as Parameters<typeof generateItinerary>[0]);
      const scores = scorePlan(plan);
      return { tier, plan, scores };
    });

    return NextResponse.json({ comparisons });
  } catch (error) {
    console.error('[API] POST /api/planner/compare error:', error);
    return NextResponse.json(
      { error: 'Failed to compare itineraries' },
      { status: 500 },
    );
  }
}
