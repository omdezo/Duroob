import type { McpContext, McpToolResult } from '../types';
import type { Category, Region, Destination } from '@/types/destination';

interface SearchDestinationsInput {
  query?: string;
  category?: Category;
  region?: Region;
  maxCost?: number;
  limit?: number;
}

/**
 * Simple fuzzy text match: checks whether every word in the query
 * appears somewhere in the target string (case-insensitive).
 */
function fuzzyMatch(target: string, query: string): boolean {
  const lowerTarget = target.toLowerCase();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((word) => lowerTarget.includes(word));
}

/**
 * Compute a basic relevance score for sorting.
 * - Exact substring match in name scores highest.
 * - Partial word matches score lower.
 */
function relevanceScore(dest: Destination, query: string): number {
  const q = query.toLowerCase();
  let score = 0;

  // Exact substring in English name
  if (dest.name.en.toLowerCase().includes(q)) score += 10;
  // Exact substring in Arabic name
  if (dest.name.ar.includes(query)) score += 10;

  // Word-level match in English
  if (fuzzyMatch(dest.name.en, query)) score += 5;
  // Word-level match in Arabic
  if (fuzzyMatch(dest.name.ar, query)) score += 5;

  // Match in company name
  if (fuzzyMatch(dest.company.en, query)) score += 2;
  if (fuzzyMatch(dest.company.ar, query)) score += 2;

  return score;
}

export function searchDestinations(input: SearchDestinationsInput, ctx: McpContext): McpToolResult {
  const limit = input.limit ?? 10;
  let results = [...ctx.destinations];

  // Filter by category
  if (input.category) {
    results = results.filter((d) => d.categories.includes(input.category!));
  }

  // Filter by region
  if (input.region) {
    results = results.filter((d) => d.region.en === input.region);
  }

  // Filter by max cost
  if (input.maxCost !== undefined) {
    results = results.filter((d) => d.ticket_cost_omr <= input.maxCost!);
  }

  // Fuzzy text search
  if (input.query && input.query.trim()) {
    const query = input.query.trim();

    // Score each destination and filter out zero-relevance results
    const scored = results
      .map((dest) => ({ dest, score: relevanceScore(dest, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    results = scored.map(({ dest }) => dest);
  }

  // Apply limit
  results = results.slice(0, limit);

  return { destinations: results };
}
