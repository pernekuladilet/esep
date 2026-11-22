-- This project is missing Supabase's usual default grants for
-- `service_role` too (same root cause as the earlier anon/authenticated
-- gap): BYPASSRLS only skips row-level security policies, it does not
-- substitute for base table GRANTs, which Postgres still checks first.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;

alter default privileges in schema public
  grant all on tables to service_role;
