-- Daily message counter for the AI assistant, per business, so the Free/Pro/
-- Business message limit can be enforced without storing chat history.
create table public.ai_chat_usage (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  date date not null,
  message_count integer not null default 0,
  unique (business_id, date)
);

create index ai_chat_usage_business_id_idx on public.ai_chat_usage (business_id);

alter table public.ai_chat_usage enable row level security;

create policy "ai_chat_usage_select_own"
  on public.ai_chat_usage for select
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "ai_chat_usage_insert_own"
  on public.ai_chat_usage for insert
  with check (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "ai_chat_usage_update_own"
  on public.ai_chat_usage for update
  using (business_id in (select id from public.businesses where owner_id = auth.uid()))
  with check (business_id in (select id from public.businesses where owner_id = auth.uid()));
