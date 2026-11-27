/* ASVAB Math — curriculum and question generators.
   Every question is generated fresh, with 4 answer choices (like the ASVAB) and a
   step-by-step solution. Each generator takes a difficulty tier d = 1, 2 or 3. */
(function (root) {
'use strict';

// ---------- helpers ----------
const MINUS = '−';
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
const lcm = (a, b) => a / gcd(a, b) * b;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const nz = (a, b) => { let x; do { x = rnd(a, b); } while (x === 0); return x; };

function num(n) {
  if (Object.is(n, -0)) n = 0;
  const neg = n < 0; const s = Math.abs(n);
  const str = Number.isInteger(s) ? String(s) : String(+s.toFixed(6));
  let [i, f] = str.split('.');
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? MINUS : '') + i + (f ? '.' + f : '');
}
const sn = (n) => (n < 0 ? `(${num(n)})` : num(n)); // negative numbers in parentheses
function red(n, d) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; }
function fr(n, d) { // stacked fraction, not reduced; n or d may be text such as "?"
  const isN = typeof n === 'number', isD = typeof d === 'number';
  const neg = isN && isD && (n < 0) !== (d < 0);
  const top = isN ? (isD ? Math.abs(n) : num(n)) : n, bot = isD ? (isN ? Math.abs(d) : num(d)) : d;
  return (neg ? MINUS : '') + `<span class="fr"><span class="fn">${top}</span><span class="fd">${bot}</span></span>`;
}
function fv(n, d) { // reduced; improper fractions shown as mixed numbers
  [n, d] = red(n, d);
  if (d === 1) return num(n);
  const neg = n < 0, a = Math.abs(n);
  if (a > d) return (neg ? MINUS : '') + Math.floor(a / d) + ' ' + fr(a % d, d);
  return fr(n, d);
}
function fimp(n, d) { [n, d] = red(n, d); return d === 1 ? num(n) : fr(n, d); } // reduced, improper allowed
const pw = (b, e) => `${b}<sup>${typeof e === 'number' ? num(e) : e}</sup>`;
function money(c) { const neg = c < 0; c = Math.abs(Math.round(c)); return (neg ? MINUS : '') + '$' + num(Math.floor(c / 100)) + '.' + String(c % 100).padStart(2, '0'); }
function poly(cs, v = 'x') { // coefficients, highest degree first
  const deg = cs.length - 1; let out = '';
  cs.forEach((c, i) => {
    const p = deg - i; if (c === 0) return;
    const vp = p === 0 ? '' : (p === 1 ? v : `${v}<sup>${p}</sup>`);
    const t = (Math.abs(c) === 1 && p > 0) ? vp : num(Math.abs(c)) + vp;
    out += out === '' ? (c < 0 ? MINUS : '') + t : (c < 0 ? ` ${MINUS} ` : ' + ') + t;
  });
  return out || '0';
}
const term = (c, v) => poly([c, 0], v).replace(/ \+ 0$/, '') // c·v
const fac = (p) => (p < 0 ? `(x ${MINUS} ${-p})` : `(x + ${p})`); // (x + p)
function factors(n) { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; }
const isPrime = (n) => n > 1 && factors(n).length === 2;
function primeFactors(n) { const f = []; let d = 2; while (n > 1) { while (n % d === 0) { f.push(d); n /= d; } d++; } return f; }
function decStr(v, places) { return num(+(v).toFixed(places)); }
const b = (s) => `<b>${s}</b>`;
const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands'];

function choicesFrom(correct, wrongs, more) {
  const set = [correct];
  for (const w of wrongs) { if (set.length >= 4) break; if (w != null && w !== '' && !set.includes(w)) set.push(w); }
  let guard = 0;
  while (set.length < 4 && guard++ < 400) { const w = more(); if (w != null && w !== '' && !set.includes(w)) set.push(w); }
  const ch = shuffle(set);
  return { choices: ch, answer: ch.indexOf(correct) };
}
function Q(q, correct, wrongs, more, steps) { const c = choicesFrom(correct, wrongs, more); return { q, choices: c.choices, answer: c.answer, steps }; }
// numeric question: wrong values are numbers; min filters impossible values
function NQ(q, x, wrongs, steps, opts = {}) {
  const fmt = opts.fmt || num, min = opts.min ?? -Infinity, spread = opts.spread || Math.max(1, Math.round(Math.abs(x) / 10));
  const intOnly = Number.isInteger(x) && opts.intOnly !== false; // whole-number answers get whole-number wrong answers
  const ok = (v) => v !== x && v >= min && Number.isFinite(v) && (!intOnly || Number.isInteger(v));
  return Q(q, fmt(x), wrongs.filter(ok).map(fmt), () => { const v = x + pick([-3, -2, -1, 1, 2, 3]) * spread; return ok(v) ? fmt(v) : null; }, steps);
}

