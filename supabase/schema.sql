-- =============================================================
-- Ca$a — banco de dados (Supabase / Postgres)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em Run.
-- Pode rodar de novo sem problema: ele não apaga dados existentes.
-- =============================================================

create extension if not exists pgcrypto;

-- Família: cada casa tem a sua, com um código de convite
create table if not exists public.familias (
  id              uuid primary key default gen_random_uuid(),
  sobrenome       text not null,
  codigo_convite  text not null unique default upper(substr(md5(random()::text), 1, 6)),
  limite_mercado  numeric(12,2) not null default 700,
  aporte_mensal   numeric(12,2) not null default 1000,
  meta_reserva    numeric(12,2) not null default 11000,
  criado_em       timestamptz not null default now()
);

-- Quem faz parte de cada família (1 pessoa = 1 família)
create table if not exists public.membros (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  familia_id uuid not null references public.familias(id) on delete cascade,
  nome       text not null,
  criado_em  timestamptz not null default now()
);

-- Família de quem está logado
create or replace function public.minha_familia()
returns uuid language sql stable security definer set search_path = public as $$
  select familia_id from public.membros where user_id = auth.uid()
$$;

-- Contas e receitas (modelo que se repete pelos meses)
create table if not exists public.contas (
  id           uuid primary key default gen_random_uuid(),
  familia_id   uuid not null default public.minha_familia() references public.familias(id) on delete cascade,
  nome         text not null,
  valor        numeric(12,2) not null default 0,
  natureza     text not null default 'despesa' check (natureza in ('despesa','receita')),
  tipo         text not null default 'Fixa',
  quem         text not null default 'Casa',
  dia          int  not null default 10 check (dia between 1 and 31),
  recorrencia  text not null default 'mensal' check (recorrencia in ('mensal','unica','parcelado')),
  inicio       text not null check (inicio ~ '^\d{4}-\d{2}$'),   -- mês 'AAAA-MM'
  parcelas     int  check (parcelas is null or parcelas > 0),
  fim          text check (fim is null or fim ~ '^\d{4}-\d{2}$'), -- último mês (se encerrada)
  criado_em    timestamptz not null default now()
);

-- Marcação de pago/recebido por mês
create table if not exists public.pagamentos (
  id          uuid primary key default gen_random_uuid(),
  familia_id  uuid not null default public.minha_familia() references public.familias(id) on delete cascade,
  conta_id    uuid not null references public.contas(id) on delete cascade,
  mes         text not null check (mes ~ '^\d{4}-\d{2}$'),
  valor       numeric(12,2),
  criado_em   timestamptz not null default now(),
  unique (conta_id, mes)
);

