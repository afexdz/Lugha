#!/usr/bin/env node
/* ============================================================
   Lugha — tests d'acceptation A à H (Playwright, Chromium)
   Serveur simulé : tools/fake-supabase.js (mêmes règles que le SQL).
   Lancer : python3 -m http.server 8000  puis  node tools/e2e-prod.js
   ============================================================ */
'use strict';
const { chromium } = require('playwright');
const { newPage, loginNew, playLesson } = require('./e2e-helpers');
const BASE = process.argv[2] || 'http://localhost:8000';
const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, ok: !!cond, extra: String(extra) }); };
const S = page => page.evaluate(() => __fake.st);
const hash = page => page.evaluate(() => location.hash);
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

async function finishEndScreens(page) {
  for (let i = 0; i < 8; i++) {
    if ((await hash(page)) === '#/apprendre' && await page.$('.node')) return true;
    const b = await page.$('#endNext'); if (b) await b.click().catch(() => {});
    await page.waitForTimeout(250);
  }
  return (await hash(page)) === '#/apprendre';
}
async function googleLogin(page, email) {
  await page.evaluate(e => localStorage.setItem('__fake_google', e), email);
  await page.goto(BASE + '/#/connexion');
  await page.waitForSelector('#google');
  await page.click('#google');
  await page.waitForFunction(() => window.LZ && LZ.me && LZ.me() && /^#\/(bienvenue|apprendre)/.test(location.hash), null, { timeout: 15000 });
}
async function onboardLearner(page) {
  await page.waitForSelector('[data-role="learner"]');
  await page.click('[data-role="learner"]'); await page.click('#next');
  await page.click('[data-lang="en"]'); await page.click('#next');
  await page.click('[data-why="school"]'); await page.click('#next');
  await page.click('#next');            // niveau
  await page.click('#next');            // objectif
  await page.click('#next');            // prêt → première leçon
  await page.waitForSelector('.ex', { timeout: 15000 });
}
async function logoutVia(page, sel) {
  if (sel === '#logout') { await page.goto(BASE + '/#/parametres'); await page.waitForSelector('#logout'); }
  await page.click(sel);
  await page.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 10000 });
  await page.waitForTimeout(300);
}
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);

