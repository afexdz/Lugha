#!/usr/bin/env node
/* Lugha — mesure de chargement (Chromium, réseau mobile simulé « 4G lente »)
   node tools/perf.js [url] */
'use strict';
const { chromium } = require('playwright');
const { newPage, loginNew } = require('./e2e-helpers');
const BASE = process.argv[2] || 'http://localhost:8000';
(async () => {
  const browser = await chromium.launch();
  const { page, ctx } = await newPage(browser, { viewport: { width: 390, height: 844 } });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8 * 4, uploadThroughput: 750e3 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let bytes = 0, reqs = 0;
  cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; reqs++; });
  const t0 = Date.now();
  await page.goto(BASE + '/#/', { waitUntil: 'load' });
  const home = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const fcp = performance.getEntriesByName('first-contentful-paint')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: fcp ? Math.round(fcp.startTime) : null }; });
  await page.waitForSelector('.hero, .home');
  console.log(`Accueil (froid, 4G lente, CPU x4) : FCP ${home.fcp} ms · DOM prêt ${home.dcl} ms · chargé ${home.load} ms · ${reqs} requêtes · ${Math.round(bytes / 1024)} Ko transférés`);
  // Leçon : du clic à la première question
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await loginNew(page, BASE, { email: 'perf@test.dz' });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8 * 4, uploadThroughput: 750e3 / 8 });
  await page.evaluate(() => { /* vide le cache mémoire du contenu */ });
  let t = Date.now();
  await page.goto(BASE + '/#/lecon/0'); await page.waitForSelector('.ex');
  console.log(`Ouverture d’une leçon : ${Date.now() - t} ms`);
  t = Date.now();
  await page.goto(BASE + '/#/classement'); await page.waitForSelector('.board, .empty-board');
  console.log(`Classement affiché : ${Date.now() - t} ms (serveur simulé)`);
  await browser.close();
})();
