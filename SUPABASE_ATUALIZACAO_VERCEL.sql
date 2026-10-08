-- =========================================================
-- ESTUDA+ - ATUALIZAÇÃO PARA O SITE PUBLICADO NO VERCEL
-- Compatível com as tabelas já criadas nesta conversa.
-- Pode ser executado mais de uma vez.
-- =========================================================

-- 1) Completa o perfil usado pelo painel do Estuda+
alter table public.profiles
  add column if not exists unlocked_grades integer[] not null default array[5],
  add column if not exists unlocked_subjects text[] not null default array['Matemática','Português','Ciências','História','Geografia'],
  add column if not exists exams_unlocked boolean not null default true;

alter table public.profiles alter column grade set default 5;
update public.profiles set grade = case when role='admin' then 12 else 5 end where grade is null;
update public.profiles
set unlocked_grades = case
  when role='admin' then array[5,6,7,8,9,10,11,12]
  else array[grade]
end
where unlocked_grades is null or unlocked_grades = array[5];

-- 2) Estado geral sincronizado entre dispositivos
create table if not exists public.user_state (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3) Respostas discursivas e redações
create table if not exists public.manual_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
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

-- 4) Histórico administrativo opcional
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 5) Segurança RLS
alter table public.profiles enable row level security;
alter table public.student_progress enable row level security;
alter table public.answered_questions enable row level security;
alter table public.user_state enable row level security;
alter table public.manual_submissions enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and blocked = false
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Como a exposição automática de novas tabelas foi desativada,
-- os privilégios abaixo são concedidos manualmente.
grant select, update on public.profiles to authenticated;
grant select on public.student_progress to authenticated;
grant select on public.answered_questions to authenticated;
grant select, insert, update on public.user_state to authenticated;
grant select, insert, update on public.manual_submissions to authenticated;
grant select on public.audit_log to authenticated;

-- Recria políticas com nomes estáveis.
drop policy if exists "profile self or admin read" on public.profiles;
create policy "profile self or admin read"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "admin profiles update" on public.profiles;
create policy "admin profiles update"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "progress self or admin read" on public.student_progress;
create policy "progress self or admin read"
on public.student_progress for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "answers self or admin read" on public.answered_questions;
create policy "answers self or admin read"
on public.answered_questions for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "state self or admin read" on public.user_state;
create policy "state self or admin read"
on public.user_state for select
to authenticated
using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "state self insert" on public.user_state;
create policy "state self insert"
on public.user_state for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "state self or admin update" on public.user_state;
create policy "state self or admin update"
on public.user_state for update
to authenticated
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "submission self or admin read" on public.manual_submissions;
create policy "submission self or admin read"
on public.manual_submissions for select
to authenticated
using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "submission self insert" on public.manual_submissions;
create policy "submission self insert"
on public.manual_submissions for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "submission admin update" on public.manual_submissions;
create policy "submission admin update"
on public.manual_submissions for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "audit admin read" on public.audit_log;
create policy "audit admin read"
on public.audit_log for select
to authenticated
using (public.is_admin());

-- 6) Novo usuário: perfil + progresso + estado online
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, username, name, role, grade
  )
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'student',
    5
  )
  on conflict (id) do nothing;

  insert into public.student_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_state (profile_id, state)
  values (new.id, '{}'::jsonb)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Garante user_state também para contas já existentes.
insert into public.user_state (profile_id, state)
select id, '{}'::jsonb
from public.profiles
on conflict (profile_id) do nothing;

