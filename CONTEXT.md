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

- (no active branch — last commit on `master`: `ed0f6ee hello`)
- Next: TBD

## Decisions log

_Non-obvious choices that future sessions should not relitigate._

- ESM everywhere (both packages `"type": "module"`); no CommonJS.
- Zustand chosen over Redux/Context for global client state.
- In-memory fallback in `server/db/` so demos work without Supabase env vars.
- Service-role key is server-only — never import under `client/`.
- Adidas card generation uses HTML Canvas (FOUC tradeoff accepted for hackathon).

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

- _2026-04-28 — Initial CLAUDE.md, .claude/settings.json, CONTEXT.md scaffolded._
