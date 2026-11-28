#!/usr/bin/env node
/* Lists the narration clips the lesson videos need, so recording them is one pass with no guessing.
   One clip per scene, named <video id>-<scene number>.mp3, spoken from the scene's `say` line in scripts.js.
   Usage:
     node tools/video/clips.cjs ratio,equation,area          every clip for those videos
     node tools/video/clips.cjs all path/to/clips            only the clips that are not in that folder yet
     node tools/video/clips.cjs ratio --json                 the same list as JSON
   The first eight videos were recorded with Higgsfield text-to-speech (model text2speech_v2, preset voice "Fraser",
   voice id 6705e465-7b52-5915-a1d8-b1222885e01d). Use the same voice so every video sounds alike.
   build.cjs slows the clips slightly itself, so record them at normal speed. */
const path = require('path'), fs = require('fs'), root = path.join(__dirname, '..', '..'); global.window = globalThis;
require(path.join(root, 'shared', 'viz.js')); const VIDEOS = require('./scripts.js');
const args = process.argv.slice(2), json = args.includes('--json'), rest = args.filter((a) => a !== '--json');
const ids = !rest[0] || rest[0] === 'all' ? Object.keys(VIDEOS) : rest[0].split(','), have = rest[1] ? path.resolve(rest[1]) : null;
const out = [];
for (const id of ids) { const v = VIDEOS[id]; if (!v) { console.error(`no video script named "${id}". Scripts: ${Object.keys(VIDEOS).join(', ')}`); process.exit(1); }
  v.scenes.forEach((s, k) => { const file = `${id}-${k + 1}.mp3`; if (have && fs.existsSync(path.join(have, file))) return; out.push({ file, video: v.title, text: s.say }); }); }
if (json) console.log(JSON.stringify(out, null, 1));
else { for (const c of out) console.log(`${c.file}\t${c.text}`);
  const chars = out.reduce((a, c) => a + c.text.length, 0), words = out.reduce((a, c) => a + c.text.split(/\s+/).length, 0);
  console.error(`\n${out.length} clip${out.length === 1 ? '' : 's'} to record for ${ids.length} video${ids.length === 1 ? '' : 's'}: ${words} words, ${chars} characters${have ? ' (clips already in ' + have + ' are left out)' : ''}.`); }
