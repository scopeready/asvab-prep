#!/usr/bin/env node
/* Builds the narrated lesson videos.
   Pictures: drawn by the app's own picture library (shared/viz.js), so the math on screen is exact.
   Voice: one narration clip per scene in <voDir>/<video id>-<scene number>.mp3 (made with text-to-speech from the `say` lines in scripts.js).
   Each scene stays on screen for as long as its narration lasts, plus a short pause.
   Usage: node tools/video/build.cjs <voDir> [ids]        Needs: playwright, ffmpeg.
   Output: math/video/<id>.mp4 + <id>.jpg, and math/lessons/videos.js (tells the app which lessons have a video). */
const { chromium } = require(process.env.PW || 'playwright');
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const root = path.join(__dirname, '..', '..'), voDir = path.resolve(process.argv[2] || 'vo'), only = process.argv[3] ? process.argv[3].split(',') : null;
const TEMPO = 0.94, PAUSE = 0.8, SIZE = 720, FPS = 5;
const page = (css, viz, scripts) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}
  html, body { margin: 0; width: 540px; height: 540px; overflow: hidden; background: #F3F6FB; color: #182233; }
  .bar { height: 46px; background: #13294B; color: #fff; display: flex; align-items: center; padding: 0 18px; font-weight: 800; font-size: 17px; gap: 10px; }
  .bar .n { margin-left: auto; display: flex; gap: 6px; } .bar .n i { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,.3); } .bar .n i.on { background: #F2A900; }
  h1 { font-size: 27px; line-height: 1.2; margin: 14px 22px 0; }
  #stage { position: absolute; left: 14px; right: 14px; top: 104px; height: 300px; display: flex; align-items: center; justify-content: center; }
  #fig { background: #fff; border: 1px solid #DFE5EE; border-radius: 16px; padding: 12px 16px; transform-origin: center center; text-align: center; }
  #fig .viz { display: block; margin: 0 auto; } #fig table { margin: 6px auto; }
  #sub { position: absolute; left: 0; right: 0; bottom: 0; height: 124px; background: #FFF4D6; border-top: 3px solid #F2A900; display: flex; align-items: center; padding: 0 22px; font-size: 19.5px; line-height: 1.38; font-weight: 600; }
  </style></head><body><div class="bar"><span id="t"></span><span class="n" id="n"></span></div><h1 id="cap"></h1><div id="stage"><div id="fig"></div></div><div id="sub"><span id="say"></span></div>
  <script>${viz}</script><script>${scripts}</script>
  <script>window.show = (id, k) => { const v = VIDEOS[id], s = v.scenes[k]; t.textContent = 'ASVAB Math · ' + v.title; n.innerHTML = v.scenes.map((_, i) => '<i class="' + (i <= k ? 'on' : '') + '"></i>').join('');
    cap.innerHTML = s.cap; say.textContent = s.say; fig.style.transform = ''; fig.innerHTML = s.fig; fig.querySelectorAll('svg.viz').forEach((e) => { e.style.width = e.viewBox.baseVal.width + 'px'; });
    const r = fig.getBoundingClientRect(), k2 = Math.min(1.75, 500 / r.width, 296 / r.height); fig.style.transform = 'scale(' + k2 + ')'; return k2; };</script></body></html>`;
(async () => {
  const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'asvab-video-')), out = path.join(root, 'math', 'video'); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch(), pg = await browser.newPage({ viewport: { width: 540, height: 540 }, deviceScaleFactor: 2 });
  await pg.setContent(page(read('shared/styles.css'), read('shared/viz.js'), read('tools/video/scripts.js')));
  const videos = await pg.evaluate(() => Object.fromEntries(Object.entries(window.VIDEOS).map(([id, v]) => [id, v.scenes.length])));
  const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
  const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
  const made = [];
  for (const [id, n] of Object.entries(videos)) {
    if (only && !only.includes(id)) continue;
    const parts = []; let total = 0;
    for (let k = 0; k < n; k++) {
      const vo = path.join(voDir, `${id}-${k + 1}.mp3`); if (!fs.existsSync(vo)) throw new Error('missing narration ' + vo);
      await pg.evaluate(([i, j]) => window.show(i, j), [id, k]);
      const png = path.join(tmp, `${id}-${k}.png`), seg = path.join(tmp, `${id}-${k}.mp4`); await pg.screenshot({ path: png });
      const d = dur(vo) / TEMPO + PAUSE + (k === n - 1 ? 0.6 : 0); total += d;
      ff(['-loop', '1', '-framerate', String(FPS), '-i', png, '-i', vo, '-filter_complex', `[0:v]scale=${SIZE}:${SIZE}:flags=lanczos,format=yuv420p[v];[1:a]adelay=250:all=1,atempo=${TEMPO},apad[a]`, '-map', '[v]', '-map', '[a]', '-t', d.toFixed(2),
        '-c:v', 'libx264', '-preset', 'slow', '-tune', 'stillimage', '-crf', '28', '-g', String(FPS * 10), '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-ar', '44100', seg]);
      parts.push(seg); if (k === 0) ff(['-i', png, '-vf', `scale=${SIZE}:${SIZE}`, '-q:v', '4', path.join(out, id + '.jpg')]);
    }
    const list = path.join(tmp, id + '.txt'); fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
    ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', path.join(out, id + '.mp4')]);
    made.push(id); console.log(`${id}: ${n} scenes, ${Math.round(total)} s, ${(fs.statSync(path.join(out, id + '.mp4')).size / 1024).toFixed(0)} KB`);
  }
  await browser.close();
  const have = fs.readdirSync(out).filter((f) => f.endsWith('.mp4')).map((f) => f.replace('.mp4', '')).sort();
  fs.writeFileSync(path.join(root, 'math', 'lessons', 'videos.js'), `/* Written by tools/video/build.cjs: the lessons that open with a short narrated video. */\nfor (const id of ${JSON.stringify(have)}) if (window.LESSONS && LESSONS[id]) { LESSONS[id].video = 'video/' + id + '.mp4'; LESSONS[id].poster = 'video/' + id + '.jpg'; }\n`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