// ---------- UNIT 1: Number basics ----------
function genAdd(d) {
  const dig = d + 1;
  const lo = 10 ** (dig - 1), hi = 10 ** dig - 1;
  const a = rnd(lo, hi), c = rnd(lo, hi), s = a + c;
  const A = String(a).split('').reverse().map(Number), B = String(c).split('').reverse().map(Number);
  const steps = ['Line the numbers up so each place value (ones, tens, hundreds…) is in the same column. Start on the right.'];
  let carry = 0, noCarry = 0;
  for (let i = 0; i < dig; i++) {
    const t = A[i] + B[i] + carry; noCarry += ((A[i] + B[i]) % 10) * 10 ** i;
    let txt = `${cap(PLACES[i])}: ${A[i]} + ${B[i]}${carry ? ' + 1 (carried)' : ''} = ${t}.`;
    if (t >= 10 && i < dig - 1) { txt += ` Write ${t % 10} and carry 1 to the ${PLACES[i + 1]}.`; carry = 1; }
    else { txt += ` Write ${t}.`; carry = 0; }
    steps.push(txt);
  }
  steps.push(`Answer: ${num(a)} + ${num(c)} = ${b(num(s))}`);
  return NQ(`What is ${num(a)} + ${num(c)}?`, s, [noCarry, s + 10, s - 10, s + 1, s + 100], steps, { min: 0 });
}

function genSub(d) {
  const dig = d + 1;
  let a, c, tries = 0;
  do { a = rnd(2 * 10 ** (dig - 1), 10 ** dig - 1); c = rnd(10 ** (dig - 1), a - 1); tries++; }
  while (tries < 50 && !String(c).padStart(dig, '0').split('').some((x, i) => +x > +String(a)[i]));
  const A = String(a).split('').reverse().map(Number), B = String(c).padStart(dig, '0').split('').reverse().map(Number);
  const steps = ['Line the numbers up by place value, bigger number on top. Start with the ones column.'];
  let noBorrow = 0;
  for (let i = 0; i < dig; i++) {
    noBorrow += Math.abs(+String(a).split('').reverse()[i] - B[i]) * 10 ** i;
    let top = A[i]; const y = B[i];
    if (top < y) {
      A[i + 1] -= 1;
      const txt = top < 0
        ? `${cap(PLACES[i])}: this 0 already lent 1, so borrow from the ${PLACES[i + 1]} too. It becomes 9. 9 ${MINUS} ${y} = ${9 - y}.`
        : `${cap(PLACES[i])}: ${top} is smaller than ${y}, so borrow 1 from the ${PLACES[i + 1]} (that digit goes down by 1). ${top} becomes ${top + 10}. ${top + 10} ${MINUS} ${y} = ${top + 10 - y}.`;
      steps.push(txt);
    } else steps.push(`${cap(PLACES[i])}: ${top} ${MINUS} ${y} = ${top - y}.`);
  }
  const r = a - c;
  steps.push(`Answer: ${num(a)} ${MINUS} ${num(c)} = ${b(num(r))}. Check: ${num(r)} + ${num(c)} = ${num(a)} ✓`);
  return NQ(`What is ${num(a)} ${MINUS} ${num(c)}?`, r, [noBorrow, r + 10, r - 10, r + 100], steps, { min: 0 });
}

function genMul(d) {
  if (d === 1) {
    const a = rnd(2, 12), c = rnd(2, 12), p = a * c;
    const steps = [`${a} × ${c} means ${a} groups of ${c}.`,
      a <= 5 ? `Add ${c} ${a} times: ${Array(a).fill(c).join(' + ')} = ${p}.` : `Use the times table: ${a} × ${c} = ${p}. (Tip: ${a} × ${c} = ${c} × ${a}, so use whichever fact you know.)`,
      `Answer: ${b(num(p))}`];
    return NQ(`What is ${a} × ${c}?`, p, [p + a, p - c, a + c, p + c], steps, { min: 1 });
  }
  const a = rnd(12, 99);
  const c = d === 2 ? rnd(3, 9) : rnd(12, 49);
  const p = a * c;
  if (d === 2) {
    const t = Math.floor(a / 10) * 10, o = a % 10;
    const steps = [`Break ${a} into tens and ones: ${a} = ${t} + ${o}.`, `Multiply each part by ${c}: ${t} × ${c} = ${num(t * c)} and ${o} × ${c} = ${o * c}.`, `Add the parts: ${num(t * c)} + ${o * c} = ${num(p)}.`, `Answer: ${b(num(p))}`];
    return NQ(`What is ${a} × ${c}?`, p, [p + c, p - 10, t * c + o, p + 10 * c], steps, { min: 1 });
  }
  const t = Math.floor(c / 10) * 10, o = c % 10;
  const steps = [`Break ${c} into tens and ones: ${c} = ${t} + ${o}.`, `${a} × ${t} = ${num(a * t)}.`, `${a} × ${o} = ${num(a * o)}.`, `Add: ${num(a * t)} + ${num(a * o)} = ${num(p)}.`, `Answer: ${b(num(p))}`];
  return NQ(`What is ${a} × ${c}?`, p, [a * (t / 10) + a * o, p + a, p - a, p + 100], steps, { min: 1 });
}

function genDiv(d) {
  const dv = d === 1 ? rnd(2, 12) : d === 2 ? rnd(3, 9) : rnd(11, 25);
  const q = d === 1 ? rnd(2, 12) : d === 2 ? rnd(12, 99) : rnd(12, 45);
  const N = dv * q;
  let steps;
  if (d === 1) steps = [`Ask: what number times ${dv} makes ${N}?`, `${dv} × ${q} = ${N}.`, `Answer: ${N} ÷ ${dv} = ${b(q)}`];
  else {
    const qt = Math.floor(q / 10) * 10, qo = q % 10, rem = N - dv * qt;
    steps = [`Take out big "chunks" of ${dv}. ${dv} × ${qt} = ${num(dv * qt)}.`, `${num(N)} ${MINUS} ${num(dv * qt)} = ${rem} left over.`,
      qo ? `${dv} × ${qo} = ${rem}, so ${qo} more ${dv}s fit.` : 'Nothing is left over.',
      `Add the chunks: ${qt}${qo ? ' + ' + qo : ''} = ${q}.`, `Answer: ${num(N)} ÷ ${dv} = ${b(q)}. Check: ${q} × ${dv} = ${num(N)} ✓`];
  }
  return NQ(`What is ${num(N)} ÷ ${dv}?`, q, [q + 1, q - 1, q + 10, q - 10, q + 2], steps, { min: 1 });
}

