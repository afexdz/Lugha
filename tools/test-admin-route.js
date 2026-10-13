'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
async function scenario(isAdmin,metadataRole='learner',existing=false){
 const user={id:'u1',email:'owner@example.test',user_metadata:{role:metadataRole}};
 const db={users:existing?[{id:'u1',role:'learner',profiles:[{id:'old',lang:'en'}],active:'old'}]:[],session:null};
 const redirects=[];let profiles=0,learners=0,callback;
 const app={innerHTML:''},modal={innerHTML:''},retry={};
 const LZ={db,$:s=>s==='#modal-root'?modal:retry,me:()=>db.users.find(u=>u.id===db.session),prof:()=>db.users[0]?.profiles[0],tick(){},save(){},applyPrefs(){},views:{learn(){},home(){}},billing:{offer(){}},wbx:{view(){}},shell(){learners++;},newProfile(){profiles++;return {id:'new',lang:'fr'};},sb:{auth:{getSession:async()=>({data:{session:{user,access_token:'token'}}}),onAuthStateChange:f=>{callback=f;}}}};
 const context={LZ,document:{getElementById:id=>id==='app'?app:null,body:{dataset:{}}},location:{pathname:'/',hash:'#/apprendre',replace:p=>redirects.push(p)},window:{scrollTo(){}},URLSearchParams,AbortSignal,fetch:async()=>({ok:true,json:async()=>({isAdmin})}),matchMedia:()=>({}),addEventListener(){},console};
 vm.runInNewContext(fs.readFileSync('js/main.js','utf8'),context);
 await new Promise(r=>setImmediate(r));
 assert.equal(db.users[0].role,isAdmin?'admin':metadataRole==='parent'?'parent':'learner');
 if(isAdmin){assert.deepEqual(redirects,['/wbx']);assert.equal(profiles,0);assert.equal(learners,0);assert.equal(db.users[0].profiles.length,existing?1:0);}
 else {assert.equal(redirects.length,0);assert.equal(learners,1);assert.equal(profiles,1);}
 await callback('SIGNED_OUT',null);assert.equal(db.session,null);
}
(async()=>{await scenario(true);await scenario(true,'learner',true);await scenario(false);await scenario(false,'admin');console.log('Admin routing: verified role, no learner creation/render, existing data preserved, forged metadata rejected, logout passed.');})().catch(e=>{console.error(e);process.exitCode=1;});
