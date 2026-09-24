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
    apprendre: V.learn, classement: V.league, boutique: V.shop, profil: V.profile,
    parents: V.parents, parametres: V.settings, langues: V.courses
  };
  const TITLES = {
    '': 'Lugha : apprends les langues en jouant', connexion: 'Connexion', inscription: 'Créer un compte', 'mot-de-passe': 'Mot de passe oublié',
    bienvenue: 'Bienvenue', lecon: 'Leçon', apprendre: 'Apprendre', classement: 'Classement', boutique: 'Boutique',
    profil: 'Profil', parents: 'Espace parents', parametres: 'Réglages', langues: 'Langues'
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
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    $('#modal-root').innerHTML = '';

    const r = parse();
    // Liens d'ancre de la vitrine (#methode...) : on reste sur l'accueil
    if (r.name && !TITLES[r.name] && document.getElementById(r.name)) return;
    const u = me(), p = prof();
    if (p) { tick(p); save(); }
    document.title = r.name ? `${TITLES[r.name] || 'Lugha'} · Lugha` : TITLES[''];
    document.body.dataset.route = r.name || 'home';
    window.scrollTo(0, 0);

    if (r.name !== '') { const ld = document.getElementById('loader'); ld && ld.remove(); }
    const needOnb = u && (!p || !p.lang);
    if (r.name === '') return V.home(app, r, onLeave);
    if (['connexion', 'inscription', 'mot-de-passe'].includes(r.name)) {
      if (u) return go(needOnb ? '#/bienvenue' : '#/apprendre');
      return ({ connexion: V.login, inscription: V.signup, 'mot-de-passe': V.forgot })[r.name](app, r, onLeave);
    }
    if (!u) return go('#/connexion');
    if (r.name === 'bienvenue') return needOnb ? V.onboarding(app, r, onLeave) : go('#/apprendre');
    if (needOnb) return go('#/bienvenue');
    if (r.name === 'lecon') return V.lesson(app, r, onLeave);
    if (r.name === 'parents' && u.role !== 'parent') return go('#/apprendre');
    const view = APP[r.name];
    if (!view) return go('#/apprendre');
    LZ.shell(app, r.name, view, r, onLeave);
    const v = $('#view'); v && v.focus({ preventScroll: true });
  }

  LZ.render = render;
  LZ.go = go;
  applyPrefs();
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', applyPrefs);
  addEventListener('hashchange', render);
  addEventListener('storage', e => { if (e.key === 'lugha:v1') location.reload(); });
  render();
})();