function genOrder(d) {
  const t = d === 1 ? pick([1, 2]) : d === 2 ? pick([3, 4]) : pick([5, 6]);
  let q, x, ltr, steps;
  if (t === 1) { const a = rnd(2, 20), c = rnd(2, 9), e = rnd(2, 9); x = a + c * e; ltr = (a + c) * e;
    q = `${a} + ${c} × ${e}`; steps = ['Order of operations: Parentheses, Exponents, Multiply/Divide (left to right), Add/Subtract (left to right).', `Multiply first: ${c} × ${e} = ${c * e}.`, `Then add: ${a} + ${c * e} = ${x}.`]; }
  else if (t === 2) { const a = rnd(2, 12), c = rnd(2, 12), e = rnd(2, 9); x = (a + c) * e; ltr = a + c * e;
    q = `(${a} + ${c}) × ${e}`; steps = ['Parentheses come first.', `${a} + ${c} = ${a + c}.`, `Then multiply: ${a + c} × ${e} = ${x}.`]; }
  else if (t === 3) { const a = rnd(3, 12), c = rnd(3, 9), e = rnd(2, 6), f = e * rnd(2, 9); x = a * c - f / e; ltr = (a * c - f) / e;
    q = `${a} × ${c} ${MINUS} ${f} ÷ ${e}`; steps = ['Do multiplication and division before subtraction.', `${a} × ${c} = ${a * c}.`, `${f} ÷ ${e} = ${f / e}.`, `${a * c} ${MINUS} ${f / e} = ${x}.`]; }
  else if (t === 4) { const a = rnd(2, 20), c = rnd(2, 9), e = rnd(1, c * c - 1); x = a + c * c - e; ltr = (a + c) ** 2 - e;
    q = `${a} + ${pw(c, 2)} ${MINUS} ${e}`; steps = ['Exponents come before adding and subtracting.', `${pw(c, 2)} = ${c} × ${c} = ${c * c}.`, `Now go left to right: ${a} + ${c * c} = ${a + c * c}.`, `${a + c * c} ${MINUS} ${e} = ${x}.`]; }
  else if (t === 5) { const c = rnd(2, 6), s = c * rnd(2, 8), a = rnd(1, s - 1), e = rnd(2, 6), f = rnd(2, 9); const s2 = s - a; x = s / c + e * f; ltr = ((a + s2) / c + e) * f;
    q = `(${a} + ${s2}) ÷ ${c} + ${e} × ${f}`; steps = ['Parentheses first.', `${a} + ${s2} = ${s}.`, `Then divide and multiply: ${s} ÷ ${c} = ${s / c} and ${e} × ${f} = ${e * f}.`, `Add: ${s / c} + ${e * f} = ${x}.`]; }
  else { const a = rnd(6, 12), c = rnd(2, 5), e = rnd(1, 4), f = rnd(1, 4); x = a * a - c * (e + f); ltr = (a * a - c) * (e + f);
    q = `${pw(a, 2)} ${MINUS} ${c} × (${e} + ${f})`; steps = ['Parentheses first: ' + `${e} + ${f} = ${e + f}.`, `Exponent: ${pw(a, 2)} = ${a * a}.`, `Multiply: ${c} × ${e + f} = ${c * (e + f)}.`, `Subtract: ${a * a} ${MINUS} ${c * (e + f)} = ${x}.`]; }
  steps.push(`Answer: ${b(num(x))}. (Working straight left to right would give ${num(ltr)} — a common trap.)`);
  return NQ(`What is ${q}?`, x, [ltr, x + 1, x - 2], steps);
}

