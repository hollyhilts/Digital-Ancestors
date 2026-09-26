# Digital-Ancestors
AI Pathways for Artists: Iterative open decision-support tool for artists navigating AI choices around protection, administrative use, and co-creation.

**New here?** Read [How the quiz works](docs/how-the-quiz-works.md) for a one-page overview of the scoring, question picking, and the four characters. Planned analytics: [Supabase plan](docs/supabase-plan.md).

## Legacy single-file app

Download [`ai-framework-23.html`](ai-framework-23.html) and open it on your device (desktop or laptop, not mobile) to interact with it.

## React app (Vite)

The interactive map and marketing page live in [`web/`](web/): TypeScript, React 18, and Vite. Graph content is [`web/src/data/pathwayNodes.json`](web/src/data/pathwayNodes.json) (generated from the legacy file via [`web/scripts/extract-nodes.mjs`](web/scripts/extract-nodes.mjs)).

```bash
cd web
npm install
npm run dev
```

- `npm run build` — production build to `web/dist`
- `npm run validate:pathway` — ensure every option `target` points at a real node id

### Deploy on Vercel (Hobby)

1. Push this repository to GitHub (or GitLab / Bitbucket).
2. In Vercel, **Import** the repo and set **Root Directory** to `web`.
3. Framework preset **Vite**; install `npm install`, build `npm run build`, output `dist` (see [`web/vercel.json`](web/vercel.json)).
4. No environment variables are required for the JSON-backed build.

Optional headless CMS notes: [`web/sanity-optional.txt`](web/sanity-optional.txt).
