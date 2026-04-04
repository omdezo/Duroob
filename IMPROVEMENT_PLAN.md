# Duroob — Definitive Improvement Plan

> Exact files, exact changes, exact order. Based on the current codebase audit.

---

## Phase 1 — Security (CRITICAL — do before any public use)

### 1.1 Create admin auth guard helper

**Create:** `src/lib/requireAdmin.ts`
```typescript
import { auth } from './auth';

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 };
  }
  if ((session.user as any).role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }
  return { session };
}
```

### 1.2 Add auth to ALL admin API routes (6 files, 0 have auth today)

**Files to edit:**
- `src/app/api/admin/users/route.ts` — add `requireAdmin()` to GET
- `src/app/api/admin/audit-log/route.ts` — add to GET
- `src/app/api/admin/chat/route.ts` — already has some auth, verify
- `src/app/api/admin/trips/route.ts` — add to GET
- `src/app/api/admin/destinations/route.ts` — add to GET and POST
- `src/app/api/admin/destinations/[id]/route.ts` — add to PUT and DELETE

**Pattern for each:**
```typescript
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });
  // ... rest of handler
}
```

### 1.3 Scope trips API to current user

**File:** `src/app/api/trips/route.ts`
- GET: Add `WHERE user_id = ${session.user.id}` (requires auth)
- POST: Set `user_id` from session, ignore body `userId`
- Return 401 if no session

### 1.4 Add rate limiting to critical endpoints

**Files to edit:**
- `src/app/api/auth/register/route.ts` — add `apiLimiter` (max 5/min)
- `src/app/api/planner/generate/route.ts` — add `apiLimiter` (max 20/min)
- `src/app/api/planner/compare/route.ts` — add `apiLimiter` (max 10/min)
- All use the existing `checkRateLimit` from `src/lib/rateLimit.ts`

### 1.5 Add email format validation to registration

**File:** `src/app/api/auth/register/route.ts`
- Add: `if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))` → return 400

---

## Phase 2 — Database Consistency (CRITICAL)

### 2.1 Make planner engine accept destinations as parameter

**Current:** `generateItinerary(inputs: PlannerInputs): ItineraryPlan`
**New:** `generateItinerary(inputs: PlannerInputs, destinations: Destination[]): ItineraryPlan`

**Files to change (5 engine files):**