function genNeg(d) {
  const op = d === 1 ? pick(['+', '+', '-']) : d === 2 ? pick(['+', '-', '×']) : pick(['-', '×', '÷', '+']);
  let a = nz(-15, 15), c = nz(-15, 15); if (d === 1) { if (a > 0 && c > 0) a = -a; }
  let x, steps;
  if (op === '+') {
    x = a + c;
    steps = (a < 0) === (c < 0)
      ? [`Both numbers have the same sign, so add their sizes: ${Math.abs(a)} + ${Math.abs(c)} = ${Math.abs(x)}.`, `Keep the shared sign (${a < 0 ? 'negative' : 'positive'}).`]
      : [`The signs are different, so subtract the smaller size from the bigger: ${Math.max(Math.abs(a), Math.abs(c))} ${MINUS} ${Math.min(Math.abs(a), Math.abs(c))} = ${Math.abs(x)}.`, `Keep the sign of the number with the bigger size (${Math.abs(a) >= Math.abs(c) ? num(a) : num(c)}).`];
    steps.unshift(`Think of a number line: start at ${num(a)} and move ${c < 0 ? 'left' : 'right'} ${Math.abs(c)}.`);
  } else if (op === '-') {
    if (d >= 2 && Math.random() < 0.6) c = -Math.abs(c);
    x = a - c;
    steps = [`Subtracting is the same as adding the opposite: ${num(a)} ${MINUS} ${sn(c)} = ${num(a)} + ${sn(-c)}.`, `Now add: ${num(a)} + ${sn(-c)} = ${num(x)}.`];
  } else if (op === '×') {
    x = a * c;
    steps = [`Multiply the sizes: ${Math.abs(a)} × ${Math.abs(c)} = ${Math.abs(x)}.`, `Same signs give a positive answer; different signs give a negative answer. Here the signs are ${(a < 0) === (c < 0) ? 'the same, so the answer is positive' : 'different, so the answer is negative'}.`];
  } else {
    c = nz(-9, 9); const qv = nz(-9, 9); a = c * qv; x = qv;
    steps = [`Divide the sizes: ${Math.abs(a)} ÷ ${Math.abs(c)} = ${Math.abs(x)}.`, `Same signs give a positive answer; different signs give a negative answer. Here the signs are ${(a < 0) === (c < 0) ? 'the same, so the answer is positive' : 'different, so the answer is negative'}.`];
  }
  const sym = op === '-' ? MINUS : op;
  steps.push(`Answer: ${b(num(x))}`);
  return NQ(`What is ${num(a)} ${sym} ${sn(c)}?`, x, [-x, Math.abs(x) === x ? x + 2 : -Math.abs(x) - 2, op === '+' || op === '-' ? Math.abs(a) + Math.abs(c) : x + 1, x - 1], steps);
}

