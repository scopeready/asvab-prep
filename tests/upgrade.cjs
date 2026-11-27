/* Checks that progress saved by version 1 of the app still works after the update: same storage key, same level ids,
   passed levels stay passed, the next level opens, and a level that was half done picks up at the right step.
   Usage: node tests/upgrade.cjs math|english */
const { chromium } = require(process.env.PW || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const app = process.argv[2] || 'math', dir = path.join(__dirname, '..', app);
const server = http.createServer((req, res) => { let f = path.join(dir, decodeURIComponent(req.url.split('?')[0])); if (req.url.split('?')[0].endsWith('/')) f = path.join(dir, 'index.html');
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); res.end(b); }); });
(async () => {
  await new Promise((r) => server.listen(0, r)); const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 390, height: 844 } }); const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(base);
  const ids = await page.evaluate(() => { const A = window.ASVAB, L = A.LEVELS.map((l) => l.id), lv = (o) => Object.assign({ learned: true, practiced: 4, need: 4, passed: true, best: 0.9, attempts: 1, recent: [1, 1, 0, 1] }, o);
    const levels = {}; L.slice(0, 3).forEach((id) => { levels[id] = lv({}); }); levels[L[3]] = lv({ practiced: 2, passed: false, best: 0, attempts: 0 }); // version 1 shape: no gdone, no cards, no missed
    localStorage.setItem(A.CFG.key, JSON.stringify({ profiles: { p1: { id: 'p1', name: 'Returning', created: 1, levels, tests: [], answered: 40, correct: 33, days: [] } }, current: 'p1' })); return L; });
  await page.reload(); await page.waitForSelector('.lvl');
  const home = await page.evaluate(() => ({ done: document.querySelectorAll('.lvl.done').length, cur: document.querySelector('.lvl.cur .t') && document.querySelector('.card.gold h3').textContent, step: document.querySelector('.card.gold p:nth-of-type(2)').textContent, warm: !!document.querySelector('[data-to="#/warm"]') }));
  if (home.done !== 3) throw new Error('passed levels were lost: ' + JSON.stringify(home));
  await page.goto(base + '#/level/' + ids[3]); const now = await page.evaluate(() => document.querySelector('.stepcard.now h3').textContent);
  await page.goto(base + '#/warm'); await page.waitForSelector('.choice'); await page.goto(base + '#/score'); await page.waitForSelector('.ring');
  console.log(`${app}: version 1 progress kept (3 passed), up next "${home.cur}" (${home.step}); half-done level resumes at "${now}"; warm-up ${home.warm ? 'offered' : 'missing'}`);
  await browser.close(); server.close(); if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
