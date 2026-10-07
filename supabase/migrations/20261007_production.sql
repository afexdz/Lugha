-- ============================================================
-- LUGHA — base de production
-- XP, progression et gemmes calculées côté serveur, classement
-- réel, essai de 7 jours, abonnement 2 000 DA / 3 mois validé
-- par un administrateur à partir d'un reçu BaridiMob.
--
-- Principe : le navigateur ne peut plus écrire directement les
-- valeurs qui comptent (XP, étape, gemmes, série, abonnement).
-- Il passe par des fonctions qui vérifient le propriétaire,
-- l'accès et l'idempotence.
-- ============================================================

-- ---------- Rôle du compte : choisi par l'utilisateur ----------
alter table public.comptes alter column role drop not null;
alter table public.comptes alter column role drop default;

create or replace function prive.nouveau_compte()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.comptes (id, prenom, role)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'prenom'), ''),
                  nullif(trim(new.raw_user_meta_data ->> 'given_name'), ''),
                  nullif(split_part(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ', 1), ''),
                  split_part(new.email, '@', 1)), 40),
    case new.raw_user_meta_data ->> 'role'
      when 'parent' then 'parent'
      when 'apprenant' then 'apprenant'
      when 'learner' then 'apprenant'
      else null end   -- connexion Google : le rôle est demandé au premier passage
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- ---------- Colonnes ajoutées ----------
alter table public.profils add column if not exists classement_visible boolean not null default true;
alter table public.profils add column if not exists dernier_xp_le timestamptz;

-- ---------- Leçons terminées (journal idempotent) ----------
create table if not exists public.lecons_terminees (
  id uuid primary key,                      -- identifiant d'événement fourni par l'appareil
  profil_id uuid not null references public.profils (id) on delete cascade,
  langue text not null,
  etape smallint not null,
  nouvelle boolean not null,
  parfaite boolean not null default false,
  xp integer not null default 0,
  gemmes integer not null default 0,
  cree_le timestamptz not null default now()
);
create index if not exists lecons_terminees_profil_idx on public.lecons_terminees (profil_id, cree_le);
alter table public.lecons_terminees enable row level security;
create policy "leçons de mes profils" on public.lecons_terminees
  for select to authenticated using (prive.est_mon_profil(profil_id));

-- ---------- Administrateurs ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
create policy "je vois si je suis admin" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function prive.est_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function prive.est_admin() from public;
grant execute on function prive.est_admin() to authenticated;

-- ---------- Abonnements et paiements ----------
create table if not exists public.abonnements (
  compte_id uuid primary key references public.comptes (id) on delete cascade,
  actif_jusqua timestamptz not null
);
alter table public.abonnements enable row level security;
create policy "mon abonnement" on public.abonnements
  for select to authenticated using (compte_id = (select auth.uid()));

create table if not exists public.paiements (
  id uuid primary key default gen_random_uuid(),
  compte_id uuid not null default auth.uid() references public.comptes (id) on delete cascade,
  montant integer not null default 2000 check (montant = 2000),
  duree_mois smallint not null default 3 check (duree_mois = 3),
  recu_path text not null,
  reference text check (reference is null or char_length(reference) <= 80),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'valide', 'refuse')),
  motif_refus text,
  cree_le timestamptz not null default now(),
  traite_le timestamptz,
  traite_par uuid
);
-- Un seul reçu en attente à la fois par compte : pas de double envoi
create unique index if not exists paiements_un_en_attente on public.paiements (compte_id) where statut = 'en_attente';
create index if not exists paiements_statut_idx on public.paiements (statut, cree_le);
alter table public.paiements enable row level security;
create policy "mes paiements" on public.paiements
  for select to authenticated using (compte_id = (select auth.uid()) or (select prive.est_admin()));
create policy "envoyer mon reçu" on public.paiements
  for insert to authenticated
  with check (compte_id = (select auth.uid()) and statut = 'en_attente'
              and recu_path like (select auth.uid())::text || '/%');

-- ---------- Droits par colonne : rien de ce qui compte n'est modifiable ----------
revoke insert, update on public.comptes from authenticated, anon;
grant update (prenom, code_parent, role) on public.comptes to authenticated;

revoke insert, update on public.profils from authenticated, anon;
grant insert (compte_id, prenom, avatar, age, type, langue, objectif, motivation, limite_minutes, classement_visible)
  on public.profils to authenticated;
grant update (prenom, avatar, age, langue, objectif, motivation, limite_minutes, classement_visible)
  on public.profils to authenticated;

revoke insert, update, delete on public.cours from authenticated, anon;
revoke insert, update, delete on public.activite from authenticated, anon;
revoke insert, update, delete on public.succes from authenticated, anon;
revoke update on public.mots from authenticated, anon;
revoke all on public.paiements from anon;
revoke update, delete on public.paiements from authenticated;
grant insert (recu_path, reference) on public.paiements to authenticated;
revoke all on public.abonnements, public.admins, public.lecons_terminees from anon;
revoke insert, update, delete on public.abonnements, public.admins, public.lecons_terminees from authenticated;

