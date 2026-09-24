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
    parents: V.parents, parametres: V.settings, langues: V.courses
  };
  const TITLES = {
    '': 'Lugha : apprends les langues en jouant', connexion: 'Connexion', inscription: 'Créer un compte',
    'mot-de-passe': 'Mot de passe oublié', 'nouveau-mot-de-passe': 'Nouveau mot de passe',
    bienvenue: 'Bienvenue', lecon: 'Leçon', apprendre: 'Apprendre', classement: 'Classement',
    voyage: 'Mon voyage', boutique: 'Boutique', profil: 'Profil', parents: 'Espace parents',
    parametres: 'Réglages', langues: 'Langues'
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
    if (r.name && !TITLES[r.name] && document.getElementById(r.name)) return;
    const u = me(), p = prof();
    if (p) { tick(p); save(); }
    document.title = r.name ? `${TITLES[r.name] || 'Lugha'} · Lugha` : TITLES[''];
    document.body.dataset.route = r.name || 'home';
    window.scrollTo(0, 0);

    if (r.name !== '') { const ld = document.getElementById('loader'); ld && ld.remove(); }
    const needOnb = u && (!p || !p.lang);
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
    if (r.name === 'parents' && u.role !== 'parent') return go('#/apprendre');
    const view = APP[r.name];
    if (!view) return go('#/apprendre');
    LZ.shell(app, r.name, view, r, onLeave);
    const v = $('#view'); v && v.focus({ preventScroll: true });
  }

  // Crée ou met à jour l'utilisateur local à partir de la session Supabase
  async function syncUser(sbUser) {
    const db = LZ.db;
    let u = db.users.find(x => x.id === sbUser.id);
    if (!u) {
      const meta = sbUser.user_metadata || {};
      const role = meta.role || 'learner';
      u = {
        id: sbUser.id,
        name: meta.prenom || sbUser.email?.split('@')[0] || 'Utilisateur',
        email: sbUser.email || '',
        role,
        pass: '',
        created: Date.now(),
        profiles: [],
        active: null,
        pin: meta.code_parent || null
      };
      if (role === 'learner') {
        const p = LZ.newProfile({ name: u.name, kind: 'self' });
        u.profiles.push(p);
        u.active = p.id;
      }
      db.users.push(u);
    } else {
      if (sbUser.email) u.email = sbUser.email;
      const meta = sbUser.user_metadata || {};
      if (meta.prenom && !u.name) u.name = meta.prenom;
    }
    db.session = u.id;
    LZ.save();
    return u;
  }
  LZ.syncUser = syncUser;

  LZ.render = render;
  LZ.go = go;
  applyPrefs();
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', applyPrefs);
  addEventListener('hashchange', render);
  addEventListener('storage', e => { if (e.key === 'lugha:v1') location.reload(); });

  // Initialisation Supabase puis premier rendu
  init();

  async function init() {
    if (LZ.sb) {
      const { data: { session } } = await LZ.sb.auth.getSession();
      if (session) await syncUser(session.user);

      LZ.sb.auth.onAuthStateChange(async (event, session) => {
        if (event === 'INITIAL_SESSION') return; // déjà géré via getSession
        if (session) {
          await syncUser(session.user);
          if (event === 'PASSWORD_RECOVERY') {
            location.hash = '#/nouveau-mot-de-passe';
            render();
            return;
          }
        } else if (event === 'SIGNED_OUT') {
          LZ.db.session = null;
          LZ.save();
        }
        render();
      });
    }
    render();
  }
})();
