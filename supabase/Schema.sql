----------------------------------------------------
-- This is the Supabase schema I used for EAPD Part 2
-- This is how to implement the projects databases in Supabase
-- Paste this in SQL Editor and press run.

----------------------------------------------------

-- Profiles Table

-- profiles: one row per user (farmer or employee)
create table profiles (
  id          uuid        primary key references auth.users not null,
  full_name   text        not null,
  role        text        not null check (role in ('farmer','employee')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;

-- Farmers can see only their own profile
create policy "profiles_select_own" 
  on profiles for select using ( auth.uid() = id );

-- Employees can see everyone’s profile
create policy "profiles_select_all" 
  on profiles for select using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'employee'
    )
  );

-- Only employees can insert new farmer profiles
create policy "profiles_insert_by_employee"
  on profiles for insert with check (
    -- must be creating a farmer
    role = 'farmer'
    -- and the requestor must be an employee
    and exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'employee'
    )
  );

-- 1) create a function that fires after a new auth.user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, created_at, updated_at)
  values (
    new.id,                -- use the same UUID as the auth user
    new.email,             -- or '' if you’d rather have them fill in their name later
    'farmer',              -- you can default everyone to 'farmer' or ''
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2) hook that function up to the auth.users table
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


----------------------------------------------------

-- Products Table

create table products (
  id              serial      primary key,
  farmer_id       uuid        not null references profiles(id),
  name            text        not null,
  category        text        not null,
  production_date date        not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 1. Ensure RLS is on
alter table products enable row level security;

-- 2. INSERT
-- Farmers can insert products for themselves
create policy products_insert_by_farmer
  on products
  for insert
  with check ( auth.uid() = farmer_id );

  

-- 3. SELECT
-- Farmers can read only their own products
create policy products_select_by_farmer
  on products
  for select
  using ( auth.uid() = farmer_id );

-- Employees can read all products
create policy products_select_by_employee
  on products
  for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'employee'
    )
  );

-- 4. UPDATE
-- Farmers can update only their own products
create policy products_update_by_farmer
  on products
  for update
  using ( auth.uid() = farmer_id )
  with check ( auth.uid() = farmer_id );

-- Employees can update any product
create policy products_update_by_employee
  on products
  for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'employee'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'employee'
    )
  );

-- 5. DELETE
-- Farmers can delete only their own products
create policy products_delete_by_farmer
  on products
  for delete
  using ( auth.uid() = farmer_id );

-- Employees can delete any product
create policy products_delete_by_employee
  on products
  for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'employee'
    )
  );
