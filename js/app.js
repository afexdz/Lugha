/* ============================================================
   LISSAN — espace connecté
   Coque (barre latérale, barre du haut, colonne droite, onglets mobiles)
   + pages : Apprendre, Classement, Boutique, Profil, Parents, Réglages, Langues
   ============================================================ */
(() => {
  'use strict';
  const {
    D, $, $$, esc, clamp, dayKey, addDays, save, me, prof, course, newProfile, hash,
    MAX_H, HEART_MS, rankOf, overLimit, quests, ACH, achLevel,
    animate, spring, stagger, countUp, speak, icon, mascot, logo, toast, modal, confirmBox, applyPrefs, Sfx
  } = LZ;
  const db = () => LZ.db;
  const PER_UNIT = 5;
  const totalFor = lang => (lang === 'en' && LZ.engine?.getTotal) ? LZ.engine.getTotal() : D.units.length * PER_UNIT;
  const TOTAL = D.units.length * PER_UNIT; // pour les langues autres qu'anglais
  const lessonMin = sec => Math.round(sec / 60);

  // ================= COQUE =================
  function shell(app, active, view, r, onLeave) {
    const u = me(), p = prof(), L = D.langs[p.lang];
    const sideNav = [
      ['apprendre', 'Apprendre', 'home'], ['classement', 'Classement', 'trophy'],
      ['voyage', 'Voyage', 'globe'], ['boutique', 'Boutique', 'gem'],
      ['profil', 'Profil', 'user'], ...(u.role === 'parent' ? [['parents', 'Parents', 'family']] : []),
      ['abonnement', 'Abonnement', 'star'],
      ...(u.acces && u.acces.admin ? [['admin', 'Admin', 'shield']] : []),
      ['parametres', 'Réglages', 'settings']
    ];
    const tabNav = [
      ['apprendre', 'Apprendre', 'home'], ['classement', 'Classement', 'trophy'],
      ['voyage', 'Voyage', 'globe'],
      ['profil', 'Profil', 'user'], ...(u.role === 'parent' ? [['parents', 'Parents', 'family']] : []),
      ['parametres', 'Réglages', 'settings']
    ];
    const today = dayKey();
    app.innerHTML = `<div class="shell">
      <aside class="side" aria-label="Navigation principale">
        <a class="logo" href="#/">${logo()}</a>
        <nav>${sideNav.map(([k, l, ic]) => `<a href="#/${k}" class="side-link ${k === active ? 'on' : ''}" ${k === active ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span></a>`).join('')}</nav>
        <button class="side-prof" id="switchProf" aria-label="Changer de profil"><span class="sp-av">${p.avatar}</span><span class="sp-t"><b>${esc(p.name)}</b><small>${u.role === 'parent' ? 'Changer de profil' : 'Mon compte'}</small></span>${icon('swap')}</button>
        <button class="side-logout" id="sideLogout">${icon('logout')}<span>Se déconnecter</span></button>
      </aside>
      <div class="main">
        <header class="topbar">
          <button class="course-btn" id="courseBtn" aria-haspopup="menu" aria-expanded="false"><span class="lang-dot" style="--c:${L.color}">${L.abbr}</span><span class="cb-name">${L.name}</span>${icon('chev')}</button>
          <div class="stats">
            <button class="stat fire ${p.lastDay === today ? 'on' : ''}" id="stFire" aria-label="Série : ${p.streak} jours">${icon('flame')}<b>${p.streak}</b></button>
            <button class="stat gem" id="stGem" aria-label="${p.gems} gemmes">${icon('gem')}<b id="gemCount">${p.gems}</b></button>
            <button class="stat heart" id="stHeart" aria-label="${p.hearts} cœurs">${icon('heart')}<b>${p.hearts}</b></button>
          </div>
          ${accessBadge(u)}
          <button class="tb-av" id="switchProf2" aria-label="Changer de profil">${p.avatar}</button>
        </header>
        <main class="view" id="view" tabindex="-1"></main>
      </div>
      <aside class="rail" id="rail" aria-label="Objectifs et quêtes"></aside>
      <nav class="tabbar" aria-label="Navigation">${tabNav.map(([k, l, ic]) => `<a href="#/${k}" class="tab ${k === active ? 'on' : ''}" ${k === active ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span></a>`).join('')}</nav>
    </div>`;
    view($('#view'), r, onLeave);
    rail($('#rail'));

    $('#courseBtn').addEventListener('click', e => courseMenu(e.currentTarget));
    $('#sideLogout').addEventListener('click', logout);
    [$('#switchProf'), $('#switchProf2')].forEach(b => b.addEventListener('click', () => u.role === 'parent' ? switcher() : (location.hash = '#/profil')));
    $('#stFire').addEventListener('click', streakModal);
    $('#stGem').addEventListener('click', () => (location.hash = '#/boutique'));
    $('#stHeart').addEventListener('click', heartsModal);

    animate($('#view').children, { opacity: [0, 1], y: [14, 0] }, { delay: stagger(0.05), duration: 0.45, ease: [0.2, 0.8, 0.2, 1] });
    if (p.flash) { toast(p.flash, { icon: '🔔' }); delete p.flash; save(); }
  }

  function courseMenu(btn) {
    const p = prof();
    const open = $('.menu-pop'); if (open) { open.remove(); btn.setAttribute('aria-expanded', 'false'); return; }
    const m = document.createElement('div');
    m.className = 'menu-pop'; m.setAttribute('role', 'menu');
    m.innerHTML = `<p class="mp-t">Mes langues</p>${Object.keys(p.courses).map(c => { const L = D.langs[c]; const d = p.courses[c].done;
      return `<button role="menuitem" class="mp-i ${c === p.lang ? 'on' : ''}" data-c="${c}"><span class="lang-dot" style="--c:${L.color}">${L.abbr}</span><span>${L.name}</span><small>${Math.round(d / totalFor(c) * 100)} %</small></button>`; }).join('')}
      <a role="menuitem" class="mp-i add" href="#/langues">${icon('plus')}<span>Ajouter une langue</span></a>`;
    btn.parentElement.appendChild(m);
    btn.setAttribute('aria-expanded', 'true');
    animate(m, { opacity: [0, 1], y: [-8, 0], scale: [0.96, 1] }, spring(400, 28));
    $$('[data-c]', m).forEach(b => b.addEventListener('click', () => {
      m.remove(); p.lang = b.dataset.c; save(); LZ.render();
      LZ.cloud.updateProfile(p, { lang: b.dataset.c }).catch(e => toast(e.message, { icon: '⚠️' }));
    }));
    $('a', m).addEventListener('click', () => m.remove());
    const off = e => { if (!m.contains(e.target) && e.target !== btn && !btn.contains(e.target)) { m.remove(); btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', off); } };
    setTimeout(() => document.addEventListener('pointerdown', off), 0);
    const first = $('[role=menuitem]', m); first && first.focus();
    m.addEventListener('keydown', e => {
      const items = $$('[role=menuitem]', m), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      if (e.key === 'Escape') { m.remove(); btn.focus(); }
    });
  }

  function switcher() {
    const u = me();
    modal(`<h2 class="modal-title">Qui apprend maintenant ?</h2>
      <div class="who">${u.profiles.map(p => `<button class="who-i ${p.id === u.active ? 'on' : ''}" data-id="${p.id}"><span>${p.avatar}</span><b>${esc(p.name)}</b><small>${p.lang ? D.langs[p.lang].name : 'À configurer'}</small></button>`).join('')}
      <a class="who-i add" href="#/parents" data-close><span>${icon('plus')}</span><b>Ajouter</b><small>un enfant</small></a></div>
      <div class="modal-actions"><a class="btn btn-ghost" href="#/parents" data-close>${icon('family')}Espace parents</a></div>`, {
      onMount: (box, close) => $$('[data-id]', box).forEach(b => b.addEventListener('click', () => {
        u.active = b.dataset.id; save(); close();
        const p = prof(); toast(`Profil de ${p.name}`, { icon: p.avatar });
        location.hash = p.lang ? '#/apprendre' : '#/langues'; LZ.render();
      }))
    });
  }

  function streakModal() {
    const p = prof(), t = dayKey();
    const start = addDays(LZ.weekKey(), 0);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    modal(`<div class="streak-m"><div class="sm-flame ${p.lastDay === t ? 'on' : ''}">${icon('flame')}<b>${p.streak}</b></div>
      <h2 class="modal-title">${p.streak ? `${p.streak} jour${p.streak > 1 ? 's' : ''} de série` : 'Commence une série aujourd’hui'}</h2>
      <p class="modal-text">${p.lastDay === t ? 'Leçon du jour faite. Reviens demain pour allumer une nouvelle flamme.' : 'Termine une leçon aujourd’hui pour garder ta flamme allumée.'}</p>
      <div class="week">${days.map((d, i) => `<span class="${p.days[d] ? 'on' : ''} ${d === t ? 'today' : ''}"><em>${'LMMJVSD'[i]}</em><i>${p.days[d] ? icon('check') : ''}</i></span>`).join('')}</div>
      <p class="sm-freeze">${icon('snow')} ${p.freeze} gel${p.freeze > 1 ? 's' : ''} de série en réserve</p>
      <div class="modal-actions"><button class="btn btn-primary" data-close>Compris</button></div></div>`);
  }

  function heartsModal() {
    const p = prof();
    const next = p.hearts < MAX_H ? Math.ceil((HEART_MS - (Date.now() - p.heartsAt)) / 60000) : 0;
    modal(`<div class="hearts-m"><div class="hm-row">${Array.from({ length: MAX_H }, (_, i) => `<span class="${i < p.hearts ? 'on' : ''}">${icon('heart')}</span>`).join('')}</div>
      <h2 class="modal-title">${p.hearts === MAX_H ? 'Tous tes cœurs sont là' : `${p.hearts} cœur${p.hearts > 1 ? 's' : ''} sur ${MAX_H}`}</h2>
      <p class="modal-text">Une erreur coûte un cœur. ${p.hearts < MAX_H ? `Prochain cœur dans ${next} min.` : ''} Les révisions ne coûtent rien.</p>
      <div class="modal-actions"><button class="btn btn-ghost" data-close>Fermer</button>${p.hearts < MAX_H ? `<button class="btn btn-primary" id="refill" ${p.gems < 350 ? 'disabled' : ''}>${icon('gem')}Tout recharger (350)</button>` : ''}</div></div>`, {
      onMount: (box, close) => { const b = $('#refill', box); b && b.addEventListener('click', async () => {
        if (b.disabled) return; b.disabled = true;
        try { await LZ.cloud.buy(p, 'coeurs'); p.hearts = MAX_H; p.heartsAt = Date.now(); save(); Sfx.coin(); close(); toast('Cœurs rechargés !', { icon: '❤️' }); LZ.render(); }
        catch (e) { b.disabled = false; toast(e.message, { icon: '⚠️' }); }
      }); }
    });
  }

  // ---------- Colonne droite ----------
  function rail(el) {
    const p = prof(), u = me(), t = dayKey();
    const today = p.days[t] || 0, pct = clamp(today / p.goal, 0, 1);
    el.innerHTML = `
      <section class="card goal-card">
        <div class="ring" style="--p:${pct}"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" pathLength="100"/><circle class="fg" cx="22" cy="22" r="18" pathLength="100" style="stroke-dasharray:${pct * 100} 100"/></svg><span>${Math.round(pct * 100)}%</span></div>
        <div><h3>Objectif du jour</h3><p>${today} / ${p.goal} XP${pct >= 1 ? ', atteint !' : ''}</p></div>
      </section>
      <section class="card">
        <div class="card-h"><h3>Classement de la semaine</h3><a class="link small" href="#/classement">Voir</a></div>
        <div class="lg-mini"><span class="lg-gem" style="--c:#F59F00">${icon('trophy')}</span><p id="railRank">${p.weekXp ? `${p.weekXp} XP cette semaine.` : 'Termine une leçon pour entrer dans le classement.'}</p></div>
      </section>
      <section class="card">
        <div class="card-h"><h3>Quêtes du jour</h3></div>
        <ul class="quests">${quests(p).map(q => `<li class="${q.cur >= q.max ? 'done' : ''}">${icon(q.icon)}<div><b>${q.label}</b><span class="qbar"><i style="width:${(q.cur / q.max) * 100}%"></i></span><small>${q.cur} / ${q.max}</small></div><span class="q-gift">${q.cur >= q.max ? icon('check') : '🎁'}</span></li>`).join('')}</ul>
      </section>
      ${u.role === 'parent' ? `<a class="card parent-promo" href="#/parents">${icon('family')}<div><b>Espace parents</b><small>Rapports, temps d’écran, profils</small></div></a>` : ''}
      <p class="rail-foot">lugha.world · <a class="link" href="#/">Accueil</a></p>`;
    if (p.weekXp) LZ.cloud.leaderboard(p).then(list => {
      const mine = list.find(x => x.moi), el2 = $('#railRank');
      if (mine && el2) el2.innerHTML = `Tu es <b>${mine.rang}${mine.rang === 1 ? 'er' : 'e'}</b> avec ${mine.xp} XP cette semaine.`;
    }).catch(() => {});
  }

  // Badge d'essai / abonnement dans la barre du haut
  function accessBadge(u) {
    const a = u.acces || {};
    if (a.actif && !a.en_essai) return '';
    if (a.en_essai) {
      const d = Math.max(0, Math.ceil((Date.parse(a.essai_jusqua) - Date.now()) / 864e5));
      return `<a class="trial-badge" href="#/abonnement" aria-label="Essai : encore ${d} jour${d > 1 ? 's' : ''}"><span class="tl">Essai : </span>${d}&nbsp;j<span class="tl">our${d > 1 ? 's' : ''}</span></a>`;
    }
    return `<a class="trial-badge off" href="#/abonnement">S’abonner</a>`;
  }

  // ================= APPRENDRE =================
  const OFFS = [0, 52, 78, 52, 0, -52, -78, -52];
  function learn(el, r, onLeave) {
    const p = prof(), c = course(p), L = D.langs[p.lang], done = c.done;
    const limit = overLimit(p);
    let html = '';
    if (limit) html += `<div class="limit-note">${mascot('calm')}<div><b>C’est tout pour aujourd’hui</b><p>Le temps fixé par tes parents est atteint. Rendez-vous demain, ta série t’attend !</p></div></div>`;
    const isle = D.islands[p.lang];
    const vcEarned = done - Math.floor(done / 5);
    html += `<a class="voyage-card" href="#/voyage" style="--c:${L.color}">`
      + `<span class="vc-isle">${isle.embleme}</span>`
      + `<div class="vc-info"><b>Mon voyage · ${esc(L.name)}</b>`
      + `<small>${vcEarned === 1 ? '1 autocollant collecté' : vcEarned + ' autocollants collectés'} sur 20</small></div>`
      + `${icon('next')}</a>`;

    if (p.lang === 'en' && LZ.engine && !LZ.engine.getA1Units()) {
      LZ.engine.ensureA1().then(() => { if (LZ.engine.getA1Units() && location.hash === '#/apprendre') LZ.render(); }).catch(() => {});
    }
    const activeUnits = (p.lang === 'en' && LZ.engine?.getA1Units()) ? LZ.engine.getA1Units() : D.units;
    activeUnits.forEach((un, ui) => {
      const start = ui * PER_UNIT;
      const uDone = clamp(done - start, 0, PER_UNIT);
      html += `<section class="unit ${done < start ? 'future' : ''}" style="--u:${un.color}">
        <div class="unit-head">
          <div><p class="unit-k">Unité ${ui + 1}</p><h2>${un.title}</h2><p class="unit-s">${un.sub}</p></div>
          <button class="unit-guide" data-guide="${ui}" aria-label="Guide de l’unité ${ui + 1}">${icon('book')}<span>Guide</span></button>
          <span class="unit-prog" aria-label="${uDone} étapes sur ${PER_UNIT}"><i style="width:${uDone / PER_UNIT * 100}%"></i></span>
        </div>
        <div class="path">`;
      for (let li = 0; li < PER_UNIT; li++) {
        const idx = start + li, chest = li === PER_UNIT - 1;
        const state = idx < done ? 'done' : idx === done ? 'current' : 'locked';
        const off = OFFS[(li + ui * 2) % OFFS.length];
        const lab = chest ? 'Coffre de l’unité' : `Leçon ${li + 1} sur 4`;
        html += `<div class="node-row" style="--off:${off}px">
          ${state === 'current' && !limit ? `<span class="start-tag">${chest ? 'Ouvrir' : 'Commencer'}</span>` : ''}
          <button class="node ${state} ${chest ? 'chest' : ''}" data-idx="${idx}" aria-label="${lab}, ${state === 'done' ? 'terminée' : state === 'current' ? 'à faire' : 'verrouillée'}">
            ${chest ? `<span class="chest-e">${state === 'done' ? '📭' : '🎁'}</span>` : icon(state === 'done' ? 'check' : state === 'locked' ? 'lock' : 'star')}
            ${state === 'current' ? '<svg class="node-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/></svg>' : ''}
          </button>
        </div>`;
      }
      html += `</div>${ui % 2 === 0 ? `<div class="path-m ${ui % 4 === 0 ? 'right' : 'left'}">${mascot(ui === 0 ? 'happy' : 'calm')}</div>` : ''}</section>`;
    });
    html += `<div class="path-end">${icon('sparkle')}<div><b>De nouvelles unités arrivent</b><p>Histoires, verbes et conversations complètent bientôt le cours de ${L.name.toLowerCase()}.</p></div></div>`;
    el.innerHTML = `<div class="learn">${html}</div>`;

    // Popover d'étape
    const closePop = () => { const x = $('.node-pop'); x && x.remove(); };
    $$('.node', el).forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const had = b.parentElement.querySelector('.node-pop'); closePop(); if (had) return;
      const idx = +b.dataset.idx, li = idx % PER_UNIT, ui = Math.floor(idx / PER_UNIT), chest = li === PER_UNIT - 1;
      const state = idx < done ? 'done' : idx === done ? 'current' : 'locked';
      const pop = document.createElement('div');
      pop.className = `node-pop ${state}`; pop.style.setProperty('--u', D.units[ui].color);
      if (state === 'locked') pop.innerHTML = `<b>${chest ? 'Coffre verrouillé' : `Leçon ${li + 1}`}</b><p>Termine les étapes précédentes pour la débloquer.</p>`;
      else if (chest) pop.innerHTML = `<b>Coffre de l’unité ${ui + 1}</b><p>${state === 'done' ? 'Déjà ouvert. Bravo !' : 'Tu as fini l’unité : ouvre ton coffre.'}</p>${state === 'current' ? `<button class="btn btn-sun btn-block" data-open>Ouvrir le coffre</button>` : ''}`;
      else pop.innerHTML = `<b>${D.units[ui].title}</b><p>Leçon ${li + 1} sur 4</p>
        ${limit ? '<p class="small">Temps du jour atteint.</p>' : `<a class="btn ${state === 'done' ? 'btn-ghost' : 'btn-white'} btn-block" href="#/lecon/${idx}">${state === 'done' ? 'Réviser, +5 XP' : 'Commencer, +10 XP'}</a>`}`;
      b.parentElement.appendChild(pop);
      animate(pop, { opacity: [0, 1], y: [-8, 0], scale: [0.9, 1] }, spring(420, 26));
      const ob = $('[data-open]', pop);
      ob && ob.addEventListener('click', () => openChest(idx));
    }));
    const outside = () => closePop();
    document.addEventListener('click', outside);
    onLeave(() => document.removeEventListener('click', outside));

    $$('[data-guide]', el).forEach(b => b.addEventListener('click', () => guide(+b.dataset.guide)));

    // Centrer l'étape en cours
    const cur = $('.node.current', el);
    if (cur) {
      setTimeout(() => {
        const y = cur.getBoundingClientRect().top + scrollY - innerHeight / 2;
        if (y > 120) scrollTo({ top: y, behavior: LZ.reduced() ? 'auto' : 'smooth' });
      }, 350);
    }
    animate($$('.node', el), { scale: [0.4, 1], opacity: [0, 1] }, { delay: stagger(0.025), ...spring(360, 18) });
  }

  let chestBusy = false;
  async function openChest(idx) {
    const p = prof(), c = course(p);
    if (idx !== c.done || chestBusy) return;
    chestBusy = true;
    // Le serveur valide l'étape et crédite les gemmes (une seule fois)
    let r;
    try { r = await LZ.cloud.finishLesson({ profil: p.id, langue: p.lang, etape: idx, justes: 0, total: 0, secondes: 0, mots: [] }); }
    catch (e) { chestBusy = false; if (e.code === 'acces_expire') { location.hash = '#/abonnement'; } return toast(e.message, { icon: '⚠️' }); }
    chestBusy = false;
    if (r && r.attente) return toast('Pas de connexion. Le coffre sera ouvert dès ton retour en ligne.', { icon: '📶' });
    Sfx.done();
    modal(`<div class="chest-m"><div class="cm-box">🎁</div><h2 class="modal-title">Coffre ouvert !</h2><p class="modal-text">Unité terminée. Voici 20 gemmes pour toi.</p>
      <p class="cm-gems">${icon('gem')}<b>+20</b></p><div class="modal-actions"><button class="btn btn-primary" data-close>Super !</button></div></div>`, {
      onMount: box => {
        const bx = $('.cm-box', box);
        animate(bx, { rotate: [0, -12, 12, -10, 10, 0], scale: [1, 1.1, 1.1, 1.15, 1.15, 1.3] }, { duration: 0.9 })
          .then(() => { bx.textContent = '✨'; animate(bx, { scale: [0.4, 1.2, 1] }, spring(300, 12)); animate($('.cm-gems', box), { opacity: [0, 1], y: [20, 0] }, spring(300, 14)); });
      }
    });
    LZ.checkAch(p); save();
    const onClose = new MutationObserver(() => { if (!$('.chest-m')) { onClose.disconnect(); LZ.render(); } });
    onClose.observe($('#modal-root'), { childList: true });
  }

  function guide(ui) {
    const p = prof(), L = D.langs[p.lang];
    const ws = D.words(p.lang).filter(w => w.u === ui), ph = D.phrase(p.lang, ui);
    const sep = L.noSpace ? '' : ' ';
    modal(`<h2 class="modal-title">${D.units[ui].icon} ${D.units[ui].title}</h2><p class="modal-text">Les mots de l’unité. Touche un mot pour l’écouter.</p>
      <div class="guide">${ws.map(w => `<button class="g-w" data-say="${esc(w.t)}"><span class="g-e">${w.e}</span><span class="g-t" ${L.rtl ? 'dir="rtl"' : ''}>${esc(w.t)}</span>${w.r ? `<small>${esc(w.r)}</small>` : ''}<em>${esc(w.m)}</em>${icon('volume')}</button>`).join('')}</div>
      <div class="g-ph"><p class="small">Phrase de l’unité</p><button class="g-w wide" data-say="${esc(ph.tokens.join(sep))}"><span class="g-t" ${L.rtl ? 'dir="rtl"' : ''}>${esc(ph.tokens.join(sep))}</span><em>${esc(ph.m)}</em>${icon('volume')}</button></div>
      <div class="modal-actions"><button class="btn btn-primary" data-close>Fermer</button></div>`, {
      cls: 'wide',
      onMount: box => $$('[data-say]', box).forEach(b => b.addEventListener('click', () => speak(b.dataset.say, p.lang)))
    });
  }

  // ================= CLASSEMENT =================
  // Vrais élèves uniquement : XP de la semaine calculés par le serveur.
  // Égalité : celui qui a atteint ce score en premier passe devant.
  function league(el) {
    const p = prof();
    const end = LZ.addDays(LZ.weekKey(), 7);
    const left = Math.max(1, LZ.daysBetween(dayKey(), end));
    el.innerHTML = `<div class="page">
      <h1 class="page-title center">Classement de la semaine</h1>
      <p class="page-sub center">Chaque leçon terminée rapporte des XP. Remise à zéro dans ${left} jour${left > 1 ? 's' : ''}.</p>
      <div id="board"><div class="load-state small"><span class="spinner" aria-hidden="true"></span><p>Chargement du classement…</p></div></div>
      <div class="set-row lb-vis"><span id="visL">Apparaître dans le classement</span><button class="switch ${p.visible !== false ? 'on' : ''}" role="switch" aria-checked="${p.visible !== false}" aria-labelledby="visL" id="vis"><i></i></button></div>
    </div>`;
    const board = $('#board', el);
    const draw = list => {
      if (!list.length) {
        board.innerHTML = `<div class="empty-board"><span>🏁</span><p><b>Personne n’a encore d’XP cette semaine.</b><br>Termine une leçon pour entrer dans le classement.</p><a class="btn btn-primary" href="#/apprendre">Commencer une leçon</a></div>`;
        return;
      }
      const mine = list.find(x => x.moi);
      board.innerHTML = `<ol class="board">${list.map(x => `${x.rang > 30 ? '<li class="zone">…</li>' : ''}
        <li class="row ${x.moi ? 'me' : ''} ${x.rang <= 3 ? 'top' : ''}"><span class="rk">${x.rang <= 3 ? ['🥇', '🥈', '🥉'][x.rang - 1] : x.rang}</span><span class="av">${esc(x.avatar)}</span><span class="nm">${esc(x.prenom)}${x.moi ? ' <small>(toi)</small>' : ''}</span><span class="xp">${x.xp} XP</span></li>`).join('')}</ol>
        ${mine ? '' : '<p class="page-note">Termine une leçon cette semaine pour apparaître ici.</p>'}`;
      animate($$('.board .row', board), { opacity: [0, 1], x: [-24, 0] }, { delay: stagger(0.03), ...spring(260, 24) });
    };
    const load = () => LZ.cloud.leaderboard(p).then(draw).catch(e => {
      board.innerHTML = `<div class="load-state small"><p>${esc(e.message)}</p><button class="btn btn-ghost btn-sm" id="lbRetry">Réessayer</button></div>`;
      $('#lbRetry', board).addEventListener('click', load);
    });
    load();
    let busy = false;
    $('#vis', el).addEventListener('click', async e => {
      if (busy) return; busy = true;
      const v = !(p.visible !== false);
      try { await LZ.cloud.updateProfile(p, { visible: v }); LZ.render(); }
      catch (err) { toast(err.message, { icon: '⚠️' }); }
      busy = false;
    });
  }

  // ================= BOUTIQUE =================
  function shop(el) {
    const p = prof();
    const boost = p.boostUntil > Date.now();
    const items = [
      { id: 'freeze', e: '🧊', t: 'Gel de série', d: 'Protège ta série si tu oublies un jour. Deux au maximum.', price: 200, dis: p.freeze >= 2, note: `${p.freeze} / 2 en réserve` },
      { id: 'hearts', e: '❤️', t: 'Recharge de cœurs', d: 'Remplit tous tes cœurs tout de suite.', price: 350, dis: p.hearts >= MAX_H, note: `${p.hearts} / ${MAX_H} cœurs` },
      { id: 'boost', e: '⚡', t: 'Double XP, 15 minutes', d: 'Chaque leçon rapporte deux fois plus d’XP.', price: 100, dis: boost, note: boost ? `Actif encore ${Math.ceil((p.boostUntil - Date.now()) / 60000)} min` : 'Prêt à activer' }
    ];
    el.innerHTML = `<div class="page">
      <div class="shop-head"><div><h1 class="page-title">Boutique</h1><p class="page-sub">Les gemmes se gagnent en jouant : leçons, coffres et quêtes.</p></div><div class="wallet">${icon('gem')}<b>${p.gems}</b></div></div>
      <div class="shop-grid">${items.map(it => `<article class="item"><span class="it-e">${it.e}</span><div class="it-t"><h3>${it.t}</h3><p>${it.d}</p><small>${it.note}</small></div>
        <button class="btn ${it.dis ? 'btn-ghost' : 'btn-primary'}" data-buy="${it.id}" ${it.dis || p.gems < it.price ? 'disabled' : ''}>${icon('gem')}${it.price}</button></article>`).join('')}</div>
      <section class="card earn"><h3>Gagner des gemmes</h3><ul><li>Leçon terminée : 5 gemmes, 10 si elle est parfaite</li><li>Coffre de fin d’unité : 20 gemmes</li></ul></section>
    </div>`;
    const ART = { freeze: 'gel', hearts: 'coeurs', boost: 'double_xp' };
    let busy = false;
    $$('[data-buy]', el).forEach(b => b.addEventListener('click', async () => {
      if (busy) return;
      const it = items.find(x => x.id === b.dataset.buy);
      if (!(await confirmBox(`Acheter « ${it.t} » ?`, `Cela coûte ${it.price} gemmes. Il t’en restera ${p.gems - it.price}.`, 'Acheter'))) return;
      busy = true; b.disabled = true;
      try {
        await LZ.cloud.buy(p, ART[it.id]);   // le serveur vérifie et débite les gemmes
        if (it.id === 'hearts') { p.hearts = MAX_H; p.heartsAt = Date.now(); save(); }
        Sfx.coin(); toast(`${it.t} : c’est à toi !`, { icon: it.e });
      } catch (e) { toast(e.message, { icon: '⚠️' }); }
      busy = false; LZ.render();
    }));
    animate($$('.item', el), { opacity: [0, 1], y: [20, 0] }, { delay: stagger(0.06), ...spring(220, 22) });
  }

  // ================= PROFIL =================
  function profile(el) {
    const u = me(), p = prof();
    const rk = rankOf(p.xp), R = D.ranks[rk], next = D.ranks[rk + 1];
    const since = new Date(p.created).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    el.innerHTML = `<div class="page">
      <section class="prof-head">
        <button class="ph-av" id="avBtn" aria-label="Changer d’avatar">${p.avatar}<span>${icon('edit')}</span></button>
        <div><h1 class="page-title">${esc(p.name)}</h1><p class="page-sub">${p.kind === 'child' ? `Profil enfant${p.age ? `, ${p.age} ans` : ''}` : esc(u.email)}. Inscrit depuis ${since}.</p>
        <div class="ph-langs">${Object.keys(p.courses).map(c => `<span class="lang-dot" style="--c:${D.langs[c].color}" title="${D.langs[c].name}">${D.langs[c].abbr}</span>`).join('')}</div></div>
      </section>
      <section class="stat-grid">
        <div class="sg"><span class="sg-ic fire">${icon('flame')}</span><b data-n="${p.streak}">0</b><small>Jours de série</small></div>
        <div class="sg"><span class="sg-ic bolt">${icon('bolt')}</span><b data-n="${p.xp}">0</b><small>XP au total</small></div>
        <div class="sg"><span class="sg-ic book">${icon('book')}</span><b data-n="${p.words.length}">0</b><small>Mots appris</small></div>
        <div class="sg"><span class="sg-ic gem">${icon('trophy')}</span><b data-n="${p.weekXp}">0</b><small>XP cette semaine</small></div>
      </section>
      <section class="card rank-card" style="--c:${R.color}">
        <h2 class="card-title">Statut</h2>
        <div class="ranks">${D.ranks.map((k, i) => `<div class="rk-i ${i < rk ? 'past' : ''} ${i === rk ? 'on' : ''}" style="--c:${k.color}"><span>${k.icon}</span><small>${k.name}</small></div>`).join('')}</div>
        <p class="rank-next">${next ? `Tu es <b>${R.name}</b>. Encore <b>${next.min - p.xp} XP</b> pour devenir ${next.name}.` : 'Tu as atteint le plus haut statut. Chapeau !'}</p>
        ${next ? `<span class="bar"><i style="width:${clamp((p.xp - R.min) / (next.min - R.min), 0, 1) * 100}%"></i></span>` : ''}
      </section>
      <section class="card"><h2 class="card-title">Cette semaine</h2>${weekChart(p)}</section>
      <section><h2 class="card-title">Succès</h2><div class="ach-grid">${ACH.map(a => { const lvl = achLevel(a, p), v = a.val(p), goal = a.tiers[Math.min(lvl, a.tiers.length - 1)];
        return `<div class="ach ${lvl ? 'got' : ''}"><span class="ach-e">${a.icon}${lvl ? `<em>${lvl}</em>` : ''}</span><div><b>${a.title}</b><small>${lvl >= a.tiers.length ? `Niveau max : ${v} ${a.unit}` : `${Math.min(v, goal)} / ${goal} ${a.unit}`}</small><span class="bar"><i style="width:${clamp(v / goal, 0, 1) * 100}%"></i></span></div></div>`; }).join('')}</div></section>
    </div>`;
    $$('[data-n]', el).forEach(b => countUp(b, +b.dataset.n));
    $('#avBtn').addEventListener('click', () => pickAvatar(p));
    animate($$('.rk-i.on span', el), { rotateY: [0, 360] }, { duration: 1.2, delay: 0.3 });
  }

  function weekChart(p) {
    const t = dayKey(), days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
    const vals = days.map(d => p.days[d] || 0), mx = Math.max(p.goal, ...vals);
    const names = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    return `<div class="wchart" role="img" aria-label="XP des 7 derniers jours : ${vals.join(', ')}">${days.map((d, i) => `<span class="${d === t ? 'today' : ''}"><b>${vals[i] || ''}</b><i style="--h:${(vals[i] / mx) * 100}%"></i><em>${names[new Date(d + 'T12:00').getDay()]}</em></span>`).join('')}<hr style="--g:${(p.goal / mx) * 100}%" title="Objectif"></div>`;
  }

  function pickAvatar(p) {
    modal(`<h2 class="modal-title">Choisis ton avatar</h2><div class="avatars big">${D.avatars.map(a => `<button class="av ${a === p.avatar ? 'on' : ''}" data-av="${a}" aria-pressed="${a === p.avatar}">${a}</button>`).join('')}</div>`, {
      onMount: (box, close) => $$('[data-av]', box).forEach(b => b.addEventListener('click', async () => {
        close();
        try { await LZ.cloud.updateProfile(p, { avatar: b.dataset.av }); } catch (e) { toast(e.message, { icon: '⚠️' }); }
        LZ.render();
      }))
    });
  }

  // ================= PARENTS =================
  let parentsOk = false;
  function parents(el, r, onLeave) {
    const u = me();
    if (!parentsOk && sessionStorage.getItem('lugha:pin') !== u.id) return pinGate(el, u);
    const kids = u.profiles;
    const sel = kids.find(k => k.id === r.args[0]) || kids.find(k => k.id === u.active) || kids[0];
    el.innerHTML = `<div class="page parents-page">
      <div class="pp-head"><div><h1 class="page-title">Espace parents</h1><p class="page-sub">Suivez les progrès, fixez le temps d’écran, gérez les profils.</p></div>
        <button class="btn btn-primary" id="addKid">${icon('plus')}Ajouter un enfant</button></div>
      <div class="kids">${kids.map(k => { const L = k.lang && D.langs[k.lang]; const t = dayKey();
        return `<article class="kid ${k.id === sel?.id ? 'on' : ''}" data-id="${k.id}">
          <button class="kid-main" data-sel="${k.id}" aria-pressed="${k.id === sel?.id}"><span class="kid-av">${k.avatar}</span><span class="kid-t"><b>${esc(k.name)}</b><small>${k.kind === 'child' ? (k.age ? k.age + ' ans' : 'Enfant') : 'Moi'}${L ? `, ${L.name}` : ''}</small></span></button>
          <div class="kid-stats"><span>${icon('flame')}${k.streak}</span><span>${icon('bolt')}${k.weekXp} XP</span><span>${icon('clock')}${lessonMin(k.time[t] || 0)} min</span></div>
          <div class="kid-acts">
            <button class="btn btn-ghost btn-sm" data-use="${k.id}">${k.id === u.active ? 'Profil actif' : 'Utiliser ce profil'}</button>
            <button class="icon-btn" data-edit="${k.id}" aria-label="Modifier ${esc(k.name)}">${icon('edit')}</button>
          </div></article>`; }).join('')}
        ${kids.some(k => k.kind === 'self') ? '' : `<button class="kid add" id="addSelf"><span>${icon('plus')}</span><b>Apprendre moi aussi</b><small>Créer mon propre profil</small></button>`}
      </div>
      ${sel ? report(sel) : ''}
      <section class="card tips"><h2 class="card-title">Comment l’encourager</h2>
        <ul><li><b>Même heure chaque jour.</b> Après le goûter ou avant le coucher : la routine fait la série.</li>
        <li><b>Demandez-lui de vous apprendre un mot.</b> Expliquer à quelqu’un fixe le souvenir.</li>
        <li><b>Fêtez les séries, pas les notes.</b> Sept jours d’affilée valent plus qu’une leçon parfaite.</li></ul></section>
      <section class="card pin-card"><div>${icon('shield')}<div><b>Code parent</b><small>Protège cet espace et les réglages de temps d’écran.</small></div></div><button class="btn btn-ghost btn-sm" id="chgPin">Changer le code</button></section>
    </div>`;

    $$('[data-sel]', el).forEach(b => b.addEventListener('click', () => { location.hash = `#/parents/${b.dataset.sel}`; }));
    $$('[data-use]', el).forEach(b => b.addEventListener('click', () => { u.active = b.dataset.use; save(); const p = prof(); toast(`Profil de ${p.name} activé`, { icon: p.avatar }); location.hash = p.lang ? '#/apprendre' : '#/langues'; }));
    $$('[data-edit]', el).forEach(b => b.addEventListener('click', () => kidForm(u, u.profiles.find(k => k.id === b.dataset.edit))));
    $('#addKid').addEventListener('click', () => {
      if (u.profiles.length >= 6) return toast('Six profils au maximum par compte.', { icon: 'ℹ️' });
      kidForm(u, null);
    });
    const as = $('#addSelf'); as && as.addEventListener('click', async () => {
      if (as.disabled) return; as.disabled = true;
      try {
        await LZ.cloud.createProfile({ name: u.name, avatar: '🦉', kind: 'self', lang: 'en' });
        toast('Ton profil est créé. Choisis ta langue !', { icon: '🦉' }); location.hash = '#/langues';
      } catch (e) { as.disabled = false; toast(e.message, { icon: '⚠️' }); }
    });
    $('#chgPin').addEventListener('click', () => setPin(u, true));
    const lim = $('#limitSel');
    lim && lim.addEventListener('change', async () => {
      try { await LZ.cloud.updateProfile(sel, { limit: +lim.value }); toast(lim.value === '0' ? 'Temps d’écran : sans limite' : `Limite fixée à ${lim.value} minutes par jour`, { icon: '⏱️' }); }
      catch (e) { toast(e.message, { icon: '⚠️' }); lim.value = String(sel.limit || 0); }
    });
    animate($$('.kid', el), { opacity: [0, 1], y: [16, 0] }, { delay: stagger(0.05), ...spring(240, 22) });
    animate($$('.rchart i', el), { scaleY: [0, 1] }, { delay: stagger(0.05, { startDelay: 0.2 }), ...spring(160, 16) });
  }

  function report(k) {
    const t = dayKey(), days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
    const xp = days.map(d => k.days[d] || 0), min = days.map(d => lessonMin(k.time[d] || 0));
    const mx = Math.max(10, ...xp);
    const totalMin = min.reduce((a, b) => a + b, 0), acc = k.ans.n ? Math.round(k.ans.ok / k.ans.n * 100) : null;
    const L = k.lang && D.langs[k.lang];
    const ws = k.words.map(id => { const [lg, w] = id.split(':'); return D.words(lg).find(x => x.id === w) && { ...D.words(lg).find(x => x.id === w), lg }; }).filter(Boolean).slice(-16);
    const names = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    return `<section class="card report-card">
      <div class="rc-head"><span class="kid-av">${k.avatar}</span><div><h2 class="card-title">Rapport de ${esc(k.name)}</h2><small>7 derniers jours${L ? `, cours de ${L.name.toLowerCase()}` : ''}</small></div></div>
      <div class="rc-grid">
        <div class="rchart" role="img" aria-label="XP par jour">${days.map((d, i) => `<span><b>${xp[i] || ''}</b><i style="--h:${xp[i] / mx * 100}%"></i><em>${names[new Date(d + 'T12:00').getDay()]}</em></span>`).join('')}</div>
        <div class="rc-stats">
          <div><b>${totalMin}</b><small>minutes cette semaine</small></div>
          <div><b>${k.lessons}</b><small>leçons au total</small></div>
          <div><b>${k.words.length}</b><small>mots appris</small></div>
          <div><b>${acc === null ? '–' : acc + ' %'}</b><small>de bonnes réponses</small></div>
        </div>
      </div>
      ${ws.length ? `<div class="rc-words"><p class="small">Mots récents</p><div>${ws.map(w => `<span ${D.langs[w.lg].rtl ? 'dir="rtl"' : ''}>${w.e} ${esc(w.t)}</span>`).join('')}</div></div>` : '<p class="empty">Pas encore de mots appris. La première leçon prend trois minutes.</p>'}
      ${k.kind === 'child' ? `<div class="rc-limit"><label for="limitSel">${icon('clock')}<span><b>Temps d’écran par jour</b><small>Aujourd’hui : ${lessonMin(k.time[t] || 0)} min</small></span></label>
        <select id="limitSel">${[[0, 'Sans limite'], [10, '10 minutes'], [15, '15 minutes'], [20, '20 minutes'], [30, '30 minutes'], [45, '45 minutes'], [60, '1 heure']].map(([v, l]) => `<option value="${v}" ${k.limit === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>` : ''}
    </section>`;
  }

  function kidForm(u, k) {
    const edit = !!k;
    const st = { name: k?.name || '', age: k?.age || 8, avatar: k?.avatar || D.avatars[Math.floor(Math.random() * D.avatars.length)], lang: k?.lang || 'en' };
    modal(`<h2 class="modal-title">${edit ? `Modifier ${esc(k.name)}` : 'Ajouter un enfant'}</h2>
      <form id="kf" novalidate class="kid-form">
        <label class="ob-label" for="kn">Prénom</label><input class="ob-input" id="kn" maxlength="24" value="${esc(st.name)}" placeholder="Prénom"><p class="err" id="kn-err" aria-live="polite"></p>
        ${!k || k.kind === 'child' ? `<label class="ob-label" for="ka">Âge</label><select id="ka" class="ob-input">${Array.from({ length: 13 }, (_, i) => i + 5).map(a => `<option ${a === st.age ? 'selected' : ''} value="${a}">${a} ans</option>`).join('')}</select>` : ''}
        ${edit ? '' : `<label class="ob-label" for="kl">Langue à apprendre</label><select id="kl" class="ob-input">${D.order.map(c => `<option value="${c}" ${c === st.lang ? 'selected' : ''}>${D.langs[c].name}</option>`).join('')}</select>`}
        <p class="ob-label">Avatar</p><div class="avatars">${D.avatars.map(a => `<button type="button" class="av ${a === st.avatar ? 'on' : ''}" data-av="${a}" aria-pressed="${a === st.avatar}">${a}</button>`).join('')}</div>
        <div class="modal-actions">${edit ? `<button type="button" class="btn btn-danger-ghost" id="kdel">${icon('trash')}Supprimer</button>` : ''}<button type="button" class="btn btn-ghost" data-close>Annuler</button><button class="btn btn-primary" type="submit">${edit ? 'Enregistrer' : 'Créer le profil'}</button></div>
      </form>`, {
      onMount: (box, close) => {
        $$('[data-av]', box).forEach(b => b.addEventListener('click', () => { st.avatar = b.dataset.av; $$('[data-av]', box).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); }));
        let busy = false;
        $('#kf', box).addEventListener('submit', async e => {
          e.preventDefault();
          if (busy) return;
          const name = $('#kn', box).value.trim();
          if (name.length < 2) { $('#kn-err', box).textContent = 'Entrez un prénom d’au moins 2 lettres.'; return; }
          const age = $('#ka', box) ? +$('#ka', box).value : null;
          busy = true; $('[type=submit]', box).disabled = true;
          try {
            if (edit) await LZ.cloud.updateProfile(k, age ? { name, avatar: st.avatar, age } : { name, avatar: st.avatar });
            else {
              const keep = u.active;
              await LZ.cloud.createProfile({ name, avatar: st.avatar, age, kind: 'child', lang: $('#kl', box).value });
              if (keep) { u.active = keep; save(); }   // le parent reste sur son profil
            }
            close(); toast(edit ? 'Profil mis à jour' : `Profil de ${name} créé`, { icon: st.avatar }); LZ.render();
          } catch (err) { busy = false; $('[type=submit]', box).disabled = false; $('#kn-err', box).textContent = err.message; }
        });
        const del = $('#kdel', box);
        del && del.addEventListener('click', async () => {
          if (u.profiles.length <= 1) return toast('Gardez au moins un profil.', { icon: 'ℹ️' });
          close();
          if (!(await confirmBox(`Supprimer le profil de ${k.name} ?`, 'Sa progression, ses séries et ses gemmes seront effacées. Cette action est définitive.', 'Supprimer', true))) return;
          try { await LZ.cloud.deleteProfile(k); toast('Profil supprimé', { icon: '🗑️' }); }
          catch (err) { toast(err.message, { icon: '⚠️' }); }
          location.hash = '#/parents'; LZ.render();
        });
      }
    });
  }

  function pinGate(el, u) {
    if (!u.pin) return setPin(u, false, el);
    el.innerHTML = `<div class="page pin-page"><div class="pin-box">${icon('shield')}<h1 class="page-title">Code parent</h1><p class="page-sub">Entrez votre code à 4 chiffres pour ouvrir l’espace parents.</p>
      ${pinInputs()}<p class="err center" id="pinErr" aria-live="polite"></p><a class="link small" href="#/apprendre">Retour</a></div></div>`;
    wirePin(el, async code => {
      if (await hash('pin:' + code) === u.pin) { parentsOk = true; sessionStorage.setItem('lugha:pin', u.id); LZ.render(); }
      else { $('#pinErr').textContent = 'Code incorrect. Réessayez.'; animate($('.pins', el), { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.4 }); Sfx.bad(); return false; }
    });
  }
  function setPin(u, change, el) {
    const html = `<div class="pin-box">${icon('shield')}<h1 class="page-title">${change ? 'Nouveau code parent' : 'Créez votre code parent'}</h1><p class="page-sub">4 chiffres que vos enfants ne connaissent pas. Ils protègent cet espace.</p>${pinInputs()}<p class="err center" id="pinErr"></p></div>`;
    const done = async (code, close) => {
      const hashedPin = await hash('pin:' + code);
      try { await LZ.cloud.setPin(hashedPin); }
      catch (e) { toast(e.message, { icon: '⚠️' }); return false; }
      parentsOk = true; sessionStorage.setItem('lugha:pin', u.id);
      close && close(); toast('Code parent enregistré', { icon: '🔒' }); LZ.render();
    };
    if (el) { el.innerHTML = `<div class="page pin-page">${html}</div>`; wirePin(el, c => done(c)); }
    else modal(html, { onMount: (box, close) => wirePin(box, c => done(c, close)) });
  }
  const pinInputs = () => `<div class="pins">${[0, 1, 2, 3].map(i => `<input class="pin" inputmode="numeric" maxlength="1" aria-label="Chiffre ${i + 1}" autocomplete="off" type="password">`).join('')}</div>`;
  function wirePin(root, onFull) {
    const ins = $$('.pin', root);
    ins[0] && setTimeout(() => ins[0].focus(), 50);
    ins.forEach((inp, i) => {
      inp.addEventListener('input', async () => {
        inp.value = inp.value.replace(/\D/g, '').slice(-1);
        if (inp.value && i < 3) ins[i + 1].focus();
        const code = ins.map(x => x.value).join('');
        if (code.length === 4) { const r = await onFull(code); if (r === false) { ins.forEach(x => x.value = ''); ins[0].focus(); } }
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && i > 0) ins[i - 1].focus(); });
    });
  }

  // ================= RÉGLAGES =================
  function settings(el) {
    const u = me(), p = prof(), pr = db().prefs;
    const seg = (name, cur, opts) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<button role="radio" aria-checked="${cur === v}" class="${cur === v ? 'on' : ''}" data-${name}="${v}">${l}</button>`).join('')}</div>`;
    el.innerHTML = `<div class="page">
      <h1 class="page-title">Réglages</h1>
      <section class="card set">
        <h2 class="card-title">Compte</h2>
        <form id="nameF" class="set-row"><label for="uname">Prénom affiché</label><div class="inline"><input id="uname" class="ob-input" value="${esc(u.role === 'parent' ? u.name : p.name)}" maxlength="24"><button class="btn btn-ghost btn-sm" type="submit">Enregistrer</button></div></form>
        <div class="set-row"><span>E-mail</span><b>${esc(u.email)}</b></div>
        <div class="set-row"><span>Type de compte</span><b>${u.role === 'parent' ? 'Parent' : 'Apprenant'}</b></div>
        <div class="set-row"><span>Abonnement</span><a class="btn btn-ghost btn-sm" href="#/abonnement">${u.acces && u.acces.abonne_jusqua && Date.parse(u.acces.abonne_jusqua) > Date.now() ? 'Actif' : 'S’abonner'}</a></div>
      </section>
      <section class="card set">
        <h2 class="card-title">Apprentissage de ${esc(p.name)}</h2>
        <div class="set-row col"><span>Objectif quotidien</span>${seg('goal', p.goal, [[10, 'Détente'], [20, 'Normal'], [30, 'Sérieux'], [50, 'Intense']])}</div>
        <div class="set-row"><span>Langues</span><a class="btn btn-ghost btn-sm" href="#/langues">Gérer mes langues</a></div>
      </section>
      <section class="card set">
        <h2 class="card-title">Affichage et son</h2>
        <div class="set-row"><span id="sndL">Effets sonores</span><button class="switch ${pr.sound ? 'on' : ''}" role="switch" aria-checked="${pr.sound}" aria-labelledby="sndL" id="snd"><i></i></button></div>
        <div class="set-row col"><span>Thème</span>${seg('theme', pr.theme, [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']])}</div>
        <div class="set-row col"><span>Animations</span>${seg('motion', pr.motion, [['auto', 'Selon l’appareil'], ['reduce', 'Réduites']])}</div>
      </section>
      <section class="card set danger">
        <h2 class="card-title">Zone sensible</h2>
        <div class="set-row"><span>Supprimer le compte et toutes les données</span><button class="btn btn-danger-ghost btn-sm" id="delAcc">Supprimer</button></div>
      </section>
      <button class="btn btn-ghost btn-block" id="logout">${icon('logout')}Se déconnecter</button>
    </div>`;
    let busy = false;
    const run = async fn => { if (busy) return; busy = true; try { await fn(); } catch (e) { toast(e.message, { icon: '⚠️' }); } busy = false; };
    $('#nameF').addEventListener('submit', e => {
      e.preventDefault(); const v = $('#uname').value.trim(); if (v.length < 2) return toast('Le prénom doit avoir au moins 2 lettres.', { icon: '⚠️' });
      run(async () => {
        await LZ.cloud.setName(v);
        if (u.role !== 'parent') await LZ.cloud.updateProfile(p, { name: v });
        toast('Prénom enregistré', { icon: '✅' }); LZ.render();
      });
    });
    $$('[data-goal]', el).forEach(b => b.addEventListener('click', () => run(async () => {
      await LZ.cloud.updateProfile(p, { goal: +b.dataset.goal });
      toast(`Objectif : ${p.goal} XP par jour`, { icon: '🎯' }); LZ.render();
    })));
    $$('[data-theme]', el).forEach(b => b.addEventListener('click', () => { pr.theme = b.dataset.theme; save(); applyPrefs(); LZ.render(); }));
    $$('[data-motion]', el).forEach(b => b.addEventListener('click', () => { pr.motion = b.dataset.motion; save(); applyPrefs(); LZ.render(); }));
    $('#snd').addEventListener('click', () => { pr.sound = !pr.sound; save(); if (pr.sound) Sfx.ok(); LZ.render(); });
    $('#delAcc').addEventListener('click', async () => {
      if (!(await confirmBox('Supprimer le compte ?', 'Tous les profils, progrès et abonnements seront effacés définitivement de nos serveurs.', 'Supprimer définitivement', true))) return;
      run(async () => {
        await LZ.cloud.deleteAccount();
        LZ.cloud.clearLocal(); parentsOk = false;
        try { await LZ.sb.auth.signOut({ scope: 'local' }); } catch {}
        toast('Compte supprimé', { icon: '👋' }); location.hash = '#/';
      });
    });
    $('#logout').addEventListener('click', logout);
  }

  // Déconnexion : on envoie d'abord les leçons en attente, puis on efface
  // tout ce qui concerne le compte sur cet appareil, même sans réseau.
  let leaving = false;
  async function logout() {
    if (leaving) return; leaving = true;
    try { await Promise.race([LZ.cloud.flush(), new Promise(r => setTimeout(r, 2500))]); } catch {}
    try { const { error } = await LZ.sb.auth.signOut(); if (error) throw error; }
    catch { try { await LZ.sb.auth.signOut({ scope: 'local' }); } catch {} }
    LZ.cloud.clearLocal(); parentsOk = false;
    leaving = false;
    toast('À bientôt !', { icon: '👋' });
    location.hash = '#/';
    LZ.render();
  }

  // ================= LANGUES =================
  function courses(el) {
    const p = prof();
    el.innerHTML = `<div class="page">
      <h1 class="page-title">Langues</h1><p class="page-sub">Passe d’une langue à l’autre quand tu veux : chaque cours garde sa progression.</p>
      <div class="course-grid">${D.order.map(c => { const L = D.langs[c], cc = p.courses[c], pct = cc ? Math.round(cc.done / TOTAL * 100) : 0;
        return `<button class="course ${c === p.lang ? 'on' : ''}" data-c="${c}" style="--c:${L.color}">
          <span class="co-hi" ${L.rtl ? 'dir="rtl"' : ''}>${esc(D.words(c)[0].t)}</span><b>${L.name}</b><small>${esc(L.native)}</small>
          ${cc ? `<span class="bar"><i style="width:${pct}%"></i></span><em>${c === p.lang ? 'Cours actuel' : `${pct} %`}</em>` : '<em class="new">Commencer</em>'}</button>`; }).join('')}</div>
    </div>`;
    let busy = false;
    $$('[data-c]', el).forEach(b => b.addEventListener('click', async () => {
      if (busy) return; busy = true;
      const c = b.dataset.c, isNew = !p.courses[c];
      try {
        if (isNew) await LZ.cloud.startCourse(p, c);
        await LZ.cloud.updateProfile(p, { lang: c });
        course(p); LZ.checkAch(p); save();
        toast(isNew ? `C’est parti pour le ${D.langs[c].name.toLowerCase()} !` : `Cours de ${D.langs[c].name.toLowerCase()}`, { icon: '🌍' });
        location.hash = '#/apprendre';
      } catch (e) { toast(e.message, { icon: '⚠️' }); }
      busy = false;
    }));
    animate($$('.course', el), { opacity: [0, 1], scale: [0.9, 1] }, { delay: stagger(0.03), ...spring(260, 20) });
  }


  // ================= VOYAGE =================
  function voyage(el) {
    const p = prof();
    const TOTAL_STEPS = D.units.length * PER_UNIT;
    const stickerCount = lang => { const c = p.courses[lang]; const d = c ? c.done : 0; return d - Math.floor(d / 5); };

    const pathHtml = D.order.map((lang, i) => {
      const L = D.langs[lang], isle = D.islands[lang], c = p.courses[lang];
      const started = !!c, earned = stickerCount(lang), pct = c ? Math.round(c.done / TOTAL_STEPS * 100) : 0;
      const isActive = lang === p.lang, side = i % 2 === 0 ? 'left' : 'right';
      return `<div class="isle-stop ${started ? 'started' : 'locked'} ${isActive ? 'active' : ''} ${side}" data-lang="${lang}" style="--c:${L.color}">`
        + (isActive ? `<div class="bulle-float">${mascot('happy', 'isle-mascot')}</div>` : '')
        + `<button class="isle-btn" ${!started ? 'disabled' : ''} aria-label="${esc(L.name)}${started ? `, ${earned} autocollants, ${pct}%` : ', non commencee'}">`
        + `<div class="isle-dot"><span>${started ? isle.embleme : '\u{1F310}'}</span></div>`
        + `<div class="isle-info"><b>${esc(L.name)}</b>`
        + `<small>${started ? earned + '/20 autocollants · ' + pct + '%' : 'Pas encore commencée'}</small>`
        + `</div></button></div>`;
    }).join('');

    el.innerHTML = `<div class="page voyage-page">`
      + `<h1 class="page-title">Mon voyage</h1>`
      + `<p class="page-sub">Bulle explore le monde. Fais des leçons pour débloquer des autocollants.</p>`
      + `<div class="isle-path">${pathHtml}</div>`
      + `<div class="album" id="album"></div>`
      + `</div>`;

    let selLang = p.lang;

    function renderAlbum(lang) {
      const isle = D.islands[lang], L = D.langs[lang], c = p.courses[lang], earned = stickerCount(lang);
      const albumEl = $('#album', el);
      const stickersHtml = isle.stickers.map((s, i) =>
        `<button class="sticker ${i < earned ? 'earned' : 'locked'}" data-i="${i}" ${i >= earned ? 'disabled' : ''} aria-label="${i < earned ? esc(s.nom) : 'Mystère'}">`
        + `<span class="s-e">${i < earned ? s.e : '❓'}</span>`
        + (i < earned ? `<span class="s-nom">${esc(s.nom)}</span>` : '')
        + `</button>`
      ).join('');
      albumEl.innerHTML = `<div class="album-header">`
        + `<div class="album-badge" style="--c:${L.color}"><span>${isle.embleme}</span><b>${esc(L.name)}</b></div>`
        + `<span class="album-count">${earned} / 20 autocollants</span>`
        + `</div><div class="sticker-grid">${stickersHtml}</div>`
        + (!c ? `<p class="album-empty">Commence le cours de ${esc(L.name.toLowerCase())} pour débloquer des autocollants.</p>` : '');

      $$('.sticker.earned', albumEl).forEach(btn => {
        const i = +btn.dataset.i, s = isle.stickers[i];
        btn.addEventListener('click', () => {
          modal(`<div class="sticker-reveal">`
            + `<div class="sr-card" id="srCard"><span class="sr-e">${s.e}</span></div>`
            + `<p class="sr-nom">${esc(s.nom)}</p>`
            + `<p class="sr-lang">${esc(L.name)}</p>`
            + `<div class="modal-actions"><button class="btn btn-primary" data-close>Super !</button></div></div>`, {
            onMount: box => animate($('#srCard', box), { rotateY: [-90, 0], scale: [0.6, 1] }, spring(160, 14))
          });
        });
      });
      animate($$('.sticker', albumEl), { opacity: [0, 1], scale: [0.5, 1] },
        { delay: stagger(0.025, { startDelay: 0.05 }), ...spring(260, 20) });
    }

    $$('.isle-stop', el).forEach(s => s.classList.toggle('sel', s.dataset.lang === selLang));
    renderAlbum(selLang);

    $$('.isle-stop.started .isle-btn', el).forEach(btn => {
      const stop = btn.closest('.isle-stop');
      btn.addEventListener('click', () => {
        selLang = stop.dataset.lang;
        $$('.isle-stop', el).forEach(s => s.classList.toggle('sel', s.dataset.lang === selLang));
        renderAlbum(selLang);
        setTimeout(() => {
          const a = $('#album', el);
          a && a.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
        }, 80);
      });
    });

    animate($$('.isle-stop', el), { opacity: [0, 1], y: [14, 0] },
      { delay: stagger(0.04), duration: 0.38, ease: [0.2, 0.8, 0.2, 1] });
  }

  // ================= ABONNEMENT =================
  // Coordonnées BaridiMob affichées aux clients (à remplir avant le lancement)
  const PAY = { rip: '', titulaire: '' };
  const fmtDate = s => new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  function subscribe(el, r, onLeave) {
    const u = me(), a = u.acces || {};
    const subUntil = a.abonne_jusqua && Date.parse(a.abonne_jusqua) > Date.now() ? a.abonne_jusqua : null;
    let status;
    if (a.paiement_en_attente) status = `<div class="sub-status wait">⏳<div><b>Reçu en cours de vérification</b><p>Nous vérifions ton paiement, en général en moins de 24 heures. Ton accès s’ouvrira automatiquement.</p></div></div>`;
    else if (subUntil) status = `<div class="sub-status ok">✅<div><b>Abonnement actif</b><p>Jusqu’au ${fmtDate(subUntil)}. Tu peux le prolonger à tout moment : les 3 mois s’ajoutent à la suite.</p></div></div>`;
    else if (a.en_essai) { const d = Math.max(1, Math.ceil((Date.parse(a.essai_jusqua) - Date.now()) / 864e5)); status = `<div class="sub-status trial">🎁<div><b>Essai gratuit : encore ${d} jour${d > 1 ? 's' : ''}</b><p>Tout est ouvert jusqu’au ${fmtDate(a.essai_jusqua)}.</p></div></div>`; }
    else status = `<div class="sub-status off">🔒<div><b>Ton essai est terminé</b><p>Ta progression est gardée. Abonne-toi pour continuer les leçons.</p></div></div>`;
    const refus = !a.paiement_en_attente && a.dernier_refus ? `<p class="sub-refus">Ton dernier reçu n’a pas été accepté${a.dernier_refus ? ` : ${esc(a.dernier_refus)}` : ''}. Tu peux en envoyer un nouveau.</p>` : '';

    el.innerHTML = `<div class="page sub-page">
      <h1 class="page-title">Abonnement</h1>
      ${status}
      <section class="card sub-offer">
        <p class="sub-price"><b>2 000 DA</b><span>— 3 mois</span></p>
        <ul class="pc-list">
          <li>${icon('check')}Les 15 langues et toutes les leçons</li>
          <li>${icon('check')}Jusqu’à 6 profils pour la famille</li>
          <li>${icon('check')}Espace parents et rapports</li>
          <li>${icon('check')}Sans publicité, sans renouvellement automatique</li>
        </ul>
      </section>
      ${a.paiement_en_attente ? '' : `<section class="card sub-steps">
        <h2 class="card-title">Comment payer</h2>
        <ol class="how-pay">
          <li>Envoie <b>2 000 DA</b> par BaridiMob${PAY.rip ? ` au RIP ci-dessous.` : '.'}</li>
          <li>Fais une capture d’écran ou une photo du reçu.</li>
          <li>Envoie-la ici. Après vérification, ton accès est ouvert pour 3 mois.</li>
        </ol>
        ${PAY.rip ? `<div class="rip"><div><small>RIP BaridiMob</small><b id="ripVal">${esc(PAY.rip)}</b>${PAY.titulaire ? `<small>${esc(PAY.titulaire)}</small>` : ''}</div><button class="btn btn-ghost btn-sm" id="copyRip">Copier</button></div>` : ''}
        ${refus}
        <form id="recuF" class="recu-form" novalidate>
          <label class="recu-drop" for="recuFile"><span id="recuName">${icon('plus')}Choisir la photo du reçu</span><small>JPG, PNG ou PDF, 5 Mo maximum</small></label>
          <input id="recuFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden>
          <label class="ob-label" for="recuRef">Référence de la transaction (facultatif)</label>
          <input id="recuRef" class="ob-input" maxlength="60" autocomplete="off" placeholder="Ex. 0012345678">
          <p class="err" id="recuErr" aria-live="polite"></p>
          <button class="btn btn-primary btn-block" type="submit" id="recuBtn" disabled>Envoyer le reçu</button>
        </form>
      </section>`}
    </div>`;

    // L'état d'accès vient toujours du serveur : on le relit à l'ouverture
    LZ.cloud.refreshAccess().then(n => { if (n && JSON.stringify(n) !== JSON.stringify(a) && location.hash === '#/abonnement') LZ.render(); }).catch(() => {});

    const cp = $('#copyRip', el);
    cp && cp.addEventListener('click', () => { navigator.clipboard?.writeText(PAY.rip).then(() => toast('RIP copié', { icon: '📋' }), () => {}); });
    const f = $('#recuF', el); if (!f) return;
    const file = $('#recuFile', el), btn = $('#recuBtn', el), err = $('#recuErr', el);
    let chosen = null, busy = false;
    file.addEventListener('change', () => {
      const x = file.files[0]; err.textContent = '';
      if (!x) return;
      if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(x.type)) { err.textContent = 'Choisis une image (JPG, PNG) ou un PDF.'; return; }
      if (x.size > 5 * 1024 * 1024) { err.textContent = 'Fichier trop lourd : 5 Mo maximum.'; return; }
      chosen = x; $('#recuName', el).textContent = '📎 ' + x.name; btn.disabled = false;
    });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (busy || !chosen) return;
      busy = true; btn.disabled = true; btn.textContent = 'Envoi en cours…'; err.textContent = '';
      try {
        await LZ.cloud.sendReceipt(chosen, $('#recuRef', el).value.trim());
        toast('Reçu envoyé. Nous le vérifions rapidement.', { icon: '✅' });
        LZ.render();
      } catch (x) {
        busy = false; btn.disabled = false; btn.textContent = 'Envoyer le reçu';
        err.textContent = x.code === 'doublon' ? x.message : 'L’envoi n’a pas abouti. Réessaie.';
        if (x.code === 'doublon') LZ.cloud.refreshAccess().then(() => LZ.render()).catch(() => {});
      }
    });
  }

  // ================= ADMIN : validation des reçus =================
  function admin(el) {
    el.innerHTML = `<div class="page"><h1 class="page-title">Paiements</h1><p class="page-sub">Vérifie chaque reçu : 2 000 DA reçus sur le compte BaridiMob. Valider ouvre 3 mois d’accès.</p>
      <div id="payList"><div class="load-state small"><span class="spinner" aria-hidden="true"></span><p>Chargement…</p></div></div></div>`;
    const box = $('#payList', el);
    const STAT = { en_attente: 'À vérifier', valide: 'Validé', refuse: 'Refusé' };
    const load = () => LZ.cloud.adminList().then(list => {
      if (!list.length) { box.innerHTML = '<p class="empty">Aucun paiement pour le moment.</p>'; return; }
      box.innerHTML = `<div class="pay-list">${list.map(x => `<article class="pay ${x.statut}" data-id="${x.id}">
        <div class="pay-t"><b>${esc(x.prenom || '')}</b><small>${esc(x.email)}</small><small>${new Date(x.cree_le).toLocaleString('fr-FR')}${x.reference ? ` · Réf. ${esc(x.reference)}` : ''}</small></div>
        <span class="pay-s">${STAT[x.statut] || x.statut}</span>
        <div class="pay-a"><button class="btn btn-ghost btn-sm" data-see="${esc(x.recu_path)}">Voir le reçu</button>
        ${x.statut === 'en_attente' ? `<button class="btn btn-primary btn-sm" data-ok="${x.id}">Valider</button><button class="btn btn-danger-ghost btn-sm" data-no="${x.id}">Refuser</button>` : ''}</div>
      </article>`).join('')}</div>`;
      $$('[data-see]', box).forEach(b => b.addEventListener('click', async () => {
        const w = window.open('', '_blank');
        try { const url = await LZ.cloud.receiptUrl(b.dataset.see); if (w) w.location = url; else location.href = url; }
        catch (e) { w && w.close(); toast(e.message, { icon: '⚠️' }); }
      }));
      let busy = false;
      $$('[data-ok]', box).forEach(b => b.addEventListener('click', async () => {
        if (busy || !(await confirmBox('Valider ce paiement ?', 'Le compte aura accès pendant 3 mois de plus.', 'Valider'))) return;
        busy = true; b.disabled = true;
        try { const until = await LZ.cloud.adminValidate(b.dataset.ok); toast(`Validé : accès jusqu’au ${fmtDate(until)}`, { icon: '✅' }); }
        catch (e) { toast(e.message, { icon: '⚠️' }); }
        busy = false; load();
      }));
      $$('[data-no]', box).forEach(b => b.addEventListener('click', () => {
        if (busy) return;
        modal(`<h2 class="modal-title">Refuser ce reçu</h2><p class="modal-text">Le client verra ce motif et pourra renvoyer un reçu.</p>
          <input class="ob-input" id="motif" maxlength="140" placeholder="Ex. montant incorrect, reçu illisible">
          <div class="modal-actions"><button class="btn btn-ghost" data-close>Annuler</button><button class="btn btn-danger-ghost" id="doRefuse">Refuser</button></div>`, {
          onMount: (m, close) => $('#doRefuse', m).addEventListener('click', async () => {
            if (busy) return; busy = true;
            try { await LZ.cloud.adminRefuse(b.dataset.no, $('#motif', m).value.trim() || 'Reçu non valide'); toast('Paiement refusé', { icon: '🗑️' }); }
            catch (e) { toast(e.message, { icon: '⚠️' }); }
            busy = false; close(); load();
          })
        });
      }));
    }).catch(e => {
      box.innerHTML = `<div class="load-state small"><p>${esc(e.message)}</p><button class="btn btn-ghost btn-sm" id="payRetry">Réessayer</button></div>`;
      $('#payRetry', box).addEventListener('click', load);
    });
    load();
  }

  LZ.views = LZ.views || {};
  LZ.shell = shell;
  LZ.heartsModal = heartsModal;
  Object.assign(LZ.views, { learn, league, shop, profile, parents, settings, courses, voyage, subscribe, admin });
})();