// ---------- UNIT 2: Fractions, decimals, percents ----------
function genFactors(d) {
  const t = d === 1 ? pick(['gcf', 'prime']) : pick(['gcf', 'lcm', 'prime']);
  if (t === 'gcf') {
    let g = rnd(2, d === 1 ? 6 : 12), m, n; do { m = rnd(2, 9); n = rnd(2, 9); } while (m === n || gcd(m, n) !== 1);
    const a = g * m, c = g * n, fa = factors(a), fc = factors(c), common = fa.filter((x) => fc.includes(x));
    const steps = [`List the factors of ${a}: ${fa.join(', ')}.`, `List the factors of ${c}: ${fc.join(', ')}.`, `Factors they share: ${common.join(', ')}.`, `The greatest one is ${b(g)}.`];
    return NQ(`What is the greatest common factor (GCF) of ${a} and ${c}?`, g, [common.length > 2 ? common[common.length - 2] : null, Math.min(a, c), g * 2, Math.abs(a - c) !== g ? Math.abs(a - c) : null], steps, { min: 1 });
  }
  if (t === 'lcm') {
    const pairs = [[4, 6], [6, 8], [9, 12], [10, 15], [8, 12], [12, 18], [6, 10], [14, 21], [15, 20], [6, 9], [8, 10], [12, 16], [4, 10], [6, 15]];
    const [a, c] = pick(pairs), L = lcm(a, c), big = Math.max(a, c), small = Math.min(a, c);
    const mults = []; for (let k = big; k <= L; k += big) mults.push(k);
    const steps = [`List multiples of the bigger number, ${big}: ${mults.join(', ')}.`, `Stop at the first one that ${small} also divides into evenly: ${L} ÷ ${small} = ${L / small}.`, `The least common multiple is ${b(L)}.`];
    return NQ(`What is the least common multiple (LCM) of ${a} and ${c}?`, L, [a * c, gcd(a, c), L + big, L * 2], steps, { min: 1 });
  }
  const primes = d === 1 ? [2, 3, 5, 7, 11, 13, 17, 19, 23, 29] : [31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  const comps = d === 1 ? [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 25, 27] : [33, 39, 49, 51, 57, 63, 69, 77, 87, 91, 93, 95, 81, 85];
  const p = pick(primes), others = shuffle(comps).slice(0, 3);
  const steps = ['A prime number has exactly two factors: 1 and itself.', ...others.map((c) => `${c} = ${primeFactors(c).join(' × ')}, so it is not prime.`), `${p} can only be divided evenly by 1 and ${p}, so ${b(p)} is prime.`];
  return Q('Which of these numbers is prime?', String(p), others.map(String), () => null, steps);
}

function genSimplify(d) {
  let a, c; do { c = rnd(2, d === 1 ? 10 : 15); a = rnd(1, c - 1); } while (gcd(a, c) !== 1);
  const k = rnd(2, d === 1 ? 5 : d === 2 ? 9 : 12);
  if (d >= 2 && Math.random() < 0.4) { // missing value in an equivalent fraction
    const steps = [`The denominator went from ${c} to ${c * k}. ${c} × ${k} = ${c * k}.`, `Do the same to the top: ${a} × ${k} = ${a * k}.`, `So ${fr(a, c)} = ${fr(a * k, c * k)}. The missing number is ${b(a * k)}.`];
    return NQ(`${fr(a, c)} = ${fr('?', c * k)}. What number goes in place of the "?"`, a * k, [a + k, a * k + 1, c * k - a, a * (k + 1)], steps, { min: 1 });
  }
  const n = a * k, m = c * k;
  const pf = factors(k).filter((x) => x > 1 && x < k);
  const partial = pf.length ? fr(n / pf[0], m / pf[0]) : null;
  const steps = [`Find the greatest common factor of ${n} and ${m}. It is ${k}.`, `Divide the top and bottom by ${k}: ${n} ÷ ${k} = ${a}, ${m} ÷ ${k} = ${c}.`, `${fr(n, m)} = ${b(fr(a, c))}`];
  return Q(`Write ${fr(n, m)} in simplest form.`, fr(a, c), [partial, fr(c, a), fr(a + 1, c), fr(a, c + 1)], () => fr(rnd(1, 9), rnd(2, 12)), steps);
}

function fracWrongs(n, d, extra) { return extra.filter(Boolean).map(([x, y]) => (y ? fv(x, y) : null)); }
function genFracAdd(d) {
  let b1, b2;
  if (d === 1) { b1 = b2 = rnd(3, 12); }
  else if (d === 2) { b1 = rnd(2, 6); b2 = b1 * rnd(2, 3); }
  else { do { b1 = rnd(2, 9); b2 = rnd(2, 9); } while (b1 === b2 || b1 % b2 === 0 || b2 % b1 === 0); }
  const a1 = rnd(1, b1 - 1), a2 = rnd(1, b2 - 1);
  let sub = Math.random() < 0.45 && a1 / b1 !== a2 / b2;
  let [n1, d1, n2, d2] = [a1, b1, a2, b2];
  if (sub && n1 / d1 < n2 / d2) [n1, d1, n2, d2] = [n2, d2, n1, d1];
  const L = lcm(d1, d2), m1 = L / d1, m2 = L / d2;
  const top = sub ? n1 * m1 - n2 * m2 : n1 * m1 + n2 * m2;
  const op = sub ? MINUS : '+';
  const steps = [];
  if (d1 === d2) steps.push(`The denominators are already the same (${d1}), so just ${sub ? 'subtract' : 'add'} the tops.`);
  else steps.push(`Find a common denominator: the least common multiple of ${d1} and ${d2} is ${L}.`,
    `Rewrite each fraction: ${fr(n1, d1)} = ${fr(n1 * m1, L)}${m1 > 1 ? ` (× ${m1} top and bottom)` : ''} and ${fr(n2, d2)} = ${fr(n2 * m2, L)}${m2 > 1 ? ` (× ${m2} top and bottom)` : ''}.`);
  steps.push(`${sub ? 'Subtract' : 'Add'} the tops, keep the bottom: ${fr(n1 * m1, L)} ${op} ${fr(n2 * m2, L)} = ${fr(top, L)}.`);
  const [rn, rd] = red(top, L);
  if (rn !== top || Math.abs(rn) > rd) steps.push(`Simplify${Math.abs(rn) > rd ? ' and write as a mixed number' : ''}: ${fr(top, L)} = ${fv(top, L)}.`);
  steps.push(`Answer: ${b(fv(top, L))}`);
  const wrongTop = sub ? n1 - n2 : n1 + n2, wrongBot = sub ? Math.abs(d1 - d2) || d1 : d1 + d2;
  return Q(`What is ${fr(n1, d1)} ${op} ${fr(n2, d2)}?`, fv(top, L),
    fracWrongs(top, L, [[wrongTop, wrongBot], [top + 1, L], [top, L * 2], (sub || n1 * m1 !== n2 * m2) ? [sub ? n1 * m1 + n2 * m2 : Math.abs(n1 * m1 - n2 * m2), L] : null]),
    () => fv(rnd(1, 2 * L), L), steps);
}

function genFracMul(d) {
  const div = d >= 2 && Math.random() < 0.55;
  let n1, d1, n2, d2, mixed = false, w1 = 0, w2 = 0;
  d1 = rnd(2, 9); n1 = rnd(1, d1 - 1); d2 = rnd(2, 9); n2 = rnd(1, d2 - 1);
  const steps = [];
  let qText;
  if (d === 3 && Math.random() < 0.6) { // mixed numbers
    mixed = true; w1 = rnd(1, 3); w2 = rnd(1, 2);
    const i1 = w1 * d1 + n1, i2 = w2 * d2 + n2;
    qText = `${w1} ${fr(n1, d1)} ${div ? '÷' : '×'} ${w2} ${fr(n2, d2)}`;
    steps.push(`Change mixed numbers to improper fractions: ${w1} ${fr(n1, d1)} = ${fr(i1, d1)} and ${w2} ${fr(n2, d2)} = ${fr(i2, d2)}.`);
    n1 = i1; n2 = i2;
  } else qText = `${fr(n1, d1)} ${div ? '÷' : '×'} ${fr(n2, d2)}`;
  let tn, td, wrong;
  if (div) {
    steps.push(`To divide, keep the first fraction, change ÷ to ×, and flip the second: ${fr(n1, d1)} × ${fr(d2, n2)}.`);
    tn = n1 * d2; td = d1 * n2; wrong = [n1 * n2, d1 * d2];
    steps.push(`Multiply straight across: ${n1} × ${d2} = ${tn} on top, ${d1} × ${n2} = ${td} on the bottom → ${fr(tn, td)}.`);
  } else {
    tn = n1 * n2; td = d1 * d2; wrong = [n1 * d2, d1 * n2];
    steps.push(`Multiply straight across: ${n1} × ${n2} = ${tn} on top, ${d1} × ${d2} = ${td} on the bottom → ${fr(tn, td)}.`);
  }
  if (fv(tn, td) !== fr(tn, td)) steps.push(`Simplify: ${fr(tn, td)} = ${fv(tn, td)}.`);
  steps.push(`Answer: ${b(fv(tn, td))}`);
  return Q(`What is ${qText}?`, fv(tn, td), fracWrongs(0, 0, [wrong, [td, tn], [tn + 1, td], [n1 + n2, d1 + d2]]), () => fv(rnd(1, 30), rnd(2, 40)), steps);
}

function genDecimal(d) {
  const t = d === 1 ? pick(['add', 'sub', 'f2d']) : d === 2 ? pick(['add', 'sub', 'mul', 'f2d', 'd2f']) : pick(['mul', 'mul2', 'sub', 'd2f', 'div']);
  if (t === 'add' || t === 'sub') {
    const p1 = rnd(1, 2), p2 = rnd(1, 2), s = 100;
    let a = rnd(10, d === 1 ? 999 : 9999) * (p1 === 1 ? 10 : 1), c = rnd(10, d === 1 ? 999 : 9999) * (p2 === 1 ? 10 : 1); // in hundredths
    if (t === 'sub' && c > a) [a, c] = [c, a];
    const x = t === 'add' ? a + c : a - c;
    const A = decStr(a / s, 2), C = decStr(c / s, 2);
    const steps = ['Line up the decimal points (add zeros at the end if it helps).', `${(a / s).toFixed(2)} ${t === 'add' ? '+' : MINUS} ${(c / s).toFixed(2)}`, `${t === 'add' ? 'Add' : 'Subtract'} like whole numbers and keep the decimal point in the same place: ${b(decStr(x / s, 2))}`];
    return Q(`What is ${A} ${t === 'add' ? '+' : MINUS} ${C}?`, decStr(x / s, 2), [decStr(x / s / 10, 3), decStr((x + 10) / s, 2), decStr((x - 1) / s, 2), decStr(x / s * 10, 2)], () => decStr((x + pick([-20, 20, 100, -100, 2])) / s, 2), steps);
  }
  if (t === 'mul' || t === 'mul2') {
    const a = rnd(11, 99), c = t === 'mul' ? rnd(2, 9) : rnd(2, 9); // a/10 × c  or a/10 × c/10
    const pa = 1, pc = t === 'mul' ? 0 : 1, places = pa + pc;
    const prod = a * c, x = prod / 10 ** places;
    const A = decStr(a / 10, 1), C = t === 'mul' ? String(c) : decStr(c / 10, 1);
    const steps = [`Ignore the decimal points and multiply: ${a} × ${c} = ${prod}.`, `Count the digits after the decimal points in the problem: ${places}.`, `Put that many digits after the decimal point in the answer: ${b(decStr(x, places))}`];
    return Q(`What is ${A} × ${C}?`, decStr(x, places), [decStr(x * 10, places), decStr(x / 10, places + 1), decStr(x + 1, places)], () => decStr(x + pick([-2, 2, 0.5, -0.5]), places + 1), steps);
  }
  if (t === 'div') {
    const c = rnd(2, 9), qv = rnd(11, 99); const a = c * qv; // a/10 ÷ c = qv/10
    const steps = [`Divide as if there were no decimal: ${a} ÷ ${c} = ${qv}.`, `The decimal point goes straight up into the answer: ${decStr(a / 10, 1)} ÷ ${c} = ${b(decStr(qv / 10, 1))}.`];
    return Q(`What is ${decStr(a / 10, 1)} ÷ ${c}?`, decStr(qv / 10, 1), [decStr(qv, 0), decStr(qv / 100, 2), decStr((qv + 1) / 10, 1)], () => decStr((qv + pick([-3, 3, 10])) / 10, 1), steps);
  }
  const pairs = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 10], [3, 10], [7, 20], [9, 20], [3, 25], [1, 20], [11, 25]];
  const [n, m] = pick(pairs), val = n / m;
  if (t === 'f2d') {
    const mult = [10, 100, 1000].find((p) => p % m === 0);
    const steps = [`A fraction means top ÷ bottom: ${n} ÷ ${m}.`, mult ? `Make the bottom ${mult}: ${fr(n, m)} = ${fr(n * mult / m, mult)}.` : '', `${fr(n * mult / m, mult)} = ${b(decStr(val, 3))}`].filter(Boolean);
    return Q(`Write ${fr(n, m)} as a decimal.`, decStr(val, 3), [decStr(m / n, 3), `${n}.${m}`, decStr(val * 10, 3), decStr(val / 10, 4)], () => decStr(val + pick([0.1, -0.05, 0.05, 0.2]), 3), steps);
  }
  const places = String(val).split('.')[1].length, den = 10 ** places;
  const steps = [`Read the decimal: ${decStr(val, 3)} = ${fr(Math.round(val * den), den)} (${places === 1 ? 'tenths' : places === 2 ? 'hundredths' : 'thousandths'}).`, `Simplify: ${fr(Math.round(val * den), den)} = ${b(fr(n, m))}`];
  return Q(`Write ${decStr(val, 3)} as a fraction in simplest form.`, fr(n, m), [fr(m, n), fr(Math.round(val * den), den * 10), fr(n + 1, m)], () => fr(rnd(1, 9), rnd(2, 20)), steps);
}

