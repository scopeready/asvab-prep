/* End-to-end check in a phone-sized browser: plays level 1 from lesson to Level Check, then opens every lesson card
   of every level and fails on any script error or any card wider than the screen.
   Usage: node tests/e2e.cjs math|english [shots-dir]   (serves the app folder itself) */
const { chromium } = require(process.env.PW || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const app = process.argv[2] || 'math', shots = process.argv[3], dir = path.join(__dirname, '..', app);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => { let f = path.join(dir, decodeURIComponent(req.url.split('?')[0])); if (f.endsWith(path.sep) || req.url === '/') f = path.join(dir, 'index.html');
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b); }); });
(async () => {
  await new Promise((r) => server.listen(0, r)); const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch(), ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }), page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/favicon|sw\.js/.test(m.text())) errors.push(m.text()); });
  let n = 0; const shot = async (name) => { if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `${String(++n).padStart(3, '0')}-${name}.png`), fullPage: true }); } };
  const st = () => page.evaluate(() => { const S = window.ASVAB_APP.state(); return JSON.parse(JSON.stringify(S, (k, v) => (typeof v === 'function' ? undefined : v))); });
  const click = (sel) => page.click(sel);
  const hash = () => page.evaluate(() => location.hash);
  const typeNum = async (v) => { for (const ch of String(v)) { if (ch === '-') continue; await click(`.key[data-k="${ch}"]`); } if (v < 0) await click('.key[data-k="±"]'); await click('.key[data-k="ok"]'); };
  await page.goto(base); await page.fill('#nm', 'Tester'); await click('[data-act=addp]'); await shot('home');
  const first = await page.evaluate(() => window.ASVAB.LEVELS[0].id);
  await click('.card.gold .btn'); await shot('level');
  const flow = await page.evaluate(() => { const l = window.ASVAB.LEVELS[0]; return { lesson: !!(window.LESSONS || {})[l.lesson || l.id], cards: !!l.cards, guided: window.ASVAB.CFG.guided }; });
  // ---- lesson ----
  if (flow.lesson) {
    await click('.stepcard.now .btn');
    for (let guard = 0; guard < 40 && (await hash()).startsWith('#/learn/'); guard++) {
      const info = await page.evaluate(() => { const S = window.ASVAB_APP.state().les; if (!S) return null; const l = window.ASVAB.LEVELS.find((x) => x.id === S.id), c = window.LESSONS[l.lesson || l.id].cards[S.k]; return { k: S.k, ask: c.ask ? { num: c.ask.num, a: c.ask.a, opts: !!c.ask.opts } : null, order: S.order, ok: S.ok }; });
      if (!info) break; await shot(`lesson-${info.k + 1}`);
      if (info.ask && info.ok !== true) {
        if (await page.$('.btn.gold[data-act=lnext]:not([disabled])')) throw new Error('Next is enabled before the check is answered');
        if (info.ask.opts) { const wrong = info.order.findIndex((o) => o !== info.ask.a); await click(`[data-act=lpick][data-i="${wrong}"]`); await shot(`lesson-${info.k + 1}-wrong`); await click(`[data-act=lpick][data-i="${info.order.indexOf(info.ask.a)}"]`); }
        else { await typeNum(info.ask.num + 1); await typeNum(info.ask.num); }
        await shot(`lesson-${info.k + 1}-right`);
      }
      await click('[data-act=lnext]');
    }
  }
  // ---- flashcards ----
  if (flow.cards) {
    if (!(await hash()).startsWith('#/cards/')) await click('.stepcard.now .btn');
    for (let guard = 0; guard < 400 && (await hash()).startsWith('#/cards/'); guard++) {
      const F = (await st()).fc; if (!F || F.phase === 'done') break;
      if (F.phase === 'study') { if (guard < 3) await shot('flash-front'); await click('.flash'); if (guard < 3) await shot('flash-back'); await click('[data-act=fnext]'); }
      else { if (F.picked == null) { const wrongOnce = guard % 9 === 0; await click(`.choice[data-i="${wrongOnce ? (F.q.answer + 1) % 4 : F.q.answer}"]`); if (guard < 30 && wrongOnce) await shot('flash-quiz'); } await click('[data-act=fq]'); }
    }
    await shot('flash-done'); await click('.card.gold .btn');
  }
  // ---- do it together ----
  if (flow.guided) {
    if (!(await hash()).startsWith('#/guide/')) throw new Error('lesson did not lead to Do it together: ' + (await hash()));
    for (let guard = 0; guard < 80; guard++) {
      if (await page.$('[data-to^="#/practice/"]')) { await shot('guide-done'); await click('[data-to^="#/practice/"]'); break; }
      if (await page.$('[data-act=gnew]')) { await click('[data-act=gnew]'); continue; }
      if (await page.$('.keys')) { const ans = await page.evaluate(() => { const G = window.ASVAB_APP.state().gd; return window.ASVAB_APP.blankOf(G.q.steps[G.i]).ans; }); if (guard === 1) { await typeNum(ans + 1); await shot('guide-wrong'); } await shot('guide-step'); await typeNum(ans); await shot('guide-right'); }
      else if (await page.$('.choice:not([disabled])')) { const a = (await st()).gd.q.answer; await click(`.choice[data-i="${a}"]`); }
      await click('[data-act=gnext]');
    }
  }
  // ---- practice ----
  if (!(await hash()).startsWith('#/practice/')) throw new Error('expected practice, at ' + (await hash()));
  await shot('practice'); await click('[data-act=hint]'); await shot('practice-hint');
  for (let guard = 0; guard < 30; guard++) {
    if (await page.$('[data-act=startcheck]')) break;
    const S = (await st()).pr; if (S.picked == null) await click(`.choice[data-i="${guard === 1 ? (S.q.answer + 1) % 4 : S.q.answer}"]`);
    if (guard === 1) await shot('practice-missed');
    if (await page.$('[data-act=startcheck]')) break; await click('[data-act=nextq]');
  }
  await shot('practice-ready'); await click('[data-act=startcheck]');
  for (let guard = 0; guard < 20 && !(await st()).ck.done; guard++) { const S = (await st()).ck; await click(`.choice[data-i="${S.qs[S.i].answer}"]`); if (guard === 0) await shot('check'); await click('[data-act=checknext]'); }
  await shot('check-passed');
  const passed = await page.evaluate((id) => JSON.parse(localStorage.getItem(window.ASVAB.CFG.key)).profiles, first).then((p) => Object.values(p)[0].levels[first].passed);
  if (!passed) throw new Error('level 1 was not marked passed');
  await page.goto(base + '#/home'); await shot('home-after');
  if (await page.$('[data-to="#/warm"]')) { await click('[data-to="#/warm"]'); for (let g = 0; g < 12 && (await st()).wm; g++) { const W = (await st()).wm; if (W.picked == null) await click(`.choice[data-i="${g === 0 ? (W.items[W.i].q.answer + 1) % 4 : W.items[W.i].q.answer}"]`); if (g === 0) await shot('warmup'); await click('[data-act=wnext]'); } await shot('warmup-done'); }
  await page.goto(base + '#/home'); if (await page.$('[data-to="#/fix"]')) { await click('[data-to="#/fix"]'); await shot('fix'); }
  await page.goto(base + '#/score'); await shot('score'); await page.goto(base + '#/settings'); await shot('settings');
  // ---- every lesson card of every level: no errors, nothing wider than the screen ----
  await page.evaluate(() => { const A = window.ASVAB, db = JSON.parse(localStorage.getItem(A.CFG.key)), p = Object.values(db.profiles)[0]; for (const l of A.LEVELS) p.levels[l.id] = { learned: true, practiced: 5, need: 5, passed: true, best: 1, attempts: 1, recent: [1], gdone: true }; localStorage.setItem(A.CFG.key, JSON.stringify(db)); });
  await page.reload();
  const ids = await page.evaluate(() => window.ASVAB.LEVELS.filter((l) => (window.LESSONS || {})[l.lesson || l.id]).map((l) => [l.id, window.LESSONS[l.lesson || l.id].cards.length]));
  let cards = 0; const wide = [];
  for (const [id, count] of ids) { await page.goto(base + '#/learn/' + id); await page.waitForSelector('.lcard');
    for (let k = 0; k < count; k++) { cards++;
      const over = await page.evaluate(() => { const w = document.documentElement.clientWidth; return [...document.querySelectorAll('main .lcard, main .ask')].flatMap((c) => [...c.querySelectorAll('*')].filter((e) => { if (e.closest('.figure') && e.closest('.figure').scrollWidth <= e.closest('.figure').clientWidth + 1) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.right > w + 1; }).map((e) => e.tagName + '.' + e.className)).slice(0, 3); });
      const scroll = await page.evaluate(() => [...document.querySelectorAll('main .figure')].some((f) => f.scrollWidth > f.clientWidth + 1));
      if (over.length || scroll) wide.push(`${id} card ${k + 1}${scroll ? ' (picture scrolls sideways)' : ''} ${over.join(' ')}`);
      if (shots && process.env.ALL) await page.screenshot({ path: path.join(shots, `card-${id}-${String(k + 1).padStart(2, '0')}.png`), fullPage: true });
      if (k < count - 1) await click('[data-act=lnext]'); } }
  console.log(`${app}: played level "${first}" start to finish; opened ${cards} lesson cards in ${ids.length} lessons`);
  if (wide.length) console.log('TOO WIDE:\n  ' + wide.join('\n  '));
  if (errors.length) console.log('ERRORS:\n  ' + [...new Set(errors)].join('\n  '));
  await browser.close(); server.close(); process.exit(errors.length || wide.length ? 1 : 0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
