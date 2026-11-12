-- =============================================================
-- Ca$a — atualização 5: saldo que passa de um mês para o outro
-- Pode rodar mais de uma vez sem problema. Não apaga nada.
-- =============================================================
alter table public.familias add column if not exists saldo_desde   text;                         -- mês 'AAAA-MM' em que começa a contar
alter table public.familias add column if not exists saldo_inicial numeric(14,2) not null default 0; -- quanto já tinham nesse mês