function genPercent(d) {
  const t = d === 1 ? pick(['of', 'of', 'what']) : pick(['of', 'what', 'whole']);
  if (t === 'of') {
    const p = d === 1 ? pick([10, 20, 25, 50, 75]) : d === 2 ? pick([5, 15, 30, 40, 60, 12, 35]) : pick([8, 12.5, 15, 35, 45, 65, 120, 150]);
    const base = p === 12.5 ? 8 : 20; const N = base * rnd(2, d === 3 ? 30 : 15);
    const x = p * N / 100;
    const steps = [`"Percent" means "out of 100", so ${num(p)}% = ${decStr(p / 100, 3)}.`, `"Of" means multiply: ${decStr(p / 100, 3)} × ${num(N)} = ${num(x)}.`, `Answer: ${b(num(x))}`];
    if (p === 50 || p === 25 || p === 10) steps.splice(2, 0, `Shortcut: ${p}% is ${p === 50 ? 'half' : p === 25 ? 'one quarter' : 'one tenth'}, so ${num(N)} ÷ ${100 / p} = ${num(x)}.`);
    return NQ(`What is ${num(p)}% of ${num(N)}?`, x, [p * N / 10, N - x, x + p, N / p], steps, { min: 0 });
  }
  if (t === 'what') {
    const whole = pick([20, 25, 40, 50, 80, 200, 400, 60, 120]); let p; do { p = pick([5, 10, 15, 20, 25, 30, 40, 45, 60, 75, 80, 90]); } while ((whole * p) % 100);
    const part = whole * p / 100;
    const steps = [`Write it as a fraction: part ÷ whole = ${part} ÷ ${whole} = ${fr(part, whole)}.`, `Change to a percent by multiplying by 100: ${decStr(part / whole, 4)} × 100 = ${p}%.`, `Answer: ${b(p + '%')}`];
    return Q(`${num(part)} is what percent of ${num(whole)}?`, p + '%', [`${num(+(whole / part * 100).toFixed(1))}%`, `${100 - p}%`, `${num(part)}%`, `${p / 10}%`], () => `${p + pick([-10, 5, 10, 15])}%`, steps);
  }
  const p = pick([10, 20, 25, 40, 50, 75, 15, 30]); const whole = (100 / gcd(p, 100)) * rnd(2, 12); const part = whole * p / 100;
  const steps = [`Let the whole be W. Then ${p}% of W = ${num(part)}, so ${decStr(p / 100, 2)} × W = ${num(part)}.`, `Divide: W = ${num(part)} ÷ ${decStr(p / 100, 2)} = ${num(whole)}.`, `Check: ${p}% of ${num(whole)} = ${num(part)} ✓`, `Answer: ${b(num(whole))}`];
  return NQ(`${num(part)} is ${p}% of what number?`, whole, [part * p / 100, part + p, part * 2, whole / 2], steps, { min: 1 });
}

