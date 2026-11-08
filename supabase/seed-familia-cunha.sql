-- =============================================================
-- Ca$a — contas iniciais da Família Cunha (da planilha de dezembro/janeiro)
-- Rode SÓ DEPOIS de criar a família "Cunha" pelo app.
-- Todas as contas vencem dia 10 (troque depois pelo app).
-- =============================================================

do $$
declare f uuid;
begin
  select id into f from public.familias where sobrenome ilike 'Cunha' order by criado_em limit 1;
  if f is null then
    raise exception 'Crie a família Cunha pelo app antes de rodar este arquivo.';
  end if;

  if exists (select 1 from public.contas where familia_id = f) then
    raise notice 'A família já tem contas cadastradas. Nada foi alterado.';
    return;
  end if;

  -- Receitas (a partir de dezembro/2026)
  insert into public.contas (familia_id, nome, valor, natureza, tipo, quem, dia, recorrencia, inicio) values
    (f, 'Salário Vanessa', 3386.00, 'receita', 'Salário', 'Vanessa', 10, 'mensal', '2026-12'),
    (f, 'Salário Saymon',  2000.00, 'receita', 'Salário', 'Saymon',  10, 'mensal', '2026-12'),
    (f, 'Apê',              165.00, 'receita', 'Outros',  'Casa',    10, 'mensal', '2026-12'),
    (f, 'Mãe',               73.00, 'receita', 'Outros',  'Casa',    10, 'mensal', '2026-12');

  -- Despesas
  insert into public.contas (familia_id, nome, valor, natureza, tipo, quem, dia, recorrencia, inicio, parcelas) values
    (f, 'Aluguel',               1200.00, 'despesa', 'Fixa',    'Casa',    10, 'mensal',    '2026-12', null),
    (f, 'Caixa - Financiamento',  530.00, 'despesa', 'Fixa',    'Casa',    10, 'mensal',    '2026-12', null),
    (f, 'Faculdade',              286.00, 'despesa', 'Fixa',    'Casa',    10, 'mensal',    '2026-12', null),
    (f, 'Amil',                   207.00, 'despesa', 'Fixa',    'Casa',    10, 'mensal',    '2026-12', null),
    (f, 'Internet',               120.00, 'despesa', 'Fixa',    'Casa',    10, 'mensal',    '2026-12', null),
    (f, 'MRV',                    656.00, 'despesa', 'Parcela', 'Casa',    10, 'parcelado', '2026-12', 4),
    (f, 'Shopee',                  80.94, 'despesa', 'Cartão',  'Saymon',  10, 'mensal',    '2026-12', null),
    (f, 'Shopee',                 214.30, 'despesa', 'Cartão',  'Vanessa', 10, 'mensal',    '2026-12', null),
    (f, 'Mercado Pago',           250.00, 'despesa', 'Cartão',  'Saymon',  10, 'unica',     '2026-12', null);

  -- Reserva de emergência (registre o aporte pelo app quando o dinheiro entrar)
  insert into public.aplicacoes (familia_id, nome, instituicao, pct_cdi, saldo_base, data_base)
  values (f, 'Reserva de emergência', 'CDB liquidez diária', 100, 0, current_date);

  -- Metas combinadas
  update public.familias set limite_mercado = 700, aporte_mensal = 1000, meta_reserva = 11000 where id = f;
end $$;
