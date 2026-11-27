/* ASVAB Math — units 3 to 5, the level list, lessons and practice-test settings. */
(function (root) {
'use strict';
const H = root.ASVAB_H, G = root.ASVAB_GEN_U12;
const { MINUS, rnd, pick, shuffle, gcd, num, sn, red, fr, fv, pw, money, poly, decStr, b, Q, NQ } = H;
const M = MINUS;

// ---------- UNIT 3: Word problems (Arithmetic Reasoning) ----------
function genWords(d) {
  const t = d === 1 ? pick(['expr', 'solve1']) : d === 2 ? pick(['expr', 'solve2', 'solve1']) : pick(['solve2', 'consec', 'expr']);
  if (t === 'expr') {
    const k = rnd(2, 9), m = rnd(2, 9);
    const T = [
      [`${k} more than a number <i>n</i>`, `<i>n</i> + ${k}`, [`${k}<i>n</i>`, `<i>n</i> ${M} ${k}`, `${k} ${M} <i>n</i>`]],
      [`${k} less than a number <i>n</i>`, `<i>n</i> ${M} ${k}`, [`${k} ${M} <i>n</i>`, `<i>n</i> + ${k}`, `${k}<i>n</i>`]],
      [`twice a number <i>n</i>, decreased by ${k}`, `2<i>n</i> ${M} ${k}`, [`2(<i>n</i> ${M} ${k})`, `${k} ${M} 2<i>n</i>`, `<i>n</i><sup>2</sup> ${M} ${k}`]],
      [`the product of ${k} and a number <i>n</i>, increased by ${m}`, `${k}<i>n</i> + ${m}`, [`${k}(<i>n</i> + ${m})`, `${k} + <i>n</i> + ${m}`, `${k * m}<i>n</i>`]],
      [`${k} times the sum of a number <i>n</i> and ${m}`, `${k}(<i>n</i> + ${m})`, [`${k}<i>n</i> + ${m}`, `${k} + <i>n</i> + ${m}`, `<i>n</i>(${k} + ${m})`]],
      [`a number <i>n</i> divided by ${k}, then increased by ${m}`, `${fr('<i>n</i>', k)} + ${m}`, [`${fr(`<i>n</i> + ${m}`, k)}`, `${k}<i>n</i> + ${m}`, `${fr(k, '<i>n</i>')} + ${m}`]],
    ];
    const [phrase, right, wrong] = pick(T);
    const steps = ['Translate piece by piece: "more than / increased by / sum" means +, "less than / decreased by / difference" means −, "times / product / twice" means ×, "divided by" means ÷.',
      phrase.includes('less than') ? `Careful: "${k} less than <i>n</i>" means start with <i>n</i> and take ${k} away, so <i>n</i> ${M} ${k} (not ${k} ${M} <i>n</i>).` : 'Keep the order the words describe; parentheses show what gets multiplied as a group.',
      `"${cap(phrase)}" = ${b(right)}`];
    return Q(`Which expression means "${phrase}"?`, right, wrong, () => null, steps);
  }
  if (t === 'solve1') {
    const k = rnd(3, 25), n = rnd(4, 40), kind = pick(['add', 'sub', 'mul']);
    if (kind === 'add') return NQ(`When ${k} is added to a number, the result is ${n + k}. What is the number?`, n, [n + 2 * k, n + k, k], [`Write it as an equation: <i>n</i> + ${k} = ${n + k}.`, `Undo the + ${k} by subtracting ${k} from both sides: <i>n</i> = ${n + k} ${M} ${k}.`, `<i>n</i> = ${b(n)}`], { min: 1 });
    if (kind === 'sub') return NQ(`A number decreased by ${k} is ${n}. What is the number?`, n + k, [n - k, n, k], [`Write it as an equation: <i>n</i> ${M} ${k} = ${n}.`, `Undo the − ${k} by adding ${k} to both sides: <i>n</i> = ${n} + ${k}.`, `<i>n</i> = ${b(n + k)}`], { min: 1 });
    const m = rnd(2, 9);
    return NQ(`${cap(['three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'two'][[3, 4, 5, 6, 7, 8, 9, 2].indexOf(m)])} times a number is ${m * n}. What is the number?`, n, [m * n - m, n + m, m * n * m], [`Write it as an equation: ${m}<i>n</i> = ${m * n}.`, `Undo the × ${m} by dividing both sides by ${m}: <i>n</i> = ${m * n} ÷ ${m}.`, `<i>n</i> = ${b(n)}`], { min: 1 });
  }
  if (t === 'solve2') {
    const k = rnd(2, 6), m = rnd(1, 15), n = rnd(2, 20), s = k * n + m;
    return NQ(`${m} more than ${k} times a number is ${s}. What is the number?`, n, [(s + m) / k, s - m, (s / k) - m, n + 1], [`Write it as an equation: ${k}<i>n</i> + ${m} = ${s}.`, `Subtract ${m} from both sides: ${k}<i>n</i> = ${s - m}.`, `Divide both sides by ${k}: <i>n</i> = ${b(n)}.`, `Check: ${k} × ${n} + ${m} = ${s} ✓`], { min: 1 });
  }
  const even = Math.random() < 0.4, cnt = even ? 2 : 3, step = even ? 2 : 1;
  let n = rnd(5, 40); if (even && n % 2) n++;
  const nums = Array.from({ length: cnt }, (_, i) => n + i * step), S = nums.reduce((a, c) => a + c, 0), ask = even ? 'larger' : 'smallest', ans = even ? nums[1] : nums[0];
  const steps = [`Call the ${even ? 'smaller one' : 'smallest one'} <i>n</i>. The ${even ? 'next even integer is <i>n</i> + 2' : 'next two are <i>n</i> + 1 and <i>n</i> + 2'}.`,
    `Add them: ${even ? `<i>n</i> + (<i>n</i> + 2) = 2<i>n</i> + 2` : `<i>n</i> + (<i>n</i> + 1) + (<i>n</i> + 2) = 3<i>n</i> + 3`} = ${S}.`,
    `${even ? `2<i>n</i> = ${S - 2}, so <i>n</i> = ${n}` : `3<i>n</i> = ${S - 3}, so <i>n</i> = ${n}`}.`, `The numbers are ${nums.join(', ')}. The ${ask} is ${b(ans)}.`];
  return NQ(`The sum of ${cnt === 2 ? 'two consecutive even integers' : 'three consecutive integers'} is ${S}. What is the ${ask} one?`, ans, [S / cnt, even ? nums[0] : nums[2], nums[1] + (even ? 2 : 0), ans + 1], steps, { min: 1 });
}
const cap = H.cap;

function genAverage(d) {
  if (d <= 2) {
    const cnt = d === 1 ? 3 : 5, m = d === 1 ? rnd(8, 40) : rnd(70, 92);
    const offs = []; let sum = 0; for (let i = 0; i < cnt - 1; i++) { const o = rnd(-6, 6); offs.push(o); sum += o; } offs.push(-sum);
    const vals = offs.map((o) => m + o), S = vals.reduce((a, c) => a + c, 0);
    const what = d === 1 ? `numbers ${vals.join(', ')}` : `test scores ${vals.join(', ')}`;
    const steps = ['Average (mean) = total ÷ how many.', `Add them: ${vals.join(' + ')} = ${S}.`, `Divide by ${cnt}: ${S} ÷ ${cnt} = ${b(m)}.`];
    return NQ(`What is the average of the ${what}?`, m, [S, S / (cnt - 1), m + 1, [...vals].sort((a, c) => a - c)[Math.floor(cnt / 2)]], steps, { min: 0 });
  }
  const n = pick([3, 4]), target = rnd(78, 90), known = []; let s = 0;
  for (let i = 0; i < n; i++) { const v = rnd(target - 10, target + 8); known.push(v); s += v; }
  let need = target * (n + 1) - s; if (need > 100 || need < 50) return genAverage(d);
  const steps = [`To average ${target} over ${n + 1} tests, the total must be ${target} × ${n + 1} = ${target * (n + 1)}.`, `The first ${n} add to ${known.join(' + ')} = ${s}.`, `Needed on the last test: ${target * (n + 1)} ${M} ${s} = ${b(need)}.`];
  return NQ(`Jordan scored ${known.join(', ')} on the first ${n} tests. What score is needed on the next test to average exactly ${target}?`, need, [target, Math.round(s / n), need - n, need + 4], steps, { min: 0 });
}

function genRate(d) {
  const t = d === 1 ? pick(['dist', 'unit']) : d === 2 ? pick(['time', 'speed', 'gas', 'unit']) : pick(['hm', 'time', 'speed', 'gas']);
  if (t === 'dist') { const r = 5 * rnd(6, 14), h = rnd(2, 6), x = r * h;
    return NQ(`A car travels at ${r} miles per hour for ${h} hours. How many miles does it travel?`, x, [r + h, x + r, x - r, r * (h + 1)], ['Distance = rate × time.', `${r} × ${h} = ${b(num(x))} miles.`], { min: 1, fmt: (v) => num(v) + ' miles' }); }
  if (t === 'time') { const r = 5 * rnd(8, 14), h = rnd(2, 8), x = r * h;
    return NQ(`A bus travels ${num(x)} miles at ${r} miles per hour. How many hours does the trip take?`, h, [h + 1, h - 1, x - r, h + 2], ['Time = distance ÷ rate.', `${num(x)} ÷ ${r} = ${b(h)} hours.`], { min: 1, fmt: (v) => num(v) + ' hours' }); }
  if (t === 'speed') { const r = 5 * rnd(6, 14), h = rnd(2, 6), x = r * h;
    return NQ(`A train covers ${num(x)} miles in ${h} hours. What is its average speed?`, r, [x * h, r + 5, r - 5, x - h], ['Rate = distance ÷ time.', `${num(x)} ÷ ${h} = ${b(r)} miles per hour.`], { min: 1, fmt: (v) => num(v) + ' mph' }); }
  if (t === 'gas') { const mpg = rnd(18, 35), g = rnd(3, 12), x = mpg * g;
    return NQ(`A truck gets ${mpg} miles per gallon. How many gallons does it need to drive ${num(x)} miles?`, g, [g + 1, g - 1, mpg - g, g + 2], ['Gallons = miles ÷ miles per gallon.', `${num(x)} ÷ ${mpg} = ${b(g)} gallons.`], { min: 1, fmt: (v) => num(v) + ' gallons' }); }
  if (t === 'unit') { const n = rnd(3, 12), unit = rnd(3, 40) * 5, c = n * unit;
    return Q(`A pack of ${n} pens costs ${money(c)}. What is the price per pen?`, money(unit), [money(unit + 5), money(c - unit), money(unit * 2)], () => money(unit + pick([-10, 10, 15, -5])), ['Price per item = total ÷ number of items.', `${money(c)} ÷ ${n} = ${b(money(unit))}`]); }
  const r = pick([40, 50, 60]), h = rnd(1, 4), half = r / 2, x = r * h + half;
  const fmtHM = (hh, mm) => `${hh} hour${hh === 1 ? '' : 's'} ${mm} minutes`;
  const steps = ['Time = distance ÷ rate.', `${num(x)} ÷ ${r} = ${h}.5 hours.`, `0.5 hour = 30 minutes, so the trip takes ${b(fmtHM(h, 30))}.`];
  return Q(`A driver goes ${num(x)} miles at ${r} miles per hour. How long does the trip take?`, fmtHM(h, 30), [fmtHM(h, 50), fmtHM(h, 5), fmtHM(h + 1, 30), fmtHM(h, 15)], () => fmtHM(rnd(1, 5), pick([0, 10, 20, 45])), steps);
}

function genMoney(d) {
  const t = d === 1 ? pick(['discount', 'tax']) : d === 2 ? pick(['discount', 'tax', 'change', 'interest']) : pick(['change', 'interest', 'discount2', 'interestTotal']);
  if (t === 'discount' || t === 'discount2') {
    const P = 20 * rnd(2, 15) * 100, p = pick([10, 15, 20, 25, 30, 40, 50]), off = P * p / 100, sale = P - off;
    if (t === 'discount2') { const p2 = pick([10, 20]), sale2 = sale - sale * p2 / 100;
      return Q(`A ${money(P)} coat is marked ${p}% off. At the register you get an extra ${p2}% off the sale price. What do you pay?`, money(sale2), [money(P - P * (p + p2) / 100), money(sale), money(sale - P * p2 / 100 - 100)], () => money(sale2 + pick([-500, 500, 1000])), [`First discount: ${p}% of ${money(P)} = ${money(off)}, so the sale price is ${money(sale)}.`, `Second discount is taken from the sale price: ${p2}% of ${money(sale)} = ${money(sale * p2 / 100)}.`, `${money(sale)} ${M} ${money(sale * p2 / 100)} = ${b(money(sale2))}. (You can't just add ${p}% + ${p2}%.)`]); }
    return Q(`A jacket costs ${money(P)}. It is on sale for ${p}% off. What is the sale price?`, money(sale), [money(off), money(P + off), money(P - p * 100)], () => money(sale + pick([-200, 200, 500, -500])), [`Discount = ${p}% of ${money(P)} = ${decStr(p / 100, 2)} × ${money(P)} = ${money(off)}.`, `Sale price = ${money(P)} ${M} ${money(off)} = ${b(money(sale))}.`, `Shortcut: you pay ${100 - p}% of the price.`]);
  }
  if (t === 'tax') {
    const P = rnd(10, 80) * 100, r = pick([5, 6, 7, 8, 10]), tax = P * r / 100, tot = P + tax;
    return Q(`A ${money(P)} pair of shoes has ${r}% sales tax. What is the total cost?`, money(tot), [money(tax), money(P + r * 100), money(P - tax)], () => money(tot + pick([-100, 100, 50])), [`Tax = ${r}% of ${money(P)} = ${decStr(r / 100, 2)} × ${money(P)} = ${money(tax)}.`, `Total = ${money(P)} + ${money(tax)} = ${b(money(tot))}.`]);
  }
  if (t === 'change') {
    const up = Math.random() < 0.5, old = 20 * rnd(2, 20), p = pick([5, 10, 15, 20, 25, 50]), ch = old * p / 100, nw = up ? old + ch : old - ch;
    return Q(`The price of a game went from ${money(old * 100)} to ${money(nw * 100)}. What was the percent ${up ? 'increase' : 'decrease'}?`, p + '%', [`${+(ch / nw * 100).toFixed(1)}%`, `${num(ch)}%`, `${p * 2}%`], () => `${p + pick([5, -5, 10])}%`,
      [`Change = ${money(nw * 100)} ${M} ${money(old * 100)} = ${money(Math.abs(nw - old) * 100)}${up ? '' : ' (down)'}.`, `Percent change = change ÷ ORIGINAL price = ${num(ch)} ÷ ${num(old)} = ${decStr(p / 100, 2)}.`, `${decStr(p / 100, 2)} = ${b(p + '%')}. (Always divide by the original, not the new price.)`]);
  }
  const P = pick([500, 800, 1000, 1200, 1500, 2000, 2500, 3000]), r = pick([2, 3, 4, 5, 6]), yrs = rnd(2, 5), I = P * r * yrs / 100;
  if (t === 'interestTotal') return Q(`You put ${money(P * 100)} in an account that pays ${r}% simple interest per year. How much is in the account after ${yrs} years?`, money((P + I) * 100), [money(I * 100), money((P + P * r / 100) * 100), money((P + I * 2) * 100)], () => money((P + I + pick([-50, 50, 100])) * 100), [`Simple interest: I = P × r × t = ${money(P * 100)} × ${decStr(r / 100, 2)} × ${yrs} = ${money(I * 100)}.`, `Total = principal + interest = ${money(P * 100)} + ${money(I * 100)} = ${b(money((P + I) * 100))}.`]);
  return Q(`How much simple interest does ${money(P * 100)} earn at ${r}% per year for ${yrs} years?`, money(I * 100), [money(P * r / 100 * 100), money((P + I) * 100), money(I * 1000)], () => money((I + pick([-20, 20, 50])) * 100), [`Simple interest formula: I = P × r × t.`, `P = ${money(P * 100)}, r = ${r}% = ${decStr(r / 100, 2)}, t = ${yrs} years.`, `I = ${num(P)} × ${decStr(r / 100, 2)} × ${yrs} = ${b(money(I * 100))}.`]);
}

function genWork(d) {
  const t = d === 1 ? pick(['age', 'times']) : d === 2 ? pick(['work', 'age', 'times']) : pick(['work', 'work', 'times']);
  if (t === 'work') {
    const pairs = [[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [5, 20], [2, 6], [4, 4], [6, 6], [8, 24], [9, 18], [15, 30], [12, 4], [6, 3], [3, 3]];
    const [a, c] = pick(pairs), x = a * c / (a + c), names = pick([['Ana', 'Ben'], ['Sam', 'Lee'], ['Mia', 'Joe']]);
    const fmt = (v) => num(v) + ' hours';
    return Q(`${names[0]} can paint a fence in ${a} hours. ${names[1]} can paint it in ${c} hours. How long will it take if they work together?`, fmt(x), [fmt(a + c), fmt((a + c) / 2), a !== c ? fmt(Math.abs(a - c)) : fmt(a / 4)], () => fmt(x + pick([0.5, 1, -0.5, 2])), [
      `Each person's rate is part of the job per hour: ${names[0]} does ${fr(1, a)}, ${names[1]} does ${fr(1, c)}.`,
      `Together per hour: ${fr(1, a)} + ${fr(1, c)} = ${fr(c, a * c)} + ${fr(a, a * c)} = ${fr(a + c, a * c)}.`,
      `Time = 1 job ÷ rate = ${fr(a * c, a + c)} = ${b(fmt(x))}.`, `Shortcut: (A × B) ÷ (A + B) = (${a} × ${c}) ÷ (${a} + ${c}) = ${num(x)}.`]);
  }
  if (t === 'age') {
    const y = rnd(6, 30), k = rnd(2, 12), S = 2 * y + k;
    return NQ(`Kai is ${k} years older than Ray. Their ages add up to ${S}. How old is Ray?`, y, [y + k, S / 2, S - k, y - 1], [`Let Ray = <i>r</i>. Then Kai = <i>r</i> + ${k}.`, `<i>r</i> + (<i>r</i> + ${k}) = ${S}, so 2<i>r</i> + ${k} = ${S}.`, `2<i>r</i> = ${S - k}, so <i>r</i> = ${b(y)}.`, `Check: ${y} + ${y + k} = ${S} ✓`], { min: 1 });
  }
  const m = rnd(2, 4), y = rnd(3, 15), S = (m + 1) * y;
  return NQ(`Tia has ${m === 2 ? 'twice' : m === 3 ? 'three times' : 'four times'} as many stamps as Max. Together they have ${S}. How many stamps does Max have?`, y, [m * y, S / m, S - m, y + m], [`Let Max = <i>x</i>. Then Tia = ${m}<i>x</i>.`, `<i>x</i> + ${m}<i>x</i> = ${m + 1}<i>x</i> = ${S}.`, `<i>x</i> = ${S} ÷ ${m + 1} = ${b(y)}.`], { min: 1 });
}

function genARmix(d) {
  const g = pick([G.genPercent, G.genRatio, genAverage, genRate, genMoney, genWork, genWords]);
  return g(Math.max(2, d));
}

// ---------- UNIT 4: Algebra (Mathematics Knowledge) ----------
function signed(c, v) { // " + 3x" or " − 3x" for joining terms
  const t = (Math.abs(c) === 1 && v) ? v : num(Math.abs(c)) + v;
  return c < 0 ? ` ${M} ${t}` : ` + ${t}`;
}
function lead(c, v) { const t = (Math.abs(c) === 1 && v) ? v : num(Math.abs(c)) + v; return (c < 0 ? M : '') + t; }

function genExpr(d) {
  const t = d === 1 ? pick(['eval', 'combine']) : d === 2 ? pick(['eval2', 'combine', 'dist']) : pick(['eval3', 'dist', 'combine']);
  if (t === 'eval') { const a = rnd(2, 9), c = rnd(1, 20), x = rnd(1, 9), v = a * x + c;
    return NQ(`What is ${a}<i>x</i> + ${c} when <i>x</i> = ${x}?`, v, [a + x + c, a * (x + c), Number(`${a}${x}`) + c, v + 1], [`Replace <i>x</i> with ${x}: ${a}(${x}) + ${c}.`, `Multiply first: ${a} × ${x} = ${a * x}.`, `Add: ${a * x} + ${c} = ${b(v)}.`]); }
  if (t === 'eval2') { const a = rnd(2, 6), c = rnd(2, 6), x = rnd(1, 9), y = rnd(1, 9), v = a * x - c * y;
    return NQ(`If <i>a</i> = ${x} and <i>b</i> = ${y}, what is ${a}<i>a</i> ${M} ${c}<i>b</i>?`, v, [a * x + c * y, a * y - c * x, v + 2], [`Replace the letters: ${a}(${x}) ${M} ${c}(${y}).`, `${a * x} ${M} ${c * y} = ${b(num(v))}.`]); }
  if (t === 'eval3') { const a = rnd(2, 6), c = rnd(1, 9), x = -rnd(1, 5), v = x * x - a * x + c;
    return NQ(`What is <i>x</i><sup>2</sup> ${M} ${a}<i>x</i> + ${c} when <i>x</i> = ${num(x)}?`, v, [-(x * x) - a * x + c, x * x + a * x + c, v - 2], [`Replace <i>x</i> with (${num(x)}): (${num(x)})<sup>2</sup> ${M} ${a}(${num(x)}) + ${c}.`, `(${num(x)})<sup>2</sup> = ${x * x} (negative times negative is positive).`, `${a}(${num(x)}) = ${num(a * x)}, and subtracting a negative adds: ${x * x} + ${-a * x} + ${c}.`, `= ${b(num(v))}`]); }
  if (t === 'combine') {
    const a = rnd(2, 9), c = pick([1, 2, 3, 4, 5, -1, -2, -3]) * (d === 1 ? 1 : pick([1, -1])), e = rnd(1, 12), f = rnd(1, 12);
    const ce = a + c, cn = e - f;
    const expr = `${lead(a, '<i>x</i>')} + ${e}${signed(c, '<i>x</i>')} ${M} ${f}`;
    const ans = poly([ce, cn], '<i>x</i>');
    return Q(`Simplify: ${expr}`, ans, [poly([a + c + e - f, 0], '<i>x</i>'), poly([a - c, e + f], '<i>x</i>'), poly([ce, e + f], '<i>x</i>')], () => poly([ce + pick([-1, 1, 2]), cn + pick([-2, 2])], '<i>x</i>'),
      [`Like terms have the same letter part. Group the <i>x</i> terms and the plain numbers.`, `<i>x</i> terms: ${a}${signed(c, '')} = ${ce} → ${lead(ce, '<i>x</i>')}.`, `Numbers: ${e} ${M} ${f} = ${num(cn)}.`, `Answer: ${b(ans)}`]);
  }
  const a = d === 3 ? -rnd(2, 6) : rnd(2, 9), c = d === 3 ? -rnd(1, 9) : rnd(1, 9);
  const ans = poly([a, a * c], '<i>x</i>');
  return Q(`Expand: ${a < 0 ? M + Math.abs(a) : a}(<i>x</i>${signed(c, '')})`, ans, [poly([a, c], '<i>x</i>'), poly([a, -a * c], '<i>x</i>'), poly([Math.abs(a), Math.abs(a * c)], '<i>x</i>')], () => poly([a, a * c + pick([-2, 2, a])], '<i>x</i>'),
    [`Distribute: multiply ${num(a)} by EACH term inside the parentheses.`, `${num(a)} × <i>x</i> = ${lead(a, '<i>x</i>')}.`, `${num(a)} × ${sn(c)} = ${num(a * c)}${a < 0 && c < 0 ? ' (negative × negative = positive)' : ''}.`, `Answer: ${b(ans)}`]);
}

function eqSide(a, c) { return poly([a, c], '<i>x</i>'); }
function genEquation(d) {
  if (d === 1) {
    const kind = pick(['add', 'sub', 'mul', 'div']), x = rnd(2, 20), a = rnd(2, 12);
    if (kind === 'add') return NQ(`Solve: <i>x</i> + ${a} = ${x + a}`, x, [x + 2 * a, x + a, a], [`Undo + ${a} by subtracting ${a} from both sides.`, `<i>x</i> = ${x + a} ${M} ${a} = ${b(x)}`]);
    if (kind === 'sub') return NQ(`Solve: <i>x</i> ${M} ${a} = ${x}`, x + a, [x - a, x, a], [`Undo − ${a} by adding ${a} to both sides.`, `<i>x</i> = ${x} + ${a} = ${b(x + a)}`]);
    if (kind === 'mul') return NQ(`Solve: ${a}<i>x</i> = ${a * x}`, x, [a * x - a, a * x * a, x + a], [`${a}<i>x</i> means ${a} × <i>x</i>. Undo it by dividing both sides by ${a}.`, `<i>x</i> = ${a * x} ÷ ${a} = ${b(x)}`]);
    return NQ(`Solve: ${fr('<i>x</i>', a)} = ${x}`, a * x, [x, a + x, a * x + a], [`Undo ÷ ${a} by multiplying both sides by ${a}.`, `<i>x</i> = ${x} × ${a} = ${b(a * x)}`]);
  }
  if (d === 2) {
    const a = rnd(2, 9), x = rnd(-9, 12), c = H.nz(-15, 20), r = a * x + c;
    return NQ(`Solve: ${eqSide(a, c)} = ${num(r)}`, x, [(r + c) / a, r - c, x + 1, -x], [`Undo the ${c < 0 ? M + ' ' + -c : '+ ' + c} first: ${c < 0 ? 'add' : 'subtract'} ${Math.abs(c)} on both sides → ${a}<i>x</i> = ${num(r - c)}.`, `Undo × ${a}: divide both sides by ${a} → <i>x</i> = ${num(r - c)} ÷ ${a} = ${b(num(x))}.`, `Check: ${a}(${num(x)}) ${c < 0 ? M + ' ' + -c : '+ ' + c} = ${num(r)} ✓`]);
  }
  if (Math.random() < 0.5) {
    let a, c; do { a = rnd(2, 9); c = rnd(1, 8); } while (a === c);
    const x = rnd(-6, 10), e = H.nz(-12, 12), f = a * x + e - c * x;
    return NQ(`Solve: ${eqSide(a, e)} = ${eqSide(c, f)}`, x, [(f - e) / (a + c), (f + e) / (a - c), -x, x + 2], [`Get the <i>x</i> terms on one side: subtract ${c}<i>x</i> from both sides → ${eqSide(a - c, e)} = ${num(f)}.`, `Get the numbers on the other side: ${e < 0 ? 'add' : 'subtract'} ${Math.abs(e)} → ${lead(a - c, '<i>x</i>')} = ${num(f - e)}.`, `Divide by ${a - c}: <i>x</i> = ${b(num(x))}.`]);
  }
  const a = rnd(2, 6), c = H.nz(-8, 8), x = rnd(-5, 10), r = a * (x + c);
  return NQ(`Solve: ${a}(<i>x</i>${signed(c, '')}) = ${num(r)}`, x, [r / a + c, r - c, (r - c) / a, x + 1], [`Divide both sides by ${a}: <i>x</i>${signed(c, '')} = ${num(r / a)}.`, `${c < 0 ? 'Add' : 'Subtract'} ${Math.abs(c)}: <i>x</i> = ${b(num(x))}.`, `(Or distribute first: ${eqSide(a, a * c)} = ${num(r)}.)`]);
}

const FLIP = { '&gt;': '&lt;', '&lt;': '&gt;', '≥': '≤', '≤': '≥' };
function genIneq(d) {
  const sym = pick(['&gt;', '&lt;', '≥', '≤']);
  const show = (s, v) => `<i>x</i> ${s} ${num(v)}`;
  if (d === 1) { const a = rnd(2, 15), v = rnd(-5, 15);
    return Q(`Solve: <i>x</i> + ${a} ${sym} ${num(v + a)}`, show(sym, v), [show(FLIP[sym], v), show(sym, v + 2 * a), show(sym, v + a)], () => show(sym, v + pick([-1, 1, 3])), [`Solve it like an equation: subtract ${a} from both sides.`, `<i>x</i> ${sym} ${num(v + a)} ${M} ${a}, so ${b(show(sym, v))}.`]); }
  if (d === 2) { const a = rnd(2, 9), v = rnd(-5, 12), c = rnd(1, 15);
    return Q(`Solve: ${a}<i>x</i> ${M} ${c} ${sym} ${num(a * v - c)}`, show(sym, v), [show(FLIP[sym], v), show(sym, (a * v - 2 * c) / a), show(sym, a * v)], () => show(sym, v + pick([-1, 1, 2])), [`Add ${c} to both sides: ${a}<i>x</i> ${sym} ${num(a * v)}.`, `Divide by ${a} (a positive number, so the sign stays the same): ${b(show(sym, v))}.`]); }
  const a = rnd(2, 6), v = rnd(-6, 8), c = rnd(1, 12), r = -a * v + c;
  return Q(`Solve: ${M}${a}<i>x</i> + ${c} ${sym} ${num(r)}`, show(FLIP[sym], v), [show(sym, v), show(FLIP[sym], -v), show(sym, -v)], () => show(FLIP[sym], v + pick([-1, 1, 2])), [`Subtract ${c} from both sides: ${M}${a}<i>x</i> ${sym} ${num(r - c)}.`, `Divide both sides by ${M}${a}. Dividing (or multiplying) by a NEGATIVE number flips the inequality sign.`, `So ${b(show(FLIP[sym], v))}.`]);
}

function genExpRules(d) {
  const t = d === 1 ? pick(['mult', 'pow', 'divi']) : d === 2 ? pick(['coef', 'zero', 'sciBig', 'mult']) : pick(['coefPow', 'neg', 'sciSmall', 'sciMul']);
  const X = '<i>x</i>';
  if (t === 'mult') { const a = rnd(2, 7), c = rnd(2, 7); return Q(`Simplify: ${pw(X, a)} · ${pw(X, c)}`, pw(X, a + c), [pw(X, a * c), pw(`2${X}`, a + c), pw(X, Math.abs(a - c) || a + c + 1)], () => pw(X, rnd(2, 20)), ['When you multiply powers with the same base, ADD the exponents.', `${pw(X, a)} · ${pw(X, c)} = ${pw(X, `${a} + ${c}`)} = ${b(pw(X, a + c))}`]); }
  if (t === 'pow') { const a = rnd(2, 6), c = rnd(2, 5); return Q(`Simplify: (${pw(X, a)})<sup>${c}</sup>`, pw(X, a * c), [pw(X, a + c), pw(X, a ** c), pw(`${c}${X}`, a)], () => pw(X, rnd(2, 30)), ['A power of a power: MULTIPLY the exponents.', `(${pw(X, a)})<sup>${c}</sup> = ${pw(X, `${a} × ${c}`)} = ${b(pw(X, a * c))}`]); }
  if (t === 'divi') { const c = rnd(2, 6), a = c + rnd(1, 7); return Q(`Simplify: ${pw(X, a)} ÷ ${pw(X, c)}`, pw(X, a - c), [pw(X, a + c), pw(X, Math.round(a / c) === a - c ? a * c : Math.round(a / c)), pw(X, a * c)], () => pw(X, rnd(1, 15)), ['When you divide powers with the same base, SUBTRACT the exponents.', `${pw(X, a)} ÷ ${pw(X, c)} = ${pw(X, `${a} ${M} ${c}`)} = ${b(pw(X, a - c))}`]); }
  if (t === 'coef') { const k = rnd(2, 6), m = rnd(2, 6), a = rnd(1, 5), c = rnd(2, 5); const A = a === 1 ? X : pw(X, a);
    return Q(`Simplify: (${k}${A})(${m}${pw(X, c)})`, `${k * m}${pw(X, a + c)}`, [`${k + m}${pw(X, a + c)}`, `${k * m}${pw(X, a * c)}`, `${k + m}${pw(X, a * c)}`], () => `${k * m + pick([-1, 1, 2])}${pw(X, a + c)}`, ['Multiply the numbers, then add the exponents of matching letters.', `${k} × ${m} = ${k * m}.`, `${a === 1 ? X : pw(X, a)} · ${pw(X, c)} = ${pw(X, a + c)} (${a} + ${c}).`, `Answer: ${b(`${k * m}${pw(X, a + c)}`)}`]); }
  if (t === 'zero') { const k = rnd(2, 99); return Q(`What is ${pw(num(k), 0)}?`, '1', ['0', num(k), M + num(k)], () => null, ['Any non-zero number raised to the power 0 equals 1.', `${pw(num(k), 0)} = ${b('1')}`]); }
  if (t === 'coefPow') { const k = rnd(2, 4), a = rnd(2, 5), n = pick([2, 3]); const kk = k ** n;
    return Q(`Simplify: (${k}${pw(X, a)})<sup>${n}</sup>`, `${kk}${pw(X, a * n)}`, [`${k}${pw(X, a * n)}`, `${k * n}${pw(X, a * n)}`, `${kk}${pw(X, a + n)}`], () => `${kk + pick([1, 2, 3, -1])}${pw(X, a * n + pick([0, 1, -1, 2]))}`, [`Raise EVERY factor inside to the ${n === 2 ? 'second' : 'third'} power.`, `${pw(k, n)} = ${kk}.`, `(${pw(X, a)})<sup>${n}</sup> = ${pw(X, a * n)} (multiply exponents).`, `Answer: ${b(`${kk}${pw(X, a * n)}`)}`]); }
  if (t === 'neg') { const k = rnd(2, 5), n = pick([2, 3]), v = k ** n;
    return Q(`What is ${pw(k, `${M}${n}`)}?`, fr(1, v), [num(-v), num(-k * n), fr(1, k * n)], () => fr(1, v + pick([1, 2, k])), ['A negative exponent means "one over" the positive power.', `${pw(k, `${M}${n}`)} = ${fr(1, pw(k, n))} = ${b(fr(1, v))}`]); }
  const sci = (m, e) => `${num(m)} × ${pw(10, e)}`;
  if (t === 'sciBig') { const m = rnd(11, 99) / 10, e = rnd(3, 7), val = Math.round(m * 10 ** e);
    return Q(`Write ${num(val)} in scientific notation.`, sci(m, e), [sci(m, e + 1), sci(m, e - 1), sci(m * 10, e - 1)], () => sci(m, e + pick([2, -2])), ['Scientific notation is a number from 1 to 10 times a power of 10.', `Move the decimal point left until one digit is in front of it: ${num(m)}.`, `You moved it ${e} places, so the power is ${e}: ${b(sci(m, e))}`]); }
  if (t === 'sciSmall') { const m = rnd(11, 99) / 10, e = rnd(2, 5), val = m / 10 ** e;
    return Q(`Write ${sci(m, `${M}${e}`)} as a decimal.`, decStr(val, e + 2), [decStr(val * 10, e + 2), decStr(val / 10, e + 3), decStr(m * 10 ** e, 0)], () => decStr(val * 100, e + 2), [`A negative power of 10 moves the decimal point LEFT.`, `Move the decimal in ${num(m)} left ${e} places (fill with zeros).`, `Answer: ${b(decStr(val, e + 2))}`]); }
  const a = rnd(1, 4), c = rnd(1, 2), e1 = rnd(2, 6), e2 = rnd(2, 6);
  return Q(`What is (${a} × ${pw(10, e1)})(${c} × ${pw(10, e2)})?`, sci(a * c, e1 + e2), [sci(a * c, e1 * e2), sci(a + c, e1 + e2), sci(a * c, e1 + e2 + 1)], () => sci(a * c + pick([1, 2, 3]), e1 + e2 + pick([0, 1, -1])), ['Multiply the front numbers, and add the powers of 10.', `${a} × ${c} = ${a * c}.`, `${pw(10, e1)} × ${pw(10, e2)} = ${pw(10, e1 + e2)}.`, `Answer: ${b(sci(a * c, e1 + e2))}`]);
}

function genPoly(d) {
  const X = '<i>x</i>';
  const p = H.nz(d === 1 ? 1 : -9, 9), q = (() => { let v; do { v = H.nz(d === 1 ? 1 : -9, 9); } while (v === -p); return v; })();
  const factor = d >= 2 && Math.random() < 0.5;
  const fx = (v) => (v < 0 ? `(${X} ${M} ${-v})` : `(${X} + ${v})`);
  if (factor) {
    const B = p + q, C = p * q, expr = poly([1, B, C], X);
    const [lo, hi] = [Math.min(p, q), Math.max(p, q)];
    const ans = fx(hi) + fx(lo);
    return Q(`Factor: ${expr}`, ans, [fx(-hi) + fx(-lo), fx(hi) + fx(-lo), fx(C) + fx(1), fx(B) + fx(1)].filter((s) => s !== ans), () => fx(H.nz(-9, 9)) + fx(H.nz(-9, 9)),
      [`Look for two numbers that MULTIPLY to ${num(C)} and ADD to ${num(B)}.`, `${num(hi)} × ${num(lo)} = ${num(C)} and ${num(hi)} + ${num(lo)} = ${num(B)}.`, `So ${expr} = ${b(ans)}`, `Check by multiplying it back out (FOIL).`]);
  }
  const a = d === 3 ? pick([2, 3]) : 1;
  const coeffs = [a, a * q + p, p * q], ans = poly(coeffs, X);
  const L = a === 1 ? X : `${a}${X}`;
  const first = `(${L}${signed(p, '')})(${X}${signed(q, '')})`;
  return Q(`Multiply: ${first}`, ans, [poly([a, p * q, a * q + p], X), poly([a, 0, p * q], X), poly([a, a * q - p, -p * q], X), poly([a, a * q + p, p + q], X)], () => poly([a, a * q + p + pick([-2, 2]), p * q], X), [
    'Use FOIL: First, Outer, Inner, Last.',
    `First: ${L} · ${X} = ${poly([a, 0, 0], X)}.  Outer: ${L} · ${num(q)} = ${poly([a * q, 0], X)}.`,
    `Inner: ${num(p)} · ${X} = ${poly([p, 0], X)}.  Last: ${num(p)} · ${sn(q)} = ${num(p * q)}.`,
    `Combine the middle terms: ${num(a * q)}${X} + ${sn(p)}${X} = ${poly([a * q + p, 0], X)}.`, `Answer: ${b(ans)}`]);
}

function genQuad(d) {
  const X = '<i>x</i>';
  const sol = (r1, r2) => { const [a, c] = [Math.min(r1, r2), Math.max(r1, r2)]; return a === c ? `${X} = ${num(a)}` : `${X} = ${num(a)} or ${X} = ${num(c)}`; };
  if (d === 1 || (d === 2 && Math.random() < 0.5)) {
    let r1, r2; do { r1 = H.nz(-9, 9); r2 = H.nz(-9, 9); } while (r1 === r2 || r1 === -r2);
    const B = -(r1 + r2), C = r1 * r2;
    const fx = (r) => (r > 0 ? `(${X} ${M} ${r})` : `(${X} + ${-r})`);
    if (d === 1) return Q(`Solve: ${fx(r1)}${fx(r2)} = 0`, sol(r1, r2), [sol(-r1, -r2), sol(r1, -r2), sol(-r1, r2)], () => sol(H.nz(-9, 9), H.nz(-9, 9)), ['If two things multiply to 0, one of them must be 0.', `Set each factor to 0: ${fx(r1).slice(1, -1)} = 0 → ${X} = ${num(r1)}; ${fx(r2).slice(1, -1)} = 0 → ${X} = ${num(r2)}.`, `Answer: ${b(sol(r1, r2))}`]);
    const expr = poly([1, B, C], X);
    return Q(`Solve: ${expr} = 0`, sol(r1, r2), [sol(-r1, -r2), sol(r1, -r2), sol(-r1, r2)], () => sol(H.nz(-9, 9), H.nz(-9, 9)), [`Factor: find two numbers that multiply to ${num(C)} and add to ${num(B)}: ${num(-r1)} and ${num(-r2)}.`, `${expr} = ${fx(r1)}${fx(r2)} = 0.`, `Set each factor to 0: ${X} = ${num(r1)} or ${X} = ${num(r2)}.`, `Answer: ${b(sol(r1, r2))}`]);
  }
  const t = d === 2 ? 'sq' : pick(['sq', 'gcf', 'diff']);
  if (t === 'sq' || t === 'diff') { const k = rnd(2, 12), K = k * k;
    const expr = t === 'sq' ? `${pw(X, 2)} = ${K}` : `${pw(X, 2)} ${M} ${K} = 0`;
    return Q(`Solve: ${expr}`, sol(-k, k), [`${X} = ${k}`, sol(-2 * k, 2 * k), `${X} = ${M}${k}`], () => { const j = k + pick([1, 2, 3, -1]); return sol(-j, j); }, [t === 'diff' ? `Add ${K} to both sides: ${pw(X, 2)} = ${K}.` : `Take the square root of both sides.`, `Both ${k} and ${M}${k} work, because ${k} × ${k} = ${K} and (${M}${k}) × (${M}${k}) = ${K}.`, `Answer: ${b(sol(-k, k))}`]); }
  const a = rnd(2, 5), r = H.nz(-6, 6), B = -a * r; // a x^2 + B x = 0 → x(a x + B) = 0 → x = 0 or x = r
  const expr = poly([a, B, 0], X);
  return Q(`Solve: ${expr} = 0`, sol(0, r), [`${X} = ${num(r)}`, sol(0, -r), sol(0, B)], () => sol(0, r + pick([1, -1, 2])), [`Factor out the common ${X}: ${X}(${poly([a, B], X)}) = 0.`, `So ${X} = 0, or ${poly([a, B], X)} = 0 → ${a}${X} = ${num(-B)} → ${X} = ${num(r)}.`, `Answer: ${b(sol(0, r))}`]);
}

// ---------- UNIT 5: Geometry (Mathematics Knowledge) ----------
const deg = (v) => num(v) + '°';
function genAngles(d) {
  const t = d === 1 ? pick(['comp', 'supp', 'tri']) : d === 2 ? pick(['tri', 'iso', 'adj', 'supp']) : pick(['ext', 'quad', 'poly', 'iso']);
  if (t === 'comp') { const a = rnd(10, 80); return Q(`Two angles are complementary. One is ${deg(a)}. What is the other?`, deg(90 - a), [deg(180 - a), deg(a), deg(360 - a)], () => deg(90 - a + pick([-5, 5, 10])), ['Complementary angles add up to 90°.', `90° ${M} ${deg(a)} = ${b(deg(90 - a))}`]); }
  if (t === 'supp') { const a = rnd(20, 160); return Q(`Two angles are supplementary. One is ${deg(a)}. What is the other?`, deg(180 - a), [deg(Math.abs(90 - a)), deg(360 - a), deg(a)], () => deg(180 - a + pick([-10, 10])), ['Supplementary angles add up to 180° (a straight line).', `180° ${M} ${deg(a)} = ${b(deg(180 - a))}`]); }
  if (t === 'tri') { const a = rnd(25, 90), c = rnd(20, 150 - a), x = 180 - a - c; return Q(`Two angles of a triangle are ${deg(a)} and ${deg(c)}. What is the third angle?`, deg(x), [deg(360 - a - c), deg(90 - (a + c) % 90 || 45), deg(a + c)], () => deg(x + pick([-10, 10, 5])), ['The three angles of any triangle add up to 180°.', `${deg(a)} + ${deg(c)} = ${deg(a + c)}.`, `180° ${M} ${deg(a + c)} = ${b(deg(x))}`]); }
  if (t === 'iso') { const v = 2 * rnd(10, 70), x = (180 - v) / 2; return Q(`In an isosceles triangle, the angle between the two equal sides is ${deg(v)}. What is each of the other two angles?`, deg(x), [deg(180 - v), deg(v), deg(90 - v / 2 + 10)], () => deg(x + pick([-5, 5, 10])), ['An isosceles triangle has two equal angles (the base angles).', `They share what is left of 180°: 180° ${M} ${deg(v)} = ${deg(180 - v)}.`, `Split it in half: ${deg(180 - v)} ÷ 2 = ${b(deg(x))}`]); }
  if (t === 'adj') { let a; do { a = rnd(20, 160); } while (a >= 80 && a <= 100); return Q(`Two straight lines cross. One of the angles formed is ${deg(a)}. What is the angle right next to it?`, deg(180 - a), [deg(a), deg(90 - a > 0 ? 90 - a : 360 - a), deg(360 - a)], () => deg(180 - a + pick([-20, -10, 10, 20])), ['Angles next to each other on a straight line add to 180°. (The angle straight across, the vertical angle, is equal.)', `180° ${M} ${deg(a)} = ${b(deg(180 - a))}`]); }
  if (t === 'ext') { const a = rnd(30, 80), c = rnd(30, 80); return Q(`A triangle has interior angles of ${deg(a)} and ${deg(c)}. What is the exterior angle at the third corner?`, deg(a + c), [deg(180 - a - c), deg(360 - a - c), deg(a * 2)], () => deg(a + c + pick([-10, 10])), ['An exterior angle equals the sum of the two interior angles that are not next to it.', `${deg(a)} + ${deg(c)} = ${b(deg(a + c))}`, `(Check: the third interior angle is ${deg(180 - a - c)}, and 180° ${M} ${deg(180 - a - c)} = ${deg(a + c)}.)`]); }
  if (t === 'quad') { const a = rnd(60, 120), c = rnd(60, 120), e = rnd(60, 110), x = 360 - a - c - e; if (x < 30 || x > 170) return genAngles(d); return Q(`Three angles of a four-sided figure are ${deg(a)}, ${deg(c)} and ${deg(e)}. What is the fourth angle?`, deg(x), [deg(180 - (a + c + e) % 180), deg(x + 20), deg(540 - a - c - e)], () => deg(x + pick([-10, 10])), ['The angles of any quadrilateral (4 sides) add up to 360°.', `${deg(a)} + ${deg(c)} + ${deg(e)} = ${deg(a + c + e)}.`, `360° ${M} ${deg(a + c + e)} = ${b(deg(x))}`]); }
  const n = pick([5, 6, 8, 9, 10, 12]), names = { 5: 'pentagon', 6: 'hexagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' }, sum = (n - 2) * 180, x = sum / n;
  return Q(`What is the measure of each interior angle of a regular ${names[n]} (${n} sides)?`, deg(x), [deg(360 / n), deg(sum), deg(180 - x + (x === 90 ? 10 : 0))], () => deg(x + pick([-12, 12, 15])), [`The interior angles of an n-sided polygon add up to (n ${M} 2) × 180°.`, `(${n} ${M} 2) × 180° = ${deg(sum)}.`, `A regular polygon has equal angles: ${deg(sum)} ÷ ${n} = ${b(deg(x))}`]);
}

function genArea(d) {
  const t = d === 1 ? pick(['rectA', 'rectP', 'sq']) : d === 2 ? pick(['tri', 'missing', 'rectP', 'paraA']) : pick(['trap', 'fence', 'tri', 'missingP']);
  const sqU = (v) => num(v) + ' sq ft', ft = (v) => num(v) + ' ft';
  if (t === 'rectA') { const l = rnd(4, 20), w = rnd(2, 15); return Q(`A rectangle is ${l} feet long and ${w} feet wide. What is its area?`, sqU(l * w), [sqU(2 * (l + w)), sqU(l + w), sqU(l * w * 2)], () => sqU(l * w + pick([-l, l, w])), ['Area of a rectangle = length × width.', `${l} × ${w} = ${b(sqU(l * w))}`]); }
  if (t === 'rectP') { const l = rnd(4, 25), w = rnd(2, 15); return Q(`What is the perimeter of a rectangle that is ${l} ft by ${w} ft?`, ft(2 * (l + w)), [ft(l * w), ft(l + w), ft(2 * l + w)], () => ft(2 * (l + w) + pick([-4, 4, 2])), ['Perimeter = the distance all the way around = 2 × length + 2 × width.', `2 × ${l} + 2 × ${w} = ${2 * l} + ${2 * w} = ${b(ft(2 * (l + w)))}`]); }
  if (t === 'sq') { const s = rnd(3, 15); const askA = Math.random() < 0.5; return askA ? Q(`A square has sides of ${s} ft. What is its area?`, sqU(s * s), [sqU(4 * s), sqU(2 * s), sqU(s * s + s)], () => sqU(s * s + pick([-s, 2 * s])), ['Area of a square = side × side.', `${s} × ${s} = ${b(sqU(s * s))}`]) : Q(`A square has sides of ${s} ft. What is its perimeter?`, ft(4 * s), [ft(s * s), ft(2 * s), ft(3 * s)], () => ft(4 * s + pick([-4, 4])), ['A square has 4 equal sides. Perimeter = 4 × side.', `4 × ${s} = ${b(ft(4 * s))}`]); }
  if (t === 'tri') { const bb = 2 * rnd(2, 12), h = rnd(3, 15), A = bb * h / 2; return Q(`A triangle has a base of ${bb} ft and a height of ${h} ft. What is its area?`, sqU(A), [sqU(bb * h), sqU(bb + h), sqU(A + h)], () => sqU(A + pick([-bb, bb, 2])), [`Area of a triangle = ${fr(1, 2)} × base × height.`, `${fr(1, 2)} × ${bb} × ${h} = ${fr(1, 2)} × ${bb * h} = ${b(sqU(A))}`, '(Forgetting the ½ is the most common mistake.)']); }
  if (t === 'paraA') { const bb = rnd(4, 15), h = rnd(3, 12); return Q(`A parallelogram has a base of ${bb} ft and a height of ${h} ft. What is its area?`, sqU(bb * h), [sqU(bb * h / 2), sqU(2 * (bb + h)), sqU(bb + h)], () => sqU(bb * h + pick([-bb, h])), ['Area of a parallelogram = base × height (the straight-up height, not the slanted side).', `${bb} × ${h} = ${b(sqU(bb * h))}`]); }
  if (t === 'missing') { const l = rnd(4, 20), w = rnd(2, 15); return Q(`A rectangle has an area of ${l * w} square feet and a length of ${l} feet. What is its width?`, ft(w), [ft(l * w - l), ft(w + 2), ft(l * w / 2)], () => ft(w + pick([-1, 1, 3])), ['Area = length × width, so width = area ÷ length.', `${l * w} ÷ ${l} = ${b(ft(w))}`]); }
  if (t === 'missingP') { const l = rnd(6, 20), w = rnd(2, l - 1), P = 2 * (l + w); return Q(`A rectangle has a perimeter of ${P} ft and a length of ${l} ft. What is its width?`, ft(w), [ft(P - l), ft(P / 2), ft(P - 2 * l)], () => ft(w + pick([1, 2, -1])), [`Perimeter = 2 × length + 2 × width, so ${P} = 2(${l}) + 2 × width.`, `${P} ${M} ${2 * l} = ${2 * w}, so 2 × width = ${2 * w}.`, `Width = ${2 * w} ÷ 2 = ${b(ft(w))}`]); }
  if (t === 'trap') { const b1 = rnd(3, 12), b2 = b1 + 2 * rnd(1, 6), h = rnd(2, 10), A = (b1 + b2) * h / 2; return Q(`A trapezoid has parallel sides of ${b1} ft and ${b2} ft and a height of ${h} ft. What is its area?`, sqU(A), [sqU((b1 + b2) * h), sqU(b1 * b2 * h / 2), sqU(b1 * h + b2)], () => sqU(A + pick([-h, h, 2])), [`Area of a trapezoid = ${fr(1, 2)} × (base₁ + base₂) × height.`, `${b1} + ${b2} = ${b1 + b2}.`, `${fr(1, 2)} × ${b1 + b2} × ${h} = ${b(sqU(A))}`]); }
  const l = rnd(10, 40), w = rnd(8, 30), cost = pick([2, 3, 4, 5, 6]), P = 2 * (l + w);
  return Q(`A yard is ${l} ft by ${w} ft. Fencing costs ${money(cost * 100)} per foot. How much does it cost to fence the whole yard?`, money(P * cost * 100), [money(l * w * cost * 100), money((l + w) * cost * 100), money(P * 100)], () => money((P * cost + pick([-10, 10, 20])) * 100), ['Fencing goes around the edge, so find the perimeter first.', `Perimeter = 2(${l}) + 2(${w}) = ${P} ft.`, `Cost = ${P} × ${money(cost * 100)} = ${b(money(P * cost * 100))}`]);
}

function genCircle(d) {
  const pi = (k) => (k === 1 ? 'π' : num(k) + 'π');
  const t = d === 1 ? pick(['Cr', 'Ar']) : d === 2 ? pick(['Ad', 'Cd', 'Ar']) : pick(['num', 'rFromA', 'rFromC']);
  if (t === 'Cr') { const r = rnd(2, 15); return Q(`What is the circumference of a circle with radius ${r}?`, pi(2 * r), [pi(r * r), pi(r), pi(4 * r)], () => pi(2 * r + pick([-2, 2])), ['Circumference (distance around) = 2πr.', `2 × π × ${r} = ${b(pi(2 * r))}`]); }
  if (t === 'Ar') { const r = rnd(2, 12); return Q(`What is the area of a circle with radius ${r}?`, pi(r * r), [pi(2 * r), pi(r), pi(4 * r * r)], () => pi(r * r + pick([-r, r])), ['Area of a circle = πr² (r = radius).', `π × ${r}² = π × ${r * r} = ${b(pi(r * r))}`]); }
  if (t === 'Ad') { const r = rnd(2, 10), D = 2 * r; return Q(`A circle has a diameter of ${D}. What is its area?`, pi(r * r), [pi(D * D), pi(D), pi(2 * r * r)], () => pi(r * r + pick([-2, 2, r])), ['The radius is half the diameter.', `r = ${D} ÷ 2 = ${r}.`, `Area = πr² = π × ${r * r} = ${b(pi(r * r))}. (Using ${D} instead of ${r} would give ${pi(D * D)} — a trap.)`]); }
  if (t === 'Cd') { const D = rnd(3, 20); return Q(`A circle has a diameter of ${D}. What is its circumference?`, pi(D), [pi(2 * D), pi(D * D / 4), pi(D / 2)], () => pi(D + pick([-1, 1, 3])), ['Circumference = πd (or 2πr — the same thing, because d = 2r).', `π × ${D} = ${b(pi(D))}`]); }
  if (t === 'num') { const r = pick([1, 2, 3, 5, 10, 20]), area = Math.random() < 0.5; const v = area ? 3.14 * r * r : 2 * 3.14 * r;
    return Q(`Using π ≈ 3.14, what is the ${area ? 'area' : 'circumference'} of a circle with radius ${r}?`, decStr(v, 2), [decStr(area ? 2 * 3.14 * r : 3.14 * r * r, 2), decStr(3.14 * r, 2), decStr(v * 2, 2)].filter((s) => s !== decStr(v, 2)), () => decStr(v + pick([3.14, -3.14, 1]), 2), [area ? 'Area = πr².' : 'Circumference = 2πr.', area ? `3.14 × ${r}² = 3.14 × ${r * r} = ${b(decStr(v, 2))}` : `2 × 3.14 × ${r} = ${b(decStr(v, 2))}`]); }
  if (t === 'rFromA') { const r = rnd(2, 12); return NQ(`A circle has an area of ${pi(r * r)}. What is its radius?`, r, [r * r / 2, 2 * r, r * r], [`Area = πr², so πr² = ${pi(r * r)}.`, `r² = ${r * r}, so r = √${r * r} = ${b(r)}.`], { min: 1 }); }
  const r = rnd(2, 15); return NQ(`A circle has a circumference of ${pi(2 * r)}. What is its radius?`, r, [2 * r, r * r, r / 2 === Math.floor(r / 2) ? r / 2 : r + 1], [`Circumference = 2πr, so 2πr = ${pi(2 * r)}.`, `Divide by 2π: r = ${b(r)}.`], { min: 1 });
}

function genPyth(d) {
  const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
  const [a0, b0, c0] = pick(triples), k = d === 1 ? pick([1, 1, 2]) : rnd(1, 4);
  const a = a0 * k, c = b0 * k, h = c0 * k;
  if (d === 3 && Math.random() < 0.4) { const p = rnd(1, 5), q = rnd(p + 1, 7); const s = p * p + q * q; if (Number.isInteger(Math.sqrt(s))) return genPyth(d);
    return Q(`A right triangle has legs of ${p} and ${q}. What is the length of the hypotenuse?`, `√${s}`, [`${p + q}`, `√${p + q}`, `${s}`], () => `√${s + pick([1, 2, -1])}`, ['Pythagorean theorem: a² + b² = c² (c is the longest side, across from the right angle).', `${p}² + ${q}² = ${p * p} + ${q * q} = ${s}.`, `c = ${b('√' + s)} (it does not simplify to a whole number).`]); }
  const findLeg = d >= 2 && Math.random() < 0.5;
  if (findLeg) return NQ(`A right triangle has a hypotenuse of ${h} and one leg of ${a}. How long is the other leg?`, c, [h - a, h + a, Math.round(Math.sqrt(h * h + a * a))], ['a² + b² = c², so b² = c² − a².', `${h}² ${M} ${a}² = ${h * h} ${M} ${a * a} = ${c * c}.`, `b = √${c * c} = ${b(c)}.`], { min: 1 });
  const word = d === 3 ? `A ${h}-foot ladder... ` : '';
  if (d === 3) return NQ(`A ladder leans against a wall. Its bottom is ${a} ft from the wall and it reaches ${c} ft up the wall. How long is the ladder?`, h, [a + c, h + 1, Math.abs(c - a)], ['The wall, ground and ladder form a right triangle; the ladder is the hypotenuse.', `${a}² + ${c}² = ${a * a} + ${c * c} = ${h * h}.`, `Ladder = √${h * h} = ${b(h)} ft.`], { min: 1 });
  return NQ(`A right triangle has legs of ${a} and ${c}. How long is the hypotenuse?`, h, [a + c, a * a + c * c, h + 2], ['Pythagorean theorem: a² + b² = c².', `${a}² + ${c}² = ${a * a} + ${c * c} = ${h * h}.`, `c = √${h * h} = ${b(h)}.`, `(Tip: ${a0}-${b0}-${c0} triangles and their multiples show up often.)`], { min: 1 });
}

function genVolume(d) {
  const cu = (v) => num(v) + ' cubic in', pi = (k) => (k === 1 ? 'π' : num(k) + 'π') + ' cubic in';
  const t = d === 1 ? pick(['box', 'cube']) : d === 2 ? pick(['cyl', 'missing', 'box']) : pick(['sa', 'cylD', 'cubeSA']);
  if (t === 'box') { const l = rnd(2, 12), w = rnd(2, 10), h = rnd(2, 10); return Q(`A box is ${l} in long, ${w} in wide and ${h} in tall. What is its volume?`, cu(l * w * h), [cu(l + w + h), cu(2 * (l * w + l * h + w * h)), cu(l * w)], () => cu(l * w * h + pick([-l, w, h * 2])), ['Volume of a box = length × width × height.', `${l} × ${w} × ${h} = ${b(cu(l * w * h))}`]); }
  if (t === 'cube') { const s = rnd(2, 10); return Q(`A cube has edges of ${s} in. What is its volume?`, cu(s ** 3), [cu(3 * s), cu(s * s), cu(6 * s * s)], () => cu(s ** 3 + pick([-s, s])), ['Volume of a cube = side × side × side = s³.', `${s} × ${s} × ${s} = ${b(cu(s ** 3))}`]); }
  if (t === 'cyl') { const r = rnd(2, 6), h = rnd(2, 10); return Q(`A cylinder has a radius of ${r} in and a height of ${h} in. What is its volume?`, pi(r * r * h), [pi(2 * r * h), pi(r * h), pi(4 * r * r * h)], () => pi(r * r * h + pick([-h, h])), ['Volume of a cylinder = πr²h (area of the circle × height).', `π × ${r}² × ${h} = π × ${r * r} × ${h} = ${b(pi(r * r * h))}`]); }
  if (t === 'cylD') { const r = rnd(2, 5), D = 2 * r, h = rnd(2, 10); return Q(`A can has a diameter of ${D} in and a height of ${h} in. What is its volume?`, pi(r * r * h), [pi(D * D * h), pi(D * h), pi(r * h)], () => pi(r * r * h + pick([-h, h])), [`The radius is half the diameter: r = ${r}.`, `Volume = πr²h = π × ${r * r} × ${h} = ${b(pi(r * r * h))}`]); }
  if (t === 'missing') { const l = rnd(2, 10), w = rnd(2, 8), h = rnd(2, 9), V = l * w * h; return NQ(`A box has a volume of ${V} cubic inches. It is ${l} in long and ${w} in wide. How tall is it?`, h, [V - l - w, V / l, h + 2], ['Volume = length × width × height, so height = volume ÷ (length × width).', `${l} × ${w} = ${l * w}.`, `${V} ÷ ${l * w} = ${b(h)} in.`], { min: 1, fmt: (v) => num(v) + ' in' }); }
  if (t === 'cubeSA') { const s = rnd(2, 9); return Q(`What is the surface area of a cube with edges of ${s} in?`, num(6 * s * s) + ' sq in', [num(s ** 3) + ' sq in', num(4 * s * s) + ' sq in', num(6 * s) + ' sq in'], () => num(6 * s * s + pick([-s, s])) + ' sq in', ['A cube has 6 square faces.', `One face: ${s} × ${s} = ${s * s}.`, `6 × ${s * s} = ${b(num(6 * s * s) + ' sq in')}`]); }
  const l = rnd(2, 10), w = rnd(2, 8), h = rnd(2, 8), SA = 2 * (l * w + l * h + w * h);
  return Q(`What is the surface area of a box that is ${l} in by ${w} in by ${h} in?`, num(SA) + ' sq in', [num(l * w * h) + ' sq in', num(SA / 2) + ' sq in', num(l * w + l * h + w * h + l) + ' sq in'], () => num(SA + pick([-4, 4, 8])) + ' sq in', ['Surface area adds up all 6 faces: 2(lw + lh + wh).', `lw = ${l * w}, lh = ${l * h}, wh = ${w * h}.`, `2 × (${l * w} + ${l * h} + ${w * h}) = 2 × ${l * w + l * h + w * h} = ${b(num(SA) + ' sq in')}`]);
}

function genCoord(d) {
  const X = '<i>x</i>', Y = '<i>y</i>';
  const t = d === 1 ? pick(['slopeEq', 'intercept']) : d === 2 ? pick(['slope2', 'mid', 'slopeEq']) : pick(['std', 'dist', 'slope2']);
  const pt = (x, y) => `(${num(x)}, ${num(y)})`;
  if (t === 'slopeEq' || t === 'intercept') { const m = H.nz(-6, 6), c = H.nz(-9, 9), eq = `${Y} = ${poly([m, c], X)}`;
    if (t === 'slopeEq') return NQ(`What is the slope of the line ${eq}?`, m, [c, -m, m + c], [`A line written as ${Y} = m${X} + b has slope m and y-intercept b.`, `Here m = ${b(num(m))}.`]);
    return NQ(`Where does the line ${eq} cross the y-axis (the y-intercept)?`, c, [m, -c, c + m], [`In ${Y} = m${X} + b, b is the y-intercept (where ${X} = 0).`, `Here b = ${b(num(c))}.`]); }
  if (t === 'slope2') { const x1 = rnd(-6, 6), y1 = rnd(-6, 6); let dx = H.nz(-6, 6), dy = H.nz(-8, 8); const x2 = x1 + dx, y2 = y1 + dy;
    const s = H.fimp(dy, dx);
    return Q(`What is the slope of the line through ${pt(x1, y1)} and ${pt(x2, y2)}?`, s, [H.fimp(dx, dy), H.fimp(-dy, dx), H.fimp(y2 + y1, x2 + x1 || 1)], () => H.fimp(dy + pick([-1, 1, 2]), dx), [`Slope = rise ÷ run = (y₂ ${M} y₁) ÷ (x₂ ${M} x₁).`, `(${num(y2)} ${M} ${sn(y1)}) ÷ (${num(x2)} ${M} ${sn(x1)}) = ${num(dy)} ÷ ${num(dx)}.`, `Slope = ${b(s)}`]); }
  if (t === 'mid') { const x1 = rnd(-8, 8), y1 = rnd(-8, 8), x2 = x1 + 2 * rnd(-5, 5), y2 = y1 + 2 * rnd(-5, 5); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return Q(`What is the midpoint between ${pt(x1, y1)} and ${pt(x2, y2)}?`, pt(mx, my), [pt(x2 - x1, y2 - y1), pt(my, mx), pt(x1 + x2, y1 + y2)], () => pt(mx + pick([-1, 1]), my + pick([-1, 1])), ['Midpoint = (average of the x\'s, average of the y\'s).', `x: (${num(x1)} + ${sn(x2)}) ÷ 2 = ${num(mx)}.  y: (${num(y1)} + ${sn(y2)}) ÷ 2 = ${num(my)}.`, `Midpoint = ${b(pt(mx, my))}`]); }
  if (t === 'std') { const A = rnd(1, 6), B = pick([1, 2, 3, 4, 5, 6].filter((v) => v !== A)), C = A * B * rnd(-2, 3) || A * B; const s = H.fimp(-A, B);
    return Q(`What is the slope of the line ${poly([A, 0], X)} + ${B === 1 ? '' : B}${Y} = ${num(C)}?`, s, [H.fimp(A, B), H.fimp(-B, A), H.fimp(C, B)], () => H.fimp(-A + pick([1, -1]), B), [`Solve for ${Y} to get the form ${Y} = m${X} + b.`, `${B === 1 ? '' : B}${Y} = ${poly([-A, C], X)}.`, B === 1 ? `Already solved: the slope is ${b(s)}.` : `Divide by ${B}: ${Y} = ${H.fimp(-A, B)}${X} + ${H.fimp(C, B)}. The slope is ${b(s)}.`]); }
  const [a0, b0, c0] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]]), x1 = rnd(-5, 5), y1 = rnd(-5, 5), x2 = x1 + a0 * pick([1, -1]), y2 = y1 + b0 * pick([1, -1]);
  return NQ(`What is the distance between ${pt(x1, y1)} and ${pt(x2, y2)}?`, c0, [a0 + b0, c0 * c0, c0 + 1], [`The horizontal change is ${a0} and the vertical change is ${b0}. These are the legs of a right triangle.`, `Distance = √(${a0}² + ${b0}²) = √${c0 * c0} = ${b(c0)}.`], { min: 1 });
}

