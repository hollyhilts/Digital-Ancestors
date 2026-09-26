# Resource suggestion form plan

Status: popup built (branch `resource-suggestion-popup`), not saving anywhere yet. Uses the same Supabase project as the [quiz analytics plan](supabase-plan.md).

## Goal

Let visitors suggest resources, tips or feedback from each guide's **"Want to add a tip?"** section, and collect those suggestions in Supabase for us to review.

## The popup

Opened by the **Share a resource** button in the "Want to add a tip?" section of each guide on `/characters`.

| Field | Type | Required? |
| --- | --- | --- |
| Suggested resource | Text area for one or more links, one per line | No |
| Notes | Open text area | No |
| Which guides does this fit? | Pick any of Guardian, Scribe, Trailblazer, Weaver (none, one, or several) | No |

- **At least one field must be filled** before Submit is enabled.
- The guide the visitor was reading is saved as context, but it is **not** pre-selected, so choosing a guide stays optional.
- After submitting: a short "Thanks, we'll review it" message.
- Anonymous: no name, email or account.

Code:
- `src/components/feedback/ResourceSuggestionDialog.tsx`: the popup
- `src/lib/feedback/submitResourceSuggestion.ts`: the save function. **Currently a stub** that only logs to the console. This is where the Supabase insert goes.
- Copy lives in `src/locales/en.json` under `resourceSuggestion`.

## Storage (to connect)

```sql
create table public.resource_suggestions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  links         text check (char_length(links) <= 2000),
  notes         text check (char_length(notes) <= 4000),
  archetypes    text[] not null default '{}'
                check (archetypes <@ array['guardian','scribe','trailblazer','weaver']),
  source_guide  text check (source_guide in ('guardian','scribe','trailblazer','weaver')),
  -- At least one field filled, same rule as the popup.
  check (
    coalesce(btrim(links), '') <> ''
    or coalesce(btrim(notes), '') <> ''
    or cardinality(archetypes) > 0
  )
);

alter table public.resource_suggestions enable row level security;

-- The site can add rows; nobody can read or change them through the public key.
create policy "anyone can insert"
  on public.resource_suggestions for insert
  to anon
  with check (true);
```

Review submissions in the Supabase dashboard (Table editor or CSV export). Nothing submitted appears on the site automatically.

## Spam

- A hidden "website" field (honeypot) that people never see. If it's filled in, a bot did it, and the popup pretends to succeed without saving.
- Length limits in both the popup and the database.
- If spam becomes a real problem later: add Cloudflare Turnstile (free, no puzzles for real people).

## Connecting it (Sunday checklist)

- [ ] Run the SQL above in Supabase.
- [ ] Add `@supabase/supabase-js` and the `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars (see [supabase-plan.md](supabase-plan.md)).
- [ ] Replace the stub in `submitResourceSuggestion.ts` with the insert. Show the error message if it fails.
- [ ] Test a submission, check the row in the dashboard, merge, push to `ddkom`, sync the fork.

## Open questions

- Should "only a guide picked, no link or note" count as a valid submission? Right now it does, following the "at least one field" rule. It's a one-line change in `hasContent()` and the SQL check.
- Do we want the same button on the Resources page too?
