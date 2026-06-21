Supabase setup notes

1. Create a new project on Supabase (free tier).
2. Run `supabase/schema.sql` in the SQL editor to create tables.
3. Enable Row Level Security (RLS) and add policies per your auth mapping.
4. Create a few service users or use Supabase Auth to register users; mirror their `id` into `users` table for role/dept mapping.
5. Set Vercel environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy to Vercel (free tier)

Notes:
- This repo includes a basic `AuthWrapper` which uses Supabase Auth. For initial testing without Supabase, you can skip env vars and use the local UI.
- RLS policies must be tailored to your `users` table and JWT claims.
