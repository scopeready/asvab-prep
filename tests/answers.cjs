/* Independent answer check for ASVAB Math.
   For each generated question this reads only the QUESTION TEXT, works out the answer with its own arithmetic
   (it never looks at the generator's steps), and compares that with the choice the app marks as correct.
   It also checks that no wrong choice equals the right answer.
   Usage: node tests/answers.cjs [perLevel]      Prints coverage per level and every mismatch. */
const path = require('path'), root = path.join(__dirname, '..'), N = +process.argv[2] || 400;
global.window = globalThis;
for (const f of ['shared/viz.js', 'math/levels.js', 'math/levels2.js', 'math/figs.js']) require(path.join(root, f));
const { LEVELS } = globalThis.ASVAB, M = '−';

// ---- text helpers ----
const plain = (h) => String(h).replace(/<span class="fr"><span class="fn">(.*?)<\/span><span class="fd">(.*?)<\/span><\/span>/g, '(($1)/($2))')
  .replace(/<sup>(.*?)<\/sup>/g, '^($1)').replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
function toJS(s) {
  s = ' ' + s.replace(/\$/g, '').replace(/(\d),(?=\d{3})/g, '$1').replace(new RegExp(M, 'g'), '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/²/g, '^(2)').replace(/³/g, '^(3)') + ' ';
  s = s.replace(/(\d+)\s+\(\((\d+)\)\/\((\d+)\)\)/g, '($1+$2/$3)');                 // mixed number: 1 (3/5)
  s = s.replace(/(\d|\))\s*(?=[a-zπ√(])/g, '$1*').replace(/([a-zπ])\s*(?=[a-zπ√(\d])/g, '$1*').replace(/\)\s*(?=[\d(a-zπ√])/g, ')*'); // implicit ×
  s = s.replace(/\*\s*\^/g, '^').replace(/\^\*/g, '^').replace(/√\*\(/g, '√(');
  for (let i = 0; i < 6; i++) s = s.replace(/(\((?:[^()]|\([^()]*\))*\)|[a-z]|\d+(?:\.\d+)?)\s*\^\s*(\((?:[^()]|\([^()]*\))*\)|-?\d+|[a-z])/g, 'P($1,$2)');
  s = s.replace(/√\s*(\d+(?:\.\d+)?)/g, 'S($1)').replace(/√\s*\(/g, 'S(').replace(/π/g, 'PI');
  return s;
}
function ev(s, vars = {}) {
  try { const js = toJS(s); if (/[^0-9a-zA-Z+\-*/().,\s]/.test(js)) return NaN;
    const names = Object.keys(vars); return Function(...names, 'P', 'S', 'PI', `"use strict"; return (${js});`)(...names.map((k) => vars[k]), Math.pow, Math.sqrt, Math.PI);
  } catch (e) { return NaN; }
}
const eq = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
const UNIT = /\s*(sq\.?\s+|square\s+|cubic\s+)?(ft|feet|foot|in|inch(es)?|m|meters?|cm|yd|yards?|mi|miles?|hours?|gallons?|minutes?|mph|years?( old)?|units?|pens?|stamps?|each|degrees?|people|students?|items?|problems?|pages?|laps?|boxes|cups?|pounds?|lb|oz|tests?|points?)\b.*$/i;
const val = (c, vars) => ev(plain(c).replace(/^[a-z] = /i, '').replace(/[°%]/g, '').replace(UNIT, ''), vars);
const nums = (t) => (t.match(new RegExp(`${M}?\\$?\\d[\\d,]*(?:\\.\\d+)?`, 'g')) || []).map((x) => parseFloat(x.replace(/[$,]/g, '').replace(M, '-')));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a)), lcm = (a, b) => a / gcd(a, b) * b;
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const frac = (c) => { const m = plain(c).match(/^(?:(\d+)\s+)?\(\((\d+)\)\/\((\d+)\)\)$/); return m ? { w: +(m[1] || 0), n: +m[2], d: +m[3] } : null; };
const lowest = (c) => { const f = frac(c); return !f || (gcd(f.n, f.d) === 1 && (f.w === 0 || f.n < f.d)); };
const same = (exprA, exprB, v = 'x') => [2, 3, -1.5, 0.7].every((x) => eq(ev(exprA, { [v]: x }), ev(exprB, { [v]: x })));

// ---- one independent solver per kind of question: returns the expected value, or a checker function, or undefined if not recognised ----
function expected(id, t, q) {
  let m; const PI = /π ≈ 3\.14/.test(t) ? 3.14 : Math.PI; t = t.replace(/^Using π ≈ 3\.14, w/, 'W');
  // plain arithmetic: "What is <expression>?"
  if ((m = t.match(/^What is (.+)\?$/)) && !/[a-z]{2}/i.test(m[1].replace(/of/g, ''))) {
    if ((m = t.match(/^What is ([\d.]+)% of ([\d,.$]+)\?$/))) return ev(m[1]) / 100 * ev(m[2]);
    const e = t.match(/^What is (.+)\?$/)[1]; if (!/[a-z]/i.test(e)) return ev(e);
  }
  if ((m = t.match(/^([\d,.]+) is what percent of ([\d,.]+)\?/))) return ev(m[1]) / ev(m[2]) * 100;
  if ((m = t.match(/^([\d,.]+) is ([\d.]+)% of what number\?/))) return ev(m[1]) / (ev(m[2]) / 100);
  // fractions and decimals
  if ((m = t.match(/^Write (\(\(\d+\)\/\(\d+\)\)) in simplest form/))) return (c) => eq(val(c), ev(m[1])) && lowest(c);
  if ((m = t.match(/^\(\((\d+)\)\/\((\d+)\)\) = \(\(\?\)\/\((\d+)\)\)/))) return +m[1] * +m[3] / +m[2];
  if ((m = t.match(/^\(\((\d+)\)\/\((\d+)\)\) = \(\((\d+)\)\/\(\?\)\)/))) return +m[2] * +m[3] / +m[1];
  if ((m = t.match(/^Write (\(\(\d+\)\/\(\d+\)\)) as a (decimal|percent)/))) return ev(m[1]) * (m[2] === 'percent' ? 100 : 1);
  if ((m = t.match(/^Write ([\d.]+)(%?) as a fraction in simplest form/))) return (c) => eq(val(c), ev(m[1]) / (m[2] ? 100 : 1)) && lowest(c);
  if ((m = t.match(/^Write ([\d.]+) as a percent/))) return ev(m[1]) * 100;
  if ((m = t.match(/^Write ([\d.]+)% as a decimal/))) return ev(m[1]) / 100;
  if ((m = t.match(/^Which (?:fraction|number) is (largest|greatest|smallest|biggest)\?/i))) { const vs = q.choices.map((c) => val(c)); return (c) => eq(val(c), /small/i.test(m[1]) ? Math.min(...vs) : Math.max(...vs)); }
  // factors and primes
  if ((m = t.match(/least common multiple \(LCM\) of (\d+) and (\d+)/))) return lcm(+m[1], +m[2]);
  if ((m = t.match(/greatest common factor \(GCF\) of (\d+) and (\d+)/))) return gcd(+m[1], +m[2]);
  if (/^Which of these numbers is prime\?/.test(t)) return (c) => isPrime(val(c)) && q.choices.filter((x) => isPrime(val(x))).length === 1;
  if (/^Which of these numbers is NOT prime\?/i.test(t)) return (c) => !isPrime(val(c)) && q.choices.filter((x) => !isPrime(val(x))).length === 1;
  if ((m = t.match(/prime factorization of (\d+)\?/))) return (c) => { const fs = plain(c).replace(/\^\((\d+)\)/g, '^$1').split(/\s*[×x]\s*/); let p = 1; for (const f of fs) { const [b, e] = f.split('^').map(Number); if (!isPrime(b)) return false; p *= Math.pow(b, e || 1); } return p === +m[1]; };
  if ((m = t.match(/How many factors does (\d+) have\?/))) { let k = 0; for (let i = 1; i <= +m[1]; i++) if (+m[1] % i === 0) k++; return k; }
  if ((m = t.match(/Which (?:of these )?(?:number )?is a factor of (\d+)\?/))) return (c) => +m[1] % val(c) === 0 && q.choices.filter((x) => +m[1] % val(x) === 0).length === 1;
  if ((m = t.match(/Which (?:of these )?(?:number )?is a multiple of (\d+)\?/))) return (c) => val(c) % +m[1] === 0 && q.choices.filter((x) => val(x) % +m[1] === 0).length === 1;
  // ratios and proportions
  if ((m = t.match(/has (\d+) (\w+) and (\d+) (\w+)\. What is the ratio of (\w+) to (\w+) in simplest form/))) { const a = m[5] === m[2] ? +m[1] : +m[3], b = m[5] === m[2] ? +m[3] : +m[1], g = gcd(a, b); return (c) => plain(c).replace(/\s/g, '') === `${a / g}:${b / g}`; }
  if ((m = t.match(/^If ([\d,.]+) .+? cost \$([\d,.]+), how much do ([\d,.]+) .+? cost/))) return ev(m[2]) / ev(m[1]) * ev(m[3]);
  if ((m = t.match(/ratio of .+? is (\d+):(\d+)\. (?:If )?there are (\d+) (\w+)[,.] how many (\w+)/i))) return undefined;
  if ((m = t.match(/ratio of (\w+) to (\w+) at .+? is (\d+):(\d+)\. There are (\d+) \w+ and \w+ in all\. How many (\w+) are there/))) return +m[5] * (m[6] === m[1] ? +m[3] : +m[4]) / (+m[3] + +m[4]);
  if ((m = t.match(/On a map, ([\d.]+) inch(?:es)? = ([\d,.]+) miles\. Two towns are ([\d.]+) inches apart on the map\. How far apart are they/))) return ev(m[3]) / ev(m[1]) * ev(m[2]);
  // powers and roots
  if ((m = t.match(/^What is the cube root of (\d+)/))) return Math.cbrt(+m[1]);
  if ((m = t.match(/^Write (.+) as a decimal\.$/)) && /10\^/.test(m[1])) return ev(m[1]);
  if ((m = t.match(/^√(\d+) is between which two whole numbers\?/))) { const r = Math.floor(Math.sqrt(+m[1])); return (c) => { const k = nums(plain(c)); return k[0] === r && k[1] === r + 1; }; }
  if ((m = t.match(/^Simplify √(\d+)\.$/))) return (c) => { const k = plain(c).match(/^(\d+)√(\d+)$/); if (!k) return eq(val(c), Math.sqrt(+m[1])) && Number.isInteger(Math.sqrt(+m[1])); for (let i = 2; i * i <= +k[2]; i++) if (+k[2] % (i * i) === 0) return false; return +k[1] * +k[1] * +k[2] === +m[1]; };
  if ((m = t.match(/^Write ([\d,.]+) in scientific notation\.$/))) return (c) => { const k = plain(c).match(/^([\d.]+) × 10\^\((.+)\)$/); return !!k && +k[1] >= 1 && +k[1] < 10 && eq(val(c), ev(m[1])); };
  if ((m = t.match(/^Write (.+) in standard form\.$/)) || (m = t.match(/^What is (.+) in standard form\?$/))) return ev(m[1]);
  // averages
  if ((m = t.match(/^What is the average of the (?:numbers|test scores|scores) ([\d, ]+)\?/))) { const v = nums(m[1].replace(/,\s*/g, ' ')); return v.reduce((a, b) => a + b, 0) / v.length; }
  if ((m = t.match(/scored ([\d, ]+) on the first (\d+) tests\. What score is needed on the next test to average exactly (\d+)\?/))) { const v = nums(m[1].replace(/,\s*/g, ' ')); return +m[3] * (v.length + 1) - v.reduce((a, b) => a + b, 0); }
  if ((m = t.match(/average of (\d+) numbers is (\d+)\. What is their sum/i))) return +m[1] * +m[2];
  // rates
  if ((m = t.match(/covers ([\d,.]+) miles in ([\d.]+) hours\. What is its average speed/))) return ev(m[1]) / +m[2];
  if ((m = t.match(/(?:goes|travels) ([\d,.]+) miles at ([\d.]+) miles per hour\. How (?:long does the trip take|many hours does the trip take)/))) return (c) => { const h = ev(m[1]) / +m[2], k = plain(c).match(/^(\d+) hours?(?: (\d+) minutes)?$/); return k ? eq(+k[1] + (+k[2] || 0) / 60, h) : eq(val(c), h); };
  if ((m = t.match(/travels at ([\d.]+) miles per hour for ([\d.]+) hours\. How many miles/))) return +m[1] * +m[2];
  if ((m = t.match(/(?:travels|drives|goes) ([\d,.]+) miles in ([\d.]+) hours\. What is (?:its|the|his|her) (?:average )?speed/))) return ev(m[1]) / +m[2];
  if ((m = t.match(/How long does it take to (?:travel|drive|go) ([\d,.]+) miles at ([\d.]+) miles per hour/))) return (c) => { const h = ev(m[1]) / +m[2], k = plain(c).match(/^(\d+) hours?(?: (\d+) minutes)?$/); return k ? eq(+k[1] + (+k[2] || 0) / 60, h) : eq(val(c), h); };
  if ((m = t.match(/pack of (\d+) .+? costs \$([\d.]+)\. What is the price per/))) return +m[2] / +m[1];
  if ((m = t.match(/gets ([\d.]+) miles per gallon\. How many gallons does it need to drive ([\d,.]+) miles/))) return ev(m[2]) / +m[1];
  if ((m = t.match(/(?:types|reads|makes|packs|prints) ([\d,.]+) (\w+) (?:in|every) ([\d.]+) (minutes|hours)\. (?:At that rate, )?how many \w+ .*?in ([\d.]+) (minutes|hours)/i))) return ev(m[1]) / +m[3] * +m[5] * (m[4] === m[6] ? 1 : m[6] === 'hours' ? 60 : 1 / 60);
  // money
  if ((m = t.match(/How much simple interest does \$([\d,.]+) earn at ([\d.]+)% per year for ([\d.]+) years/))) return ev(m[1]) * +m[2] / 100 * +m[3];
  if ((m = t.match(/went from \$([\d,.]+) to \$([\d,.]+)\. What was the percent (decrease|increase)/))) return Math.abs(ev(m[2]) - ev(m[1])) / ev(m[1]) * 100;
  if ((m = t.match(/costs? \$([\d,.]+)\. It is on sale for ([\d.]+)% off\. What is the sale price/))) return ev(m[1]) * (1 - +m[2] / 100);
  if ((m = t.match(/\$([\d,.]+) .+? has ([\d.]+)% sales tax\. What is the total cost/))) return ev(m[1]) * (1 + +m[2] / 100);
  if ((m = t.match(/put \$([\d,.]+) in an account that pays ([\d.]+)% simple interest per year\. How much is in the account after ([\d.]+) years/))) return ev(m[1]) * (1 + +m[2] / 100 * +m[3]);
  if ((m = t.match(/\$([\d,.]+) .+? is marked ([\d.]+)% off\. At the register you get an extra ([\d.]+)% off the sale price\. What do you pay/))) return ev(m[1]) * (1 - +m[2] / 100) * (1 - +m[3] / 100);
  if ((m = t.match(/(?:rose|rises|went up|increased|goes up) from \$?([\d,.]+) to \$?([\d,.]+)\. What is the percent (?:increase|change)/))) return (ev(m[2]) - ev(m[1])) / ev(m[1]) * 100;
  if ((m = t.match(/(?:fell|drops|dropped|went down|decreased|goes down) from \$?([\d,.]+) to \$?([\d,.]+)\. What is the percent (?:decrease|change)/))) return (ev(m[1]) - ev(m[2])) / ev(m[1]) * 100;
  if ((m = t.match(/earns \$([\d.]+) (?:an|per) hour.* works ([\d.]+) hours.*How much/))) return undefined;
  // number puzzles and translating words
  if ((m = t.match(/^([\d.]+) more than ([\d.]+) times a number is ([\d.]+)\. What is the number/))) return (+m[3] - +m[1]) / +m[2];
  if ((m = t.match(/^([\d.]+) less than ([\d.]+) times a number is ([\d.]+)\. What is the number/))) return (+m[3] + +m[1]) / +m[2];
  if ((m = t.match(/^When ([\d.]+) is added to a number, the result is ([\d.]+)/))) return +m[2] - +m[1];
  if ((m = t.match(/^A number decreased by ([\d.]+) is ([\d.]+)/))) return +m[1] + +m[2];
  if ((m = t.match(/^A number increased by ([\d.]+) is ([\d.]+)/))) return +m[2] - +m[1];
  if ((m = t.match(/sum of three consecutive integers is (\d+)\. What is the (smallest|largest|middle)/))) return +m[1] / 3 + { smallest: -1, middle: 0, largest: 1 }[m[2]];
  if ((m = t.match(/sum of two consecutive even integers is (\d+)\. What is the (larger|smaller)/))) return +m[1] / 2 + (m[2] === 'larger' ? 1 : -1);
  if ((m = t.match(/^Which expression means "(.+)"\?$/))) { const w = m[1].toLowerCase(), W = { twice: 2, 'three times': 3, 'four times': 4, 'five times': 5 }; let e, k;
    if ((k = w.match(/^([\d.]+) times the sum of a number n and ([\d.]+)$/))) e = `${k[1]}*(n+${k[2]})`;
    else if ((k = w.match(/^([\d.]+) less than a number n$/))) e = `n-${k[1]}`;
    else if ((k = w.match(/^([\d.]+) more than a number n$/))) e = `n+${k[1]}`;
    else if ((k = w.match(/^the product of ([\d.]+) and a number n, (increased|decreased) by ([\d.]+)$/))) e = `${k[1]}*n${k[2] === 'increased' ? '+' : '-'}${k[3]}`;
    else if ((k = w.match(/^(twice|three times|four times|five times) a number n, (increased|decreased) by ([\d.]+)$/))) e = `${W[k[1]]}*n${k[2] === 'increased' ? '+' : '-'}${k[3]}`;
    else if ((k = w.match(/^a number n divided by ([\d.]+), then (increased|decreased) by ([\d.]+)$/))) e = `n/${k[1]}${k[2] === 'increased' ? '+' : '-'}${k[3]}`;
    else if ((k = w.match(/^the sum of a number n and ([\d.]+), divided by ([\d.]+)$/))) e = `(n+${k[1]})/${k[2]}`;
    else if ((k = w.match(/^([\d.]+) less than (twice|three times|four times|five times) a number n$/))) e = `${W[k[2]]}*n-${k[1]}`;
    if (e) return (c) => same(e, plain(c), 'n') && q.choices.filter((x) => same(e, plain(x), 'n')).length === 1; }
  if ((m = t.match(/has (twice|three times|four times|five times) as many \w+ as \w+\. Together they have (\d+)\. How many \w+ does (\w+) have/))) { const k = { twice: 2, 'three times': 3, 'four times': 4, 'five times': 5 }[m[1]], small = +m[2] / (k + 1), first = t.match(/^(\w+) has/)[1]; return m[3] === first ? small * k : small; }
  if ((m = t.match(/^(\w+) is (\d+) years older than (\w+)\. Their ages add up to (\d+)\. How old is (\w+)\?/))) { const y = (+m[4] - +m[2]) / 2; return m[5] === m[1] ? y + +m[2] : y; }
  if ((m = t.match(/can .+? in (\d+) hours\. \w+ can .+? in (\d+) hours\. How long will it take if they work together/))) return (c) => { const h = +m[1] * +m[2] / (+m[1] + +m[2]), k = plain(c).match(/^(\d+) hours?(?: (\d+) minutes)?$/); return k ? eq(+k[1] + (+k[2] || 0) / 60, h) : eq(val(c), h); };
  if ((m = t.match(/^(Twice|Two times|Three times|Four times|Five times|Six times|Seven times|Eight times|Nine times) a number is (\d+)\. What is the number/))) return +m[2] / ({ Twice: 2, 'Two times': 2, 'Three times': 3, 'Four times': 4, 'Five times': 5, 'Six times': 6, 'Seven times': 7, 'Eight times': 8, 'Nine times': 9 }[m[1]]);
  if ((m = t.match(/sum of two consecutive (?:whole )?numbers is (\d+)\. What is the (smaller|larger)/))) return (+m[1] - 1) / 2 + (m[2] === 'larger' ? 1 : 0);
  // algebra
  if ((m = t.match(/^What is (.+) when ([a-z]) = (.+)\?$/))) return ev(m[1], { [m[2]]: ev(m[3]) });
  if ((m = t.match(/^If ([a-z]) = (.+?) and ([a-z]) = (.+?), what is (.+)\?$/))) return ev(m[5], { [m[1]]: ev(m[2]), [m[3]]: ev(m[4]) });
  if ((m = t.match(/^(?:Simplify|Expand|Multiply|Factor|Combine like terms): (.+)$/)) && /[a-z]/.test(m[1])) { const v = (m[1].match(/[a-z]/) || ['x'])[0]; return (c) => same(m[1], plain(c), v) && (!/^Factor/.test(t) || /\)\s*\(|^\w*\(/.test(plain(c))); }
  if ((m = t.match(/^Simplify: (.+)$/))) return ev(m[1]);
  if ((m = t.match(/^Solve: (.+?) = (.+)$/))) return (c) => { const roots = plain(c).replace(/[a-z] = /g, '').split(' or ').map((r) => ev(r)); const v = (t.match(/[a-z]/g) || []).find((ch) => /[a-z]/.test(ch) && !'Solve'.toLowerCase().includes(ch)) || 'x';
    const ok = roots.every((r) => eq(ev(m[1], { [v]: r }), ev(m[2], { [v]: r }))); if (!ok) return false;
    const quad = /\^|\)\s*\(|\)\*\(/.test(toJS(m[1])) || /[a-z]\(/.test(m[1]); let count = 0; const seen = []; for (let x = -60; x <= 60; x += 0.5) if (eq(ev(m[1], { [v]: x }), ev(m[2], { [v]: x })) && !seen.includes(x)) { seen.push(x); count++; } return quad ? count === 0 || count === new Set(roots).size : true; };
  if ((m = t.match(/^Solve: (.+?) (≤|≥|<|>) (.+)$/))) return (c) => { const k = plain(c).match(/^([a-z]) (≤|≥|<|>) (.+)$/); if (!k) return false; const b = ev(k[3]), v = k[1], holds = (x) => { const l = ev(m[1], { [v]: x }), r = ev(m[3], { [v]: x }); return m[2] === '≤' ? l <= r + 1e-9 : m[2] === '≥' ? l >= r - 1e-9 : m[2] === '<' ? l < r - 1e-9 : l > r + 1e-9; };
    const inside = /[≤<]/.test(k[2]) ? b - 1 : b + 1, outside = /[≤<]/.test(k[2]) ? b + 1 : b - 1; return eq(ev(m[1], { [v]: b }), ev(m[3], { [v]: b })) && holds(inside) && !holds(outside) && /[≤≥]/.test(k[2]) === /[≤≥]/.test(m[2]); };
  // angles
  if ((m = t.match(/complementary\. One is (\d+)°/))) return 90 - +m[1];
  if ((m = t.match(/supplementary\. One is (\d+)°/))) return 180 - +m[1];
  if ((m = t.match(/Two angles of a triangle are (\d+)° and (\d+)°\. What is the third/))) return 180 - +m[1] - +m[2];
  if ((m = t.match(/interior angles of (\d+)° and (\d+)°\. What is the exterior angle at the third corner/))) return +m[1] + +m[2];
  if ((m = t.match(/Two straight lines cross\. One of the angles formed is (\d+)°\. What is the angle right next to it/))) return 180 - +m[1];
  if ((m = t.match(/Two straight lines cross\. One of the angles formed is (\d+)°\. What is the angle (?:directly )?(?:across from|opposite)/))) return +m[1];
  if ((m = t.match(/isosceles triangle, the angle between the two equal sides is (\d+)°\. What is each of the other two/))) return (180 - +m[1]) / 2;
  if ((m = t.match(/Three angles of a four-sided figure are (\d+)°, (\d+)° and (\d+)°\. What is the fourth/))) return 360 - +m[1] - +m[2] - +m[3];
  if ((m = t.match(/each interior angle of a regular \w+ \((\d+) sides\)/))) return (+m[1] - 2) * 180 / +m[1];
  // perimeter and area
  if ((m = t.match(/perimeter of a rectangle that is ([\d.]+) \w+ by ([\d.]+)/))) return 2 * (+m[1] + +m[2]);
  if ((m = t.match(/area of a rectangle that is ([\d.]+) \w+ by ([\d.]+)/))) return +m[1] * +m[2];
  if ((m = t.match(/rectangle is ([\d.]+) \w+ long and ([\d.]+) \w+ wide\. What is its (area|perimeter)/))) return m[3] === 'area' ? +m[1] * +m[2] : 2 * (+m[1] + +m[2]);
  if ((m = t.match(/parallelogram has a base of ([\d.]+) \w+ and a height of ([\d.]+) \w+\. What is its area/))) return +m[1] * +m[2];
  if ((m = t.match(/triangle has a base of ([\d.]+) \w+ and a height of ([\d.]+) \w+\. What is its area/))) return +m[1] * +m[2] / 2;
  if ((m = t.match(/trapezoid has (?:parallel sides|bases) of ([\d.]+) \w+ and ([\d.]+) \w+ and a height of ([\d.]+) \w+\. What is its area/))) return (+m[1] + +m[2]) / 2 * +m[3];
  if ((m = t.match(/rectangle has a perimeter of ([\d.]+) \w+ and a length of ([\d.]+) \w+\. What is its width/))) return +m[1] / 2 - +m[2];
  if ((m = t.match(/rectangle has an area of ([\d.]+) square \w+ and a length of ([\d.]+) \w+\. What is its width/))) return +m[1] / +m[2];
  if ((m = t.match(/square (?:has|with) sides? of ([\d.]+) \w+\. What is its (area|perimeter)/)) || (m = t.match(/(?:What is the )(area|perimeter) of a square with sides? of ([\d.]+)/)) && (m = [0, m[2], m[1]])) return m[2] === 'area' ? +m[1] * +m[1] : 4 * +m[1];
  if ((m = t.match(/yard is ([\d.]+) ft by ([\d.]+) ft\. Fencing costs \$([\d.]+) per foot\. How much does it cost to fence the whole yard/))) return 2 * (+m[1] + +m[2]) * +m[3];
  // circles (answers are a number times π)
  if ((m = t.match(/circumference of a circle with (?:a )?radius (?:of )?([\d.]+)/))) return 2 * +m[1] * PI;
  if ((m = t.match(/area of a circle with (?:a )?radius (?:of )?([\d.]+)/))) return +m[1] * +m[1] * PI;
  if ((m = t.match(/circle has a diameter of ([\d.]+)\. What is its (area|circumference|radius)/))) return m[2] === 'area' ? (+m[1] / 2) ** 2 * PI : m[2] === 'radius' ? +m[1] / 2 : +m[1] * PI;
  if ((m = t.match(/circle has a circumference of ([\d.]+)π\. What is its (radius|diameter)/))) return m[2] === 'radius' ? +m[1] / 2 : +m[1];
  if ((m = t.match(/circle has an area of ([\d.]+)π\. What is its (radius|diameter)/))) return Math.sqrt(+m[1]) * (m[2] === 'radius' ? 1 : 2);
  // right triangles
  if ((m = t.match(/legs of ([\d.]+) and ([\d.]+)\. (?:How long is the hypotenuse|What is the length of the hypotenuse)/))) return Math.hypot(+m[1], +m[2]);
  if ((m = t.match(/hypotenuse of ([\d.]+) and one leg of ([\d.]+)\. How long is the other leg/))) return Math.sqrt((+m[1]) ** 2 - (+m[2]) ** 2);
  if ((m = t.match(/bottom is ([\d.]+) ft from the wall and it reaches ([\d.]+) ft up the wall\. How long is the ladder/))) return Math.hypot(+m[1], +m[2]);
  if ((m = t.match(/walks? ([\d.]+) \w+ (?:north|south|east|west) and (?:then )?([\d.]+) \w+ (?:north|south|east|west)\. How far/))) return Math.hypot(+m[1], +m[2]);
  if ((m = t.match(/Which set of (?:side )?lengths (?:makes|forms|can form) a right triangle/))) return (c) => { const ok = (x) => { const k = nums(plain(x)).sort((a, b) => a - b); return k.length === 3 && eq(k[0] ** 2 + k[1] ** 2, k[2] ** 2); }; return ok(c) && q.choices.filter(ok).length === 1; };
  // volume and surface area
  if ((m = t.match(/box is ([\d.]+) \w+ long, ([\d.]+) \w+ wide and ([\d.]+) \w+ tall\. What is its volume/))) return +m[1] * +m[2] * +m[3];
  if ((m = t.match(/cube has edges of ([\d.]+) \w+\. What is its volume/))) return (+m[1]) ** 3;
  if ((m = t.match(/cylinder has a radius of ([\d.]+) \w+ and a height of ([\d.]+) \w+\. What is its volume/))) return PI * (+m[1]) ** 2 * +m[2];
  if ((m = t.match(/can has a diameter of ([\d.]+) \w+ and a height of ([\d.]+) \w+\. What is its volume/))) return PI * (+m[1] / 2) ** 2 * +m[2];
  if ((m = t.match(/surface area of a cube with edges of ([\d.]+)/))) return 6 * (+m[1]) ** 2;
  if ((m = t.match(/surface area of a box that is ([\d.]+) \w+ by ([\d.]+) \w+ by ([\d.]+)/))) return 2 * (+m[1] * +m[2] + +m[1] * +m[3] + +m[2] * +m[3]);
  if ((m = t.match(/box has a volume of ([\d.]+) cubic \w+\. It is ([\d.]+) \w+ long and ([\d.]+) \w+ wide\. How tall/))) return +m[1] / (+m[2] * +m[3]);
  // lines and the coordinate plane
  const line = t.match(new RegExp(`line y = (${M}?\\d*(?:\\(\\(\\d+\\)/\\(\\d+\\)\\))?)x(?: ([+${M}]) (\\d+))?(?=[ ?])`));
  if (line && /slope/.test(t)) return line[1] === '' ? 1 : line[1] === M ? -1 : ev(line[1]);
  if (line && /y-intercept|cross the y-axis/.test(t)) return line[2] ? +line[3] * (line[2] === '+' ? 1 : -1) : 0;
  if ((m = t.match(new RegExp(`slope of the line (${M}?\\d*)x ([+${M}]) (\\d*)y = (${M}?\\d+)\\?`)))) { const a = m[1] === '' ? 1 : m[1] === M ? -1 : ev(m[1]), b = (m[3] === '' ? 1 : +m[3]) * (m[2] === '+' ? 1 : -1); return -a / b; }
  const P2 = t.match(new RegExp(`\\((${M}?\\d+), (${M}?\\d+)\\) and \\((${M}?\\d+), (${M}?\\d+)\\)`));
  if (P2) { const [x1, y1, x2, y2] = P2.slice(1).map((s) => ev(s));
    if (/slope/.test(t)) return (y2 - y1) / (x2 - x1);
    if (/distance/.test(t)) return Math.hypot(x2 - x1, y2 - y1);
    if (/midpoint/.test(t)) return (c) => { const k = nums(plain(c)); return eq(k[0], (x1 + x2) / 2) && eq(k[1], (y1 + y2) / 2); }; }
  return undefined;
}

let total = 0, checked = 0; const bad = [], unknown = {}, cover = {};
for (const l of LEVELS) {
  if (l.checkpoint) continue; cover[l.id] = [0, 0];
  for (let i = 0; i < N; i++) {
    const q = l.gen(1 + (i % 3)), t = plain(q.q); total++; cover[l.id][1]++;
    let want; try { want = expected(l.id, t, q); } catch (e) { want = undefined; }
    if (want === undefined || (typeof want === 'number' && !Number.isFinite(want))) { const k = l.id + ' | ' + t.replace(/[\d,.]+/g, '#').slice(0, 110); unknown[k] = (unknown[k] || 0) + 1; continue; }
    checked++; cover[l.id][0]++;
    const test = typeof want === 'function' ? want : (c) => eq(val(c), want);
    let ok; try { ok = !!test(q.choices[q.answer]); } catch (e) { ok = false; }
    const rivals = typeof want === 'number' ? q.choices.filter((c, k) => k !== q.answer && eq(val(c), want)).map(plain) : [];
    if ((!ok || rivals.length) && bad.length < 40) bad.push(`${l.id}: ${t}\n     marked correct: ${plain(q.choices[q.answer])}${typeof want === 'number' ? `   independent answer: ${+want.toFixed(6)}` : ''}${rivals.length ? `   ALSO EQUAL: ${rivals.join(' | ')}` : ''}`);
    if (!ok || rivals.length) bad.count = (bad.count || 0) + 1;
  }
}
console.log('level      independently checked');
for (const [id, [c, n]] of Object.entries(cover)) console.log(`  ${id.padEnd(9)} ${String(Math.round(c / n * 100)).padStart(3)}%`);
console.log(`\n${checked} of ${total} questions recomputed independently (${Math.round(checked / total * 100)}%).`);
const un = Object.entries(unknown).sort((a, b) => b[1] - a[1]);
if (process.env.SHOW_UNKNOWN) console.log('\nNot recognised (no independent solver yet):\n  ' + un.slice(0, 60).map(([k, n]) => `${n}× ${k}`).join('\n  '));
if (bad.length) { console.log(`\nMISMATCHES (${bad.count}):\n  ` + bad.join('\n  ')); process.exit(1); }
console.log('Every recomputed answer matches the answer the app marks correct, and no wrong choice equals it.');
