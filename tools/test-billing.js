'use strict';
const assert=require('node:assert/strict');
const B=require('../server/billing.cjs');
const endpoints=Object.fromEntries(['membership','lesson-access','payment-request','payment-status','payment-admin','billing-config'].map(n=>[n,require('../api/'+n)]));
const env={...process.env},originalFetch=global.fetch;
async function call(name,method='POST',body={},headers={}){let code,data;const r={method,body,headers};const res={setHeader(){},status(n){code=n;return this;},json(d){data=d;return this;}};await endpoints[name](r,res);return {code,data};}
(async()=>{try{
 assert.equal((await call('membership','GET')).code,401);
 process.env.SUPABASE_URL='https://db.example';process.env.SUPABASE_PUBLISHABLE_KEY='public-test-key';process.env.APP_ORIGIN='https://www.lugha.world';process.env.BILLING_ADMIN_USER_IDS='owner-1';process.env.BILLING_ENABLED='false';
 assert.equal((await call('membership','GET')).code,401);
 let calls=[];global.fetch=async(url,options={})=>{calls.push({url,options});const data=url.endsWith('/lugha_lesson_restriction')?false:url.endsWith('/lugha_is_admin')?options.headers.Authorization==='Bearer owner':url.endsWith('/auth/v1/user')?{id:options.headers.Authorization==='Bearer owner'?'owner-1':'user-1'}:{status:'pending',id:'payment-1'};return {ok:true,json:async()=>data};};
 const auth={authorization:'Bearer user',origin:'https://www.lugha.world'},owner={...auth,authorization:'Bearer owner'};
 const today=new Date().toISOString().slice(0,10),payment={reference:'TRX-12345',transferDate:today,amount:1,receiptPath:'user-1/00000000-0000-4000-8000-000000000009.pdf'};
 assert.equal((await call('payment-request','POST',payment,auth)).code,503);
 assert.equal((await call('billing-config','GET')).data.enabled,false);
 process.env.BILLING_ENABLED='true';
 assert.equal((await call('payment-request','POST',payment,{...auth,origin:'https://evil.example'})).code,403);
 assert.equal((await call('payment-request','POST',{...payment,transferDate:'2026-02-30'},auth)).code,400);
 calls=[];assert.equal((await call('payment-request','POST',payment,auth)).code,200);
 assert.equal((await call('payment-request','POST',{...payment,receiptPath:'other-user/00000000-0000-4000-8000-000000000009.pdf'},auth)).code,400);
 const declaration=JSON.parse(calls.find(c=>c.url.endsWith('/lugha_submit_receipt')).options.body);assert.equal(declaration.p_user,'user-1');assert(!('amount' in declaration));assert.equal(B.PLAN.amount,2000);assert.equal(B.PLAN.profiles,1);
 assert.equal((await call('payment-admin','GET',{},auth)).code,403);
 const decision={paymentId:'00000000-0000-4000-8000-000000000001',action:'approve',reason:''};
 assert.equal((await call('payment-admin','POST',decision,owner)).code,400);
 calls=[];assert.equal((await call('payment-admin','POST',{...decision,receivedVerified:true},owner)).code,200);
 const review=JSON.parse(calls.find(c=>c.url.endsWith('/lugha_review_payment')).options.body);assert.equal(review.p_admin,'owner-1');assert.equal(review.p_approve,true);
 assert.equal((await call('lesson-access','POST',{sessionId:'session-123',language:'en',profileId:'profile-123',lessonIndex:0},auth)).code,403); // mock has no allowed flag
 console.log('Baridi: fixed 2000 DA / one profile, authentication, origin, disabled payments, date validation, user/admin separation and mandatory receipt verification passed. Database calls mocked.');
}finally{global.fetch=originalFetch;for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);}})().catch(e=>{console.error(e);process.exitCode=1;});
