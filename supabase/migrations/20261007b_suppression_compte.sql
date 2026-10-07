-- Suppression définitive de son propre compte (exigée aussi par Google Play).
-- À exécuter une fois dans Supabase → SQL Editor.
create or replace function public.supprimer_mon_compte()
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid());
begin
  if me is null then raise exception 'LUGHA:interdit'; end if;
  delete from storage.objects where bucket_id = 'recus' and (storage.foldername(name))[1] = me::text;
  delete from auth.users where id = me;
end; $$;
revoke all on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
