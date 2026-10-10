#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '../content/en/course.json');
let data;
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error('Cannot parse JSON:', e.message);
  process.exit(1);
}

let errors = 0;
const fail = msg => { console.error('  FAIL:', msg); errors++; };
const warn = msg => console.warn('  WARN:', msg);

const REQUIRED_WORD = ['id', 't', 'fr', 'e', 'type', 'unite'];
const REQUIRED_PHRASE = ['id', 'tokens', 'fr', 'unite'];

// Top-level fields
if (!data.lang)   fail('Missing top-level "lang"');
if (!data.level)  fail('Missing top-level "level"');
if (!Array.isArray(data.units)) { fail('Missing "units" array'); process.exit(1); }

const allWordIds = new Set();
const allPhraseIds = new Set();
const allQuestionIds = new Set();
const vocabularyTargets = new Set();
const sentenceTargets = new Set();
const matchingTargets = new Set();
const normalize = s => s.trim().toLowerCase().replace(/\s+/g, ' ');

data.units.forEach((unit, ui) => {
  const ctx = `Unit[${ui}] "${unit.nom || unit.id}"`;

  if (!unit.id)    fail(`${ctx}: missing "id"`);
  if (!unit.nom)   warn(`${ctx}: missing "nom"`);
  if (!unit.emoji) warn(`${ctx}: missing "emoji"`);

  // Words
  if (!Array.isArray(unit.words)) {
    fail(`${ctx}: missing "words" array`);
  } else {
    if (unit.words.length < 16) warn(`${ctx}: only ${unit.words.length} words (expected 25)`);
    unit.words.forEach((w, wi) => {
      const wctx = `${ctx} word[${wi}]`;
      REQUIRED_WORD.forEach(f => { if (w[f] === undefined || w[f] === '') fail(`${wctx}: missing "${f}"`); });
      if (typeof w.t !== 'string' || !w.t.trim()) fail(`${wctx}: "t" must be a non-empty string`);
      if (typeof w.fr !== 'string' || !w.fr.trim()) fail(`${wctx}: "fr" must be a non-empty string`);
      if (w.unite !== ui) fail(`${wctx}: "unite" is ${w.unite} but should be ${ui}`);
      if (allWordIds.has(w.id)) fail(`${wctx}: duplicate id "${w.id}"`);
      allWordIds.add(w.id);
    });
  }

  // Phrases
  if (!Array.isArray(unit.phrases)) {
    fail(`${ctx}: missing "phrases" array`);
  } else {
    if (unit.phrases.length < 4) warn(`${ctx}: only ${unit.phrases.length} phrases (expected 10)`);
    unit.phrases.forEach((p, pi) => {
      const pctx = `${ctx} phrase[${pi}]`;
      REQUIRED_PHRASE.forEach(f => { if (p[f] === undefined) fail(`${pctx}: missing "${f}"`); });
      if (!Array.isArray(p.tokens) || p.tokens.length === 0) fail(`${pctx}: "tokens" must be a non-empty array`);
      if (Array.isArray(p.tokens)) {
        p.tokens.forEach((tok, ti) => {
          if (typeof tok !== 'string' || !tok) fail(`${pctx} token[${ti}]: empty or non-string`);
        });
      }
      if (typeof p.fr !== 'string' || !p.fr.trim()) fail(`${pctx}: "fr" must be a non-empty string`);
      if (p.unite !== ui) fail(`${pctx}: "unite" is ${p.unite} but should be ${ui}`);
      if (allPhraseIds.has(p.id)) fail(`${pctx}: duplicate id "${p.id}"`);
      allPhraseIds.add(p.id);
    });
  }
});