-- Six profils au plus par compte (cinq enfants + soi)
create or replace function prive.limite_profils()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.profils where compte_id = new.compte_id) >= 6 then
    raise exception 'LUGHA:trop_de_profils';
  end if;
  return new;
end; $$;
create or replace trigger limite_profils before insert on public.profils
  for each row execute function prive.limite_profils();

-- ---------- Accès : essai de 7 jours ou abonnement actif ----------
create or replace function public.mon_acces()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'essai_jusqua', c.cree_le + interval '7 days',
    'abonne_jusqua', a.actif_jusqua,
    'actif', (now() < c.cree_le + interval '7 days') or coalesce(a.actif_jusqua > now(), false),
    'en_essai', now() < c.cree_le + interval '7 days' and not coalesce(a.actif_jusqua > now(), false),
    'paiement_en_attente', exists (select 1 from public.paiements p where p.compte_id = c.id and p.statut = 'en_attente'),
    'dernier_refus', (select p.motif_refus from public.paiements p where p.compte_id = c.id and p.statut = 'refuse' order by p.traite_le desc limit 1),
    'admin', exists (select 1 from public.admins ad where ad.user_id = c.id)
  )
  from public.comptes c left join public.abonnements a on a.compte_id = c.id
  where c.id = (select auth.uid());
$$;

create or replace function prive.a_acces(p_compte uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.comptes c left join public.abonnements a on a.compte_id = c.id
    where c.id = p_compte and ((now() < c.cree_le + interval '7 days') or coalesce(a.actif_jusqua > now(), false))
  );
$$;

-- ---------- Démarrer un cours ----------
create or replace function public.commencer_cours(p_profil uuid, p_langue text, p_depart smallint default 0)
returns smallint language plpgsql security definer set search_path = '' as $$
declare v smallint;
begin
  if not prive.est_mon_profil(p_profil) then raise exception 'LUGHA:interdit'; end if;
  if p_langue not in ('en','fr','es','de','it','pt','tr','ko','zh','ja','ru','ar','hi','nl','sv') then raise exception 'LUGHA:langue'; end if;
  if p_depart not in (0, 5) then raise exception 'LUGHA:depart'; end if;
  insert into public.cours (profil_id, langue, etape) values (p_profil, p_langue, p_depart)
  on conflict (profil_id, langue) do nothing;
  update public.profils set langue = p_langue where id = p_profil;
  select etape into v from public.cours where profil_id = p_profil and langue = p_langue;
  return v;
end; $$;

-- ---------- Terminer une leçon : XP, gemmes, série, étape ----------
-- Idempotent : un même identifiant d'événement ne compte qu'une fois.
create or replace function public.terminer_lecon(
  p_evenement uuid, p_profil uuid, p_langue text, p_etape smallint,
  p_justes smallint, p_total smallint, p_secondes integer default 0, p_mots text[] default '{}')
returns json language plpgsql security definer set search_path = '' as $$
declare
  pr public.profils%rowtype;
  cr public.cours%rowtype;
  deja public.lecons_terminees%rowtype;
  v_jour date := (now() at time zone 'Africa/Algiers')::date;
  v_sem date := date_trunc('week', (now() at time zone 'Africa/Algiers'))::date;
  v_coffre boolean := p_etape % 5 = 4;
  v_nouvelle boolean; v_parfaite boolean;
  v_xp integer := 0; v_gemmes integer := 0; pratiques integer;
