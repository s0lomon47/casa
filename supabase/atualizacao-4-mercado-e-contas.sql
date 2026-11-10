-- =============================================================
-- Ca$a — atualização 4: lista de compras nova e valor só de um mês
-- Pode rodar mais de uma vez sem problema. Não apaga nada.
-- =============================================================

-- Lista de compras: categoria, quantidade e mês em que o item volta do estoque
alter table public.mercado_itens add column if not exists categoria  text not null default '';
alter table public.mercado_itens add column if not exists quantidade int  not null default 1;
alter table public.mercado_itens add column if not exists volta_em   text;

-- Contas: valor diferente só em um mês (ex.: conta de luz) e marcação de pago separada
alter table public.pagamentos add column if not exists pago     boolean not null default true;
alter table public.pagamentos add column if not exists ajustado boolean not null default false;
