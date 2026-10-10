#!/usr/bin/env node
/* ============================================================
   Lugha — tests du moteur anglais (js/engine.js)
   Génère des leçons de façon reproductible (graine fixe) et
   vérifie les invariants qui, s'ils cassent, sanctionnent une
   bonne réponse ou bloquent l'écran.

   Usage : node tools/test-engine.js [nombre=1000] [graine=42]
   Sortie : code 0 si tout passe, 1 sinon.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const N = Number(process.argv[2] || 1000);
const SEED = Number(process.argv[3] || 42);
const ROOT = path.join(__dirname, '..');

// Générateur pseudoaléatoire reproductible (mulberry32)
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

async function loadEngine() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/en/course.json'), 'utf8'));
  const math = Object.create(Math);
  math.random = mulberry32(SEED);
  const window = { LZ: {} };
  const sandbox = {
    window, console, Math: math, setTimeout, clearTimeout, Promise, Date, Set, Map, JSON, Object, Array, Number, String,
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/engine.js'), 'utf8'), sandbox, { filename: 'engine.js' });
  const eng = window.LZ.engine;
  if (eng.ensureA1) await eng.ensureA1();
  else await new Promise(r => setTimeout(r, 50));
  return { eng, data };
}

const target = e => e.w || e.word;
const norm = s => String(s || '').toLowerCase().trim();

function checkExercise(e, fails, ctx) {
  const f = msg => fails.push(`${ctx} [${e.type}] ${msg}`);
  const t = target(e);

  // Les exercices à choix doivent contenir la cible une seule fois,
  // sans deux options affichant le même texte, la même traduction ou la même image.
  if (e.type === 'choice') {
    if (e.options.filter(o => o.id === e.correctChoiceId).length !== 1) f('choice answer not present once');
    if (new Set(e.options.map(o => norm(o.t))).size !== 4) f('choice labels repeat');
    if (!e.prompt) f('choice prompt absent');
  } else if (Array.isArray(e.options) && e.options.length) {
    if (!t) return f('options sans cible (e.w / e.word absent)');
    const hits = e.options.filter(o => o.id === t.id).length;
    if (hits !== 1) f(`cible présente ${hits} fois dans les choix`);
    for (const key of ['t', 'm', 'e']) {
      const vals = e.options.map(o => norm(o[key]));
      if (new Set(vals).size !== vals.length) f(`deux choix identiques sur « ${key} » : ${vals.join(' / ')}`);
    }
  }

  switch (e.type) {
    case 'trueFalse': {
      if (typeof e.correct !== 'boolean') f('clé vrai/faux absente');
      const statementTrue = norm(e.shownFr) === norm(t && t.m);
      if (statementTrue !== e.correct) f(`clé contradictoire : « ${t && t.t} = ${e.shownFr} » attendu ${e.correct}`);
      break;
    }
    case 'oddOneOut': {
      const ids = (e.group || []).map(w => w.id);
      if (!e.intruder || !ids.includes(e.intruder.id)) f(`intrus « ${e.intruder && e.intruder.t} » absent des choix : ${(e.group || []).map(w => w.t).join(' / ')}`);
      if (new Set(ids).size !== ids.length) f('doublon dans le groupe');
      const labels = (e.group || []).map(w => norm(w.t));
      if (new Set(labels).size !== labels.length) f('deux mots identiques dans le groupe');
      break;
    }
    case 'fillBlank':
    case 'listeningCloze': {
      if (!/___/.test(e.masked || '')) f(`phrase sans trou : « ${e.masked} »`);
      if (/^___ \?$/.test(e.masked || '')) f('phrase de repli « ___ ? » (aucune phrase compatible)');
      break;
    }
    case 'anagram': {
      const a = [...(e.letters || [])].sort().join('');
      const b = [...((e.word && e.word.t) || '')].sort().join('');
      if (a !== b) f('lettres ≠ mot');
      if (/\s/.test((e.word && e.word.t) || '')) f(`anagramme sur une expression à espace : « ${e.word.t} »`);
      break;
    }
    case 'match': {
      const pairs = e.pairs || [];
      for (const key of ['t', 'm']) {
        const vals = pairs.map(p => norm(p[key]));
        if (new Set(vals).size !== vals.length) f(`paires ambiguës sur « ${key} »`);
      }
      break;
    }
    case 'build':
      if (!e.ph || !Array.isArray(e.ph.tokens) || !e.ph.tokens.length) f('phrase à construire vide');
      break;
  }
}

(async () => {
  const { eng, data } = await loadEngine();
  const units = data.units.length;
  const counts = {};
  const fails = [];
  let lessons = 0, exercises = 0;

  // Play the complete fresh course, then retry with a different strength profile.
  const seen = new Set();
  for (let ui = 0; ui < units; ui++) {
    for (let li = 0; li < 4; li++) {
      const first = eng.buildA1Lesson(ui, li, {});
      const replay = eng.buildA1Lesson(ui, li, { strength: { en: { 'en-u0-w0': 5 } } });
      if (!first || first.length !== data.units[ui].lessons[li].questions.length) fails.push(`u${ui} l${li}: missing scheduled lesson`);
      if (JSON.stringify(first.map(e => e.questionId)) !== JSON.stringify(replay.map(e => e.questionId))) {
        fails.push(`u${ui} l${li}: curriculum changes with random seed/profile`);
      }
      first.forEach(e => {
        if (!e.questionId || seen.has(e.questionId)) fails.push(`Repeated/missing question ID ${e.questionId}`);
        seen.add(e.questionId);
        if (e.options && e.options.length !== 4) fails.push(`${e.questionId}: fewer than four choices`);
        if (e.options && e.type !== 'choice' && e.options.some(w => w.u > ui)) fails.push(`${e.questionId}: future-unit distractor`);
      });
    }
    if (eng.buildA1Lesson(ui, 4, {}) !== null) fails.push(`u${ui}: chest should not generate a lesson`);
  }
  console.log(`Complete course: ${seen.size} distinct scheduled questions`);

  // 1) Protocole de l'audit : unités i modulo 12, leçon 3, profil vide
  for (let i = 0; i < N; i++) {
    const seq = eng.buildA1Lesson(i % units, 3, {});
    lessons++;
    (seq || []).forEach((e, k) => { exercises++; counts[e.type] = (counts[e.type] || 0) + 1; checkExercise(e, fails, `audit#${i} u${i % units} l3 ex${k}`); });
  }
  // 2) Couverture : toutes les unités, toutes les leçons jouables (0 à 3)
  for (let i = 0; i < N; i++) {
    const ui = i % units, li = Math.floor(i / units) % 4;
    const seq = eng.buildA1Lesson(ui, li, {});
    lessons++;
    (seq || []).forEach((e, k) => { exercises++; counts[e.type] = (counts[e.type] || 0) + 1; checkExercise(e, fails, `cov#${i} u${ui} l${li} ex${k}`); });
  }

  // Résumé par catégorie
  const byKind = {};
  fails.forEach(m => { const k = m.replace(/^.*?\[(\w+)\] /, '$1: ').replace(/[«:].*$/, '').trim(); byKind[k] = (byKind[k] || 0) + 1; });

  console.log(`Graine ${SEED} — ${lessons} leçons, ${exercises} exercices`);
  console.log('Types générés :', JSON.stringify(counts));
  if (!fails.length) { console.log('OK — aucun invariant cassé.'); process.exit(0); }
  console.log(`ÉCHEC — ${fails.length} invariants cassés :`);
  Object.entries(byKind).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${v}\t${k}`));
  console.log('Exemples :'); fails.slice(0, 8).forEach(m => console.log('  - ' + m));
  process.exit(1);
})();
