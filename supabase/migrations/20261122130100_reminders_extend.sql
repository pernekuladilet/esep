-- Extend the original minimal reminders schema for Phase 5:
-- "custom" reminders need a user-provided title, "semiannual" repeat covers
-- the auto-created tax deadlines, remind_days_before drives how early to
-- surface a reminder, last_sent_at lets the cron job avoid double-sending.
alter table public.reminders drop constraint if exists reminders_type_check;
alter table public.reminders add constraint reminders_type_check
  check (type in ('tax', 'rent', 'salary', 'custom'));

alter table public.reminders drop constraint if exists reminders_repeat_check;
alter table public.reminders add constraint reminders_repeat_check
  check (repeat in ('none', 'weekly', 'monthly', 'semiannual', 'yearly'));

alter table public.reminders add column title text;
alter table public.reminders add column remind_days_before integer not null default 7;
alter table public.reminders add column last_sent_at timestamptz;
