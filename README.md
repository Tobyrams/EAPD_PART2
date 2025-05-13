# EAPD Part 2


## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (Latest LTS version recommended)
- npm (comes with Node.js)
- Git

## Getting Started

1. Clone the repository:

```bash
git clone [your-repository-url]
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

4. Start the development server(This is to run the application locally):

```bash
npm run dev
```

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

3. Set Up Database Tables:

   - In your Supabase dashboard, go to the 'SQL Editor'
   - Copy and paste the 'Schema.sql' found in this project (supabase > Schema.sql) in the 'SQL Editor'.

4. Enable Authentication (if needed):

   - Go to 'Authentication > Sign In/ Providers' in your Supabase dashboard
   - Go to 'Email' under Auth Providers and click it and make sure 'Confirm Email' is DISABLED. (This is to make user email registration and login easier by not allowing user to confirm their email).
   - Then click save at the bottom.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code issues
