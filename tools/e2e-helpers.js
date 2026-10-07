/* ============================================================
   Lugha — outils communs aux tests de bout en bout (Playwright)
   - faux Supabase (tools/fake-supabase.js) branché à la place
     de vendor/supabase.js : aucun appel au vrai serveur
   - réponses automatiques aux exercices
   ============================================================ */
'use strict';
const path = require('path');
const FAKE = path.join(__dirname, 'fake-supabase.js');

async function newPage(browser, { noVoice = false, viewport = { width: 420, height: 860 }, ctx: ctx0 } = {}) {
  const ctx = ctx0 || await browser.newContext({ viewport });
  await ctx.route('**/vendor/supabase.js', r => r.fulfill({ path: FAKE, contentType: 'application/javascript' }));
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
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  return { ctx, page, errors };
}

// Compte apprenant prêt à jouer (sans passer par l'interface)
async function loginNew(page, BASE, { email, lang = 'en', etape = 0, daysAgo = 0 } = {}) {
  await page.goto(BASE + '/#/');
  await page.waitForFunction(() => window.LZ && LZ.cloud && window.__fake);
  await page.evaluate(async ({ email, lang, etape, daysAgo }) => {
    __fake.createUser({ email, meta: { role: 'learner', prenom: 'Test' }, createdDaysAgo: daysAgo });
    const { data } = await LZ.sb.auth.signInWithPassword({ email, password: 'motdepasse1' });
    await LZ.syncUser(data.user);
    const p = await LZ.cloud.createProfile({ name: 'Test', avatar: '🦊', kind: 'self', lang });
    if (etape) { __fake.st.cours.find(c => c.profil_id === p.id).etape = etape; __fake.persist(); await LZ.syncUser(data.user); }
  }, { email, lang, etape, daysAgo });
  await page.goto(BASE + '/#/apprendre');
  await page.waitForSelector('.node');
}

// Répond à l'exercice affiché ; renvoie le type joué
async function answer(page, e, { wrong = false, skip = false } = {}) {
  const tgt = e.w || e.word;
  if (skip) { await page.click('#skip'); return; }
  switch (e.type) {
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

async function playLesson(page, idx, { injectWrong = true, BASE } = {}) {
  if (BASE) await page.goto(BASE + '/#/lecon/' + idx);
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
    if (injectWrong && ['fillBlank', 'listeningCloze', 'trueFalse'].includes(shownType) && !e._retry && !wrongTypes.has(shownType)) { mode = { wrong: true }; wrongTypes.add(shownType); wrongDone = true; }
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


module.exports = { newPage, loginNew, answer, playLesson };
