/* ============================================================
   LISSAN — routeur par hash (#/...) et démarrage
   ============================================================ */
(() => {
  'use strict';
  const { $, me, prof, tick, save, applyPrefs } = LZ;
  const V = LZ.views;
  const app = document.getElementById('app');
  let cleanups = [];
  const onLeave = f => { if (typeof f === 'function') cleanups.push(f); };

  const APP = {
    apprendre: V.learn, classement: V.league, voyage: V.voyage, boutique: V.shop, profil: V.profile,
    parents: V.parents, parametres: V.settings, langues: V.courses,
    abonnement: V.subscribe, admin: V.admin
  };
  const TITLES = {
    '': 'Lugha : apprends les langues en jouant', connexion: 'Connexion', inscription: 'Créer un compte',
    'mot-de-passe': 'Mot de passe oublié', 'nouveau-mot-de-passe': 'Nouveau mot de passe',
    bienvenue: 'Bienvenue', lecon: 'Leçon', apprendre: 'Apprendre', classement: 'Classement',
    voyage: 'Mon voyage', boutique: 'Boutique', profil: 'Profil', parents: 'Espace parents',
    parametres: 'Réglages', langues: 'Langues', abonnement: 'Abonnement', admin: 'Administration'
  };

  function parse() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    return { name: parts[0] || '', args: parts.slice(1), q: new URLSearchParams(qs || '') };
  }
  const go = h => { if (location.hash !== h) location.hash = h; else render(); };

  function render() {
    cleanups.forEach(f => { try { f(); } catch (e) { console.warn(e); } });
    cleanups = [];
    if (LZ.canSpeak) speechSynthesis.cancel();
    $('#modal-root').innerHTML = '';

    const r = parse();
    if (r.name && !TITLES[r.name] && document.getElementById(r.name)) return;
    const u = me(), p = prof();
    if (p) { tick(p); save(); }
    document.title = r.name ? `${TITLES[r.name] || 'Lugha'} · Lugha` : TITLES[''];
    document.body.dataset.route = r.name || 'home';
    window.scrollTo(0, 0);

    if (r.name !== '') { const ld = document.getElementById('loader'); ld && ld.remove(); }
    const needOnb = u && (!u.role || !p || !p.lang);
    if (r.name === '') return V.home(app, r, onLeave);
    if (r.name === 'nouveau-mot-de-passe') return V.newPassword(app, r, onLeave);
    if (['connexion', 'inscription', 'mot-de-passe'].includes(r.name)) {
      if (u) return go(needOnb ? '#/bienvenue' : '#/apprendre');
      return ({ connexion: V.login, inscription: V.signup, 'mot-de-passe': V.forgot })[r.name](app, r, onLeave);
    }
    if (!u) return go('#/connexion');
    if (r.name === 'bienvenue') return needOnb ? V.onboarding(app, r, onLeave) : go('#/apprendre');
    if (needOnb) return go('#/bienvenue');
    if (r.name === 'lecon') return V.lesson(app, r, onLeave);
    if (r.name === 'admin' && !(u.acces && u.acces.admin)) return go('#/apprendre');
    if (r.name === 'parents' && u.role !== 'parent') return go('#/apprendre');
    const view = APP[r.name];
    if (!view) return go('#/apprendre');
    LZ.shell(app, r.name, view, r, onLeave);
    const v = $('#view'); v && v.focus({ preventScroll: true });
  }

  // Charge le compte depuis Supabase (source de vérité)
  // Un seul chargement à la fois par compte (connexion + événement d'auth = un appel)
  let inflight = null;
  async function syncUser(sbUser) {
    if (inflight && inflight.id === sbUser.id) return inflight.p;
    const p = syncOnce(sbUser);
    inflight = { id: sbUser.id, p };
    try { return await p; } finally { if (inflight && inflight.p === p) inflight = null; }
  }
  async function syncOnce(sbUser) {
    try { return await LZ.cloud.pull(sbUser); }
    catch (e) {
      // Hors ligne : on garde la copie locale de ce même compte si elle existe
      const u = LZ.db.users.find(x => x.id === sbUser.id);
      if (u) { LZ.db.session = u.id; LZ.save(); toast('Mode hors ligne : tes résultats seront envoyés au retour du réseau.', { icon: '📶' }); return u; }
      throw e;
    }
  }
  LZ.syncUser = syncUser;
  const { toast } = LZ;

  LZ.render = render;
  LZ.go = go;
  applyPrefs();
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', applyPrefs);
  addEventListener('hashchange', render);
  addEventListener('storage', e => { if (e.key === 'lugha:v1') location.reload(); });

  // Initialisation Supabase puis premier rendu
  init();

  async function init() {
    // Aucune session Supabase : aucune donnée de compte ne doit rester sur l'appareil
    let session = null;
    try { ({ data: { session } } = await LZ.sb.auth.getSession()); } catch (e) { console.warn(e); }
    if (session) {
      try { await syncUser(session.user); }
      catch (e) { app.innerHTML = loadError(); $('#retryInit').addEventListener('click', () => location.reload()); return; }
    } else if (LZ.db.session || LZ.db.users.length) LZ.cloud.clearLocal();

    LZ.sb.auth.onAuthStateChange((event, s2) => {
      // Ne jamais attendre une requête Supabase dans ce rappel (verrou interne)
      setTimeout(async () => {
        if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
        if (event === 'SIGNED_OUT' || !s2) { LZ.cloud.clearLocal(); if (location.hash !== '#/') location.hash = '#/'; else render(); return; }
        if (event === 'PASSWORD_RECOVERY') { await syncUser(s2.user).catch(() => {}); location.hash = '#/nouveau-mot-de-passe'; return; }
        if (event === 'SIGNED_IN' && (!LZ.me() || LZ.me().id !== s2.user.id)) {
          try { await syncUser(s2.user); } catch (e) { toast('Connexion impossible. Réessaie.', { icon: '⚠️' }); return; }
          const p = prof();
          location.hash = (!LZ.me().role || !p || !p.lang) ? '#/bienvenue' : '#/apprendre';
          render();
        }
      }, 0);
    });
    // Retour de Google (?code=...) : on nettoie l'adresse une fois la session établie
    if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname + (LZ.me() ? (prof() && prof().lang ? '#/apprendre' : '#/bienvenue') : '#/connexion'));
    render();
  }
  function loadError() {
    return `<div class="load-state" role="alert">${LZ.mascot('sad', 'm-md')}<h2>Impossible de charger ton compte</h2>
      <p>Vérifie ta connexion internet, puis réessaie.</p><button class="btn btn-primary" id="retryInit">Réessayer</button></div>`;
  }
})();