| File | Change |
|---|---|
| `src/lib/planner/itineraryEngine.ts` | Add `destinations` param, pass to sub-functions |
| `src/lib/planner/regionAllocator.ts` | `allocateRegions(inputs, destinations)` — remove `import { DESTINATIONS }` |
| `src/lib/planner/intraRegionRouter.ts` | `buildDayPlans(allocations, inputs, destinations)` — remove import |
| `src/lib/planner/budgetEstimator.ts` | `pruneForBudget(days, inputs, destinations)` — remove import |
| `src/lib/planner/scoring.ts` | Keep as-is (doesn't import DESTINATIONS directly, uses the `ctx` parameter) |

**Key:** The engine becomes a pure function — give it destinations, get a plan. No side-effect imports.

### 2.2 Create DB destinations fetcher

**File:** `src/db/index.ts` — add:
```typescript
export async function getActiveDestinations(): Promise<Destination[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM destinations WHERE is_active = true ORDER BY id`;
  return rows.map(toDestination);
}
```

### 2.3 Update API routes to use DB destinations

**Files to change:**
| File | Current | Change to |
|---|---|---|
| `src/app/api/destinations/route.ts` | imports DESTINATIONS static | `getActiveDestinations()` from DB |
| `src/app/api/destinations/[id]/route.ts` | imports DESTINATIONS static | query DB `WHERE id = $id` |
| `src/app/api/search/route.ts` | imports DESTINATIONS static | query DB with `ILIKE` search |
| `src/app/api/planner/generate/route.ts` | imports `generateItinerary` + DESTINATIONS | `getActiveDestinations()` → pass to engine |
| `src/app/api/planner/compare/route.ts` | imports `generateItinerary` + DESTINATIONS | same pattern |

### 2.4 Update MCP agent to use DB destinations

**File:** `src/lib/mcp/agent.ts`
- Line 471: `destinations: DESTINATIONS` → `destinations: await getActiveDestinations()`
- Make `runAgent()` async (already is)

**File:** `src/lib/mcp/tools/planTrip.ts`
- Replace DESTINATIONS import with `ctx.destinations` (already receives context)

### 2.5 Keep static file for client-side fallback only

**Files that should KEEP static import (client-side only):**
- `src/app/[locale]/planner/page.tsx` — client-side fallback in catch block
- `src/app/[locale]/chat/page.tsx` — client-side fallback
- `src/app/[locale]/saved/page.tsx` — needs destination data for card rendering
- `src/app/[locale]/destinations/page.tsx` — server component, switch to DB
- `src/app/[locale]/destinations/[id]/page.tsx` — server component, switch to DB
- `src/components/marketing/FeaturedDestinations.tsx` — server component, switch to DB
- `src/components/shared/CommandPalette.tsx` — client-side search, keep static
- `src/components/planner/PlannerForm.tsx` — only uses for interest pre-fill, keep static

### 2.6 Update admin overview to use DB

**File:** `src/app/[locale]/admin/overview/page.tsx`
- Replace `import { DESTINATIONS }` with fetch from `/api/admin/destinations`
- Compute counts from API response instead of static array

### 2.7 Delete dead code

**Files to delete:**
- `src/lib/adminStore.ts` — 175 lines, nothing imports it
- `src/lib/recommendations.ts` — duplicate of `src/lib/analytics/recommendations.ts`

---

## Phase 3 — Chat Persistence

### 3.1 Create chat_messages table

```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  plan_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Store messages in DB

**File:** `src/app/api/chat/sessions/[id]/messages/route.ts`
- After response is generated, INSERT both user message and assistant message:
```typescript
await sql`INSERT INTO chat_messages (session_id, role, content) VALUES (${sessionId}, 'user', ${content})`;
await sql`INSERT INTO chat_messages (session_id, role, content, plan_json) VALUES (${sessionId}, 'assistant', ${response.text}, ${response.plan ? JSON.stringify(response.plan) : null})`;
```

### 3.3 User-specific session IDs

**File:** `src/app/[locale]/chat/page.tsx`
- Generate unique sessionId: `const [sessionId] = useState(() => 'chat-' + Date.now())`
- If user is logged in, prefix with user ID
- Pass sessionId in API call instead of hardcoded `'local'`

### 3.4 Load previous messages API

**Create:** `src/app/api/chat/sessions/[id]/route.ts`
```typescript
export async function GET(req, { params }) {
  const { id } = await params;
  const sql = getDb();
  const messages = await sql`SELECT * FROM chat_messages WHERE session_id = ${id} ORDER BY created_at`;
  return NextResponse.json({ messages });
}
```

### 3.5 Chat history list API

**Update:** `src/app/api/admin/chat/route.ts` (already exists)
- Also create: `src/app/api/chat/sessions/route.ts` for user-facing history
- Filter by user email from session

---

## Phase 4 — User Features

### 4.1 My Trips page

**Create:** `src/app/[locale]/trips/page.tsx`
- Fetch `GET /api/trips` (now filtered by user from Phase 1.3)
- Show cards: trip title, date, day count, cost, safety/enjoyment scores
- Click card → navigate to `/planner` with plan loaded from DB
- Empty state: "No saved trips yet. Plan a trip to get started."

### 4.2 Sync saved destinations to account

**Create:** `src/app/api/interests/route.ts`
```typescript
GET  → SELECT destination_id FROM saved_interests WHERE user_id = $userId
POST → INSERT INTO saved_interests (user_id, destination_id) ON CONFLICT DO NOTHING
DELETE → DELETE FROM saved_interests WHERE user_id = $userId AND destination_id = $destId
```

**Need table:**
```sql
CREATE TABLE IF NOT EXISTS saved_interests (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  destination_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, destination_id)
);
```

