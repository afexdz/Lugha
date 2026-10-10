/* ============================================================
   Lugha — moteur de contenu anglais A1
   Charge content/en/A1.json et génère des leçons.

   Règles de fiabilité (vérifiées par tools/test-engine.js) :
   - chaque exercice est construit en une seule décision : l'énoncé
     et sa clé de correction viennent du même tirage ;
   - la bonne réponse figure toujours une seule fois parmi les choix ;
   - deux choix n'affichent jamais le même mot, la même traduction
     ou la même image, et un distracteur n'est jamais une traduction
     valable de la cible (ex. « orange » fruit / couleur) ;
   - si la banque ne permet pas un exercice sûr (pas de phrase pour
     un trou, mot trop long pour une anagramme…), on choisit un
     autre type plutôt que de produire une question ambiguë.
   ============================================================ */
(() => {
  'use strict';

  const PER_UNIT = 5;
  const UNIT_COLORS = [
    '#6C4DFF', '#14B8A6', '#F59F00', '#E64980', '#1C7ED6',
    '#4F7CFF', '#A020F0', '#E64980', '#20B26B', '#C92A2A', '#F59F00', '#087F5B'
  ];
  // « L'intrus » ne porte que sur des noms concrets, groupés par thème :
  // famille, nourriture, animaux, école, maison, corps, vêtements,
  // météo, jours. Les mots trop généraux sont exclus, et deux thèmes
  // proches (météo / jours et heures) ne sont jamais opposés.
  const THEME_UNITS = new Set([1, 2, 3, 6, 7, 8, 9, 10, 11]);
  const GENERIC = new Set(['love', 'home', 'family', 'pet', 'body', 'size', 'colour', 'shop',
    'weather', 'season', 'temperature', 'clock', 'name', 'friend', 'class', 'lesson', 'question', 'answer']);
  const CLOSE_THEMES = [[10, 11]];
  const close = (a, b) => CLOSE_THEMES.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

  // ── Chargement avec état explicite ─────────────────────────
  let _a1 = null, _idx = null;
  let status = 'idle', lastError = null, pending = null;

  function load() {
    if (_a1) return Promise.resolve(_a1);
    if (pending) return pending;
    status = 'loading'; lastError = null;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), 12000);
    pending = fetch('content/en/course.json', ctrl ? { signal: ctrl.signal } : undefined)
      .then(r => { if (r.ok === false) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(d => { _a1 = d; _idx = index(d); status = 'ready'; return d; })
      .catch(err => { status = 'error'; lastError = err; throw err; })
      .finally(() => { clearTimeout(timer); pending = null; });
    return pending;
  }
  load().catch(() => {});

  function getStatus() { return { status, error: lastError ? String(lastError.message || lastError) : null }; }
  function getA1Data() { return _a1; }
  function getTotal() { return _a1 ? _a1.units.length * PER_UNIT : 12 * PER_UNIT; }
  function ensureA1() { return load(); }
  function getA1Units() {
    if (!_a1) return null;
    return _a1.units.map((u, i) => ({
      title: u.level + ' · ' + u.nom, sub: u.emoji + ' ' + (u.objectives?.[0] || u.nom),
      icon: u.emoji, color: UNIT_COLORS[i] || '#6C4DFF'
    }));
  }

  // ── Normalisation ──────────────────────────────────────────
  function normalize(w) { return { id: w.id, t: w.t, m: w.fr, e: w.e, r: '', u: w.unite, type: w.type }; }
  function normalizePh(p) { return { tokens: p.tokens, m: p.fr, unit: p.unite }; }
  const low = s => String(s || '').toLowerCase().trim();

  // Index : mots, traductions valables par texte anglais, ambiguïtés
  function index(d) {
    const all = d.units.flatMap(u => u.words.map(normalize));
    const transByEn = new Map(), enByFr = new Map(), countEn = new Map(), countFr = new Map();
    for (const w of all) {
      const t = low(w.t), m = low(w.m);
      if (!transByEn.has(t)) transByEn.set(t, new Set());
      transByEn.get(t).add(m);
      if (!enByFr.has(m)) enByFr.set(m, new Set());
      enByFr.get(m).add(t);
      countEn.set(t, (countEn.get(t) || 0) + 1);
      countFr.set(m, (countFr.get(m) || 0) + 1);
    }
    // Un mot est « ambigu » si son texte anglais ou sa traduction apparaît plusieurs fois
    const ambiguous = new Set(all.filter(w => countEn.get(low(w.t)) > 1 || countFr.get(low(w.m)) > 1).map(w => w.id));
    return { all, transByEn, enByFr, ambiguous };
  }

  // ── Hasard ─────────────────────────────────────────────────
  const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuf = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ── Force des mots (sera remplacée par le modèle de progression) ──
  function getStrengths(profile) {
    if (!profile.strength) profile.strength = {};
    if (!profile.strength.en) profile.strength.en = {};
    return profile.strength.en;
  }
  const wordWeight = (str, id) => 6 - Math.min(5, Math.max(0, str[id] || 0));
  function weightedPick(words, str) {
    const w = words.map(x => wordWeight(str, x.id));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < words.length; i++) { r -= w[i]; if (r <= 0) return words[i]; }
    return words[words.length - 1];
  }
  function updateStrength(profile, wordId, ok) {
    const str = getStrengths(profile);
    str[wordId] = ok ? Math.min(5, (str[wordId] || 0) + 1) : Math.max(0, (str[wordId] || 0) - 1);
  }

  // ── Compatibilité entre deux mots dans un même exercice ────
  // Deux mots peuvent cohabiter s'ils n'affichent ni le même anglais,
  // ni la même traduction, ni la même image, et si aucun n'est une
  // traduction valable de l'autre.
  function clash(a, b) {
    const ta = low(a.t), tb = low(b.t), ma = low(a.m), mb = low(b.m);
    if (a.id === b.id || ta === tb || ma === mb || a.e === b.e) return true;
    const trA = _idx.transByEn.get(ta), trB = _idx.transByEn.get(tb);
    return (trA && trA.has(mb)) || (trB && trB.has(ma));
  }
  function pickCompatible(pool, n, already) {
    const chosen = [...already];
    for (const c of shuf(pool)) {
      if (chosen.length - already.length >= n) break;
      if (!chosen.some(x => clash(x, c))) chosen.push(c);
    }
    return chosen.slice(already.length);
  }
  // Distracteurs : même unité et même nature si possible, puis élargissement
  function distractors(word, n) {
    const others = _idx.all.filter(w => w.id !== word.id && w.u <= word.u);
    const tiers = [
      others.filter(w => w.u === word.u && w.type === word.type),
      others.filter(w => w.u === word.u),
      others.filter(w => w.type === word.type),
      others
    ];
    let picked = [];
    for (const pool of tiers) {
      picked = picked.concat(pickCompatible(pool.filter(w => !picked.some(p => p.id === w.id)), n - picked.length, [word, ...picked]));
      if (picked.length >= n) break;
    }
    return picked.slice(0, n);
  }
  const options = w => shuf([w, ...distractors(w, 3)]);

  // ── Phrases : recherche d'une expression, y compris composée ──
  const isPunct = tok => /^[.,!?;:…]+$/.test(tok);
  function findSpan(tokens, word) {
    const parts = low(word.t).split(/\s+/);
    const toks = tokens.map(low);
    for (let i = 0; i + parts.length <= toks.length; i++) {
      if (parts.every((p, k) => toks[i + k] === p)) return { start: i, len: parts.length };
    }
    return null;
  }
  const joinTokens = toks => toks.reduce((s, t, i) => (i === 0 ? t : isPunct(t) ? s + t : s + ' ' + t), '');
  function clozeFor(word, unit) {
    const units = unit ? [unit, ..._a1.units.filter(u => u !== unit)] : _a1.units;
    for (const u of units) {
      for (const p of shuf(u.phrases)) {
        const span = findSpan(p.tokens, word);
        if (span) {
          const masked = [...p.tokens.slice(0, span.start), '___', ...p.tokens.slice(span.start + span.len)];
          return { masked: joinTokens(masked), full: joinTokens(p.tokens), fr: p.fr, phrase: normalizePh(p) };
        }
      }
    }
    return null;
  }

  // ── Constructeurs d'exercices sûrs ─────────────────────────
  // Chaque constructeur renvoie un exercice cohérent, ou null si la
  // banque ne permet pas de le construire sans ambiguïté.
  const B = {
    intro: w => ({ type: 'intro', w }),
    pickImage: w => ({ type: 'pickImage', w, options: options(w) }),
    pickWord: w => ({ type: 'pickWord', w, options: options(w) }),
    meaning: w => ({ type: 'meaning', w, options: options(w) }),
    listen: w => ({ type: 'pickWord', w, options: options(w) }),
    frToEn: w => ({ type: 'frToEn', w, options: options(w) }),
    soundImage: w => ({ type: 'pickImage', w, options: options(w) }),
    dictation: w => ({ type: 'type', w }),
    fillBlank: (w, unit) => {
      const c = clozeFor(w, unit); if (!c) return null;
      return { type: 'fillBlank', word: w, masked: c.masked, fr: c.fr, options: options(w) };
    },
    listeningCloze: (w, unit) => {
      const c = clozeFor(w, unit); if (!c) return null;
      return { type: 'fillBlank', word: w, masked: c.masked, phrase: c.phrase, fr: c.fr, options: options(w) };
    },
    anagram: w => {
      if (!/^[a-z]{3,8}$/i.test(w.t)) return null;
      let letters = shuf(w.t.split('')), tries = 0;
      while (letters.join('') === w.t && tries++ < 10) letters = shuf(w.t.split(''));
      return { type: 'anagram', word: w, letters };
    },
    // Vrai/faux : la clé est décidée AVANT l'énoncé, en un seul tirage
    trueFalse: w => {
      const correct = Math.random() < 0.5;
      if (correct) return { type: 'trueFalse', word: w, shownFr: w.m, correct: true };
      const valid = _idx.transByEn.get(low(w.t)) || new Set([low(w.m)]);
      const pool = _idx.all.filter(o => o.id !== w.id && !valid.has(low(o.m)) && low(o.t) !== low(w.t));
      const near = pool.filter(o => o.u === w.u);
      const other = rnd(near.length ? near : pool);
      return other ? { type: 'trueFalse', word: w, shownFr: other.m, correct: false } : null;
    },
    // Intrus : le groupe et l'intrus sont construits ensemble
    oddOneOut: (w, unit, ui) => {
      const ok = x => x.type === 'noun' && THEME_UNITS.has(x.u) && !_idx.ambiguous.has(x.id) && !GENERIC.has(low(x.t));
      const order = [ui, ...shuf([..._a1.units.keys()])].filter((u, i, a) => THEME_UNITS.has(u) && a.indexOf(u) === i);
      for (const gu of order) {
        const peers = pickCompatible(_idx.all.filter(x => x.u === gu && ok(x)), 3, []);
        if (peers.length < 3) continue;
        const outPool = _idx.all.filter(x => x.u !== gu && !close(x.u, gu) && ok(x));
        const intruder = pickCompatible(outPool, 1, peers)[0];
        if (!intruder) continue;
        return { type: 'oddOneOut', group: shuf([...peers, intruder]), intruder, theme: _a1.units[gu].nom };
      }
      return null;
    },
    match: pool => {
      const pairs = pickCompatible(pool, 4, []);
      return pairs.length === 4 ? { type: 'match', pairs } : null;
    },
    build: (unit, ui) => {
      const p = unit.phrases.length ? rnd(unit.phrases) : null;
      return p ? { type: 'build', ph: normalizePh(p) } : null;
    }
  };
  // Si un exercice ne peut pas être construit, on se replie sur un type sûr
  const FALLBACK = ['frToEn', 'pickWord', 'meaning', 'pickImage'];
  function make(type, w, unit, ui) {
    const ex = B[type](w, unit, ui);
    if (ex) return ex;
    for (const t of FALLBACK) { const f = B[t](w, unit, ui); if (f) return f; }
    return null;
  }

  // ── Construction d'une leçon ───────────────────────────────
  function buildA1Lesson(ui, li, profile) {
    if (!_a1) return null;
    const unit = _a1.units[ui];
    if (!unit) return null;
    if (!Number.isInteger(li) || li < 0 || li >= PER_UNIT - 1) return null;
    const lesson = unit.lessons && unit.lessons[li];
    if (!lesson) return null;
    const words = new Map(unit.words.map(w => [w.id, normalize(w)]));
    const phrases = new Map(unit.phrases.map(p => [p.id, p]));
    // A unit is a topic/CEFR pool. Reserve at most one fifth per session so
    // four subsequent sessions can exclude this entire set, even on replay.
    const pool = unit.lessons.flatMap(l => l.questions);
    const history = profile?.courses?.en?.questionHistory;
    const recent = new Set((history?.recent || []).slice(-4).flat());
    const seen = history?.seen || {};
    const available = pool.filter(q => !recent.has(q.id));
    const size = Math.min(12, Math.floor(pool.length / 5));
    const fresh = shuf(available.filter(q => !seen[q.id]));
    const review = shuf(available.filter(q => seen[q.id]));
    // Random tie breaks, then least frequently used questions first.
    review.sort((a, b) => seen[a.id] - seen[b.id]);
    // Put a new reading/dialogue activity into the session when available.
    const reading = fresh.find(q => q.objective === 'reading-comprehension');
    const selected = reading
      ? [reading, ...fresh.filter(q => q !== reading).slice(0, size - 1)]
      : fresh.slice(0, size);
    // One eligible older question (8.3% for A1), only after the cooldown.
    if (review.length && selected.length === size && size >= 10) selected.pop();
    selected.push(...review.slice(0, size - selected.length));
    return noConsecutive(shuf(selected).map(q => {
      let ex;
      if (q.type === 'build') ex = { type: 'build', ph: normalizePh(phrases.get(q.phraseId)) };
      else if (q.type === 'match') ex = { type: 'match', pairs: q.pairIds.map(id => words.get(id)) };
      else if (q.type === 'choice') ex = {
        type: 'choice', prompt: q.prompt, passage: q.passage, image: q.image,
        imageAlt: q.imageAlt, explanation: q.explanation,
        options: shuf(q.choices.map((label, i) => ({ id: q.id + '-option-' + i, t: label }))),
        correctChoiceId: q.id + '-option-' + q.answer
      };
      else ex = B[q.type](words.get(q.wordId), unit, ui);
      return { ...ex, questionId: q.id, isReview: !!seen[q.id], objective: q.objective, sourceRefs: q.sourceRefs || unit.sourceRefs };
    }));
  }

  // Called once when a live lesson starts, never on wrong-answer retries.
  // Reserving the full session also prevents quit/reload from bypassing cooldown.
  function recordLessonSelection(profile, exercises) {
    if (!profile || !exercises?.length) return;
    profile.courses ||= {};
    profile.courses.en ||= { done: 0, started: Date.now() };
    const course = profile.courses.en;
    const history = course.questionHistory ||= { recent: [], seen: {} };
    history.recent ||= [];
    history.seen ||= {};
    const ids = [...new Set(exercises.map(e => e.questionId).filter(Boolean))];
    for (const id of ids) history.seen[id] = (history.seen[id] || 0) + 1;
    history.recent = [...history.recent.slice(-3), ids];
  }

  // ── Pas deux fois le même type d'affilée ──────────────────
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
    getA1Data, getTotal, getA1Units, ensureA1, getStatus, reload: () => { status = 'idle'; return load(); },
    normalize, normalizePh, joinTokens,
    buildA1Lesson, recordLessonSelection,
    updateStrength, getStrengths
  };
})();
