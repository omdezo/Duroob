import type { Destination, Category, Region } from '@/types/destination';

export interface FilterState {
  category: Category | '';
  region: Region | '';
  season: string; // month number as string, or ''
  sortBy: 'crowd' | 'cost' | '';
  sortDir: 'asc' | 'desc';
}

export function filterDestinations(
  destinations: Destination[],
  filters: FilterState
): Destination[] {
  let result = [...destinations];

  if (filters.category) {
    result = result.filter((d) => d.categories.includes(filters.category as Category));
  }

  if (filters.region) {
    result = result.filter((d) => d.region.en === filters.region);
  }

  if (filters.season) {
    const month = parseInt(filters.season, 10);
    result = result.filter((d) => d.recommended_months.includes(month as 1));
  }

  if (filters.sortBy === 'crowd') {
    result.sort((a, b) =>
      filters.sortDir === 'asc'
        ? a.crowd_level - b.crowd_level
        : b.crowd_level - a.crowd_level
    );
  } else if (filters.sortBy === 'cost') {
    result.sort((a, b) =>
      filters.sortDir === 'asc'
        ? a.ticket_cost_omr - b.ticket_cost_omr
        : b.ticket_cost_omr - a.ticket_cost_omr
    );
  }

  return result;
}

export function parseFiltersFromSearchParams(params: URLSearchParams): FilterState {
  return {
    category: (params.get('category') as Category) || '',
    region: (params.get('region') as Region) || '',
    season: params.get('season') || '',
    sortBy: (params.get('sortBy') as 'crowd' | 'cost') || '',
    sortDir: (params.get('sortDir') as 'asc' | 'desc') || 'asc',
  };
}

export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.region) params.set('region', filters.region);
  if (filters.season) params.set('season', filters.season);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortDir) params.set('sortDir', filters.sortDir);
  return params;
}
