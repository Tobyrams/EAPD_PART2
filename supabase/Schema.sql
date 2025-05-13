/*
  EAPD Part 2: Supabase Schema
  Paste into your SQL Editor in Supabase and click Run
*/

/*------------------------------------------------------------------------------
  1. UTILITY FUNCTIONS
------------------------------------------------------------------------------*/
-- Returns true if the current user’s role = 'employee'
create or replace function public.is_employee()
  returns boolean
  language sql
  security definer
as $$
  select role = 'employee'
    from public.profiles
   where id = auth.uid();
$$;


/*------------------------------------------------------------------------------
  2. PROFILES TABLE & ROW-LEVEL SECURITY
------------------------------------------------------------------------------*/
-- profiles: one row per user (farmer or employee)
create table if not exists public.profiles (
  id          uuid        primary key references auth.users not null,
  full_name   text        not null,
  role        text        not null check (role in ('farmer','employee')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles
  enable row level security;

-- Only allow farmers to see their own row
create policy if not exists profiles_select_own
  on public.profiles
  for select
  using ( auth.uid() = id );

-- Allow employees to select all profiles
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all
  on public.profiles
  for select
  using ( public.is_employee() );

-- Only employees can insert new farmer profiles
create policy if not exists profiles_insert_by_employee
  on public.profiles
  for insert
  with check (
    role = 'farmer'
    and public.is_employee()
  );


/*------------------------------------------------------------------------------
  3. AUTH TRIGGER: AUTO-SEED NEW PROFILES
------------------------------------------------------------------------------*/
-- When a new auth.user is created, insert a matching row in profiles
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
as $$
begin
  insert into public.profiles (id, full_name, role, created_at, updated_at)
  values (
    new.id,            -- same UUID as auth user
    new.email,         -- default full_name to their email
    'farmer',          -- default role
    now(),
    now()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();


/*------------------------------------------------------------------------------
  4. PRODUCTS TABLE & ROW-LEVEL SECURITY
------------------------------------------------------------------------------*/
-- products: items created by farmers
create table if not exists public.products (
  id              serial      primary key,
  farmer_id       uuid        not null references public.profiles(id),
  name            text        not null,
  category        text        not null,
  production_date date        not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Enable RLS on products
alter table public.products
  enable row level security;

-- INSERT: farmers may only insert their own products
create policy if not exists products_insert_by_farmer
  on public.products
  for insert
  with check ( auth.uid() = farmer_id );

-- SELECT:
--   • farmers see only their products
--   • employees see all products
create policy if not exists products_select_by_farmer
  on public.products
  for select
  using ( auth.uid() = farmer_id );

drop policy if exists products_select_by_employee on public.products;
create policy products_select_by_employee
  on public.products
  for select
  using ( public.is_employee() );

-- UPDATE:
--   • farmers update only their products
--   • employees update any product
create policy if not exists products_update_by_farmer
  on public.products
  for update
  using ( auth.uid() = farmer_id )
  with check ( auth.uid() = farmer_id );

drop policy if exists products_update_by_employee on public.products;
create policy products_update_by_employee
  on public.products
  for update
  using ( public.is_employee() )
  with check ( public.is_employee() );

-- DELETE:
--   • farmers delete only their products
--   • employees delete any product
create policy if not exists products_delete_by_farmer
  on public.products
  for delete
  using ( auth.uid() = farmer_id );

drop policy if exists products_delete_by_employee on public.products;
create policy products_delete_by_employee
  on public.products
  for delete
  using ( public.is_employee() );
