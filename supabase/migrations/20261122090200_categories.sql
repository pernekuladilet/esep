-- Income/expense categories. System categories (business_id null) are shared by
-- everyone and localized in messages/*.json by `slug` — `name` is just a Russian
-- fallback label. Custom categories belong to one business and have no slug.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  name text not null,
  slug text,
  color text not null default '#64748b',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  constraint categories_system_has_no_business
    check (not is_system or business_id is null)
);

create unique index categories_system_slug_idx
  on public.categories (slug)
  where is_system;

create index categories_business_id_idx on public.categories (business_id);

alter table public.categories enable row level security;

create policy "categories_select_system_or_own"
  on public.categories for select
  using (
    is_system
    or business_id in (select id from public.businesses where owner_id = auth.uid())
  );

create policy "categories_insert_own"
  on public.categories for insert
  with check (
    not is_system
    and business_id in (select id from public.businesses where owner_id = auth.uid())
  );

create policy "categories_update_own"
  on public.categories for update
  using (
    not is_system
    and business_id in (select id from public.businesses where owner_id = auth.uid())
  )
  with check (
    not is_system
    and business_id in (select id from public.businesses where owner_id = auth.uid())
  );

create policy "categories_delete_own"
  on public.categories for delete
  using (
    not is_system
    and business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- Seed the 8 system categories. Display names come from messages/*.json via `slug`;
-- `name` below is only a Russian fallback for admin/debugging.
insert into public.categories (type, name, slug, color, is_system) values
  ('income', 'Выручка', 'revenue', '#0f9b8e', true),
  ('expense', 'Закуп товара', 'cogs', '#f59e0b', true),
  ('expense', 'Аренда', 'rent', '#8b5cf6', true),
  ('expense', 'Зарплата', 'salary', '#3b82f6', true),
  ('expense', 'Коммунальные', 'utilities', '#06b6d4', true),
  ('expense', 'Налоги', 'taxes', '#ef4444', true),
  ('expense', 'Реклама', 'advertising', '#ec4899', true),
  ('expense', 'Прочее', 'other', '#64748b', true);
