/* ============================================================
   Lugha — authentification (Supabase) et parcours de bienvenue
   ============================================================ */
(() => {
  'use strict';
  const { D, $, $$, esc, uid, hash, save, me, prof, course, newProfile, animate, spring, stagger, icon, mascot, logo, toast, speak, dayKey, addDays } = LZ;
  const db = () => LZ.db;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const field = ({ id, label, type = 'text', ac = 'off', ph = '', val = '', hint = '' }) => `
    <div class="field" data-f="${id}">
      <label for="${id}">${label}</label>
      <div class="inp">
        <input id="${id}" name="${id}" type="${type}" autocomplete="${ac}" placeholder="${esc(ph)}" value="${esc(val)}" aria-describedby="${id}-err">
        ${type === 'password' ? `<button type="button" class="pw-toggle" aria-label="Afficher le mot de passe">${icon('eye')}</button>` : ''}
      </div>
      ${hint ? `<p class="hint">${hint}</p>` : ''}
      <p class="err" id="${id}-err" aria-live="polite"></p>
    </div>`;

  function setErr(form, id, msg) {
    const f = $(`[data-f="${id}"]`, form); if (!f) return !msg;
    f.classList.toggle('bad', !!msg);
    $('.err', f).textContent = msg || '';
    $('input', f).setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) animate(f, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.35 });
    return !msg;
  }
  function wirePw(form) {
    $$('.pw-toggle', form).forEach(b => b.addEventListener('click', () => {
      const i = b.previousElementSibling, show = i.type === 'password';
      i.type = show ? 'text' : 'password';
      b.innerHTML = icon(show ? 'eyeoff' : 'eye');
      b.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    }));
  }

  const art = () => `
    <aside class="auth-art" aria-hidden="true">
      <div class="sky"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
      <div class="aa-float">${['Hello', '¡Hola!', '안녕하세요', 'Merhaba', 'مرحبا', 'Ciao', 'こんにちは', 'Hallo'].map((w, i) => `<span style="--i:${i}">${w}</span>`).join('')}</div>
      <div class="aa-m">${mascot('happy')}</div>
      <p class="aa-quote">Chaque jour, un petit pas vers le monde.</p>
    </aside>`;

  // Erreurs Supabase → français
  function sbErr(error) {
    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials'))
      return { field: 'pw', text: 'E-mail ou mot de passe incorrect.' };
    if (msg.includes('email not confirmed'))
      return { field: 'email', text: 'Confirme ton adresse e-mail avant de te connecter. Vérifie ta boîte mail.' };
    if (msg.includes('too many requests') || msg.includes('rate limit'))
      return { field: 'pw', text: 'Trop de tentatives. Attends quelques minutes.' };
    if (msg.includes('user already registered') || msg.includes('already been registered'))
      return { field: 'email', text: 'Un compte existe déjà avec cette adresse. Connecte-toi.' };
    if (msg.includes('password should be at least'))
      return { field: 'pw', text: 'Le mot de passe doit faire au moins 6 caractères.' };
    return { field: 'pw', text: error?.message || 'Une erreur est survenue. Réessaie.' };
  }

  // ---------- Connexion ----------
  function login(app) {
    app.innerHTML = `<div class="auth">${art()}
      <main class="auth-main">
        <div class="auth-top"><a class="logo" href="#/">${logo()}</a><a class="link" href="#/">Retour à l’accueil</a></div>
        <div class="auth-card">
          <h1>Bon retour parmi nous</h1>
          <p class="auth-sub">Connectez-vous pour reprendre là où vous vous êtes arrêté.</p>
          <form id="f" novalidate>
            ${field({ id: 'email', label: 'Adresse e-mail', type: 'email', ac: 'email', ph: 'vous@exemple.com' })}
            ${field({ id: 'pw', label: 'Mot de passe', type: 'password', ac: 'current-password' })}
            <a class="link small right" href="#/mot-de-passe">Mot de passe oublié ?</a>
            <button class="btn btn-primary btn-lg btn-block" type="submit">Se connecter</button>
          </form>
          <div class="or"><span>ou</span></div>
          <button class="btn btn-ghost btn-block" id="google">${googleIcon()}Continuer avec Google</button>
          <button class="btn btn-ghost btn-block" id="demo">${icon('sparkle')}Essayer avec un compte démo</button>
          <p class="auth-foot">Pas encore de compte ? <a class="link" href="#/inscription">Créer un compte gratuit</a></p>
        </div>
      </main></div>`;
    const f = $('#f');
    wirePw(f);
    $('#email', f).addEventListener('blur', e => { if (e.target.value) setErr(f, 'email', EMAIL.test(e.target.value.trim()) ? '' : 'Cette adresse e-mail n’est pas valide.'); });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('#email', f).value.trim().toLowerCase(), pw = $('#pw', f).value;
      let ok = setErr(f, 'email', !email ? 'Entrez votre adresse e-mail.' : !EMAIL.test(email) ? 'Cette adresse e-mail n’est pas valide.' : '');
      ok = setErr(f, 'pw', !pw ? 'Entrez votre mot de passe.' : '') && ok;
      if (!ok) return;
      const btn = $('[type=submit]', f);
      btn.disabled = true; btn.textContent = 'Connexion…';
      const { data, error } = await LZ.sb.auth.signInWithPassword({ email, password: pw });
      btn.disabled = false; btn.textContent = 'Se connecter';
      if (error) {
        const e2 = sbErr(error);
        setErr(f, e2.field, e2.text);
        return;
      }
      await LZ.syncUser(data.user);
      toast(`Content de te revoir !`, { icon: '👋' });
      const u = me(), p = prof();
      location.hash = (!p || !p.lang) ? '#/bienvenue' : '#/apprendre';
    });
    $('#google').addEventListener('click', async () => {
      const { error } = await LZ.sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) toast('Erreur Google : ' + error.message, { icon: '❌' });
    });
    $('#demo').addEventListener('click', openDemo);
    intro();
  }

  // ---------- Inscription ----------
  function signup(app, r) {
    const pre = r.q.get('l'); if (pre && D.langs[pre]) sessionStorage.setItem('lugha:lang', pre);
    const role0 = r.q.get('role') === 'parent' ? 'parent' : 'learner';
    app.innerHTML = `<div class="auth">${art()}
      <main class="auth-main">
        <div class="auth-top"><a class="logo" href="#/">${logo()}</a><a class="link" href="#/connexion">Se connecter</a></div>
        <div class="auth-card">
          <h1>Créer un compte gratuit</h1>
          <p class="auth-sub">Deux minutes, et la première leçon commence.</p>
          <form id="f" novalidate>
            <fieldset class="roles"><legend>Qui crée le compte ?</legend>
              <label class="role"><input type="radio" name="role" value="parent" ${role0 === 'parent' ? 'checked' : ''}><span><b>👨‍👩‍👧 Je suis parent</b><small>Je crée un profil pour mon enfant et je suis ses progrès.</small></span></label>
              <label class="role"><input type="radio" name="role" value="learner" ${role0 === 'learner' ? 'checked' : ''}><span><b>🎒 J’apprends moi-même</b><small>Un compte pour moi, à mon rythme.</small></span></label>
            </fieldset>
            ${field({ id: 'name', label: 'Votre prénom', ac: 'given-name', ph: 'Abdennour' })}
            ${field({ id: 'email', label: 'Adresse e-mail', type: 'email', ac: 'email', ph: 'vous@exemple.com' })}
            ${field({ id: 'pw', label: 'Mot de passe', type: 'password', ac: 'new-password', hint: 'Au moins 8 caractères, avec un chiffre.' })}
            <div class="meter" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <label class="check"><input type="checkbox" id="terms"><span>J’accepte les conditions d’utilisation et la politique de confidentialité.</span></label>
            <p class="err" id="terms-err" aria-live="polite"></p>
            <button class="btn btn-primary btn-lg btn-block" type="submit">Créer mon compte</button>
          </form>
          <div class="sent" id="conf" hidden>${icon('mail')}<p>Vérifie ta boîte mail pour activer ton compte. Clique sur le lien reçu puis reviens te connecter.</p></div>
          <p class="auth-foot">Déjà inscrit ? <a class="link" href="#/connexion">Se connecter</a></p>
        </div>
      </main></div>`;
    const f = $('#f');
    wirePw(f);
    const pwIn = $('#pw', f), bars = $$('.meter i', f);
    const strength = v => (v.length >= 8) + /\d/.test(v) + /[A-Z]/.test(v) + (/[^A-Za-z0-9]/.test(v) || v.length >= 12);
    pwIn.addEventListener('input', () => { const s = pwIn.value ? strength(pwIn.value) : 0; bars.forEach((b, i) => b.className = i < s ? 'on s' + s : ''); });
    $('#name', f).addEventListener('blur', e => { if (e.target.value) setErr(f, 'name', e.target.value.trim().length < 2 ? 'Le prénom doit avoir au moins 2 lettres.' : ''); });
    $('#email', f).addEventListener('blur', e => { if (e.target.value) setErr(f, 'email', EMAIL.test(e.target.value.trim()) ? '' : 'Cette adresse e-mail n’est pas valide.'); });
    pwIn.addEventListener('blur', () => { if (pwIn.value) setErr(f, 'pw', pwErr(pwIn.value)); });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const role = $('input[name=role]:checked', f).value;
      const name = $('#name', f).value.trim(), email = $('#email', f).value.trim().toLowerCase(), pw = pwIn.value;
      let ok = setErr(f, 'name', name.length < 2 ? 'Entrez votre prénom (2 lettres minimum).' : '');
      ok = setErr(f, 'email', !EMAIL.test(email) ? 'Entrez une adresse e-mail valide.' : '') && ok;
      ok = setErr(f, 'pw', pwErr(pw)) && ok;
      const terms = $('#terms', f).checked;
      $('#terms-err').textContent = terms ? '' : 'Cochez la case pour continuer.';
      if (!ok || !terms) return;
      const btn = $('[type=submit]', f);
      btn.disabled = true; btn.textContent = 'Création…';
      const { data, error } = await LZ.sb.auth.signUp({
        email,
        password: pw,
        options: { data: { prenom: name, role } }
      });
      btn.disabled = false; btn.textContent = 'Créer mon compte';
      if (error) {
        const e2 = sbErr(error);
        setErr(f, e2.field, e2.text);
        return;
      }
      if (!data.session) {
        f.hidden = true;
        const conf = $('#conf'); conf.hidden = false;
        animate(conf, { opacity: [0, 1], y: [12, 0] }, spring(200, 20));
        return;
      }
      await LZ.syncUser(data.user);
      location.hash = '#/bienvenue';
    });
    intro();
  }
  const pwErr = v => !v ? 'Choisissez un mot de passe.' : v.length < 8 ? 'Le mot de passe doit faire au moins 8 caractères.' : !/\d/.test(v) ? 'Ajoutez au moins un chiffre.' : '';

  // ---------- Mot de passe oublié ----------
  function forgot(app) {
    app.innerHTML = `<div class="auth">${art()}
      <main class="auth-main">
        <div class="auth-top"><a class="logo" href="#/">${logo()}</a><a class="link" href="#/connexion">Se connecter</a></div>
        <div class="auth-card">
          <h1>Mot de passe oublié</h1>
          <p class="auth-sub">Entrez votre e-mail : nous vous enverrons un lien pour en choisir un nouveau.</p>
          <form id="f" novalidate>${field({ id: 'email', label: 'Adresse e-mail', type: 'email', ac: 'email' })}
          <button class="btn btn-primary btn-lg btn-block" type="submit">Envoyer le lien</button></form>
          <div class="sent" id="sent" hidden>${icon('mail')}<p>Si un compte existe pour cette adresse, un lien vient d’être envoyé. Pensez à vérifier les courriers indésirables.</p></div>
          <p class="auth-foot"><a class="link" href="#/connexion">Retour à la connexion</a></p>
        </div>
      </main></div>`;
    const f = $('#f');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const v = $('#email', f).value.trim();
      if (!setErr(f, 'email', EMAIL.test(v) ? '' : 'Entrez une adresse e-mail valide.')) return;
      const btn = $('[type=submit]', f);
      btn.disabled = true;
      await LZ.sb.auth.resetPasswordForEmail(v, {
        redirectTo: window.location.origin + '/#/nouveau-mot-de-passe'
      });
      btn.disabled = false;
      f.hidden = true;
      const s = $('#sent'); s.hidden = false;
      animate(s, { opacity: [0, 1], y: [12, 0] }, spring(200, 20));
    });
    intro();
  }

  // ---------- Nouveau mot de passe (après reset) ----------
  function newPassword(app) {
    app.innerHTML = `<div class="auth">${art()}
      <main class="auth-main">
        <div class="auth-top"><a class="logo" href="#/">${logo()}</a></div>
        <div class="auth-card">
          <h1>Nouveau mot de passe</h1>
          <p class="auth-sub">Choisissez un mot de passe sécurisé pour votre compte.</p>
          <form id="f" novalidate>
            ${field({ id: 'pw', label: 'Nouveau mot de passe', type: 'password', ac: 'new-password', hint: 'Au moins 8 caractères, avec un chiffre.' })}
            <div class="meter" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <button class="btn btn-primary btn-lg btn-block" type="submit">Enregistrer le mot de passe</button>
          </form>
        </div>
      </main></div>`;
    const f = $('#f');
    wirePw(f);
    const pwIn = $('#pw', f), bars = $$('.meter i', f);
    const strength = v => (v.length >= 8) + /\d/.test(v) + /[A-Z]/.test(v) + (/[^A-Za-z0-9]/.test(v) || v.length >= 12);
    pwIn.addEventListener('input', () => { const s = pwIn.value ? strength(pwIn.value) : 0; bars.forEach((b, i) => b.className = i < s ? 'on s' + s : ''); });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const pw = pwIn.value;
      if (!setErr(f, 'pw', pwErr(pw))) return;
      const btn = $('[type=submit]', f);
      btn.disabled = true; btn.textContent = 'Enregistrement…';
      const { error } = await LZ.sb.auth.updateUser({ password: pw });
      btn.disabled = false; btn.textContent = 'Enregistrer le mot de passe';
      if (error) return setErr(f, 'pw', 'Impossible de mettre à jour : ' + error.message);
      toast('Mot de passe mis à jour !', { icon: '✅' });
      location.hash = '#/apprendre';
    });
    intro();
  }

  function intro() {
    animate($('.auth-card'), { opacity: [0, 1], y: [24, 0] }, spring(160, 20));
    animate($('.aa-m'), { opacity: [0, 1], scale: [0.6, 1], rotate: [-10, 0] }, spring(120, 11));
  }

  // ---------- Compte démo (100 % local, sans Supabase) ----------
  async function openDemo() {
    const email = 'demo@lugha.academy';
    let u = db().users.find(x => x.email === email);
    if (!u) {
      u = { id: uid(), name: 'Invité', email, pass: await hash('demo1234'), role: 'parent', created: Date.now(), profiles: [], active: null, pin: null };
      const p = newProfile({ name: 'Yasmine', avatar: '🦄', age: 9, kind: 'child' });
      p.lang = 'en'; p.courses = { en: { done: 3, started: Date.now() } };
      const t = dayKey();
      [30, 20, 0, 25, 40, 15].forEach((x, i) => { const k = addDays(t, -(6 - i)); if (x) { p.days[k] = x; p.time[k] = x * 12; } });
      p.xp = 130; p.weekXp = 60; p.streak = 2; p.bestStreak = 4; p.lastDay = addDays(t, -1); p.lessons = 6; p.perfect = 2; p.gems = 240;
      p.ans = { ok: 52, n: 60 };
      p.words = D.words('en').slice(0, 6).map(w => 'en:' + w.id);
      p.ach = ['first:1', 'words:0', 'perfect:1', 'xp:1'];
      const k = newProfile({ name: 'Adam', avatar: '🦁', age: 6, kind: 'child' });
      k.lang = 'es'; k.courses = { es: { done: 1, started: Date.now() } }; k.xp = 15; k.lessons = 1; k.ach = ['first:1'];
      u.profiles.push(p, k); u.active = p.id;
      db().users.push(u);
    }
    db().session = u.id; save();
    toast('Compte démo ouvert : espace parent avec Yasmine et Adam. Code parent : 1234.', { icon: '✨' });
    if (!u.pin) { u.pin = await hash('pin:1234'); save(); }
    location.hash = '#/apprendre';
  }

  // ---------- Parcours de bienvenue ----------
  function onboarding(app) {
    const u = me();
    const isParent = u.role === 'parent';
    const pre = sessionStorage.getItem('lugha:lang');
    const st = { name: '', age: 8, avatar: D.avatars[0], lang: pre && D.langs[pre] ? pre : null, why: null, level: 'new', goal: 20 };
    const steps = [...(isParent ? ['child'] : []), 'lang', 'why', 'level', 'goal', 'ready'];
    let i = 0;
    const who = () => isParent ? (st.name || 'votre enfant') : 'toi';

    const q = {
      child: () => `Pour qui créons-nous ce profil ?`,
      lang: () => isParent ? `Quelle langue pour ${esc(who())} ?` : 'Quelle langue veux-tu apprendre ?',
      why: () => isParent ? `Pourquoi ${esc(who())} apprend-il cette langue ?` : 'Pourquoi apprends-tu cette langue ?',
      level: () => isParent ? `Où en est ${esc(who())} ?` : 'Tu en es où ?',
      goal: () => isParent ? 'Quel rythme chaque jour ?' : 'Quel rythme chaque jour ?',
      ready: () => 'Tout est prêt. On commence ?'
    };
    const body = {
      child: () => `
        <div class="ob-form">
          <label class="ob-label" for="cname">Prénom de l’enfant</label>
          <input class="ob-input" id="cname" maxlength="24" placeholder="Yasmine" value="${esc(st.name)}" autocomplete="off">
          <p class="err" id="cname-err" aria-live="polite"></p>
          <p class="ob-label">Âge</p>
          <div class="chips" role="radiogroup" aria-label="Âge">${Array.from({ length: 13 }, (_, k) => k + 5).map(a => `<button class="chip ${st.age === a ? 'on' : ''}" role="radio" aria-checked="${st.age === a}" data-age="${a}">${a} ans</button>`).join('')}</div>
          <p class="ob-label">Son avatar</p>
          <div class="avatars" role="radiogroup" aria-label="Avatar">${D.avatars.map(a => `<button class="av ${st.avatar === a ? 'on' : ''}" role="radio" aria-checked="${st.avatar === a}" data-av="${a}">${a}</button>`).join('')}</div>
        </div>`,
      lang: () => `<div class="ob-langs">${D.order.map(c => { const L = D.langs[c]; return `<button class="ob-lang ${st.lang === c ? 'on' : ''}" data-lang="${c}" style="--c:${L.color}" aria-pressed="${st.lang === c}">
          <span class="ol-hi" ${L.rtl ? 'dir="rtl"' : ''}>${esc(D.words(c)[0].t)}</span><span class="ol-name">${L.name}</span></button>`; }).join('')}</div>`,
      why: () => `<div class="ob-list">${[
        ['school', '🎒', 'Pour l’école'], ['travel', '✈️', 'Pour voyager'], ['family', '👨‍👩‍👧', 'Pour parler avec la famille'],
        ['culture', '🎬', 'Pour les dessins animés, films et chansons'], ['brain', '🧠', 'Pour faire travailler le cerveau'], ['job', '💼', 'Pour l’avenir et le travail']
      ].map(([k, e, l]) => `<button class="ob-opt ${st.why === k ? 'on' : ''}" data-why="${k}" aria-pressed="${st.why === k}"><span>${e}</span>${l}</button>`).join('')}</div>`,
      level: () => `<div class="ob-list">
          <button class="ob-opt ${st.level === 'new' ? 'on' : ''}" data-level="new" aria-pressed="${st.level === 'new'}"><span>🌱</span><div><b>Je débute complètement</b><small>On commence par les tout premiers mots.</small></div></button>
          <button class="ob-opt ${st.level === 'some' ? 'on' : ''}" data-level="some" aria-pressed="${st.level === 'some'}"><span>🌿</span><div><b>Je connais déjà quelques mots</b><small>On saute l’unité « Premiers mots ».</small></div></button></div>`,
      goal: () => `<div class="ob-list">${[[10, 'Détente', '5 minutes par jour'], [20, 'Normal', '10 minutes par jour'], [30, 'Sérieux', '15 minutes par jour'], [50, 'Intense', '25 minutes par jour']]
        .map(([g, n, d]) => `<button class="ob-opt ${st.goal === g ? 'on' : ''}" data-goal="${g}" aria-pressed="${st.goal === g}"><span>${g === 10 ? '🐢' : g === 20 ? '🚲' : g === 30 ? '🚀' : '⚡'}</span><div><b>${n}</b><small>${d}</small></div><em>${g} XP</em></button>`).join('')}</div>`,
      ready: () => { const L = D.langs[st.lang]; return `<div class="ob-ready">
          <div class="ob-sum"><span class="ob-sum-av">${isParent ? st.avatar : '🎒'}</span><div><b>${esc(isParent ? st.name : u.name)}</b><small>${L.name}, objectif ${st.goal} XP par jour</small></div></div>
          <p>La première leçon dure environ trois minutes. Mets le son : chaque mot est prononcé.</p></div>`; }
    };
    const canNext = () => ({ child: st.name.trim().length >= 2, lang: !!st.lang, why: !!st.why, level: true, goal: true, ready: true }[steps[i]]);

    function draw(dir = 1) {
      const s = steps[i];
      app.innerHTML = `<div class="ob">
        <header class="ob-top">
          <button class="icon-btn" id="back" aria-label="Étape précédente" ${i === 0 ? 'disabled' : ''}>${icon('back')}</button>
          <div class="ob-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${i + 1}"><i style="width:${((i + 1) / steps.length) * 100}%"></i></div>
          <a class="link small" href="#/" id="leave">Plus tard</a>
        </header>
        <main class="ob-main">
          <div class="ob-q"><div class="ob-m">${mascot(s === 'ready' ? 'wow' : 'happy')}</div><div class="ob-bubble"><p>${q[s]()}</p></div></div>
          <div class="ob-body" id="obody">${body[s]()}</div>
        </main>
        <footer class="ob-foot"><button class="btn btn-primary btn-lg" id="next" ${canNext() ? '' : 'disabled'}>${s === 'ready' ? 'Commencer la première leçon' : 'Continuer'}</button></footer>
      </div>`;
      const ob = $('#obody');
      animate($('.ob-bubble'), { opacity: [0, 1], scale: [0.8, 1], x: [-10, 0] }, spring(300, 20));
      animate(ob.firstElementChild ? ob.firstElementChild.children : [], { opacity: [0, 1], x: [30 * dir, 0] }, { delay: stagger(0.03), duration: 0.35 });
      const refresh = () => { $('#next').disabled = !canNext(); };
      const pick = (sel, key, parse = v => v) => $$(sel, ob).forEach(b => b.addEventListener('click', () => {
        st[key] = parse(b.dataset[key === 'avatar' ? 'av' : key]);
        $$(sel, ob).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute(x.getAttribute('role') === 'radio' ? 'aria-checked' : 'aria-pressed', String(on)); });
        LZ.Sfx.tap(); refresh();
        if (key === 'lang') speak(D.words(st.lang)[0].t, st.lang);
      }));
      if (s === 'child') {
        const n = $('#cname'); n.addEventListener('input', () => { st.name = n.value; $('#cname-err').textContent = ''; refresh(); });
        n.focus();
        pick('[data-age]', 'age', Number); pick('[data-av]', 'avatar');
      }
      if (s === 'lang') pick('[data-lang]', 'lang');
      if (s === 'why') pick('[data-why]', 'why');
      if (s === 'level') pick('[data-level]', 'level');
      if (s === 'goal') pick('[data-goal]', 'goal', Number);
      $('#back').addEventListener('click', () => { if (i > 0) { i--; draw(-1); } });
      $('#next').addEventListener('click', () => {
        if (!canNext()) return;
        if (s === 'ready') return finish();
        i++; draw(1);
      });
    }

    function finish() {
      let p = prof();
      if (isParent && (!p || p.kind !== 'child' || p.lang)) {
        p = newProfile({ name: st.name.trim(), avatar: st.avatar, age: st.age, kind: 'child' });
        u.profiles.push(p); u.active = p.id;
      }
      p.lang = st.lang; p.goal = st.goal; p.motive = st.why;
      const c = course(p);
      if (st.level === 'some') c.done = Math.max(c.done, 5);
      sessionStorage.removeItem('lugha:lang');
      save();
      location.hash = `#/lecon/${c.done}`;
    }
    draw();
  }

  function googleIcon() {
    return `<svg class="ic g" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.1a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z"/></svg>`;
  }

  LZ.views = LZ.views || {};
  Object.assign(LZ.views, { login, signup, forgot, newPassword, onboarding });
  LZ.openDemo = openDemo;
})();
