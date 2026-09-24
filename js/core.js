/* ============================================================
   LISSAN — noyau partagé
   Utilitaires, stockage local, sons (Web Audio), voix (Speech),
   animations (Motion 12), icônes SVG, mascotte, toasts, modales.
   ============================================================ */
window.LZ = (() => {
  'use strict';
  const D = window.LISSAN_DATA;
  const M = window.Motion || null;

  // ---------- Utilitaires ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toDate = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = toDate(k); d.setDate(d.getDate() + n); return dayKey(d); };
  const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
  const weekKey = (d = new Date()) => { const x = new Date(d); const w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); return dayKey(x); };
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
  const fmtTime = s => `${Math.floor(s / 60)}:${pad(s % 60)}`;
  const hashStr = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.,!?;:'’"¿¡]/g, '').replace(/\s+/g, ' ').trim();
  const loose = s => String(s).toLowerCase().replace(/[.,!?;:"¿¡]/g, '').replace(/’/g, "'").replace(/\s+/g, ' ').trim();

  async function hash(pw) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('lugha:' + pw));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch { return 'h' + hashStr('lugha:' + pw).toString(16); }
  }

  // ---------- Stockage local ----------
  const KEY = 'lugha:v1';
  const fresh = () => ({ users: [], session: null, prefs: { sound: true, theme: 'auto', motion: 'auto' } });
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { db = fresh(); }
  db.prefs = Object.assign(fresh().prefs, db.prefs || {});
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* quota */ } };
  const me = () => db.users.find(u => u.id === db.session) || null;
  const prof = () => { const u = me(); return u ? (u.profiles.find(p => p.id === u.active) || null) : null; };
  const course = p => { if (!p.courses[p.lang]) p.courses[p.lang] = { done: 0, started: Date.now() }; return p.courses[p.lang]; };

  function newProfile({ name, avatar = '🦊', age = null, kind = 'self' }) {
    return {
      id: uid(), name, avatar, age, kind, lang: null, courses: {}, goal: 20, motive: null,
      xp: 0, gems: 150, hearts: 5, heartsAt: Date.now(), streak: 0, bestStreak: 0, lastDay: null, freeze: 0,
      days: {}, time: {}, words: [], perfect: 0, lessons: 0, ans: { ok: 0, n: 0 },
      league: 0, week: weekKey(), weekXp: 0, quest: { day: null }, ach: [], boostUntil: 0,
      limit: 0, created: Date.now()
    };
  }

  // ---------- Règles de jeu ----------
  const MAX_H = 5, HEART_MS = 30 * 60 * 1000;
  const rankOf = xp => { let r = 0; D.ranks.forEach((k, i) => { if (xp >= k.min) r = i; }); return r; };
  const weekProgress = () => { const now = new Date(); const start = toDate(weekKey(now)); return clamp((now - start) / (7 * 864e5), 0.04, 1); };

  function leagueList(p, wk = p.week, final = false) {
    const prog = final ? 1 : weekProgress();
    const r = rng(hashStr(wk + p.id));
    const list = D.bots.map(([name, avatar]) => ({ name, avatar, xp: Math.round((30 + r() * 320) * (1 + p.league * 0.3) * prog) }));
    list.push({ name: p.name, avatar: p.avatar, xp: p.weekXp, me: true });
    return list.sort((a, b) => b.xp - a.xp || (a.me ? -1 : 1));
  }

  function tick(p) {
    if (!p) return;
    const now = Date.now();
    if (p.hearts < MAX_H) {
      const g = Math.floor((now - p.heartsAt) / HEART_MS);
      if (g > 0) { p.hearts = Math.min(MAX_H, p.hearts + g); p.heartsAt = p.hearts >= MAX_H ? now : p.heartsAt + g * HEART_MS; }
    } else p.heartsAt = now;
    const t = dayKey(), y = addDays(t, -1);
    if (p.lastDay && p.lastDay < y && p.streak > 0) {
      const missed = daysBetween(p.lastDay, t) - 1;
      if (p.freeze >= missed && missed <= 2) { p.freeze -= missed; p.lastDay = y; p.flash = `Gel de série utilisé : ta série de ${p.streak} jours est sauvée.`; }
      else p.streak = 0;
    }
    const wk = weekKey();
    if (p.week !== wk) {
      const list = leagueList(p, p.week, true);
      const rank = list.findIndex(x => x.me) + 1;
      if (p.weekXp > 0 && rank <= 5 && p.league < D.leagues.length - 1) { p.league++; p.flash = `Promotion ! Tu passes en ligue ${D.leagues[p.league].name}.`; }
      else if (rank > list.length - 3 && p.league > 0) p.league--;
      p.week = wk; p.weekXp = 0;
    }
    if (!p.quest || p.quest.day !== t) p.quest = { day: t, lessons: 0, combo: 0, claimed: [] };
  }

  const overLimit = p => p.kind === 'child' && p.limit > 0 && (p.time[dayKey()] || 0) >= p.limit * 60;

  function quests(p) {
    const g = p.goal, today = p.days[dayKey()] || 0;
    return [
      { id: 'xp', label: `Gagner ${g} XP`, cur: Math.min(today, g), max: g, icon: 'bolt' },
      { id: 'lessons', label: 'Terminer 2 leçons', cur: Math.min(p.quest.lessons, 2), max: 2, icon: 'book' },
      { id: 'combo', label: "5 bonnes réponses d'affilée", cur: Math.min(p.quest.combo, 5), max: 5, icon: 'target' }
    ];
  }
  function claimQuests(p) {
    quests(p).forEach(q => {
      if (q.cur >= q.max && !p.quest.claimed.includes(q.id)) {
        p.quest.claimed.push(q.id); p.gems += 10;
        toast(`Quête accomplie : ${q.label}. +10 gemmes`, { icon: '🎯' });
      }
    });
  }

  const ACH = [
    { id: 'first', icon: '🌱', title: 'Premier pas', unit: 'leçon terminée', tiers: [1, 10, 50, 150, 400], val: p => p.lessons },
    { id: 'fire', icon: '🔥', title: 'En feu', unit: 'jours de série', tiers: [3, 7, 14, 30, 100], val: p => p.bestStreak },
    { id: 'words', icon: '📚', title: 'Collectionneur', unit: 'mots appris', tiers: [10, 25, 50, 100, 200], val: p => p.words.length },
    { id: 'perfect', icon: '💯', title: 'Sans faute', unit: 'leçons parfaites', tiers: [1, 5, 10, 25, 50], val: p => p.perfect },
    { id: 'xp', icon: '⚡', title: 'Marathon', unit: 'XP au total', tiers: [100, 500, 1000, 2500, 5000], val: p => p.xp },
    { id: 'poly', icon: '🌍', title: 'Polyglotte', unit: 'langues commencées', tiers: [2, 3, 5, 8, 15], val: p => Object.keys(p.courses).length }
  ];
  const achLevel = (a, p) => a.tiers.filter(t => a.val(p) >= t).length;
  function checkAch(p) {
    ACH.forEach(a => {
      const lvl = achLevel(a, p);
      const prev = (p.ach.find(x => x.startsWith(a.id + ':')) || ':0').split(':')[1] | 0;
      if (lvl > prev) {
        p.ach = p.ach.filter(x => !x.startsWith(a.id + ':')); p.ach.push(`${a.id}:${lvl}`);
        toast(`Succès débloqué : ${a.title}, niveau ${lvl}`, { icon: a.icon });
      }
    });
  }

  // ---------- Préférences d'affichage ----------
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => db.prefs.motion === 'reduce' || (db.prefs.motion === 'auto' && mqReduce.matches);
  function applyPrefs() {
    document.documentElement.dataset.theme = db.prefs.theme;
    document.documentElement.classList.toggle('rm', reduced());
  }

  // ---------- Animation (Motion 12, repli propre) ----------
  const spring = (stiffness = 80, damping = 17, mass = 1) => ({ type: 'spring', stiffness, damping, mass });
  const stagger = (s, o) => (M && M.stagger ? M.stagger(s, o) : 0);
  function animate(el, kf, opts = {}) {
    if (!el || (el.length !== undefined && !el.length)) return Promise.resolve();
    const list = el instanceof Element ? [el] : Array.from(el);
    if (!M || reduced()) {
      list.forEach(n => {
        if ('opacity' in kf) n.style.opacity = [].concat(kf.opacity).at(-1);
        n.style.transform = ''; n.style.filter = '';
      });
      return Promise.resolve();
    }
    try { return Promise.resolve(M.animate(list, kf, opts)).catch(() => {}); }
    catch { return Promise.resolve(); }
  }
  function countUp(el, to, { from = 0, dur = 1100, suffix = '', fmt = n => n.toLocaleString('fr-FR') } = {}) {
    if (!el) return;
    if (reduced()) { el.textContent = fmt(to) + suffix; return; }
    const t0 = performance.now();
    const step = t => {
      const k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(from + (to - from) * e)) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function onView(el, cb, amount = 0.3) {
    if (!el) return () => {};
    if (!('IntersectionObserver' in window)) { cb(el); return () => {}; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } }), { threshold: amount });
    io.observe(el);
    return () => io.disconnect();
  }

  // ---------- Sons (Web Audio) ----------
  const Sfx = (() => {
    let ctx;
    const get = () => {
      if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    function play(notes, { type = 'sine', vol = 0.1, len = 0.14, gap = 0.08 } = {}) {
      if (!db.prefs.sound) return;
      const c = get(); if (!c) return;
      const t0 = c.currentTime + 0.01;
      notes.forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(), t = t0 + i * gap;
        o.type = type; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g).connect(c.destination); o.start(t); o.stop(t + len + 0.05);
      });
    }
    return {
      tap: () => play([540], { type: 'triangle', vol: 0.05, len: 0.06 }),
      ok: () => play([659, 880, 1319], { type: 'triangle', gap: 0.07, len: 0.18 }),
      bad: () => play([311, 233], { type: 'sawtooth', vol: 0.04, gap: 0.12, len: 0.2 }),
      pop: () => play([880, 1175], { vol: 0.06, gap: 0.05, len: 0.09 }),
      done: () => play([523, 659, 784, 1047, 1319], { type: 'triangle', gap: 0.1, len: 0.32 }),
      streak: () => play([392, 523, 659, 784, 1047], { type: 'square', vol: 0.035, gap: 0.11, len: 0.26 }),
      coin: () => play([988, 1319], { type: 'square', vol: 0.03, gap: 0.07, len: 0.12 })
    };
  })();

  // ---------- Voix (Speech Synthesis) ----------
  const canSpeak = 'speechSynthesis' in window;
  if (canSpeak) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); }
  function speak(text, lang, rate = 0.85) {
    if (!canSpeak) { toast('La voix n’est pas disponible sur ce navigateur.', { icon: '🔇' }); return; }
    const L = D.langs[lang]; if (!L) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = L.voice; u.rate = rate;
    const code = L.voice.slice(0, 2).toLowerCase();
    const v = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').toLowerCase() === L.voice.toLowerCase())
      || speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(code));
    if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }

  // ---------- Icônes ----------
  const P = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9zM2 9h20M12 21 8 9l4-6 4 6z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    family: '<circle cx="9" cy="7" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.3a4 4 0 0 1 0 7.4M22 21a6.5 6.5 0 0 0-4-6"/>',
    settings: '<path d="M4 6h9m4 0h3M4 12h3m4 0h9M4 18h11m4 0h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    volume: '<path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    next: '<path d="M9 18l6-6-6-6"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    book: '<path d="M4 19V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14"/>',
    gift: '<path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8S9.5 3 7.5 4.5 8.5 8 12 8zM12 8s2.5-5 4.5-3.5S15.5 8 12 8z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    sparkle: '<path d="M12 3c.6 4.8 2.2 6.4 7 7-4.8.6-6.4 2.2-7 7-.6-4.8-2.2-6.4-7-7 4.8-.6 6.4-2.2 7-7z"/>',
    heart: '<path d="M12 20.5s-8-5-8-10.8A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8 3.4c0 5.8-8 10.8-8 10.8z"/>',
    flame: '<path d="M12 22c4.4 0 7-3 7-7 0-4.6-3.6-6.6-4.6-11-2.4 1.6-4.4 4.4-4.4 7.4-1-.6-1.8-1.6-2-3C6.4 10 5 12.4 5 15c0 4 2.6 7 7 7z"/>',
    snow: '<path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/>'
  };
  const FILLED = new Set(['heart', 'flame', 'gem', 'star', 'bolt']);
  const icon = (n, cls = '') => `<svg class="ic ${FILLED.has(n) && cls.includes('fill') ? '' : ''}${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[n] || ''}</svg>`;

  // ---------- Mascotte « Bulle » ----------
  function mascot(mood = 'happy', cls = '') {
    const mouth = {
      happy: '<path d="M48 67q12 13 24 0" fill="none" stroke="#1B1840" stroke-width="4.5" stroke-linecap="round"/>',
      wow: '<path d="M47 64q13 18 26 0z" fill="#1B1840"/><path d="M53 71q7 5 14 0" fill="#FF7FA3"/>',
      sad: '<path d="M50 73q10-8 20 0" fill="none" stroke="#1B1840" stroke-width="4.5" stroke-linecap="round"/>',
      calm: '<path d="M51 68q9 6 18 0" fill="none" stroke="#1B1840" stroke-width="4.5" stroke-linecap="round"/>'
    }[mood] || '';
    const gid = 'mg' + Math.random().toString(36).slice(2, 7);
    return `<svg class="mascot ${cls}" viewBox="0 0 120 120" role="img" aria-label="Bulle, la mascotte de Lugha">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9C84FF"/><stop offset="1" stop-color="#5B3BF0"/></linearGradient></defs>
      <path class="m-accent" d="M70 5l13-3-10 14z" fill="#FFC93C"/>
      <path d="M60 14c26 0 46 17 46 41S86 96 60 96c-6 0-11.6-.9-16.6-2.7L25 103l4.6-16.4C20 79 14 68 14 55 14 31 34 14 60 14z" fill="url(#${gid})"/>
      <ellipse cx="60" cy="36" rx="26" ry="9" fill="#fff" opacity=".16"/>
      <g class="m-eyes"><ellipse cx="45" cy="50" rx="9.5" ry="10.5" fill="#fff"/><ellipse cx="75" cy="50" rx="9.5" ry="10.5" fill="#fff"/>
      <circle cx="47" cy="52" r="5.4" fill="#1B1840"/><circle cx="77" cy="52" r="5.4" fill="#1B1840"/>
      <circle cx="49" cy="49.5" r="1.8" fill="#fff"/><circle cx="79" cy="49.5" r="1.8" fill="#fff"/></g>
      <ellipse cx="35" cy="65" rx="6.5" ry="3.8" fill="#FF8FB1" opacity=".75"/><ellipse cx="85" cy="65" rx="6.5" ry="3.8" fill="#FF8FB1" opacity=".75"/>
      ${mouth}
    </svg>`;
  }

  const logo = () => `<span class="logo-word">lugha<i aria-hidden="true"></i></span>`;

  // ---------- Toasts ----------
  function toast(msg, { icon: ic = '✨', tone = '' } = {}) {
    const root = $('#toasts'); if (!root) return;
    const t = document.createElement('div');
    t.className = 'toast ' + tone; t.setAttribute('role', 'status');
    t.innerHTML = `<span class="toast-ic">${ic}</span><span>${esc(msg)}</span>`;
    root.appendChild(t);
    while (root.children.length > 3) root.firstChild.remove();
    animate(t, { opacity: [0, 1], y: [-36, 0], scale: [0.92, 1] }, spring(420, 26));
    setTimeout(() => { animate(t, { opacity: 0, y: -16 }, { duration: 0.25 }).then(() => t.remove()); }, 3200);
  }

  // ---------- Modales ----------
  function modal(html, { onMount, dismiss = true, cls = '' } = {}) {
    const root = $('#modal-root');
    const w = document.createElement('div');
    w.className = 'modal-wrap';
    w.innerHTML = `<div class="modal-bg"></div><div class="modal ${cls}" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
    root.appendChild(w);
    const box = $('.modal', w), bg = $('.modal-bg', w);
    const prevFocus = document.activeElement;
    let closed = false;
    const close = () => {
      if (closed) return; closed = true;
      document.removeEventListener('keydown', onKey);
      animate(box, { opacity: 0, scale: 0.95, y: 8 }, { duration: 0.16 });
      animate(bg, { opacity: 0 }, { duration: 0.2 }).then(() => { w.remove(); prevFocus && prevFocus.focus && prevFocus.focus(); });
    };
    const onKey = e => {
      if (e.key === 'Escape' && dismiss) close();
      if (e.key === 'Tab') {
        const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', box).filter(n => !n.disabled);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    if (dismiss) bg.addEventListener('click', close);
    $$('[data-close]', box).forEach(b => b.addEventListener('click', close));
    animate(bg, { opacity: [0, 1] }, { duration: 0.2 });
    animate(box, { opacity: [0, 1], scale: [0.9, 1], y: [24, 0] }, spring(380, 26));
    onMount && onMount(box, close);
    const f = $('input, select, button:not([data-close])', box) || box;
    setTimeout(() => f.focus(), 30);
    return close;
  }
  function confirmBox(title, text, okLabel = 'Confirmer', danger = false) {
    return new Promise(res => {
      let answered = false;
      modal(`<h2 class="modal-title">${esc(title)}</h2><p class="modal-text">${esc(text)}</p>
        <div class="modal-actions"><button class="btn btn-ghost" data-no>Annuler</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${esc(okLabel)}</button></div>`,
      { onMount: (box, close) => {
        $('[data-no]', box).onclick = () => { answered = true; close(); res(false); };
        $('[data-yes]', box).onclick = () => { answered = true; close(); res(true); };
        const obs = new MutationObserver(() => { if (!box.isConnected) { obs.disconnect(); if (!answered) res(false); } });
        obs.observe(document.getElementById('modal-root'), { childList: true });
      } });
    });
  }

  // ---------- Confettis (canvas) ----------
  function confetti(canvas, n = 140) {
    if (!canvas || reduced()) return () => {};
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; };
    size();
    const cols = ['#6C4DFF', '#FFC93C', '#FF5E7E', '#22C993', '#4F7CFF', '#FF9F43'];
    const W = canvas.width, parts = Array.from({ length: n }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 16 * dpr, vy: (-Math.random() * 14 - 6) * dpr,
      w: (6 + Math.random() * 6) * dpr, h: (8 + Math.random() * 8) * dpr,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, c: rand(cols)
    }));
    let raf, alive = true;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let any = false;
      parts.forEach(p => {
        p.vy += 0.38 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y < canvas.height + 40) any = true;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); ctx.restore();
      });
      if (any && alive) raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { alive = false; cancelAnimationFrame(raf); };
  }

  // ---------- Pointeur : inclinaison 3D ----------
  const canHover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  function tilt(el, max = 10, { shine = true } = {}) {
    if (!el || !canHover() || reduced()) return () => {};
    const move = e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
      if (shine) { el.style.setProperty('--sx', `${x * 100}%`); el.style.setProperty('--sy', `${y * 100}%`); }
      el.classList.add('tilting');
    };
    const leave = () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.classList.remove('tilting'); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }

  return {
    D, M, $, $$, esc, clamp, rand, shuffle, dayKey, addDays, daysBetween, weekKey, uid, fmtTime, hashStr, rng, norm, loose, hash,
    get db() { return db; }, save, me, prof, course, newProfile,
    MAX_H, HEART_MS, rankOf, leagueList, tick, overLimit, quests, claimQuests, ACH, achLevel, checkAch,
    reduced, applyPrefs, spring, stagger, animate, countUp, onView, Sfx, speak, canSpeak,
    icon, mascot, logo, toast, modal, confirmBox, confetti, tilt, canHover
  };
})();
