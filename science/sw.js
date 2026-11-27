/* ASVAB Science & Tech service worker: caches the whole app so it works with no internet.
   Bump VERSION on every release so phones pick up the new files. */
const VERSION = 'asvab-science-v6';
const FILES = ["./","app.js","data/ai.js","data/gs1.js","data/gs2.js","data/si.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","lessons/gs1.js","levels.js","manifest.webmanifest","styles.css","viz.js"];
const MEDIA = []; // lesson videos: cached in the background, one at a time, so a slow connection never blocks the app

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
    .then(() => caches.open(VERSION)).then(async (c) => { for (const f of MEDIA) { try { if (!(await c.match(f))) await c.add(f); } catch (err) { /* offline: try again next time */ } } }));
});
// A video player asks for byte ranges. Answer those from the cached copy so videos play offline (Safari needs this).
async function ranged(req, res) {
  const m = /bytes=(\d+)-(\d*)/.exec(req.headers.get('range') || ''); if (!m) return res;
  const buf = await res.arrayBuffer(), start = +m[1], end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  if (start >= buf.byteLength) return new Response('', { status: 416, headers: { 'Content-Range': `bytes */${buf.byteLength}` } });
  return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}
// Serve from the cache first (instant, works offline), and refresh the cache in the background when online.
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate', isMedia = /\.(mp4|webm|m4a|mp3)$/.test(url.pathname);
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const cached = await cache.match(isPage ? 'index.html' : url.pathname, { ignoreSearch: true });
    if (isMedia) {
      if (cached) return ranged(req, cached);
      try { const res = await fetch(req); if (res.status === 200) cache.put(url.pathname, res.clone()); return res; } catch (err) { return new Response('', { status: 504 }); }
    }
    const fresh = fetch(req).then((res) => { if (res && res.ok && !isPage) cache.put(url.pathname, res.clone()); return res; }).catch(() => null);
    if (cached) { e.waitUntil(fresh); return cached; }
    const res = await fresh;
    return res || (isPage ? cache.match('index.html') : new Response('', { status: 504 }));
  }));
});
