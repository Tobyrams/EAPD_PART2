# EAPD Part 2

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/download) (Latest LTS version recommended)
- npm (comes with Node.js)
- [Visual Studio Code](https://code.visualstudio.com/download)
- Git

## Getting Started

1. Clone the repository(In VS Code Terminal):

```bash
git clone https://github.com/Tobyrams/EAPD_PART2.git
cd EAPD_PART2
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run Locally (Note App Needs Backend Config to run smoothly):

```bash
npm run dev
````

The application will be available at `http://localhost:5173` by default.

## Setting Up Supabase

1. Create a Supabase Account:

   - Go to [https://supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. Get Your Project Credentials:

   - In your Supabase project dashboard, go to 'Project Settings'
   - Navigate to 'Data API' under 'CONFIGURATION' section
   - Copy your `Project URL` and `anon` public API key
   - Add these to your `.env` file:
     ```env
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

3. Enable Authentication (if needed):

   - Go to 'Authentication > Sign In/ Providers' in your Supabase dashboard
   - Go to 'Email' under Auth Providers and click it and make sure 'Confirm Email' is DISABLED. (This is to make user email registration and login easier by not allowing user to confirm their email).
   - Then click save at the bottom.

4. Set Up Database Tables:

   - In your Supabase dashboard, go to the 'SQL Editor'
   - Copy and paste the 'Schema.sql' found in this project (supabase > Schema.sql) in the 'SQL Editor'.
   <details>
   <summary>
      Schema.sql
   </summary>

```
/*
  EAPD Part 2: Supabase Schema
  Paste into your SQL Editor in Supabase and click Run
*/

-- profiles: one row per user (farmer or employee)
DROP TABLE IF EXISTS profiles CASCADE;
create table if not exists public.profiles (
  id          uuid        primary key references auth.users not null,
  full_name   text        not null,
  role        text        not null check (role in ('farmer','employee')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

/*------------------------------------------------------------------------------
  1. UTILITY FUNCTIONS
------------------------------------------------------------------------------*/
-- Returns true if the current user’s role = 'employee'
DROP FUNCTION IF EXISTS public.is_employee() CASCADE;
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
  2. PROFILES ROW-LEVEL SECURITY
------------------------------------------------------------------------------*/
-- Enable RLS on profiles
alter table public.profiles
  enable row level security;

-- Only allow farmers to see their own row
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
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
drop policy if exists profiles_insert_by_employee on public.profiles;
create policy profiles_insert_by_employee
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
    coalesce(new.raw_user_meta_data->>'role', 'farmer'),  -- use role from metadata or default to farmer
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
DROP POLICY IF EXISTS products_insert_by_farmer ON public.products;
create policy  products_insert_by_farmer
  on public.products
  for insert
  with check ( auth.uid() = farmer_id );

-- SELECT:
--   • farmers see only their products
--   • employees see all products
DROP POLICY IF EXISTS products_select_by_farmer ON public.products;
create policy  products_select_by_farmer
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
drop policy if exists products_update_by_farmer on public.products;
create policy products_update_by_farmer
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
drop policy if exists products_delete_by_farmer on public.products;
create policy products_delete_by_farmer
  on public.products
  for delete
  using ( auth.uid() = farmer_id );

drop policy if exists products_delete_by_employee on public.products;
create policy products_delete_by_employee
  on public.products
  for delete
  using ( public.is_employee() );


```

## Employee Role Activation

- We need to set a users role as 'employee' so that we can have one as the app create the role 'farmer' by default
- Once a you have created a user by registering one through the application open up [Supabase](https://supabase.com/dashboard/) and go into the project you created earlier.
- Go click on 'table editor' then click on the 'profiles' table and click on the user that we want to change their role to 'employee' after that login with that user and they will have 'employee' role

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code issues
