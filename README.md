# FaceGrem

FaceGrem is a Next.js + Supabase social media starter project.

## 1. Install

```bash
npm install
```

## 2. Environment variables

Create `.env.local` from `.env.example` and add your real Supabase values.

## 3. Run locally

```bash
npm run dev
```

## 4. Required Supabase SQL

### Posts table

```sql
create extension if not exists "uuid-ossp";

create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

alter table posts enable row level security;

create policy "Anyone can read posts"
on posts
for select
using (true);

create policy "Users can insert posts"
on posts
for insert
with check (auth.uid() = user_id);
```

### Profiles table

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text,
  bio text,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
on profiles
for select
using (true);

create policy "Users can insert their own profile"
on profiles
for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on profiles
for update
using (auth.uid() = id);
```

### Optional avatars bucket

Create a public bucket named `avatars` in Supabase Storage if your plan supports it.

Then add policies:

```sql
create policy "Avatar images are publicly accessible"
on storage.objects
for select
using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars');

create policy "Authenticated users can update their own avatars"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');
```

## 5. Deploy to Vercel

- Import this repo into Vercel
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Deploy

If your repo contains a wrapper folder and the app is in a subfolder, set the Vercel **Root Directory** to the app folder.
