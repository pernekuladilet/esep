-- The categories RLS policy's USING clause subqueries `businesses` (to check
-- `business_id in (select id from businesses where owner_id = auth.uid())`).
-- Evaluating that subquery requires SELECT on `businesses` for whichever role
-- runs the query — including `anon`, browsing system categories before login.
-- This does not expose business rows to anon: RLS on `businesses` itself still
-- requires `owner_id = auth.uid()`, which is never true for anon.
grant select on public.businesses to anon;
