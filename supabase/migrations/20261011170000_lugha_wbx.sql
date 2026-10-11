begin;
create table public.lugha_account_controls (
 user_id uuid primary key references auth.users(id) on delete cascade,
 suspended boolean not null default false, reason text, updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
create table public.lugha_admin_audit (
 id bigint generated always as identity primary key, actor_id uuid references auth.users(id), action text not null,
 target_id uuid, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.lugha_account_controls enable row level security;
alter table public.lugha_admin_audit enable row level security;
revoke all on public.lugha_account_controls,public.lugha_admin_audit from anon,authenticated;

create function public.lugha_wbx_overview(p_days integer default 30) returns jsonb language plpgsql security definer set search_path=public as $$
declare since timestamptz; result jsonb; begin
 if not exists(select 1 from admins where user_id=auth.uid()) then raise exception 'Unauthorized';end if;
 if p_days not in (7,30,90) then raise exception 'Invalid period';end if;
 since=((now() at time zone 'Africa/Algiers')::date-(p_days-1)) at time zone 'Africa/Algiers';
 select jsonb_build_object(
  'days',p_days,'generatedAt',now(),'totalUsers',(select count(*) from auth.users),
  'newUsers',(select count(*) from auth.users where created_at>=since),
  'signedInUsers',(select count(*) from auth.users where last_sign_in_at>=since),
  'activeSubscribers',(select count(*) from lugha_memberships where paid_until>now()),
  'pendingPayments',(select count(*) from lugha_payment_requests where status='pending'),
  'approvedPayments',(select count(*) from lugha_payment_requests where status='approved' and reviewed_at>=since),
  'revenue',(select coalesce(sum(amount),0) from lugha_payment_requests where status='approved' and reviewed_at>=since),
  'suspendedUsers',(select count(*) from lugha_account_controls where suspended),
  'lessonSessions',(select count(*) from lugha_lesson_sessions where created_at>=since),
  'legacyPending',(select count(*) from paiements where statut::text='en_attente'),
  'daily',(select coalesce(jsonb_agg(jsonb_build_object('date',d::date,'users',(select count(*) from auth.users where (created_at at time zone 'Africa/Algiers')::date=d::date),'revenue',(select coalesce(sum(amount),0) from lugha_payment_requests where status='approved' and (reviewed_at at time zone 'Africa/Algiers')::date=d::date)) order by d),'[]'::jsonb) from generate_series((now() at time zone 'Africa/Algiers')::date-(p_days-1),(now() at time zone 'Africa/Algiers')::date,interval '1 day') d),
  'languages',(select coalesce(jsonb_agg(jsonb_build_object('language',language,'sessions',n) order by n desc),'[]'::jsonb) from (select language,count(*) n from lugha_lesson_sessions where created_at>=since group by language) x)
 ) into result;
 return result;
end $$;
create function public.lugha_wbx_users(p_page integer default 0,p_search text default '') returns jsonb language plpgsql security definer set search_path=public as $$
declare term text; result jsonb; begin
 if not exists(select 1 from admins where user_id=auth.uid()) then raise exception 'Unauthorized';end if;
 if p_page<0 or p_page>100000 or length(p_search)>100 then raise exception 'Invalid search';end if;
 term=trim(p_search);
 select jsonb_build_object('page',p_page,'total',(select count(*) from auth.users u left join comptes c on c.id=u.id where term='' or position(lower(term) in lower(coalesce(u.email,'')||' '||coalesce(c.prenom,'')))>0),
 'users',(select coalesce(jsonb_agg(to_jsonb(x) order by x."createdAt" desc),'[]'::jsonb) from (
  select u.id,u.email,c.prenom as name,c.role,u.created_at as "createdAt",u.last_sign_in_at as "lastSignIn",m.paid_until as "paidUntil",coalesce(m.trial_used,0) as "trialUsed",coalesce(a.suspended,false) as suspended,a.reason,
   exists(select 1 from admins where user_id=u.id) as "isAdmin",(select count(*) from profils where compte_id=u.id) as "profileCount",
   (select count(*) from lugha_lesson_sessions where user_id=u.id) as "lessonSessions"
  from auth.users u left join comptes c on c.id=u.id left join lugha_memberships m on m.user_id=u.id left join lugha_account_controls a on a.user_id=u.id
  where term='' or position(lower(term) in lower(coalesce(u.email,'')||' '||coalesce(c.prenom,'')))>0
  order by u.created_at desc,u.id limit 20 offset p_page*20
 ) x)) into result;return result;
end $$;
create function public.lugha_wbx_payments(p_status text default 'pending') returns jsonb language plpgsql security definer set search_path=public as $$ begin
 if not exists(select 1 from admins where user_id=auth.uid()) then raise exception 'Unauthorized';end if;
 if p_status not in ('pending','approved','rejected') then raise exception 'Invalid status';end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x."createdAt" desc) from (
  select p.id,p.user_id as "userId",u.email,p.reference,p.transfer_date as "transferDate",p.amount,p.status,p.created_at as "createdAt",p.reviewed_at as "reviewedAt",p.review_reason as reason
  from lugha_payment_requests p join auth.users u on u.id=p.user_id where p.status=p_status order by p.created_at desc limit 100
 ) x),'[]'::jsonb);
