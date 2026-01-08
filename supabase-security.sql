-- Enable RLS for all tables
alter table profiles enable row level security;
alter table user_state enable row level security;

-- 1. PROFILES: Users can only read/edit their own profile
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- 2. USER_STATE (SRS Data): Users can only read/edit their own card progress
create policy "Users can view own study data"
  on user_state for select
  using ( auth.uid() = user_id );

create policy "Users can update own study data"
  on user_state for update
  using ( auth.uid() = user_id );

create policy "Users can insert own study data"
  on user_state for insert
  with check ( auth.uid() = user_id );

-- 3. PUBLIC DATA (Flashcards/Digests): Read-only for everyone (authenticated)
-- Note: If these are stored in tables instead of Git/Static files
create table if not exists public_decks (
  id uuid primary key default uuid_generate_v4(),
  data text
);
alter table public_decks enable row level security;

create policy "Authenticated users can view public decks"
  on public_decks for select
  to authenticated
  using ( true );

-- DENY WRITE to public tables for everyone (implicit default, but good to know)
