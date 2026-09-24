/* ============================================================
   LISSAN — page d'accueil (vitrine)
   Scènes : anneaux de langues en orbite (3D), traversée Z épinglée,
   cartes inclinables, rapport parent qui se retourne, carte-prix en vrille.
   ============================================================ */
(() => {
  'use strict';
  const { D, $, $$, esc, clamp, animate, spring, stagger, onView, speak, icon, mascot, logo, toast, tilt, reduced, me, prof, save, course, countUp } = LZ;
  const hello = c => D.words(c)[0].t;
  const thanks = c => D.words(c)[1].t;

  function view(app, r, onLeave) {
    const u = me();
    const ctaHref = u ? '#/apprendre' : '#/inscription';
    const ctaLabel = u ? 'Continuer à apprendre' : 'Commencer gratuitement';

    app.innerHTML = `
    <div class="home">
      <header class="nav" id="nav">
        <a class="logo" href="#/" aria-label="Lugha, accueil">${logo()}</a>
        <nav class="nav-links" aria-label="Sections">
          <a href="#methode" data-scroll>La méthode</a><a href="#jeux" data-scroll>Les jeux</a>
          <a href="#langues" data-scroll>Les langues</a><a href="#parents" data-scroll>Parents</a><a href="#tarif" data-scroll>Tarif</a>
        </nav>
        <div class="nav-cta">
          ${u ? '' : '<a class="btn btn-ghost btn-sm hide-sm" href="#/connexion">Se connecter</a>'}
          <a class="btn btn-primary btn-sm" href="${ctaHref}">${u ? 'Mon espace' : 'Commencer'}</a>
          <button class="icon-btn nav-burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false">${icon('menu')}</button>
        </div>
      </header>
      <div class="nav-sheet" id="sheet" hidden>
        <a href="#methode" data-scroll>La méthode</a><a href="#jeux" data-scroll>Les jeux</a><a href="#langues" data-scroll>Les langues</a>
        <a href="#parents" data-scroll>Parents</a><a href="#tarif" data-scroll>Tarif</a>
        ${u ? '' : '<a href="#/connexion">Se connecter</a>'}
      </div>

      <section class="hero" id="hero" aria-label="Accueil">
        <div class="sky" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i><i class="b4"></i><svg class="grain"><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter><rect width="100%" height="100%" filter="url(#gr)"/></svg></div>
        <div class="orbit" id="orbit" aria-hidden="false"></div>
        <div class="hero-copy">
          <p class="hero-hi"><span class="hero-m">${mascot('happy')}</span><span>Salut, moi c’est Bulle. On apprend ensemble ?</span></p>
          <h1 class="hero-title" id="heroTitle">Le monde entier, un mot à la fois.</h1>
          <p class="hero-lead">Des petits jeux de dix minutes pour apprendre l’anglais, le coréen, le turc et douze autres langues. Gratuit, sans publicité, pensé pour les enfants et suivi par les parents.</p>
          <div class="hero-cta">
            <a class="btn btn-primary btn-lg" href="${ctaHref}">${ctaLabel}</a>
            ${u ? '' : '<a class="btn btn-ghost btn-lg" href="#/connexion">J’ai déjà un compte</a>'}
          </div>
          <p class="hero-tip">${icon('volume')} Touchez un mot qui passe pour l’entendre</p>
        </div>
        <a href="#methode" data-scroll class="scroll-hint" aria-label="Découvrir la méthode"><span></span></a>
      </section>

      <div class="ticker" aria-hidden="true"><div class="ticker-track">
        ${[...D.order, ...D.order].map(c => `<span style="--c:${D.langs[c].color}"><b>${esc(thanks(c))}</b><em>${D.langs[c].name}</em></span>`).join('')}
      </div></div>

      <section class="journey" id="methode" aria-label="La méthode">
        <div class="j-sticky">
          <div class="j-text">
            <h2 class="sec-title">Trois gestes, répétés chaque jour.</h2>
            <ol class="j-steps">
              <li data-s="0"><b>Jouer</b><span>Chaque leçon est une suite de petits jeux : trouver l’image, écouter, relier, construire une phrase.</span><i></i></li>
              <li data-s="1"><b>Progresser</b><span>Un chemin d’étapes, une série de jours, des gemmes et des ligues : l’envie de revenir demain.</span><i></i></li>
              <li data-s="2"><b>Parler</b><span>Chaque mot est prononcé par une voix native. On écoute, on répète, on retient.</span><i></i></li>
            </ol>
          </div>
          <div class="j-stage" id="jstage">
            <div class="j-plane" data-p="0">
              <div class="demo-q"><p class="demo-q-t">Lequel est « <b>gato</b> » ?</p>
                <div class="demo-grid"><span>🐶<em>chien</em></span><span class="ok">🐱<em>chat</em></span><span>🐦<em>oiseau</em></span><span>🐟<em>poisson</em></span></div>
                <div class="demo-bar"><i style="width:62%"></i></div></div>
            </div>
            <div class="j-plane" data-p="1">
              <div class="demo-path">
                <div class="dp-top"><span class="dp-fire">${icon('flame')} 12 jours</span><span class="dp-gem">${icon('gem')} 340</span></div>
                <div class="dp-nodes"><i class="done">${icon('check')}</i><i class="done">${icon('check')}</i><i class="cur">${icon('star')}</i><i>${icon('lock')}</i><i class="chest">🎁</i></div>
                <p class="dp-foot">Ligue Or, 3e place cette semaine</p>
              </div>
            </div>
            <div class="j-plane" data-p="2">
              <div class="demo-talk">${mascot('wow')}<div class="talk-bubble"><b>¡Hola!</b><span class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div></div>
            </div>
          </div>
        </div>
      </section>

      <section class="games" id="jeux">
        <div class="wrap">
          <h2 class="sec-title">Cinq jeux qui changent à chaque leçon.</h2>
          <p class="sec-lead">Jamais deux fois la même chose : le cerveau reste éveillé, l’enfant aussi.</p>
          <div class="game-grid">
            <article class="game-card tilt3d" style="--g:#6C4DFF"><div class="gc-demo gd-pick"><span>🍎</span><span class="hit">🍞</span><span>💧</span><span>🥛</span></div><h3>Trouve l’image</h3><p>« pan » ? Un seul dessin correspond.</p></article>
            <article class="game-card tilt3d" style="--g:#14B8A6"><div class="gc-demo gd-listen">${icon('volume')}<span class="bars"><i></i><i></i><i></i><i></i><i></i></span></div><h3>Écoute et choisis</h3><p>La voix dit un mot, on reconnaît la bonne écriture.</p></article>
            <article class="game-card tilt3d" style="--g:#E64980"><div class="gc-demo gd-match"><span>cat</span><span>chat</span><span>dog</span><span>chien</span><svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M30 14 C50 14 50 14 70 14"/><path d="M30 46 C50 46 50 46 70 46"/></svg></div><h3>Relie les paires</h3><p>Un mot, sa traduction, le plus vite possible.</p></article>
            <article class="game-card tilt3d" style="--g:#F59F00"><div class="gc-demo gd-build"><span>Ich</span><span>trinke</span><span>Wasser</span></div><h3>Construis la phrase</h3><p>On pose les mots dans le bon ordre.</p></article>
            <article class="game-card tilt3d" style="--g:#1C7ED6"><div class="gc-demo gd-type"><span class="typed">merhaba</span></div><h3>Écris le mot</h3><p>Au clavier, pour ancrer l’orthographe.</p></article>
          </div>
        </div>
      </section>

      <section class="langs" id="langues">
        <div class="wrap">
          <h2 class="sec-title">Quinze langues, une seule appli.</h2>
          <p class="sec-lead">Choisissez-en une pour commencer. Vous pourrez en ajouter d’autres quand vous voulez.</p>
          <div class="lang-grid">
            ${D.order.map(c => { const L = D.langs[c]; return `<button class="lang-card tilt3d" data-lang="${c}" style="--c:${L.color}">
              <span class="lc-hello" ${L.rtl ? 'dir="rtl"' : ''}>${esc(hello(c))}</span>
              <span class="lc-name">${L.name}</span><span class="lc-native">${esc(L.native)}</span></button>`; }).join('')}
          </div>
        </div>
      </section>

      <section class="parents" id="parents">
        <div class="wrap parents-in">
          <div class="p-copy">
            <h2 class="sec-title">Offrez-lui le monde, dix minutes par jour.</h2>
            <p class="sec-lead">Vous voyez ce qu’il apprend, combien de temps il joue et ce qu’il sait déjà dire. Pas de publicité, pas de discussion avec des inconnus.</p>
            <ul class="p-feats">
              <li>${icon('chart')}<div><b>Un rapport chaque semaine</b><span>XP, minutes, mots appris, jour par jour.</span></div></li>
              <li>${icon('clock')}<div><b>Temps d’écran maîtrisé</b><span>Vous fixez une durée par jour, l’appli s’arrête d’elle-même.</span></div></li>
              <li>${icon('shield')}<div><b>Réglages sous code parent</b><span>Un code à 4 chiffres protège votre espace.</span></div></li>
              <li>${icon('family')}<div><b>Toute la fratrie</b><span>Un profil par enfant, chacun sa langue et son rythme.</span></div></li>
            </ul>
            <a class="btn btn-sun btn-lg" href="${u ? '#/parents' : '#/inscription?role=parent'}">${u ? 'Ouvrir l’espace parents' : 'Créer mon espace parent'}</a>
          </div>
          <div class="p-card-wrap">
            <button class="report tilt3d" id="report" aria-label="Retourner le rapport d’exemple">
              <div class="rp-inner">
                <div class="rp-face rp-front">
                  <div class="rp-head"><span class="rp-av">🦄</span><div><b>Semaine de Yasmine</b><small>Exemple de rapport</small></div><span class="rp-lang" style="--c:${D.langs.en.color}">EN</span></div>
                  <div class="rp-bars">${[40, 65, 30, 80, 55, 95, 70].map((h, i) => `<span style="--h:${h}%"><i></i><em>${'LMMJVSD'[i]}</em></span>`).join('')}</div>
                  <div class="rp-stats"><span><b>12</b>jours de série</span><span><b>86</b>mots</span><span><b>74</b>minutes</span></div>
                  <small class="rp-hint">Touchez pour retourner</small>
                </div>
                <div class="rp-face rp-back">
                  <b class="rp-title">Ce qu’elle sait dire</b>
                  <ul class="rp-words">${['hello', 'thank you', 'cat', 'apple', 'water', 'mom', 'friend', 'blue'].map(w => `<li>${w}</li>`).join('')}</ul>
                  <p class="rp-note">Prochaine étape : les nombres et les couleurs.</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section class="pricing" id="tarif">
        <div class="wrap">
          <h2 class="sec-title">Gratuit, pendant tout le lancement.</h2>
          <p class="sec-lead">Tout est ouvert. Aucune carte bancaire demandée.</p>
          <div class="price-row">
            <div class="price-stage"><div class="price-card" id="priceCard">
              <div class="pc-shine"></div>
              <p class="pc-name">Lugha Libre</p>
              <p class="pc-price"><b id="priceNum">0</b><span>DA / mois</span></p>
              <ul class="pc-list">
                <li>${icon('check')}Les 15 langues et tous les jeux</li>
                <li>${icon('check')}Espace parents et rapports</li>
                <li>${icon('check')}Jusqu’à 5 profils enfants</li>
                <li>${icon('check')}Aucune publicité, jamais</li>
              </ul>
              <a class="btn btn-primary btn-lg btn-block" href="${ctaHref}">${u ? 'Continuer' : 'Créer mon compte gratuit'}</a>
            </div></div>
            <div class="soon-card">
              <p class="soon-tag">Bientôt</p><h3>Famille+</h3>
              <p>Histoires audio, niveaux avancés, certificats à imprimer. Les comptes créés pendant le lancement garderont un avantage.</p>
              <button class="btn btn-ghost" id="notify">Me prévenir</button>
            </div>
          </div>
        </div>
      </section>

      <section class="faq"><div class="wrap narrow">
        <h2 class="sec-title">Questions des parents</h2>
        ${[
          ['C’est vraiment gratuit ?', 'Oui. Pendant le lancement, tout Lugha est gratuit et sans publicité. Une formule Famille+ arrivera plus tard avec des contenus en plus ; la version gratuite restera.'],
          ['À partir de quel âge ?', 'Dès 5 ou 6 ans avec un parent à côté, en autonomie à partir de 7 ans. Les jeux avec images et la voix aident ceux qui lisent encore peu.'],
          ['Combien de temps par jour ?', 'Dix minutes suffisent. La régularité compte plus que la durée : c’est pour ça que Lugha récompense les séries de jours.'],
          ['Puis-je limiter le temps d’écran ?', 'Oui. Dans l’espace parents, fixez une durée par jour pour chaque enfant. Une fois atteinte, les leçons se mettent en pause jusqu’au lendemain.'],
          ['Quelles langues ?', 'Anglais, français, espagnol, allemand, italien, portugais, turc, coréen, chinois, japonais, russe, arabe, hindi, néerlandais et suédois.'],
          ['Et nos données ?', 'Nous demandons le strict minimum : un e-mail pour le parent et un prénom pour l’enfant. Aucune donnée n’est vendue, aucune publicité n’est affichée.']
        ].map(([q, a]) => `<details class="qa"><summary>${esc(q)}<span>${icon('plus')}</span></summary><p>${esc(a)}</p></details>`).join('')}
      </div></section>

      <section class="final"><div class="wrap final-in">
        <div class="final-m">${mascot('happy')}</div>
        <h2>Le premier mot est le plus beau. Offrez-le aujourd’hui.</h2>
        <a class="btn btn-sun btn-lg" href="${ctaHref}">${ctaLabel}</a>
      </div></section>

      <footer class="foot"><div class="wrap foot-in">
        <a class="logo" href="#/">${logo()}</a>
        <nav><a href="#methode" data-scroll>Méthode</a><a href="#langues" data-scroll>Langues</a><a href="#parents" data-scroll>Parents</a><a href="#/connexion">Connexion</a></nav>
        <p><b>lugha</b> veut dire « la langue » en arabe. Fait avec soin en Algérie. © 2026 Lugha.</p>
      </div></footer>
    </div>`;

    // ---- Défilement fluide (Lenis) ----
    let lenis = null;
    if (!reduced() && window.Lenis) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      let raf; const loop = t => { lenis.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      onLeave(() => { cancelAnimationFrame(raf); lenis.destroy(); });
    }
    const scrollToId = id => {
      const el = document.getElementById(id); if (!el) return;
      if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 });
      else el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    };
    $$('[data-scroll]', app).forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); closeSheet(); scrollToId(a.getAttribute('href').slice(1));
    }));

    // ---- Barre de navigation ----
    const nav = $('#nav'), sheet = $('#sheet'), burger = $('#burger');
    const closeSheet = () => { sheet.hidden = true; burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', () => {
      const open = sheet.hidden; sheet.hidden = !open; burger.setAttribute('aria-expanded', String(open));
      if (open) animate($$('a', sheet), { opacity: [0, 1], y: [-10, 0] }, { delay: stagger(0.04), duration: 0.3 });
    });

    // ---- Scènes au scroll ----
    const journey = setupJourney();
    const onScroll = () => {
      nav.classList.toggle('solid', scrollY > 30);
      journey.update();
    };
    let ticking = false;
    const sc = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } };
    addEventListener('scroll', sc, { passive: true });
    addEventListener('resize', sc);
    onLeave(() => { removeEventListener('scroll', sc); removeEventListener('resize', sc); });
    onScroll();

    // ---- Anneaux de langues ----
    onLeave(setupOrbit($('#orbit'), $('#hero')));

    // ---- Intro (loader puis révélation) ----
    runIntro();

    // ---- Cartes inclinables ----
    $$('.tilt3d', app).forEach(el => onLeave(tilt(el, el.classList.contains('report') ? 12 : 9)));
    $$('.game-card', app).forEach(el => el.classList.add('pre'));
    onLeave(onView($('.game-grid'), g => { animate($$('.game-card', g), { opacity: [0, 1], y: [40, 0], rotateX: [18, 0] }, { delay: stagger(0.08), ...spring(120, 18) }); $$('.game-card', g).forEach(c => c.classList.remove('pre')); }, 0.15));
    onLeave(onView($('.lang-grid'), g => animate($$('.lang-card', g), { opacity: [0, 1], scale: [0.85, 1] }, { delay: stagger(0.035), ...spring(200, 20) }), 0.1));

    $$('.lang-card', app).forEach(b => b.addEventListener('click', () => {
      const c = b.dataset.lang;
      speak(hello(c), c);
      const p = prof();
      if (p) { p.lang = c; course(p); save(); location.hash = '#/apprendre'; }
      else setTimeout(() => { location.hash = `#/inscription?l=${c}`; }, 450);
    }));

    // ---- Rapport parent qui se retourne ----
    const rep = $('#report');
    rep.addEventListener('click', () => rep.classList.toggle('flipped'));

    // ---- Carte-prix en vrille ----
    const card = $('#priceCard');
    card.classList.add('pre');
    onLeave(onView(card, () => {
      card.classList.remove('pre');
      animate(card, { rotateY: [-200, 0], opacity: [0, 1], scale: [0.7, 1] }, spring(38, 9)).then(() => card.classList.add('floating'));
      countUp($('#priceNum'), 0, { from: 15, dur: 1400 });
    }, 0.35));
    onLeave(tilt(card, 14));
    $('#notify').addEventListener('click', () => toast('C’est noté. Vous serez prévenu au lancement de Famille+.', { icon: '🔔' }));

    // FAQ : animation d'ouverture
    $$('.qa', app).forEach(d => d.addEventListener('toggle', () => { if (d.open) animate($('p', d), { opacity: [0, 1], y: [-6, 0] }, { duration: 0.3 }); }));

    // Final
    onLeave(onView($('.final-m'), m => animate(m, { y: [60, 0], rotate: [-12, 0], opacity: [0, 1] }, spring(160, 12))));
  }

  // ========== Intro : loader d'accueil puis titre mot à mot ==========
  function runIntro() {
    const loader = document.getElementById('loader');
    const title = document.getElementById('heroTitle');
    title.innerHTML = title.textContent.split(' ').map(w => `<span class="w"><span>${esc(w)}</span></span>`).join(' ');
    const words = $$('.w > span', title);
    const rest = [$('.hero-hi'), $('.hero-lead'), $('.hero-cta'), $('.hero-tip')].filter(Boolean);
    const reveal = () => {
      animate(words, { opacity: [0, 1], y: ['0.6em', '0em'], rotateX: [-70, 0], filter: ['blur(8px)', 'blur(0px)'] }, { delay: stagger(0.06), duration: 0.8, ease: [0.2, 0.8, 0.2, 1] });
      animate(rest, { opacity: [0, 1], y: [18, 0] }, { delay: stagger(0.09, { startDelay: 0.35 }), duration: 0.7, ease: [0.2, 0.8, 0.2, 1] });
      animate($('#orbit'), { opacity: [0, 1], scale: [0.7, 1] }, { duration: 1.8, ease: [0.16, 1, 0.3, 1] });
    };
    if (!loader) { reveal(); return; }
    if (reduced() || sessionStorage.getItem('lugha:intro')) { loader.remove(); reveal(); return; }
    sessionStorage.setItem('lugha:intro', '1');
    [...words, ...rest].forEach(n => n.style.opacity = 0);
    $('#orbit').style.opacity = 0;
    const seq = [['Bonjour', 'fr'], ['Hello', 'en'], ['¡Hola!', 'es'], ['안녕하세요', 'ko'], ['مرحبا', 'ar'], ['こんにちは', 'ja'], ['Merhaba', 'tr']];
    const out = $('.ld-word', loader);
    let i = 0;
    const step = () => {
      if (i >= seq.length) {
        loader.classList.add('open');
        setTimeout(() => loader.remove(), 1100);
        setTimeout(reveal, 250);
        return;
      }
      const [w, c] = seq[i++];
      out.textContent = w; out.style.color = D.langs[c].color;
      animate(out, { opacity: [0, 1, 1, 0], filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(6px)'], scale: [0.92, 1, 1, 1.04] }, { duration: 0.42, times: [0, 0.35, 0.7, 1] });
      setTimeout(step, 360);
    };
    setTimeout(step, 200);
  }

  // ========== Anneaux de langues en orbite ==========
  function setupOrbit(root, hero) {
    const ringDefs = [
      { langs: D.order.slice(0, 8), get: hello, tilt: 0.24, speed: 0.07, rx: 1, off: 0, size: 1 },
      { langs: D.order.slice(8), get: hello, tilt: -0.16, speed: -0.055, rx: 0.8, off: 0.5, size: 0.92 },
      { langs: ['es', 'ja', 'de', 'ru', 'it', 'ko', 'tr', 'zh', 'pt', 'ar'], get: thanks, tilt: 0.1, speed: 0.04, rx: 1.2, off: 1.3, size: 0.74 }
    ];
    const items = [];
    ringDefs.forEach((rd, ri) => rd.langs.forEach((c, i) => {
      const L = D.langs[c];
      const b = document.createElement('button');
      b.className = 'ow ring' + ri;
      b.style.setProperty('--c', L.color);
      b.innerHTML = `<span ${L.rtl ? 'dir="rtl"' : ''}>${esc(rd.get(c))}</span>`;
      b.setAttribute('aria-label', `Écouter « ${rd.get(c)} » en ${L.name.toLowerCase()}`);
      b.addEventListener('click', e => {
        e.stopPropagation(); speak(rd.get(c), c);
        b.dataset.tip = L.name;
        b.classList.add('said'); setTimeout(() => b.classList.remove('said'), 1400);
      });
      root.appendChild(b);
      items.push({ b, rd, a: rd.off + (i / rd.langs.length) * Math.PI * 2 });
    }));

    let R = 400, t = 0, spin = 0, vel = 0, mx = 0, my = 0, tmx = 0, tmy = 0, last = performance.now(), raf = 0, visible = true;
    const measure = () => { const w = hero.clientWidth, h = hero.clientHeight; R = w < 600 ? w * 0.66 : Math.min(w * 0.46, h * 0.75, 640); };
    measure();

    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      t += dt; vel *= 0.94; spin += vel * dt;
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      for (const it of items) {
        const { rd } = it;
        const th = it.a + t * rd.speed + spin + mx * 0.35;
        const rx = R * rd.rx;
        const z = Math.sin(th);
        const x = Math.cos(th) * rx;
        const y = z * rx * (rd.tilt + my * 0.08) - R * 0.04;
        const k = (z + 1) / 2;
        const s = (0.66 + 0.46 * k) * rd.size;
        let o = 0.28 + 0.72 * k;
        const nx = Math.abs(x) / R;
        if (z > 0) o *= clamp((nx - 0.18) / 0.4, 0.07, 1) * z + (1 - z);
        const blur = z < 0 ? (-z) * 2.4 : 0;
        const el = it.b;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${s.toFixed(3)})`;
        el.style.opacity = o.toFixed(3);
        el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none';
        el.style.zIndex = z > 0 ? 5 : 1;
      }
      if (visible && !reduced()) raf = requestAnimationFrame(frame);
    };
    const start = () => { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); };

    // Glisser pour faire tourner
    let dragging = false, px = 0;
    const down = e => { if (e.target.closest('a, .btn')) return; dragging = true; px = e.clientX; };
    const move = e => {
      const r = hero.getBoundingClientRect();
      tmx = (e.clientX - r.left) / r.width - 0.5; tmy = (e.clientY - r.top) / r.height - 0.5;
      if (dragging) { vel += (e.clientX - px) * 0.012; px = e.clientX; }
    };
    const up = () => { dragging = false; };
    hero.addEventListener('pointerdown', down);
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerup', up);
    const onResize = () => measure();
    addEventListener('resize', onResize);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { threshold: 0 });
    io.observe(hero);
    const onVis = () => { visible = !document.hidden; if (visible) start(); };
    document.addEventListener('visibilitychange', onVis);
    if (reduced()) frame(performance.now()); else start();

    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      removeEventListener('pointermove', move); removeEventListener('pointerup', up);
      removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis);
    };
  }

  // ========== Traversée Z épinglée (scrollytelling) ==========
  function setupJourney() {
    const sec = $('#methode');
    const planes = $$('.j-plane', sec);
    const steps = $$('.j-steps li', sec);
    if (reduced()) { sec.classList.add('static'); return { update() {} }; }
    const GAP = 900;
    return {
      update() {
        const r = sec.getBoundingClientRect();
        const span = r.height - innerHeight;
        const p = clamp(-r.top / (span || 1), 0, 1);
        // Chaque plan marque une pause nette avant que la caméra n'avance vers le suivant
        const seg = p * 2, k = Math.min(1, Math.floor(seg)), f = seg - k;
        const g0 = clamp((f - 0.28) / 0.44, 0, 1), g = g0 * g0 * (3 - 2 * g0);
        const cam = p >= 1 ? GAP * 2 : (k + g) * GAP;
        planes.forEach((pl, i) => {
          const rel = -GAP * i + cam;
          const side = i % 2 ? 1 : -1;
          const x = rel < 0 ? side * (-rel) * 0.16 : 0;
          const y = rel < 0 ? (-rel) * 0.04 : 0;
          const op = rel > 0 ? clamp(1 - rel / 260, 0, 1) : clamp(1 + rel / 2000, 0.25, 1);
          const blur = rel < 0 ? Math.min(8, -rel / 140) : Math.min(12, rel / 25);
          pl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${Math.min(rel, 700).toFixed(1)}px)`;
          pl.style.opacity = op.toFixed(3);
          pl.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : 'none';
          pl.style.visibility = op < 0.02 ? 'hidden' : 'visible';
          pl.style.zIndex = String(10 - i);
        });
        const active = clamp(Math.round(cam / GAP), 0, 2);
        steps.forEach((s, i) => {
          s.classList.toggle('on', i === active);
          const local = clamp(cam / GAP - i + 1, 0, 1);
          s.style.setProperty('--f', local.toFixed(3));
        });
      }
    };
  }

  LZ.views = LZ.views || {};
  LZ.views.home = view;
})();
