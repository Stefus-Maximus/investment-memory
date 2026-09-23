-- Investment Memory — investment rules
-- A user's fixed, standing investing rules ("Mijn vaste beleggingsregels"),
-- shown at the top of /lessen. Same flat shape as lessons: no title field,
-- just free text, ordered by when it was added.

create table if not exists public.investment_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists investment_rules_user_id_created_at_idx
  on public.investment_rules (user_id, created_at asc);

alter table public.investment_rules enable row level security;

create policy "investment_rules_select_own" on public.investment_rules
  for select using (auth.uid() = user_id);
create policy "investment_rules_insert_own" on public.investment_rules
  for insert with check (auth.uid() = user_id);
create policy "investment_rules_update_own" on public.investment_rules
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "investment_rules_delete_own" on public.investment_rules
  for delete using (auth.uid() = user_id);
