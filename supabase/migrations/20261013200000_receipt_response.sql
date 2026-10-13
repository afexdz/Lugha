-- Include the stored receipt in the pending confirmation.
create or replace function public.lugha_submit_receipt(p_user uuid,p_reference text,p_date date,p_receipt text) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;begin
 if auth.uid() is distinct from p_user then raise exception 'Unauthorized';end if;
 if p_receipt is null or p_receipt not like p_user::text||'/%' or not exists(select 1 from storage.objects where bucket_id='lugha-receipts' and name=p_receipt and metadata->>'mimetype' in ('image/jpeg','image/png','image/webp','application/pdf') and (metadata->>'size')::bigint between 1 and 5242880) then raise exception 'Valid private receipt required';end if;
 result=lugha_request_payment(p_user,p_reference,p_date);
 update lugha_payment_requests set receipt_path=p_receipt,reference=p_reference,transfer_date=p_date where id=(result->>'id')::uuid and receipt_path is null;
 return result || jsonb_build_object('receiptPath',(select receipt_path from lugha_payment_requests where id=(result->>'id')::uuid));
end $$;