// ---------- A, F, B, C, G : parcours complet ----------
async function journey(browser, label, viewport, logoutSel) {
  const { page, errors, ctx } = await newPage(browser, { viewport });
  await page.goto(BASE + '/#/');
  await page.waitForFunction(() => window.__fake);
  const email = `amine.${label}@gmail.com`;

  // A — Google → compte → première leçon → résultat → XP → classement
  await googleLogin(page, email);
  ok(`${label} A : nouveau compte Google → bienvenue`, (await hash(page)) === '#/bienvenue', await hash(page));
  ok(`${label} A : adresse nettoyée après le retour Google`, !(await page.evaluate(() => location.search)).includes('code='));
  await onboardLearner(page);
  ok(`${label} A : la première leçon s’ouvre`, (await hash(page)) === '#/lecon/0');
  const { played } = await playLesson(page, 0, { injectWrong: false });
  ok(`${label} A : bonnes réponses acceptées`, played.every(p => p.got), played.filter(p => !p.got).map(p => p.type).join(','));
  await page.waitForSelector('#endNext');
  const xpShown = await page.evaluate(() => { const st = __fake.st; return st.lecons.length; });
  let s = await S(page);
  const prof = s.profils.find(p => p.compte_id === s.users.find(u => u.email === email).id);
  ok(`${label} A : XP enregistrés par le serveur (1re leçon compte)`, prof.xp === 15 || prof.xp === 10, `xp=${prof.xp}, leçons=${xpShown}`);
  // G — double clic sur Continuer
  await page.dblclick('#endNext').catch(() => {});
  ok(`${label} A : retour à l’accueil après les écrans de fin`, await finishEndScreens(page));
  await page.goto(BASE + '/#/classement');
  await page.waitForSelector('.board .row.me, .empty-board', { timeout: 10000 });
  const meRow = await page.$eval('.board .row.me .xp', n => n.textContent).catch(() => null);
  ok(`${label} A : présent dans le classement avec ses XP serveur`, meRow === `${prof.xp} XP`, meRow);
  ok(`${label} H : pas de défilement horizontal (classement)`, await noOverflow(page));

  // F — rechargement : l'état vient du serveur, rien n'est compté deux fois
  await page.reload(); await page.waitForSelector('.board .row.me', { timeout: 10000 });
  s = await S(page);
  ok(`${label} F : après rechargement, une seule leçon enregistrée`, s.lecons.filter(l => l.profil_id === prof.id).length === 1);
  ok(`${label} F : XP identiques après rechargement`, await page.evaluate(() => LZ.prof().xp) === prof.xp);

  // G — renvoi du même événement : aucun doublon
  const replay = await page.evaluate(async () => {
    const ev = __fake.st.lecons[__fake.st.lecons.length - 1];
    const { data } = await LZ.sb.rpc('terminer_lecon', { p_evenement: ev.id, p_profil: ev.profil_id, p_langue: 'en', p_etape: 0, p_justes: 9, p_total: 9 });
    return { deja: data.deja, xp: data.profil.xp };
  });
  ok(`${label} G : même fin de leçon renvoyée → ignorée`, replay.deja && replay.xp === prof.xp, JSON.stringify(replay));
  // Triche : XP envoyés directement → refusé
  const cheat = await page.evaluate(async () => (await LZ.sb.from('profils').update({ xp: 99999 }).eq('id', LZ.prof().id)).error?.message || 'accepté');
  ok(`${label} G : modification directe des XP refusée`, /permission/.test(cheat), cheat);
  const skip = await page.evaluate(async () => (await LZ.sb.rpc('terminer_lecon', { p_evenement: crypto.randomUUID(), p_profil: LZ.prof().id, p_langue: 'en', p_etape: 9, p_justes: 5, p_total: 5 })).error?.message);
  ok(`${label} G : étape verrouillée refusée`, /etape_verrouillee/.test(skip || ''), skip);

  // C — déconnexion
  await page.goto(BASE + '/#/apprendre'); await page.waitForSelector('.node');
  await logoutVia(page, logoutSel);
  const local = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('lugha:v1') || '{}'); return { users: (d.users || []).length, session: d.session || null, sb: !!localStorage.getItem('__fakesb_session') }; });
  ok(`${label} C : session et données locales effacées`, !local.users && !local.session && !local.sb, JSON.stringify(local));
  for (const r of ['#/apprendre', '#/classement', '#/abonnement', '#/lecon/1']) {
    await page.goto(BASE + '/' + r); await page.waitForTimeout(300);
    ok(`${label} C : ${r} inaccessible après déconnexion`, (await hash(page)) === '#/connexion', await hash(page));
  }

  // B — retour du même compte Google : pas de doublon, on continue
  await googleLogin(page, email);
  s = await S(page);
  ok(`${label} B : même e-mail Google → même compte`, s.users.filter(u => u.email === email).length === 1 && s.comptes.filter(c => c.id === prof.compte_id).length === 1);
  ok(`${label} B : retour direct sur Apprendre`, (await hash(page)) === '#/apprendre', await hash(page));
  await page.waitForSelector('.node');
  const before = await page.evaluate(() => LZ.prof().xp);
  await playLesson(page, 1, { injectWrong: false, BASE });
  await page.waitForSelector('#endNext');
  await finishEndScreens(page);
  const after = await page.evaluate(() => LZ.prof().xp);
  s = await S(page);
  const srv = s.profils.find(p => p.id === prof.id).xp;
  ok(`${label} B : XP augmentés et identiques au serveur`, after > before && after === srv, `${before} → ${after} (serveur ${srv})`);

  // H — aucune page ne déborde
  for (const r of ['#/apprendre', '#/profil', '#/boutique', '#/parametres', '#/abonnement', '#/langues', '#/lecon/2']) {
    await page.goto(BASE + '/' + r); await page.waitForTimeout(500);
    ok(`${label} H : ${r} sans débordement horizontal`, await noOverflow(page));
  }
  await page.goto(BASE + '/#/'); await page.waitForTimeout(600);
  ok(`${label} H : accueil sans débordement horizontal`, await noOverflow(page));
  ok(`${label} : aucune erreur JavaScript`, !errors.length, errors.join(' | '));
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();

  await journey(browser, 'Ordinateur', { width: 1280, height: 800 }, '#sideLogout');
  await journey(browser, 'Mobile', { width: 360, height: 740 }, '#logout');

  // ---------- D — audio en panne : message simple, l'exercice continue ----------
  {
    const { page, errors, ctx } = await newPage(browser);
    await ctx.addInitScript(() => {
      if (window.SpeechSynthesis) SpeechSynthesis.prototype.speak = function (u) { setTimeout(() => u.onerror && u.onerror({ error: 'synthesis-failed' }), 20); };
    });
    await loginNew(page, BASE, { email: 'audio@test.dz' });
    await page.goto(BASE + '/#/lecon/0'); await page.waitForSelector('.ex');
    const btn = await page.$('[data-say], .say, .fb-say');
    if (btn) await btn.click();
    await page.waitForFunction(() => /Audio indisponible/.test(document.querySelector('#toasts')?.textContent || ''), null, { timeout: 4000 }).catch(() => {});
    const t = await page.$$eval('.toast', n => n.map(x => x.textContent).join(' '));
    ok('D : bouton écouter présent', !!btn);
    ok('D : audio en panne → « Audio indisponible »', /Audio indisponible/.test(t), t);
    const { played } = await playLesson(page, 0, { injectWrong: false });
    ok('D : la leçon se termine malgré l’audio en panne', await page.$('#endNext') && played.every(p => p.got));
    const auto = await page.evaluate(() => (window.__queue || []).filter(e => ['listen', 'soundImage', 'dictation', 'listeningCloze'].includes(e.type)).length);
    ok('D : aucun exercice qui exige l’écoute', auto === 0);
    ok('D : aucune erreur JavaScript', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---------- E — essai terminé, paiement, validation admin ----------
  {
    const { page, errors, ctx } = await newPage(browser, { viewport: { width: 390, height: 844 } });
    await loginNew(page, BASE, { email: 'client@test.dz', daysAgo: 8 });
    ok('E : essai terminé → badge S’abonner', await page.$('.trial-badge.off'));
    await page.goto(BASE + '/#/lecon/0'); await page.waitForTimeout(400);
    ok('E : leçon bloquée par l’écran d’abonnement', /essai de 7 jours est terminé/.test(await page.textContent('#app')));
    const forced = await page.evaluate(async () => (await LZ.sb.rpc('terminer_lecon', { p_evenement: crypto.randomUUID(), p_profil: LZ.prof().id, p_langue: 'en', p_etape: 0, p_justes: 5, p_total: 5 })).error?.message);
    ok('E : le serveur refuse les XP sans accès', /acces_expire/.test(forced || ''), forced);
    await page.goto(BASE + '/#/abonnement'); await page.waitForSelector('.sub-page');
    const txt = await page.textContent('.sub-page');
    ok('E : prix affiché « 2 000 DA — 3 mois »', /2 000 DA\s*— 3 mois/.test(txt));
    ok('E : abonnement sans débordement (mobile)', await noOverflow(page));
    await page.setInputFiles('#recuFile', { name: 'recu.png', mimeType: 'image/png', buffer: PNG });
    await page.fill('#recuRef', 'TX-123');
    await page.dblclick('#recuBtn');
    await page.waitForSelector('.sub-status.wait', { timeout: 10000 });
    let s = await S(page);
    ok('E : double clic → un seul reçu enregistré', s.paiements.length === 1 && s.objets.length === 1, `paiements=${s.paiements.length} fichiers=${s.objets.length}`);
    const self = await page.evaluate(async id => (await LZ.sb.rpc('valider_paiement', { p_paiement: id })).error?.message, s.paiements[0].id);
    ok('E : le client ne peut pas valider son propre paiement', /interdit/.test(self || ''), self);
    await page.goto(BASE + '/#/admin'); await page.waitForTimeout(300);
    ok('E : page admin interdite au client', (await hash(page)) === '#/apprendre');
    const dup = await page.evaluate(async () => (await LZ.sb.from('paiements').insert({ recu_path: LZ.me().id + '/x.png' })).error?.message);
    ok('E : deuxième reçu en attente refusé', /duplicate/.test(dup || ''), dup);
    await logoutVia(page, '#logout');

    // Admin
    await loginNew(page, BASE, { email: 'admin@test.dz' });
    await page.evaluate(() => { __fake.makeAdmin(LZ.me().id); });
    await page.evaluate(async () => { await LZ.syncUser({ id: LZ.me().id, email: LZ.me().email }); });
    await page.goto(BASE + '/#/admin'); await page.waitForSelector('.pay.en_attente');
    await page.click('[data-ok]'); await page.click('[data-yes]');
    await page.waitForSelector('.pay.valide', { timeout: 10000 });
    s = await S(page);
    const sub = s.abonnements[0];
    const months = sub ? Math.round((Date.parse(sub.actif_jusqua) - Date.now()) / (30.4 * 864e5)) : 0;
    ok('E : validation admin → accès 3 mois', months === 3, sub && sub.actif_jusqua);
    const again = await page.evaluate(async id => (await LZ.sb.rpc('valider_paiement', { p_paiement: id })).error?.message, s.paiements[0].id);
    ok('E : double validation refusée', /deja_traite/.test(again || ''), again);
    await logoutVia(page, '#logout');

    // Client à nouveau : accès ouvert
    await page.goto(BASE + '/#/connexion'); await page.waitForSelector('#email');
    await page.fill('#email', 'client@test.dz'); await page.fill('#pw', 'motdepasse1');
    await page.click('form [type=submit]');
    await page.waitForFunction(() => location.hash === '#/apprendre', null, { timeout: 10000 });
    await page.goto(BASE + '/#/abonnement'); await page.waitForSelector('.sub-status');
    ok('E : le client voit « Abonnement actif »', await page.$('.sub-status.ok'));
    await page.goto(BASE + '/#/lecon/0'); await page.waitForTimeout(500);
    ok('E : les leçons sont rouvertes', await page.$('.ex'));
    ok('E : aucune erreur JavaScript', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---------- E bis — reçu refusé, le client peut renvoyer ----------
  {
    const { page, ctx } = await newPage(browser);
    await loginNew(page, BASE, { email: 'refus@test.dz', daysAgo: 9 });
    await page.goto(BASE + '/#/abonnement'); await page.waitForSelector('#recuFile', { state: 'attached' });
    await page.setInputFiles('#recuFile', { name: 'r.png', mimeType: 'image/png', buffer: PNG });
    await page.click('#recuBtn'); await page.waitForSelector('.sub-status.wait');
    const uidClient = await page.evaluate(() => LZ.me().id);
    await page.evaluate(() => { __fake.createUser({ email: 'adm2@test.dz', meta: { role: 'learner' } }); });
    await page.evaluate(async uidClient => {
      const adm = __fake.st.users.find(u => u.email === 'adm2@test.dz'); __fake.makeAdmin(adm.id);
      await LZ.sb.auth.signOut(); await LZ.sb.auth.signInWithPassword({ email: 'adm2@test.dz', password: 'motdepasse1' });
      const p = __fake.st.paiements.find(x => x.compte_id === uidClient);
      await LZ.sb.rpc('refuser_paiement', { p_paiement: p.id, p_motif: 'Montant incorrect' });
      await LZ.sb.auth.signOut();
    }, uidClient);
    await page.goto(BASE + '/#/connexion'); await page.waitForSelector('#email');
    await page.fill('#email', 'refus@test.dz'); await page.fill('#pw', 'motdepasse1'); await page.click('form [type=submit]');
    await page.waitForFunction(() => location.hash === '#/apprendre', null, { timeout: 10000 });
    await page.goto(BASE + '/#/abonnement'); await page.waitForSelector('.sub-page');
    ok('E : reçu refusé → motif affiché et nouvel envoi possible', /Montant incorrect/.test(await page.textContent('.sub-page')) && await page.$('#recuFile'));
    await ctx.close();
  }

  // ---------- Hors ligne : la leçon est gardée puis envoyée une seule fois ----------
  {
    const { page, errors, ctx } = await newPage(browser);
    await loginNew(page, BASE, { email: 'offline@test.dz' });
    await page.goto(BASE + '/#/lecon/0'); await page.waitForSelector('.ex');
    await page.evaluate(() => localStorage.setItem('__fakesb_offline', '1'));
    await playLesson(page, 0, { injectWrong: false });
    await page.waitForSelector('#endNext');
    ok('Hors ligne : message « envoi automatique »', await page.$('.end-sync'));
    await page.evaluate(() => localStorage.removeItem('__fakesb_offline'));
    await page.evaluate(() => LZ.cloud.flush());
    await page.evaluate(() => LZ.cloud.flush());
    const s = await S(page);
    ok('Hors ligne : envoyée une seule fois au retour du réseau', s.lecons.length === 1 && s.profils[0].xp >= 10, `leçons=${s.lecons.length} xp=${s.profils[0].xp}`);
    ok('Hors ligne : aucune erreur JavaScript', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---------- Contenu de démonstration supprimé ----------
  {
    const { page, ctx } = await newPage(browser);
    await page.goto(BASE + '/#/connexion'); await page.waitForSelector('#google');
    ok('Démo : aucun bouton de démonstration', !(await page.$('#demo')) && !/démo|demo/i.test(await page.textContent('#app')));
    await page.goto(BASE + '/#/'); await page.waitForTimeout(500);
    const home = await page.textContent('#app');
    ok('Accueil : plus de « gratuit » trompeur, prix clair', !/gratuit/i.test(home) && /2 000/.test(home), (home.match(/.{30}gratuit.{30}/i) || [''])[0]);
    await ctx.close();
  }

  await browser.close();
  const bad = results.filter(r => !r.ok);
  results.forEach(r => console.log(`${r.ok ? 'OK  ' : 'ÉCHEC'}  ${r.name}${r.extra ? ' — ' + r.extra : ''}`));
  console.log(`\n${results.length - bad.length}/${results.length} vérifications réussies`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