function genRatio(d) {
  const t = d === 1 ? pick(['simplify', 'share']) : pick(['share', 'prop', 'prop', 'scale']);
  if (t === 'simplify') {
    let a, c; do { a = rnd(1, 9); c = rnd(1, 9); } while (a === c || gcd(a, c) !== 1); const k = rnd(2, 8);
    const steps = [`Find the GCF of ${a * k} and ${c * k}: it is ${k}.`, `Divide both parts by ${k}: ${a * k} ÷ ${k} = ${a}, ${c * k} ÷ ${k} = ${c}.`, `Answer: ${b(`${a}:${c}`)}`];
    return Q(`A class has ${a * k} girls and ${c * k} boys. What is the ratio of girls to boys in simplest form?`, `${a}:${c}`, [`${c}:${a}`, `${a * k}:${c * k + 1}`, `${a}:${a + c}`], () => `${rnd(1, 9)}:${rnd(1, 9)}`, steps);
  }
  if (t === 'share') {
    let a, c; do { a = rnd(1, 7); c = rnd(1, 7); } while (a === c); const k = rnd(3, 15), T = (a + c) * k;
    const steps = [`The ratio ${a}:${c} means the total is split into ${a} + ${c} = ${a + c} equal parts.`, `One part = ${T} ÷ ${a + c} = ${k}.`, `The second group has ${c} parts: ${c} × ${k} = ${c * k}.`, `Answer: ${b(c * k)}`];
    return NQ(`The ratio of cats to dogs at a shelter is ${a}:${c}. There are ${T} cats and dogs in all. How many dogs are there?`, c * k, [a * k, T / c, c * k + a, T - c], steps, { min: 1 });
  }
  if (t === 'scale') {
    const per = pick([10, 20, 25, 50, 15]), inches = pick([2, 3, 4, 5, 2.5, 3.5, 1.5, 6]), x = per * inches;
    const steps = [`Each inch stands for ${per} miles.`, `Multiply: ${num(inches)} × ${per} = ${num(x)}.`, `Answer: ${b(num(x) + ' miles')}`];
    return Q(`On a map, 1 inch = ${per} miles. Two towns are ${num(inches)} inches apart on the map. How far apart are they?`, num(x) + ' miles', [num(per + inches) + ' miles', num(x + per) + ' miles', num(x / 2) + ' miles'], () => num(x + pick([-per * 2, per * 2, 5])) + ' miles', steps);
  }
  const unit = rnd(d === 2 ? 2 : 3, d === 2 ? 9 : 15) * 25, n1 = rnd(2, 6), n2 = rnd(7, 15), c1 = unit * n1, x = unit * n2; // cents
  const item = pick([['pounds of apples', 'pounds'], ['notebooks', 'notebooks'], ['gallons of paint', 'gallons'], ['tickets', 'tickets']]);
  const steps = [`Find the cost of one: ${money(c1)} ÷ ${n1} = ${money(unit)} each.`, `Multiply by the new amount: ${money(unit)} × ${n2} = ${money(x)}.`, `(Or set up a proportion: ${fr(money(c1), n1)} = ${fr('?', n2)}.)`, `Answer: ${b(money(x))}`];
  return Q(`If ${n1} ${item[0]} cost ${money(c1)}, how much do ${n2} ${item[1]} cost at the same price?`, money(x), [money(c1 * n2), money(x + unit), money(c1 + n2 * 100), money(x - unit)], () => money(x + pick([-2, 2, 3]) * unit), steps);
}

