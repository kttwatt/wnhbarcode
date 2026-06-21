# WNHBarcode

ระบบคลัง Barcode สำหรับสแกน (Next.js + Supabase) — บันทึก scan log ตามแผนก ไม่ sync กับระบบคลังหลัก

## Setup

1. Copy `.env.local.example` to `.env.local` and fill Supabase keys:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

2. Run migrations in Supabase SQL Editor (in order):

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_seed_categories.sql`
- `supabase/migrations/003_seed_test_items.sql`
- ... (run remaining numbered migrations in order)
- `supabase/migrations/010_prescan_items.sql` — "จดไว้ก่อน" (prescan) shared list, audit log, and search index

> After running `010`, enable Realtime for the `prescan_items` table
> (Supabase Dashboard > Database > Replication > `supabase_realtime`) so the
> shared "จดไว้ก่อน" list updates live for everyone in a department.

3. Supabase Auth settings:

- Enable Email provider
- Disable public sign-ups
- Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/reset-password` (or `http://localhost:3000/**` for local dev)

4. Create first admin user in Supabase Auth, then insert profile:

```sql
insert into profiles (id, username, email, role, full_name)
values ('<auth-user-uuid>', 'admin', 'admin@example.com', 'admin', 'Admin');
```

5. Install and run:

```bash
npm install
npm run dev
```

## Seed data

- Departments: คลัง (WH), OR, ANC
- Test items: Surgical Blade codes 10000438–10000443 (ชุด, 7 บาท) in คลัง + OR

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — start production server
