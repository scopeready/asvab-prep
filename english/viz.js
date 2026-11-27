/* ASVAB Prep — picture library. Every function returns an HTML/SVG string.
   Colors come from CSS variables, so pictures follow light and dark mode. */
(function (root) {
'use strict';
const MINUS = '−';
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const svg = (w, h, body, label) => `<svg class="viz" viewBox="0 0 ${w} ${h}" style="max-width:${w}px" role="img" aria-label="${esc(label || 'diagram')}">${body}</svg>`;
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || 'middle'}" font-size="${o.s || 15}" font-weight="${o.w || 600}" fill="${o.f || 'currentColor'}"${o.i ? ' font-style="italic"' : ''}>${esc(s)}</text>`;
const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || 'currentColor'}" stroke-width="${o.w || 2}"${o.d ? ' stroke-dasharray="5 4"' : ''}/>`;
const GOLD = 'var(--gold)', OK = 'var(--ok)', BAD = 'var(--bad)', LINE = 'var(--line)', SOFT = 'var(--info-soft)', BLUE = 'var(--navy-2)';
const digits = (n) => String(Math.abs(n)).split('').map(Number);
const fmt = (n) => { const s = String(Math.abs(n)); const [i, f] = s.split('.'); return (n < 0 ? MINUS : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : ''); };
const fr = (n, d) => `<span class="fr"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;

// ---------- stacked (column) arithmetic ----------
// V.stack(47, 38, '+')  → carries shown. opts: { ans:false } hides the answer, { show:k } shows only the k right-most answer digits,
// { hi:k } highlights column k (0 = ones), { marks:false } hides carry/borrow marks.
function stack(a, b, op, o = {}) {
  const sym = op === '-' ? MINUS : op === 'x' || op === '*' ? '×' : op;
  if (sym === '×' && b >= 10) return stackMul2(a, b, o);
  const A = digits(a).reverse(), B = digits(b).reverse();
  const res = sym === '+' ? a + b : sym === MINUS ? a - b : a * b, R = digits(res).reverse();
  const n = Math.max(A.length, B.length, R.length);
  const top = Array(n).fill(''), strike = Array(n).fill(false);
  if (sym === '+') { let c = 0; for (let i = 0; i < n; i++) { const t = (A[i] || 0) + (B[i] || 0) + c; c = t >= 10 ? 1 : 0; if (c && i + 1 < n) top[i + 1] = '1'; } }
  else if (sym === MINUS) { const W = A.slice(); for (let i = 0; i < n; i++) { if ((W[i] || 0) < (B[i] || 0)) { let j = i + 1; while (W[j] === 0) { W[j] = 9; top[j] = '9'; strike[j] = true; j++; } W[j] -= 1; top[j] = String(W[j]); strike[j] = true; W[i] += 10; top[i] = String(W[i]); strike[i] = true; } } }
  else { let c = 0; for (let i = 0; i < A.length; i++) { const t = A[i] * b + c; c = Math.floor(t / 10); if (c && i + 1 < A.length) top[i + 1] = String(c); } }
  const show = o.ans === false ? 0 : (o.show == null ? n : o.show);
  const cell = (v, i, cls = '') => `<span class="c ${cls} ${o.hi === i ? 'hi' : ''}">${v}</span>`;
  const row = (arr, cls, lead = '') => `<div class="r ${cls}"><span class="c op">${lead}</span>${Array.from({ length: n }, (_, k) => { const i = n - 1 - k; return cell(arr(i), i); }).join('')}</div>`;
  const marks = o.marks === false ? '' : row((i) => top[i], 'mk');
  return `<div class="stack" role="img" aria-label="${fmt(a)} ${sym} ${fmt(b)}${show >= n ? ' = ' + fmt(res) : ''}">${marks}`
    + row((i) => (A[i] == null ? '' : (strike[i] && o.marks !== false ? `<s>${A[i]}</s>` : A[i])), '')
    + row((i) => (B[i] == null ? '' : B[i]), 'b', sym)
    + `<div class="ln"></div>` + row((i) => (i < show && R[i] != null ? R[i] : (i < R.length ? '&nbsp;' : '')), 'res') + `</div>`;
}
function stackMul2(a, b, o = {}) {
  const B = digits(b).reverse(), parts = B.map((d, i) => a * d * 10 ** i), res = a * b, n = String(res).length + 1;
  const row = (v, lead = '', cls = '') => `<div class="r ${cls}"><span class="c op">${lead}</span>${String(v).padStart(n - 1, ' ').split('').map((ch) => `<span class="c">${ch === ' ' ? '' : ch}</span>`).join('')}</div>`;
  return `<div class="stack" role="img" aria-label="${fmt(a)} × ${fmt(b)} = ${fmt(res)}">${row(a)}${row(b, '×', 'b')}<div class="ln"></div>`
    + parts.map((p, i) => row(p, i === parts.length - 1 && parts.length > 1 ? '+' : '', 'pp')).join('') + (parts.length > 1 ? `<div class="ln"></div>${o.ans === false ? '' : row(res, '', 'res')}` : '') + `</div>`;
}
// V.longdiv(680, 20) → long division with the work shown
function longdiv(N, d, o = {}) {
  const s = String(N), dw = String(d).length + 3, lines = []; let cur = 0, q = '', started = false;
  const work = [];
  for (let i = 0; i < s.length; i++) {
    cur = cur * 10 + +s[i]; const qd = Math.floor(cur / d);
    if (qd > 0 || started || i === s.length - 1) { started = true; q += qd; const prod = qd * d; work.push({ end: i, cur, prod, rem: cur - prod }); cur -= prod; } else q += ' ';
  }
  const pad = (txt, end) => ' '.repeat(Math.max(0, dw + end + 1 - String(txt).length)) + txt;
  lines.push(' '.repeat(dw) + q); lines.push(' '.repeat(dw - 1) + '┌' + '─'.repeat(s.length + 1)); lines.push(`${d} │ `.padStart(dw) + s);
  if (o.work !== false) work.forEach((w, k) => { if (k > 0) lines.push(pad(w.cur, w.end)); lines.push(pad(MINUS + w.prod, w.end)); lines.push(pad('─'.repeat(String(w.cur).length + 1), w.end)); if (k === work.length - 1) lines.push(pad(w.rem, w.end)); });
  return `<pre class="ldiv" role="img" aria-label="${fmt(N)} divided by ${d} equals ${q.trim()}${cur ? ' remainder ' + cur : ''}">${lines.join('\n')}</pre>`;
}
// V.pv(4372) → place-value chart
function pv(n) {
  const names = ['Ones', 'Tens', 'Hundreds', 'Thousands', 'Ten-thousands', 'Hundred-thousands'], D = digits(n);
  return `<table class="pv" aria-label="place value chart for ${fmt(n)}"><tr>${D.map((_, k) => `<th>${names[D.length - 1 - k]}</th>`).join('')}</tr><tr>${D.map((x) => `<td>${x}</td>`).join('')}</tr></table>`;
}

// ---------- number line ----------
// V.nl(-5, 5, { pts:[[-3,'start'],[2,'end']], jumps:[[-3,2,'+5']], step:1, labelEvery:1 })
function nl(min, max, o = {}) {
  const W = 340, H = o.jumps ? 110 : 74, x0 = 22, x1 = W - 22, y = H - 34, step = o.step || 1, le = o.labelEvery || (((max - min) / step > 12) ? 5 : 1);
  const X = (v) => x0 + (v - min) / (max - min) * (x1 - x0); let b = L(x0 - 10, y, x1 + 10, y) + `<path d="M${x1 + 10} ${y} l-8 -5 v10 z M${x0 - 10} ${y} l8 -5 v10 z" fill="currentColor"/>`;
  for (let v = min, k = 0; v <= max + 1e-9; v += step, k++) { const big = k % le === 0; b += L(X(v), y - (big ? 7 : 4), X(v), y + (big ? 7 : 4), { w: big ? 2 : 1 }); if (big) b += T(X(v), y + 24, fmt(+v.toFixed(4)), { s: 13, w: 500 }); }
  (o.jumps || []).forEach(([f, t, txt], k) => { const xa = X(f), xb = X(t), h = 34 + (k % 2) * 12, col = t >= f ? OK : BAD; b += `<path d="M${xa} ${y - 9} Q${(xa + xb) / 2} ${y - 9 - h * 1.6} ${xb} ${y - 9}" fill="none" stroke="${col}" stroke-width="2.5"/><path d="M${xb} ${y - 8} l${t >= f ? -9 : 9} -3 l${t >= f ? 4 : -4} -8 z" fill="${col}"/>` + (txt ? T((xa + xb) / 2, y - 14 - h * 0.86, txt, { s: 14, f: col }) : ''); });
  (o.pts || []).forEach(([v, txt, col]) => { b += `<circle cx="${X(v)}" cy="${y}" r="6.5" fill="${col || GOLD}" stroke="currentColor" stroke-width="1.5"/>` + (txt ? T(X(v), y - 13, txt, { s: 12 }) : ''); });
  return svg(W, H, b, o.label || `number line from ${min} to ${max}`);
}

// ---------- fractions ----------
function fbarBody(n, d, y, W, col, lab) {
  const x0 = 6, w = W - 70, cw = w / d; let b = '';
  for (let i = 0; i < d; i++) b += `<rect x="${x0 + i * cw}" y="${y}" width="${cw}" height="34" fill="${i < n ? (col || GOLD) : 'transparent'}" stroke="currentColor" stroke-width="1.5"/>`;
  return b + `<g transform="translate(${W - 34} ${y + 17})">` + T(0, -3, lab ? lab[0] : n, { s: 15 }) + L(-11, 2, 11, 2, { w: 1.5 }) + T(0, 17, lab ? lab[1] : d, { s: 15 }) + `</g>`;
}
// V.fbar(3, 4) one fraction bar.  V.fbars([[1,2],[2,4]]) stacked bars of the same width (compare / equal fractions)
const fbar = (n, d, o = {}) => svg(340, 46, fbarBody(n, d, 6, 340, o.color), `${n} out of ${d} equal parts shaded`);
const fbars = (list) => svg(340, list.length * 46 + 2, list.map(([n, d, col], i) => fbarBody(n, d, 6 + i * 46, 340, col)).join(''), 'fraction bars: ' + list.map(([n, d]) => `${n}/${d}`).join(', '));
function pie(n, d) {
  const R = 52, cx = 60, cy = 60; let b = '';
  for (let i = 0; i < d; i++) { const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d; b += `<path d="M${cx} ${cy} L${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} Z" fill="${i < n ? GOLD : 'transparent'}" stroke="currentColor" stroke-width="1.5"/>`; }
  if (d === 1) b = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${n ? GOLD : 'transparent'}" stroke="currentColor" stroke-width="1.5"/>`;
  return svg(120, 120, b, `circle with ${n} of ${d} equal slices shaded`);
}

