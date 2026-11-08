-- =============================================================
-- Ca$a — atualização 2: exclusão de usuário só com confirmação
-- A função antiga (sem parâmetro) é removida, então nenhuma versão
-- antiga do app consegue mais apagar um usuário sem querer.
-- =============================================================
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
