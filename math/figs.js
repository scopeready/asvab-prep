/* ASVAB Math — pictures for practice questions.
   Wraps each level's question generator: reads the question text and, where a picture helps,
   adds `fig` (shown with the question) and `sfig` (shown with the full solution). Never changes the math. */
(function () {
'use strict';
const A = window.ASVAB, V = window.V; if (!A || !V) return;
const M = '−';
const text = (h) => String(h).replace(/<span class="fr"><span class="fn">(.*?)<\/span><span class="fd">(.*?)<\/span><\/span>/g, '{$1/$2}').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
const N = (s) => parseFloat(String(s).replace(/,/g, '').replace(M, '-'));
const unitOf = (u) => (u || '').replace('feet', 'ft').replace('inches', 'in').replace('meters', 'm').replace('yards', 'yd');
const U = '(ft|feet|in|inches|m|meters|cm|yd|yards|mi|miles)?';
const num = '(' + M + '?-?[\\d,]+(?:\\.\\d+)?)';
const sgn = '\\(?(' + M + '?[\\d,]+)\\)?';

const RULES = {
  add: (t) => { const m = t.match(/^What is ([\d,]+) \+ ([\d,]+)\?/); if (m) { const a = N(m[1]), b = N(m[2]); return { fig: V.stack(a, b, '+', { ans: false, marks: false }), sfig: V.stack(a, b, '+') }; } },
  sub: (t) => { const m = t.match(new RegExp('^What is ([\\d,]+) ' + M + ' ([\\d,]+)\\?')); if (m) { const a = N(m[1]), b = N(m[2]); return { fig: V.stack(a, b, '-', { ans: false, marks: false }), sfig: V.stack(a, b, '-') }; } },
  mul: (t) => { const m = t.match(/^What is ([\d,]+) × ([\d,]+)\?/); if (!m) return; const a = N(m[1]), b = N(m[2]);
    if (a <= 12 && b <= 12) return a <= 10 && b <= 10 ? { sfig: V.dots(a, b) } : null;
    return { fig: V.stack(a, b, 'x', { ans: false, marks: false }) }; },
  neg: (t) => { const m = t.match(new RegExp('^What is ' + sgn + ' ([+' + M + ']) ' + sgn + '\\?')); if (!m) return; const a = N(m[1]), b = N(m[3]) * (m[2] === '+' ? 1 : -1), r = a + b;
    const lo = Math.min(a, r, 0) - 2, hi = Math.max(a, r, 0) + 2; if (hi - lo > 44 || b === 0) return;
    return { sfig: V.nl(lo, hi, { pts: [[a, 'start'], [r, 'end', '#2E7D4F']], jumps: [[a, r, (b > 0 ? '+' : M) + Math.abs(b)]] }) }; },
  simplify: (t) => { const m = t.match(/^Write \{(\d+)\/(\d+)\} in simplest form/); if (!m) return; const n = +m[1], d = +m[2], g = A.H.gcd(n, d); if (d > 24 || n > d || g === 1) return;
    return { sfig: V.fbars([[n, d], [n / g, d / g]]) }; },
  fracadd: (t) => { const m = t.match(new RegExp('^What is \\{(\\d+)/(\\d+)\\} [+' + M + '] \\{(\\d+)/(\\d+)\\}\\?')); if (!m) return; const [, a, b, c, d] = m.map(Number); if (b > 12 || d > 12 || a > b || c > d) return;
    return { fig: V.fbars([[a, b], [c, d]]) }; },
  percent: (t) => { const m = t.match(/^What is (\d+)% of ([\d,]+)\?/); if (m && +m[1] <= 100) return { sfig: V.pbar(+m[1], { whole: N(m[2]) }) }; },
  angles: (t) => { let m;
    if ((m = t.match(/complementary\. One is (\d+)°/))) return { fig: V.angsplit(90, +m[1]) };
    if ((m = t.match(/supplementary\. One is (\d+)°/))) return { fig: V.angsplit(180, +m[1]) };
    if ((m = t.match(/triangle has interior angles of (\d+)° and (\d+)°/))) return { fig: V.triang(m[1] + '°', m[2] + '°', '') };
    if ((m = t.match(/[Tt]wo angles of a triangle are (\d+)° and (\d+)°/))) return { fig: V.triang(m[1] + '°', m[2] + '°', '?') }; },
  area: (t) => { let m;
    if ((m = t.match(new RegExp('rectangle that is ' + num + ' ?' + U + ' by ' + num)))) return { fig: V.rect(N(m[1]), N(m[3]), { unit: unitOf(m[2]) }) };
    if ((m = t.match(new RegExp('rectangle is ' + num + ' ' + U + ' long and ' + num)))) return { fig: V.rect(N(m[1]), N(m[3]), { unit: unitOf(m[2]) }) };
    if ((m = t.match(new RegExp('rectangle has an? (?:area|perimeter) of ' + num + ' (?:square )?' + U + ' and a length of ' + num + ' ?' + U)))) return { fig: V.rect(N(m[3]), N(m[3]) * 0.6, { unit: unitOf(m[4]), top: m[3] + ' ' + unitOf(m[4]), side: '?' }) };
    if ((m = t.match(new RegExp('yard is ' + num + ' ft by ' + num + ' ft')))) return { fig: V.rect(N(m[1]), N(m[2]), { unit: 'ft' }) };
    if ((m = t.match(new RegExp('square (?:with|has) sides? of ' + num + ' ?' + U)))) return { fig: V.square(N(m[1]), { unit: unitOf(m[2]) }) };
    if ((m = t.match(new RegExp('parallelogram has a base of ' + num + ' ?' + U + ' and a height of ' + num)))) return { fig: V.para(N(m[1]), N(m[3])) };
    if ((m = t.match(new RegExp('triangle has a base of ' + num + ' ?' + U + ' and a height of ' + num)))) return { fig: V.tri(N(m[1]), N(m[3])) };
    if ((m = t.match(new RegExp('trapezoid has (?:parallel sides|bases) of ' + num + ' ?' + U + ' and ' + num + ' ?' + U + ' and a height of ' + num)))) return { fig: V.trap(N(m[1]), N(m[3]), N(m[5])) }; },
  circle: (t) => { let m;
    if ((m = t.match(new RegExp('circle with (?:a )?radius (?:of )?' + num)))) return { fig: V.circle({ r: N(m[1]) }) };
    if ((m = t.match(new RegExp('circle (?:has|with) a diameter of ' + num)))) return { fig: V.circle({ d: N(m[1]) }) }; },
  pyth: (t) => { let m;
    if ((m = t.match(new RegExp('legs of ' + num + ' and ' + num)))) return { fig: V.rtri(N(m[1]), N(m[2]), '?') };
    if ((m = t.match(new RegExp('hypotenuse of ' + num + ' and one leg of ' + num)))) return { fig: V.rtri(N(m[2]), '?', N(m[1])) };
    if ((m = t.match(new RegExp('bottom is ' + num + ' ft from the wall and it reaches ' + num + ' ft up')))) return { fig: V.rtri(N(m[2]), N(m[1]), '?') }; },
  volume: (t) => { let m;
    if ((m = t.match(new RegExp('box is ' + num + ' ' + U + ' long, ' + num + ' \\w+ wide and ' + num)))) return { fig: V.box(N(m[1]), N(m[3]), N(m[4])) };
    if ((m = t.match(new RegExp('box that is ' + num + ' ' + U + ' by ' + num + ' \\w+ by ' + num)))) return { fig: V.box(N(m[1]), N(m[3]), N(m[4])) };
    if ((m = t.match(new RegExp('can has a diameter of ' + num + ' ' + U + ' and a height of ' + num)))) return { fig: V.cyl(N(m[1]) / 2, N(m[3])) };
    if ((m = t.match(new RegExp('cube (?:has|with) edges of ' + num)))) return { fig: V.box(N(m[1]), N(m[1]), N(m[1])) };
    if ((m = t.match(new RegExp('cylinder has a radius of ' + num + ' ' + U + ' and a height of ' + num)))) return { fig: V.cyl(N(m[1]), N(m[3])) }; },
  coord: (t) => { let m; const P = '\\(' + num + ', ' + num + '\\)';
    if ((m = t.match(new RegExp(P + ' and ' + P)))) { const p = [[N(m[1]), N(m[2])], [N(m[3]), N(m[4])]], big = Math.max(...p.flat().map(Math.abs)); if (big > 12) return;
      return { fig: V.plane({ pts: p, rise: /slope/.test(t), range: big > 6 ? 12 : 6 }) }; }
    if ((m = t.match(new RegExp('line y = (' + M + '?\\d*)x(?: ([+' + M + ']) (\\d+))?\\?')))) { const k = m[1] === '' ? 1 : m[1] === M ? -1 : N(m[1]), c = m[2] ? N(m[3]) * (m[2] === '+' ? 1 : -1) : 0; if (Math.abs(c) > 12) return;
      return { sfig: V.plane({ line: [k, c], pts: [[0, c, 'b = ' + String(c).replace('-', M)]], range: Math.abs(c) > 6 ? 12 : 6 }) }; } },
};
function decorate(id, q) {
  if (!q || q.fig || q.sfig) return q;
  const t = text(q.q);
  for (const key of id && RULES[id] ? [id] : Object.keys(RULES)) { try { const r = RULES[key](t); if (r) { Object.assign(q, r); break; } } catch (e) { /* a picture is optional */ } }
  return q;
}
for (const l of A.LEVELS) { const g = l.gen, id = l.checkpoint || l.id === 'armix' ? null : l.id; l.gen = (d) => decorate(id, g(d)); }
for (const T of Object.values(A.TESTS)) T.gens = T.gens.map((g) => (d) => decorate(null, g(d)));
A.decorate = decorate;
})();
