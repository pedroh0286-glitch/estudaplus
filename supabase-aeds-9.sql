-- AEDS 9.0 — conteúdo editorial compartilhado
-- Execute uma única vez no SQL Editor do Supabase do projeto AEDS.

create table if not exists public.content_items (
  id text primary key,
  kind text not null check (kind in ('question','lesson')),
  subject text not null,
  grade integer not null check (grade between 5 and 12),
  area text not null,
  status text not null default 'draft' check (status in ('draft','review','approved','published')),
  payload jsonb not null,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_lookup_idx on public.content_items(subject,grade,area,status);
create index if not exists content_items_updated_idx on public.content_items(updated_at desc);

alter table public.content_items enable row level security;

drop policy if exists "aeds_content_read" on public.content_items;
create policy "aeds_content_read"
on public.content_items for select
to authenticated
using (
  status = 'published'
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "aeds_content_admin_insert" on public.content_items;
create policy "aeds_content_admin_insert"
on public.content_items for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "aeds_content_admin_update" on public.content_items;
create policy "aeds_content_admin_update"
on public.content_items for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "aeds_content_admin_delete" on public.content_items;
create policy "aeds_content_admin_delete"
on public.content_items for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