begin
  select * into deja from public.lecons_terminees where id = p_evenement;
  if found then
    if not prive.est_mon_profil(deja.profil_id) then raise exception 'LUGHA:interdit'; end if;
    select * into pr from public.profils where id = deja.profil_id;
    return json_build_object('deja', true, 'xp', deja.xp, 'gemmes', deja.gemmes, 'nouvelle', deja.nouvelle,
      'profil', row_to_json(pr), 'etape', (select c2.etape from public.cours c2 where c2.profil_id = deja.profil_id and c2.langue = deja.langue));
  end if;

  if not prive.est_mon_profil(p_profil) then raise exception 'LUGHA:interdit'; end if;
  if not prive.a_acces((select auth.uid())) then raise exception 'LUGHA:acces_expire'; end if;
  if p_langue not in ('en','fr','es','de','it','pt','tr','ko','zh','ja','ru','ar','hi','nl','sv') then raise exception 'LUGHA:langue'; end if;
  if p_etape < 0 or p_etape > 200 or p_total < 0 or p_total > 60 or p_justes < 0 or p_justes > p_total then
    raise exception 'LUGHA:donnees';
  end if;

  -- Verrou sur le profil : deux envois simultanés sont traités l'un après l'autre
  select * into pr from public.profils where id = p_profil for update;
  insert into public.cours (profil_id, langue, etape) values (p_profil, p_langue, 0) on conflict do nothing;
  select * into cr from public.cours where profil_id = p_profil and langue = p_langue for update;
  if p_etape > cr.etape then raise exception 'LUGHA:etape_verrouillee'; end if;

  v_nouvelle := p_etape = cr.etape;
  v_parfaite := not v_coffre and p_total > 0 and p_justes = p_total;

  if v_coffre then
    v_gemmes := case when v_nouvelle then 20 else 0 end;
  else
    select count(*) into pratiques from public.lecons_terminees lt
      where lt.profil_id = p_profil and not lt.nouvelle and lt.cree_le >= (v_jour::timestamp at time zone 'Africa/Algiers');
    if v_nouvelle then v_xp := 10; v_gemmes := case when v_parfaite then 10 else 5 end;
    elsif pratiques < 20 then v_xp := 5;     -- révisions plafonnées à 20 par jour
    end if;
    if v_parfaite and v_xp > 0 then v_xp := v_xp + 5; end if;
    if pr.double_xp_jusqua is not null and pr.double_xp_jusqua > now() then v_xp := v_xp * 2; end if;
  end if;

  if v_nouvelle then update public.cours set etape = etape + 1 where profil_id = p_profil and langue = p_langue; end if;

  -- Semaine, série, totaux
  if pr.semaine is distinct from v_sem then pr.xp_semaine := 0; end if;
  if not v_coffre then
    if pr.dernier_jour is null or pr.dernier_jour < v_jour - 2 or (pr.dernier_jour = v_jour - 2 and pr.gels = 0) then
      pr.serie := 1;
    elsif pr.dernier_jour = v_jour - 2 then
      pr.gels := pr.gels - 1; pr.serie := pr.serie + 1;
    elsif pr.dernier_jour = v_jour - 1 then
      pr.serie := pr.serie + 1;
    end if;
    pr.dernier_jour := v_jour;
  end if;

  update public.profils set
    xp = xp + v_xp,
    xp_semaine = pr.xp_semaine + v_xp,
    semaine = v_sem,
    gemmes = gemmes + v_gemmes,
    serie = pr.serie,
    meilleure_serie = greatest(meilleure_serie, pr.serie),
    dernier_jour = pr.dernier_jour,
    gels = pr.gels,
    lecons = lecons + case when v_coffre then 0 else 1 end,
    lecons_parfaites = lecons_parfaites + case when v_parfaite then 1 else 0 end,
    reponses_justes = reponses_justes + p_justes,
    reponses_total = reponses_total + p_total,
    langue = p_langue,
    dernier_xp_le = case when v_xp > 0 then now() else dernier_xp_le end
  where id = p_profil;

  if not v_coffre then
    insert into public.activite (profil_id, jour, xp, secondes)
    values (p_profil, v_jour, v_xp, least(greatest(p_secondes, 0), 3600))
    on conflict (profil_id, jour) do update
      set xp = public.activite.xp + excluded.xp, secondes = public.activite.secondes + excluded.secondes;
  end if;

  if coalesce(array_length(p_mots, 1), 0) > 0 then
    insert into public.mots (profil_id, langue, mot)
    select p_profil, p_langue, m from unnest(p_mots[1:40]) as m where char_length(m) between 1 and 60
    on conflict do nothing;
  end if;

  insert into public.lecons_terminees (id, profil_id, langue, etape, nouvelle, parfaite, xp, gemmes)
  values (p_evenement, p_profil, p_langue, p_etape, v_nouvelle, v_parfaite, v_xp, v_gemmes);

  select * into pr from public.profils where id = p_profil;
  return json_build_object('deja', false, 'xp', v_xp, 'gemmes', v_gemmes, 'nouvelle', v_nouvelle,
    'profil', row_to_json(pr), 'etape', (select c2.etape from public.cours c2 where c2.profil_id = p_profil and c2.langue = p_langue));
end; $$;

-- ---------- Boutique : dépense de gemmes côté serveur ----------
create or replace function public.acheter(p_profil uuid, p_article text)
returns json language plpgsql security definer set search_path = '' as $$
declare prix integer; pr public.profils%rowtype;
begin
  if not prive.est_mon_profil(p_profil) then raise exception 'LUGHA:interdit'; end if;
  prix := case p_article when 'gel' then 200 when 'coeurs' then 350 when 'double_xp' then 100 else null end;
  if prix is null then raise exception 'LUGHA:article'; end if;
  select * into pr from public.profils where id = p_profil for update;
  if pr.gemmes < prix then raise exception 'LUGHA:gemmes'; end if;
  if p_article = 'gel' and pr.gels >= 2 then raise exception 'LUGHA:deja_max'; end if;
  if p_article = 'double_xp' and pr.double_xp_jusqua > now() then raise exception 'LUGHA:deja_actif'; end if;
  update public.profils set
    gemmes = gemmes - prix,
    gels = gels + case when p_article = 'gel' then 1 else 0 end,
    double_xp_jusqua = case when p_article = 'double_xp' then now() + interval '15 minutes' else double_xp_jusqua end
  where id = p_profil returning * into pr;
  return row_to_json(pr);
