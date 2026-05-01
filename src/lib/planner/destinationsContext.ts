// Universal getter — safe to import from both server + client code paths.
// On the server, route handlers should call `withDestinations()` (from
// destinationsContextServer.ts) before invoking the planner engine. On the
// client, this falls back to the static seed array.

import type { Destination } from '@/types/destination';
import { DESTINATIONS as STATIC_DESTINATIONS } from '@/data/destinations';

// A holder we can populate from the server-only module without re-importing
// node:async_hooks here. The server module wires its store into this slot at
// load time.
type Resolver = () => Destination[] | undefined;
const globalSlot = globalThis as unknown as {
  __duroob_destinations_resolver__?: Resolver;
};

export function _registerDestinationsResolver(resolver: Resolver) {
  globalSlot.__duroob_destinations_resolver__ = resolver;
}

export function currentDestinations(): Destination[] {
  const r = globalSlot.__duroob_destinations_resolver__;
  return (r && r()) ?? STATIC_DESTINATIONS;
}