// ---------- the course ----------
const UNITS = [
  { id: 1, title: 'Number Basics', blurb: 'The tools every other skill is built on. No calculators on the ASVAB, so these must be fast.' },
  { id: 2, title: 'Fractions, Decimals & Percents', blurb: 'The heart of Arithmetic Reasoning.' },
  { id: 3, title: 'Word Problems', blurb: 'Arithmetic Reasoning: turning a story into math.' },
  { id: 4, title: 'Algebra', blurb: 'Mathematics Knowledge: letters, equations and polynomials.' },
  { id: 5, title: 'Geometry', blurb: 'Mathematics Knowledge: angles, area, circles, volume and graphs.' },
];
const L = (id, unit, title, gen, why, rules, tip, sec) => ({ id, unit, title, gen, why, rules, tip, sec });
const LEVELS = [
  L('add', 1, 'Adding Whole Numbers', G.genAdd, 'Every word problem ends with arithmetic. Fast, accurate adding saves time for the hard questions.', ['Line numbers up by place value: ones under ones, tens under tens.', 'Start on the right. If a column adds to 10 or more, write the ones digit and carry 1 to the next column.'], 'Estimate first (round to the nearest 10 or 100). If your answer is far from the estimate, recheck.', 'AR'),
  L('sub', 1, 'Subtracting Whole Numbers', G.genSub, 'Subtraction with borrowing shows up in almost every money and distance problem.', ['Put the bigger number on top and start with the ones.', 'If the top digit is smaller, borrow 1 from the next column: the top digit gets 10 more, the next digit goes down by 1.', 'Check by adding your answer to the number you subtracted.'], 'Always check subtraction with addition. It takes five seconds.', 'AR'),
  L('mul', 1, 'Multiplying', G.genMul, 'Multiplication facts up to 12 × 12 need to be automatic. The ASVAB does not allow a calculator.', ['Know your times tables to 12 × 12.', 'For bigger numbers, break one number into tens and ones, multiply each part, then add the results.'], 'Practice the facts you miss most. Speed here buys time later.', 'AR'),
  L('div', 1, 'Dividing', G.genDiv, 'Division turns totals into "per" amounts: per hour, per person, per item.', ['Division asks: how many times does the divisor fit?', 'Take out big chunks (like 10 groups) first, then smaller ones, and add the chunks.', 'Check: quotient × divisor = the number you started with.'], 'Multiply back to check. If it does not match, you know right away.', 'AR'),
  L('order', 1, 'Order of Operations', G.genOrder, 'Mathematics Knowledge questions test whether you do the steps in the right order.', ['P – Parentheses first.', 'E – Exponents.', 'M/D – Multiply and divide, left to right.', 'A/S – Add and subtract, left to right.'], 'Remember "Please Excuse My Dear Aunt Sally." Never just go left to right.', 'MK'),
  L('neg', 1, 'Negative Numbers', G.genNeg, 'Negatives appear in algebra, temperatures and money owed.', ['Same signs: add the sizes and keep the sign.', 'Different signs: subtract the sizes and keep the sign of the bigger one.', 'Subtracting a negative is the same as adding a positive.', 'Multiply/divide: same signs → positive, different signs → negative.'], 'Put negative numbers in parentheses when you write them down so you do not lose the sign.', 'MK'),
  L('factors', 2, 'Factors, Primes, GCF & LCM', G.genFactors, 'You need GCF to simplify fractions and LCM to add them.', ['A factor divides a number evenly. A prime number has exactly two factors: 1 and itself.', 'GCF (greatest common factor): the biggest number that divides both.', 'LCM (least common multiple): the smallest number both divide into.'], '1 is not prime. 2 is the only even prime.', 'MK'),
  L('simplify', 2, 'Simplifying Fractions', G.genSimplify, 'Answer choices are almost always in simplest form, so you must recognize equal fractions.', ['Divide the top and bottom by the same number (their GCF).', 'Equal fractions: whatever you multiply the bottom by, multiply the top by the same.'], 'If both numbers are even, you can always divide by 2 to start.', 'AR'),
  L('fracadd', 2, 'Adding & Subtracting Fractions', G.genFracAdd, 'Common in recipes, measurements and "how much is left" problems.', ['You can only add or subtract fractions with the same bottom number (denominator).', 'Find the least common denominator, rewrite each fraction, then add or subtract the tops.', 'Never add the bottoms together.', 'Simplify the answer.'], 'Improper fractions (top bigger than bottom) are usually written as mixed numbers.', 'AR'),
  L('fracmul', 2, 'Multiplying & Dividing Fractions', G.genFracMul, 'Shows up in scaling, sharing and "part of a part" problems.', ['Multiply: top × top and bottom × bottom.', 'Divide: Keep the first, Change ÷ to ×, Flip the second (Keep-Change-Flip).', 'Change mixed numbers to improper fractions first.'], 'You do not need common denominators to multiply or divide.', 'MK'),
  L('decimal', 2, 'Decimals', G.genDecimal, 'Money is decimals. Many answer choices are decimals.', ['Add/subtract: line up the decimal points.', 'Multiply: multiply as whole numbers, then count the decimal places in the problem and put that many in the answer.', 'A fraction is top ÷ bottom. Learn ½ = 0.5, ¼ = 0.25, ¾ = 0.75, ⅕ = 0.2, ⅛ = 0.125.'], 'Memorize the common fraction-decimal pairs. They save a lot of work.', 'AR'),
  L('percent', 2, 'Percents', G.genPercent, 'Percent questions are among the most common on Arithmetic Reasoning.', ['Percent means "out of 100": 35% = 0.35.', '"Of" means multiply: 20% of 60 = 0.20 × 60.', 'Part ÷ whole × 100 = percent.', 'If you know the part and the percent, whole = part ÷ percent (as a decimal).'], '10% of a number: move the decimal one place left. Build other percents from that.', 'AR'),
  L('ratio', 2, 'Ratios & Proportions', G.genRatio, 'Ratios and "if this, then that" proportions are classic word problems.', ['A ratio a:b compares two amounts. Simplify it like a fraction.', 'To split a total in a ratio, add the parts to find how many equal pieces there are.', 'Proportion: find the amount for 1 (unit rate), then multiply. Or cross-multiply.'], 'Write units next to numbers so you set up the proportion the right way round.', 'AR'),
  L('expo', 2, 'Exponents & Square Roots', G.genExpo, 'Exponents and roots are core Mathematics Knowledge.', ['An exponent tells how many times to multiply a number by itself: 3⁴ = 3 × 3 × 3 × 3.', 'A square root undoes squaring: √49 = 7.', 'Simplify roots by pulling out perfect squares: √50 = √25 × √2 = 5√2.', '(−3)² = 9 but −3² = −9.'], 'Know the perfect squares from 1² to 15² by heart.', 'MK'),
  L('words', 3, 'Translating Words into Math', genWords, 'Arithmetic Reasoning is word problems. The first skill is turning words into an equation.', ['"Is" means =. "Of" means ×. "Per" means ÷.', '"More than, increased by, sum, total" → +.', '"Less than, decreased by, difference" → −. "5 less than n" is n − 5.', 'Let a letter stand for the unknown, write the equation, solve.'], 'Underline what the question is actually asking for before you start.', 'AR'),
  L('average', 3, 'Averages', genAverage, 'Average questions show up on almost every ASVAB.', ['Average (mean) = sum of the values ÷ number of values.', 'Total needed = desired average × number of values.', 'Missing value = total needed − sum of the values you have.'], 'If you know the average and the count, you know the total. Work from the total.', 'AR'),
  L('rate', 3, 'Rates, Distance & Time', genRate, 'Distance, speed and unit-price problems are ASVAB favorites.', ['Distance = rate × time (d = rt).', 'Rate = distance ÷ time. Time = distance ÷ rate.', 'Unit price = total cost ÷ number of items.', '0.5 hour = 30 minutes; 0.25 hour = 15 minutes.'], 'Check that your units match: miles per HOUR needs time in hours.', 'AR'),
  L('money', 3, 'Discounts, Tax, Percent Change & Interest', genMoney, 'Money word problems are a big part of Arithmetic Reasoning.', ['Sale price = price − (discount % × price).', 'Total with tax = price + (tax % × price).', 'Percent change = (new − original) ÷ ORIGINAL × 100.', 'Simple interest: I = P × r × t (principal × rate × years).'], 'Two discounts in a row are NOT added together; take the second one from the new price.', 'AR'),
  L('work', 3, 'Work, Age & Number Puzzles', genWork, 'These are the trickier word problems that separate good scores from great ones.', ['Combined work: add the rates (jobs per hour). Two people: time = (A × B) ÷ (A + B).', 'Age and "how many" puzzles: let one unknown be x, write the other in terms of x, add them up.'], 'Working together is always faster than the faster person alone. Use that to eliminate choices.', 'AR'),
  L('armix', 3, 'Word Problem Mix', genARmix, 'A mixed set, just like the real Arithmetic Reasoning section.', ['1. Read the whole problem and find what it asks.', '2. Pick out the numbers you need (some are extra).', '3. Choose the operation or formula.', '4. Solve, then check the answer makes sense.'], 'Eliminate answers that are clearly too big or too small before calculating.', 'AR'),
  L('expr', 4, 'Expressions', genExpr, 'Mathematics Knowledge starts with working comfortably with letters.', ['Evaluate: replace the letter with the number, then follow order of operations.', 'Combine like terms: add the numbers in front of the same letter (3x + 2x = 5x).', 'Distribute: a(b + c) = ab + ac. Multiply EVERY term inside.'], 'Put substituted numbers in parentheses, especially negatives.', 'MK'),
  L('equation', 4, 'Solving Equations', genEquation, 'Solving for x is one of the most tested skills on Mathematics Knowledge.', ['Whatever you do to one side, do to the other.', 'Undo in reverse order: first add/subtract, then multiply/divide.', 'Get all the x terms on one side and the numbers on the other.', 'Check by putting your answer back in.'], 'On a multiple-choice test you can also plug each answer in to see which works.', 'MK'),
  L('ineq', 4, 'Inequalities', genIneq, 'Inequalities are solved like equations, with one extra rule.', ['> greater than, < less than, ≥ greater than or equal, ≤ less than or equal.', 'Solve just like an equation.', 'If you multiply or divide by a NEGATIVE number, flip the inequality sign.'], 'Test a number: pick a value that fits your answer and check it in the original.', 'MK'),
  L('exprules', 4, 'Exponent Rules & Scientific Notation', genExpRules, 'Exponent rules let you simplify quickly instead of multiplying everything out.', ['Multiply same base: add exponents (x² · x³ = x⁵).', 'Divide same base: subtract exponents.', 'Power of a power: multiply exponents ((x²)³ = x⁶).', 'x⁰ = 1, and x⁻² = 1/x².', 'Scientific notation: a number from 1 to 10 × a power of 10.'], 'Positive power of 10 → big number (decimal moves right). Negative power → small number (moves left).', 'MK'),
  L('poly', 4, 'Multiplying & Factoring Polynomials', genPoly, 'FOIL and factoring are standard Mathematics Knowledge questions.', ['FOIL: First, Outer, Inner, Last, then combine like terms.', 'To factor x² + bx + c, find two numbers that multiply to c and add to b.', 'Check a factoring answer by FOILing it back out.'], 'Watch the signs: if c is positive, both numbers have the same sign as b.', 'MK'),
  L('quad', 4, 'Quadratic Equations', genQuad, 'Quadratics combine factoring and solving.', ['Get one side to 0, then factor.', 'If a × b = 0, then a = 0 or b = 0. Set each factor to 0.', 'x² = k has two answers: √k and −√k.', 'If there is no number term, factor out x: one answer is x = 0.'], 'Plug the answer choices in. The right one makes the equation equal 0.', 'MK'),
  L('angles', 5, 'Angles & Triangles', genAngles, 'Geometry is a large share of Mathematics Knowledge.', ['Complementary angles add to 90°. Supplementary angles add to 180°.', 'A triangle\'s angles add to 180°. A quadrilateral\'s add to 360°.', 'Isosceles triangle: two equal sides and two equal base angles.', 'Interior angles of an n-sided polygon add to (n − 2) × 180°.'], 'Complementary = Corner (90°). Supplementary = Straight (180°).', 'MK'),
  L('area', 5, 'Perimeter & Area', genArea, 'Area and perimeter questions are among the most common in geometry.', ['Perimeter = distance around (add all sides).', 'Rectangle area = length × width. Square = side².', 'Triangle area = ½ × base × height.', 'Parallelogram = base × height. Trapezoid = ½ × (base₁ + base₂) × height.'], 'Perimeter is in feet; area is in SQUARE feet. Check which one the question wants.', 'MK'),
  L('circle', 5, 'Circles', genCircle, 'Circle formulas come up on nearly every Mathematics Knowledge section.', ['Diameter = 2 × radius.', 'Circumference = 2πr = πd.', 'Area = πr².', 'π ≈ 3.14 when a number answer is needed.'], 'Biggest trap: using the diameter in the area formula. Halve it first.', 'MK'),
  L('pyth', 5, 'Pythagorean Theorem', genPyth, 'Right triangles appear in many geometry and word problems.', ['In a right triangle: a² + b² = c², where c is the longest side (hypotenuse).', 'To find a leg: b² = c² − a².', 'Common triples: 3-4-5, 5-12-13, 8-15-17, 7-24-25, and their multiples (6-8-10).'], 'Spot a triple and you can skip the math.', 'MK'),
  L('volume', 5, 'Volume & Surface Area', genVolume, 'Volume questions test whether you know the formulas and the units.', ['Box volume = length × width × height. Cube = s³.', 'Cylinder volume = πr²h.', 'Surface area of a box = 2(lw + lh + wh). Cube = 6s².', 'Volume is in CUBIC units; surface area is in SQUARE units.'], 'If a problem gives the diameter, halve it before using r.', 'MK'),
  L('coord', 5, 'Lines & the Coordinate Plane', genCoord, 'Slope and graphs round out the Mathematics Knowledge topics.', ['Slope = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁).', 'y = mx + b: m is the slope, b is where the line crosses the y-axis.', 'Midpoint = (average of x\'s, average of y\'s).', 'Distance: make a right triangle and use a² + b² = c².'], 'Positive slope goes up to the right; negative slope goes down.', 'MK'),
];

