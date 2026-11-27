// Validates lesson files. Usage: node tests/lesson-check.cjs <app-folder> <lesson-file.js> [expected,level,ids]
const fs = require('fs'), vm = require('vm'), path = require('path');
const [app, file, expect] = process.argv.slice(2);
const ctx = { console, Math }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../shared/viz.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
const LS = ctx.LESSONS || {}; let bad = 0; const err = (m) => { bad++; console.log('  ✗ ' + m); };
const OKTAGS = /^(b|i|br|sup|sub|mark|u|span|div|p|svg|path|line|circle|rect|text|g|defs|clipPath|ellipse|table|tr|td|th|pre|s|em|strong|ul|li)$/;
const text = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const words = (h) => text(h).split(' ').filter(Boolean).length;
const checkHTML = (h, where) => { if (typeof h !== 'string') return err(`${where}: not a string`); if (/undefined|NaN|\[object/.test(h)) err(`${where}: contains undefined/NaN`); for (const m of h.matchAll(/<\/?([a-zA-Z0-9]+)/g)) if (!OKTAGS.test(m[1])) err(`${where}: tag <${m[1]}> not allowed`); };
for (const [id, les] of Object.entries(LS)) {
  const cs = les.cards || []; console.log(`${id}: ${cs.length} cards, ${cs.filter((c) => c.ask).length} checks, ${cs.filter((c) => c.fig).length} pictures`);
  if (!les.hook || words(les.hook) > 30) err(`${id}: hook missing or over 30 words`);
  if (cs.length < 6 || cs.length > 11) err(`${id}: needs 6 to 11 cards`);
  if (cs.filter((c) => c.ask).length < 3) err(`${id}: needs at least 3 "ask" checks`);
  if (cs.filter((c) => c.fig).length < Math.min(3, cs.length / 2)) err(`${id}: needs more pictures (fig)`);
  if (cs[0] && cs[0].ask) err(`${id}: the first card should teach, not ask`);
  cs.forEach((c, k) => { const w = `${id} card ${k + 1}`;
    if (!c.t || c.t.length > 44) err(`${w}: title missing or over 44 characters`);
    checkHTML(c.say, w + ' say'); if (words(c.say) > 55) err(`${w}: say is ${words(c.say)} words (max 55)`); if (words(c.say) < 4) err(`${w}: say too short`);
    if (c.fig != null) checkHTML(c.fig, w + ' fig');
    if (c.ask) { const a = c.ask; checkHTML(a.q, w + ' ask.q'); checkHTML(a.why, w + ' ask.why'); if (words(a.why) > 45) err(`${w}: why over 45 words`);
      if (a.opts) { if (a.opts.length !== 4 || new Set(a.opts.map(String)).size !== 4) err(`${w}: opts must be 4 different choices`); if (!(a.a >= 0 && a.a < 4)) err(`${w}: a must be 0-3`); a.opts.forEach((o) => checkHTML(String(o), w + ' opt')); }
      else if (typeof a.num !== 'number' || !isFinite(a.num)) err(`${w}: ask needs opts+a or a numeric num`); }
  });
}
if (expect) for (const id of expect.split(',')) if (!LS[id]) err(`missing lesson for level "${id}"`);
console.log(bad ? `${bad} problem(s)` : 'ALL OK'); process.exit(bad ? 1 : 0);
