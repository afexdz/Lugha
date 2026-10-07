/* ============================================================
   Lugha — données du compte (Supabase = source de vérité)

   Le navigateur garde une copie locale pour afficher vite, mais
   tout ce qui compte vient du serveur : profils, étapes, XP,
   gemmes, série, abonnement. Les fins de leçon passent par une
   file locale avec un identifiant stable : un envoi répété, une
   coupure réseau ou un double clic ne comptent qu'une fois.
   ============================================================ */
(() => {
  'use strict';
  const sb = () => LZ.sb;
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));

  // Messages compréhensibles, jamais d'erreur technique à l'écran
  const MESSAGES = {
    acces_expire: 'Ton essai est terminé. Abonne-toi pour continuer à progresser.',
    etape_verrouillee: 'Cette étape n’est pas encore débloquée.',
    trop_de_profils: 'Six profils au maximum par compte.',
    gemmes: 'Pas assez de gemmes.',
    deja_max: 'Tu as déjà le maximum.',
    deja_actif: 'Déjà actif.',
    deja_traite: 'Ce paiement a déjà été traité.',
    interdit: 'Action non autorisée.',
    reseau: 'Connexion impossible. Vérifie ton internet et réessaie.'
  };
  function codeOf(err) {
    const m = String((err && (err.message || err.details)) || err || '');
    const k = m.match(/LUGHA:(\w+)/);
    if (k) return k[1];
    if (/fetch|network|Failed to|timeout|NetworkError/i.test(m)) return 'reseau';
    if (/duplicate key|unique/i.test(m)) return 'doublon';
    return 'inconnu';
  }
  const messageOf = err => MESSAGES[codeOf(err)] || 'Une erreur est survenue. Réessaie dans un instant.';
  function fail(err) { const e = new Error(messageOf(err)); e.code = codeOf(err); e.cause = err; console.warn('[lugha]', err); throw e; }
  async function call(promise) { const { data, error } = await promise; if (error) fail(error); return data; }

  // ── Profil serveur → profil affiché ─────────────────────────
  function toLocal(row, extras, prev) {
    const wk = LZ.weekKey();
    const p = Object.assign(LZ.newProfile({ name: row.prenom }), prev ? {
      hearts: prev.hearts, heartsAt: prev.heartsAt, quest: prev.quest, ach: prev.ach || []
    } : {});
    Object.assign(p, {
      id: row.id, name: row.prenom, avatar: row.avatar, age: row.age,
      kind: row.type === 'enfant' ? 'child' : 'self',
      lang: row.langue, goal: row.objectif, motive: row.motivation, limit: row.limite_minutes || 0,
      xp: row.xp, weekXp: row.semaine === wk ? row.xp_semaine : 0, week: wk,
      gems: row.gemmes, streak: row.serie, bestStreak: row.meilleure_serie, lastDay: row.dernier_jour,
      freeze: row.gels, boostUntil: row.double_xp_jusqua ? Date.parse(row.double_xp_jusqua) : 0,
      lessons: row.lecons, perfect: row.lecons_parfaites,
      ans: { ok: row.reponses_justes, n: row.reponses_total },
      visible: row.classement_visible, created: Date.parse(row.cree_le) || Date.now(),
      courses: {}, days: {}, time: {}, words: []
    });
    (extras.cours || []).filter(c => c.profil_id === row.id).forEach(c => { p.courses[c.langue] = { done: c.etape, started: Date.parse(c.commence_le) || Date.now() }; });
    (extras.activite || []).filter(a => a.profil_id === row.id).forEach(a => { p.days[a.jour] = a.xp; p.time[a.jour] = a.secondes; });
    (extras.mots || []).filter(m => m.profil_id === row.id).forEach(m => p.words.push(`${m.langue}:${m.mot}`));
    LZ.tick(p);
    return p;
  }
  // Applique au profil local la réponse de terminer_lecon / acheter
  function applyRow(p, row) {
    const wk = LZ.weekKey();
    Object.assign(p, {
      xp: row.xp, weekXp: row.semaine === wk ? row.xp_semaine : 0, gems: row.gemmes,
      streak: row.serie, bestStreak: row.meilleure_serie, lastDay: row.dernier_jour, freeze: row.gels,
      boostUntil: row.double_xp_jusqua ? Date.parse(row.double_xp_jusqua) : 0,
      lessons: row.lecons, perfect: row.lecons_parfaites, ans: { ok: row.reponses_justes, n: row.reponses_total }
    });
  }

  // ── Chargement complet du compte ────────────────────────────
  async function pull(sbUser) {
    const db = LZ.db;
    const since = LZ.addDays(LZ.dayKey(), -40);
    if (LZ.engine && LZ.engine.ensureA1) LZ.engine.ensureA1().catch(() => {});   // en parallèle
    const [compte, profils, acces] = await Promise.all([
      call(sb().from('comptes').select('id, prenom, role, code_parent, cree_le').eq('id', sbUser.id).maybeSingle()),
      call(sb().from('profils').select('*').order('cree_le')),
      call(sb().rpc('mon_acces'))
    ]);
    const ids = profils.map(p => p.id);
    const [cours, activite, mots] = ids.length ? await Promise.all([
      call(sb().from('cours').select('*').in('profil_id', ids)),
      call(sb().from('activite').select('*').in('profil_id', ids).gte('jour', since)),
      call(sb().from('mots').select('profil_id, langue, mot').in('profil_id', ids))
    ]) : [[], [], []];

    const prev = db.users.find(x => x.id === sbUser.id);
    const prevProfiles = prev ? prev.profiles : [];
    // Une seule personne connectée par appareil : on ne garde que ce compte
    db.users = [];
    const u = {
      id: sbUser.id, email: sbUser.email || '',
      name: (compte && compte.prenom) || sbUser.email?.split('@')[0] || '',
      role: compte && compte.role === 'apprenant' ? 'learner' : compte && compte.role === 'parent' ? 'parent' : null,
      pin: compte ? compte.code_parent : null,
      created: compte ? Date.parse(compte.cree_le) : Date.now(),
      acces: acces || { actif: false },
      profiles: profils.map(r => toLocal(r, { cours, activite, mots }, prevProfiles.find(x => x.id === r.id))),
      active: null
    };
    const keep = prev && prev.active && u.profiles.some(p => p.id === prev.active) ? prev.active : null;
    u.active = keep || (u.profiles[0] && u.profiles[0].id) || null;
    db.users.push(u); db.session = u.id; LZ.save();
    flush();
    return u;
  }

  async function refreshAccess() {
    const u = LZ.me(); if (!u) return null;
    u.acces = await call(sb().rpc('mon_acces')) || u.acces; LZ.save();
    return u.acces;
  }

  // ── Compte ──────────────────────────────────────────────────
  async function setRole(role) {
    const u = LZ.me();
    await call(sb().from('comptes').update({ role: role === 'parent' ? 'parent' : 'apprenant' }).eq('id', u.id));
    u.role = role; LZ.save();
  }
  async function setName(prenom) { const u = LZ.me(); await call(sb().from('comptes').update({ prenom }).eq('id', u.id)); u.name = prenom; LZ.save(); }
  async function setPin(hash) { const u = LZ.me(); await call(sb().from('comptes').update({ code_parent: hash }).eq('id', u.id)); u.pin = hash; LZ.save(); }

  // ── Profils ─────────────────────────────────────────────────
  async function createProfile({ name, avatar, age = null, kind, lang = null, goal = 20, motive = null, depart = 0 }) {
    const u = LZ.me();
    const row = await call(sb().from('profils').insert({
      compte_id: u.id, prenom: name, avatar, age, type: kind === 'child' ? 'enfant' : 'moi',
      langue: lang, objectif: goal, motivation: motive
    }).select('*').single());
    const p = toLocal(row, {}, null);
    u.profiles.push(p); u.active = p.id; LZ.save();
    if (lang) await startCourse(p, lang, depart);
    return p;
  }
  const FIELDS = { name: 'prenom', avatar: 'avatar', age: 'age', lang: 'langue', goal: 'objectif', motive: 'motivation', limit: 'limite_minutes', visible: 'classement_visible' };
  async function updateProfile(p, patch) {
    const row = {};
    Object.entries(patch).forEach(([k, v]) => { if (FIELDS[k]) row[FIELDS[k]] = v; });
    await call(sb().from('profils').update(row).eq('id', p.id));
    Object.assign(p, patch); LZ.save();
  }
  async function deleteProfile(p) {
    const u = LZ.me();
    await call(sb().from('profils').delete().eq('id', p.id));
    u.profiles = u.profiles.filter(x => x.id !== p.id);
    if (u.active === p.id) u.active = u.profiles[0] ? u.profiles[0].id : null;
    LZ.save();
  }
  async function startCourse(p, lang, depart = 0) {
    const etape = await call(sb().rpc('commencer_cours', { p_profil: p.id, p_langue: lang, p_depart: depart }));
    p.lang = lang;
    p.courses[lang] = { done: etape ?? depart, started: Date.now() };
    LZ.save();
    return etape;
  }

  // ── Fin de leçon : file locale idempotente ──────────────────
  const qKey = () => { const u = LZ.me(); return u ? 'lugha:file:' + u.id : null; };
  const readQ = () => { try { return JSON.parse(localStorage.getItem(qKey()) || '[]'); } catch { return []; } };
  const writeQ = q => { try { localStorage.setItem(qKey(), JSON.stringify(q)); } catch {} };

  function applyResult(r, item) {
    const u = LZ.me(); if (!u || !r) return;
    const p = u.profiles.find(x => x.id === item.p_profil); if (!p) return;
    applyRow(p, r.profil);
    if (r.etape != null) p.courses[item.p_langue] = Object.assign(p.courses[item.p_langue] || {}, { done: r.etape });
    LZ.save();
  }

  let flushing = null;
  function flush() {
    if (flushing) return flushing;
    flushing = (async () => {
      let q = readQ();
      while (q.length) {
        const item = q[0];
        try {
          const { data, error } = await sb().rpc('terminer_lecon', item);
          if (error) {
            const code = codeOf(error);
            if (code === 'reseau') break;            // on réessaiera plus tard
            q.shift(); writeQ(q);                     // refus métier : on ne réessaie pas
            if (code === 'acces_expire') { refreshAccess().catch(() => {}); }
            continue;
          }
          applyResult(data, item);
          q.shift(); writeQ(q);
        } catch (e) { break; }
        q = readQ();
      }
    })().finally(() => { flushing = null; });
    return flushing;
  }
  addEventListener('online', () => { if (LZ.me()) flush(); });

  // Envoie une fin de leçon ; renvoie le résultat serveur, ou { attente: true } hors ligne
  async function finishLesson({ profil, langue, etape, justes, total, secondes, mots }) {
    const item = {
      p_evenement: uuid(), p_profil: profil, p_langue: langue, p_etape: etape,
      p_justes: Math.min(justes, 60), p_total: Math.min(total, 60), p_secondes: secondes, p_mots: (mots || []).slice(0, 40)
    };
    const q = readQ(); q.push(item); writeQ(q);
    try {
      const { data, error } = await sb().rpc('terminer_lecon', item);
      if (error) {
        const code = codeOf(error);
        if (code === 'reseau') return { attente: true };
        writeQ(readQ().filter(x => x.p_evenement !== item.p_evenement));
        fail(error);
      }
      writeQ(readQ().filter(x => x.p_evenement !== item.p_evenement));
      applyResult(data, item);
      return data;
    } catch (e) {
      if (e.code && e.code !== 'reseau') throw e;
      return { attente: true };
    }
  }
  const pending = () => readQ().length;

  // ── Boutique, classement ────────────────────────────────────
  async function buy(p, article) {
    const row = await call(sb().rpc('acheter', { p_profil: p.id, p_article: article }));
    applyRow(p, row); LZ.save();
    return row;
  }
  async function leaderboard(p) { return call(sb().rpc('classement_semaine', { p_profil: p ? p.id : null })); }

  // ── Abonnement : reçu BaridiMob ─────────────────────────────
  async function sendReceipt(file, reference) {
    const u = LZ.me();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    const path = `${u.id}/${Date.now()}.${ext}`;
    const up = await sb().storage.from('recus').upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) fail(up.error);
    const { error } = await sb().from('paiements').insert({ recu_path: path, reference: reference || null });
    if (error) {
      if (codeOf(error) === 'doublon') { const e = new Error('Un reçu est déjà en cours de vérification.'); e.code = 'doublon'; throw e; }
      fail(error);
    }
    return refreshAccess();
  }

  // ── Administration ──────────────────────────────────────────
  const adminList = () => call(sb().rpc('paiements_a_traiter'));
  const adminValidate = id => call(sb().rpc('valider_paiement', { p_paiement: id }));
  const adminRefuse = (id, motif) => call(sb().rpc('refuser_paiement', { p_paiement: id, p_motif: motif }));
  async function receiptUrl(path) {
    const { data, error } = await sb().storage.from('recus').createSignedUrl(path, 300);
    if (error) fail(error);
    return data.signedUrl;
  }

  // ── Déconnexion et suppression ──────────────────────────────
  // Efface toute donnée du compte de cet appareil : rien ne reste après la sortie.
  function clearLocal() {
    const db = LZ.db;
    db.users.forEach(u => { try { localStorage.removeItem('lugha:file:' + u.id); } catch {} });
    db.users = []; db.session = null;
    try { sessionStorage.removeItem('lugha:pin'); } catch {}
    LZ.save();
  }
  async function deleteAccount() { await call(sb().rpc('supprimer_mon_compte')); }

  LZ.cloud = {
    pull, refreshAccess, setRole, setName, setPin,
    createProfile, updateProfile, deleteProfile, startCourse,
    finishLesson, flush, pending, buy, leaderboard,
    sendReceipt, adminList, adminValidate, adminRefuse, receiptUrl,
    clearLocal, deleteAccount, messageOf
  };
})();
