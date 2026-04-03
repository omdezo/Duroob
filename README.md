# دُروب — Duroob | Smart Tourism Platform for Oman

An AI-powered tourism platform for Oman with intelligent trip planning, a conversational chat assistant (Gemini AI), a deterministic itinerary engine, and a full admin dashboard — all bilingual (English + Arabic RTL).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment (optional — app works without it)
cp .env.example .env.local
# Edit .env.local and add your Gemini API key (see below)

# 3. Run development server
npm run dev
# Open http://localhost:3000

# 4. Run tests
npm run test

# 5. Production build
npm run build
npm run start
```

The app auto-redirects to `/en` (English) or `/ar` (Arabic).

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Required for AI chat (get a key at https://aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-api-key

# Auth (optional — app works without these)
NEXTAUTH_SECRET=any-random-string
NEXTAUTH_URL=http://localhost:3000

# Database (optional — app uses static data without this)
DATABASE_URL=postgresql://user:pass@host/duroob

# Rate limiting (optional)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Without any env vars**: The app runs fully client-side with static data. The planner, destinations, saved page, and admin all work. The chat falls back to a smart rule-based engine.

**With `GEMINI_API_KEY`**: The chat uses Gemini 2.5 Flash for natural language understanding and response generation. Recommended model: `gemini-2.5-flash`.

---

## Pages & Routes

| Route | Description |
|---|---|
| `/en` or `/ar` | Home — hero, categories, featured destinations |
| `/en/destinations` | Browse 31 destinations with filters + search |
| `/en/destinations/[id]` | Destination detail with map, info, similar places |
| `/en/planner` | Trip planner — step form, results, scores, comparison |
| `/en/chat` | AI Smart Planner — conversational trip planning |
| `/en/saved` | Saved/favorite destinations |
| `/en/admin` | Admin dashboard (overview, destinations, settings, etc.) |

All routes support both `/en/` and `/ar/` with full RTL Arabic.

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/destinations` | List destinations (filters: category, region, q) |
| GET | `/api/destinations/[id]` | Single destination |
| GET | `/api/search?q=nizwa` | Full-text search |
| POST | `/api/planner/generate` | Generate itinerary (body: PlannerInputs) |
| POST | `/api/planner/compare` | Compare 3 budget tiers |
| GET | `/api/trips` | List saved trips |
| POST | `/api/trips` | Save a trip |
| POST | `/api/chat/sessions/[id]/messages` | Chat message → SSE stream |
| GET | `/api/analytics/trending` | Trending destinations |
| GET | `/api/analytics/recommendations` | Context-based recommendations |

---

## Architecture

```
src/
├── app/
│   ├── [locale]/                  # Pages (SSR/SSG/CSR)
│   │   ├── page.tsx               # Home
│   │   ├── destinations/          # Browse + detail
│   │   ├── planner/               # Trip planner
│   │   ├── chat/                  # AI chat
│   │   ├── saved/                 # Favorites
│   │   └── admin/                 # Dashboard (8 pages)
│   └── api/                       # API routes (10 endpoints)
│
├── components/
│   ├── marketing/                 # Hero, categories, featured, CTA
│   ├── catalogue/                 # Filters, grid, search, save
│   ├── detail/                    # Map, crowd meter, month indicator
│   ├── planner/                   # Form, results, scores, comparison, share
│   ├── chat/                      # (inline in chat page)
│   └── shared/                    # Navbar, mobile drawer, toaster, skeleton, search
│
├── lib/
│   ├── planner/                   # Deterministic engine (7 modules)
│   │   ├── itineraryEngine.ts     # Orchestrator
│   │   ├── regionAllocator.ts     # Phase A: region allocation
│   │   ├── intraRegionRouter.ts   # Phase B: daily scheduling
│   │   ├── scoring.ts             # Multi-objective scoring
│   │   ├── twoOpt.ts              # Route optimization
│   │   ├── budgetEstimator.ts     # Cost + pruning
│   │   ├── haversine.ts           # Distance calculations
│   │   └── tripScorer.ts          # Safety/enjoyment/cost scores
│   │
│   ├── mcp/                       # Agentic AI system
│   │   ├── agent.ts               # Main brain (Gemini + smart fallback)
│   │   ├── registry.ts            # MCP tool registry
│   │   ├── types.ts               # Tool types
│   │   ├── tools/                 # 5 tools (plan, modify, search, recommend, info)
│   │   ├── parsers/               # AI parser + rule parser
│   │   └── formatters/            # AI formatter + template formatter
│   │
│   ├── analytics/                 # Recommendation engine
│   ├── auth.ts                    # NextAuth v5
│   └── rateLimit.ts               # Upstash rate limiter
│
├── db/                            # Drizzle ORM schema + seed
├── store/                         # Zustand (planner + interests)
├── data/destinations.ts           # 31 destinations dataset
├── types/                         # TypeScript types
└── i18n/                          # next-intl config
```