// A fresh course must cover distinct questions, independent of RNG or profile strength.
data.units.forEach((unit, ui) => {
  if (!Array.isArray(unit.lessons) || unit.lessons.length !== 4) {
    fail(`Unit ${ui}: expected four playable lessons (the fifth step is a chest)`);
    return;
  }
  const words = new Map(unit.words.map(w => [w.id, w]));
  const phrases = new Map(unit.phrases.map(p => [p.id, p]));
  unit.lessons.forEach((lesson, li) => {
    if (!Array.isArray(lesson.questions) || lesson.questions.length < 8 || lesson.questions.length > 20) {
      fail(`Unit ${ui} lesson ${li}: expected eight to twenty questions`);
      return;
    }
    lesson.questions.forEach(q => {
      if (!q.id || allQuestionIds.has(q.id)) fail(`Missing or duplicate question ID: ${q.id}`);
      allQuestionIds.add(q.id);
      if (q.type === 'build') {
        const phrase = phrases.get(q.phraseId);
        if (!phrase) return fail(`${q.id}: unknown phrase ${q.phraseId}`);
        const key = normalize(phrase.tokens.join(' '));
        if (sentenceTargets.has(key)) fail(`${q.id}: duplicate sentence prompt`);
        sentenceTargets.add(key);
      } else if (['frToEn', 'meaning', 'listen', 'dictation'].includes(q.type)) {
        const word = words.get(q.wordId);
        if (!word) return fail(`${q.id}: unknown word ${q.wordId}`);
        const key = normalize(word.t);
        if (vocabularyTargets.has(key)) fail(`${q.id}: vocabulary target repeated in another question`);
        vocabularyTargets.add(key);
      } else if (q.type === 'choice') {
        if (!Array.isArray(q.choices) || q.choices.length !== 4 || new Set(q.choices.map(normalize)).size !== 4) fail(`${q.id}: expected four distinct choices`);
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) fail(`${q.id}: invalid answer key`);
        const key = normalize([q.passage || '', q.image || '', q.prompt].join(' '));
        if (sentenceTargets.has(key)) fail(`${q.id}: duplicate choice prompt`);
        sentenceTargets.add(key);
        if (!q.explanation) fail(`${q.id}: missing explanation`);
        if (q.image && !fs.existsSync(path.join(__dirname, '..', q.image))) fail(`${q.id}: missing illustration`);
      } else if (q.type === 'match') {
        if (!q.pairIds || q.pairIds.length !== 4 || new Set(q.pairIds).size !== 4) fail(`${q.id}: expected four matching pairs`);
        const pairs = (q.pairIds || []).map(id => words.get(id));
        if (pairs.some(w => !w)) fail(`${q.id}: unknown matching word`);
        else for (const key of ['t','fr']) if (new Set(pairs.map(w => normalize(w[key]))).size !== 4) fail(`${q.id}: ambiguous matching pair`);
        const key = [...(q.pairIds || [])].sort().join('|');
        if (matchingTargets.has(key)) fail(`${q.id}: duplicate matching question`);
        matchingTargets.add(key);
      } else fail(`${q.id}: unsupported bank type ${q.type}`);
      if (!q.objective) fail(`${q.id}: missing learning objective`);
      for (const ref of (q.sourceRefs || unit.sourceRefs || [])) {
        if (!(data.sources || []).some(s => s.id === ref.sourceId)) fail(`${q.id}: unknown source ${ref.sourceId}`);
        if (ref.pdfPages?.some(n => !Number.isInteger(n) || n < 1 || n > data.sources.find(s => s.id === ref.sourceId)?.pages)) fail(`${q.id}: source page out of bounds`);
      }
    });
  });
});

// Summary
console.log(`\nValidated: ${file}`);
console.log(`  Units : ${data.units.length}`);
console.log(`  Words : ${allWordIds.size}`);
console.log(`  Phrases: ${allPhraseIds.size}`);
console.log(`  Questions: ${allQuestionIds.size}`);

if (errors === 0) {
  console.log('\n✓ All checks passed.\n');
} else {
  console.error(`\n✗ ${errors} error(s) found.\n`);
  process.exit(1);
}
