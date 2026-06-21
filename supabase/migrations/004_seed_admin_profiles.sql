-- Admin profiles (linked to auth.users)
insert into public.profiles (id, username, email, role, full_name)
values
  (
    '1c62b516-ae10-46a7-900c-c3477d018be0',
    'kttwatt',
    'kttwatt@gmail.com',
    'admin',
    'kttwatt'
  ),
  (
    'c08ee1b3-760d-4744-a9ec-2e741d10241b',
    'kit',
    'kit4test@gmail.com',
    'admin',
    'Kit'
  )
on conflict (id) do update set
  username = excluded.username,
  email = excluded.email,
  role = 'admin',
  full_name = excluded.full_name;
