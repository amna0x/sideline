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

- **Branch:** `chore/auth-middleware-foundation` (PR0 of a 6-PR roadmap)
- **In progress:** server-side auth foundation — Supabase JWT verification middleware, zod validation, express-rate-limit, per-user socket rooms, Vitest + `node --test` test scaffolding. Locked previously open mutation routes (`predictions/submit`, `users PATCH/DELETE`, `vault/redeem`) behind `requireAuth` + `requireSelf`.
- **Next PRs in order:** PR1 avatars + more themes → PR2 OAuth (Google/GitHub) → PR3 friends graph (open DMs by privacy toggle) → PR4 notifications + Web Push → PR5 chat (1:1, profanity-filtered, attachment-ready). Each branched off `master`, one concern per PR.

## Decisions log

_Non-obvious choices that future sessions should not relitigate._

- ESM everywhere (both packages `"type": "module"`); no CommonJS.
- Zustand chosen over Redux/Context for global client state.
- In-memory fallback in `server/db/` so demos work without Supabase env vars.
- Service-role key is server-only — never import under `client/`.
- Adidas card generation uses HTML Canvas (FOUC tradeoff accepted for hackathon).
- Test stacks: Vitest + jsdom (client), `node --test` + supertest (server). No Jest.
- Auth verification on the server uses `supabase.auth.getUser(token)` — no separate JWT lib. Memory mode trusts `x-user-id` header / `user_id` body field for demos only.
- DM model (decided 2026-04-29): open-by-default with a per-user privacy toggle (`open` / `requests` / `friends`); content runs through a profanity filter before persist.

## Open questions / unknowns

- No test framework wired yet — Vitest (client) + Node `node --test` (server) are the leading candidates when this is added.
- DFL live feed not integrated; simulator-only.

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

- _2026-05-24 — Implemented Api-football live scores, Sofascore team logos & player photos resolver, and Gemini/Claude dynamic quiz and player ratings services. verified endpoints and successfully built client._
- _2026-04-29 — PR0 (foundation) merged. PR1 (avatars + 3 more themes) opened: server avatar route w/ MIME+5MB cap, multer, Storage upload via service role, memory-mode data-URL fallback; Avatar+AvatarUpload components w/ initials fallback; Inferno/Cobalt/Solar themes._
- _2026-04-29 — Merged PR1 themes/session/settings-cog. Started PR0 foundation (auth middleware, validation, rate limit, socket auth, tests)._
- _2026-04-28 — Initial CLAUDE.md, .claude/settings.json, CONTEXT.md scaffolded._
