/* Generates thousands of questions per level and checks each one: 4 different choices, a valid answer index, steps,
   no "undefined"/"NaN" anywhere, and (math) that every fill-in blank the app would ask for is a real number.
   Usage: node tests/stress.cjs math|english [perLevel] */
const path = require('path'), fs = require('fs'), root = path.join(__dirname, '..'), app = process.argv[2] || 'math', N = +process.argv[3] || 1500;
global.window = globalThis;
const html = fs.readFileSync(path.join(root, app, 'index.html'), 'utf8');
for (const m of html.matchAll(/<script src="([^"]+)"><\/script>/g)) if (m[1] !== 'app.js') require(path.join(root, app, m[1]));
const src = fs.readFileSync(path.join(root, 'shared', 'app.js'), 'utf8'); const blankOf = eval('(' + src.match(/function blankOf[\s\S]*?\n}\n/)[0].replace('function blankOf', 'function') + ')');
const { LEVELS, TESTS } = globalThis.ASVAB; let total = 0; const bad = [];
const check = (where, q) => { total++; const t = JSON.stringify(q);
  const fail = (m) => { if (bad.length < 25) bad.push(`${where}: ${m} :: ${String(q && q.q).replace(/<[^>]+>/g, '').slice(0, 90)}`); };
  if (!q || !q.q || !Array.isArray(q.choices) || q.choices.length !== 4) return fail('not 4 choices');
  if (new Set(q.choices.map(String)).size !== 4) fail('duplicate choices ' + q.choices.join(' | ').replace(/<[^>]+>/g, ''));
  if (!(q.answer >= 0 && q.answer < 4)) fail('bad answer index');
  if (!Array.isArray(q.steps) || !q.steps.length || q.steps.some((s) => !s)) fail('missing steps');
  if (/undefined|NaN|\[object|Infinity/.test(t.replace(/"(fig|sfig)":"(?:[^"\\]|\\.)*"/g, ''))) fail('bad text');
  if (/NaN|undefined/.test((q.fig || '') + (q.sfig || ''))) fail('bad picture');
  for (const s of q.steps || []) { const b = blankOf(s); if (b && !Number.isFinite(b.ans)) fail('bad blank'); } };
for (const l of LEVELS) for (let i = 0; i < N; i++) check(l.id, l.gen(1 + (i % 3)));
for (const T of Object.values(TESTS)) for (let i = 0; i < N; i++) for (const g of T.gens) check('test ' + T.id, g(2 + (i % 2)));
let cards = 0; for (const l of LEVELS) if (l.cards) { const ids = new Set(); for (const c of l.cards) { cards++; if (ids.has(c.id)) bad.push(l.id + ': duplicate card ' + c.id); ids.add(c.id); for (let i = 0; i < 4; i++) check(l.id + ' card ' + c.id, l.cardQ(c.id)); } }
const LS = globalThis.LESSONS || {}; const noLesson = LEVELS.filter((l) => !l.checkpoint && !LS[l.lesson || l.id] && !l.cards).map((l) => l.id);
if (noLesson.length) bad.push('levels with no lesson and no flashcards: ' + noLesson.join(', '));
console.log(`${app}: ${total} questions checked across ${LEVELS.length} levels and ${Object.keys(TESTS).length} tests${cards ? `, ${cards} flashcards` : ''}`);
if (bad.length) { console.log('PROBLEMS:\n  ' + bad.join('\n  ')); process.exit(1); } console.log('ALL OK');
