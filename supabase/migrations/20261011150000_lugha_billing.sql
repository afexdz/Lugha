begin;
create table public.lugha_memberships (
 user_id uuid primary key references auth.users(id) on delete cascade,
 trial_started_at timestamptz, trial_language text, trial_used integer not null default 0 check(trial_used between 0 and 3),
 profile_id text, paid_until timestamptz, updated_at timestamptz not null default now()
);
create table public.lugha_lesson_sessions (
 user_id uuid not null references auth.users(id) on delete cascade, session_id text not null,
 language text not null, created_at timestamptz not null default now(), primary key(user_id,session_id)
);
create table public.lugha_payment_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 reference text not null, transfer_date date not null, status text not null default 'pending' check(status in ('pending','approved','rejected')),
 amount integer not null default 2000 check(amount=2000), currency text not null default 'dzd' check(currency='dzd'),
 reviewed_by uuid references auth.users(id), review_reason text, created_at timestamptz not null default now(), reviewed_at timestamptz
);
create unique index lugha_one_pending_payment on public.lugha_payment_requests(user_id) where status='pending';
create unique index lugha_approved_transfer on public.lugha_payment_requests(lower(reference),transfer_date) where status='approved';
alter table public.lugha_memberships enable row level security;
alter table public.lugha_lesson_sessions enable row level security;
alter table public.lugha_payment_requests enable row level security;
revoke all on public.lugha_memberships, public.lugha_lesson_sessions, public.lugha_payment_requests from anon,authenticated;
grant all on public.lugha_memberships, public.lugha_lesson_sessions, public.lugha_payment_requests to service_role;

create function public.lugha_access(p_user uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare m public.lugha_memberships; begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 insert into lugha_memberships(user_id) values(p_user) on conflict do nothing;
 select * into m from lugha_memberships where user_id=p_user;
 return jsonb_build_object('status',case when m.paid_until>now() then 'paid' when m.trial_used>=3 or m.trial_started_at+interval '3 days'<=now() then 'expired' else 'trial' end,
 'paidUntil',m.paid_until,'profileId',m.profile_id,'trialStartedAt',m.trial_started_at,'trialEndsAt',m.trial_started_at+interval '3 days','trialUsed',m.trial_used,'trialLanguage',m.trial_language,'trialRemaining',3-m.trial_used);
end $$;

create function public.lugha_reserve_lesson(p_user uuid,p_session text,p_language text,p_profile text) returns jsonb language plpgsql security definer set search_path=public as $$
declare m public.lugha_memberships; begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 if length(p_profile) not between 5 and 80 then raise exception 'Invalid profile';end if;
 if p_language not in ('en','fr','es','de','it','pt','tr','ko','zh','ja','ru','ar','hi','nl','sv') or length(p_session) not between 8 and 80 then raise exception 'Invalid lesson';end if;
 insert into lugha_memberships(user_id) values(p_user) on conflict do nothing;
 select * into m from lugha_memberships where user_id=p_user for update;
 if exists(select 1 from lugha_lesson_sessions where user_id=p_user and session_id=p_session and language<>p_language) then return jsonb_build_object('allowed',false,'reason','session_language');end if;
 if m.profile_id is not null and m.profile_id<>p_profile then return jsonb_build_object('allowed',false,'reason','single_profile');end if;
 -- Expiration is checked even for a previously reserved session.
 if m.paid_until>now() then
  update lugha_memberships set profile_id=coalesce(profile_id,p_profile) where user_id=p_user;
  insert into lugha_lesson_sessions(user_id,session_id,language) values(p_user,p_session,p_language) on conflict do nothing;
  return jsonb_build_object('allowed',true,'status','paid');
 end if;
 if m.trial_started_at+interval '3 days'<=now() then return jsonb_build_object('allowed',false,'reason','trial_expired');end if;
 if m.trial_language is not null and m.trial_language<>p_language then return jsonb_build_object('allowed',false,'reason','trial_language');end if;
 if exists(select 1 from lugha_lesson_sessions where user_id=p_user and session_id=p_session) then return jsonb_build_object('allowed',true,'status','trial');end if;
 if m.trial_used>=3 then return jsonb_build_object('allowed',false,'reason','trial_limit');end if;
 update lugha_memberships set profile_id=coalesce(profile_id,p_profile),trial_started_at=coalesce(trial_started_at,now()),trial_language=coalesce(trial_language,p_language),trial_used=trial_used+1,updated_at=now() where user_id=p_user;
 insert into lugha_lesson_sessions(user_id,session_id,language) values(p_user,p_session,p_language);
 return jsonb_build_object('allowed',true,'status','trial');
end $$;


create function public.lugha_request_payment(p_user uuid,p_reference text,p_date date) returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.lugha_payment_requests; begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 if length(p_reference) not between 4 and 80 or p_date>current_date or p_date<current_date-30 then raise exception 'Invalid transfer';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into o from lugha_payment_requests where user_id=p_user and status='pending';
 if found then return jsonb_build_object('id',o.id,'status',o.status,'existing',true);end if;
 if (select count(*) from lugha_payment_requests where user_id=p_user and created_at>now()-interval '1 day')>=3 then raise exception 'Request rate limit';end if;
 insert into lugha_payment_requests(user_id,reference,transfer_date) values(p_user,p_reference,p_date) returning * into o;
 return jsonb_build_object('id',o.id,'status',o.status);
end $$;
create function public.lugha_payment_status(p_user uuid) returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 return coalesce((select jsonb_build_object('id',id,'status',status,'createdAt',created_at,'reviewedAt',reviewed_at,'reason',review_reason) from lugha_payment_requests where user_id=p_user order by created_at desc limit 1),'{}'::jsonb);
end $$;
create function public.lugha_is_admin(p_user uuid) returns boolean language plpgsql security definer set search_path=public as $$ begin
 if auth.uid() is distinct from p_user then return false;end if;
 return exists(select 1 from admins where user_id=p_user);
end $$;
create function public.lugha_pending_payments() returns jsonb language plpgsql security definer set search_path=public as $$ begin
 if not exists(select 1 from admins where user_id=auth.uid()) then raise exception 'Unauthorized';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'userId',p.user_id,'email',u.email,'reference',p.reference,'transferDate',p.transfer_date,'amount',p.amount,'createdAt',p.created_at) order by p.created_at) from lugha_payment_requests p join auth.users u on u.id=p.user_id where p.status='pending'),'[]'::jsonb);