// Unit checkpoints: a mixed quiz over the whole unit
for (const u of UNITS) {
  const unitLevels = LEVELS.filter((l) => l.unit === u.id);
  const at = LEVELS.indexOf(unitLevels[unitLevels.length - 1]) + 1;
  LEVELS.splice(at, 0, { id: 'check' + u.id, unit: u.id, title: `Unit ${u.id} Checkpoint`, checkpoint: true, gens: unitLevels.map((l) => l.gen),
    gen: (dd) => pick(unitLevels).gen(dd), why: `A mixed review of everything in "${u.title}". Pass it to unlock the next unit.`, rules: unitLevels.map((l) => l.title), tip: 'Mixed practice is harder than one topic at a time, and much closer to the real test.', sec: unitLevels[0].sec });
}

const TESTS = {
  AR: { id: 'AR', name: 'Arithmetic Reasoning', short: 'AR', count: 15, minutes: 55, gens: [G.genPercent, G.genRatio, genWords, genAverage, genRate, genMoney, genWork, genMoney, genRate], unlockAfter: 'check3', about: 'Word problems. On the computer ASVAB this section is 15 scored questions in 55 minutes.' },
  MK: { id: 'MK', name: 'Mathematics Knowledge', short: 'MK', count: 15, minutes: 31, gens: [G.genFactors, G.genFracMul, G.genExpo, genExpr, genEquation, genIneq, genExpRules, genPoly, genQuad, genAngles, genArea, genCircle, genPyth, genVolume, genCoord, genEquation, genArea], unlockAfter: 'check5', about: 'Algebra and geometry. On the computer ASVAB this section is about 16 questions in 20 minutes.' },
};

