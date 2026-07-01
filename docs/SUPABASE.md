# Enabling profiles & cloud sync (Supabase)

The app is **fully usable without any of this** — progress is saved per-browser in
localStorage. Follow these one-time steps (~10 min, all free-tier) to add Google + magic-link
sign-in and sync progress across devices. Nothing here exposes a secret: the anon key is a public,
RLS-protected key meant to ship in the client.

## 1. Create a Supabase project
1. Sign up at [supabase.com](https://supabase.com) → **New project** (pick a region near you).
2. Project → **Settings → API**: copy the **Project URL** and the **publishable** key
   (`sb_publishable_…`). The legacy *anon* key still works but is being phased out by end of 2026.

## 2. Create the progress table + row-level security
Open **SQL Editor** and run:

```sql
create table public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

-- A user may read and write only their own row.
create policy "own progress - select" on public.progress
  for select using (auth.uid() = user_id);
create policy "own progress - upsert" on public.progress
  for insert with check (auth.uid() = user_id);
create policy "own progress - update" on public.progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## 2b. (Optional) Light usage analytics

First-party, cookie-free, no third party. Run this once to capture anonymous
usage events (app opens, lessons/exams started & completed):

```sql
create table public.events (
  id         bigint generated always as identity primary key,
  event      text not null,
  props      jsonb not null default '{}',
  session_id text,                   -- one per browser tab session
  visitor_id text,                   -- stable per browser → unique visitors
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
grant insert on table public.events to anon, authenticated;
create index events_created_at_idx on public.events (created_at);
create index events_visitor_idx on public.events (visitor_id);
-- anyone may log a KNOWN event; nobody can read them back via the public API
create policy "anyone can log known events" on public.events
  for insert to anon, authenticated
  with check (
    event in (
      'app_open','start_lesson','start_practice','start_exam',
      'start_review','start_bookmarks','lesson_complete',
      'exam_finish','session_finish'
    )
    and char_length(event) <= 40
    and char_length(coalesce(session_id, '')) <= 64
    and char_length(coalesce(visitor_id, '')) <= 64
  );
```

See your usage anytime in the SQL Editor:

```sql
-- events by type
select event, count(*) from public.events group by event order by 2 desc;

-- DAU / WAU / MAU (unique visitors)
select
  count(distinct visitor_id) filter (where created_at > now() - interval '1 day')  as dau,
  count(distinct visitor_id) filter (where created_at > now() - interval '7 days')  as wau,
  count(distinct visitor_id) filter (where created_at > now() - interval '30 days') as mau
from public.events;

-- unique visitors & sessions per day (last 30 days)
select created_at::date as day,
       count(distinct visitor_id) as visitors,
       count(distinct session_id) as sessions
from public.events where created_at > now() - interval '30 days'
group by day order by day desc;

-- funnel: lessons started vs completed
select
  count(*) filter (where event = 'start_lesson')    as lessons_started,
  count(*) filter (where event = 'lesson_complete')  as lessons_completed
from public.events;
```

## 3. Auth providers
In **Authentication → Sign In / Providers**:

- **Email**: ensure *Email* is enabled (magic links work out of the box). Optionally turn off
  "Confirm email" isn't needed — magic link is the confirmation.
- **Google**:
  1. In [Google Cloud Console](https://console.cloud.google.com): create an OAuth 2.0 Client ID
     (type *Web application*).
  2. Add the authorized redirect URI shown in Supabase
     (`https://YOUR-PROJECT.supabase.co/auth/v1/callback`).
  3. Paste the Client ID + secret into Supabase's Google provider and enable it.

In **Authentication → URL Configuration**, set the **Site URL** to
`https://autoskola.dravec.org` and add it to **Redirect URLs** (plus
`http://localhost:5173/` for local dev).

## 4. Wire the keys
- **Local dev:** copy `.env.example` → `.env` and fill in the two values.
- **Deployed site:** GitHub repo → **Settings → Secrets and variables → Actions → New repository
  secret** — add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The deploy workflow
  already passes them to the build; push any commit (or re-run the workflow) to rebuild with auth
  enabled. (`VITE_SUPABASE_ANON_KEY` is still accepted as a legacy fallback.)

## How sync behaves
- On sign-in, local and cloud progress are **merged** (last-write-wins per question, union of
  bookmarks) — you never lose local practice.
- Changes are pushed to the cloud debounced (~1.5 s). All sync is best-effort: if the network is
  down, the app keeps working locally and reconciles next time.