end; $$;

-- ---------- Classement de la semaine (vrais élèves uniquement) ----------
-- Seuls le prénom (premier mot) et l'avatar sont visibles.
create or replace function public.classement_semaine(p_profil uuid default null)
returns table (rang bigint, prenom text, avatar text, xp integer, moi boolean)
language sql stable security definer set search_path = '' as $$
  with sem as (select date_trunc('week', (now() at time zone 'Africa/Algiers'))::date as d),
  liste as (
    select p.id, split_part(p.prenom, ' ', 1) as prenom, p.avatar, p.xp_semaine as xp,
           row_number() over (order by p.xp_semaine desc, p.dernier_xp_le asc nulls last, p.id) as rang
    from public.profils p, sem
    where p.semaine = sem.d and p.xp_semaine > 0 and (p.classement_visible or p.id = p_profil)
  )
  select rang, left(prenom, 14), avatar, xp, (id = p_profil and prive.est_mon_profil(p_profil)) as moi
  from liste
  where rang <= 30 or (id = p_profil and prive.est_mon_profil(p_profil))
  order by rang;
$$;

-- ---------- Administration des paiements ----------
create or replace function public.paiements_a_traiter()
returns table (id uuid, cree_le timestamptz, email text, prenom text, reference text, recu_path text, statut text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not prive.est_admin() then raise exception 'LUGHA:interdit'; end if;
  return query
    select p.id, p.cree_le, u.email::text, c.prenom, p.reference, p.recu_path, p.statut
    from public.paiements p join public.comptes c on c.id = p.compte_id join auth.users u on u.id = p.compte_id
    order by (p.statut = 'en_attente') desc, p.cree_le desc
    limit 100;
end; $$;

create or replace function public.valider_paiement(p_paiement uuid)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare c uuid; fin timestamptz;
begin
  if not prive.est_admin() then raise exception 'LUGHA:interdit'; end if;
  update public.paiements set statut = 'valide', traite_le = now(), traite_par = (select auth.uid())
    where id = p_paiement and statut = 'en_attente' returning compte_id into c;
  if c is null then raise exception 'LUGHA:deja_traite'; end if;
  insert into public.abonnements (compte_id, actif_jusqua) values (c, now() + interval '3 months')
  on conflict (compte_id) do update
    set actif_jusqua = greatest(public.abonnements.actif_jusqua, now()) + interval '3 months'
  returning actif_jusqua into fin;
  return fin;
end; $$;

create or replace function public.refuser_paiement(p_paiement uuid, p_motif text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.est_admin() then raise exception 'LUGHA:interdit'; end if;
  update public.paiements set statut = 'refuse', motif_refus = left(coalesce(p_motif, ''), 200),
    traite_le = now(), traite_par = (select auth.uid())
    where id = p_paiement and statut = 'en_attente';
  if not found then raise exception 'LUGHA:deja_traite'; end if;
end; $$;

-- Les fonctions ne sont appelables que par un utilisateur connecté
revoke all on function public.mon_acces(), public.commencer_cours(uuid, text, smallint),
  public.terminer_lecon(uuid, uuid, text, smallint, smallint, smallint, integer, text[]),
  public.acheter(uuid, text), public.classement_semaine(uuid), public.paiements_a_traiter(),
  public.valider_paiement(uuid), public.refuser_paiement(uuid, text) from public, anon;
grant execute on function public.mon_acces(), public.commencer_cours(uuid, text, smallint),
  public.terminer_lecon(uuid, uuid, text, smallint, smallint, smallint, integer, text[]),
  public.acheter(uuid, text), public.classement_semaine(uuid), public.paiements_a_traiter(),
  public.valider_paiement(uuid), public.refuser_paiement(uuid, text) to authenticated;
revoke all on function prive.a_acces(uuid), prive.limite_profils() from public;

-- ---------- Stockage privé des reçus ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recus', 'recus', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "déposer mon reçu" on storage.objects for insert to authenticated
  with check (bucket_id = 'recus' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "voir mes reçus ou admin" on storage.objects for select to authenticated
  using (bucket_id = 'recus' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select prive.est_admin())));

-- ---------- Durcissement (appliqué : lugha_prod_5_durcissement) ----------
revoke truncate on all tables in schema public from anon, authenticated;
revoke delete on public.comptes from anon, authenticated;
