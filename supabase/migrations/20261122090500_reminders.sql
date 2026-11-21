-- Reminders for tax/rent/salary deadlines, sent by email or Telegram.
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  type text not null check (type in ('tax', 'rent', 'salary')),
  date date not null,
  repeat text check (repeat in ('none', 'weekly', 'monthly', 'yearly')),
  channel text not null default 'email' check (channel in ('email', 'telegram')),
  created_at timestamptz not null default now()
);

create index reminders_business_id_idx on public.reminders (business_id);

alter table public.reminders enable row level security;

create policy "reminders_select_own"
  on public.reminders for select
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "reminders_insert_own"
  on public.reminders for insert
  with check (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "reminders_update_own"
  on public.reminders for update
  using (business_id in (select id from public.businesses where owner_id = auth.uid()))
  with check (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "reminders_delete_own"
  on public.reminders for delete
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));
