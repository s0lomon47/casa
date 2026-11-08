-- =============================================================
-- Ca$a — atualização 3: lista de desejos
-- Pode rodar mais de uma vez sem problema.
-- =============================================================
create table if not exists public.desejos (
  id           uuid primary key default gen_random_uuid(),
  familia_id   uuid not null default public.minha_familia() references public.familias(id) on delete cascade,
  nome         text not null,
  valor        numeric(12,2) not null default 0,
  prioridade   text not null default 'media' check (prioridade in ('alta','media','baixa')),
  ordem        int  not null default 0,
  link         text not null default '',
  quem         text not null default 'Casa',
  comprado     boolean not null default false,
  comprado_em  date,
  criado_em    timestamptz not null default now()
);

alter table public.desejos enable row level security;
drop policy if exists desejos_familia on public.desejos;
create policy desejos_familia on public.desejos for all
  using (familia_id = public.minha_familia()) with check (familia_id = public.minha_familia());

do $$
begin
  alter publication supabase_realtime add table public.desejos;
exception when duplicate_object then null;
end $$;
