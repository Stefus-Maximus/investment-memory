-- Investment Memory — lessons
-- A flat, personal journal of takeaways ("Mijn lessen") — deliberately
-- separate from moments: no company link, no type, just free text on its
-- own timeline of the user's investing journey as a whole.

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists lessons_user_id_created_at_idx on public.lessons (user_id, created_at desc);

alter table public.lessons enable row level security;

create policy "lessons_select_own" on public.lessons
  for select using (auth.uid() = user_id);
create policy "lessons_insert_own" on public.lessons
  for insert with check (auth.uid() = user_id);
create policy "lessons_update_own" on public.lessons
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lessons_delete_own" on public.lessons
  for delete using (auth.uid() = user_id);
