# Changelog

Session-level handoff notes for teammates resuming work. Newest at the top.

---

## 2026-05-25 (DB + UI overhaul) — RDS PostgreSQL + major UI fixes (Amna)

### TL;DR

- **AWS RDS PostgreSQL** is now the primary database. Data persists across restarts.
- **Cognito** credentials configured (eu-north-1_OIzHNyguT).
- **Unified DB layer** (`server/db/index.js`) — routes no longer call Supabase/memory directly.
- **Multiple UI fixes** across predictions, vault, squad, leaderboard, and profile.

### Database — AWS RDS

- **New file:** `server/db/postgres.js` — `pg` Pool connecting to RDS.
- **New file:** `server/db/index.js` — unified data access layer. Priority: RDS → Supabase → memory.
- **New file:** `server/db/schema-rds.sql` — clean Postgres schema (no Supabase RLS/auth.users).
- **Refactored routes:** `predictions.js`, `leaderboard.js`, `users.js`, `vault.js` now import from `db/index.js`.
- **RDS instance:** `sideline-db.cticy0mc4izt.eu-north-1.rds.amazonaws.com`, db `sideline`, user `sideline_app`.
- **All 9 tables created and verified.**

### UI Fixes

1. **Squad emoji reactions** — Changed from `fixed inset-0` to `absolute` within the screen container. Emojis now stay within the phone viewport.

2. **Prediction vote count** — Vote count now increments locally when you submit. No longer stays at 0.

3. **Prediction error handling** — No more raw "404" or "already submitted" error toasts. Friendly messages shown inline on the card: "Already predicted — nice one!", "This prediction has closed", etc.

4. **Prediction timer** — Fixed the absurd "1895624M 26S" display. Now shows a live countdown in `M:SS` format. Predictions last 5 minutes (was 1 minute).

5. **Vault cards** — All cards are now the same fixed height (200px). Epic and legendary have animated glow effects. Tapping a card opens a full card-shaped detail popup with item info, cost, and action buttons.

6. **More vault items** — Added 6 new items: First Blood badge, Neon Pulse Frame, Perfect Week badge, Squad MVP badge, Kane Hat-trick Hero, Musiala Magic Moment.

7. **No random drops** — Removed `mintRareDrop` from simulator. Vault items are earned via XP purchase only.

8. **Leaderboard** — Now refreshes every 15s (was 60s) and re-fetches when you submit a prediction. Match leaderboard shows all users who predicted (even with 0 points).

9. **Avatar edit icon** — Moved outside the `overflow-hidden` circle with `z-20`, negative offset, and a border so it's fully visible.

### Env configured

```dotenv
# server/.env
DB_HOST=sideline-db.cticy0mc4izt.eu-north-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=sideline
DB_USER=sideline_app
DB_PASSWORD=<set>
COGNITO_USER_POOL_ID=eu-north-1_OIzHNyguT
COGNITO_CLIENT_ID=439h5apul898inloupl6pm0jsh

# client/.env
VITE_COGNITO_USER_POOL_ID=eu-north-1_OIzHNyguT
VITE_COGNITO_CLIENT_ID=439h5apul898inloupl6pm0jsh
```

### Verification

```bash
# Server tests — all pass
cd server && npm test
# → tests 18, pass 18, fail 0

# Client build — succeeds
cd client && npm run build
# → 905kB bundle, builds in 6.5s

# DB connection verified
# → [postgres] connected to sideline-db.cticy0mc4izt.eu-north-1.rds.amazonaws.com
# → [db] running in "postgres" mode
```

### How to run

Double-click `start.bat` or:
```bash
npm run dev
```
This starts both client (port 5173) and server (port 4000) with `AUTO_SIMULATE=1`.

---

## 2026-05-25 (later) — AWS Cognito auth + share-card API + scoped sockets (Amna)

### TL;DR

- Supabase auth is **gone**. Replaced server- and client-side with **AWS Cognito**.
- New server route `POST /api/share/card` renders the Adidas drop card on **htmlcsstoimage.com** and returns a hosted URL. Canvas is the fallback when the API is down or unconfigured.
- Socket.io match events now broadcast to **per-match rooms** (`match:<id>`) instead of every connected client.
- Cognito User Pool credentials still need to be filled into `server/.env` and `client/.env` to flip auth on; without them the app silently runs guest-only (existing behavior).

