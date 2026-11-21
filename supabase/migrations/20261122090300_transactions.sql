-- Transactions. Money is stored as integer tiyn (1 tenge = 100 tiyn) — never float.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  date date not null,
  amount bigint not null check (amount >= 0),
  type text not null check (type in ('income', 'expense')),
  category_id uuid references public.categories (id),
  source text not null default 'manual' check (
    source in ('manual', 'kaspi', 'halyk', 'csv')
  ),
  description text,
  counterparty text,
  import_id uuid,
  created_at timestamptz not null default now()
);

create index transactions_business_id_idx on public.transactions (business_id);
create index transactions_date_idx on public.transactions (business_id, date);

alter table public.transactions enable row level security;

create policy "transactions_select_own"
  on public.transactions for select
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "transactions_update_own"
  on public.transactions for update
  using (business_id in (select id from public.businesses where owner_id = auth.uid()))
  with check (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "transactions_delete_own"
  on public.transactions for delete
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));
