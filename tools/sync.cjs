#!/usr/bin/env node
/* Copies the shared engine into each app folder and writes each app's service worker.
   Each app folder (math/, english/, science/) is deployed on its own, so it must hold every file it serves.
   Run after any change:  node tools/sync.cjs [version-suffix]   e.g.  node tools/sync.cjs v3 */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), ver = process.argv[2] || JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).version;
const APPS = { math: 'ASVAB Math', english: 'ASVAB English', science: 'ASVAB Science & Tech' };
const walk = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name)).split(path.sep).join('/')]);
for (const [app, name] of Object.entries(APPS)) {
  const dir = path.join(root, app);
  for (const f of ['app.js', 'styles.css', 'viz.js']) fs.copyFileSync(path.join(root, 'shared', f), path.join(dir, f));
  const all = walk(dir).filter((f) => !/^(sw\.js|README|tests\/)/.test(f) && !f.startsWith('.')).sort();
  const media = all.filter((f) => /\.(mp4|webm)$/.test(f)), files = ['./', ...all.filter((f) => !media.includes(f))];
  const sw = fs.readFileSync(path.join(root, 'shared', 'sw.template.js'), 'utf8').replace('__APP__', name).replace('__VERSION__', `asvab-${app}-${ver}`)
    .replace('__FILES__', JSON.stringify(files)).replace('__MEDIA__', JSON.stringify(media));
  fs.writeFileSync(path.join(dir, 'sw.js'), sw);
  console.log(`${name}: ${files.length} files + ${media.length} videos, cache asvab-${app}-${ver}`);
}
fs.writeFileSync(path.join(root, 'version.json'), JSON.stringify({ version: ver }) + '\n');
