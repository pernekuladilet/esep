-- Profiles: one row per auth user. Created automatically on signup via trigger.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  language text not null default 'ru' check (language in ('ru', 'kk', 'en')),
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
