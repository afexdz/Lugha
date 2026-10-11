'use strict';
const assert=require('node:assert/strict'),endpoint=require('../api/wbx'),lesson=require('../api/lesson-access');
const old=global.fetch,env={...process.env};let calls=[],suspended=false;
async function call(fn,method,url,body,token){let code,data;await fn({method,url,body,headers:{authorization:token?'Bearer '+token:undefined,origin:'https://www.lugha.world'}},{setHeader(){},status(c){code=c;return this;},json(d){data=d;}});return {code,data};}
(async()=>{try{
process.env.SUPABASE_URL='https://db.example';process.env.SUPABASE_PUBLISHABLE_KEY='public-key';process.env.BILLING_ENABLED='false';
global.fetch=async(url,opt)=>{calls.push({url,opt});const owner=opt.headers.Authorization==='Bearer owner';let data=url.endsWith('/auth/v1/user')?{id:owner?'owner-id':'learner-id'}:url.endsWith('/lugha_is_admin')?owner:url.endsWith('/lugha_lesson_restriction')?suspended:{ok:true};return {ok:true,json:async()=>data};};
assert.equal((await call(endpoint,'GET','/api/wbx')).code,401);
assert.equal((await call(endpoint,'GET','/api/wbx?section=users',{},'learner')).code,403);
assert.equal((await call(endpoint,'GET','/api/wbx?days=8',{},'owner')).code,400);
assert.equal((await call(endpoint,'GET','/api/wbx?section=users&page=-1',{},'owner')).code,400);
assert.equal((await call(endpoint,'GET','/api/wbx?section=payments&status=other',{},'owner')).code,400);
for(const section of ['overview','users','payments','audit'])assert.equal((await call(endpoint,'GET','/api/wbx?section='+section,{},'owner')).code,200);
assert.equal((await call(endpoint,'POST','/api/wbx',{userId:'00000000-0000-4000-8000-000000000001',action:'suspend',reason:'Test local',actor:'forged'},'owner')).code,200);
const args=JSON.parse(calls.at(-1).opt.body);assert.equal(args.p_suspend,true);assert(!('actor' in args));assert.equal(calls.at(-1).opt.headers.Authorization,'Bearer owner');
assert.equal((await call(lesson,'POST','/api/lesson-access',{},'learner')).code,200);
suspended=true;const restricted=await call(lesson,'POST','/api/lesson-access',{},'learner');assert.equal(restricted.code,403);assert.equal(restricted.data.reason,'suspended');
console.log('WBX API: unauthenticated/nonadmin rejection, filters, verified actor, suspension even in free preview passed. RPC calls mocked.');
}finally{global.fetch=old;for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}})().catch(e=>{console.error(e);process.exitCode=1;});