end $$;
create function public.lugha_review_payment(p_payment uuid,p_admin uuid,p_approve boolean,p_reason text) returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.lugha_payment_requests; begin
 if auth.uid() is distinct from p_admin or not exists(select 1 from admins where user_id=p_admin) then raise exception 'Unauthorized';end if;
 select * into o from lugha_payment_requests where id=p_payment for update;
 if not found then raise exception 'Unknown payment';end if;
 if o.status<>'pending' then return jsonb_build_object('status',o.status,'alreadyReviewed',true);end if;
 update lugha_payment_requests set status=case when p_approve then 'approved' else 'rejected' end,reviewed_by=p_admin,review_reason=left(p_reason,300),reviewed_at=now() where id=o.id;
 if p_approve then
  insert into lugha_memberships(user_id) values(o.user_id) on conflict do nothing;
  perform 1 from lugha_memberships where user_id=o.user_id for update;
  update lugha_memberships set paid_until=greatest(coalesce(paid_until,now()),now())+interval '3 months',updated_at=now() where user_id=o.user_id;
  insert into abonnements(compte_id,actif_jusqua) select user_id,paid_until from lugha_memberships where user_id=o.user_id on conflict(compte_id) do update set actif_jusqua=greatest(abonnements.actif_jusqua,excluded.actif_jusqua);
 end if;
 return jsonb_build_object('status',case when p_approve then 'approved' else 'rejected' end);
end $$;
revoke all on function public.lugha_access(uuid),public.lugha_reserve_lesson(uuid,text,text,text),public.lugha_request_payment(uuid,text,date),public.lugha_payment_status(uuid),public.lugha_pending_payments(),public.lugha_is_admin(uuid),public.lugha_review_payment(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.lugha_access(uuid),public.lugha_reserve_lesson(uuid,text,text,text),public.lugha_request_payment(uuid,text,date),public.lugha_payment_status(uuid),public.lugha_pending_payments(),public.lugha_is_admin(uuid),public.lugha_review_payment(uuid,uuid,boolean,text) to authenticated,service_role;

-- Preserve paid access granted by the pre-existing billing system.
insert into lugha_memberships(user_id,paid_until) select compte_id,actif_jusqua from abonnements where actif_jusqua>now() on conflict(user_id) do update set paid_until=greatest(lugha_memberships.paid_until,excluded.paid_until);
commit;
