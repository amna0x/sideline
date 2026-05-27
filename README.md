# Sideline — Real-time Second-Screen for Bundesliga

Sideline is a mobile-first PWA that turns every Bundesliga match into an interactive second-screen experience: live match events, predictions, collectible vault items, and realtime leaderboards — built for demos and hackathons.

Badges: [Demo-ready] • [Mobile-first] • [React] • [Node]

Highlights
- Live match simulator for reproducible demos (30× speed)
- Real-time events via Socket.io (matches, predictions, leaderboard, vault)
- Collectible Vault system with minting hooks for special events
- Mobile-first UI (target: 390px) built with React + Tailwind

Quick Links
- Code: [client](client/) • [server](server/)
- Simulator timeline: `server/simulator/match_demo.json`
- DB schema: `server/db/schema.sql`

Screenshots

Add app screenshots to `client/public/screenshots/` (recommended) or update the paths below. Example gallery (drop your images at the paths shown):

<p align="center">
  <img src="client/public/screenshots/screenshot1.png" alt="Splash" width="240" />
  <img src="client/public/screenshots/screenshot2.png" alt="Login" width="240" />
  <img src="client/public/screenshots/screenshot3.png" alt="Home" width="240" />
  <img src="client/public/screenshots/screenshot4.png" alt="Squad chat" width="240" />
  <img src="client/public/screenshots/screenshot5.png" alt="Pulse" width="240" />
</p>

Tip: optimize screenshots (png/jpg/webp) for the web before adding to keep the README lightweight.

Tech Stack
- Frontend: React 18, Vite, Tailwind CSS, Zustand
- Backend: Node 18+, Express 4, Socket.io 4
- Persistence: Supabase (production) with RDS/Postgres + in-memory fallback for demos

Getting Started (Dev)

Prereqs
- Node >= 18
- npm

Install

```bash
npm install
npm --prefix client install
npm --prefix server install
```

Run locally (dev)

```bash
# start server (hot reload)
npm --prefix server run dev

# start client (Vite)
npm --prefix client run dev
```

Run the replay simulator (demo)

```bash
# inside server or via env
AUTO_SIMULATE=1 npm --prefix server run dev
# or use the admin demo toggle in Settings (when running the server)
```

Real-time events
The app uses scoped Socket.io rooms and a small set of event topics to keep clients in sync. Key events include:

- `match:update`, `match:event`, `match:goal`
- `prediction:new`, `prediction:resolved`
- `leaderboard:update`
- `vault:minted`, `vault:supply_update`

Project Layout (high level)

Client (important folders)

```
client/src/
  screens/      # Login, Home, Predict, Vault, Leaderboard, Profile, Quiz, Settings
  components/   # MatchHero, PredictionCard, VaultCard, LeaderboardRow, Layout
  hooks/        # useAuth, useSocket, useMatch, usePredictions, useVault
  lib/          # supabase, api, socket, canvas (Adidas card generator)
```

Server (important folders)

```
server/
  routes/       # matches, predictions, users, vault, leaderboard, quiz
  socket/       # handlers + emit helpers
  simulator/    # engine.js, match_demo.json
  db/           # unified DB layer, schema.sql, seeds
```

Development Notes & Decisions

- ESM everywhere (`"type": "module"`) — no CommonJS
- Zustand is the chosen client state solution
- In-memory DB fallback keeps demos runnable without cloud creds
- Never commit service-role keys or `.env` files

Contributing

- Branch naming: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`
- Tests: vitest (client) and node --test + supertest (server)
- Run linters and builds before opening PRs

License

- MIT (add LICENSE file if desired)

More
- Read the project guide: `CLAUDE.md`
- Session notes and ongoing state: `CONTEXT.md`

--
Made with ⚽ and a love for realtime demos.