**File:** `src/store/interestStore.ts`
- On hydration: if user is logged in, fetch from DB and merge with localStorage
- On toggle: update both localStorage AND call POST/DELETE API

### 4.3 User profile page

**Create:** `src/app/[locale]/profile/page.tsx`
- Show: name, email, role, locale, joined date
- Editable: name, password
- Calls: `PUT /api/user/profile`

**Create:** `src/app/api/user/profile/route.ts`
- PUT: Update name and/or password in users table

### 4.4 Add "Trips" to navbar

**File:** `src/components/shared/Navbar.tsx`
- Add link: `{ href: /${locale}/trips, label: 'My Trips', icon: <Map /> }`
- Only show if user is authenticated

---

## Phase 5 — Admin Improvements

### 5.1 User role management

**Create:** `src/app/api/admin/users/[id]/route.ts`
```typescript
PUT  → UPDATE users SET role = $role WHERE id = $id + audit log
DELETE → DELETE FROM users WHERE id = $id + audit log (except self)
```

**File:** `src/app/[locale]/admin/users/page.tsx`
- Add role dropdown per user row
- Add delete button (with confirmation)
- Disable actions on own account

### 5.2 View chat conversations

**Create:** `src/app/api/admin/chat/[id]/route.ts`
```typescript
GET → SELECT * FROM chat_messages WHERE session_id = $id ORDER BY created_at
```

**File:** `src/app/[locale]/admin/chat/page.tsx`
- Click session row → expand/modal showing all messages
- Show user messages (right) and assistant messages (left)
- Show plan cards inline

### 5.3 Complete destination edit form

**File:** `src/app/[locale]/admin/destinations/page.tsx`
- Add to modal form:
  - Categories: 6 checkboxes (mountain, beach, culture, desert, nature, food)
  - Description EN/AR: textareas
  - Company EN/AR: text inputs
  - Recommended months: 12 toggle buttons
- Update POST/PUT API bodies to include new fields

### 5.4 Restore deleted destinations

**File:** `src/app/[locale]/admin/destinations/page.tsx`
- Add toggle: "Show deleted" — fetches `WHERE is_active = false`
- Show restore button on deleted items
- Calls: `PUT /api/admin/destinations/[id]` with `{ is_active: true }`

### 5.5 Data export

**Create:** `src/app/api/admin/export/route.ts`
```typescript
GET ?type=destinations → CSV of all destinations
GET ?type=trips → CSV of all trip analytics
GET ?type=users → CSV of all users (no passwords)
GET ?type=audit → CSV of audit log
```

---

## Phase 6 — AI Improvements

### 6.1 True streaming in chat

**File:** `src/app/[locale]/chat/page.tsx`
- Currently waits for full SSE then displays all at once
- Change: update message content progressively as `text_delta` events arrive
- Show cursor/blinking while streaming

### 6.2 Improve parser edge cases

**File:** `src/lib/mcp/agent.ts` (smartFallback function)
- Handle Arabic numerals: ٣ → 3, ٤ → 4
- Handle conflicting inputs: "luxury 1000 OMR" → use customBudgetOmr, ignore tier
- Handle "4-month trip" → ask for clarification, don't parse as month 4
- Handle compound requests: "3 days Muscat then 2 days Dhofar" → 5 days, 2 regions

### 6.3 Gemini error handling

**File:** `src/lib/mcp/agent.ts` (tryGemini function)
- Add 10-second timeout on Gemini call
- If rate limited, return specific message: "AI is busy, using smart planner"
- Never expose API key in error messages

---

## Phase 7 — Shared Constants & Cleanup

### 7.1 Create shared constants file

**Create:** `src/lib/constants.ts`
```typescript
export const REGION_NAMES: Record<string, { en: string; ar: string }> = {
  muscat: { en: 'Muscat', ar: 'مسقط' },
  dakhiliya: { en: 'Dakhiliya', ar: 'الداخلية' },
  // ...
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  mountain: '⛰️', beach: '🏖️', culture: '🕌',
  desert: '🏜️', nature: '🌿', food: '🍽️',
};
```