const CFG = {
  app: 'ASVAB Math', key: 'asvabMath.v1', sections: { AR: 'Arithmetic Reasoning', MK: 'Mathematics Knowledge' }, guided: true, hasVideo: true,
  otherApp: { name: 'ASVAB English', url: 'https://asvab-english.vercel.app' },
  practiceHint: 'Work it out on paper first. You can\'t use a calculator on the ASVAB.',
  testRules: ['No calculator. Use scratch paper, like the real test.', 'Like the computer ASVAB, you can\'t go back to change an answer.'],
  passingHTML: `<p>The ASVAB score the military uses to decide if you can enlist is the <b>AFQT</b>. It is built from four sections: the two math sections here, <b>Arithmetic Reasoning</b> and <b>Mathematics Knowledge</b>, plus two English sections (Word Knowledge and Paragraph Comprehension, which count double).</p>
    <p>The AFQT is a percentile from 1 to 99. Most branches require about <b>31 to 36</b> with a high school diploma, the Coast Guard asks for more, and many jobs need higher line scores. Check the current minimum with a recruiter.</p>
    <p><b>How to read your readiness:</b> 60% or more means you are on track for the math half; 75% or more gives you a comfortable cushion; 90% or more means you should pass the math sections with ease. For the English half, use the <a href="https://asvab-english.vercel.app">ASVAB English</a> app.</p>`,
  aboutHTML: `<p><b>What it covers:</b> the two ASVAB math sections, in 32 levels and 5 units, from adding whole numbers to geometry and algebra. Arithmetic Reasoning (word problems: percents, ratios, averages, rates, money, work) and Mathematics Knowledge (algebra, exponents, geometry, circles, volume, slope). Questions are made fresh every time, so you never run out of practice, and every question has 4 answer choices, like the real test.</p>
    <p><b>Timed tests:</b> the same length as the computer ASVAB: 15 Arithmetic Reasoning questions in 55 minutes and 15 Mathematics Knowledge questions in 31 minutes. The real test can add unscored tryout questions, with extra time for them.</p>`,
};
root.ASVAB = { UNITS, LEVELS, TESTS, H, CFG };
})(typeof window !== 'undefined' ? window : globalThis);
