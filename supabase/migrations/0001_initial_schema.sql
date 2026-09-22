-- Investment Memory — initial schema
-- Tables: companies, thesis, moments (note | source | conviction_change)
-- See CLAUDE.md for the product spec these constraints are derived from.

-- ---------------------------------------------------------------------------
-- companies: a user's portfolio/watchlist entries. One row per followed
-- company per user. Moving a company from watchlist to portfolio (§16 in
-- CLAUDE.md) is an UPDATE of `status`, never a new row.
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  ticker text not null,
  exchange text not null,
  logo_url text,
  status text not null default 'watchlist' check (status in ('portfolio', 'watchlist')),
  conviction smallint check (conviction between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ticker, exchange)
);

create index if not exists companies_user_id_idx on public.companies (user_id);
create index if not exists companies_user_id_status_idx on public.companies (user_id, status);

-- ---------------------------------------------------------------------------
-- thesis: persistent, singular per company (§22-24 — not a timeline event,
-- no history). One row per company, edited in place.
-- ---------------------------------------------------------------------------
create table if not exists public.thesis (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  thesis_text text,
  invalidation_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists thesis_user_id_idx on public.thesis (user_id);

-- ---------------------------------------------------------------------------
-- moments: append-only timeline entries on a company. Three kinds (§35-37):
--   note              — free-text "what do you think now", with a price
--                        snapshot (§34, immutable once written).
--   source             — an external article/link, never plotted on the
--                        price chart (§38), so it carries no price snapshot.
--   conviction_change — recorded automatically when conviction is edited
--                        (§21), carries the before/after conviction level
--                        plus its own price snapshot (§33-34), exactly like
--                        a note — nothing in the constraints below singles
--                        it out, only 'source' is barred from price_at_time.
-- ---------------------------------------------------------------------------
create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('note', 'source', 'conviction_change')),
  content text,
  price_at_time numeric(14, 4),
  price_currency text default 'EUR',
  source_url text,
  source_title text,
  conviction_from smallint check (conviction_from between 1 and 5),
  conviction_to smallint check (conviction_to between 1 and 5),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint moments_source_has_url
    check (type <> 'source' or source_url is not null),
  constraint moments_source_has_no_price
    check (type <> 'source' or price_at_time is null),
  constraint moments_conviction_change_has_levels
    check (type <> 'conviction_change' or (conviction_from is not null and conviction_to is not null))
);

create index if not exists moments_company_id_occurred_at_idx on public.moments (company_id, occurred_at desc);
create index if not exists moments_user_id_idx on public.moments (user_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists thesis_set_updated_at on public.thesis;
create trigger thesis_set_updated_at
  before update on public.thesis
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — every table is private to its owning user.
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.thesis enable row level security;
alter table public.moments enable row level security;

create policy "companies_select_own" on public.companies
  for select using (auth.uid() = user_id);
create policy "companies_insert_own" on public.companies
  for insert with check (auth.uid() = user_id);
create policy "companies_update_own" on public.companies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "companies_delete_own" on public.companies
  for delete using (auth.uid() = user_id);

create policy "thesis_select_own" on public.thesis
  for select using (auth.uid() = user_id);
create policy "thesis_insert_own" on public.thesis
  for insert with check (auth.uid() = user_id);
create policy "thesis_update_own" on public.thesis
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "thesis_delete_own" on public.thesis
  for delete using (auth.uid() = user_id);

create policy "moments_select_own" on public.moments
  for select using (auth.uid() = user_id);
create policy "moments_insert_own" on public.moments
  for insert with check (auth.uid() = user_id);
create policy "moments_update_own" on public.moments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "moments_delete_own" on public.moments
  for delete using (auth.uid() = user_id);
