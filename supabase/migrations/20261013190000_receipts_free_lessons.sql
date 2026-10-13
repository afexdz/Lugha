begin;
alter table public.lugha_payment_requests add column receipt_path text;
alter table public.lugha_lesson_sessions add column lesson_index integer;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('lugha-receipts','lugha-receipts',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;
create function public.lugha_receipt_upload_allowed() returns boolean language sql security definer set search_path=public as $$ select auth.uid() is not null and (select count(*) from storage.objects where bucket_id='lugha-receipts' and (storage.foldername(name))[1]=auth.uid()::text and created_at>now()-interval '1 day')<5 $$;
revoke all on function public.lugha_receipt_upload_allowed() from public,anon;grant execute on function public.lugha_receipt_upload_allowed() to authenticated;
create policy lugha_receipts_insert on storage.objects for insert to authenticated with check(bucket_id='lugha-receipts' and (storage.foldername(name))[1]=auth.uid()::text and public.lugha_receipt_upload_allowed());
create policy lugha_receipts_read on storage.objects for select to authenticated using(bucket_id='lugha-receipts' and ((storage.foldername(name))[1]=auth.uid()::text or public.lugha_is_admin(auth.uid())));
-- Restrictive policies also protect receipts if another bucket has a broad policy.
create policy lugha_receipts_read_guard on storage.objects as restrictive for select to authenticated using(bucket_id<>'lugha-receipts' or ((storage.foldername(name))[1]=auth.uid()::text or public.lugha_is_admin(auth.uid())));
create policy lugha_receipts_insert_guard on storage.objects as restrictive for insert to authenticated with check(bucket_id<>'lugha-receipts' or ((storage.foldername(name))[1]=auth.uid()::text and public.lugha_receipt_upload_allowed()));
create policy lugha_receipts_anon_guard on storage.objects as restrictive for all to anon using(bucket_id<>'lugha-receipts') with check(bucket_id<>'lugha-receipts');
create policy lugha_receipts_update_guard on storage.objects as restrictive for update to authenticated using(bucket_id<>'lugha-receipts') with check(bucket_id<>'lugha-receipts');
create policy lugha_receipts_delete_guard on storage.objects as restrictive for delete to authenticated using(bucket_id<>'lugha-receipts');
create or replace function public.lugha_access(p_user uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare m public.lugha_memberships;begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 insert into lugha_memberships(user_id) values(p_user) on conflict do nothing;
 select * into m from lugha_memberships where user_id=p_user;
 return jsonb_build_object('status',case when m.paid_until>now() then 'paid' else 'free' end,'paidUntil',m.paid_until,'profileId',m.profile_id,'freeLanguage',m.trial_language,'freeLessons',3,'freeLessonIndices',jsonb_build_array(0,1,2));
end $$;
create function public.lugha_free_lesson_access(p_user uuid,p_session text,p_language text,p_profile text,p_lesson integer) returns jsonb language plpgsql security definer set search_path=public as $$
declare m public.lugha_memberships;begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 if p_lesson is null or p_lesson<0 or p_lesson>1000 or length(p_profile) not between 5 and 80 or length(p_session) not between 8 and 80 or p_language not in ('en','fr','es','de','it','pt','tr','ko','zh','ja','ru','ar','hi','nl','sv') then raise exception 'Invalid lesson';end if;
 if public.lugha_lesson_restriction(p_user) then return jsonb_build_object('allowed',false,'reason','suspended');end if;
 insert into lugha_memberships(user_id) values(p_user) on conflict do nothing;
 select * into m from lugha_memberships where user_id=p_user for update;
 if m.profile_id is not null and m.profile_id<>p_profile then return jsonb_build_object('allowed',false,'reason','single_profile');end if;
 if not coalesce(m.paid_until>now(),false) then
  if p_lesson>2 then return jsonb_build_object('allowed',false,'reason','free_limit');end if;
  if m.trial_language is not null and m.trial_language<>p_language then return jsonb_build_object('allowed',false,'reason','free_language');end if;
 end if;
 if exists(select 1 from lugha_lesson_sessions where user_id=p_user and session_id=p_session and (language<>p_language or lesson_index is distinct from p_lesson)) then return jsonb_build_object('allowed',false,'reason','session_mismatch');end if;
 update lugha_memberships set profile_id=coalesce(profile_id,p_profile),trial_language=coalesce(trial_language,p_language),updated_at=now() where user_id=p_user;
 insert into lugha_lesson_sessions(user_id,session_id,language,lesson_index) values(p_user,p_session,p_language,p_lesson) on conflict do nothing;
 return jsonb_build_object('allowed',true,'status',case when m.paid_until>now() then 'paid' else 'free' end);
end $$;
-- Retire the former time-limited reservation entry point.
revoke all on function public.lugha_reserve_lesson(uuid,text,text,text) from public,anon,authenticated,service_role;
create function public.lugha_submit_receipt(p_user uuid,p_reference text,p_date date,p_receipt text) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 if p_receipt is null or p_receipt not like p_user::text||'/%' or not exists(select 1 from storage.objects where bucket_id='lugha-receipts' and name=p_receipt and metadata->>'mimetype' in ('image/jpeg','image/png','image/webp','application/pdf') and (metadata->>'size')::bigint between 1 and 5242880) then raise exception 'Valid private receipt required';end if;
 result=lugha_request_payment(p_user,p_reference,p_date);
 update lugha_payment_requests set receipt_path=p_receipt,reference=p_reference,transfer_date=p_date where id=(result->>'id')::uuid and receipt_path is null;
 return result;
end $$;
revoke all on function public.lugha_request_payment(uuid,text,date) from public,anon,authenticated,service_role;
alter function public.lugha_review_payment(uuid,uuid,boolean,text) rename to lugha_review_payment_without_receipt;
revoke all on function public.lugha_review_payment_without_receipt(uuid,uuid,boolean,text) from public,anon,authenticated,service_role;
create function public.lugha_review_payment(p_payment uuid,p_admin uuid,p_approve boolean,p_reason text) returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is distinct from p_admin or not public.lugha_is_admin(p_admin) then raise exception 'Unauthorized';end if;
 if p_approve and not exists(select 1 from lugha_payment_requests p join storage.objects o on o.bucket_id='lugha-receipts' and o.name=p.receipt_path where p.id=p_payment) then raise exception 'Receipt required before approval';end if;
 if not p_approve and length(trim(p_reason))<3 then raise exception 'Rejection reason required';end if;
 return lugha_review_payment_without_receipt(p_payment,p_admin,p_approve,p_reason);
end $$;
create or replace function public.lugha_payment_status(p_user uuid) returns jsonb language plpgsql security definer set search_path=public as $$ begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 return coalesce((select jsonb_build_object('id',id,'status',status,'receiptPath',receipt_path,'createdAt',created_at,'reviewedAt',reviewed_at,'reason',review_reason) from lugha_payment_requests where user_id=p_user order by created_at desc limit 1),'{}'::jsonb);
end $$;
create or replace function public.lugha_wbx_payments(p_status text default 'pending') returns jsonb language plpgsql security definer set search_path=public as $$ begin
 if not public.lugha_is_admin(auth.uid()) then raise exception 'Unauthorized';end if;
 if p_status not in ('pending','approved','rejected') then raise exception 'Invalid status';end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x."createdAt" desc) from (
 select p.id,p.user_id as "userId",u.email,p.reference,p.transfer_date as "transferDate",p.amount,p.status,p.receipt_path as "receiptPath",p.created_at as "createdAt",p.reviewed_at as "reviewedAt",p.review_reason as reason from lugha_payment_requests p join auth.users u on u.id=p.user_id where p.status=p_status order by p.created_at desc limit 100
 ) x),'[]'::jsonb);
end $$;
revoke all on function public.lugha_free_lesson_access(uuid,text,text,text,integer),public.lugha_submit_receipt(uuid,text,date,text),public.lugha_review_payment(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.lugha_free_lesson_access(uuid,text,text,text,integer),public.lugha_submit_receipt(uuid,text,date,text),public.lugha_review_payment(uuid,uuid,boolean,text) to authenticated;
commit;