Supabase **DB** is still in the codebase as the optional production store — if `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are absent, the server uses in-memory data backed by simulator JSON. For our demos we don't need it.

### Auth — AWS Cognito

**Server:**
- `server/middleware/cognito.js` — wraps `aws-jwt-verify`'s `CognitoJwtVerifier`. Reads `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_TOKEN_USE` (default `id`). Exports `verifyToken(jwt)` and `cognitoReady` flag.
- `server/middleware/auth.js` — `requireAuth`, `optionalAuth`, `requireSelf` now call `verifyToken` instead of `supabase.auth.getUser`. Falls back to `x-user-id` header (memory/guest mode) when Cognito is unconfigured. **No route changes needed** — same `req.user.id` shape.
- `server/socket/handlers.js` — handshake auth uses `verifyToken(socket.handshake.auth.token)`; falls back to `auth.userId` for guests.

**Client:**
- `client/src/lib/cognito.js` — thin promise wrapper around `amazon-cognito-identity-js`. Exposes `signIn`, `signUp`, `confirmSignUp`, `resendConfirmation`, `signOut`, `getCurrentSession`, `getIdToken`, `changePassword`, `deleteCurrentUser`, plus `cognitoReady` and `userPool`.
- `client/src/hooks/useAuth.js` — same external API (`signIn/signUp/signInAsGuest/signOut`) plus new `confirmSignUp` and `resendConfirmation` for the email-code flow.
- `client/src/screens/Login.jsx` — added a `confirm` mode for the verification code step. After successful sign-up, if Cognito didn't auto-confirm, the form switches to the code entry view.
- `client/src/lib/api.js` and `client/src/lib/socket.js` — `authHeader()` and `buildAuth()` now read the Cognito ID token via `getIdToken()`; guest mode falls back to localStorage session.

**Deps added:**
- `server`: `aws-jwt-verify@^5.1.1`
- `client`: `amazon-cognito-identity-js@^6.3.16`

**To turn auth on for a demo:**
1. Create a Cognito User Pool in `us-east-1` (or whatever region) with email as the username attribute and `preferred_username` as a writable attribute.
2. Create an App Client (no client secret — that's the public SPA flow).
3. Fill in:
   ```dotenv
   # server/.env
   COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   COGNITO_CLIENT_ID=YOUR_APP_CLIENT_ID
   COGNITO_TOKEN_USE=id

   # client/.env
   VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   VITE_COGNITO_CLIENT_ID=YOUR_APP_CLIENT_ID
   ```
4. Restart server + client. The "Continue as Guest" button still works without Cognito.

### Real-time events — Socket.io scoped rooms

Previously every emit hit `io.emit(...)`, which broadcast to all connected clients. Now `server/socket/handlers.js` joins each socket to a `match:<id>` room when the client sends `match:join`, and the `emit.matchUpdate / matchEvent / matchPulse / predictionNew` helpers broadcast to that room. Goals, prediction resolutions, leaderboard updates, and vault mints stay global because they're cross-match notifications.

Client unchanged — `useMatch.js` already calls `socket.emit('match:join', matchId)` on mount.

### Shareable drop card — HTML to image

- New service: `server/services/htmlToImage.js`. Provider: **htmlcsstoimage.com**. Reads `HCTI_USER_ID` + `HCTI_API_KEY`. Builds the Adidas drop card markup (mirrors `client/src/lib/canvas.js` styling) and POSTs to `https://hcti.io/v1/image`, returns the hosted PNG URL.
- New route: `server/routes/share.js` → `POST /api/share/card`. Validates body with zod (`player`, `minute`, `team`, `username`, `accuracy`, `rarity`, `is_rare`), uses `optionalAuth` + write rate limit. Returns `{ ok: true, url }` or `503` when keys aren't set or `502` when render fails.
- `client/src/lib/api.js` — `api.shareCard(body)`.
- `client/src/screens/AdidasDrop.jsx` — when the overlay opens it requests both the local canvas blob (used for the in-app preview) and the hosted URL (used by the share button). When sharing, prefers the hosted URL because `navigator.share({ url })` has way better fan-out than a blob (OG previews, Twitter/X cards, iMessage previews). Falls back to the canvas blob if the API returns 503/502.

**To turn the API on:**
1. Sign up at https://htmlcsstoimage.com (free tier: 50 images, paid from ~$14/mo for unlimited).
2. Drop the API ID and key into `server/.env`:
   ```dotenv
   HCTI_USER_ID=...
   HCTI_API_KEY=...
   ```
3. Restart server. The route flips from `503` to `200` automatically.

### What was already there before this session

The Cognito server middleware, client SDK wrapper, socket handshake update, env templates, and HCTI service files were authored in a prior session (likely the one whose chat history vanished). This session: confirmed nothing was missing, wired the client's AdidasDrop overlay to the new endpoint, added `api.shareCard()`, ran the test suite (18/18 pass) and a production client build (succeeds), and documented the whole thing here.

### Verification

