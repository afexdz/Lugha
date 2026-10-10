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
   Playwright n'est pas une dépendance du site : installez-le à part
   (npm i -g playwright) ou via NODE_PATH.
   ============================================================ */
'use strict';
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8000';
const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, ok: !!cond, extra }); };

async function newPage(browser, { noVoice = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 860 } });
  if (noVoice) await ctx.addInitScript(() => { try { delete window.speechSynthesis; delete Window.prototype.speechSynthesis; } catch (e) {} Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); });
  // Capture la file d'exercices construite par le moteur
  await ctx.addInitScript(() => {
    const hook = () => {
      const E = window.LZ && window.LZ.engine;
      if (E && E.__hooked) return;
      if (!E) return setTimeout(hook, 20);
      const orig = E.buildA1Lesson; E.__hooked = true;
      E.buildA1Lesson = (...a) => { const q = orig(...a); window.__queue = q ? q.map(x => ({ ...x })) : q; return q; };
    };
    hook();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|supabase|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  return { ctx, page, errors };
}

async function openDemo(page) {
  await page.goto(BASE + '/#/connexion');
  await page.waitForSelector('#demo');
  await page.click('#demo');
  await page.waitForFunction(() => location.hash.startsWith('#/apprendre'));
}

// Répond à l'exercice affiché ; renvoie le type joué
async function answer(page, e, { wrong = false, skip = false } = {}) {
  const tgt = e.w || e.word;
  if (skip) { await page.click('#skip'); return; }
  switch (e.type) {
    case 'choice': {
      const index = e.options.findIndex(o => (o.id === e.correctChoiceId) !== wrong);
      await page.click(`.opt[data-i="${index}"]`);
      break;
    }
    case 'intro': await page.click('#check'); return 'intro';
    case 'match':
      for (const w of e.pairs) {
        await page.click(`.mt[data-side="l"][data-id="${w.id}"]`);
        await page.click(`.mt[data-side="r"][data-id="${w.id}"]`);
      }
      await page.waitForSelector('.l-foot.ok, .l-foot.bad');
      return 'match';
    case 'build':
      for (const tok of e.ph.tokens) {
        const tiles = await page.$$('.bank .tile:not(.used)');
        for (const t of tiles) { if ((await t.textContent()) === tok) { await t.click(); break; } }
      }
      break;
    case 'trueFalse':
      await page.click(`.opt[data-i="${(e.correct !== wrong) ? 0 : 1}"]`); break;
    case 'oddOneOut': {
      const btns = await page.$$('.opt');
      for (const b of btns) { const t = (await b.$eval('.pic-t', n => n.textContent)).trim(); if ((t === e.intruder.t) !== wrong) { await b.click(); break; } }
      break;
    }
    case 'anagram':
      for (const ch of tgt.t) {
        const tiles = await page.$$('.bank .tile:not(.used)');
        for (const t of tiles) { if ((await t.getAttribute('data-ch')) === ch) { await t.click(); break; } }
      }
      break;
    case 'dictation': case 'type':
      await page.fill('#typeIn', wrong ? 'zzz' : tgt.t); break;
    default: {
      const label = ['pickImage', 'meaning', 'soundImage'].includes(e.type) ? tgt.m : tgt.t;
      const btns = await page.$$('.opt');
      let clicked = false;
      for (const b of btns) {
        const t = (await b.$eval('.ot, .pic-t', n => n.textContent)).trim();
        if ((t === label) !== wrong) { await b.click(); clicked = true; break; }
      }
      if (!clicked) throw new Error(`option introuvable pour ${e.type} « ${label} »`);
    }
  }
  await page.click('#check');
}

async function playLesson(page, idx, { injectWrong = true } = {}) {
  await page.goto(BASE + '/#/lecon/' + idx);
  await page.waitForSelector('.ex');
  const queue = await page.evaluate(() => window.__queue);
  const played = [];
  let wrongDone = !injectWrong, skipDone = !injectWrong, guard = 0;
  const wrongTypes = new Set();
  const q = queue.map(x => ({ ...x }));
  for (let k = 0; k < q.length && guard++ < 60; k++) {
    const e = q[k];
    const shownType = await page.$eval('.ex', n => n.className.replace('ex ex-', ''));
    let mode = {};
    // Erreur volontaire au premier exercice à trou et au premier vrai/faux (ancien cas d'écran bloqué)
    if (injectWrong && ['frToEn', 'meaning'].includes(shownType) && !e._retry && !wrongTypes.has(shownType)) { mode = { wrong: true }; wrongTypes.add(shownType); wrongDone = true; }
    else if (!skipDone && !['intro', 'match'].includes(shownType) && !e._retry) { mode = { skip: true }; skipDone = true; }
    await answer(page, { ...e, type: shownType === 'type' ? 'type' : e.type }, mode);
    if (shownType !== 'intro') {
      await page.waitForSelector('.l-foot.ok, .l-foot.bad');
      const good = await page.$('.l-foot.ok');
      played.push({ type: shownType, expected: !(mode.wrong || mode.skip), got: !!good });
      if (!good) q.push({ ...e, _retry: true });
      await page.click('#check');
    }
    await page.waitForTimeout(120);
    if (await page.$('#endNext')) break;
  }
  return { queue, played };
}

(async () => {
  const browser = await chromium.launch();

  // 1. Leçon de révision anglaise
  {
    const { page, errors, ctx } = await newPage(browser);
    await openDemo(page);
    const before = await page.evaluate(() => LZ.prof().words.length);
    const { played } = await playLesson(page, 3);
    ok('Erreurs volontaires et passage sur la banque anglaise', played.filter(p => !p.expected).length >= 2, played.filter(p => !p.expected).map(p => p.type).join(', '));
    const mism = played.filter(p => p.expected !== p.got);
    ok('Révision : chaque bonne réponse est acceptée, chaque erreur refusée', !mism.length, mism.map(m => m.type).join(', '));
    ok('Révision : la leçon se termine', await page.$('#endNext'));
    const after = await page.evaluate(() => LZ.prof().words.length);
    ok('Mots réussis : pas d’unité entière ajoutée', after - before <= 8, `+${after - before}`);
    ok('Révision : aucune erreur JavaScript', !errors.length, errors.join(' | '));
    ok('Types couverts', true, [...new Set(played.map(p => p.type))].join(', '));
    // Les deux premières leçons d'une nouvelle unité
    for (const idx of [5, 6]) {
      await page.evaluate(() => { const p = LZ.prof(); p.hearts = 5; p.courses.en.done = Math.max(p.courses.en.done, 7); LZ.save(); });
      const r = await playLesson(page, idx, { injectWrong: false });
      ok(`Leçon ${idx} terminée sans réponse refusée à tort`, r.played.every(p => p.got) && await page.$('#endNext'));
    }
    await ctx.close();
  }

  // 2. Sans synthèse vocale
  {
    const { page, errors, ctx } = await newPage(browser, { noVoice: true });
    await openDemo(page);
    const { played } = await playLesson(page, 3, { injectWrong: false });
    const listening = played.filter(p => ['listen', 'soundImage', 'dictation', 'listeningCloze'].includes(p.type));
    ok('Sans voix : aucun exercice d’écoute impossible', !listening.length, listening.map(p => p.type).join(', '));
    ok('Sans voix : la leçon se termine', await page.$('#endNext'));
    ok('Sans voix : aucune erreur JavaScript', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // 3. Échec puis reprise du chargement
  {
    const ctx = await browser.newContext();
    await ctx.route('**/content/en/course.json', r => r.abort());
    const page = await ctx.newPage();
    await openDemo(page);
    await page.goto(BASE + '/#/lecon/3');
    await page.waitForSelector('#retryLoad', { timeout: 15000 }).catch(() => {});
    ok('Réseau en erreur : message clair et bouton Réessayer', await page.$('#retryLoad'));
    await ctx.unroute('**/content/en/course.json');
    if (await page.$('#retryLoad')) { await page.click('#retryLoad'); await page.waitForSelector('.ex', { timeout: 15000 }).catch(() => {}); }
    ok('Réessayer : la leçon s’ouvre', await page.$('.ex'));
    await ctx.close();
  }

  // 4. Langue ancienne (espagnol, profil Adam du compte démo)
  {
    const { page, errors, ctx } = await newPage(browser);
    await openDemo(page);
    await page.evaluate(() => { const u = LZ.me(); u.active = u.profiles.find(p => p.lang === 'es').id; LZ.save(); });
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
