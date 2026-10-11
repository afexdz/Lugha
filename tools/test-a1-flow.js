/* Integration test using a simulated DOM; npm package jsdom is a test-only tool.
   NODE_PATH=/path/to/test/node_modules node tools/test-a1-flow.js */
'use strict';
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root,'content/en/course.json'),'utf8'));
const sleep = ms => new Promise(r => setTimeout(r,ms));
async function setup() {
  const errors = [];
  const logs = new VirtualConsole(); logs.on('jsdomError',e => errors.push(e.message));
  const dom = new JSDOM('<div id="app"></div><div id="modal-root"></div><div id="toasts"></div>', { url:'https://test.invalid/', runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:logs });
  const w=dom.window;
  w.matchMedia=()=>({matches:true}); w.scrollTo=()=>{};
  w.fetch=async()=>({ok:true,json:async()=>structuredClone(data)});
  const timeout=w.setTimeout.bind(w); w.setTimeout=(cb,ms,...args)=>timeout(cb,Math.min(ms,5),...args);
  for (const f of ['data','core','engine']) w.eval(fs.readFileSync(path.join(root,`js/${f}.js`),'utf8'));
  const L=w.LZ; L.render=()=>{}; await L.engine.ensureA1();
  const sounds={};for(const name of Object.keys(L.Sfx)) L.Sfx[name]=()=>{sounds[name]=(sounds[name]||0)+1;};
  L.confetti=()=>()=>{}; L.countUp=(el,n)=>{if(el)el.textContent=n;};
  for (const f of ['app','lesson']) w.eval(fs.readFileSync(path.join(root,`js/${f}.js`),'utf8'));
  const p=L.newProfile({name:'A1 test',age:14});p.lang='en';p.courses.en={done:0};
  L.db.users=[{id:'test',role:'learner',profiles:[p],active:p.id}];L.db.session='test';L.tick(p);
  let queue;const build=L.engine.buildA1Lesson;L.engine.buildA1Lesson=(...args)=>{queue=build(...args);return queue;};
  const cleanups=[]; const app=w.document.querySelector('#app');
  const mount=idx=>{cleanups.splice(0).forEach(f=>f());L.views.lesson(app,{args:[String(idx)]},f=>cleanups.push(f));return queue.slice();};
  return {dom,w,L,p,sounds,errors,app,mount,cleanups};
}
async function until(check,label) {
  for(let i=0;i<100;i++){if(check())return;await sleep(2);}throw new Error('Timeout: '+label);
}
async function answer(s,e,mode='right') {
  const {w}=s,doc=w.document;
  assert(!doc.querySelector('[data-say],[data-slow]'),'Question voice control returned');
  if(mode==='skip'){doc.querySelector('#skip').click();}
  else if(e.type==='match') {
    for(const pair of e.pairs){
      doc.querySelector(`.mt[data-side="l"][data-id="${pair.id}"]`).click();
      doc.querySelector(`.mt[data-side="r"][data-id="${pair.id}"]`).click();
    }
  } else if(e.type==='build') {
    for(const tok of e.ph.tokens){const b=[...doc.querySelectorAll('.bank .tile:not(.used)')].find(b=>b.textContent===tok);assert(b,'Missing phrase tile '+tok);b.click();}
    doc.querySelector('#check').click();
  } else if(e.type==='type') {
    const input=doc.querySelector('#typeIn');input.value=(e.w||e.word).t;input.dispatchEvent(new w.Event('input',{bubbles:true}));doc.querySelector('#check').click();
  } else {
    const t=e.w||e.word;
    const label=e.type==='choice'?e.options.find(o=>o.id===e.correctChoiceId).t:['meaning','pickImage'].includes(e.type)?t.m:t.t;
    const choices=[...doc.querySelectorAll('.opt')];
    const b=choices.find(b=>{const text=b.querySelector('.ot,.pic-t')?.textContent;return mode==='wrong'?text!==label:text===label;});
    assert(b,'Missing answer '+label+' ('+e.type+')');b.click();assert(!doc.querySelector('#check').disabled);doc.querySelector('#check').click();
  }
  await until(()=>doc.querySelector('.l-foot.ok,.l-foot.bad'),'feedback');
  assert.equal(!!doc.querySelector('.l-foot.ok'),mode==='right','Answer graded incorrectly: '+e.questionId);
}
async function play(s,idx,{mistakes=false}={}) {
  const q=s.mount(idx);const doc=s.w.document;
  let wrong=false,skip=false;
  for(let i=0;i<q.length;i++) {
    const e=q[i];let mode='right';
    if(mistakes&&!wrong&&e.type==='choice'){mode='wrong';wrong=true;}
    else if(mistakes&&!skip&&e.type!=='match'){mode='skip';skip=true;}
    await answer(s,e,mode);
    if(mode!=='right')q.push({...e,_retry:true});
    doc.querySelector('#check').click();
  }
  await until(()=>doc.querySelector('#endNext'),'lesson completion');
  for(let guard=0;guard<8&&doc.querySelector('#endNext');guard++){doc.querySelector('#endNext').click();await sleep(10);}
  assert.equal(s.w.location.hash,'#/apprendre','End screens did not return to course');
  await sleep(10);
  assert.equal(s.errors.length,0,'Unhandled DOM errors: '+s.errors.join(' | '));
  return {wrong,skip};
}
(async()=>{
 const s=await setup();
 for(let ui=0;ui<12;ui++){
  for(let li=0;li<4;li++){
   const idx=ui*5+li;await play(s,idx);assert.equal(s.p.courses.en.done,idx+1);
  }
  s.L.views.learn(s.app,{},f=>s.cleanups.push(f));
  const chest=s.app.querySelector(`[data-idx="${ui*5+4}"]`);
  assert(chest,'Missing chest');chest.click();s.app.querySelector('[data-open]').click();
  assert.equal(s.p.courses.en.done,(ui+1)*5,'Chest did not unlock next unit');
  const close=s.w.document.querySelector('[data-close]');if(close)close.click();
  await sleep(10);
 }
 assert.equal(s.p.lessons,48);assert.equal(s.p.courses.en.done,60);
 s.L.views.voyage(s.app,{},()=>{});
 const text=s.app.textContent;
 assert(!/240%/.test(text),'English journey progress exceeds 100%');
 assert(!/48\s*\/\s*20/.test(text),'More stickers shown than exist');
 const r=await play(s,0,{mistakes:true});assert(r.wrong&&r.skip);assert.equal(s.p.courses.en.done,60,'Practice changed progress');
 for(const name of ['tap','ok','pop','bad','done','streak','coin'])assert(s.sounds[name]>0,'Sound hook not reached: '+name);
 console.log('48 A1 lessons + 12 chests completed; replay/wrong/skip/retry, rewards, sounds and journey checked.');
 s.dom.window.close();
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
