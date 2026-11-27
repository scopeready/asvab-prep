/* Builds the narration script for lesson videos from the lesson cards themselves, so the video always says what the app shows.
   Usage: node tools/video/narration.cjs add,sub,…  > narration.json */
const path = require('path'), fs = require('fs'), root = path.join(__dirname, '..', '..'); global.window = globalThis;
for (const f of ['viz.js', 'levels.js', 'levels2.js', 'lessons/u1.js', 'lessons/u2.js', 'lessons/u3.js', 'lessons/u4.js', 'lessons/u5.js']) require(path.join(root, 'math', f));
const src = fs.readFileSync(path.join(root, 'shared', 'app.js'), 'utf8'); const toSpeech = eval('(' + src.match(/function toSpeech[\s\S]*?\n}\n/)[0].replace('function toSpeech', 'function') + ')');
const say = (h) => toSpeech(h).replace(/\s*\.\s*\./g, '.').replace(/\?\./g, '?').replace(/"/g, '').trim();
const out = {};
for (const id of (process.argv[2] || 'add').split(',')) {
  const L = globalThis.LESSONS[id], lv = globalThis.ASVAB.LEVELS.find((l) => l.id === id), lines = [];
  lines.push({ kind: 'title', text: `${lv.title}. ${say(L.hook)}` });
  L.cards.forEach((c, k) => {
    lines.push({ kind: 'card', k, text: say(c.say) });
    if (c.ask) { const a = c.ask, ans = a.opts ? a.opts[a.a] : String(a.num);
      lines.push({ kind: 'ask', k, text: `Your turn. ${say(a.q)}` });
      lines.push({ kind: 'answer', k, text: `${/^[\d.,−-]+$/.test(String(ans).replace(/<[^>]+>/g, '')) ? 'The answer is ' + say(ans) + '. ' : ''}${say(a.why)}` }); }
  });
  lines.push({ kind: 'end', text: 'Now open the lesson and try each step yourself.' });
  out[id] = lines;
}
console.log(JSON.stringify(out, null, 1));
