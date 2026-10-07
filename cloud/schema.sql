-- Estuda+ cloud schema for Supabase/PostgreSQL.
-- Run in Supabase SQL Editor after creating the project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique not null,
  username text unique not null,
  name text not null,
  role text not null check (role in ('admin','student')) default 'student',
  grade integer not null default 5 check (grade between 5 and 12),
  blocked boolean not null default false,
  unlocked_grades integer[] not null default array[5],
  unlocked_subjects text[] not null default array['Matemática','Português','Ciências','História','Geografia'],
  exams_unlocked boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_state (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.manual_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  kind text not null,
  question_id text,
  prompt text not null,
  answer text not null,
  status text not null default 'pending',
  score numeric,
  comment text,
  created_at timestamptz not null default now(),
  graded_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.audit_log enable row level security;
alter table public.manual_submissions enable row level security;

create or replace function public.current_profile_id() returns uuid language sql stable security definer set search_path=public as $$
  select id from public.profiles where auth_id=auth.uid() limit 1
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where auth_id=auth.uid() and role='admin' and blocked=false)
$$;

create policy "profile self read" on public.profiles for select using (auth_id=auth.uid() or public.is_admin());
create policy "admin profiles update" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "state self select" on public.user_state for select using (profile_id=public.current_profile_id() or public.is_admin());
create policy "state self insert" on public.user_state for insert with check (profile_id=public.current_profile_id() or public.is_admin());
create policy "state self update" on public.user_state for update using (profile_id=public.current_profile_id() or public.is_admin()) with check (profile_id=public.current_profile_id() or public.is_admin());
create policy "audit admin select" on public.audit_log for select using (public.is_admin());
create policy "submission self read" on public.manual_submissions for select using (profile_id=public.current_profile_id() or public.is_admin());
create policy "submission self insert" on public.manual_submissions for insert with check (profile_id=public.current_profile_id());
create policy "submission admin update" on public.manual_submissions for update using (public.is_admin()) with check (public.is_admin());
