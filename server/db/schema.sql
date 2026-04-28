-- Sideline · Supabase schema
-- Run in Supabase SQL Editor (or `psql`) once per project.

-- Users (mirrors auth.users via trigger; insert your own row on signup)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text,
  avatar_url text,
  prediction_title text default 'Rookie',
  tier text default 'fan',
  points_total integer default 0,
  predictions_made integer default 0,
  predictions_correct integer default 0,
  matches_watched integer default 0,
  notifications_enabled boolean default false,
  strava_connected boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.matches (
  id text primary key,
  home_team text not null,
  away_team text not null,
  home_score integer default 0,
  away_score integer default 0,
  minute integer default 0,
  status text check (status in ('upcoming','live','finished')) default 'upcoming',
  stadium text,
  matchday integer,
  started_at timestamptz
);

create table if not exists public.predictions (
  id text primary key,
  match_id text references public.matches(id) on delete cascade,
  type text,
  question text not null,
  options jsonb not null,
  correct_answer text,
  opens_at timestamptz default now(),
  closes_at timestamptz,
  resolved_at timestamptz
);

create table if not exists public.user_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  prediction_id text references public.predictions(id) on delete cascade,
  selected_option text not null,
  is_correct boolean,
  points_earned integer,
  speed_ms integer,
  speed_bonus numeric default 1,
  submitted_at timestamptz default now(),
  unique (user_id, prediction_id)
);

create table if not exists public.vault_items (
  id text primary key,
  name text not null,
  type text check (type in ('profile_frame','badge','adidas_card','collectible')),
  tier text check (tier in ('common','rare','epic','legendary','mythic')),
  total_supply integer default 0,
  remaining_supply integer default 0,
  image_url text,
  points_cost integer default 0
);

create table if not exists public.user_vault (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  vault_item_id text references public.vault_items(id) on delete cascade,
  earned_at timestamptz default now(),
  redeemed boolean default false,
  code text
);

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id text references public.matches(id) on delete cascade,
  type text,
  player_name text,
  minute integer,
  team text,
  created_at timestamptz default now()
);

create table if not exists public.quiz_questions (
  id text primary key,
  match_id text references public.matches(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_answer text,
  fun_fact text,
  difficulty text
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  question_id text references public.quiz_questions(id) on delete cascade,
  answer text,
  correct boolean,
  points_earned integer,
  elapsed_seconds numeric,
  created_at timestamptz default now()
);

-- Leaderboard views (all-time + this-month + per-match)
create or replace view public.leaderboard_all as
  select u.id as user_id, u.username, u.tier, u.avatar_url, u.points_total
    from public.users u
    order by u.points_total desc;

create or replace view public.leaderboard_month as
  select up.user_id, u.username, u.tier, u.avatar_url, sum(up.points_earned) as points_total
    from public.user_predictions up
    join public.users u on u.id = up.user_id
    where up.submitted_at >= date_trunc('month', now())
    group by up.user_id, u.username, u.tier, u.avatar_url;

create or replace view public.leaderboard_match as
  select up.user_id, p.match_id, u.username, u.tier, u.avatar_url, sum(up.points_earned) as points_total
    from public.user_predictions up
    join public.predictions p on p.id = up.prediction_id
    join public.users u on u.id = up.user_id
    group by up.user_id, p.match_id, u.username, u.tier, u.avatar_url;

-- Match history RPC
create or replace function public.user_match_history(uid uuid)
returns table (
  id text, home_team text, away_team text, matchday integer,
  predictions_made bigint, predictions_correct bigint, points_earned bigint
)
language sql stable as $$
  select m.id, m.home_team, m.away_team, m.matchday,
         count(*)::bigint as predictions_made,
         count(*) filter (where up.is_correct) ::bigint as predictions_correct,
         coalesce(sum(up.points_earned),0)::bigint as points_earned
    from public.user_predictions up
    join public.predictions p on p.id = up.prediction_id
    join public.matches m on m.id = p.match_id
    where up.user_id = uid
    group by m.id, m.home_team, m.away_team, m.matchday
    order by max(up.submitted_at) desc
    limit 10;
$$;

-- RLS
alter table public.users enable row level security;
alter table public.user_predictions enable row level security;
alter table public.user_vault enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "users self" on public.users for select using (auth.uid() = id);
create policy "users update self" on public.users for update using (auth.uid() = id);
create policy "user_predictions self" on public.user_predictions for all using (auth.uid() = user_id);
create policy "user_vault self" on public.user_vault for all using (auth.uid() = user_id);
create policy "quiz_attempts self" on public.quiz_attempts for all using (auth.uid() = user_id);

-- Public reads
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.vault_items enable row level security;
alter table public.match_events enable row level security;
alter table public.quiz_questions enable row level security;
create policy "matches public" on public.matches for select using (true);
create policy "predictions public" on public.predictions for select using (true);
create policy "vault_items public" on public.vault_items for select using (true);
create policy "match_events public" on public.match_events for select using (true);
create policy "quiz_questions public" on public.quiz_questions for select using (true);

-- Auto-create users row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, username)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)))
    on conflict (id) do nothing;
  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Avatars storage bucket (run separately in Storage UI):
--   create bucket: avatars (public)
