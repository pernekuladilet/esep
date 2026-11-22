-- Demo transactions (from "Заполнить демо-данными") must be distinguishable
-- from real ones so they can be bulk-deleted without touching real data.
alter table public.transactions drop constraint if exists transactions_source_check;

alter table public.transactions add constraint transactions_source_check
  check (source in ('manual', 'kaspi', 'halyk', 'csv', 'demo'));
