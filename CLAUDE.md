# Sideline — Claude Project Guide

Real-time second-screen companion for Bundesliga matches. Mobile-first PWA.

## First action every session

**Always begin by answering: "What are the recent changes my teammate made?"**

Do this before any other work — even if the user's first message is a feature request. Run:

```bash
git fetch --all --prune
git log --all --no-merges --since="14 days ago" --pretty=format:"%h %an %ar — %s"
git log origin/master..HEAD --oneline   # local commits not yet pushed
git log HEAD..origin/master --oneline   # remote commits not yet pulled
git status
```

Then read every file changed in those commits (use `git show --stat <sha>` per commit, then `Read` each touched file at HEAD). Summarize: who changed what, why (from commit messages), and which areas are now hot. Only after that summary, proceed with the user's actual request.

If `CONTEXT.md` exists at repo root, read it first — it carries state forward from prior sessions that compacted or vanished.

## Tech stack

**Client** (`client/`)
- React 18 + Vite 5 (ESM, `"type": "module"`)
- Tailwind CSS 3 + PostCSS
- Zustand (state), React Router 6 (routing)
- Framer Motion (animations), Recharts (charts)
- socket.io-client 4 (real-time)
- @supabase/supabase-js (auth + persistence)
- Mobile-first: design target is 390px viewport

**Server** (`server/`)
- Node + Express 4 + Socket.io 4 (ESM)
- Supabase (Postgres + Auth + Storage) via `@supabase/supabase-js`
- In-memory fallback when Supabase env vars absent (`AUTO_SIMULATE=1` runs a JSON-replay simulator at 30× speed)

**Shared**
- Node ≥ 18 (for native `fetch`, `--watch`)
- npm workspaces-ish via `npm --prefix client|server`
- No TypeScript yet (plain JS + JSDoc when types help)

## Coding style

- **ES modules everywhere** — `import`/`export`, never `require`. Both packages have `"type": "module"`.
- **No new comments unless WHY is non-obvious.** Identifier names should explain WHAT. Don't restate code.
- **Functional React** — hooks only, no classes. Custom hooks live in `client/src/hooks/`.
- **Zustand for global state**, `useState`/`useReducer` for local. No Redux, no Context-as-store.
- **Tailwind utilities first**, custom CSS only for things Tailwind can't express. No CSS-in-JS.
- **Two-space indent**, single quotes, no semicolons-optional debate — match existing files.
- **Server routes** in `server/routes/<resource>.js`, mounted in `index.js`. One Express router per resource.
- **Socket events** declared in `server/socket/` with emit helpers — never call `io.emit` from random places.
- **Env vars**: client must use `VITE_` prefix. Service-role key is **server-only** — never import in client.
- **Error handling at boundaries only** — request handlers, socket handlers, `lib/api.js` fetch wrapper. Don't wrap internal calls in try/catch unless you have something to do with the error.
- **No premature abstraction.** Three similar lines beats a wrong helper.

## Branch naming

`<type>/<short-kebab-description>` — e.g. `feat/leaderboard-realtime`, `fix/socket-reconnect-loop`.

| Prefix     | Use for                                  |
|------------|------------------------------------------|
| `feat/`    | new feature or screen                    |
| `fix/`     | bug fix                                  |
| `chore/`   | tooling, deps, config, no runtime change |
| `refactor/`| internal restructure, no behavior change |
| `docs/`    | README/CLAUDE.md/comments only           |
| `wip/`     | scratch — never merged                   |

One concern per branch. If you find yourself writing "and also" in the PR title, split it.

## Commit + push workflow

1. **Run tests before every commit.** Currently no test suite is wired — when one is added, this rule means `npm test` (or the per-package equivalent) must pass locally before `git commit`. Until then, at minimum: `npm --prefix client run build` must succeed, and `npm --prefix server run dev` must boot without throwing on the touched routes.
2. **Never push directly to `master`.** Always branch → commit → push branch → open PR. `master` is updated only via merged PRs.
3. **Never `--force` push to `master`** under any circumstance. Force-push to your own feature branch is fine if you're the only one on it.
4. **Never `--no-verify`.** If a hook fails, fix the underlying issue.
5. Commit messages: imperative mood, ≤ 72 char subject. Body explains *why* if non-obvious. Reference issue/PR when relevant.

## Layout reminders

```
client/src/
  screens/      Login, Home, Predict, Vault, Leaderboard, Profile, Quiz, Settings, AdidasDrop overlay
  components/   Layout (TopBar + BottomNav), MatchHero, PredictionCard, VaultCard, LeaderboardRow
  hooks/        useAuth, useSocket, useMatch, usePredictions, useVault
  lib/          supabase, api (auth-injecting fetch), socket, canvas (Adidas card generator)
  store/        Zustand store: user, match, points, pendingDrop, toast

server/
  routes/       matches, predictions, users, vault, leaderboard, quiz
  socket/       handlers + emit helpers
  simulator/    engine.js, match_demo.json
  db/           supabase admin client, in-memory fallback, schema.sql, seed.json, seed.js
```

## Things to never do

- Commit `.env` files or service-role keys.
- Import `SUPABASE_SERVICE_ROLE_KEY` anywhere under `client/`.
- Add a comment that just restates the next line of code.
- Create new top-level folders without flagging it.
- Run destructive git commands (`reset --hard`, `branch -D`, `push --force`) without explicit user OK.

## When the user asks for a feature

1. Confirm which package(s) it touches (client / server / both).
2. If real-time, identify the socket event(s) needed and add to the table in `README.md`.
3. If persistent, check `server/db/schema.sql` first — extend schema before writing routes.
4. Build → run locally → verify in browser at 390px width before reporting done.
