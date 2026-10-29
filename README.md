# Flowboard

A shared team Kanban board built with React, TypeScript and Vite, backed by Supabase.

- Four columns: Backlog, In Progress, In Review, Done
- Create, edit, delete (with Undo) and drag cards; keyboard and screen-reader friendly
- Search and filter by assignee or priority; light and dark themes
- Live sync between everyone viewing the board

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm run dev
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run the Vitest + React Testing Library suite (Supabase is mocked) |
| `npm run lint` | Lint with oxlint |
| `npm run build` | Type-check and build for production |

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`) runs lint, tests and build on every push and pull request.
- **Vercel** deploys every push. Its build command (`vercel.json`) runs lint and tests first, so a failing test blocks the deploy.

## Configuration

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (public) key |
| `VITE_SITE_URL` | Optional. Enables canonical URL, `sitemap.xml` and the `robots.txt` sitemap line |
