-- Businesses owned by a user. A user may own several (Business plan).
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('ip', 'too')),
  tax_regime text not null check (
    tax_regime in ('simplified', 'patent', 'retail_tax', 'general')
  ),
  bin_iin text,
  created_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses (owner_id);

alter table public.businesses enable row level security;

create policy "businesses_select_own"
  on public.businesses for select
  using (owner_id = auth.uid());

create policy "businesses_insert_own"
  on public.businesses for insert
  with check (owner_id = auth.uid());

create policy "businesses_update_own"
  on public.businesses for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "businesses_delete_own"
  on public.businesses for delete
  using (owner_id = auth.uid());
