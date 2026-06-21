# Deployment (Vercel)

Next.js app — Vercel auto-detects the framework (no `vercel.json` needed).

## First-time setup

1. Push this repo to GitHub (branch `main`).
2. In [Vercel](https://vercel.com) → **Add New → Project** → import the GitHub repo.
3. Set **Environment Variables** (Production + Preview):

   | Variable | Notes |
   |----------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never expose to client |
   | `NEXT_PUBLIC_SITE_URL` | Production URL, e.g. `https://your-app.vercel.app` |

4. Deploy. Vercel runs `npm run build` automatically.

## Every update after that

```bash
git add .
git commit -m "describe your change"
git push
```

Each push to `main` triggers a new production deployment. Other branches get preview URLs.

## Supabase Auth redirects

Add your Vercel URL to Supabase **Authentication → URL configuration**:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`, `https://your-app.vercel.app/auth/reset-password`

## Local production build (optional)

```bash
npm run build
npm run start
```
