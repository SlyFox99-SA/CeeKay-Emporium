begin;

-- 1a. Stock columns. stock_quantity NULL means "untracked / unlimited".
alter table public.menu_items
  add column if not exists stock_quantity       integer,
  add column if not exists low_stock_threshold  integer not null default 5,
  add column if not exists manually_sold_out     boolean not null default false;

-- 1b. Derived availability. NEVER write to this column - it is computed.
alter table public.menu_items
  add column if not exists is_available boolean
  generated always as (
    not manually_sold_out
    and (stock_quantity is null or stock_quantity > 0)
  ) stored;

-- 1c. Index for the storefront filter.
create index if not exists menu_items_available_idx
  on public.menu_items (is_available);

-- 1d. Realtime: storefront must hear about sold-out changes instantly.
do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname    = 'supabase_realtime'
       and schemaname = 'public'
       and tablename  = 'menu_items'
  ) then
    alter publication supabase_realtime add table public.menu_items;
  end if;
end $$;

commit;