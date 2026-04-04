# Duroob — Complete System Gaps Audit

> Every gap in every part of the system. No sugar-coating.

---

## 1. User Experience Gaps

### 1.1 No "My Trips" Page
Users can click "Save Trip" in the planner but there's **no page to view their saved trips**. The saved page (`/saved`) only shows favorited destinations from localStorage — not saved itineraries from the database.

### 1.2 Chat History Lost on Reload
Chat conversations are stored in React state only. Close the tab → everything is gone. The `sessionId` is hardcoded as `'local'` — not tied to the user's account. Past conversations can't be viewed.

### 1.3 Saved Destinations Not Synced to Account
The save/heart button stores destination IDs in `localStorage` via Zustand. When a user logs in, their saved destinations don't sync to the database. Switch device → everything is lost.

### 1.4 No Profile/Settings Page
Users can't change their name, password, email, or language preference. No account management at all.

### 1.5 No Forgot Password Flow
If a user forgets their password, there's no recovery mechanism. No email reset, no security questions.

### 1.6 No Shared Trip URLs
Users can copy trip text or print, but can't generate a shareable URL like `/shared/abc123` that others can view.

### 1.7 Planner API Timeout
The planner calls `/api/planner/generate` but has no timeout. If the API hangs, the user stares at "Building your trip..." forever. The client-side fallback is silent — user doesn't know if they got the API result or the local fallback.

### 1.8 No Password Strength Indicator
Registration page only checks length ≥ 6. No visual strength meter, no complexity requirements shown.

### 1.9 Images Could Fail Silently
Homepage uses 8 hardcoded image URLs (Unsplash or local `/images/`). If any image fails to load, there's no fallback placeholder — just a broken layout.

---

## 2. Admin Experience Gaps

### 2.1 Admin APIs Have ZERO Auth Protection
**CRITICAL.** Every `/api/admin/*` endpoint has no session/role check. Any anonymous user can:
- `GET /api/admin/users` → see all emails
- `POST /api/admin/destinations` → add fake destinations
- `DELETE /api/admin/destinations/[id]` → delete real ones
- `GET /api/admin/audit-log` → see all admin actions

The admin layout checks role on the frontend, but the API is wide open.

### 2.2 Can't Change User Roles
Admin users page shows a list but has no edit buttons. Can't promote a user to admin or demote an admin.

### 2.3 Can't Delete Users
No delete button on users. No way to remove spam accounts.

### 2.4 Can't View Individual Chat Conversations
Admin chat page shows session metadata (message count, last message) but can't drill into a session to read the full conversation.

### 2.5 Destination Edit Form Incomplete
The CRUD modal only edits: name, region, lat/lng, cost, crowd, visit duration. Missing: categories, description, company, recommended months, images.

### 2.6 No Data Export
No CSV/JSON export for trips, users, destinations, or audit log.

### 2.7 No Deleted Destinations View
Soft-deleted destinations are hidden. Admin can't see what was deleted or restore them.

### 2.8 Overview Uses Static Data
Admin overview (`/admin/overview`) imports `DESTINATIONS` from the static file, not from the database. If admin adds/removes destinations in DB, the overview count doesn't match.

---

## 3. Backend Gaps

### 3.1 Public API Uses Static File, Not Database
**CRITICAL.** These API routes read from `src/data/destinations.ts` (hardcoded file), NOT the database:
- `GET /api/destinations`
- `GET /api/destinations/[id]`
- `GET /api/search`

If admin creates a destination via `/api/admin/destinations`, it goes into the DB but the public API never sees it.

### 3.2 Planner Engine Uses Static File
`generateItinerary()` imports `DESTINATIONS` from the static file. The engine never queries the database. Admin CRUD changes have zero effect on trip planning.

### 3.3 Trips API Leaks All Users' Data
`GET /api/trips` returns ALL saved trips without filtering by `user_id`. Any authenticated user can see everyone's trip data. `POST /api/trips` accepts `userId` from the request body — a user could save trips under another user's ID.

### 3.4 No Input Sanitization on Registration
Registration only checks email uniqueness and password length. No email format validation, no disposable email blocking.

### 3.5 No Rate Limiting on Most Endpoints
Only the chat endpoint has rate limiting. Login, register, planner generate, and all admin endpoints have zero rate limiting.

### 3.6 adminStore.ts Is Dead Code
After the DB migration, `src/lib/adminStore.ts` is no longer imported by anything. 175 lines of dead code sitting in the repo.

---

## 4. Role-Based Access Gaps

### 4.1 No API-Level Auth on Admin Routes
Frontend checks role. Backend doesn't. A curl command bypasses all protection:
```
curl -X DELETE https://duroob.vercel.app/api/admin/destinations/mct-001
```

### 4.2 No User-Scoped Data
- `GET /api/trips` returns ALL trips, not just the requesting user's
- `GET /api/admin/chat` returns ALL sessions
- Chat sessions use a static `'local'` sessionId, not user-specific

### 4.3 No Middleware Protection
There's no Next.js middleware checking auth on `/admin/*` or `/api/admin/*` routes. Protection is only in the React component.

---

## 5. Hardcoded Gaps

