-- Add is_premium flag to profiles, updated via RevenueCat webhook
alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists premium_expires_at timestamp with time zone;
