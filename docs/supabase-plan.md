# Supabase plan: anonymous quiz responses

Status: planned, not built yet. See [How the quiz works](how-the-quiz-works.md) for the quiz itself.

## Goal

Record every finished quiz anonymously, so we can see how artists answer and where they land on the map. Later, we could show visitors the aggregate ("you're here, everyone else is here").

## What we store (and what we don't)

One row per finished quiz:

| Field | Example | Notes |
| --- | --- | --- |
| `session_id` | random UUID | New for every quiz run, never saved in the browser |
| `answers` | `[{"questionId":"poster","optionIndex":1}, …]` | Which answer was picked for each question |
| `x`, `y` | `3`, `-2` | Final position on the map |
| `character` | `weaver` | Resulting quadrant |
| `question_count` | `6` | 6–8 |
| `created_at` | timestamp | Set by the database |

**Not stored:** names, emails, accounts, IP addresses, location, device, or cookies. (Supabase's own request logs keep IPs briefly, which is why the popover copy says "we don't store" rather than "we never see.")

## Setup (one time)

1. Create the Supabase account with the shared Google account. Create a project on the free tier.
2. Run the SQL below in the SQL editor.
3. Copy the project URL and the **anon (public)** key into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and add them as GitHub Actions secrets for the deploy. The anon key is safe to ship in the browser; the table rules below are what protect the data. Never use the `service_role` key in the site.

```sql
create table public.quiz_responses (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  session_id     uuid not null,
  answers        jsonb not null check (jsonb_typeof(answers) = 'array'),
  x              numeric not null check (x between -30 and 30),
  y              numeric not null check (y between -30 and 30),
  character      text not null check (character in ('guardian','scribe','trailblazer','weaver')),
  question_count smallint not null check (question_count between 1 and 8)
);

alter table public.quiz_responses enable row level security;

-- The site can add rows. There is no select/update/delete policy,
-- so nobody can read or change data through the public key.
create policy "anyone can insert"
  on public.quiz_responses for insert
  to anon
  with check (true);
```

We read the data in the Supabase dashboard (Table editor, SQL editor, or CSV export), which isn't limited by these rules.

## Site changes

- `src/lib/analytics.ts`: one `saveQuizResponse(score, position)` function. It sends the insert and fails silently, so the quiz never breaks if Supabase is down or paused.
- Call it once when the quiz finishes (`isFinished`), from the quiz hook.
- Add the notice near the quiz: "Answers are saved anonymously." with an "i" popover:

  > **What we save:** your answer to each question · your spot on the map · your character · the date
  > **What we don't:** your name, email, location, or anything that links back to you
  > We use this to understand how artists think about AI.

## Keeping the free project awake

Free projects pause after about 7 days without activity. A scheduled GitHub Action in **`ddkom/Digital-Ancestors`** makes a small request every 3 days. It doesn't go in the fork, because scheduled workflows are off in forks by default. GitHub also turns off scheduled workflows after 60 days with no commits and sends an email; click "enable" to turn it back on. The Pro plan ($25/month) removes pausing entirely.

## Capacity

A row is under 1 KB. The free tier's 500 MB database holds roughly 500,000 responses.

## Later: showing the aggregate

Add a database function that returns only totals (for example, counts per character, or a coarse grid of x/y positions) and let the site call it. Raw rows stay private.

## Workflow

Build on a branch, push to `ddkom`, then sync the `hollyhilts` fork, which is what deploys.