// ---------- counting pictures ----------
// V.dots(3, 4) → 3 rows of 4 dots (multiplication).  V.groups(12, 4) → 12 dots circled in groups of 4 (division)
function dots(r, c, o = {}) {
  const g = 24, W = c * g + 12, H = r * g + 12; let b = '';
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) b += `<circle cx="${12 + j * g + 6}" cy="${12 + i * g + 6}" r="8" fill="${o.color || GOLD}" stroke="currentColor" stroke-width="1"/>`;
  return svg(W + 6, H + 6, b, `${r} rows of ${c} dots`);
}
function groups(total, size) {
  const n = Math.ceil(total / size), g = 22, gw = size * g + 14, per = Math.max(1, Math.floor(330 / (gw + 8))), rows = Math.ceil(n / per); let b = '';
  for (let k = 0; k < n; k++) { const x = 4 + (k % per) * (gw + 8), y = 4 + Math.floor(k / per) * 40, cnt = Math.min(size, total - k * size); b += `<rect x="${x}" y="${y}" width="${gw}" height="32" rx="16" fill="none" stroke="${BLUE}" stroke-width="2"/>`; for (let j = 0; j < cnt; j++) b += `<circle cx="${x + 16 + j * g}" cy="${y + 16}" r="7" fill="${GOLD}" stroke="currentColor" stroke-width="1"/>`; }
  return svg(Math.min(340, per * (gw + 8) + 4), rows * 40 + 4, b, `${total} dots in groups of ${size}`);
}
// V.grid100(35) → 10×10 grid, 35 squares shaded.  V.pbar(25, { whole: 80 }) → percent bar with the part marked
function grid100(p) { let b = ''; for (let i = 0; i < 100; i++) b += `<rect x="${3 + (i % 10) * 15}" y="${3 + Math.floor(i / 10) * 15}" width="15" height="15" fill="${i < p ? GOLD : 'transparent'}" stroke="currentColor" stroke-width=".8"/>`; return svg(156, 156, b, `${p} of 100 squares shaded: ${p} percent`); }
function pbar(p, o = {}) {
  const W = 340, x0 = 10, w = W - 20, px = x0 + w * Math.min(p, 100) / 100;
  let b = `<rect x="${x0}" y="22" width="${w}" height="30" fill="transparent" stroke="currentColor" stroke-width="1.5"/><rect x="${x0}" y="22" width="${px - x0}" height="30" fill="${GOLD}" stroke="currentColor" stroke-width="1.5"/>`;
  b += T(x0, 15, '0%', { s: 12, a: 'start' }) + T(x0 + w, 15, '100%', { s: 12, a: 'end' }) + T(Math.max(40, Math.min(W - 40, px)), 15, p + '%', { s: 14 });
  if (o.whole != null) b += T(x0, 70, '0', { s: 12, a: 'start' }) + T(x0 + w, 70, fmt(o.whole), { s: 12, a: 'end' }) + T(Math.max(40, Math.min(W - 40, px)), 70, o.part != null ? String(o.part) : fmt(+(o.whole * p / 100).toFixed(2)), { s: 14 });
  return svg(W, o.whole != null ? 78 : 58, b, `${p} percent bar`);
}

