# Sideline

Real-time second-screen companion for Bundesliga matches. Mobile-first (390px), React + Vite frontend, Node + Express + Socket.io backend, Supabase persistence, replay simulator for hackathon demos.

## Layout

```
client/
  src/
    screens/      Login, Home, Predict, Vault, Leaderboard, Profile, Quiz, Settings, AdidasDrop overlay
    components/   Layout (TopBar + BottomNav), MatchHero, PredictionCard, VaultCard, LeaderboardRow
    hooks/        useAuth, useSocket, useMatch, usePredictions, useVault
    lib/          supabase, api (auth-injecting fetch), socket, canvas (Adidas card generator)
    store/        Zustand store: user, match, points, pendingDrop, toast
  public/         manifest.json, sw.js, favicon

server/
  routes/         matches, predictions, users, vault, leaderboard, quiz
  socket/         handlers + emit helpers
  simulator/      engine.js (replay engine), match_demo.json (Dortmund vs Bayern timeline)
  db/             supabase admin client, in-memory fallback, schema.sql, seed.json, seed.js
```

## Real-time architecture

Socket events emitted by the simulator (or production match feed):

| Event                     | Payload                                |
|---------------------------|----------------------------------------|
| `match:update`            | full match row                         |
| `match:event`             | event row (goal/card/sub/var/corner)   |
| `match:pulse`             | { home: zones[], away: zones[] }       |
| `match:goal`              | drop card payload (player, minute…)    |
| `prediction:new`          | new prediction                         |
| `prediction:resolved`     | { prediction_id, correct_answer, awards } |
| `leaderboard:update`      | (no payload, triggers re-fetch)        |
| `vault:minted`            | user_vault row                         |
| `vault:supply_update`     | { vault_item_id, remaining_supply }    |

## Match simulator

`server/simulator/match_demo.json` is a 90-minute event timeline. The engine ticks at 1Hz and projects minutes at `speed`× realtime (default 30×). Goals trigger Adidas drops; mythic goals auto-mint a Vault collectible to the most recent predictor. Add more matches by dropping new JSON files and pointing `startSimulator(io, { file })` at them.

## Known gaps / hackathon tradeoffs

- Adidas card generation uses HTML Canvas — fonts may FOUC on first render before `Space Grotesk` is loaded.
- Match simulator replays a fixed timeline; live DFL feed integration is not wired (per spec).
- Leaderboard views in `schema.sql` aggregate from `user_predictions`; for huge user counts add materialized views + scheduled refresh.
- PWA service worker caches the shell only; no offline API.
