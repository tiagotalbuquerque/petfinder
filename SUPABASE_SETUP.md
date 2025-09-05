# Supabase Setup for PetFinder

This guide will help you set up Supabase for the PetFinder application to enable persistent storage of pet reports.

## 1. Create a Supabase Account

1. Go to [Supabase](https://supabase.com/) and sign up for an account if you don't have one already.
2. Create a new project in Supabase.

## 2. Set Up Database Tables

You need to create two tables in your Supabase project:

### Missing Pets Table

Execute the following SQL in the Supabase SQL Editor:

```sql
CREATE TABLE missing_pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_name TEXT,
  breed TEXT,
  species TEXT,
  last_seen TEXT,
  contact TEXT,
  lat FLOAT,
  lng FLOAT,
  type TEXT DEFAULT 'missing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE missing_pets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous read access
CREATE POLICY "Allow anonymous read access" 
  ON missing_pets FOR SELECT 
  USING (true);

-- Create policy to allow anonymous insert access
CREATE POLICY "Allow anonymous insert access" 
  ON missing_pets FOR INSERT 
  WITH CHECK (true);
```

### Found Pets Table

Execute the following SQL in the Supabase SQL Editor:

```sql
CREATE TABLE found_pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_name TEXT,
  breed TEXT,
  species TEXT,
  found_at TEXT,
  contact TEXT,
  lat FLOAT,
  lng FLOAT,
  type TEXT DEFAULT 'found',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE found_pets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous read access
CREATE POLICY "Allow anonymous read access" 
  ON found_pets FOR SELECT 
  USING (true);

-- Create policy to allow anonymous insert access
CREATE POLICY "Allow anonymous insert access" 
  ON found_pets FOR INSERT 
  WITH CHECK (true);
```

## 3. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to Project Settings > API.
2. Copy the "Project URL" and "anon public" key.

## 4. Configure Environment Variables

1. Create a `.env` file in the root of your project (if not already created).
2. Add the following environment variables with your Supabase credentials:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 5. Restart Your Development Server

After setting up the environment variables, restart your development server for the changes to take effect:

```
npm run dev
```

## 6. Testing

Test the application by creating missing and found pet reports. The data should now be persisted in your Supabase database and will be available even after refreshing the page or restarting the application.