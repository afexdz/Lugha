/* ============================================================
   LISSAN — moteur de leçon
   Exercices : nouveau mot, trouve l'image, comment dit-on, que veut dire,
   écoute et choisis, relie les paires, construis la phrase, écris le mot.
   ============================================================ */
(() => {
  'use strict';
  const {
    D, $, $$, esc, rand, shuffle, clamp, dayKey, addDays, fmtTime, loose, norm, save, prof, course,
    MAX_H, rankOf, overLimit, claimQuests, checkAch, animate, spring, stagger, countUp, speak, canSpeak,
    icon, mascot, toast, modal, confirmBox, confetti, Sfx
  } = LZ;
  const PER_UNIT = 5, TOTAL = D.units.length * PER_UNIT;

  // ---------- Construction d'une leçon ----------
  function buildLesson(lang, ui, li) {
    const all = D.words(lang);
    const unitW = all.filter(w => w.u === ui);
    const prev = all.filter(w => w.u < ui);
    const pool = all.filter(w => w.u <= ui);
    const latin = D.langs[lang].latin;
    const ph = D.phrase(lang, ui);
    const typeOr = w => latin ? { type: 'type', w } : { type: 'meaning', w };
    let seq;
    if (li === 0 || li === 1) {
      const [a, b] = li === 0 ? unitW.slice(0, 2) : unitW.slice(2, 4);
      seq = [
        { type: 'intro', w: a }, { type: 'pickImage', w: a },
        { type: 'intro', w: b }, { type: 'pickImage', w: b },
        { type: 'listen', w: a }, { type: 'pickWord', w: b }, { type: 'meaning', w: a },
        li === 1 ? { type: 'match', pairs: shuffle(unitW) } : typeOr(b),
        { type: 'listen', w: b }
      ];
    } else if (li === 2) {
      const s = shuffle(unitW);
      seq = [
        { type: 'pickImage', w: s[0] }, { type: 'listen', w: s[1] }, { type: 'match', pairs: shuffle(unitW) },
        { type: 'pickWord', w: s[2] }, typeOr(s[3]), { type: 'build', ph }, { type: 'listen', w: s[2] }, { type: 'meaning', w: s[0] }
      ];
    } else {
      const rev = shuffle([...unitW, ...shuffle(prev).slice(0, 4)]);
      const g = i => rev[i % rev.length];
      seq = [
        { type: 'build', ph }, { type: 'listen', w: g(0) }, { type: 'match', pairs: shuffle(rev).slice(0, 4) },
        typeOr(g(1)), { type: 'pickWord', w: g(2) }, { type: 'listen', w: g(3) }, { type: 'meaning', w: g(4) },
        typeOr(g(5)), { type: 'pickImage', w: g(6) }
      ];
    }
    const opt = w => shuffle([w, ...shuffle(pool.filter(x => x.id !== w.id)).slice(0, 3)]);
    seq.forEach(e => { if (['pickImage', 'pickWord', 'meaning', 'listen'].includes(e.type)) e.options = opt(e.w); });
    return seq;
  }

  const rtl = lang => D.langs[lang].rtl ? 'dir="rtl"' : '';
  const roman = w => w.r ? `<p class="roman">${esc(w.r)}</p>` : '';

  // ---------- Options à choix ----------
  function selectable(card, ctx, onPick) {
    const s = { i: null };
    $$('.opt', card).forEach(b => b.addEventListener('click', () => {
      if (ctx.locked()) return;
      s.i = +b.dataset.i;
      $$('.opt', card).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      animate(b, { scale: [0.94, 1] }, spring(600, 18));
      Sfx.tap(); ctx.setReady(true);
      onPick && onPick(s.i);
    }));
    return s;
  }

  // ---------- Exercices ----------
  const EX = {
    intro(card, e, ctx) {
      card.innerHTML = `<p class="new-tag">${icon('sparkle')}Nouveau mot</p>
        <div class="intro-card"><span class="ic-e">${e.w.e}</span>
          <b class="ic-t" ${rtl(ctx.lang)}>${esc(e.w.t)}</b>${roman(e.w)}
          <p class="ic-m">${esc(e.w.m)}</p>
          <button class="say-btn" data-say aria-label="Écouter">${icon('volume')}</button></div>`;
      $('[data-say]', card).addEventListener('click', () => speak(e.w.t, ctx.lang));
      setTimeout(() => speak(e.w.t, ctx.lang), 450);
      animate($('.intro-card', card), { rotateY: [-90, 0], opacity: [0, 1] }, spring(140, 16));
      ctx.setReady(true);
      return { check: () => ({ ok: true }) };
    },
    pickImage(card, e, ctx) {
      card.innerHTML = `<h2 class="ex-title">Lequel est « <span class="tw" ${rtl(ctx.lang)}>${esc(e.w.t)}</span> » ?</h2>
        <div class="ex-sub">${roman(e.w)}<button class="say-mini" data-say aria-label="Écouter">${icon('volume')}</button></div>
        <div class="opts grid">${e.options.map((o, i) => `<button class="opt pic" data-i="${i}" aria-pressed="false"><span class="pic-e">${o.e}</span><span class="pic-t">${esc(o.m)}</span><kbd>${i + 1}</kbd></button>`).join('')}</div>`;
      $('[data-say]', card).addEventListener('click', () => speak(e.w.t, ctx.lang));
      setTimeout(() => speak(e.w.t, ctx.lang), 300);
      const s = selectable(card, ctx);
      return { check: () => ({ ok: e.options[s.i].id === e.w.id, answer: `${e.w.e} ${e.w.m}`, pick: s.i }) };
    },
    pickWord(card, e, ctx) {
      card.innerHTML = `<h2 class="ex-title">Comment dit-on « ${esc(e.w.m)} » ?</h2>
        <div class="big-e">${e.w.e}</div>
        <div class="opts list">${e.options.map((o, i) => `<button class="opt" data-i="${i}" aria-pressed="false"><kbd>${i + 1}</kbd><span class="ot" ${rtl(ctx.lang)}>${esc(o.t)}</span>${o.r ? `<small>${esc(o.r)}</small>` : ''}</button>`).join('')}</div>`;
      const s = selectable(card, ctx, i => speak(e.options[i].t, ctx.lang));
      return { check: () => ({ ok: e.options[s.i].id === e.w.id, answer: e.w.t, say: e.w.t, pick: s.i }) };
    },
    meaning(card, e, ctx) {
      card.innerHTML = `<h2 class="ex-title">Que veut dire ce mot ?</h2>
        <div class="speech">${mascot('happy')}<button class="bubble" data-say aria-label="Écouter le mot">${icon('volume')}<span ${rtl(ctx.lang)}>${esc(e.w.t)}</span>${e.w.r ? `<small>${esc(e.w.r)}</small>` : ''}</button></div>
        <div class="opts list">${e.options.map((o, i) => `<button class="opt" data-i="${i}" aria-pressed="false"><kbd>${i + 1}</kbd><span class="ot">${esc(o.m)}</span></button>`).join('')}</div>`;
      $('[data-say]', card).addEventListener('click', () => speak(e.w.t, ctx.lang));
      setTimeout(() => speak(e.w.t, ctx.lang), 300);
      const s = selectable(card, ctx);
      return { check: () => ({ ok: e.options[s.i].id === e.w.id, answer: e.w.m, pick: s.i }) };
    },
    listen(card, e, ctx) {
      card.innerHTML = `<h2 class="ex-title">Écoute et choisis ce que tu entends</h2>
        <div class="listen-row"><button class="say-big" data-say aria-label="Écouter">${icon('volume')}</button><button class="say-slow" data-slow aria-label="Écouter lentement">🐢</button></div>
        ${canSpeak ? '' : `<p class="note">Voix indisponible sur ce navigateur. Indice : ${e.w.e}</p>`}
        <div class="opts list">${e.options.map((o, i) => `<button class="opt" data-i="${i}" aria-pressed="false"><kbd>${i + 1}</kbd><span class="ot" ${rtl(ctx.lang)}>${esc(o.t)}</span></button>`).join('')}</div>`;
      const big = $('[data-say]', card);
      const play = rate => { speak(e.w.t, ctx.lang, rate); big.classList.remove('pulse'); void big.offsetWidth; big.classList.add('pulse'); };
      big.addEventListener('click', () => play(0.85));
      $('[data-slow]', card).addEventListener('click', () => play(0.5));
      setTimeout(() => play(0.85), 350);
      const s = selectable(card, ctx);
      return { check: () => ({ ok: e.options[s.i].id === e.w.id, answer: e.w.t, say: e.w.t, pick: s.i }) };
    },
    type(card, e, ctx) {
      const extra = [...new Set(D.words(ctx.lang).map(w => w.t).join('').split('').filter(ch => /[^\x00-\x7F]/.test(ch) && ch.trim()))].slice(0, 10);
      card.innerHTML = `<h2 class="ex-title">Écris « ${esc(e.w.m)} » en ${D.langs[ctx.lang].name.toLowerCase()}</h2>
        <div class="big-e">${e.w.e}</div>
        <input class="type-in" id="typeIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Tape ta réponse" aria-label="Ta réponse">
        ${extra.length ? `<div class="accents" aria-label="Lettres spéciales">${extra.map(ch => `<button type="button" data-ch="${esc(ch)}">${esc(ch)}</button>`).join('')}</div>` : ''}`;
      const inp = $('#typeIn', card);
      inp.addEventListener('input', () => ctx.setReady(inp.value.trim().length > 0));
      $$('[data-ch]', card).forEach(b => b.addEventListener('click', () => {
        const p = inp.selectionStart ?? inp.value.length;
        inp.value = inp.value.slice(0, p) + b.dataset.ch + inp.value.slice(inp.selectionEnd ?? p);
        inp.focus(); inp.setSelectionRange(p + 1, p + 1); ctx.setReady(true);
      }));
      setTimeout(() => inp.focus(), 250);
      return {
        check: () => {
          const v = inp.value;
          inp.disabled = true;
          if (loose(v) === loose(e.w.t)) return { ok: true, say: e.w.t };
          if (norm(v) === norm(e.w.t)) return { ok: true, note: `Attention aux accents : ${e.w.t}`, say: e.w.t };
          return { ok: false, answer: e.w.t, say: e.w.t };
        }
      };
    },
    match(card, e, ctx) {
      const left = shuffle(e.pairs), right = shuffle(e.pairs);
      card.innerHTML = `<h2 class="ex-title">Relie les paires</h2>
        <div class="match"><div class="mcol">${left.map(w => `<button class="mt" data-side="l" data-id="${w.id}" ${rtl(ctx.lang)}>${esc(w.t)}</button>`).join('')}</div>
        <div class="mcol">${right.map(w => `<button class="mt" data-side="r" data-id="${w.id}">${w.e} ${esc(w.m)}</button>`).join('')}</div></div>`;
      let sel = { l: null, r: null }, found = 0;
      $$('.mt', card).forEach(b => b.addEventListener('click', () => {
        if (b.classList.contains('matched')) return;
        const side = b.dataset.side;
        if (sel[side]) sel[side].classList.remove('sel');
        sel[side] = b; b.classList.add('sel'); Sfx.tap();
        if (side === 'l') { const w = e.pairs.find(x => x.id === b.dataset.id); speak(w.t, ctx.lang); }
        if (sel.l && sel.r) {
          const a = sel.l, c = sel.r; sel = { l: null, r: null };
          if (a.dataset.id === c.dataset.id) {
            [a, c].forEach(x => { x.classList.remove('sel'); x.classList.add('matched'); x.disabled = true; });
            animate([a, c], { scale: [1.08, 1] }, spring(500, 15)); Sfx.pop(); found++;
            if (found === e.pairs.length) setTimeout(() => ctx.submit(), 350);
          } else {
            [a, c].forEach(x => { x.classList.remove('sel'); x.classList.add('miss'); setTimeout(() => x.classList.remove('miss'), 500); });
            animate([a, c], { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.35 }); Sfx.bad(); ctx.slip();
          }
        }
      }));
      ctx.hideCheck();
      return { check: () => ({ ok: true }) };
    },
    build(card, e, ctx) {
      const L = D.langs[ctx.lang], sep = L.noSpace ? '' : ' ';
      const others = D.phrases(ctx.lang).filter((_, i) => i !== e.ph.unit).flat();
      const dis = [...new Set(others.filter(t => !e.ph.tokens.includes(t)))];
      const tiles = shuffle([...e.ph.tokens.map((t, i) => ({ t, k: 'a' + i })), ...shuffle(dis).slice(0, 3).map((t, i) => ({ t, k: 'd' + i }))]);
      card.innerHTML = `<h2 class="ex-title">Traduis cette phrase</h2>
        <div class="speech">${mascot('calm')}<div class="bubble">${esc(e.ph.m)}</div></div>
        <div class="answer" id="ans" aria-label="Ta réponse" ${rtl(ctx.lang)}></div>
        <div class="bank" ${rtl(ctx.lang)}>${tiles.map(x => `<button class="tile" data-k="${x.k}">${esc(x.t)}</button>`).join('')}</div>`;
      const ans = $('#ans', card);
      const sync = () => ctx.setReady(ans.children.length > 0);
      $$('.bank .tile', card).forEach(b => b.addEventListener('click', () => {
        if (b.classList.contains('used') || ctx.locked()) return;
        b.classList.add('used'); Sfx.tap();
        const c = document.createElement('button');
        c.className = 'tile'; c.textContent = b.textContent; c.dataset.k = b.dataset.k;
        c.addEventListener('click', () => { if (ctx.locked()) return; c.remove(); b.classList.remove('used'); sync(); Sfx.tap(); });
        ans.appendChild(c);
        animate(c, { scale: [0.6, 1], y: [30, 0] }, spring(500, 22));
        speak(b.textContent, ctx.lang, 1);
        sync();
      }));
      return {
        check: () => {
          const got = $$('.tile', ans).map(x => x.textContent);
          const ok = got.length === e.ph.tokens.length && got.every((t, i) => loose(t) === loose(e.ph.tokens[i]));
          return { ok, answer: e.ph.tokens.join(sep), say: e.ph.tokens.join(sep) };
        }
      };
    }
  };

  // ---------- Vue leçon ----------
  function view(app, r, onLeave) {
    const p = prof(), c = course(p), idx = Number(r.args[0]);
    const back = () => { location.hash = '#/apprendre'; };
    if (!Number.isInteger(idx) || idx < 0 || idx > c.done || idx >= TOTAL || idx % PER_UNIT === PER_UNIT - 1) return back();
    if (overLimit(p)) { toast('Le temps d’écran du jour est atteint. À demain !', { icon: '⏱️' }); return back(); }
    const practice = idx < c.done;
    if (p.hearts <= 0 && !practice) { back(); setTimeout(LZ.heartsModal, 400); return; }
    const ui = Math.floor(idx / PER_UNIT), li = idx % PER_UNIT, lang = p.lang;
    const st = { queue: buildLesson(lang, ui, li), i: 0, phase: 'answer', correct: 0, wrong: 0, combo: 0, maxCombo: 0, start: Date.now(), bar: 0, cur: null };

    app.innerHTML = `<div class="lesson" style="--u:${D.units[ui].color}">
      <header class="l-top">
        <button class="icon-btn" id="quit" aria-label="Quitter la leçon">${icon('x')}</button>
        <div class="l-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="lbar"></i><span class="combo" id="combo" hidden></span></div>
        <span class="stat heart ${practice ? 'inf' : ''}" aria-label="Cœurs">${icon('heart')}<b id="lh">${practice ? '∞' : p.hearts}</b></span>
      </header>
      <main class="l-stage" id="stage"></main>
      <footer class="l-foot" id="foot"></footer>
    </div>`;
    const stage = $('#stage'), foot = $('#foot');

    const ctx = {
      lang,
      setReady: b => { const k = $('#check'); if (k && st.phase === 'answer') k.disabled = !b; },
      locked: () => st.phase !== 'answer',
      submit: () => onCheck(),
      slip: () => { st.combo = 0; showCombo(); },
      hideCheck: () => { const k = $('#check'); if (k) k.hidden = true; }
    };

    const setBar = () => {
      st.bar = Math.max(st.bar, st.i / st.queue.length);
      $('#lbar').style.width = (st.bar * 100) + '%';
      $('.l-bar').setAttribute('aria-valuenow', String(Math.round(st.bar * 100)));
    };
    const showCombo = () => {
      const el = $('#combo');
      if (st.combo >= 3) { el.hidden = false; el.textContent = `${st.combo} d’affilée`; animate(el, { scale: [1.3, 1] }, spring(500, 14)); }
      else el.hidden = true;
    };

    function drawFoot() {
      foot.className = 'l-foot';
      const e = st.queue[st.i];
      foot.innerHTML = `<div class="l-foot-in">${e.type === 'intro' || e.type === 'match' ? '<span></span>' : '<button class="btn btn-ghost btn-lg" id="skip">Passer</button>'}
        <button class="btn btn-primary btn-lg" id="check" ${e.type === 'intro' ? '' : 'disabled'}>${e.type === 'intro' ? 'Continuer' : 'Vérifier'}</button></div>`;
      $('#check').addEventListener('click', onCheck);
      const sk = $('#skip'); sk && sk.addEventListener('click', () => { if (st.phase !== 'answer') return; grade({ ok: false, answer: answerOf(e), say: e.w?.t }); });
    }
    const answerOf = e => e.type === 'build' ? e.ph.tokens.join(D.langs[lang].noSpace ? '' : ' ') : e.type === 'pickImage' || e.type === 'meaning' ? e.w.m : e.w?.t || '';

    function show(dir = 1) {
      st.phase = 'answer';
      const e = st.queue[st.i];
      drawFoot();
      stage.innerHTML = '';
      const card = document.createElement('div');
      card.className = 'ex ex-' + e.type;
      stage.appendChild(card);
      st.cur = EX[e.type](card, e, ctx);
      animate(card, { opacity: [0, 1], x: [60 * dir, 0] }, spring(260, 26));
      setBar();
    }

    function onCheck() {
      if (st.phase === 'feedback') return next();
      if (st.phase !== 'answer') return;
      const e = st.queue[st.i];
      if (e.type === 'intro') return next();
      const k = $('#check'); if (k && k.disabled && e.type !== 'match') return;
      const res = st.cur.check(); if (!res) return;
      grade(res);
    }

    function grade(res) {
      const e = st.queue[st.i], card = $('.ex', stage);
      st.phase = 'feedback';
      $$('.opt', card).forEach(b => { b.disabled = true; });
      if (res.pick != null) {
        const btn = $(`.opt[data-i="${res.pick}"]`, card);
        btn && btn.classList.add(res.ok ? 'right' : 'wrong');
        if (!res.ok) { const good = e.options.findIndex(o => o.id === e.w.id); const g = $(`.opt[data-i="${good}"]`, card); g && g.classList.add('right'); }
      }
      if (res.ok) {
        st.correct++; st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo);
        Sfx.ok(); if (res.say) speak(res.say, lang);
        animate(card, { scale: [1, 1.02, 1] }, { duration: 0.3 });
      } else {
        st.wrong++; st.combo = 0; Sfx.bad();
        animate(card, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.4 });
        if (!practice) { if (p.hearts === LZ.MAX_H) p.heartsAt = Date.now(); p.hearts = Math.max(0, p.hearts - 1); $('#lh').textContent = p.hearts; animate($('.l-top .heart'), { scale: [1.5, 1] }, spring(500, 12)); save(); }
        if (!e._retry) st.queue.push({ ...e, _retry: true, options: e.options ? shuffle(e.options) : undefined });
      }
      showCombo();
      if (st.combo === 5 || st.combo === 10) toast(`${st.combo} bonnes réponses d’affilée !`, { icon: '🔥' });
      feedback(res);
    }

    function feedback(res) {
      foot.className = 'l-foot ' + (res.ok ? 'ok' : 'bad');
      foot.innerHTML = `<div class="l-foot-in"><div class="fb"><span class="fb-ic">${icon(res.ok ? 'check' : 'x')}</span>
        <div><b>${res.ok ? rand(D.praise) : rand(D.comfort)}</b>${res.ok ? (res.note ? `<p>${esc(res.note)}</p>` : '') : `<p>Bonne réponse : <span class="fb-ans" ${rtl(lang)}>${esc(res.answer)}</span></p>`}</div>
        ${res.say && !res.ok ? `<button class="icon-btn fb-say" aria-label="Écouter la bonne réponse">${icon('volume')}</button>` : ''}</div>
        <button class="btn ${res.ok ? 'btn-ok' : 'btn-bad'} btn-lg" id="check">Continuer</button></div>`;
      animate(foot.firstElementChild, { y: [30, 0], opacity: [0, 1] }, spring(420, 30));
      const fs = $('.fb-say', foot); fs && fs.addEventListener('click', () => speak(res.say, lang));
      $('#check').addEventListener('click', onCheck);
      setTimeout(() => { const k = $('#check'); k && k.focus(); }, 60);
    }

    function next() {
      if (!practice && p.hearts <= 0) return outOfHearts();
      st.i++;
      if (st.i >= st.queue.length) return finish();
      show(1);
    }

    function outOfHearts() {
      if (st.phase === 'blocked') return;
      st.phase = 'blocked';
      modal(`<div class="hearts-m">${mascot('sad', 'm-md')}<h2 class="modal-title">Plus de cœurs</h2>
        <p class="modal-text">Tu peux recharger tes cœurs avec des gemmes, ou revenir plus tard : un cœur revient toutes les 30 minutes.</p>
        <div class="modal-actions col"><button class="btn btn-primary btn-block" id="rf" ${p.gems < 350 ? 'disabled' : ''}>${icon('gem')}Recharger (350)</button>
        <button class="btn btn-ghost btn-block" id="qt">Quitter la leçon</button></div></div>`, {
        dismiss: false,
        onMount: (box, close) => {
          $('#rf', box).addEventListener('click', () => { p.gems -= 350; p.hearts = MAX_H; p.heartsAt = Date.now(); save(); Sfx.coin(); $('#lh').textContent = p.hearts; close(); st.phase = 'feedback'; next(); });
          $('#qt', box).addEventListener('click', () => { close(); back(); });
        }
      });
    }

    function finish() {
      st.phase = 'done';
      const secs = Math.max(15, Math.round((Date.now() - st.start) / 1000));
      const perfect = st.wrong === 0;
      const boost = p.boostUntil > Date.now();
      let xp = (practice ? 5 : 10) + (perfect ? 5 : 0); if (boost) xp *= 2;
      const gems = practice ? 0 : perfect ? 10 : 5;
      const t = dayKey(), first = p.lastDay !== t, prevStreak = p.streak;
      if (first) { p.streak = p.lastDay === addDays(t, -1) ? p.streak + 1 : 1; p.lastDay = t; p.bestStreak = Math.max(p.bestStreak, p.streak); }
      const rankBefore = rankOf(p.xp), beforeToday = p.days[t] || 0;
      p.xp += xp; p.weekXp += xp; p.days[t] = beforeToday + xp; p.time[t] = (p.time[t] || 0) + secs;
      p.gems += gems; p.lessons++; if (perfect) p.perfect++;
      p.ans.ok += st.correct; p.ans.n += st.correct + st.wrong;
      const unitW = D.words(lang).filter(w => w.u === ui);
      const learned = li === 0 ? unitW.slice(0, 2) : li === 1 ? unitW : unitW;
      learned.forEach(w => { const k = `${lang}:${w.id}`; if (!p.words.includes(k)) p.words.push(k); });
      if (!practice) c.done = Math.max(c.done, idx + 1);
      p.quest.lessons++; p.quest.combo = Math.max(p.quest.combo, st.maxCombo);
      const rankAfter = rankOf(p.xp);
      const goalHit = beforeToday < p.goal && p.days[t] >= p.goal;
      save();
      Sfx.done();
      const acc = Math.round(st.correct / Math.max(1, st.correct + st.wrong) * 100);
      const screens = [
        () => resultScreen({ xp, gems, acc, secs, perfect, boost, goalHit }),
        first ? () => streakScreen(prevStreak, p.streak) : null,
        rankAfter > rankBefore ? () => rankScreen(rankAfter) : null
      ].filter(Boolean);
      let k = 0;
      const run = () => {
        if (k >= screens.length) { claimQuests(p); checkAch(p); save(); back(); return; }
        screens[k++]()(run);
      };
      run();
    }

    function resultScreen({ xp, gems, acc, secs, perfect, boost, goalHit }) {
      return nextFn => {
        app.innerHTML = `<div class="end"><canvas class="confetti" id="cf"></canvas>
          <div class="end-in">
            <div class="end-m">${mascot(perfect ? 'wow' : 'happy')}</div>
            <h1>${perfect ? 'Leçon parfaite !' : practice ? 'Révision terminée !' : 'Leçon terminée !'}</h1>
            <p class="end-sub">${perfect ? 'Pas une seule erreur. Impressionnant.' : 'Chaque erreur t’a appris quelque chose.'}</p>
            <div class="end-stats">
              <div class="es xp"><small>XP gagnés</small><b><span id="cx">0</span>${boost ? '<em>x2</em>' : ''}</b></div>
              <div class="es acc"><small>${perfect ? 'Parfait' : 'Précision'}</small><b><span id="ca">0</span>%</b></div>
              <div class="es time"><small>Temps</small><b>${fmtTime(secs)}</b></div>
            </div>
            ${gems ? `<p class="end-pill">${icon('gem')}+${gems} gemmes</p>` : ''}
            ${goalHit ? `<p class="end-pill goal">${icon('target')}Objectif du jour atteint !</p>` : ''}
          </div>
          <footer class="end-foot"><button class="btn btn-primary btn-lg" id="endNext">Continuer</button></footer></div>`;
        const stop = confetti($('#cf'));
        onLeave(stop);
        animate($('.end-m'), { y: [80, 0], scale: [0.5, 1], rotate: [-15, 0] }, spring(160, 11));
        animate($$('.es'), { opacity: [0, 1], rotateX: [-90, 0], y: [20, 0] }, { delay: stagger(0.12, { startDelay: 0.3 }), ...spring(160, 15) });
        animate($$('.end-pill'), { opacity: [0, 1], scale: [0.7, 1] }, { delay: stagger(0.1, { startDelay: 0.8 }), ...spring(300, 16) });
        setTimeout(() => { countUp($('#cx'), xp, { dur: 900 }); countUp($('#ca'), acc, { dur: 900 }); }, 450);
        $('#endNext').addEventListener('click', () => { stop(); nextFn(); });
        $('#endNext').focus();
      };
    }

    function streakScreen(prev, now) {
      return nextFn => {
        const t = dayKey(), start = LZ.weekKey();
        const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
        app.innerHTML = `<div class="end streak-s"><div class="end-in">
            <div class="big-flame">${icon('flame')}</div>
            <p class="big-n" id="sn">${prev}</p>
            <h1>jour${now > 1 ? 's' : ''} de série !</h1>
            <div class="week">${days.map((d, i) => `<span class="${p.days[d] ? 'on' : ''} ${d === t ? 'today' : ''}"><em>${'LMMJVSD'[i]}</em><i>${p.days[d] ? icon('check') : ''}</i></span>`).join('')}</div>
            <p class="end-sub">${now === 1 ? 'Une flamme vient de s’allumer. Reviens demain pour la faire grandir.' : 'Tu as appris chaque jour. Reviens demain pour continuer.'}</p>
          </div><footer class="end-foot"><button class="btn btn-sun btn-lg" id="endNext">Je reviens demain</button></footer></div>`;
        animate($('.big-flame'), { scale: [0, 1.15, 1], rotate: [-20, 8, 0] }, { duration: 0.8 });
        setTimeout(() => { Sfx.streak(); const n = $('#sn'); n.textContent = now; animate(n, { scale: [1.6, 1], y: [-20, 0] }, spring(400, 12)); }, 650);
        const today = $('.week .today i'); today && animate(today, { scale: [0, 1.3, 1] }, { delay: 0.9, duration: 0.5 });
        $('#endNext').addEventListener('click', nextFn); $('#endNext').focus();
      };
    }

    function rankScreen(ri) {
      return nextFn => {
        const R = D.ranks[ri];
        app.innerHTML = `<div class="end rank-s" style="--c:${R.color}"><div class="end-in">
          <p class="end-sub">Nouveau statut débloqué</p>
          <div class="medal"><span>${R.icon}</span></div>
          <h1>${R.name}</h1>
          <p class="end-sub">${D.ranks[ri + 1] ? `Prochain statut : ${D.ranks[ri + 1].name}, à ${D.ranks[ri + 1].min} XP.` : 'Le plus haut statut. Tu es une légende.'}</p>
          </div><footer class="end-foot"><button class="btn btn-primary btn-lg" id="endNext">Génial</button></footer></div>`;
        animate($('.medal'), { rotateY: [540, 0], scale: [0.3, 1] }, spring(60, 12));
        Sfx.streak();
        $('#endNext').addEventListener('click', nextFn); $('#endNext').focus();
      };
    }

    $('#quit').addEventListener('click', async () => {
      if (st.phase === 'done') return back();
      if (await confirmBox('Quitter la leçon ?', 'Ta progression dans cette leçon sera perdue.', 'Quitter', true)) back();
    });

    const onKey = ev => {
      if ($('.modal-wrap')) return;
      if (ev.key === 'Enter') {
        const k = $('#check') || $('#endNext');
        if (k && !k.disabled && !k.hidden && document.activeElement !== k) { ev.preventDefault(); k.click(); }
        return;
      }
      if (st.phase !== 'answer' || ev.target.tagName === 'INPUT') return;
      const n = parseInt(ev.key, 10);
      if (n >= 1 && n <= 4) { const b = $(`.opt[data-i="${n - 1}"]`, stage); b && b.click(); }
      if (ev.key === ' ' && $('[data-say]', stage)) { ev.preventDefault(); $('[data-say]', stage).click(); }
    };
    document.addEventListener('keydown', onKey);
    onLeave(() => document.removeEventListener('keydown', onKey));

    show(1);
  }

  LZ.views = LZ.views || {};
  LZ.views.lesson = view;
  LZ.buildLesson = buildLesson;
})();
