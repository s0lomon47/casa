-- =============================================================
-- Ca$a — EXEMPLO: lançar várias contas de uma vez por SQL
-- Valores fictícios. Troque o sobrenome e as contas pelas suas.
-- Rode só DEPOIS de criar a família pelo app.
-- Todas vencem dia 10 (troque depois pelo app, se quiser).
-- =============================================================
do $$
declare
  f uuid;
  mes text := to_char(current_date, 'YYYY-MM');   -- começa no mês atual
begin
  select id into f from public.familias where sobrenome ilike 'Silva' order by criado_em limit 1;  -- << seu sobrenome
  if f is null then raise exception 'Crie a família pelo app antes de rodar este arquivo.'; end if;

  insert into public.contas (familia_id, nome, valor, natureza, tipo, quem, dia, recorrencia, inicio, parcelas) values
    (f, 'Salário Ana',            4200, 'receita', 'Salário', 'Ana',  10, 'mensal',    mes, null),
    (f, 'Salário João',           3500, 'receita', 'Salário', 'João', 10, 'mensal',    mes, null),
    (f, 'Aluguel',                1500, 'despesa', 'Fixa',    'Casa', 10, 'mensal',    mes, null),
    (f, 'Condomínio',              380, 'despesa', 'Fixa',    'Casa', 10, 'mensal',    mes, null),
    (f, 'Energia',                 210, 'despesa', 'Fixa',    'Casa', 10, 'mensal',    mes, null),
    (f, 'Internet',                110, 'despesa', 'Fixa',    'Casa', 10, 'mensal',    mes, null),
    (f, 'Financiamento do carro',  890, 'despesa', 'Parcela', 'Casa', 10, 'parcelado', mes, 10),
    (f, 'Presente de aniversário', 150, 'despesa', 'Outros',  'Casa', 10, 'unica',     mes, null);

  insert into public.aplicacoes (familia_id, nome, instituicao, pct_cdi, saldo_base)
  values (f, 'Reserva de emergência', 'CDB liquidez diária', 100, 0);
end $$;
