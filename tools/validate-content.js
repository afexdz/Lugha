#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '../content/en/A1.json');
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

data.units.forEach((unit, ui) => {
  const ctx = `Unit[${ui}] "${unit.nom || unit.id}"`;

  if (!unit.id)    fail(`${ctx}: missing "id"`);
  if (!unit.nom)   warn(`${ctx}: missing "nom"`);
  if (!unit.emoji) warn(`${ctx}: missing "emoji"`);

  // Words
  if (!Array.isArray(unit.words)) {
    fail(`${ctx}: missing "words" array`);
  } else {
    if (unit.words.length < 25) warn(`${ctx}: only ${unit.words.length} words (expected 25)`);
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
    if (unit.phrases.length < 10) warn(`${ctx}: only ${unit.phrases.length} phrases (expected 10)`);
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

// Summary
console.log(`\nValidated: ${file}`);
console.log(`  Units : ${data.units.length}`);
console.log(`  Words : ${allWordIds.size}`);
console.log(`  Phrases: ${allPhraseIds.size}`);

if (errors === 0) {
  console.log('\n✓ All checks passed.\n');
} else {
  console.error(`\n✗ ${errors} error(s) found.\n`);
  process.exit(1);
}