function genExpo(d) {
  const t = d === 1 ? pick(['sq', 'cube', 'root']) : d === 2 ? pick(['ten', 'root', 'between', 'cuberoot']) : pick(['simp', 'simp', 'negsq', 'between']);
  if (t === 'sq' || t === 'cube') {
    const a = t === 'sq' ? rnd(2, 15) : rnd(2, 6), e = t === 'sq' ? 2 : 3, x = a ** e;
    const steps = [`${pw(a, e)} means multiply ${a} by itself ${e} times: ${Array(e).fill(a).join(' × ')}.`, `= ${b(num(x))} (not ${a} × ${e} = ${a * e}).`];
    return NQ(`What is ${pw(a, e)}?`, x, [a * e, x + a, a ** (e - 1), x - 1], steps, { min: 1 });
  }
  if (t === 'ten') {
    const e = rnd(3, 6), x = 10 ** e;
    return NQ(`What is ${pw(10, e)}?`, x, [10 * e, 10 ** (e - 1), 10 ** (e + 1)], [`${pw(10, e)} is 1 followed by ${e} zeros.`, `Answer: ${b(num(x))}`], { min: 1, spread: x });
  }
  if (t === 'root') {
    const a = rnd(2, d === 1 ? 12 : 20), n = a * a;
    const steps = [`√${n} asks: what number times itself equals ${n}?`, `${a} × ${a} = ${n}.`, `Answer: ${b(a)}`];
    return NQ(`What is √${num(n)}?`, a, [n / 2, a + 1, a - 1, a * 2], steps, { min: 1 });
  }
  if (t === 'cuberoot') {
    const a = rnd(2, 5), n = a ** 3;
    return NQ(`What is the cube root of ${n} (∛${n})?`, a, [n / 3, a + 1, a * a, a - 1], [`∛${n} asks: what number times itself three times equals ${n}?`, `${a} × ${a} × ${a} = ${n}.`, `Answer: ${b(a)}`], { min: 1 });
  }
  if (t === 'between') {
    let n; do { n = rnd(5, 150); } while (Number.isInteger(Math.sqrt(n)));
    const lo = Math.floor(Math.sqrt(n)), hi = lo + 1;
    const steps = [`Find the perfect squares around ${n}: ${lo}² = ${lo * lo} and ${hi}² = ${hi * hi}.`, `${lo * lo} < ${n} < ${hi * hi}, so √${n} is between ${lo} and ${hi}.`, `Answer: ${b(`${lo} and ${hi}`)}`];
    return Q(`√${n} is between which two whole numbers?`, `${lo} and ${hi}`, [`${hi} and ${hi + 1}`, `${lo - 1} and ${lo}`, `${Math.floor(n / 2)} and ${Math.floor(n / 2) + 1}`], () => { const k = rnd(1, 14); return `${k} and ${k + 1}`; }, steps);
  }
  if (t === 'negsq') {
    const a = rnd(2, 9), neg = Math.random() < 0.5;
    const x = neg ? -(a * a) : a * a;
    const qt = neg ? `${MINUS}${pw(a, 2)}` : `(${MINUS}${a})<sup>2</sup>`;
    const steps = neg ? [`Exponents come before the negative sign: square ${a} first.`, `${pw(a, 2)} = ${a * a}, then apply the negative: ${b(num(x))}.`] : [`The parentheses mean square ${MINUS}${a}: (${MINUS}${a}) × (${MINUS}${a}).`, `A negative times a negative is positive: ${b(num(x))}.`];
    return NQ(`What is ${qt}?`, x, [-x, -2 * a, 2 * a], steps);
  }
  const m = pick([2, 3, 5, 6, 7]), k = rnd(2, 8), n = k * k * m;
  const steps = [`Look for the biggest perfect square that divides ${n}: ${k * k} (because ${k * k} × ${m} = ${n}).`, `√${n} = √${k * k} × √${m} = ${k}√${m}.`, `Answer: ${b(`${k}√${m}`)}`];
  return Q(`Simplify √${n}.`, `${k}√${m}`, [`${m}√${k}`, `${k * k}√${m}`, `${k}√${m * 2}`, `${n / 2}`], () => `${rnd(2, 9)}√${pick([2, 3, 5])}`, steps);
}

root.ASVAB_GEN_U12 = { genAdd, genSub, genMul, genDiv, genOrder, genNeg, genFactors, genSimplify, genFracAdd, genFracMul, genDecimal, genPercent, genRatio, genExpo };
root.ASVAB_H = { MINUS, rnd, pick, shuffle, gcd, lcm, cap, nz, num, sn, red, fr, fv, fimp, pw, money, poly, term, fac, factors, isPrime, decStr, b, Q, NQ, choicesFrom };
})(typeof window !== 'undefined' ? window : globalThis);
