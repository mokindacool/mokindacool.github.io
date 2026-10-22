create table if not exists public.dashboard_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.dashboard_data enable row level security;

create policy "own rows select" on public.dashboard_data for select using (auth.uid() = user_id);
create policy "own rows insert" on public.dashboard_data for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.dashboard_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows delete" on public.dashboard_data for delete using (auth.uid() = user_id);

-- Inbox for expenses logged from the iOS Shortcut (via the log-expense Edge Function).
-- No insert policy: only the Edge Function, using the elevated key, can insert.
-- The dashboard moves rows into dashboard_expenses on sync, then deletes them.
create table if not exists public.expense_inbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  category text not null,
  date text not null,
  time text,
  created_at timestamptz not null default now()
);

alter table public.expense_inbox enable row level security;

create policy "own inbox select" on public.expense_inbox for select using (auth.uid() = user_id);
create policy "own inbox delete" on public.expense_inbox for delete using (auth.uid() = user_id);
