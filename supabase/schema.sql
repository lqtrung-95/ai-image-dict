-- AI Image Dictionary Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Photo analyses table
create table public.photo_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  image_url text not null,
  scene_context jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Detected objects table
create table public.detected_objects (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid references public.photo_analyses(id) on delete cascade not null,
  label_en text not null,
  label_zh text not null,
  pinyin text not null,
  confidence float default 0.9,
  bounding_box jsonb,
  category text default 'object'
);

-- Collections table
create table public.collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text default '#3b82f6',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vocabulary items table
create table public.vocabulary_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  detected_object_id uuid references public.detected_objects(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  word_zh text not null,
  word_pinyin text not null,
  word_en text not null,
  example_sentence text,
  is_learned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index idx_photo_analyses_user_id on public.photo_analyses(user_id);
create index idx_photo_analyses_created_at on public.photo_analyses(created_at desc);
create index idx_detected_objects_analysis_id on public.detected_objects(analysis_id);
create index idx_vocabulary_items_user_id on public.vocabulary_items(user_id);
create index idx_vocabulary_items_collection_id on public.vocabulary_items(collection_id);
create index idx_collections_user_id on public.collections(user_id);

-- Full text search index for vocabulary
create index idx_vocabulary_items_search on public.vocabulary_items 
  using gin(to_tsvector('simple', word_zh || ' ' || word_pinyin || ' ' || word_en));

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.photo_analyses enable row level security;
alter table public.detected_objects enable row level security;
alter table public.collections enable row level security;
alter table public.vocabulary_items enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- RLS Policies for photo_analyses
create policy "Users can view own analyses" 
  on public.photo_analyses for select 
  using (auth.uid() = user_id);

create policy "Users can create own analyses" 
  on public.photo_analyses for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete own analyses" 
  on public.photo_analyses for delete 
  using (auth.uid() = user_id);

-- RLS Policies for detected_objects
create policy "Users can view objects from own analyses" 
  on public.detected_objects for select 
  using (
    exists (
      select 1 from public.photo_analyses 
      where id = detected_objects.analysis_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can create objects for own analyses" 
  on public.detected_objects for insert 
  with check (
    exists (
      select 1 from public.photo_analyses 
      where id = detected_objects.analysis_id 
      and user_id = auth.uid()
    )
  );

-- RLS Policies for collections
create policy "Users can manage own collections" 
  on public.collections for all 
  using (auth.uid() = user_id);

-- RLS Policies for vocabulary_items
create policy "Users can manage own vocabulary" 
  on public.vocabulary_items for all 
  using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

-- Trigger to create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- User stats table (for streaks and progress)
create table public.user_stats (
  id uuid references public.profiles(id) on delete cascade primary key,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_practice_date date,
  total_words_learned integer default 0,
  total_practice_sessions integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Practice sessions table
create table public.practice_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  words_practiced integer default 0,
  words_known integer default 0,
  duration_seconds integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index idx_practice_sessions_user_id on public.practice_sessions(user_id);
create index idx_practice_sessions_created_at on public.practice_sessions(created_at desc);

-- Enable RLS
alter table public.user_stats enable row level security;
alter table public.practice_sessions enable row level security;

-- RLS Policies for user_stats
create policy "Users can manage own stats" 
  on public.user_stats for all 
  using (auth.uid() = id);

-- RLS Policies for practice_sessions
create policy "Users can manage own practice sessions" 
  on public.practice_sessions for all 
  using (auth.uid() = user_id);

-- Function to update streak on practice
create or replace function public.update_user_streak(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_last_date date;
  v_today date := current_date;
  v_streak integer;
  v_longest integer;
begin
  -- Get current stats
  select last_practice_date, current_streak, longest_streak 
  into v_last_date, v_streak, v_longest
  from public.user_stats where id = p_user_id;
  
  -- If no stats exist, create them
  if not found then
    insert into public.user_stats (id, current_streak, longest_streak, last_practice_date)
    values (p_user_id, 1, 1, v_today);
    return;
  end if;
  
  -- Calculate new streak
  if v_last_date is null or v_last_date < v_today - 1 then
    -- Streak broken, start new
    v_streak := 1;
  elsif v_last_date = v_today - 1 then
    -- Continue streak
    v_streak := v_streak + 1;
  elsif v_last_date = v_today then
    -- Already practiced today, no change
    return;
  end if;
  
  -- Update longest if needed
  if v_streak > v_longest then
    v_longest := v_streak;
  end if;
  
  -- Save updated stats
  update public.user_stats 
  set current_streak = v_streak,
      longest_streak = v_longest,
      last_practice_date = v_today,
      total_practice_sessions = total_practice_sessions + 1,
      updated_at = now()
  where id = p_user_id;
end;
$$;

-- Daily usage tracking for rate limiting
create table public.daily_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  usage_date date not null default current_date,
  analyses_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, usage_date)
);

-- Upgrade interest tracking (for validating demand before building payments)
create table public.upgrade_interest (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  email text,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index idx_daily_usage_user_date on public.daily_usage(user_id, usage_date);
create index idx_upgrade_interest_created on public.upgrade_interest(created_at desc);

-- Enable RLS
alter table public.daily_usage enable row level security;
alter table public.upgrade_interest enable row level security;

-- RLS Policies for daily_usage
create policy "Users can view own usage"
  on public.daily_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.daily_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.daily_usage for update
  using (auth.uid() = user_id);

-- RLS Policies for upgrade_interest (users can insert, only admins can view all)
create policy "Users can insert upgrade interest"
  on public.upgrade_interest for insert
  with check (auth.uid() = user_id);

create policy "Users can view own upgrade interest"
  on public.upgrade_interest for select
  using (auth.uid() = user_id);

-- Function to increment daily usage and check limit
create or replace function public.check_and_increment_usage(p_user_id uuid, p_limit integer default 10)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_count integer;
  v_today date := current_date;
begin
  -- Get or create today's usage record
  insert into public.daily_usage (user_id, usage_date, analyses_count)
  values (p_user_id, v_today, 0)
  on conflict (user_id, usage_date) do nothing;

  -- Get current count
  select analyses_count into v_count
  from public.daily_usage
  where user_id = p_user_id and usage_date = v_today;

  -- Check if limit exceeded
  if v_count >= p_limit then
    return jsonb_build_object(
      'allowed', false,
      'current', v_count,
      'limit', p_limit,
      'remaining', 0
    );
  end if;

  -- Increment count
  update public.daily_usage
  set analyses_count = analyses_count + 1
  where user_id = p_user_id and usage_date = v_today;

  return jsonb_build_object(
    'allowed', true,
    'current', v_count + 1,
    'limit', p_limit,
    'remaining', p_limit - v_count - 1
  );
end;
$$;

-- Storage bucket for images
-- Note: Run this in Supabase Dashboard > Storage > Create bucket
-- Bucket name: images
-- Public: false
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- Max file size: 5MB

-- Storage policies (run after creating the bucket)
-- Allow authenticated users to upload to their own folder
-- insert into storage.policies (name, bucket_id, operation, definition)
-- values (
--   'User can upload own images',
--   'images',
--   'INSERT',
--   '(bucket_id = ''images'' AND auth.uid()::text = (storage.foldername(name))[1])'
-- );

