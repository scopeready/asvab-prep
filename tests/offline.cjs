/* Checks the app really works with no internet: loads it once, waits for the offline cache, cuts the connection,
   reloads, opens a lesson, and (math) asks for part of a video the way a phone's video player does.
   Usage: node tests/offline.cjs math|english */
const { chromium } = require(process.env.PW || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const app = process.argv[2] || 'math', dir = path.join(__dirname, '..', app);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => { let f = path.join(dir, decodeURIComponent(req.url.split('?')[0])); if (req.url.split('?')[0].endsWith('/')) f = path.join(dir, 'index.html');
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b); }); });
(async () => {
  await new Promise((r) => server.listen(0, r)); const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch(), ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }), page = await ctx.newPage();
  await page.goto(base); await page.evaluate(() => navigator.serviceWorker.ready);
  const want = await page.evaluate(async () => { const sw = await (await fetch('sw.js')).text(); return JSON.parse(sw.match(/const MEDIA = (\[.*?\]);/)[1]).length + JSON.parse(sw.match(/const FILES = (\[.*?\]);/)[1]).length; });
  let cached = 0; for (let i = 0; i < 60 && cached < want; i++) { await page.waitForTimeout(500); cached = await page.evaluate(async () => { let n = 0; for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length; return n; }); }
  if (cached < want) throw new Error(`only ${cached} of ${want} files were cached`);
  await ctx.setOffline(true); await page.reload(); await page.fill('#nm', 'Offline'); await page.click('[data-act=addp]');
  const first = await page.evaluate(() => window.ASVAB.LEVELS[0].id); await page.goto(base + '#/learn/' + first); await page.waitForSelector('.lcard');
  let video = 'none';
  if (await page.$('video')) video = await page.evaluate(async () => { const src = document.querySelector('video').getAttribute('src'); const r = await fetch(src, { headers: { Range: 'bytes=0-999' } }); const b = await r.arrayBuffer();
    const r2 = await fetch(src, { headers: { Range: 'bytes=5000-' } }); return `${r.status} ${r.headers.get('Content-Range')} (${b.byteLength} bytes); tail ${r2.status} ${r2.headers.get('Content-Range')}`; });
  console.log(`${app}: ${cached} files cached, lesson opens offline, video range request: ${video}`);
  await browser.close(); server.close();
  if (video !== 'none' && !/^206 bytes 0-999\/\d+ \(1000 bytes\); tail 206/.test(video)) process.exit(1);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