// ---------- algebra ----------
// V.balance('2x + 3', '11') → a level scale: both sides are equal.  V.eq([['2x + 3 = 11'],['2x = 8','subtract 3 from both sides'],['x = 4','divide both sides by 2']])
function balance(l, r) {
  const b = L(170, 52, 170, 104, { w: 4 }) + `<path d="M140 108 h60 l-8 -8 h-44 z" fill="currentColor"/>` + L(50, 52, 290, 52, { w: 4 })
    + `<rect x="14" y="56" width="124" height="34" rx="8" fill="${SOFT}" stroke="currentColor" stroke-width="1.5"/><rect x="202" y="56" width="124" height="34" rx="8" fill="${SOFT}" stroke="currentColor" stroke-width="1.5"/>`
    + T(76, 79, l, { s: 17 }) + T(264, 79, r, { s: 17 }) + T(170, 38, '=', { s: 26 }) + T(170, 16, 'both sides weigh the same', { s: 12, w: 500 });
  return svg(340, 112, b, `balance scale: ${l} equals ${r}`);
}
const eq = (rows) => `<table class="eqs">${rows.map((r) => `<tr><td class="m">${r[0]}</td><td class="n">${r[1] || ''}</td></tr>`).join('')}</table>`;
const tbl = (rows, head) => `<table class="vt">${head ? `<tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>` : ''}${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;

// ---------- shapes (labels are text: pass '8 ft', '?', 'r = 5') ----------
const fit = (w, h, mw = 220, mh = 120) => { const k = Math.min(mw / w, mh / h); return [Math.max(46, w * k), Math.max(34, h * k)]; };
function rect(w, h, o = {}) { const [pw, ph] = fit(w, h), x = (340 - pw) / 2, y = 26; return svg(340, ph + 60, `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="${o.fill === false ? 'transparent' : SOFT}" stroke="currentColor" stroke-width="2"/>` + T(x + pw / 2, y - 8, o.top || (w + (o.unit ? ' ' + o.unit : ''))) + T(x + pw + 8, y + ph / 2 + 5, o.side || (h + (o.unit ? ' ' + o.unit : '')), { a: 'start' }) + (o.inside ? T(x + pw / 2, y + ph / 2 + 5, o.inside, { s: 14, w: 500 }) : ''), `rectangle ${w} by ${h}`); }
const square = (s, o = {}) => rect(s, s, o);
function tri(base, h, o = {}) { const [pw, ph] = fit(base, h, 200, 110), x = 70, y = 18, ax = x + pw * (o.apex == null ? 0.5 : o.apex); return svg(340, ph + 54, `<path d="M${x} ${y + ph} L${x + pw} ${y + ph} L${ax} ${y} Z" fill="${SOFT}" stroke="currentColor" stroke-width="2"/>` + L(ax, y, ax, y + ph, { d: 1, w: 1.5 }) + `<path d="M${ax} ${y + ph - 10} h10 v10" fill="none" stroke="currentColor" stroke-width="1.2"/>` + T(ax + 7, y + ph * 0.78, o.hLabel || ('height ' + h), { a: 'start', s: 12 }) + T(x + pw / 2, y + ph + 20, o.bLabel || ('base ' + base)), `triangle base ${base} height ${h}`); }
function rtri(a, b, c, o = {}) { const na = +a || 3, nb = +b || 4, [pw, ph] = fit(nb, na, 190, 110), x = 80, y = 18; return svg(340, ph + 54, `<path d="M${x} ${y} L${x} ${y + ph} L${x + pw} ${y + ph} Z" fill="${SOFT}" stroke="currentColor" stroke-width="2"/><path d="M${x} ${y + ph - 12} h12 v12" fill="none" stroke="currentColor" stroke-width="1.5"/>` + T(x - 8, y + ph / 2 + 5, String(a), { a: 'end' }) + T(x + pw / 2, y + ph + 20, String(b)) + T(x + pw / 2 + 14, y + ph / 2 - 6, String(c), { a: 'start', f: o.cColor || 'currentColor' }), `right triangle with legs ${a} and ${b} and hypotenuse ${c}`); }
function circle(o = {}) { const cx = 170, cy = 66, R = 54; let b = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${SOFT}" stroke="currentColor" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="3" fill="currentColor"/>`; if (o.d != null) b += L(cx - R, cy, cx + R, cy, { c: BAD, w: 2.5 }) + T(cx, cy - 8, typeof o.d === 'string' ? o.d : 'diameter ' + o.d, { s: 13 }); if (o.r != null) b += L(cx, cy, cx + R * 0.7, cy + R * 0.7, { c: OK, w: 2.5 }) + T(cx + R + 10, cy + R * 0.7 + 4, typeof o.r === 'string' ? o.r : 'radius ' + o.r, { s: 13, a: 'start' }); return svg(340, 132, b, 'circle' + (o.r != null ? ' radius ' + o.r : '') + (o.d != null ? ' diameter ' + o.d : '')); }
function box(l, w, h, o = {}) { const cube = l === w && w === h, x = cube ? 112 : 90, y = cube ? 34 : 40, pw = cube ? 84 : 130, ph = cube ? 84 : 70, dx = 36, dy = -24; return svg(340, 150, `<path d="M${x} ${y} h${pw} v${ph} h${-pw} z" fill="${SOFT}" stroke="currentColor" stroke-width="2"/><path d="M${x} ${y} l${dx} ${dy} h${pw} l${-dx} ${-dy} M${x + pw + dx} ${y + dy} v${ph} l${-dx} ${-dy}" fill="none" stroke="currentColor" stroke-width="2"/>` + T(x + pw / 2, y + ph + 20, o.l || ('length ' + l), { s: 13 }) + T(x + pw + dx + 6, y + ph / 2, o.h || ('height ' + h), { a: 'start', s: 13 }) + T(x + pw + dx / 2 + 6, y + ph + dy / 2 + 14, o.w || ('width ' + w), { a: 'start', s: 13 }), `box ${l} by ${w} by ${h}`); }
function cyl(r, h, o = {}) { const cx = 170, y = 26, rx = 56, ry = 15, ph = 84; return svg(340, 150, `<path d="M${cx - rx} ${y} v${ph} a${rx} ${ry} 0 0 0 ${2 * rx} 0 v${-ph}" fill="${SOFT}" stroke="currentColor" stroke-width="2"/><ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" fill="${SOFT}" stroke="currentColor" stroke-width="2"/>` + L(cx, y, cx + rx, y, { c: OK, w: 2.5 }) + T(cx + rx + 8, y + 4, o.r || ('r = ' + r), { s: 13, a: 'start' }) + T(cx + rx + 8, y + ph / 2 + 5, o.h || ('height ' + h), { a: 'start', s: 13 }), `cylinder radius ${r} height ${h}`); }
function trap(b1, b2, h) { const x = 70, y = 22, pw = 200, top = pw * Math.min(b1, b2) / Math.max(b1, b2), ph = 76, ox = (pw - top) / 2; return svg(340, 132, `<path d="M${x} ${y + ph} h${pw} l${-ox} ${-ph} h${-top} z" fill="${SOFT}" stroke="currentColor" stroke-width="2"/>` + L(x + ox + 12, y, x + ox + 12, y + ph, { d: 1, w: 1.5 }) + T(x + pw / 2, y - 6, String(Math.min(b1, b2))) + T(x + pw / 2, y + ph + 20, String(Math.max(b1, b2))) + T(x + ox + 20, y + ph / 2 + 5, 'height ' + h, { a: 'start', s: 13 }), `trapezoid with parallel sides ${b1} and ${b2}, height ${h}`); }
function para(b, h) { const x = 60, y = 22, pw = 190, ph = 76, sk = 34; return svg(340, 132, `<path d="M${x} ${y + ph} h${pw} l${sk} ${-ph} h${-pw} z" fill="${SOFT}" stroke="currentColor" stroke-width="2"/>` + L(x + sk, y, x + sk, y + ph, { d: 1, w: 1.5 }) + T(x + pw / 2, y + ph + 20, 'base ' + b) + T(x + sk + 8, y + ph / 2 + 5, 'height ' + h, { a: 'start', s: 13 }), `parallelogram base ${b} height ${h}`); }
// angles: V.ang(60) one angle; V.angsplit(90, 35) a right angle split in two (35° and ?); V.angsplit(180, 110) a straight line split
function arc(cx, cy, r, a0, a1) { const p = (a) => [cx + r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `<path d="M${x0} ${y0} A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 0 ${x1} ${y1}" fill="none" stroke="currentColor" stroke-width="1.5"/>`; }
function ang(deg, o = {}) { const cx = 110, cy = 112, R = 120, a = deg * Math.PI / 180; return svg(340, 130, L(cx, cy, cx + R, cy) + L(cx, cy, cx + R * Math.cos(a), cy - R * Math.sin(a)) + (deg === 90 ? `<path d="M${cx + 16} ${cy} v-16 h-16" fill="none" stroke="currentColor" stroke-width="1.5"/>` : arc(cx, cy, 30, 0, deg)) + T(cx + 48 * Math.cos(a / 2), cy - 48 * Math.sin(a / 2) + 5, o.label || deg + '°', { s: 14 }), `${deg} degree angle`); }
function angsplit(total, a, o = {}) { const cx = total === 180 ? 170 : 90, cy = 112, R = 112, t = a * Math.PI / 180, T2 = total * Math.PI / 180; return svg(340, 130, L(cx, cy, cx + R, cy) + L(cx, cy, cx + R * Math.cos(T2), cy - R * Math.sin(T2)) + L(cx, cy, cx + R * Math.cos(t), cy - R * Math.sin(t), { c: BAD }) + arc(cx, cy, 28, 0, a) + arc(cx, cy, 40, a, total) + T(cx + 54 * Math.cos(t / 2), cy - 54 * Math.sin(t / 2) + 5, a + '°', { s: 14 }) + T(cx + 62 * Math.cos((t + T2) / 2), cy - 62 * Math.sin((t + T2) / 2) + 5, o.other || '?', { s: 15, f: BAD }) + (total === 90 ? `<path d="M${cx + 12} ${cy} v-12 h-12" fill="none" stroke="currentColor" stroke-width="1.2"/>` : ''), `${total} degree angle split into ${a} degrees and an unknown angle`); }
function triang(A, B, C) { const p = [[60, 112], [280, 112], [130, 18]]; return svg(340, 132, `<path d="M${p.map((q) => q.join(' ')).join(' L')} Z" fill="${SOFT}" stroke="currentColor" stroke-width="2"/>` + T(92, 104, String(A), { s: 14 }) + T(238, 104, String(B), { s: 14 }) + T(136, 46, String(C), { s: 14 }), `triangle with angles ${A}, ${B} and ${C}`); }
// V.plane({ pts:[[1,2,'A'],[4,8,'B']], line:[2,0], rise:true, range:6 }) → coordinate grid
function plane(o = {}) {
  const Rg = o.range || 6, S = 250, m = 20, u = (S - 2 * m) / (2 * Rg), X = (x) => S / 2 + x * u, Y = (y) => S / 2 - y * u; let b = '';
  for (let i = -Rg; i <= Rg; i++) b += L(X(i), Y(-Rg), X(i), Y(Rg), { c: LINE, w: 1 }) + L(X(-Rg), Y(i), X(Rg), Y(i), { c: LINE, w: 1 });
  b += L(X(-Rg), Y(0), X(Rg), Y(0)) + L(X(0), Y(-Rg), X(0), Y(Rg)) + T(X(Rg) + 8, Y(0) + 5, 'x', { s: 13, i: 1 }) + T(X(0), Y(Rg) - 6, 'y', { s: 13, i: 1 });
  for (let i = -Rg; i <= Rg; i += Rg > 6 ? 2 : 1) if (i) b += T(X(i), Y(0) + 13, String(i), { s: 9, w: 400 }) + T(X(0) - 5, Y(i) + 3, String(i), { s: 9, w: 400, a: 'end' });
  if (o.line) { const [k, c] = o.line, xa = -Rg, xb = Rg; b += `<line x1="${X(xa)}" y1="${Y(k * xa + c)}" x2="${X(xb)}" y2="${Y(k * xb + c)}" stroke="${BLUE}" stroke-width="2.5" clip-path="inset(0)"/>`; }
  const P = o.pts || []; if (o.rise && P.length >= 2) { const [a, c] = P; b += L(X(a[0]), Y(a[1]), X(c[0]), Y(a[1]), { c: OK, d: 1 }) + L(X(c[0]), Y(a[1]), X(c[0]), Y(c[1]), { c: BAD, d: 1 }) + T((X(a[0]) + X(c[0])) / 2, Y(a[1]) + 14, 'run ' + fmt(c[0] - a[0]), { s: 11, f: OK }) + T(X(c[0]) + 5, (Y(a[1]) + Y(c[1])) / 2, 'rise ' + fmt(c[1] - a[1]), { s: 11, f: BAD, a: 'start' }); }
  P.forEach(([x, y, t]) => { b += `<circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="${GOLD}" stroke="currentColor" stroke-width="1.5"/>` + T(X(x) + 8, Y(y) - 7, t || `(${x}, ${y})`, { s: 11, a: 'start' }); });
  return `<svg class="viz" viewBox="0 0 ${S + 14} ${S}" style="max-width:${S + 14}px" role="img" aria-label="coordinate plane"><defs><clipPath id="pc"><rect x="${m}" y="${m}" width="${S - 2 * m}" height="${S - 2 * m}"/></clipPath></defs><g>${b.replace('clip-path="inset(0)"', 'clip-path="url(#pc)"')}</g></svg>`;
}

root.V = { stack, longdiv, pv, nl, fbar, fbars, pie, dots, groups, grid100, pbar, balance, eq, tbl, rect, square, tri, rtri, circle, box, cyl, trap, para, ang, angsplit, triang, plane, fr };
})(typeof window !== 'undefined' ? window : globalThis);
