'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const root = path.join(__dirname, '..');
const context = { window: {}, Math, Set };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), context);
context.D = context.window.LISSAN_DATA;
context.shuffle = a => a.slice().reverse();
const lesson = fs.readFileSync(path.join(root, 'js/lesson.js'), 'utf8');
vm.runInContext(lesson.slice(lesson.indexOf('  function buildLesson('), lesson.indexOf('  const rtl =')), context);
vm.runInContext(lesson.slice(lesson.indexOf('  function silentVersion('), lesson.indexOf('  const roman =')), context);
let count = 0;
for (const lang of context.D.order) {
  for (let ui = 0; ui < context.D.units.length; ui++) {
    for (let li = 0; li < 4; li++) {
      const seq = context.buildLesson(lang, ui, li).map(context.silentVersion);
      assert(seq.length);
      for (const e of seq) {
        assert(!['listen','soundImage','dictation','listeningCloze'].includes(e.type));
        if (e.options) assert(e.options.some(o => o.id === e.w.id));
      }
      count++;
    }
  }
}
for (const file of fs.readdirSync(path.join(root,'js')).filter(f => f.endsWith('.js'))) {
  const code = fs.readFileSync(path.join(root,'js',file),'utf8');
  assert(!/speechSynthesis|SpeechSynthesisUtterance|AudioContext|data-say|data-slow|Sfx\.|\bspeak\(/.test(code), file);
}
console.log(`No audio controls/APIs; ${count} legacy lessons across ${context.D.order.length} languages verified.`);
