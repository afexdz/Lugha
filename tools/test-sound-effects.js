'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/core.js'), 'utf8');
const effects = code.slice(code.indexOf('  const Sfx ='), code.indexOf('  // ---------- Icônes')) + '\nthis.effects = Sfx;';
let oscillators = 0;
const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
class AudioMock {
  constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; }
  resume() { return Promise.resolve(); }
  createOscillator() { oscillators++; return { frequency: param, connect: g => g, start() {}, stop() {} }; }
  createGain() { return { gain: param, connect() {} }; }
}
const context = { window: { AudioContext: AudioMock }, db: { prefs: { sound: true } } };
vm.createContext(context);
vm.runInContext(effects, context);
const names = ['tap','ok','bad','pop','done','streak','coin'];
for (const name of names) context.effects[name]();
assert.equal(oscillators, 20, 'All seven effects must generate their tones');
context.db.prefs.sound = false;
for (const name of names) context.effects[name]();
assert.equal(oscillators, 20, 'Sound switch must mute all effects');
for (const window of [{}, { AudioContext: class { constructor() { throw new Error('Unavailable'); } } }]) {
  const broken = { window, db: { prefs: { sound: true } } };
  vm.createContext(broken); vm.runInContext(effects, broken);
  for (const name of names) assert.doesNotThrow(() => broken.effects[name]());
}
const lesson = fs.readFileSync(path.join(root, 'js/lesson.js'),'utf8');
for (const name of names) assert(lesson.includes(`Sfx.${name}()`), `${name} missing from lesson feedback`);
assert(fs.readFileSync(path.join(root,'js/app.js'),'utf8').includes('id="snd"'));
console.log('All seven effects play, mute correctly and fail safely; lesson hooks and setting restored.');