```bash
# Server tests — all pass
cd server && npm test
# → tests 18, pass 18, fail 0

# Client build — succeeds (846kB bundle, ~253kB gzipped)
cd client && npm run build
```

The 850kB warning is the same as before (Cognito SDK adds ~80kB gzipped). Code-split-able later if it matters.

### Pick up here

- **Need creds**: Cognito User Pool ID + App Client ID for `server/.env` and `client/.env`. HCTI user ID + API key for `server/.env`.
- Branch is still `chore/auth-middleware-foundation` per `CONTEXT.md`. The Cognito switch is technically PR-scope-creep on that branch — fine for hackathon, worth noting if you split it later.
- Next planned PR per `CONTEXT.md` is **PR1 avatars + more themes**. The avatar upload route in `server/routes/users.js` still calls `supabase.storage` — if you need avatar uploads working without Supabase, swap to S3 (or just keep the data-URL memory-mode fallback that's already there).

---

## 2026-05-25 — API keys wired (Amna)

### What changed

Added live data + AI provider keys to `server/.env` so the live match path in
`server/routes/matches.js` no longer falls back to the simulator on first load.

```dotenv
GEMINI_API_KEY=AIzaSy...                # already there from a prior session
API_FOOTBALL_API_KEY=eb593083269728fadc3ce020593342c0
API_FOOTBALL_HOST=v3.football.api-sports.io
```

`server/.env` is git-ignored, so pull these from the team password vault (or
ask Amna) before running locally.

### How it's consumed

- `server/services/apiFootball.js` reads `API_FOOTBALL_API_KEY` + `API_FOOTBALL_HOST`.
  The service auto-detects RapidAPI vs direct API-Sports by checking whether the
  host string contains `rapidapi`. We're on **direct API-Sports**, so it sends
  `x-apisports-key`.
- `GET /api/matches/live` calls `fetchLiveScores()` first, falls back to Supabase
  (`status='live'`), then to the in-memory `pickLiveMatch()`. No code change was
  needed here.
- `server/services/gemini.js` reads `GEMINI_API_KEY` and is used by
  `GET /api/matches/:id/ratings` for AI-generated player ratings.

### Free-tier constraints to know about

The API-Sports free plan has hard limits we hit while testing:

| Limit | Value |
| --- | --- |
| Daily requests | 100 |
| Seasons accessible | 2022, 2023, 2024 only |
| Disallowed params | `last`, `next` (use `from=YYYY-MM-DD&to=YYYY-MM-DD` instead) |
| Live endpoint | `?live=all&league=78` works, returns `[]` when no Bundesliga match is currently in play |

Implication: live scores will be **empty most of the time** because
Bundesliga only plays a few hours per week. Don't treat empty results as a bug.
For demo days outside match windows, set `AUTO_SIMULATE=1` so the simulator
keeps the UI alive.

If you need to widen the demo to historical fixtures, query season 2023 or 2024
with date ranges. Example that worked during verification:

```bash
curl 'https://v3.football.api-sports.io/fixtures?league=78&season=2023&from=2023-08-01&to=2024-05-30' \
  -H "x-apisports-key: $API_FOOTBALL_API_KEY"
```

### What was tried and abandoned

A RapidAPI key (`fd5e...5967`) was attempted first against
`api-football-v1.p.rapidapi.com`. Even after subscribing to the free tier on
RapidAPI, the gateway kept returning `"You are not subscribed to this API."` —
likely an account/listing mismatch. Switched to a direct API-Sports key from
https://dashboard.api-football.com which authorized cleanly on the first call.
Don't burn time retrying the RapidAPI route unless someone explicitly needs it.

### Verification

```bash
# Status check (account + quota)
curl https://v3.football.api-sports.io/status \
  -H "x-apisports-key: eb593083269728fadc3ce020593342c0"
# → plan: Free, end: 2027-05-24, limit_day: 100

# Bundesliga 2023/24 sample (308 fixtures returned)
curl 'https://v3.football.api-sports.io/fixtures?league=78&season=2023&from=2023-08-01&to=2024-05-30' \
  -H "x-apisports-key: eb593083269728fadc3ce020593342c0"
```

### Pick up here

- Live data path is live. No follow-up needed unless you're extending the
  match-detail screen with stats not currently mapped in
  `mapFixtureToMatch()` (it covers score, minute, status, venue, matchday,
  team logos — but not lineups, events, or stats).
- Active branch is still `chore/auth-middleware-foundation` per
  `CONTEXT.md`. The .env edit shouldn't be committed (it's gitignored), so
  this changelog is the only artifact to land.
- Next planned PR per `CONTEXT.md` is **PR1 avatars + more themes**.
