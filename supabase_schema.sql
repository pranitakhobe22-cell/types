-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Interviews Table
create table interviews (
  id text primary key,
  candidate_id text,
  candidate_name text,
  candidate_email text,
  position text,
  date text,
  status text,
  overall_score integer default 0,
  total_questions integer default 0,
  questions_attempted integer default 0,
  questions_skipped integer default 0,
  duration_seconds integer default 0,
  results jsonb default '[]'::jsonb, -- Stores array of {question, answer, ideal_answer, score, feedback}
  warnings jsonb default '[]'::jsonb, -- Stores array of WarningEvent
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Jobs Table
create table jobs (
  id text primary key,
  title text,
  description text,
  status text,
  questions jsonb, -- Stores array of Question
  settings jsonb, -- Stores RoleSettings
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Row Level Security (RLS) - Optional for now, but recommended
alter table interviews enable row level security;
alter table jobs enable row level security;

-- Open access policy for demo purposes (Secure this in production!)
create policy "Allow public read/write" on interviews for all using (true) with check (true);
create policy "Allow public read/write" on jobs for all using (true) with check (true);