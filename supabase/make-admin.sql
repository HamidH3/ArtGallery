-- Grant dashboard access to an existing Supabase Auth user.
-- 1. Create the user first: Supabase Dashboard → Authentication → Users → Add user
--    (choose "Create new user", enter your email and a strong password, tick "Auto Confirm User").
-- 2. Replace the email below with that address, then run this in the SQL Editor.

insert into public.admins (user_id)
select id from auth.users where email = 'hamidbro333@gmail.com'
on conflict (user_id) do nothing;

-- Check it worked (should return one row):
select u.email, a.created_at
from public.admins a join auth.users u on u.id = a.user_id;

-- To remove access later:
-- delete from public.admins where user_id = (select id from auth.users where email = 'you@example.com');
