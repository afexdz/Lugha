'use strict';
const {PGlite}=require('@electric-sql/pglite');const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create schema auth;create role anon;create role authenticated;create role service_role;create table auth.users(id uuid primary key,email text); create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table public.admins(user_id uuid primary key references auth.users(id));create table public.abonnements(compte_id uuid primary key references auth.users(id),actif_jusqua timestamptz);`);
 const u='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002',owner='00000000-0000-4000-8000-000000000003';
 await db.query('insert into auth.users(id,email) values($1,$2),($3,$4),($5,$6)',[u,'learner@example.test',other,'other@example.test',owner,'owner@example.test']);
 await db.query('insert into admins(user_id) values($1)',[owner]);
 await db.exec(fs.readFileSync('supabase/migrations/20261011150000_lugha_billing.sql','utf8'));
 async function sql(q,args){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[q.includes('lugha_review_payment')?args[1]:args[0]]);return (await db.query(q,args)).rows[0].result;}
 const access=()=>sql('select lugha_access($1) as result',[u]);
 const reserve=(id,language='en',profile='profile-1')=>sql('select lugha_reserve_lesson($1,$2,$3,$4) as result',[u,id,language,profile]);
 assert.equal((await access()).trialRemaining,3);
 assert.equal((await reserve('session-1')).allowed,true);
 assert.equal((await reserve('session-1')).allowed,true);assert.equal((await access()).trialUsed,1);
 assert.equal((await reserve('session-2','fr')).reason,'trial_language');
 assert.equal((await reserve('session-2','en','profile-2')).reason,'single_profile');
 const concurrent=await Promise.all([reserve('session-2'),reserve('session-3'),reserve('session-4')]);assert.equal(concurrent.filter(r=>r.allowed).length,2);assert.equal((await access()).trialUsed,3);
 assert.equal((await reserve('session-5')).allowed,false);
 await db.query("update lugha_memberships set trial_started_at=now()-interval '4 days' where user_id=$1",[u]);assert.equal((await reserve('session-1')).reason,'trial_expired');
 const declare=()=>sql('select lugha_request_payment($1,$2,current_date) as result',[u,'TEST-REFERENCE-001']);
 const p=await declare();assert.equal((await declare()).id,p.id);assert.equal((await access()).status,'expired');
 const approve=()=>sql('select lugha_review_payment($1,$2,true,$3) as result',[p.id,owner,'Received in test ledger']);
 assert.equal((await approve()).status,'approved');const expiry=(await access()).paidUntil;assert.equal((await access()).status,'paid');assert.equal((await approve()).alreadyReviewed,true);assert.equal((await access()).paidUntil,expiry);
 assert.equal((await reserve('session-6','fr')).allowed,true);assert.equal((await reserve('session-7','fr','profile-2')).allowed,false);
 const dup=await sql('select lugha_request_payment($1,$2,current_date) as result',[other,'TEST-REFERENCE-001']);
 await assert.rejects(sql('select lugha_review_payment($1,$2,true,$3) as result',[dup.id,owner,'Duplicate transfer']));
 assert.equal((await sql('select lugha_access($1) as result',[other])).status,'trial');
 await db.exec('set role authenticated');await assert.rejects(db.query('select * from lugha_memberships'));await db.query("select set_config('request.jwt.claim.sub',$1,false)",[u]);await db.query('select lugha_access($1)',[u]);await assert.rejects(db.query('select lugha_access($1)',[other]));await assert.rejects(db.query('select lugha_pending_payments()'));await assert.rejects(db.query('select lugha_review_payment($1,$2,true,$3)',[p.id,u,'Invalid self-approval']));
 console.log('Actual PostgreSQL (PGlite): migration, 3-lesson limit, duplicate reservations, expiry, one language/profile, pending payment, approval, idempotency, duplicate transfer and client permissions passed. No production database changed.');
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
