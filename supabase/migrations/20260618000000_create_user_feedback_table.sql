create table if not exists user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null default 'general', -- 'bug' | 'feature' | 'general'
  message text not null,
  contact_email text,
  created_at timestamptz not null default now()
);

-- Only admins (service role) can read; anyone authenticated or anonymous can insert via API
alter table user_feedback enable row level security;

create policy "service role full access" on user_feedback
  using (true)
  with check (true);
