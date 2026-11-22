-- Private bucket for uploaded bank statement files (PDF/CSV/XLSX). Objects
-- are stored at `{owner_id}/{business_id}/{filename}`; RLS below restricts
-- access to the authenticated user's own folder, same convention Supabase
-- documents for per-user storage.
insert into storage.buckets (id, name, public)
values ('statements', 'statements', false)
on conflict (id) do nothing;

create policy "statements_select_own"
  on storage.objects for select
  using (
    bucket_id = 'statements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "statements_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'statements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "statements_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'statements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

alter table public.imports
  add column storage_path text;