### 5.1 Region Names Hardcoded in Multiple Files
`REGION_AR` map is copy-pasted in at least 6 files:
- `src/lib/mcp/agent.ts`
- `src/lib/mcp/formatters/templateFormatter.ts`
- `src/app/[locale]/chat/page.tsx`
- `src/app/[locale]/planner/page.tsx`
- `src/app/[locale]/admin/destinations/page.tsx`
- `src/app/api/admin/destinations/route.ts`

Should be a single shared constant.

### 5.2 Budget Tiers Hardcoded in UI
Planner wizard shows `~150`, `~350`, `~800 OMR` as hardcoded strings. If the engine thresholds change in `budgetEstimator.ts`, the UI won't update.

### 5.3 Category Names Not Always Translated
Categories show translated names in the planner form (uses `tCat()`) but in some places (destination detail, stop cards) they might still show English.

### 5.4 Static Destination Data Duplicated
Destinations exist in both `src/data/destinations.ts` (static file, 30 entries) and the `destinations` table in Neon (30 entries). Two sources of truth that can diverge.

---

## 6. AI / Chat Gaps

### 6.1 No Persistent Chat History
Messages stored in `useState` only. No DB persistence. The chat API inserts into `chat_sessions` table (session metadata) but individual messages are NOT stored.

### 6.2 Session ID Not User-Specific
All chat requests use `sessionId: 'local'`. If two users chat simultaneously, their session metadata overlaps in the DB.

### 6.3 No Past Conversation Access
No UI to view previous chat sessions. No sidebar showing history like ChatGPT.

### 6.4 Parser Fragile with Edge Cases
- "4-month trip" could parse as `travelMonth: 4` instead of `durationDays: 120`
- "luxury budget 1000 OMR" sets both `budgetTier: luxury` AND `customBudgetOmr: 1000` — conflicting
- Numbers in Arabic (٣، ٤، ٥) not handled

### 6.5 Gemini API Key Exposed in Errors
If Gemini returns an error, the error message could contain the API key or internal details. Error messages are logged to console on the server but could leak.

### 6.6 No Streaming Display
The chat API uses SSE but the frontend doesn't stream tokens — it waits for the full response then displays it all at once. Not a true "typing" experience.

---

## 7. Algorithm / Engine Gaps

### 7.1 Engine Ignores Database
The itinerary engine imports `DESTINATIONS` from the static TypeScript file. All 7 engine modules (`regionAllocator`, `intraRegionRouter`, `scoring`, `budgetEstimator`, `haversine`, `twoOpt`, `itineraryEngine`) use the static array. Admin CRUD changes to the database have zero effect on planning.

### 7.2 Deleted Destinations Still Referenced
If admin soft-deletes a destination via the DB, the planner still uses it because it reads from the static file. Could recommend a closed/removed attraction.

### 7.3 No Real Distance Data
Haversine gives straight-line distance. Mountain roads (Jebel Akhdar) are 2-3x the straight-line distance. No correction factor applied.

### 7.4 Fixed Travel Speed
All travel time calculated at 60 km/h average. Mountain passes, city traffic, and highway driving all get the same speed.

### 7.5 No Destination Photos
Destination data has no image fields. The entire app uses emoji icons for destinations. No real photos in destination cards.

---

## 8. Deployment / Infrastructure Gaps

### 8.1 .env.local Contains Real Credentials
The `.env.local` file has the real Neon database URL, Gemini API key, and NextAuth secret. While `.gitignore` excludes it, if it was ever committed, credentials are in git history.

### 8.2 No Health Check Endpoint
No `/api/health` endpoint to verify the app is running and the database is connected. Monitoring tools can't check status.

### 8.3 No Error Tracking
No Sentry, LogRocket, or similar. Production errors are invisible — only visible in Vercel function logs.

### 8.4 Unused Dependencies
- `drizzle-orm` and `drizzle-kit` installed but not used (using raw `neon()` queries instead)
- `@auth/drizzle-adapter` installed but not used
- `resend` installed but no email sending code
- `recharts` installed but no charts rendered (admin uses CSS bars)
- `@tanstack/react-table` installed but not used

### 8.5 No Database Migrations
Tables were created via a one-off script. No migration system. If schema changes are needed, there's no way to apply them safely.

### 8.6 .env.example Incomplete
Lists `UPSTASH_REDIS_REST_URL`, `R2_*`, `RESEND_API_KEY` as if they're used — they're not. Missing: actual required vars documentation.

---

## Summary by Severity

### Critical (Must Fix)
1. Admin APIs have no auth protection — anyone can CRUD
2. Public API + planner engine use static file, not database
3. Chat history not persisted — lost on reload
4. Trips API returns all users' data without filtering

### High (Should Fix)
5. Saved destinations not synced to user account
6. No "My Trips" page for saved itineraries
7. No middleware auth protection
8. Dead code: adminStore.ts, unused npm packages
9. Region/category maps duplicated across 6+ files

### Medium (Nice to Fix)
10. No user profile/settings page
11. No forgot password flow
12. No data export from admin
13. Destination edit form incomplete (missing categories, description)
14. No rate limiting on most endpoints
15. No health check endpoint
16. Overview uses static data, not DB

### Low (Polish)
17. No shared trip URLs
18. No image fallbacks on homepage
19. Chat parser edge cases
20. Budget tier prices hardcoded in UI
21. No database migration system
22. Unused npm dependencies