---

## AI Chat System

The chat (`/chat`) uses a layered agentic architecture:

```
User message
    ↓
┌─────────────────────┐
│  Gemini 2.5 Flash   │  ← Understands natural language (EN + AR)
│  (AI brain)         │  ← Extracts intent + entities
│                     │  ← Generates natural responses
└─────────┬───────────┘
          ↓ tool call
┌─────────────────────┐
│  MCP Tools          │  ← plan_trip, search, recommend, info, modify
│  (deterministic)    │  ← Engine runs the actual computation
└─────────┬───────────┘
          ↓ result
┌─────────────────────┐
│  Gemini 2.5 Flash   │  ← Formats result as friendly text
│  (AI formatting)    │
└─────────────────────┘

If Gemini is unavailable:
    → Smart rule-based fallback (not a dumb keyword matcher)
    → Template-based response formatting
    → App still works fully
```

**The AI understands**: natural Arabic (including Gulf dialect), typos, vague requests, follow-up questions, name recognition, and context from conversation history.

---

## Planner Engine

The trip planner is a pure deterministic algorithm — no AI, no randomness, no server calls.

```
generateItinerary(inputs) → ItineraryPlan

Phase A: Region Allocation    → Which regions, how many days
Phase B: Intra-Region Routing → Daily stops, scored + constrained
Phase C: Budget Pruning       → Swap/remove expensive stops
Phase D: Cost Estimation      → Fuel + tickets + food + hotel
```

**Scoring model** (6 weighted components):
- Interest match (30%) — Jaccard similarity with user categories
- Season fit (25%) — visiting in recommended months
- Crowd avoidance (15%) — prefer less crowded
- Cost sensitivity (10%) — prefer affordable
- Route efficiency (10%) — minimize detours
- Category diversity (10%) — variety within a day

**Trip evaluation** (safety / enjoyment / cost efficiency / overall rating).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| State | Zustand + localStorage |
| i18n | next-intl (EN + AR with RTL) |
| Maps | Leaflet + react-leaflet |
| AI | Google Gemini 2.5 Flash |
| DB (ready) | PostgreSQL (Neon) + Drizzle ORM |
| Auth (ready) | NextAuth.js v5 |
| Rate limiting | Upstash Redis |
| Validation | Zod |
| Testing | Vitest (45 unit tests) |
| UI Components | Radix UI (dialog, select, slider, tabs) |
| Icons | Lucide React |

---

## Testing

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui
```

45 unit tests covering:
- Haversine distance calculations
- Itinerary generation (determinism, constraints, diversity)
- Scoring functions (Jaccard, season fit, normalization)
- 2-opt route optimization

---

## Scripts

```bash
npm run dev       # Development server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run test      # Run unit tests
npm run test:ui   # Run tests with UI
```

---

## Project Stats

- **102 source files** (TypeScript/TSX)
- **14 pages** (SSR + SSG + CSR)
- **10 API routes**
- **31 destinations** across 6 regions
- **45 unit tests** (all passing)
- **Bilingual** (English + Arabic RTL)
- **8 admin dashboard pages**
- **5 MCP tools** (plan, modify, search, recommend, travel info)
