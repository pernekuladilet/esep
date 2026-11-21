-- Subscription history per account. `profiles.plan` holds the current cached
-- tariff; this table tracks status/renewal and will be written by the payment
-- provider webhook (service role) once billing is wired up — not by end users.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tariff text not null check (tariff in ('free', 'pro', 'business')),
  status text not null check (status in ('active', 'canceled', 'past_due')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (user_id = auth.uid());

-- Intentionally no insert/update/delete policy for `authenticated`: writes are
-- performed by the service role (billing webhook), bypassing RLS entirely.