-- 7) Correção online: aceita CID nulo no primeiro envio.
-- O CID é escolhido depois da correção quando a questão estiver errada.
create or replace function public.submit_answer(
  p_question_id bigint,
  p_selected_answer text,
  p_cdf text,
  p_cid text default null,
  p_response_time_seconds numeric default 0
)
returns table (
  is_correct boolean,
  answer_correct text,
  answer_explanation text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question public.questions%rowtype;
  v_correct boolean;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and blocked = false
  ) then
    raise exception 'Usuário bloqueado ou perfil inexistente';
  end if;

  p_selected_answer := upper(trim(p_selected_answer));
  if p_selected_answer not in ('A','B','C','D','E','F') then
    raise exception 'Resposta inválida';
  end if;

  p_cdf := upper(trim(p_cdf));
  if p_cdf not in ('C','D','F') then
    raise exception 'CDF inválido';
  end if;

  if p_cid is not null then
    p_cid := lower(trim(p_cid));
    if p_cid not in ('conteudo','interpretacao','distracao') then
      raise exception 'CID inválido';
    end if;
  end if;

  select * into v_question
  from public.questions
  where id = p_question_id and active = true;

  if not found then
    raise exception 'Questão não encontrada';
  end if;

  if v_question.question_format <> 'multipla_escolha' then
    raise exception 'Essa função é somente para múltipla escolha';
  end if;

  if exists (
    select 1 from public.answered_questions
    where user_id = auth.uid()
      and question_id = p_question_id::text
  ) then
    raise exception 'Essa questão já foi respondida';
  end if;

  v_correct := p_selected_answer = v_question.correct_answer;

  insert into public.answered_questions (
    user_id, question_id, semantic_family, subject, grade, topic,
    difficulty, selected_answer, correct_answer, was_correct,
    cdf, cid, response_time_seconds
  ) values (
    auth.uid(), v_question.id::text, v_question.semantic_family,
    v_question.subject, v_question.grade, v_question.topic,
    v_question.difficulty, p_selected_answer, v_question.correct_answer,
    v_correct, p_cdf, p_cid,
    greatest(coalesce(p_response_time_seconds,0),0)
  );

  update public.student_progress
  set
    questions_answered = questions_answered + 1,
    correct_answers = correct_answers + case when v_correct then 1 else 0 end,
    cdf_c = cdf_c + case when p_cdf='C' then 1 else 0 end,
    cdf_d = cdf_d + case when p_cdf='D' then 1 else 0 end,
    cdf_f = cdf_f + case when p_cdf='F' then 1 else 0 end,
    cid_content = cid_content + case when p_cid='conteudo' then 1 else 0 end,
    cid_interpretation = cid_interpretation + case when p_cid='interpretacao' then 1 else 0 end,
    cid_distraction = cid_distraction + case when p_cid='distracao' then 1 else 0 end,
    total_time_seconds = total_time_seconds + greatest(coalesce(p_response_time_seconds,0),0),
    updated_at = now()
  where user_id = auth.uid();

  return query select v_correct, v_question.correct_answer, v_question.explanation;
end;
$$;

revoke all on function public.submit_answer(bigint,text,text,text,numeric) from public;
grant execute on function public.submit_answer(bigint,text,text,text,numeric) to authenticated;

-- 8) CID escolhido/trocado depois da correção.
create or replace function public.set_answer_cid(
  p_question_id bigint,
  p_cid text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_correct boolean;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  p_cid := lower(trim(p_cid));
  if p_cid not in ('conteudo','interpretacao','distracao') then
    raise exception 'CID inválido';
  end if;

  select cid, was_correct into v_old, v_correct
  from public.answered_questions
  where user_id = auth.uid()
    and question_id = p_question_id::text;

  if not found then
    raise exception 'Resposta não encontrada';
  end if;

  if v_correct then
    raise exception 'CID é usado apenas em resposta incorreta';
  end if;

  if v_old = p_cid then
    return;
  end if;

  update public.student_progress
  set
    cid_content = greatest(0, cid_content - case when v_old='conteudo' then 1 else 0 end)
                  + case when p_cid='conteudo' then 1 else 0 end,
    cid_interpretation = greatest(0, cid_interpretation - case when v_old='interpretacao' then 1 else 0 end)
                         + case when p_cid='interpretacao' then 1 else 0 end,
    cid_distraction = greatest(0, cid_distraction - case when v_old='distracao' then 1 else 0 end)
                      + case when p_cid='distracao' then 1 else 0 end,
    updated_at = now()
  where user_id = auth.uid();

  update public.answered_questions
  set cid = p_cid
  where user_id = auth.uid()
    and question_id = p_question_id::text;
end;
$$;

revoke all on function public.set_answer_cid(bigint,text) from public;
grant execute on function public.set_answer_cid(bigint,text) to authenticated;
