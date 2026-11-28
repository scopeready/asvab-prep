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
// Long left-hand lines (word formulas such as "amps = volts ÷ total ohms") are set a little smaller so the table still fits a phone screen.
const eqLen = (h) => String(h).replace(/<span class="fr">.*?<\/span><\/span><\/span>/g, '00').replace(/<[^>]+>/g, '').length;
const eq = (rows) => { const n = Math.max(...rows.map((r) => eqLen(r[0]))); return `<table class="eqs${n > 24 ? ' l2' : n > 19 ? ' l1' : ''}">${rows.map((r) => `<tr><td class="m">${r[0]}</td><td class="n">${r[1] || ''}</td></tr>`).join('')}</table>`; };
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

// ---------- science & mechanics pictures (ASVAB Science & Tech) ----------
const box2 = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r == null ? 8 : o.r}" fill="${o.f || SOFT}" stroke="${o.c || 'currentColor'}" stroke-width="${o.w || 1.5}"/>`;
const arrow = (x1, y1, x2, y2, col = 'currentColor') => { const a = Math.atan2(y2 - y1, x2 - x1), p = (d, off) => `${(x2 - 9 * Math.cos(a) + off * Math.sin(a)).toFixed(1)} ${(y2 - 9 * Math.sin(a) - off * Math.cos(a)).toFixed(1)}`; return `<line x1="${x1}" y1="${y1}" x2="${(x2 - 6 * Math.cos(a)).toFixed(1)}" y2="${(y2 - 6 * Math.sin(a)).toFixed(1)}" stroke="${col}" stroke-width="2"/><path d="M${x2} ${y2} L${p(0, 5)} L${p(0, -5)} Z" fill="${col}"/>`; };
// V.chain(['Grass', 'Rabbit', 'Fox']) → boxes joined by arrows: a food chain, a power path, a list of steps in order. Long or many labels stack downward.
function chain(items, o = {}) {
  const n = items.length, across = !o.down && n <= 4 && items.every((s) => String(s).length <= (n <= 3 ? 11 : 8));
  if (across) { const W = 340, gap = 22, bw = (W - 8 - gap * (n - 1)) / n; let b = '';
    items.forEach((s, i) => { const x = 4 + i * (bw + gap); b += box2(x, 12, bw, 42) + T(x + bw / 2, 38, s, { s: 13 }); if (i < n - 1) b += arrow(x + bw + 2, 33, x + bw + gap - 2, 33, GOLD); });
    return svg(W, 66, b, o.label || items.join(', then ')); }
  const W = 300, bh = 32, gap = 16; let b = '';
  items.forEach((s, i) => { const y = 6 + i * (bh + gap); b += box2(20, y, W - 40, bh) + T(W / 2, y + 21, s, { s: 13 }); if (i < n - 1) b += arrow(W / 2, y + bh + 1, W / 2, y + bh + gap - 1, GOLD); });
  return svg(W, n * (bh + gap) - gap + 12, b, o.label || items.join(', then '));
}
// V.cycle(['Intake', 'Compression', 'Power', 'Exhaust']) → 3 to 6 steps around a circle, clockwise from the top
function cycle(items, o = {}) {
  const n = items.length, W = 340, H = 232, cx = W / 2, cy = H / 2, R = 78; let b = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${LINE}" stroke-width="2"/>`;
  const pos = (k) => { const a = -Math.PI / 2 + k * 2 * Math.PI / n; return [cx + R * Math.cos(a), cy + R * Math.sin(a), a]; };
  for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k + 0.5) * 2 * Math.PI / n, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); b += arrow(x - 8 * Math.cos(a + Math.PI / 2), y - 8 * Math.sin(a + Math.PI / 2), x + 5 * Math.cos(a + Math.PI / 2), y + 5 * Math.sin(a + Math.PI / 2), GOLD); }
  items.forEach((s, k) => { const [x, y] = pos(k), w = Math.max(64, String(s).length * 7.4 + 16), bx = Math.max(2, Math.min(W - w - 2, x - w / 2)); b += box2(bx, y - 15, w, 30, { f: 'var(--card)' }) + T(bx + w / 2, y + 5, s, { s: 12.5 }); });
  if (o.center) b += T(cx, cy + 5, o.center, { s: 12, w: 500 });
  return svg(W, H, b, o.label || 'cycle: ' + items.join(', then '));
}
// V.layers([['Crust', 'thin solid rock'], ['Mantle', 'hot, slow-flowing rock']]) → bands stacked top to bottom, each with a name and a short note
function layers(rows, o = {}) {
  const W = 320, bh = 36; let b = '';
  rows.forEach(([name, note], i) => { const y = 4 + i * bh; b += `<rect x="4" y="${y}" width="${W - 8}" height="${bh}" fill="${i % 2 ? 'var(--card)' : SOFT}" stroke="currentColor" stroke-width="1.5"/>` + T(14, y + 23, name, { a: 'start', s: 14, w: 700 }) + (note ? T(W - 14, y + 23, note, { a: 'end', s: 12, w: 500 }) : ''); });
  return svg(W, rows.length * bh + 8, b, o.label || rows.map((r) => r.join(': ')).join('; '));
}
// electrical symbols drawn between (x,y) and (x+len,y)
const SYM = {
  resistor: (x, y) => `<path d="M${x} ${y} h8 l4 -8 l8 16 l8 -16 l8 16 l8 -16 l4 8 h8" fill="none" stroke="currentColor" stroke-width="2"/>`,
  battery: (x, y) => L(x, y, x + 24, y) + L(x + 24, y - 13, x + 24, y + 13, { w: 2.5 }) + L(x + 32, y - 7, x + 32, y + 7, { w: 4 }) + L(x + 32, y, x + 56, y) + T(x + 18, y - 9, '+', { s: 13 }) + T(x + 39, y - 9, MINUS, { s: 13 }),
  switch: (x, y) => L(x, y, x + 16, y) + `<circle cx="${x + 18}" cy="${y}" r="3" fill="currentColor"/><circle cx="${x + 40}" cy="${y}" r="3" fill="currentColor"/>` + L(x + 18, y, x + 38, y - 13) + L(x + 42, y, x + 56, y),
  lamp: (x, y) => L(x, y, x + 16, y) + `<circle cx="${x + 28}" cy="${y}" r="12" fill="${SOFT}" stroke="currentColor" stroke-width="2"/>` + L(x + 20, y - 8, x + 36, y + 8, { w: 1.5 }) + L(x + 20, y + 8, x + 36, y - 8, { w: 1.5 }) + L(x + 40, y, x + 56, y),
  fuse: (x, y) => L(x, y, x + 12, y) + `<rect x="${x + 12}" y="${y - 7}" width="32" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>` + L(x + 12, y, x + 44, y, { w: 1.5 }) + L(x + 44, y, x + 56, y),
  capacitor: (x, y) => L(x, y, x + 24, y) + L(x + 24, y - 12, x + 24, y + 12, { w: 2.5 }) + L(x + 32, y - 12, x + 32, y + 12, { w: 2.5 }) + L(x + 32, y, x + 56, y),
  diode: (x, y) => L(x, y, x + 20, y) + `<path d="M${x + 20} ${y - 10} v20 l16 -10 z" fill="currentColor"/>` + L(x + 36, y - 10, x + 36, y + 10, { w: 2.5 }) + L(x + 36, y, x + 56, y),
  ground: (x, y) => L(x + 28, y - 12, x + 28, y) + L(x + 14, y, x + 42, y, { w: 2.5 }) + L(x + 19, y + 6, x + 37, y + 6, { w: 2.5 }) + L(x + 24, y + 12, x + 32, y + 12, { w: 2.5 }),
};
// V.sym('resistor') or V.sym(['battery', 'switch', 'lamp']) → schematic symbols with their names under them.
// Names: resistor, battery, switch (drawn open), lamp, fuse, capacitor, diode, ground.
function sym(names, o = {}) {
  names = [].concat(names); const cw = 84, W = Math.max(120, names.length * cw); let b = '';
  names.forEach((nm, i) => { const x = i * cw + (cw - 56) / 2 + (W - names.length * cw) / 2; b += (SYM[nm] || SYM.resistor)(x, 30) + T(x + 28, 66, nm, { s: 12.5 }); });
  return svg(W, 76, b, o.label || 'schematic symbol: ' + names.join(', '));
}
// V.circuit('series' | 'parallel', { v: 12, r: [4, 2], total: true }) → a battery and its resistors, with volts and ohms labeled.
// Values may be strings ('?'). total:true adds a line with the total resistance (numbers only).
function circuit(kind, o = {}) {
  const r = o.r || [4, 2], n = r.length, W = 340, par = kind === 'parallel', H = par ? 84 + n * 44 : 150, lx = 46, rx = 300, ty = 26; let b = '';
  const lab = (v, u) => (typeof v === 'number' ? fmt(v) + ' ' + u : String(v));
  const by = par ? ty + 22 + (n * 44) / 2 : 90;
  b += L(lx, ty, lx, by - 14) + L(lx - 13, by - 14, lx + 13, by - 14, { w: 2.5 }) + L(lx - 7, by - 4, lx + 7, by - 4, { w: 4 }) + T(lx - 20, by - 16, '+', { s: 13 }) + T(lx + 30, by - 1, lab(o.v == null ? 12 : o.v, 'V'), { a: 'start', s: 13, f: BAD });
  if (!par) { const bot = 124, seg = (rx - lx) / n; b += L(lx, by - 4, lx, bot) + L(lx, bot, rx, bot) + L(rx, bot, rx, ty);
    r.forEach((v, i) => { const x = lx + i * seg + (seg - 56) / 2; b += L(lx + i * seg, ty, x, ty) + SYM.resistor(x, ty) + L(x + 56, ty, lx + (i + 1) * seg, ty) + T(x + 28, ty + 28, lab(v, 'Ω'), { s: 13, f: OK }); });
    b += arrow(lx + 14, bot + 12, lx + 60, bot + 12, GOLD) + T(lx + 66, bot + 17, 'one path for the current', { a: 'start', s: 11.5, w: 500 });
  } else { const x1 = 130, x2 = rx, bot = ty + n * 44 + 14; b += L(lx, ty, x2, ty) + L(lx, by - 4, lx, bot) + L(lx, bot, x2, bot);
    r.forEach((v, i) => { const y = ty + 30 + i * 44; b += L(x1, y, x1 + 46, y) + SYM.resistor(x1 + 46, y) + L(x1 + 102, y, x2, y) + T(x1 + 24, y - 6, lab(v, 'Ω'), { s: 13, f: OK }); });
    b += L(x1, ty, x1, ty + 30 + (n - 1) * 44) + L(x2, ty, x2, bot) + T(W / 2 + 20, bot + 20, n + ' paths for the current', { s: 11.5, w: 500 }); }
  let cap = '';
  if (o.total && r.every((v) => typeof v === 'number')) { const tot = par ? 1 / r.reduce((a, v) => a + 1 / v, 0) : r.reduce((a, v) => a + v, 0); cap = `<div class="vcap">Total resistance: ${fmt(+tot.toFixed(2))} Ω</div>`; }
  return svg(W, H + (par ? 14 : 4), b, o.label || `${kind} circuit, ${lab(o.v == null ? 12 : o.v, 'volts')}, resistors ${r.join(' and ')} ohms`) + cap;
}
// V.lever({ cls: 1, load: 100, effort: '?', dl: 2, de: 4, unit: 'ft' }) → a lever with its fulcrum (▲), the load (weight) and the effort (your push), and both distances from the fulcrum.
// cls 1: fulcrum between load and effort. cls 2: load in the middle (wheelbarrow). cls 3: effort in the middle (tweezers).
function lever(o = {}) {
  const cls = o.cls || 1, W = 340, y = 78, x0 = 30, x1 = 310, dl = +o.dl || 2, de = +o.de || 4, u = o.unit || 'ft', num = (v, s) => (typeof v === 'number' ? fmt(v) + ' ' + s : String(v)); let xf, xl, xe;
  if (cls === 1) { xl = x0 + 14; xe = x1 - 14; xf = xl + (xe - xl) * dl / (dl + de); }
  else if (cls === 2) { xf = x0 + 14; xe = x1 - 14; xl = xf + (xe - xf) * dl / de; }
  else { xf = x0 + 14; xl = x1 - 14; xe = xf + (xl - xf) * de / dl; }
  const up = cls !== 1; // on class 2 and 3 levers the effort pushes up
  let b = `<rect x="${x0}" y="${y - 5}" width="${x1 - x0}" height="10" rx="3" fill="${SOFT}" stroke="currentColor" stroke-width="2"/><path d="M${xf} ${y + 5} l-14 24 h28 z" fill="${GOLD}" stroke="currentColor" stroke-width="1.5"/>` + T(xf, y + 44, 'fulcrum', { s: 11.5, w: 500 });
  b += `<rect x="${xl - 17}" y="${y - 39}" width="34" height="34" rx="4" fill="var(--card)" stroke="currentColor" stroke-width="2"/>` + T(xl, y - 17, 'load', { s: 11 }) + T(xl, y - 46, num(o.load == null ? 100 : o.load, 'lb'), { s: 13, f: BAD });
  b += up ? arrow(xe, y + 34, xe, y + 8, OK) + T(xe, y + 48, 'effort ' + num(o.effort == null ? '?' : o.effort, 'lb'), { s: 13, f: OK, a: xe > 250 ? 'end' : 'middle' })
    : arrow(xe, y - 40, xe, y - 8, OK) + T(xe, y - 46, 'effort ' + num(o.effort == null ? '?' : o.effort, 'lb'), { s: 13, f: OK, a: xe > 250 ? 'end' : 'middle' });
  const dim = (xa, xb, yy, txt) => L(xa, yy, xb, yy, { w: 1.5, d: 1 }) + L(xa, yy - 4, xa, yy + 4, { w: 1.5 }) + L(xb, yy - 4, xb, yy + 4, { w: 1.5 }) + T((xa + xb) / 2, yy + 15, txt, { s: 11.5, w: 500 });
  b += dim(Math.min(xf, xl), Math.max(xf, xl), y + 62, `load arm ${num(o.dl == null ? dl : o.dl, u)}`) + dim(Math.min(xf, xe), Math.max(xf, xe), y + 86, `effort arm ${num(o.de == null ? de : o.de, u)}`);
  return svg(W, 184, b, o.label || `class ${cls} lever: load ${o.load == null ? 100 : o.load} pounds at ${dl} ${u} from the fulcrum, effort at ${de} ${u}`);
}
// V.pulley(n, { load: 100 }) → n = how many rope sections hold up the load (1 = one fixed pulley, 2 = one movable pulley, 3 or 4 = block and tackle)
function pulley(n = 1, o = {}) {
  n = Math.max(1, Math.min(4, n)); const W = 340, cx = 150, top = 16, load = o.load == null ? 100 : o.load, num = (v) => (typeof v === 'number' ? fmt(v) + ' lb' : String(v)); let b = L(70, top, 250, top, { w: 4 });
  const wheel = (x, y) => `<circle cx="${x}" cy="${y}" r="15" fill="${SOFT}" stroke="currentColor" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3" fill="currentColor"/>`;
  const ly = n === 1 ? 120 : 138, pullX = n === 1 ? cx + 15 : (n % 2 ? cx + 52 : cx + 52);
  if (n === 1) { b += L(cx, top, cx, 38) + wheel(cx, 52) + L(cx - 15, 52, cx - 15, ly) + L(cx + 15, 52, cx + 15, 104) + arrow(cx + 15, 84, cx + 15, 112, OK); }
  else { const yb = 108; b += L(cx, top, cx, 34) + wheel(cx, 48) + wheel(cx, yb) + L(cx, yb + 15, cx, ly);
    const between = n % 2 ? n - 1 : n; // with an odd count, the strand you pull up on is one of the sections holding the load
    for (let k = 0; k < between; k++) { const x = cx - 15 + (between === 1 ? 0 : k * 30 / (between - 1)); b += L(x, 50, x, yb - 2, { c: BAD, w: 2 }); }
    if (n % 2) { b += L(cx + 15, yb, pullX, yb - 20, { c: BAD, w: 2 }) + arrow(pullX, yb - 20, pullX, yb - 58, OK); } else { b += L(cx + 15, 48, pullX, 70) + arrow(pullX, 70, pullX, 112, OK); } }
  b += `<rect x="${(n === 1 ? cx - 15 : cx) - 24}" y="${ly}" width="48" height="34" rx="4" fill="var(--card)" stroke="currentColor" stroke-width="2"/>` + T(n === 1 ? cx - 15 : cx, ly + 22, num(load), { s: 12.5, f: BAD });
  const eff = o.effort != null ? o.effort : (typeof load === 'number' ? +(load / n).toFixed(2) : '?');
  b += T(pullX + 12, n === 1 ? 100 : (n % 2 ? 72 : 96), 'pull ' + num(eff), { a: 'start', s: 13, f: OK }) + T(W / 2, ly + 56, `${n} rope section${n > 1 ? 's' : ''} hold${n > 1 ? '' : 's'} the load`, { s: 12, w: 500 });
  return svg(W, ly + 66, b, o.label || `pulley system with ${n} supporting rope section${n > 1 ? 's' : ''}, load ${load} pounds`);
}
// V.gears(12, 36, { rpm: 90 }) → two meshing gears with their tooth counts and arrows showing that they turn in opposite directions.
// { arrows: false } hides the arrows, for a question that asks which way a gear turns.
function gears(t1, t2, o = {}) {
  const W = 340, mx = Math.max(t1, t2), r1 = 22 + 38 * t1 / mx, r2 = 22 + 38 * t2 / mx, tot = r1 + r2, x1 = (W - 2 * tot) / 2 + r1, x2 = x1 + tot, cy = 78;
  const gear = (x, r, t, cw, name) => { const nt = Math.max(8, Math.min(22, Math.round(r / 3.4))); let teeth = ''; for (let k = 0; k < nt; k++) { const a = k * 2 * Math.PI / nt; teeth += `<line x1="${(x + (r - 4) * Math.cos(a)).toFixed(1)}" y1="${(cy + (r - 4) * Math.sin(a)).toFixed(1)}" x2="${(x + (r + 3) * Math.cos(a)).toFixed(1)}" y2="${(cy + (r + 3) * Math.sin(a)).toFixed(1)}" stroke="currentColor" stroke-width="3"/>`; }
    const ar = r * 0.55, s = cw ? 1 : 0, p = (a) => `${(x + ar * Math.cos(a)).toFixed(1)} ${(cy + ar * Math.sin(a)).toFixed(1)}`, a0 = cw ? -2.4 : -0.74, a1 = cw ? -0.74 : -2.4, tip = [x + ar * Math.cos(a1), cy + ar * Math.sin(a1)], tx = cw ? -Math.sin(a1) : Math.sin(a1), ty = cw ? Math.cos(a1) : -Math.cos(a1);
    return teeth + `<circle cx="${x}" cy="${cy}" r="${r - 3}" fill="${SOFT}" stroke="currentColor" stroke-width="2"/><circle cx="${x}" cy="${cy}" r="3.5" fill="currentColor"/>${o.arrows === false ? '' : `<path d="M${p(a0)} A${ar} ${ar} 0 0 ${s} ${p(a1)}" fill="none" stroke="${GOLD}" stroke-width="2.5"/><path d="M${(tip[0] + tx * 6).toFixed(1)} ${(tip[1] + ty * 6).toFixed(1)} L${(tip[0] - tx * 4 - ty * 6).toFixed(1)} ${(tip[1] - ty * 4 + tx * 6).toFixed(1)} L${(tip[0] - tx * 4 + ty * 6).toFixed(1)} ${(tip[1] - ty * 4 - tx * 6).toFixed(1)} Z" fill="${GOLD}"/>`}` + T(x, cy + r + 20, `${name}: ${t} teeth`, { s: 12.5 }); };
  let b = gear(x1, r1, t1, true, o.a || 'A') + gear(x2, r2, t2, false, o.b || 'B');
  if (o.rpm != null) b += T(x1, cy + r1 + 36, `${fmt(o.rpm)} rpm`, { s: 12, f: OK }) + T(x2, cy + r2 + 36, o.rpm2 === false ? '? rpm' : `${fmt(+(o.rpm * t1 / t2).toFixed(2))} rpm`, { s: 12, f: OK });
  return svg(W, cy + Math.max(r1, r2) + (o.rpm != null ? 44 : 28), b, o.label || `two meshing gears with ${t1} and ${t2} teeth`);
}
// V.incline(10, 2, { load: 200, unit: 'ft' }) → a ramp: its length along the slope and its height
function incline(len, h, o = {}) {
  const W = 340, u = o.unit || 'ft', x0 = 40, x1 = 300, yb = 120, ph = Math.max(34, Math.min(84, 220 * (+h || 2) / (+len || 10) * 1.6)), num = (v) => (typeof v === 'number' ? fmt(v) + ' ' + u : String(v));
  const a = Math.atan2(ph, x1 - x0), mx = x0 + (x1 - x0) * 0.68, my = yb - ph * 0.68;
  let b = `<path d="M${x0} ${yb} L${x1} ${yb} L${x1} ${yb - ph} Z" fill="${SOFT}" stroke="currentColor" stroke-width="2"/>` + T(x0 + 84, yb - ph * 0.32 - 30, 'ramp length ' + num(len), { s: 12.5 }) + T(x1 + 6, yb - ph / 2 + 4, num(h), { a: 'start', s: 12.5, f: BAD }) + T(x1 + 6, yb - ph / 2 + 18, 'high', { a: 'start', s: 11, w: 500 });
  b += `<g transform="translate(${mx} ${my}) rotate(${(-a * 180 / Math.PI).toFixed(1)})"><rect x="-17" y="-25" width="34" height="24" rx="3" fill="var(--card)" stroke="currentColor" stroke-width="2"/></g>`;
  if (o.load != null) b += T(W / 2, yb + 22, `load ${typeof o.load === 'number' ? fmt(o.load) + ' lb' : o.load}`, { s: 12.5, f: BAD });
  return svg(W, yb + 30, b, o.label || `ramp ${len} ${u} long and ${h} ${u} high`);
}

root.V = { stack, longdiv, pv, nl, fbar, fbars, pie, dots, groups, grid100, pbar, balance, eq, tbl, rect, square, tri, rtri, circle, box, cyl, trap, para, ang, angsplit, triang, plane, fr, chain, cycle, layers, sym, circuit, lever, pulley, gears, incline };
})(typeof window !== 'undefined' ? window : globalThis);
