-- Ставка упрощённой декларации настраивается пользователем (базовая 4%, маслихат
-- может менять ±50% => 2-6%). Хранится на бизнесе, а не в lib/tax/config.ts,
-- т.к. это пользовательский выбор, а не константа.
alter table public.businesses
  add column tax_rate numeric not null default 4
  check (tax_rate in (2, 4, 6));