end $$;
create function public.lugha_wbx_manage_user(p_user uuid,p_suspend boolean,p_reason text) returns jsonb language plpgsql security definer set search_path=public as $$ begin
 if not exists(select 1 from admins where user_id=auth.uid()) then raise exception 'Unauthorized';end if;
 if p_user=auth.uid() or exists(select 1 from admins where user_id=p_user) then raise exception 'Administrator account protected';end if;
 if not exists(select 1 from auth.users where id=p_user) or length(trim(p_reason)) not between 3 and 300 then raise exception 'Invalid user or reason';end if;
 insert into lugha_account_controls(user_id,suspended,reason,updated_by) values(p_user,p_suspend,p_reason,auth.uid()) on conflict(user_id) do update set suspended=excluded.suspended,reason=excluded.reason,updated_by=excluded.updated_by,updated_at=now();
 insert into lugha_admin_audit(actor_id,action,target_id,details) values(auth.uid(),case when p_suspend then 'user.suspend' else 'user.restore' end,p_user,jsonb_build_object('reason',p_reason));
 return jsonb_build_object('suspended',p_suspend);
end $$;
create function public.lugha_wbx_audit() returns jsonb language plpgsql security definer set search_path=public as $$ begin
 if not exists(select 1 from admins where user_id=auth.uid()) then raise exception 'Unauthorized';end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x."createdAt" desc) from (
  select a.id,a.action,a.target_id as "targetId",a.details,a.created_at as "createdAt",u.email as actor from lugha_admin_audit a left join auth.users u on u.id=a.actor_id order by a.created_at desc limit 100
 ) x),'[]'::jsonb);
end $$;
create function public.lugha_log_payment_review() returns trigger language plpgsql security definer set search_path=public as $$ begin
 if old.status is distinct from new.status then
  insert into lugha_admin_audit(actor_id,action,target_id,details) values(new.reviewed_by,'payment.'||new.status,new.id,jsonb_build_object('amount',new.amount,'userId',new.user_id,'reason',new.review_reason));
 end if;return new;
end $$;
create trigger lugha_payment_review_audit after update of status on public.lugha_payment_requests for each row execute function public.lugha_log_payment_review();
create function public.lugha_lesson_restriction(p_user uuid) returns boolean language plpgsql security definer set search_path=public as $$ begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 return exists(select 1 from lugha_account_controls where user_id=p_user and suspended);
end $$;
-- Suspension is enforced at the database function as well as in the UI.
alter function public.lugha_reserve_lesson(uuid,text,text,text) rename to lugha_reserve_lesson_unchecked;
revoke all on function public.lugha_reserve_lesson_unchecked(uuid,text,text,text) from public,anon,authenticated,service_role;
create function public.lugha_reserve_lesson(p_user uuid,p_session text,p_language text,p_profile text) returns jsonb language plpgsql security definer set search_path=public as $$ begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 if exists(select 1 from lugha_account_controls where user_id=p_user and suspended) then return jsonb_build_object('allowed',false,'reason','suspended');end if;
 return lugha_reserve_lesson_unchecked(p_user,p_session,p_language,p_profile);
end $$;
revoke all on function public.lugha_wbx_overview(integer),public.lugha_wbx_users(integer,text),public.lugha_wbx_payments(text),public.lugha_wbx_manage_user(uuid,boolean,text),public.lugha_wbx_audit(),public.lugha_log_payment_review(),public.lugha_lesson_restriction(uuid),public.lugha_reserve_lesson(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.lugha_wbx_overview(integer),public.lugha_wbx_users(integer,text),public.lugha_wbx_payments(text),public.lugha_wbx_manage_user(uuid,boolean,text),public.lugha_wbx_audit(),public.lugha_lesson_restriction(uuid),public.lugha_reserve_lesson(uuid,text,text,text) to authenticated;
commit;