-- Lista do mercado
create table if not exists public.mercado_itens (
  id          uuid primary key default gen_random_uuid(),
  familia_id  uuid not null default public.minha_familia() references public.familias(id) on delete cascade,
  nome        text not null,
  valor       numeric(12,2) not null default 0,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- Onde o dinheiro está investido
create table if not exists public.aplicacoes (
  id           uuid primary key default gen_random_uuid(),
  familia_id   uuid not null default public.minha_familia() references public.familias(id) on delete cascade,
  nome         text not null,
  instituicao  text not null default '',
  pct_cdi      numeric(6,2) not null default 100,
  saldo_base   numeric(14,2) not null default 0,   -- saldo conferido no extrato
  data_base    date not null default current_date, -- data desse saldo
  base_atualizada_em timestamptz not null default now(), -- aportes lançados depois disso somam no saldo
  criado_em    timestamptz not null default now()
);
alter table public.aplicacoes add column if not exists base_atualizada_em timestamptz not null default now();

-- Aportes (dinheiro colocado na aplicação depois da data_base)
create table if not exists public.aportes (
  id            uuid primary key default gen_random_uuid(),
  familia_id    uuid not null default public.minha_familia() references public.familias(id) on delete cascade,
  aplicacao_id  uuid not null references public.aplicacoes(id) on delete cascade,
  data          date not null default current_date,
  valor         numeric(14,2) not null,
  criado_em     timestamptz not null default now()
);

-- ---------- Segurança: cada família só vê os próprios dados ----------
alter table public.familias      enable row level security;
alter table public.membros       enable row level security;
alter table public.contas        enable row level security;
alter table public.pagamentos    enable row level security;
alter table public.mercado_itens enable row level security;
alter table public.aplicacoes    enable row level security;
alter table public.aportes       enable row level security;

drop policy if exists familia_ler on public.familias;
create policy familia_ler on public.familias for select using (id = public.minha_familia());
drop policy if exists familia_editar on public.familias;
create policy familia_editar on public.familias for update using (id = public.minha_familia()) with check (id = public.minha_familia());

drop policy if exists membros_ler on public.membros;
create policy membros_ler on public.membros for select using (familia_id = public.minha_familia());
drop policy if exists membros_editar_proprio on public.membros;
create policy membros_editar_proprio on public.membros for update using (user_id = auth.uid()) with check (familia_id = public.minha_familia());

do $$
declare t text;
begin
  foreach t in array array['contas','pagamentos','mercado_itens','aplicacoes','aportes'] loop
    execute format('drop policy if exists %I on public.%I', t || '_familia', t);
    execute format(
      'create policy %I on public.%I for all using (familia_id = public.minha_familia()) with check (familia_id = public.minha_familia())',
      t || '_familia', t);
  end loop;
end $$;

-- ---------- Criar família / entrar com código ----------
create or replace function public.criar_familia(p_sobrenome text, p_nome text)
returns uuid language plpgsql security definer set search_path = public as $$
declare f uuid;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta primeiro.'; end if;
  if exists (select 1 from membros where user_id = auth.uid()) then
    raise exception 'Você já faz parte de uma família.';
  end if;
  insert into familias (sobrenome) values (trim(p_sobrenome)) returning id into f;
  insert into membros (user_id, familia_id, nome) values (auth.uid(), f, trim(p_nome));
  return f;
end $$;

create or replace function public.entrar_familia(p_codigo text, p_nome text)
returns uuid language plpgsql security definer set search_path = public as $$
declare f uuid;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta primeiro.'; end if;
  if exists (select 1 from membros where user_id = auth.uid()) then
    raise exception 'Você já faz parte de uma família.';
  end if;
  select id into f from familias where codigo_convite = upper(trim(p_codigo));
  if f is null then raise exception 'Código de convite não encontrado.'; end if;
  insert into membros (user_id, familia_id, nome) values (auth.uid(), f, trim(p_nome));
  return f;
end $$;

-- Excluir a própria conta (e a família, se for a última pessoa)
drop function if exists public.excluir_minha_conta();

create or replace function public.excluir_minha_conta(p_confirmacao text)
returns void language plpgsql security definer set search_path = public, auth as $$
declare f uuid; restantes int;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta primeiro.'; end if;
  if p_confirmacao is distinct from 'EXCLUIR' then raise exception 'Confirmação inválida.'; end if;
  select familia_id into f from public.membros where user_id = auth.uid();
  delete from public.membros where user_id = auth.uid();
  if f is not null then
    select count(*) into restantes from public.membros where familia_id = f;
    if restantes = 0 then delete from public.familias where id = f; end if;
  end if;
  delete from auth.users where id = auth.uid();
end $$;
grant execute on function public.excluir_minha_conta(text) to authenticated;

grant execute on function public.criar_familia(text, text) to authenticated;
grant execute on function public.entrar_familia(text, text) to authenticated;
grant execute on function public.minha_familia() to authenticated;

-- ---------- Atualização ao vivo (o que um lança, o outro vê) ----------
do $$
declare t text;
begin
  foreach t in array array['familias','membros','contas','pagamentos','mercado_itens','aplicacoes','aportes'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
