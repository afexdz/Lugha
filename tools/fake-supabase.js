/* ============================================================
   Lugha — faux Supabase pour les tests de bout en bout.
   Remplace vendor/supabase.js dans le navigateur de test
   (jamais servi aux utilisateurs). Reproduit les règles du
   serveur (supabase/migrations/20261007_production.sql) :
   droits par colonne, RLS, terminer_lecon idempotent, accès
   essai/abonnement, classement, paiements, admin.
   État conservé dans localStorage (__fakesb) pour tester les
   rechargements de page.
   ============================================================ */
(() => {
  'use strict';
  const KEY = '__fakesb', SKEY = '__fakesb_session';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const st = load() || { users: [], comptes: [], profils: [], cours: [], activite: [], mots: [], lecons: [], admins: [], abonnements: [], paiements: [], objets: [], calls: [] };
  const persist = () => localStorage.setItem(KEY, JSON.stringify(st));
  const uuid = () => crypto.randomUUID();
  const now = () => new Date();
  const algDay = (d = now()) => new Date(d.getTime() + 3600e3).toISOString().slice(0, 10); // Africa/Algiers = UTC+1
  const weekStart = (d = now()) => { const x = new Date(algDay(d) + 'T00:00:00Z'); const w = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - w); return x.toISOString().slice(0, 10); };
  const addD = (s, n) => { const x = new Date(s + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const err = m => ({ data: null, error: { message: m } });
  const ok = d => ({ data: d, error: null });
  const delay = () => new Promise(r => setTimeout(r, 15));

  // Réseau coupé simulé
  const offline = () => localStorage.getItem('__fakesb_offline') === '1';
  const net = () => ({ data: null, error: { message: 'TypeError: Failed to fetch' } });

  let session = null; try { session = JSON.parse(localStorage.getItem(SKEY)); } catch {}
  const uid = () => session && session.user.id;
  const listeners = [];
  const emit = (ev, s) => listeners.forEach(f => setTimeout(() => f(ev, s), 0));
  const setSession = s => { session = s; if (s) localStorage.setItem(SKEY, JSON.stringify(s)); else localStorage.removeItem(SKEY); };

  // ---- helpers de test (appelés depuis Playwright) ----
  window.__fake = {
    st, persist,
    createUser({ email, password = 'motdepasse1', meta = {}, google = false, createdDaysAgo = 0 }) {
      const id = uuid(), cree = new Date(Date.now() - createdDaysAgo * 864e5).toISOString();
      st.users.push({ id, email, password, meta, google, cree });
      const role = meta.role === 'learner' || meta.role === 'apprenant' ? 'apprenant' : meta.role === 'parent' ? 'parent' : null;
      const prenom = meta.prenom || meta.given_name || meta.full_name || email.split('@')[0];
      st.comptes.push({ id, prenom, role, code_parent: null, cree_le: cree });
      persist(); return id;
    },
    makeAdmin(id) { st.admins.push({ user_id: id }); persist(); },
    calls: () => st.calls
  };

  function rowsVisible(table) {
    const me = uid(); if (!me) return [];
    const mine = id => st.profils.some(p => p.id === id && p.compte_id === me);
    switch (table) {
      case 'comptes': return st.comptes.filter(r => r.id === me);
      case 'profils': return st.profils.filter(r => r.compte_id === me);
      case 'cours': case 'activite': case 'mots': return st[table].filter(r => mine(r.profil_id));
      case 'paiements': return st.paiements.filter(r => r.compte_id === me);
      default: return [];
    }
  }
  const GRANT_UPD = {
    comptes: ['prenom', 'code_parent', 'role'],
    profils: ['prenom', 'avatar', 'age', 'langue', 'objectif', 'motivation', 'limite_minutes', 'classement_visible']
  };
  const GRANT_INS = {
    profils: ['compte_id', 'prenom', 'avatar', 'age', 'type', 'langue', 'objectif', 'motivation', 'limite_minutes'],
    paiements: ['recu_path', 'reference']
  };

  function query(table) {
    const f = []; let mode = 'select', payload = null, single = null, ord = null;
    const b = {
      select() { return b; },
      eq(c, v) { f.push(r => r[c] === v); return b; },
      in(c, a) { f.push(r => a.includes(r[c])); return b; },
      gte(c, v) { f.push(r => r[c] >= v); return b; },
      order(c) { ord = c; return b; },
      maybeSingle() { single = 'maybe'; return b; },
      single() { single = 'one'; return b; },
      insert(r) { mode = 'insert'; payload = r; return b; },
      update(r) { mode = 'update'; payload = r; return b; },
      delete() { mode = 'delete'; return b; },
      then(res, rej) { return run().then(res, rej); }
    };
    async function run() {
      await delay();
      st.calls.push(`${mode}:${table}`); persist();
      if (offline()) return net();
      if (!uid()) return err('JWT expired');
      if (mode === 'select') {
        let rows = rowsVisible(table).filter(r => f.every(fn => fn(r)));
        if (ord) rows = rows.slice().sort((a, b2) => String(a[ord]).localeCompare(String(b2[ord])));
        if (single === 'maybe') return ok(rows[0] || null);
        if (single === 'one') return rows.length === 1 ? ok(rows[0]) : err('JSON object requested, multiple (or no) rows returned');
        return ok(rows);
      }
      if (mode === 'insert') {
        const bad = Object.keys(payload).filter(k => !(GRANT_INS[table] || []).includes(k));
        if (bad.length) return err(`permission denied for table ${table}`);
        if (table === 'profils') {
          if (payload.compte_id !== uid()) return err('new row violates row-level security policy');
          if (st.profils.filter(p => p.compte_id === uid()).length >= 6) return err('LUGHA:trop_de_profils');
          const row = Object.assign({ id: uuid(), xp: 0, xp_semaine: 0, semaine: null, gemmes: 0, serie: 0, meilleure_serie: 0, dernier_jour: null, gels: 0, double_xp_jusqua: null, lecons: 0, lecons_parfaites: 0, reponses_justes: 0, reponses_total: 0, classement_visible: true, dernier_xp_le: null, limite_minutes: 0, objectif: 20, cree_le: now().toISOString() }, payload);
          st.profils.push(row); persist();
          return ok(single ? row : [row]);
        }
        if (table === 'paiements') {
          const me = uid();
          if (!String(payload.recu_path).startsWith(me + '/')) return err('new row violates row-level security policy');
          if (st.paiements.some(p => p.compte_id === me && p.statut === 'en_attente')) return err('duplicate key value violates unique constraint "paiements_un_en_attente"');
          const row = { id: uuid(), compte_id: me, montant: 2000, duree_mois: 3, statut: 'en_attente', motif_refus: null, cree_le: now().toISOString(), ...payload };
          st.paiements.push(row); persist();
          return ok(single ? row : [row]);
        }
        return err('permission denied');
      }
      if (mode === 'update') {
        const bad = Object.keys(payload).filter(k => !(GRANT_UPD[table] || []).includes(k));
        if (bad.length) return err(`permission denied for table ${table}`);
        rowsVisible(table).filter(r => f.every(fn => fn(r))).forEach(r => Object.assign(r, payload));
        persist(); return ok(null);
      }
      if (mode === 'delete') {
        if (table !== 'profils') return err('permission denied');
        const ids = rowsVisible(table).filter(r => f.every(fn => fn(r))).map(r => r.id);
        st.profils = st.profils.filter(r => !ids.includes(r.id));
        ['cours', 'activite', 'mots', 'lecons'].forEach(t => { st[t] = st[t].filter(r => !ids.includes(r.profil_id)); });
        persist(); return ok(null);
      }
    }
    return b;
  }

  // ---- RPC : mêmes règles que les fonctions SQL ----
  const own = id => st.profils.find(p => p.id === id && p.compte_id === uid());
  const isAdmin = () => st.admins.some(a => a.user_id === uid());
  function access(id) {
    const c = st.comptes.find(x => x.id === id), a = st.abonnements.find(x => x.compte_id === id);
    const essai = new Date(Date.parse(c.cree_le) + 7 * 864e5), sub = a && Date.parse(a.actif_jusqua) > Date.now();
    return { essai_jusqua: essai.toISOString(), abonne_jusqua: a ? a.actif_jusqua : null, actif: Date.now() < +essai || !!sub, en_essai: Date.now() < +essai && !sub,
      paiement_en_attente: st.paiements.some(p => p.compte_id === id && p.statut === 'en_attente'),
      dernier_refus: (st.paiements.filter(p => p.compte_id === id && p.statut === 'refuse').sort((x, y) => (y.traite_le || '').localeCompare(x.traite_le || ''))[0] || {}).motif_refus || null,
      admin: st.admins.some(x => x.user_id === id) };
  }
  const RPC = {
    mon_acces() { return access(uid()); },
    commencer_cours({ p_profil, p_langue, p_depart = 0 }) {
      if (!own(p_profil)) throw 'LUGHA:interdit';
      let c = st.cours.find(x => x.profil_id === p_profil && x.langue === p_langue);
      if (!c) { c = { profil_id: p_profil, langue: p_langue, etape: p_depart === 5 ? 5 : 0, commence_le: now().toISOString() }; st.cours.push(c); }
      own(p_profil).langue = p_langue;
      return c.etape;
    },
    terminer_lecon({ p_evenement, p_profil, p_langue, p_etape, p_justes, p_total, p_secondes = 0, p_mots = [] }) {
      const deja = st.lecons.find(l => l.id === p_evenement);
      if (deja) { if (!own(deja.profil_id)) throw 'LUGHA:interdit'; const pr = own(deja.profil_id); return { deja: true, xp: deja.xp, gemmes: deja.gemmes, nouvelle: deja.nouvelle, profil: { ...pr }, etape: st.cours.find(c => c.profil_id === deja.profil_id && c.langue === deja.langue).etape }; }
      const pr = own(p_profil); if (!pr) throw 'LUGHA:interdit';
      if (!access(uid()).actif) throw 'LUGHA:acces_expire';
      if (p_etape < 0 || p_etape > 200 || p_total < 0 || p_total > 60 || p_justes < 0 || p_justes > p_total) throw 'LUGHA:donnees';
      let cr = st.cours.find(c => c.profil_id === p_profil && c.langue === p_langue);
      if (!cr) { cr = { profil_id: p_profil, langue: p_langue, etape: 0, commence_le: now().toISOString() }; st.cours.push(cr); }
      if (p_etape > cr.etape) throw 'LUGHA:etape_verrouillee';
      const jour = algDay(), sem = weekStart(), coffre = p_etape % 5 === 4;
      const nouvelle = p_etape === cr.etape, parfaite = !coffre && p_total > 0 && p_justes === p_total;
      let xp = 0, gemmes = 0;
      if (coffre) gemmes = nouvelle ? 20 : 0;
      else {
        const pratiques = st.lecons.filter(l => l.profil_id === p_profil && !l.nouvelle && algDay(new Date(l.cree_le)) === jour).length;
        if (nouvelle) { xp = 10; gemmes = parfaite ? 10 : 5; } else if (pratiques < 20) xp = 5;
        if (parfaite && xp > 0) xp += 5;
        if (pr.double_xp_jusqua && Date.parse(pr.double_xp_jusqua) > Date.now()) xp *= 2;
      }
      if (nouvelle) cr.etape++;
      if (pr.semaine !== sem) pr.xp_semaine = 0;
      if (!coffre) {
        if (!pr.dernier_jour || pr.dernier_jour < addD(jour, -2) || (pr.dernier_jour === addD(jour, -2) && pr.gels === 0)) pr.serie = 1;
        else if (pr.dernier_jour === addD(jour, -2)) { pr.gels--; pr.serie++; }
        else if (pr.dernier_jour === addD(jour, -1)) pr.serie++;
        pr.dernier_jour = jour;
      }
      Object.assign(pr, { xp: pr.xp + xp, xp_semaine: pr.xp_semaine + xp, semaine: sem, gemmes: pr.gemmes + gemmes, meilleure_serie: Math.max(pr.meilleure_serie, pr.serie),
        lecons: pr.lecons + (coffre ? 0 : 1), lecons_parfaites: pr.lecons_parfaites + (parfaite ? 1 : 0), reponses_justes: pr.reponses_justes + p_justes, reponses_total: pr.reponses_total + p_total,
        langue: p_langue, dernier_xp_le: xp > 0 ? now().toISOString() : pr.dernier_xp_le });
      if (!coffre) { let a = st.activite.find(x => x.profil_id === p_profil && x.jour === jour); if (!a) { a = { profil_id: p_profil, jour, xp: 0, secondes: 0 }; st.activite.push(a); } a.xp += xp; a.secondes += Math.min(Math.max(p_secondes, 0), 3600); }
      (p_mots || []).slice(0, 40).forEach(m => { if (!st.mots.some(x => x.profil_id === p_profil && x.langue === p_langue && x.mot === m)) st.mots.push({ profil_id: p_profil, langue: p_langue, mot: m }); });
      st.lecons.push({ id: p_evenement, profil_id: p_profil, langue: p_langue, etape: p_etape, nouvelle, parfaite, xp, gemmes, cree_le: now().toISOString() });
      return { deja: false, xp, gemmes, nouvelle, profil: { ...pr }, etape: cr.etape };
    },
    acheter({ p_profil, p_article }) {
      const pr = own(p_profil); if (!pr) throw 'LUGHA:interdit';
      const prix = { gel: 200, coeurs: 350, double_xp: 100 }[p_article]; if (!prix) throw 'LUGHA:article';
      if (pr.gemmes < prix) throw 'LUGHA:gemmes';
      if (p_article === 'gel' && pr.gels >= 2) throw 'LUGHA:deja_max';
      if (p_article === 'double_xp' && pr.double_xp_jusqua && Date.parse(pr.double_xp_jusqua) > Date.now()) throw 'LUGHA:deja_actif';
      pr.gemmes -= prix; if (p_article === 'gel') pr.gels++; if (p_article === 'double_xp') pr.double_xp_jusqua = new Date(Date.now() + 15 * 60e3).toISOString();
      return { ...pr };
    },
    classement_semaine({ p_profil }) {
      const sem = weekStart();
      const list = st.profils.filter(p => p.semaine === sem && p.xp_semaine > 0 && (p.classement_visible || p.id === p_profil))
        .sort((a, b) => b.xp_semaine - a.xp_semaine || String(a.dernier_xp_le).localeCompare(String(b.dernier_xp_le)) || a.id.localeCompare(b.id))
        .map((p, i) => ({ id: p.id, rang: i + 1, prenom: p.prenom.split(' ')[0].slice(0, 14), avatar: p.avatar, xp: p.xp_semaine }));
      return list.filter(x => x.rang <= 30 || (x.id === p_profil && own(p_profil))).map(x => ({ rang: x.rang, prenom: x.prenom, avatar: x.avatar, xp: x.xp, moi: x.id === p_profil && !!own(p_profil) }));
    },
    paiements_a_traiter() {
      if (!isAdmin()) throw 'LUGHA:interdit';
      return st.paiements.slice().sort((a, b) => (b.statut === 'en_attente') - (a.statut === 'en_attente') || b.cree_le.localeCompare(a.cree_le))
        .map(p => ({ id: p.id, cree_le: p.cree_le, email: st.users.find(u => u.id === p.compte_id).email, prenom: st.comptes.find(c => c.id === p.compte_id).prenom, reference: p.reference, recu_path: p.recu_path, statut: p.statut }));
    },
    valider_paiement({ p_paiement }) {
      if (!isAdmin()) throw 'LUGHA:interdit';
      const p = st.paiements.find(x => x.id === p_paiement);
      if (!p || p.statut !== 'en_attente') throw 'LUGHA:deja_traite';
      let a = st.abonnements.find(x => x.compte_id === p.compte_id);
      const base = a && Date.parse(a.actif_jusqua) > Date.now() ? new Date(a.actif_jusqua) : now();
      base.setMonth(base.getMonth() + 3);
      if (!a) { a = { compte_id: p.compte_id }; st.abonnements.push(a); }
      a.actif_jusqua = base.toISOString();
      Object.assign(p, { statut: 'valide', traite_le: now().toISOString(), traite_par: uid() });
      return a.actif_jusqua;
    },
    refuser_paiement({ p_paiement, p_motif }) {
      if (!isAdmin()) throw 'LUGHA:interdit';
      const p = st.paiements.find(x => x.id === p_paiement);
      if (!p || p.statut !== 'en_attente') throw 'LUGHA:deja_traite';
      Object.assign(p, { statut: 'refuse', motif_refus: p_motif, traite_le: now().toISOString(), traite_par: uid() });
      return null;
    },
    supprimer_mon_compte() {
      const me = uid();
      const ids = st.profils.filter(p => p.compte_id === me).map(p => p.id);
      st.profils = st.profils.filter(p => p.compte_id !== me);
      ['cours', 'activite', 'mots', 'lecons'].forEach(t => { st[t] = st[t].filter(r => !ids.includes(r.profil_id)); });
      ['comptes', 'users'].forEach(t => { st[t] = st[t].filter(r => r.id !== me); });
      st.paiements = st.paiements.filter(p => p.compte_id !== me);
      return null;
    }
  };

  function createClient() {
    return {
      auth: {
        async getSession() { await delay(); return ok({ session }); },
        async getUser() { return ok({ user: session && session.user }); },
        onAuthStateChange(cb) { listeners.push(cb); setTimeout(() => cb('INITIAL_SESSION', session), 0); return { data: { subscription: { unsubscribe() {} } } }; },
        async signInWithPassword({ email, password }) {
          await delay(); if (offline()) return net();
          const u = st.users.find(x => x.email === email && x.password === password && !x.google);
          if (!u) return err('Invalid login credentials');
          setSession({ access_token: 'fake-' + u.id, user: { id: u.id, email: u.email } }); emit('SIGNED_IN', session);
          return ok({ user: session.user, session });
        },
        async signUp({ email, password, options = {} }) {
          await delay(); if (offline()) return net();
          if (st.users.some(x => x.email === email)) return err('User already registered');
          const id = window.__fake.createUser({ email, password, meta: options.data || {} });
          setSession({ access_token: 'fake-' + id, user: { id, email } }); emit('SIGNED_IN', session);
          return ok({ user: session.user, session });
        },
        // Google : le test choisit le compte via __fake_google, puis la page revient avec ?code=
        async signInWithOAuth({ options }) {
          const email = localStorage.getItem('__fake_google') || 'nouveau@gmail.com';
          let u = st.users.find(x => x.email === email);
          // Même e-mail = même compte : pas de doublon
          const id = u ? u.id : window.__fake.createUser({ email, google: true, meta: { full_name: 'Amine Test', given_name: 'Amine' } });
          setSession({ access_token: 'fake-' + id, user: { id, email } });
          location.href = options.redirectTo + '?code=fakecode';
          return ok({});
        },
        async signOut(opts = {}) {
          await delay();
          if (offline() && opts.scope !== 'local') return net();
          setSession(null); emit('SIGNED_OUT', null); return ok(null);
        },
        async resetPasswordForEmail() { return ok({}); },
        async updateUser() { return ok({ user: session && session.user }); }
      },
      from: query,
      async rpc(name, args = {}) {
        await delay();
        st.calls.push('rpc:' + name); persist();
        if (offline()) return net();
        if (!uid()) return err('JWT expired');
        try { const d = RPC[name](args); persist(); return ok(d); }
        catch (e) { return err(typeof e === 'string' ? e : String(e)); }
      },
      storage: {
        from(bucket) {
          return {
            async upload(path, file) {
              await delay(); if (offline()) return net();
              if (bucket !== 'recus' || !path.startsWith(uid() + '/')) return err('new row violates row-level security policy');
              if (file.size > 5 * 1024 * 1024) return err('Payload too large');
              st.objets.push({ path, size: file.size, type: file.type }); persist(); return ok({ path });
            },
            async createSignedUrl(path) {
              await delay();
              const ownerOk = path.startsWith(uid() + '/') || isAdmin();
              return ownerOk ? ok({ signedUrl: 'about:blank#' + path }) : err('Object not found');
            }
          };
        }
      }
    };
  }
  window.supabase = { createClient };
})();
