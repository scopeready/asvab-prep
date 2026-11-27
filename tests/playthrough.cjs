/* Plays the WHOLE course in a phone-sized browser, the way a learner would:
   every level in order (lesson with its checks → do-it-together or flashcards → practice → Level Check),
   every unit checkpoint, both timed practice tests, the daily warm-up, fix-my-mistakes, backup, restore and reset.
   Along the way it checks: a locked level cannot be opened, a lesson check blocks "Next" until answered, a wrong answer is
   rejected, every typed step accepts the right number and refuses a wrong one, nothing is wider than the screen,
   and no script error is ever logged.
   Usage: node tests/playthrough.cjs math|english [width]        (takes a few minutes) */
const { chromium } = require(process.env.PW || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const app = process.argv[2] || 'math', width = +process.argv[3] || 390, dir = path.join(__dirname, '..', app);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => { let f = path.join(dir, decodeURIComponent(req.url.split('?')[0])); if (req.url.split('?')[0].endsWith('/')) f = path.join(dir, 'index.html');
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b); }); });
(async () => {
  await new Promise((r) => server.listen(0, r)); const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch(), ctx = await browser.newContext({ viewport: { width, height: 800 }, acceptDownloads: true }), page = await ctx.newPage(); global.PAGE = page;
  const errors = [], wide = new Set(), notes = []; let clicks = 0; global.ERRORS = errors;
  page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/favicon|sw\.js|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  const hash = () => page.evaluate(() => location.hash);
  const st = () => page.evaluate(() => JSON.parse(JSON.stringify(window.ASVAB_APP.state(), (k, v) => (typeof v === 'function' ? undefined : v))));
  const fit = async (where) => { const over = await page.evaluate(() => { const w = document.documentElement.clientWidth; if (document.documentElement.scrollWidth > w + 1) return 'page scrolls sideways';
      for (const e of document.querySelectorAll('main *')) { const fg = e.closest('.figure'); if (fg && fg.scrollWidth <= fg.clientWidth + 1) continue; if (fg) return 'picture scrolls sideways'; const r = e.getBoundingClientRect(); if (r.width > 0 && r.right > w + 1) return e.tagName + '.' + e.className; } return ''; }); if (over) wide.add(`${where}: ${over}`); };
  const click = async (sel) => { clicks++; await page.click(sel); };
  const typeNum = async (v) => { const s = String(Math.abs(v)); for (const ch of s) await click(`.key[data-k="${ch}"]`); if (v < 0) await click('.key[data-k="±"]'); await click('.key[data-k="ok"]'); };
  const fail = (m) => { throw new Error(m); };

  await page.goto(base); await page.fill('#nm', 'Tester'); await click('[data-act=addp]');
  const levels = await page.evaluate(() => window.ASVAB.LEVELS.map((l) => ({ id: l.id, title: l.title, checkpoint: !!l.checkpoint, cards: l.cards ? l.cards.length : 0, lesson: !!(window.LESSONS || {})[l.lesson || l.id] })));
  const guided = await page.evaluate(() => window.ASVAB.CFG.guided);
  const count = { lessonCards: 0, asks: 0, typedSteps: 0, guidedProblems: 0, flashcards: 0, practice: 0, checkQs: 0, hints: 0 };

  for (let li = 0; li < levels.length; li++) {
    const L = levels[li]; global.WHERE = L.id;
    // a level that is still locked must bounce back to the home screen
    if (li + 1 < levels.length) { await page.goto(base + '#/level/' + levels[li + 1].id); if ((await hash()) !== '#/home') fail(`locked level ${levels[li + 1].id} opened before ${L.id} was passed`); }
    await page.goto(base + '#/level/' + L.id); await page.waitForSelector('.stepcard'); await fit(`${L.id} level page`);
    if (await page.evaluate(() => !!document.querySelector('.stepcard.now [data-act=startcheck]')) && !L.checkpoint) fail(`${L.id}: Level Check is open before the lesson and practice`);
    // ----- lesson -----
    if (L.lesson && !L.checkpoint) {
      await click('.stepcard.now .btn'); if (!(await hash()).startsWith('#/learn/')) fail(`${L.id}: lesson did not open`);
      for (let g = 0; g < 60 && (await hash()).startsWith('#/learn/'); g++) {
        const info = await page.evaluate(() => { const S = window.ASVAB_APP.state().les; if (!S) return null; const l = window.ASVAB.LEVELS.find((x) => x.id === S.id), c = window.LESSONS[l.lesson || l.id].cards[S.k]; return { k: S.k, ask: c.ask ? { num: c.ask.num, a: c.ask.a, opts: !!c.ask.opts } : null, order: S.order, ok: S.ok }; });
        if (!info) break; count.lessonCards++; await fit(`${L.id} lesson card ${info.k + 1}`);
        if (info.ask && info.ok !== true) { count.asks++;
          if (await page.$('[data-act=lnext]:not([disabled])')) fail(`${L.id} card ${info.k + 1}: Next is enabled before the check is answered`);
          if (info.ask.opts) { const wrong = info.order.findIndex((o) => o !== info.ask.a); await click(`[data-act=lpick][data-i="${wrong}"]`);
            if (await page.$('[data-act=lnext]:not([disabled])')) fail(`${L.id} card ${info.k + 1}: a wrong answer unlocked Next`);
            await click(`[data-act=lpick][data-i="${info.order.indexOf(info.ask.a)}"]`); }
          else { if (!(await page.$('.keys'))) fail(`${L.id} card ${info.k + 1}: number pad missing`); await typeNum(info.ask.num + 1); if (await page.$('[data-act=lnext]:not([disabled])')) fail(`${L.id} card ${info.k + 1}: a wrong number unlocked Next`); await typeNum(info.ask.num); }
          if (!(await page.$('[data-act=lnext]:not([disabled])'))) fail(`${L.id} card ${info.k + 1}: the right answer (${info.ask.opts ? 'choice' : info.ask.num}) was not accepted`);
          await fit(`${L.id} lesson card ${info.k + 1} answered`); }
        await click('[data-act=lnext]');
      }
    }
    // ----- flashcards -----
    if (L.cards) {
      if (!(await hash()).startsWith('#/cards/')) { await page.goto(base + '#/level/' + L.id); await click('.stepcard.now .btn'); }
      if (!(await hash()).startsWith('#/cards/')) fail(`${L.id}: flashcards did not open`);
      for (let g = 0; g < 2000; g++) { const F = (await st()).fc; if (!F || F.phase === 'done') break;
        if (F.phase === 'study') { if (g < 2) await fit(`${L.id} flashcard`); await click('.flash'); if (g < 2) await fit(`${L.id} flashcard back`); count.flashcards++; await click('[data-act=fnext]'); }
        else { if (F.picked == null) await click(`.choice[data-i="${g % 11 === 0 ? (F.q.answer + 1) % 4 : F.q.answer}"]`); await click('[data-act=fq]'); } }
      if ((await st()).fc.phase !== 'done') fail(`${L.id}: flashcard rounds never finished`);
      await click('.card.gold .btn');
    }
    // ----- do it together -----
    if (guided && !L.checkpoint) {
      if (!(await hash()).startsWith('#/guide/')) fail(`${L.id}: expected Do it together, at ${await hash()}`);
      for (let g = 0; g < 200; g++) {
        if (await page.$('[data-to^="#/practice/"]')) { await click('[data-to^="#/practice/"]'); break; }
        if (await page.$('[data-act=gnew]')) { count.guidedProblems++; await click('[data-act=gnew]'); continue; }
        if (await page.$('.keys')) { const ans = await page.evaluate(() => { const G = window.ASVAB_APP.state().gd; return window.ASVAB_APP.blankOf(G.q.steps[G.i]).ans; });
          if (!Number.isFinite(ans) || String(Math.abs(ans)).replace('.', '').length > 9) fail(`${L.id}: a step asks for a number that cannot be typed (${ans})`);
          if (g % 5 === 0) { await typeNum(ans + 1); if (await page.$('[data-act=gnext]')) fail(`${L.id}: a wrong number was accepted in a guided step`); }
          await fit(`${L.id} guided step`); await typeNum(ans); count.typedSteps++; if (!(await page.$('[data-act=gnext]'))) fail(`${L.id}: the right number ${ans} was not accepted in a guided step`); }
        else if (await page.$('.choice:not([disabled])')) { const a = (await st()).gd.q.answer; await click(`.choice[data-i="${(a + 1) % 4}"]`); if (await page.$('[data-act=gnext]')) fail(`${L.id}: wrong pick accepted in guided step`); await click(`.choice[data-i="${a}"]`); }
        await click('[data-act=gnext]');
      }
      count.guidedProblems++;
    }
    // ----- practice -----
    if (!(await hash()).startsWith('#/practice/')) { await page.goto(base + '#/level/' + L.id); await click('.stepcard.now .btn'); }
    if (!(await hash()).startsWith('#/practice/')) fail(`${L.id}: expected practice, at ${await hash()}`);
    await fit(`${L.id} practice`);
    if (await page.$('[data-act=hint]')) { await click('[data-act=hint]'); count.hints++; await fit(`${L.id} hint`); }
    for (let g = 0; g < 40; g++) { if (await page.$('[data-act=startcheck]')) break;
      const S = (await st()).pr; if (S.picked == null) { await click(`.choice[data-i="${g === 1 ? (S.q.answer + 1) % 4 : S.q.answer}"]`); count.practice++; if (g === 1) await fit(`${L.id} practice missed`); }
      if (await page.$('[data-act=startcheck]')) break; await click('[data-act=nextq]'); }
    // ----- level check: fail it once on the first level to prove a fail does not unlock -----
    if (li === 0) { await click('[data-act=startcheck]'); for (let g = 0; g < 20 && !(await st()).ck.done; g++) { const S = (await st()).ck; await click(`.choice[data-i="${g < 5 ? (S.qs[S.i].answer + 1) % 4 : S.qs[S.i].answer}"]`); await click('[data-act=checknext]'); }
      if (await page.evaluate((id) => Object.values(JSON.parse(localStorage.getItem(window.ASVAB.CFG.key)).profiles)[0].levels[id].passed, L.id)) fail('a failed Level Check (5 of 10) passed the level');
      await fit(`${L.id} check failed`); await page.goto(base + '#/level/' + levels[1].id); if ((await hash()) !== '#/home') fail('next level opened after a failed check');
      await page.goto(base + '#/practice/' + L.id); for (let g = 0; g < 40; g++) { if (await page.$('[data-act=startcheck]')) break; const S = (await st()).pr; if (S.picked == null) await click(`.choice[data-i="${S.q.answer}"]`); if (await page.$('[data-act=startcheck]')) break; await click('[data-act=nextq]'); } }
    await click('[data-act=startcheck]');
    for (let g = 0; g < 20 && !(await st()).ck.done; g++) { const S = (await st()).ck; if (g === 0) await fit(`${L.id} check`); await click(`.choice[data-i="${g === 2 ? (S.qs[S.i].answer + 1) % 4 : S.qs[S.i].answer}"]`); count.checkQs++; await click('[data-act=checknext]'); }
    await fit(`${L.id} check results`);
    if (!(await page.evaluate((id) => Object.values(JSON.parse(localStorage.getItem(window.ASVAB.CFG.key)).profiles)[0].levels[id].passed, L.id))) fail(`${L.id}: not marked passed after scoring 9 or more`);
  }
  // ----- after the course: warm-up, mistakes, tests, score, backup, restore, reset -----
  await page.goto(base + '#/home'); await fit('home');
  if (await page.$('.lvl:disabled[data-to^="#/level/"]')) fail('a level is still locked after passing everything');
  await click('[data-to="#/warm"]'); for (let g = 0; g < 12 && (await st()).wm; g++) { const W = (await st()).wm; if (W.picked == null) await click(`.choice[data-i="${g === 0 ? (W.items[W.i].q.answer + 1) % 4 : W.items[W.i].q.answer}"]`); await fit('warm-up'); await click('[data-act=wnext]'); }
  await page.goto(base + '#/home'); if (await page.$('[data-to="#/warm"]')) fail('warm-up is offered twice in one day');
  const missedBefore = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem(window.ASVAB.CFG.key)).profiles)[0].missed.length);
  if (!missedBefore) fail('missed questions were not saved'); await click('[data-to="#/fix"]');
  for (let g = 0; g < 80; g++) { const X = (await st()).fx; if (!X) break; if (await page.$('.choice:not([disabled])')) { await fit('fix my mistakes'); await click(`.choice[data-i="${X.q.answer}"]`); } if (await page.$('[data-act=xnext]')) await click('[data-act=xnext]'); else break; }
  const missedAfter = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem(window.ASVAB.CFG.key)).profiles)[0].missed.length);
  if (missedAfter !== 0) fail(`fix-my-mistakes left ${missedAfter} of ${missedBefore} after answering all correctly`);
  const tests = await page.evaluate(() => Object.values(window.ASVAB.TESTS).map((t) => ({ id: t.id, count: t.count, minutes: t.minutes })));
  for (const T of tests) { await page.goto(base + '#/test/' + T.id); await fit(`test ${T.id} intro`); await click('[data-act=starttest]');
    const timer = await page.textContent('#timer'); if (!new RegExp(`${T.minutes}:00|${T.minutes - 1}:5\\d`).test(timer)) fail(`test ${T.id} timer shows ${timer}, expected ${T.minutes}:00`);
    for (let g = 0; g < T.count; g++) { const S = (await st()).test; if (g === 0) await fit(`test ${T.id}`); await click(`.choice[data-i="${g % 4 === 3 ? (S.qs[S.i].answer + 1) % 4 : S.qs[S.i].answer}"]`); await click('[data-act=testnext]'); }
    await fit(`test ${T.id} results`); const big = await page.textContent('.big'); const want = T.count - Math.floor(T.count / 4); if (!big.includes(`${want} / ${T.count}`)) fail(`test ${T.id} scored "${big.trim()}", expected ${want} / ${T.count}`); }
  await page.goto(base + '#/score'); await fit('score'); const ready = await page.evaluate(() => +document.querySelector('.ring b').textContent.replace('%', '')); if (!(ready >= 60 && ready <= 100)) fail(`readiness after passing everything is ${ready}%`);
  await page.goto(base + '#/settings'); await fit('settings');
  const [dl] = await Promise.all([page.waitForEvent('download'), click('[data-act=backup]')]); const file = path.join(os.tmpdir(), 'asvab-backup-test.json'); await dl.saveAs(file);
  const saved = JSON.parse(fs.readFileSync(file, 'utf8')); if (!saved.profile || Object.keys(saved.profile.levels).length !== levels.length) fail('backup file is missing levels');
  await click('[data-act=reset]'); const afterReset = await page.evaluate(() => Object.values(Object.values(JSON.parse(localStorage.getItem(window.ASVAB.CFG.key)).profiles)[0].levels).filter((l) => l.passed).length); if (afterReset !== 0) fail('reset did not clear progress');
  await page.goto(base + '#/settings'); await page.setInputFiles('#restore', file); await page.waitForFunction(() => location.hash === '#/home');
  const afterRestore = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem(window.ASVAB.CFG.key)).profiles).some((p) => Object.values(p.levels).filter((l) => l.passed).length === window.ASVAB.LEVELS.length)); if (!afterRestore) fail('restore did not bring the progress back');
  await page.goto(base + '#/about'); await fit('about'); await page.goto(base + '#/who'); await fit('who');
  console.log(`${app} at ${width}px: all ${levels.length} levels played and passed in order; ${count.lessonCards} lesson cards, ${count.asks} lesson checks, ${count.guidedProblems} guided problems (${count.typedSteps} typed steps), ${count.flashcards} flashcards, ${count.practice} practice and ${count.checkQs} check questions, ${tests.length} timed tests, warm-up, mistakes list, backup, reset, restore. ${clicks} taps.`);
  if (wide.size) console.log('TOO WIDE FOR THE SCREEN:\n  ' + [...wide].slice(0, 40).join('\n  '));
  if (errors.length) console.log('SCRIPT ERRORS:\n  ' + [...new Set(errors)].slice(0, 20).join('\n  '));
  await browser.close(); server.close(); process.exit(errors.length || wide.size ? 1 : 0);
})().catch(async (e) => { console.error(`FAILED${global.WHERE ? ' at level ' + global.WHERE : ''}:`, e.message);
  if ((global.ERRORS || []).length) console.error('  page errors:', global.ERRORS.slice(0, 5).join(' | '));
  try { console.error('  state:', JSON.stringify(await global.PAGE.evaluate(() => { const s = window.ASVAB_APP.state(); return { pr: s.pr && { d: s.pr.d, run: s.pr.run, picked: s.pr.picked, answer: s.pr.q.answer, choices: s.pr.q.choices }, ck: s.ck && { i: s.ck.i, done: s.ck.done } }; }))); } catch (x) { /* no state */ }
  try { console.error('  on screen:', await global.PAGE.evaluate(() => location.hash + ' | ' + document.querySelector('main').innerText.replace(/\s+/g, ' ').slice(0, 700))); } catch (x) { /* the page is gone */ }
  process.exit(1); });
