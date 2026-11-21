-- RLS policies alone don't grant access — Postgres also requires the base
-- table-level GRANTs for the `anon`/`authenticated` roles PostgREST uses.
-- New projects get this by default; add it explicitly in case this project
-- (or a freshly linked one) doesn't have it, since RLS stays the real gate.
grant usage on schema public to anon, authenticated;

grant select, update on public.profiles to authenticated;

grant select, insert, update, delete on public.businesses to authenticated;

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.imports to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;

grant select on public.subscriptions to authenticated;

-- Keep this working for any table added later via the Supabase CLI/dashboard.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
