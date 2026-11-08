-- =============================================================
-- Ca$a — atualização 1: botão "Excluir minha conta" (LGPD)
-- Quem já rodou o schema.sql antes de 08/11/2026 roda só este arquivo.
-- (Quem vai instalar agora não precisa: já está no schema.sql.)
-- =============================================================
create or replace function public.excluir_minha_conta()
returns void language plpgsql security definer set search_path = public, auth as $$
declare f uuid; restantes int;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta primeiro.'; end if;
  select familia_id into f from public.membros where user_id = auth.uid();
  delete from public.membros where user_id = auth.uid();
  if f is not null then
    select count(*) into restantes from public.membros where familia_id = f;
    if restantes = 0 then delete from public.familias where id = f; end if;
  end if;
  delete from auth.users where id = auth.uid();
end $$;
grant execute on function public.excluir_minha_conta() to authenticated;
