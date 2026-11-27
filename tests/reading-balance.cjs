/* Reading questions must not give the answer away by its shape.
   Counts, per file and per question type, how often the correct choice is the single longest (or single shortest) of the four,
   and where the correct choice sits. By chance each is about 25%. Fails if the longest-answer cue is stronger than LIMIT.
   Usage: node tests/reading-balance.cjs [--list]     (--list prints the questions where the key is the single longest) */
const path = require('path'); global.window = globalThis; const LIMIT = 0.34, list = process.argv.includes('--list');
const files = ['pc1', 'pc2', 'pc3']; let fail = false; const all = { n: 0, long: 0, short: 0 };
for (const f of files) {
  require(path.join(__dirname, '..', 'english', 'data', f + '.js')); const P = window['ASVAB_EN_' + f.toUpperCase()];
  let n = 0, long = 0, short = 0; const pos = [0, 0, 0, 0], byType = {}, bad = [];
  for (const p of P) p.qs.forEach((q, i) => { const L = q.c.map((c) => c.length), k = L[q.a], others = L.filter((_, j) => j !== q.a); n++; pos[q.a]++;
    const t = (byType[q.type] = byType[q.type] || [0, 0]); t[1]++;
    if (k > Math.max(...others)) { long++; t[0]++; if (list) console.log(`${f} ${p.id} Q${i + 1} (${q.type})  key ${k} chars, next longest ${Math.max(...others)}`); }
    if (k < Math.min(...others)) short++;
    if (!(q.a >= 0 && q.a < 4) || new Set(q.c).size !== 4 || !q.why || !q.why.length) bad.push(`${p.id} Q${i + 1}`); });
  console.log(`${f}: ${n} questions | key is the single longest in ${long} (${Math.round(long / n * 100)}%), single shortest in ${short} (${Math.round(short / n * 100)}%) | key position ${pos.join('/')} | longest by type: ${Object.entries(byType).map(([k, v]) => `${k} ${v[0]}/${v[1]}`).join(', ')}`);
  if (bad.length) { console.log('  BROKEN: ' + bad.join(', ')); fail = true; }
  if (long / n > LIMIT || short / n > LIMIT) fail = true; all.n += n; all.long += long; all.short += short;
}
console.log(`all: key single longest ${Math.round(all.long / all.n * 100)}%, single shortest ${Math.round(all.short / all.n * 100)}% (chance is about 25%; limit ${LIMIT * 100}%)`);
process.exit(fail ? 1 : 0);
