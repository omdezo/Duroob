import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Destination } from '@/types/destination';
import { _registerDestinationsResolver } from './destinationsContext';

const store = new AsyncLocalStorage<Destination[]>();

// Wire the server-side store into the universal getter.
_registerDestinationsResolver(() => store.getStore());

/**
 * Run `fn` with `destinations` available to all planner internals via
 * `currentDestinations()`. Outside this scope, `currentDestinations()`
 * falls back to the static seed array.
 */
export async function withDestinations<T>(
  destinations: Destination[],
  fn: () => Promise<T> | T,
): Promise<T> {
  return store.run(destinations, async () => fn());
}
