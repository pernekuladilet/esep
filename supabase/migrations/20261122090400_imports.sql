-- Bank statement import batches (Kaspi/Halyk/CSV uploads).
create table public.imports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  file_name text not null,
  bank text check (bank in ('kaspi', 'halyk')),
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'done', 'failed')
  ),
  operations_count int not null default 0,
  created_at timestamptz not null default now()
);

create index imports_business_id_idx on public.imports (business_id);

alter table public.transactions
  add constraint transactions_import_id_fkey
  foreign key (import_id) references public.imports (id) on delete set null;

alter table public.imports enable row level security;

create policy "imports_select_own"
  on public.imports for select
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "imports_insert_own"
  on public.imports for insert
  with check (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "imports_update_own"
  on public.imports for update
  using (business_id in (select id from public.businesses where owner_id = auth.uid()))
  with check (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "imports_delete_own"
  on public.imports for delete
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));
