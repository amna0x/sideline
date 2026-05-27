# Session Context

Persistent state between Claude sessions. When a chat compacts or vanishes, this file is the recovery point. **Update at end of every meaningful session.**

Claude reads this file at start of every session (per `CLAUDE.md` first-action rule).

---

## Project snapshot

- **Repo:** `sideline` — real-time Bundesliga second-screen companion (PWA).
- **Stack:** React 18 + Vite (client), Node + Express + Socket.io (server), Supabase persistence, in-memory fallback for demos.
- **Branch model:** feature branches → PR → `master`. Never push to `master` directly.
- **Currently:** hackathon-stage codebase, no test suite wired yet, simulator replays Dortmund vs Bayern at 30× speed when `AUTO_SIMULATE=1`.

## Active work

_What is the current focus? Update this each session._

- **Branch:** `chore/auth-middleware-foundation` (extended with RDS + UI fixes)
- **In progress:** AWS RDS PostgreSQL connected as primary database. Cognito auth configured. Major UI fixes: prediction cards (error handling, vote count, 5-min timer), vault cards (expandable detail popup, epic/legendary glow effects, more items), squad emoji reactions contained to screen, leaderboard updates after predictions, avatar edit icon visibility. Squad privacy and profile/vault visual consistency fixes are in the current dirty tree.
- **Completed this session:** Unified DB layer (`server/db/index.js`) with priority: RDS → Supabase → memory. Schema deployed to RDS (`eu-north-1`). All routes refactored to use unified layer. 18/18 tests pass.
- **Next:** PR2 OAuth (Google/GitHub via Cognito) → PR3 friends graph → PR4 notifications → PR5 chat.

## Decisions log

_Non-obvious choices that future sessions should not relitigate._

- ESM everywhere (both packages `"type": "module"`); no CommonJS.
- Zustand chosen over Redux/Context for global client state.
- In-memory fallback in `server/db/` so demos work without any cloud services.
- Service-role key is server-only — never import under `client/`.
- Adidas card generation uses HTML Canvas (FOUC tradeoff accepted for hackathon).
- Test stacks: Vitest + jsdom (client), `node --test` + supertest (server). No Jest.
- Auth verification on the server uses AWS Cognito (`aws-jwt-verify`). Memory mode trusts `x-user-id` header for demos only.
- DM model (decided 2026-04-29): open-by-default with a per-user privacy toggle (`open` / `requests` / `friends`); content runs through a profanity filter before persist.
- **Database priority (decided 2026-05-25):** RDS PostgreSQL (`DB_HOST`) → Supabase (`SUPABASE_URL`) → in-memory. Unified access via `server/db/index.js`.
- **AWS region: eu-north-1 (Stockholm)** — all services (RDS, Cognito, S3) in this region.
- **Prediction windows: 5 minutes** — predictions close 5 min after opening, not 1 min.
- **No random vault drops** — items are earned via XP purchase only, not randomly minted on goals.

## Open questions / unknowns

- DFL live feed not integrated; simulator-only.
- S3 avatar uploads not yet wired (using data-URL in DB for now — works fine for hackathon).

## Collaborators

- **Me (owner):** Amna (`Amna` in git config).
- **Teammate(s):** _add names + areas of focus when known._

## How to resume after a vanished session

1. Read this file top-to-bottom.
2. Run the "first action" block from `CLAUDE.md` (git fetch, log, status, read changed files).
3. Compare what `git log` shows against the **Active work** section above — reconcile drift.
4. Update this file before ending the session: bump **Active work**, append to **Decisions log** if anything new was settled.

## Session log

_Append a one-liner per session. Keep newest at top. Trim entries older than ~30 days._

- _2026-05-27 (admin demo) — Added an admin-only demo start/stop flow that replays the match simulator, emits scripted squad chat/reaction events, triggers a demo Adidas drop overlay, and awards demo XP from Settings > Admin._

- _2026-05-27 (squad chat) — Squad member strip now renders all members in a stable role/join order; chat avatars show at the start of each speaker block; timestamps only show on the latest message in each consecutive block._

- _2026-05-27 (mobile nav) — Bottom nav now renders through a body portal so transformed route/page wrappers cannot make it scroll with content; safe-area bottom spacing preserves room above the fixed nav._

- _2026-05-27 (chat themes) — Squad chat messages now show compact local timestamps; Spiderverse display name changed to Multiverse; added Fight King, Marple, Jade Horizon, Aurora Blossom, Neon Pulse, and Liquid Glass themes._

- _2026-05-27 (theme UX) — Settings theme picker changed from a card grid to an iOS-style dropdown; Liquid Glass now keeps the football field background layer at the default opacity._

- _2026-05-27 (privacy/profile UI) — Private squads are filtered from room lists server/client-side and refresh via `squad:rooms_changed`; private invite codes are admin-only unless invite sharing is enabled; profile private squad label is `PRIVATE`; profile cards/badges now reuse vault visuals/effects; theme contrast overrides tightened._

- _2026-05-25 (DB+UI) — AWS RDS PostgreSQL connected (eu-north-1). Unified DB layer. Cognito configured. UI fixes: prediction error handling, vault card detail popup, emoji containment, leaderboard refresh, avatar edit icon. See `CHANGELOG.md`._
- _2026-05-25 (later) — AWS Cognito replaces Supabase auth (server middleware + client SDK + socket handshake). New `POST /api/share/card` via htmlcsstoimage.com. Socket emits scoped to `match:<id>` rooms. Tests 18/18 pass, client builds. Awaiting Cognito + HCTI creds. See `CHANGELOG.md`._
- _2026-05-25 — API-Football direct (api-sports.io) key + Gemini key wired into `server/.env`. RapidAPI route abandoned. Free plan caps: 100 req/day, seasons 2022-2024, no last/next params. See `CHANGELOG.md` for full handoff._
- _2026-04-29 — PR0 (foundation) merged. PR1 (avatars + 3 more themes) opened: server avatar route w/ MIME+5MB cap, multer, Storage upload via service role, memory-mode data-URL fallback; Avatar+AvatarUpload components w/ initials fallback; Inferno/Cobalt/Solar themes._
- _2026-04-29 — Merged PR1 themes/session/settings-cog. Started PR0 foundation (auth middleware, validation, rate limit, socket auth, tests)._
- _2026-04-28 — Initial CLAUDE.md, .claude/settings.json, CONTEXT.md scaffolded._
