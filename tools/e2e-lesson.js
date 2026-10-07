#!/usr/bin/env node
/* ============================================================
   Lugha — test de bout en bout d'une leçon (Playwright, Chromium)
   Lance d'abord un serveur : python3 -m http.server 8000
   Puis : node tools/e2e-lesson.js [url=http://localhost:8000]

   Scénarios :
   1. leçon anglaise de révision (types nouveaux), avec une mauvaise
      réponse volontaire à un exercice à trous, un « Passer », puis
      bonnes réponses jusqu'à la fin ;
   2. même leçon sur un appareil sans synthèse vocale ;
   3. échec de chargement du contenu, puis « Réessayer » ;
   4. une langue ancienne (espagnol) fonctionne toujours.
   Le serveur est simulé par tools/fake-supabase.js.
   Playwright n'est pas une dépendance du site : installez-le à part
   (npm i -g playwright) ou via NODE_PATH.
   ============================================================ */
'use strict';
const { chromium } = require('playwright');
const { newPage, loginNew, playLesson } = require('./e2e-helpers');
const BASE = process.argv[2] || 'http://localhost:8000';
const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, ok: !!cond, extra }); };

(async () => {
  const browser = await chromium.launch();

  // 1. Leçon de révision anglaise
  {
    const { page, errors, ctx } = await newPage(browser);
    await loginNew(page, BASE, { email: 'a@test.dz', etape: 4 });
    const before = await page.evaluate(() => LZ.prof().words.length);
    const { played } = await playLesson(page, 3, { BASE });
    ok('Erreurs volontaires sur un trou et un vrai/faux', played.filter(p => !p.expected).length >= 2, played.filter(p => !p.expected).map(p => p.type).join(', '));
    const mism = played.filter(p => p.expected !== p.got);
    ok('Révision : chaque bonne réponse est acceptée, chaque erreur refusée', !mism.length, mism.map(m => m.type).join(', '));
    ok('Révision : la leçon se termine', await page.$('#endNext'));
    const after = await page.evaluate(() => LZ.prof().words.length);
    ok('Mots réussis : pas d’unité entière ajoutée', after - before <= 8, `+${after - before}`);
    ok('Révision : aucune erreur JavaScript', !errors.length, errors.join(' | '));
    ok('Types couverts', true, [...new Set(played.map(p => p.type))].join(', '));
    // Les deux premières leçons d'une nouvelle unité
    for (const idx of [5, 6]) {
      await page.evaluate(async () => { const p = LZ.prof(); __fake.st.cours.find(c => c.profil_id === p.id).etape = 7; __fake.persist(); await LZ.syncUser({ id: LZ.me().id, email: LZ.me().email }); LZ.prof().hearts = 5; LZ.save(); });
      const r = await playLesson(page, idx, { injectWrong: false, BASE });
      ok(`Leçon ${idx} terminée sans réponse refusée à tort`, r.played.every(p => p.got) && await page.$('#endNext'));
    }
    await ctx.close();
  }

  // 2. Sans synthèse vocale
  {
    const { page, errors, ctx } = await newPage(browser, { noVoice: true });
    await loginNew(page, BASE, { email: 'b@test.dz', etape: 4 });
    const { played } = await playLesson(page, 3, { injectWrong: false, BASE });
    const listening = played.filter(p => ['listen', 'soundImage', 'dictation', 'listeningCloze'].includes(p.type));
    ok('Sans voix : aucun exercice d’écoute impossible', !listening.length, listening.map(p => p.type).join(', '));
    ok('Sans voix : la leçon se termine', await page.$('#endNext'));
    ok('Sans voix : aucune erreur JavaScript', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // 3. Échec puis reprise du chargement
  {
    const { ctx, page } = await newPage(browser);
    await loginNew(page, BASE, { email: 'c@test.dz', etape: 4 });
    await ctx.route('**/content/en/A1.json', r => r.abort());
    await page.evaluate(() => { location.reload(); });
    await page.waitForFunction(() => window.LZ && LZ.me && LZ.me());
    await page.goto(BASE + '/#/lecon/3');
    await page.waitForSelector('#retryLoad', { timeout: 15000 }).catch(() => {});
    ok('Réseau en erreur : message clair et bouton Réessayer', await page.$('#retryLoad'));
    await ctx.unroute('**/content/en/A1.json');
    if (await page.$('#retryLoad')) { await page.click('#retryLoad'); await page.waitForSelector('.ex', { timeout: 15000 }).catch(() => {}); }
    ok('Réessayer : la leçon s’ouvre', await page.$('.ex'));
    await ctx.close();
  }

  // 4. Autre langue (espagnol)
  {
    const { page, errors, ctx } = await newPage(browser);
    await loginNew(page, BASE, { email: 'd@test.dz', lang: 'es' });
    await page.goto(BASE + '/#/lecon/0');
    await page.waitForSelector('.ex');
    // Passe toutes les questions : l'écran ne doit jamais se bloquer
    for (let i = 0; i < 40 && !(await page.$('#endNext')); i++) {
      if (await page.$('#skip')) { await page.click('#skip'); await page.click('#check'); }
      else if (await page.$('.mt')) { break; }
      else await page.click('#check');
      await page.waitForTimeout(80);
      if (await page.$('.modal-wrap')) break;
    }
    ok('Espagnol : la leçon s’affiche et avance sans erreur', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  await browser.close();
  let failed = 0;
  for (const r of results) { if (!r.ok) failed++; console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.extra ? ' — ' + r.extra : ''}`); }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