**Files to update (replace local maps):**
- `src/app/[locale]/chat/page.tsx` — line 19 `RA` map
- `src/app/[locale]/admin/destinations/page.tsx` — line 7 `REGION_AR`
- `src/app/[locale]/admin/overview/page.tsx` — `REGION_AR` map
- `src/lib/mcp/formatters/templateFormatter.ts` — `REGION_AR` map
- `src/app/api/admin/destinations/route.ts` — `regionArMap`

### 7.2 Remove unused packages

```bash
npm uninstall drizzle-kit @auth/drizzle-adapter resend recharts @tanstack/react-table
```
Keep `drizzle-orm` (imported in 2 places — check if actually used or just leftover).

### 7.3 Delete dead files

```bash
rm src/lib/adminStore.ts
rm src/lib/recommendations.ts  # duplicate of analytics/recommendations.ts
```

### 7.4 Fix .env.example

**File:** `.env.example` — rewrite to only list actually needed vars:
```env
# Required
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your-key-from-aistudio.google.com
NEXTAUTH_SECRET=any-random-string-here
NEXTAUTH_URL=http://localhost:3000

# Optional (app works without these)
# UPSTASH_REDIS_REST_URL=     # For rate limiting
# UPSTASH_REDIS_REST_TOKEN=   # For rate limiting
```

### 7.5 Add health check

**Create:** `src/app/api/health/route.ts`
```typescript
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
```

---

## Phase 8 — Destination Images

### 8.1 Add image URLs to destinations table

```sql
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### 8.2 Seed with Unsplash Oman images

Update each destination with a relevant Unsplash URL.

### 8.3 Show images in UI

**Files to update:**
- `src/components/marketing/DestinationCard.tsx` — replace emoji header with `<img>`
- `src/app/[locale]/destinations/[id]/page.tsx` — show hero image
- `src/components/marketing/FeaturedDestinations.tsx` — show images

---

## Implementation Order

```
WEEK 1 (Security + DB — MUST DO)
├── Day 1: Phase 1.1-1.2 — Admin auth guard (all 6 API routes)
├── Day 1: Phase 1.3 — Scope trips to user
├── Day 1: Phase 1.4-1.5 — Rate limiting + email validation
├── Day 2: Phase 2.1 — Refactor engine to accept destinations param
├── Day 2: Phase 2.2-2.3 — DB fetcher + update public API routes
├── Day 3: Phase 2.4-2.6 — MCP agent + admin overview from DB
└── Day 3: Phase 2.7 — Delete dead code

WEEK 2 (Chat + User features)
├── Day 4: Phase 3.1-3.2 — Chat messages table + store in DB
├── Day 4: Phase 3.3-3.5 — User-specific sessions + history API
├── Day 5: Phase 4.1 — My Trips page
├── Day 5: Phase 4.2 — Sync saved destinations
└── Day 6: Phase 4.3-4.4 — Profile page + navbar update

WEEK 3 (Admin + AI + Polish)
├── Day 7: Phase 5.1-5.2 — User roles + chat viewer
├── Day 7: Phase 5.3-5.4 — Complete edit form + restore deleted
├── Day 8: Phase 6.1-6.3 — Streaming + parser fixes + error handling
├── Day 8: Phase 5.5 — Data export
└── Day 9: Phase 7 + Phase 8 — Constants, cleanup, images, health check
```

### Files Changed Per Phase

| Phase | New Files | Edited Files | Deleted Files |
|-------|-----------|-------------|---------------|
| 1. Security | 1 | 8 | 0 |
| 2. DB Consistency | 0 | 12 | 2 |
| 3. Chat Persistence | 2 | 3 | 0 |
| 4. User Features | 4 | 3 | 0 |
| 5. Admin Improvements | 3 | 3 | 0 |
| 6. AI Improvements | 0 | 2 | 0 |
| 7. Cleanup | 2 | 6 | 2 |
| 8. Images | 0 | 4 | 0 |
| **Total** | **12** | **41** | **4** |
