/* ============================================================
   Lugha — moteur de contenu anglais A1
   Charge content/en/A1.json au démarrage, expose une API
   synchrone une fois les données disponibles.
   ============================================================ */
(() => {
  'use strict';

  const PER_UNIT = 5;
  const UNIT_COLORS = [
    '#6C4DFF','#14B8A6','#F59F00','#E64980','#1C7ED6',
    '#4F7CFF','#A020F0','#E64980','#20B26B','#C92A2A','#F59F00','#087F5B'
  ];

  let _a1 = null;
  // Preload immediately — will be ready long before user starts a lesson
  fetch('content/en/A1.json').then(r => r.json()).then(d => { _a1 = d; }).catch(console.error);

  function getA1Data() { return _a1; }
  function getTotal()  { return _a1 ? _a1.units.length * PER_UNIT : D.units.length * PER_UNIT; }

  // Returns array of unit descriptors matching the shape app.js expects
  function getA1Units() {
    if (!_a1) return null;
    return _a1.units.map((u, i) => ({
      title: u.nom, sub: u.emoji + ' ' + u.nom,
      icon: u.emoji, color: UNIT_COLORS[i] || '#6C4DFF'
    }));
  }

  // Wait up to 3 s for data — resolves immediately if already loaded
  function ensureA1() {
    if (_a1) return Promise.resolve(_a1);
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + 3000;
      const poll = () => {
        if (_a1) return resolve(_a1);
        if (Date.now() > deadline) return reject(new Error('A1 timeout'));
        setTimeout(poll, 60);
      };
      poll();
    });
  }

  // ── Normalisation ──────────────────────────────────────────
  // A1 word {id, t, fr, e, type, unite} → lesson.js shape {id, t, m, e, r, u}
  function normalize(w) {
    return { id: w.id, t: w.t, m: w.fr, e: w.e, r: '', u: w.unite };
  }
  // A1 phrase {id, tokens, fr, unite} → lesson.js shape {tokens, m, unit}
  function normalizePh(p) {
    return { tokens: p.tokens, m: p.fr, unit: p.unite };
  }

  // ── Utilitaires ────────────────────────────────────────────
  const rnd  = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuf = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = 0 | Math.random() * (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ── Répétition espacée ─────────────────────────────────────
  function getStrengths(profile) {
    if (!profile.strength) profile.strength = {};
    if (!profile.strength.en) profile.strength.en = {};
    return profile.strength.en;
  }
  function wordWeight(str, id) { return 6 - Math.min(5, Math.max(0, str[id] || 0)); }
  function weightedPick(words, str) {
    const w = words.map(x => wordWeight(str, x.id));
    const tot = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < words.length; i++) { r -= w[i]; if (r <= 0) return words[i]; }
    return words[words.length - 1];
  }
  function updateStrength(profile, wordId, ok) {
    const str = getStrengths(profile);
    str[wordId] = ok ? Math.min(5, (str[wordId] || 0) + 1) : Math.max(0, (str[wordId] || 0) - 1);
  }

  // ── Distracteurs ───────────────────────────────────────────
  function distractors(word, allWords, n) {
    const sameUnit = allWords.filter(w => w.id !== word.id && w.u === word.u);
    const sameType = sameUnit.filter(w => w.type === word.type);
    const pool = sameType.length >= n ? sameType : (sameUnit.length >= n ? sameUnit : allWords.filter(w => w.id !== word.id));
    return shuf(pool).slice(0, n);
  }

  // ── Construction de leçon A1 ───────────────────────────────
  // Retourne un tableau d'exercices compatible avec les EX de lesson.js,
  // en utilisant les 8 types existants + 8 nouveaux.
  function buildA1Lesson(ui, li, profile) {
    if (!_a1) return null;
    const unit = _a1.units[ui];
    if (!unit) return null;

    const allRaw  = _a1.units.flatMap(u => u.words);
    const allW    = allRaw.map(w => ({ ...normalize(w), type: w.type }));
    const unitW   = unit.words.map(w => ({ ...normalize(w), type: w.type }));
    const str     = profile ? getStrengths(profile) : {};

    // Sélectionne 4-5 mots cibles selon la force
    const n = li <= 1 ? 4 : 5;
    const targets = [];
    const used = new Set();
    for (let i = 0; i < n; i++) {
      const rem = unitW.filter(w => !used.has(w.id));
      if (!rem.length) break;
      const w = profile ? weightedPick(rem, str) : rnd(rem);
      targets.push(w); used.add(w.id);
    }
    const t0 = targets[0], t1 = targets[1] || t0, t2 = targets[2] || t0, t3 = targets[3] || t0;

    const opts  = w => shuf([w, ...distractors(w, allW, 3)]);
    const ph    = unit.phrases.length ? normalizePh(rnd(unit.phrases)) : null;

    // Phrase helper for build exercise
    const buildEx = ph ? (() => {
      const otherTokens = _a1.units.filter((_, i) => i !== ui)
        .flatMap(u => u.phrases.flatMap(p => p.tokens));
      const dis = shuf([...new Set(otherTokens.filter(t => !ph.tokens.includes(t)))]).slice(0, 3);
      return { type: 'build', ph };
    })() : null;

    const seq = [];

    if (li === 0 || li === 1) {
      const [a, b] = li === 0 ? [t0, t1] : [t2, t3];
      seq.push({ type: 'intro',     w: a });
      seq.push({ type: 'pickImage', w: a, options: opts(a) });
      seq.push({ type: 'intro',     w: b });
      seq.push({ type: 'pickImage', w: b, options: opts(b) });
      seq.push({ type: 'listen',    w: a, options: opts(a) });
      seq.push({ type: 'frToEn',    w: b, options: opts(b) });
      seq.push({ type: 'meaning',   w: a, options: opts(a) });
      seq.push(li === 1
        ? { type: 'match', pairs: shuf(unitW.slice(0, 4)) }
        : { type: 'pickWord', w: b, options: opts(b) });
      seq.push({ type: 'soundImage', w: b, options: opts(b) });
    } else if (li === 2) {
      const s = shuf(unitW);
      seq.push({ type: 'pickImage',     w: s[0], options: opts(s[0]) });
      seq.push({ type: 'listen',        w: s[1], options: opts(s[1]) });
      seq.push({ type: 'match',         pairs: shuf(unitW.slice(0, 4)) });
      seq.push({ type: 'frToEn',        w: s[2], options: opts(s[2]) });
      seq.push({ type: 'fillBlank',     word: s[3], masked: makeMasked(s[3], unit), fr: makeFr(s[3], unit), options: opts(s[3]) });
      if (buildEx) seq.push(buildEx);
      seq.push({ type: 'soundImage',    w: s[4] || s[0], options: opts(s[4] || s[0]) });
      seq.push({ type: 'meaning',       w: s[0], options: opts(s[0]) });
    } else {
      const rev = shuf([...unitW, ...shuf(allW.filter(w => w.u < ui)).slice(0, 4)]);
      const g = i => rev[i % rev.length];
      if (buildEx) seq.push(buildEx);
      seq.push({ type: 'listen',        w: g(0), options: opts(g(0)) });
      seq.push({ type: 'match',         pairs: shuf(rev.slice(0, 4)) });
      seq.push({ type: 'oddOneOut',     group: makeOddGroup(g(1), allW), intruder: makeIntruder(g(1), allW) });
      seq.push({ type: 'pickWord',      w: g(2), options: opts(g(2)) });
      seq.push({ type: 'anagram',       word: g(3), letters: shuf(g(3).t.split('')) });
      seq.push({ type: 'listeningCloze',word: g(4), masked: makeMasked(g(4), unit), phrase: findPhrase(g(4), unit), options: opts(g(4)) });
      seq.push({ type: 'dictation',     word: g(5) });
      seq.push({ type: 'trueFalse',     word: g(6), shownFr: makeTFShown(g(6), allW), correct: makeTFCorrect(g(6), allW) });
    }

    noConsecutive(seq);
    return seq;
  }

  // ── Helpers pour exercices ─────────────────────────────────
  function makeMasked(word, unit) {
    const ph = unit.phrases.find(p =>
      p.tokens.some(t => t.toLowerCase() === word.t.toLowerCase())
    );
    if (!ph) return '___ ?';
    return ph.tokens.map(t =>
      t.toLowerCase() === word.t.toLowerCase() ? '___' : t
    ).join(' ');
  }
  function makeFr(word, unit) {
    const ph = unit.phrases.find(p =>
      p.tokens.some(t => t.toLowerCase() === word.t.toLowerCase())
    );
    return ph ? ph.fr : word.m;
  }
  function findPhrase(word, unit) {
    const ph = unit.phrases.find(p =>
      p.tokens.some(t => t.toLowerCase() === word.t.toLowerCase())
    );
    return ph ? normalizePh(ph) : { tokens: [word.t], m: word.fr || word.m, unit: word.u };
  }
  function makeOddGroup(word, allW) {
    const same = allW.filter(w => w.type === word.type && w.id !== word.id);
    const other = allW.filter(w => w.type !== word.type);
    const intruder = other.length ? rnd(other) : rnd(allW.filter(w => w.id !== word.id));
    const peers = shuf(same).slice(0, 2);
    return shuf([word, ...peers, intruder]);
  }
  function makeIntruder(word, allW) {
    const group = makeOddGroup(word, allW);
    return group.find(w => w.type !== word.type) || group[group.length - 1];
  }
  function makeTFCorrect(word, allW) { return Math.random() > 0.5; }
  function makeTFShown(word, allW) {
    const correct = Math.random() > 0.5;
    if (correct) return word.m;
    const other = allW.find(w => w.id !== word.id);
    return other ? other.m : word.m;
  }

  // ── Pas de type consécutif identique ──────────────────────
  function noConsecutive(seq) {
    for (let i = 1; i < seq.length; i++) {
      if (seq[i].type === seq[i - 1].type) {
        for (let j = i + 1; j < seq.length; j++) {
          if (seq[j].type !== seq[i - 1].type) { [seq[i], seq[j]] = [seq[j], seq[i]]; break; }
        }
      }
    }
    return seq;
  }

  // ── Export ─────────────────────────────────────────────────
  const LZ = window.LZ || (window.LZ = {});
  LZ.engine = {
    getA1Data, getTotal, getA1Units, ensureA1,
    normalize, normalizePh,
    buildA1Lesson,
    updateStrength, getStrengths
  };

  // D est disponible car data.js est chargé avant engine.js
  const D = window.LISSAN_DATA;
})();
