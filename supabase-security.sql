-- 1. Create Tables (if they don't exist)
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  updated_at timestamp with time zone,
  preferences jsonb default '{}'::jsonb
);

create table if not exists user_state (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  card_id text not null,
  state jsonb not null,
  updated_at timestamp with time zone default now(),
  unique(user_id, card_id)
);

create table if not exists public_decks (
  id uuid default uuid_generate_v4() primary key,
  data text,
  created_at timestamp with time zone default now()
);

-- 2. Enable RLS
alter table profiles enable row level security;
alter table user_state enable row level security;
alter table public_decks enable row level security;

-- 3. Create Policies

-- PROFILES
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- USER_STATE
create policy "Users can view own study data"
  on user_state for select
  using ( auth.uid() = user_id );

create policy "Users can update own study data"
  on user_state for update
  using ( auth.uid() = user_id );

create policy "Users can insert own study data"
  on user_state for insert
  with check ( auth.uid() = user_id );

-- PUBLIC DECKS
create policy "Authenticated users can view public decks"
  on public_decks for select
  to authenticated
  using ( true );

-- Function to handle new user creation automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
