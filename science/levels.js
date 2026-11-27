/* ASVAB Science & Tech — curriculum and question engine.
   Covers the ASVAB sections outside the AFQT: General Science, Electronics Information, Auto Information,
   Shop Information and Mechanical Comprehension. Each level has a picture lesson (lessons/*.js), flashcards and a
   question bank (data/*.js, format in tools/BANK-SPEC.md). Levels with formulas also get computed questions (below).
   Every question has 4 choices and an explanation. Generators take a difficulty tier d = 1, 2 or 3. */
(function (root) {
'use strict';
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const b = (s) => `<b>${s}</b>`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (n) => { const s = String(+(+n).toFixed(2)); const [i, f] = s.split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : ''); };
const V = root.V, ST = root.ST || {};
const SEC = { GS: 'General Science', EI: 'Electronics Information', AI: 'Auto Information', SI: 'Shop Information', MC: 'Mechanical Comprehension' };

// avoid repeating the same item within a short run (a check is 10 to 12 questions)
const recent = []; const RECENT_MAX = 16;
function fresh(items, keyOf) {
  const pool = items.filter((it) => !recent.includes(keyOf(it)));
  const it = pick(pool.length ? pool : items); recent.push(keyOf(it)); if (recent.length > RECENT_MAX) recent.shift();
  return it;
}
function choices(correct, wrongs) {
  const set = [correct]; for (const w of wrongs) { if (set.length >= 4) break; if (w != null && !set.includes(w)) set.push(w); }
  const ch = shuffle(set); return { choices: ch, answer: ch.indexOf(correct) };
}

// ---------- bank questions ----------
function bankQ(id, d, sec) {
  const bank = ST[id]; if (!bank || !bank.qs || !bank.qs.length) return null;
  let items = bank.qs.filter((q) => (q.d || 2) <= (d === 1 ? 2 : 3) && (q.d || 2) >= (d === 3 ? 2 : 1)); if (items.length < 8) items = bank.qs;
  const q = fresh(items, (x) => id + ':' + x.q), order = shuffle([0, 1, 2, 3]);
  return { q: `<span class="kicker">${SEC[sec]}</span>${q.q}`, fig: q.fig || '', choices: order.map((i) => q.c[i]), answer: order.indexOf(q.a), steps: [q.why, `Answer: ${b(q.c[q.a])}`], key: id + ':' + bank.qs.indexOf(q) };
}
// ---------- flashcards ----------
function factCards(id) {
  const facts = (ST[id] && ST[id].facts) || [], by = {};
  const cards = facts.map((f) => { const cid = id + ':' + f[0]; by[cid] = f; return { id: cid, front: f[0], sub: 'term', back: f[1], ex: f[2] || '' }; });
  const cardQ = (cid) => {
    const f = by[cid] || pick(facts), others = shuffle(facts.filter((x) => x !== f));
    if (Math.random() < 0.5) { const c = choices(cap(f[1]), others.slice(0, 3).map((x) => cap(x[1])));
      return { q: `What does ${b(f[0])} mean?`, ...c, steps: [`${cap(f[0])}: ${f[1]}.${f[2] ? ' Example: ' + f[2] + '.' : ''}`, `Answer: ${b(cap(f[1]))}`] }; }
    const c = choices(cap(f[0]), others.slice(0, 3).map((x) => cap(x[0])));
    return { q: `Which term means ${b('"' + f[1] + '"')}?`, ...c, steps: [`${cap(f[0])}: ${f[1]}.${f[2] ? ' Example: ' + f[2] + '.' : ''}`, `Answer: ${b(cap(f[0]))}`] };
  };
  return { cards, cardQ };
}

// ---------- computed questions ----------
// num(question, right answer, wrong answers, unit, steps, picture): four different number choices, smallest to largest
function num(q, ans, wrongs, unit, steps, fig, sec) {
  const U = (v) => `${fmt(v)}${unit ? ' ' + unit : ''}`, set = [ans];
  // Choices are listed smallest to largest, so the answer's place is picked first (evenly) and the wrong choices are drawn to fit it.
  // The classic mistake (the first wrong value) is offered whenever it fits.
  const whole = Number.isInteger(ans), ok = (w) => Number.isFinite(w) && w > 0 && (!whole || Number.isInteger(w)) && !set.some((x) => Math.abs(x - w) < 1e-9);
  const pool = [wrongs[0], ...shuffle(wrongs.slice(1).concat([ans / 2, ans - 1, ans + 1, ans * 2, ans / 4, ans - 2, ans + 2, ans * 3, ans / 3, ans / 5]))], below = rnd(0, 3);
  const take = (test, n) => { for (const w of pool) if (n > 0 && ok(w) && test(w)) { set.push(+(+w).toFixed(2)); n--; } };
  take((w) => w < ans, below); take((w) => w > ans, 4 - set.length); take(() => true, 4 - set.length);
  const sorted = set.slice().sort((x, y) => x - y);
  return { q: `<span class="kicker">${SEC[sec]}</span>${q}`, fig: fig || '', choices: sorted.map(U), answer: sorted.indexOf(ans), steps: [...steps, `Answer: ${b(U(ans))}`] };
}
const GEN = {
  ohm(d) {
    const I = rnd(2, d === 1 ? 5 : 9), R = rnd(2, d === 1 ? 6 : 12), Vv = I * R, t = rnd(0, 3);
    if (t === 0) return num(`A current of ${I} amps flows through a ${R}-ohm resistor. What is the voltage across it?`, Vv, [I + R, Vv + R, Vv - I, R], 'volts',
      ['Ohm\'s law: volts = amps × ohms.', `Put in the numbers: ${I} × ${R}.`, `${I} × ${R} = ${Vv}`], V.eq([['V = I × R', 'volts = amps × ohms'], [`V = ${I} × ${R}`, '']]), 'EI');
    if (t === 1) return num(`A ${Vv}-volt battery is connected to a ${R}-ohm resistor. How much current flows?`, I, [Vv * R, Vv - R, I + 1, I * 2], 'amps',
      ['You want amps, so use: amps = volts ÷ ohms.', `Put in the numbers: ${Vv} ÷ ${R}.`, `${Vv} ÷ ${R} = ${I}`], V.circuit('series', { v: Vv, r: [R] }), 'EI');
    if (t === 2) return num(`A ${Vv}-volt battery pushes ${I} amps through a heater. What is the heater's resistance?`, R, [Vv * I, Vv - I, R + 2, R * 2], 'ohms',
      ['You want ohms, so use: ohms = volts ÷ amps.', `Put in the numbers: ${Vv} ÷ ${I}.`, `${Vv} ÷ ${I} = ${R}`], '', 'EI');
    const v2 = pick([6, 12, 24, 120]), i2 = rnd(2, d === 1 ? 5 : 10);
    return num(`A device runs on ${v2} volts and draws ${i2} amps. How much power does it use?`, v2 * i2, [v2 + i2, v2 / i2, v2 * i2 * 2, v2 * (i2 + 1)], 'watts',
      ['Power is measured in watts: watts = volts × amps.', `Put in the numbers: ${v2} × ${i2}.`, `${v2} × ${i2} = ${fmt(v2 * i2)}`], V.eq([['P = V × I', 'watts = volts × amps'], [`P = ${v2} × ${i2}`, '']]), 'EI');
  },
  circuits(d) {
    const t = rnd(0, 2);
    if (t === 0) { const n = d === 1 ? 2 : rnd(2, 3), r = Array.from({ length: n }, () => rnd(2, 12)), sum = r.reduce((a, x) => a + x, 0);
      return num(`Resistors of ${r.join(n === 2 ? ' and ' : ', ').replace(/, (\d+)$/, ' and $1')} ohms are connected in series. What is the total resistance?`, sum, [Math.max(...r), sum + r[0], r.reduce((a, x) => a * x, 1), sum - 1], 'ohms',
        ['In a series circuit there is one path, so the current must pass through every resistor.', `Add the resistances: ${r.join(' + ')}.`, `${r.join(' + ')} = ${sum}`], V.circuit('series', { v: 12, r }), 'EI'); }
    if (t === 1) { const R = 2 * rnd(2, 12);
      return num(`Two ${R}-ohm resistors are connected in parallel. What is the total resistance?`, R / 2, [R, R * 2, R / 4, R + 2], 'ohms',
        ['A parallel circuit gives the current more than one path, so the total resistance goes down.', 'Two equal resistors in parallel act like half of one.', `${R} ÷ 2 = ${R / 2}`], V.circuit('parallel', { v: 12, r: [R, R] }), 'EI'); }
    const r1 = rnd(1, 5), r2 = rnd(1, 5), I = rnd(2, 4), Vv = I * (r1 + r2);
    return num(`A ${Vv}-volt battery is connected to a ${r1}-ohm and a ${r2}-ohm resistor in series. How much current flows?`, I, [Vv / r1, Vv * (r1 + r2), I + r1 + r2, I + 1].map((x) => +x.toFixed(2)), 'amps',
      [`First find the total resistance. In series, add: ${r1} + ${r2} = ${r1 + r2} ohms.`, `Then amps = volts ÷ ohms: ${Vv} ÷ ${r1 + r2}.`, `${Vv} ÷ ${r1 + r2} = ${I}`], V.circuit('series', { v: Vv, r: [r1, r2] }), 'EI');
  },
  force(d) {
    if (Math.random() < 0.6) { const F = 10 * rnd(2, d === 1 ? 6 : 12), dist = rnd(2, d === 1 ? 5 : 9);
      return num(`You push a crate with a force of ${F} pounds and it slides ${dist} feet. How much work did you do?`, F * dist, [F + dist, F / dist, F * dist * 2, F * (dist + 1)], 'foot-pounds',
        ['Work = force × distance.', `Put in the numbers: ${F} × ${dist}.`, `${F} × ${dist} = ${fmt(F * dist)}`], V.eq([['work = force × distance', ''], [`work = ${F} × ${dist}`, 'pounds × feet']]), 'MC'); }
    const ma = rnd(2, 6), E = 10 * rnd(2, 8), Ld = ma * E;
    return num(`A machine lets you lift a ${Ld}-pound load with a ${E}-pound push. What is its mechanical advantage?`, ma, [Ld - E, Ld * E, ma + 1, ma * 2], '',
      ['Mechanical advantage tells you how many times a machine multiplies your push.', `Mechanical advantage = load ÷ effort: ${Ld} ÷ ${E}.`, `${Ld} ÷ ${E} = ${ma}`], '', 'MC');
  },
  lever(d) {
    const dl = rnd(1, 3), k = rnd(2, d === 1 ? 4 : 6), de = dl * k, E = 10 * rnd(2, 10), Ld = E * k;
    if (Math.random() < 0.7) return num(`The load on this lever weighs ${Ld} pounds and sits ${dl} ${dl === 1 ? 'foot' : 'feet'} from the fulcrum. You push down ${de} feet from the fulcrum. How much effort does it take to balance the load?`, E,
      [Ld, Ld * k, E / 2, E + 10, Ld - E], 'pounds',
      ['A lever balances when effort × effort arm = load × load arm.', `Load side: ${Ld} × ${dl} = ${fmt(Ld * dl)}.`, `So effort × ${de} = ${fmt(Ld * dl)}. Divide: ${fmt(Ld * dl)} ÷ ${de}.`, `${fmt(Ld * dl)} ÷ ${de} = ${E}`], V.lever({ load: Ld, effort: '?', dl, de }), 'MC');
    return num(`On this lever the effort arm is ${de} feet and the load arm is ${dl} ${dl === 1 ? 'foot' : 'feet'}. What is the mechanical advantage?`, k, [de + dl, de * dl, de - dl, k + 1, k * 2].filter((x) => x !== k), '',
      ['Mechanical advantage of a lever = effort arm ÷ load arm.', `Put in the numbers: ${de} ÷ ${dl}.`, `${de} ÷ ${dl} = ${k}`], V.lever({ load: 'load', effort: '?', dl, de }), 'MC');
  },
  pulley(d) {
    const t = rnd(0, 2);
    if (t === 0) { const n = rnd(2, 4), E = 10 * rnd(2, 9), Ld = E * n;
      return num(`In this pulley system, ${n} rope sections hold up a ${Ld}-pound load. How hard must you pull to lift it?`, E, [Ld, Ld * n, Ld - n, E * 2, E / 2], 'pounds',
        ['Each rope section that holds the load carries an equal share of the weight.', `Effort = load ÷ number of rope sections: ${Ld} ÷ ${n}.`, `${Ld} ÷ ${n} = ${E}`], V.pulley(n, { load: Ld, effort: '?' }), 'MC'); }
    const h = rnd(2, 4), k = rnd(2, d === 1 ? 4 : 6), len = h * k, E = 10 * rnd(2, 9), Ld = E * k;
    if (t === 1) return num(`A ramp is ${len} feet long and ${h} feet high. How much force does it take to push a ${Ld}-pound cart up the ramp?`, E, [Ld, Ld * h, Ld / h, E * 2, Ld - E].map((x) => +x.toFixed(2)), 'pounds',
      ['A ramp trades a longer distance for a smaller push.', `Effort = load × height ÷ length: ${Ld} × ${h} ÷ ${len}.`, `${Ld} × ${h} = ${fmt(Ld * h)}, and ${fmt(Ld * h)} ÷ ${len} = ${E}`], V.incline(len, h, { load: Ld }), 'MC');
    return num(`A ramp is ${len} feet long and ${h} feet high. What is its mechanical advantage?`, k, [len + h, len * h, len - h, k + 1, k * 2].filter((x) => x !== k), '',
      ['Mechanical advantage of a ramp = length ÷ height.', `Put in the numbers: ${len} ÷ ${h}.`, `${len} ÷ ${h} = ${k}`], V.incline(len, h), 'MC');
  },
  gear(d) {
    if (Math.random() < 0.3) { const n = rnd(2, 3), dir = pick(['clockwise', 'counterclockwise']), other = dir === 'clockwise' ? 'counterclockwise' : 'clockwise', ans = n === 2 ? other : dir;
      const c = choices(cap(ans), [cap(ans === dir ? other : dir), 'It does not turn', 'It turns back and forth']);
      return { q: `<span class="kicker">${SEC.MC}</span>${n === 2 ? 'Two gears are meshed.' : 'Three gears are meshed in a row.'} The first gear turns ${dir}. Which way does the ${n === 2 ? 'second' : 'third'} gear turn?`, fig: n === 2 ? V.gears(12, 24, { arrows: false }) : '', ...c,
        steps: ['Two gears that touch always turn in opposite directions.', n === 2 ? `The first turns ${dir}, so the second turns ${other}.` : `The first turns ${dir}, the second turns ${other}, and the third turns ${dir} again.`, `Answer: ${b(cap(ans))}`] }; }
    const small = pick([8, 10, 12, 15, 20]), k = rnd(2, d === 1 ? 3 : 5), big = small * k, up = Math.random() < 0.5;
    const t1 = up ? big : small, t2 = up ? small : big, rpm2 = 10 * rnd(2, 9) * (up ? k : 1), rpm1 = up ? rpm2 / k : rpm2 * k;
    return num(`Gear A has ${t1} teeth and turns at ${fmt(rpm1)} rpm. It drives gear B, which has ${t2} teeth. How fast does gear B turn?`, rpm2, [rpm1, up ? rpm1 / k : rpm1 * k, rpm1 + t2, rpm2 * 2, rpm2 / 2].map((x) => +x.toFixed(2)), 'rpm',
      [`Gear B is ${up ? 'smaller, so it turns faster' : 'bigger, so it turns slower'}.`, `Driven speed = driver speed × driver teeth ÷ driven teeth: ${fmt(rpm1)} × ${t1} ÷ ${t2}.`, `${fmt(rpm1)} × ${t1} = ${fmt(rpm1 * t1)}, and ${fmt(rpm1 * t1)} ÷ ${t2} = ${fmt(rpm2)}`], V.gears(t1, t2, { rpm: rpm1, rpm2: false }), 'MC');
  },
  fluid(d) {
    if (Math.random() < 0.55) { const A = rnd(2, d === 1 ? 5 : 10), p = 5 * rnd(2, 12), F = p * A;
      return num(`A force of ${fmt(F)} pounds presses evenly on an area of ${A} square inches. What is the pressure?`, p, [F * A, F - A, p * 2, p + A, p / 2], 'psi',
        ['Pressure is force spread over an area. "psi" means pounds per square inch.', `Pressure = force ÷ area: ${fmt(F)} ÷ ${A}.`, `${fmt(F)} ÷ ${A} = ${p}`], V.eq([['pressure = force ÷ area', ''], [`pressure = ${fmt(F)} ÷ ${A}`, 'pounds ÷ square inches']]), 'MC'); }
    const a1 = rnd(1, 3), k = rnd(2, d === 1 ? 4 : 8), a2 = a1 * k, F1 = 10 * rnd(1, 9), F2 = F1 * k;
    return num(`In a hydraulic jack, you push with ${F1} pounds on a small piston with an area of ${a1} square inch${a1 > 1 ? 'es' : ''}. The large piston has an area of ${a2} square inches. How much force does the large piston push with?`, F2,
      [F1, F1 / k, F1 + a2, F2 * 2, F2 + 10].map((x) => +x.toFixed(2)), 'pounds',
      ['The liquid carries the same pressure to both pistons.', `The large piston is ${a2} ÷ ${a1} = ${k} times as big, so it pushes ${k} times as hard.`, `Output force = ${F1} × ${k} = ${fmt(F2)}`], V.tbl([['small', `${a1} sq in`, `${F1} lb`], ['large', `${a2} sq in`, '?']], ['piston', 'area', 'force']), 'MC');
  },
};

// ---------- the course ----------
const UNITS = [
  { id: 1, title: 'Life Science', blurb: 'General Science: cells, the human body, and how living things pass on traits and depend on each other.' },
  { id: 2, title: 'Earth, Space & Physical Science', blurb: 'General Science: the Earth, the sky, matter, energy, heat, light and sound.' },
  { id: 3, title: 'Electronics', blurb: 'Electronics Information: volts, amps and ohms, circuits, parts and safe wiring.' },
  { id: 4, title: 'Auto', blurb: 'Auto Information: how an engine makes power and how a car puts it on the road.' },
  { id: 5, title: 'Shop', blurb: 'Shop Information: hand tools, measuring and cutting, fasteners and materials.' },
  { id: 6, title: 'Mechanical', blurb: 'Mechanical Comprehension: forces, levers, pulleys, gears and pressure.' },
];
const LEVELS = [];
function L(id, unit, sec, title, why, rules, tip) {
  const fc = factCards(id), g = GEN[id];
  LEVELS.push({ id, unit, sec, title, why, rules, tip, ...fc,
    gen: (d) => (g && Math.random() < 0.5 ? g(d) : null) || bankQ(id, d, sec) || (g ? g(d) : fc.cardQ(pick(fc.cards).id)) });
}
L('life', 1, 'GS', 'Cells & Living Things', 'Every living thing is made of cells. General Science asks what the parts of a cell do and how living things are grouped.',
  ['A cell is the smallest unit of life. The nucleus is its control center.', 'Plant cells have a cell wall and chloroplasts. Animal cells do not.', 'Photosynthesis: plants use sunlight, water and carbon dioxide to make sugar and oxygen.'], 'If a question names a cell part, ask yourself: what is its one job?');
L('body', 1, 'GS', 'The Human Body & Health', 'The body is a set of systems that work together. Know what each system and main organ does.',
  ['Circulatory: the heart pumps blood. Arteries carry it away from the heart, veins bring it back.', 'Respiratory: the lungs take in oxygen and give off carbon dioxide.', 'Digestive: food is broken down so the blood can carry nutrients to the cells.'], 'Match the organ to its system first. That removes two wrong choices at once.');
L('eco', 1, 'GS', 'Genetics & Ecology', 'How traits pass from parents to children, and how living things depend on each other.',
  ['Genes are sections of DNA that carry traits. They come in pairs, one from each parent.', 'A dominant trait shows even with one copy. A recessive trait needs two.', 'Energy flows from producers (plants) to consumers to decomposers.'], 'In a food chain, the arrow points to the one that eats.');
L('earth', 2, 'GS', 'Earth Science', 'The ground under you and the weather above you: rocks, plates, water and air.',
  ['Earth has layers: crust, mantle, outer core, inner core.', 'Three kinds of rock: igneous (cooled melted rock), sedimentary (pressed layers), metamorphic (changed by heat and pressure).', 'The water cycle: evaporation, condensation, precipitation.'], 'Weather questions often turn on air pressure: high pressure usually means fair weather.');
L('space', 2, 'GS', 'Space', 'The Sun, the planets, the Moon, and why we have days, years and seasons.',
  ['Earth spins once a day (rotation) and circles the Sun once a year (revolution).', 'Seasons come from the tilt of Earth\'s axis, not from distance to the Sun.', 'The Moon shines by reflecting sunlight. Its phases repeat about every month.'], 'Learn the order of the planets with a sentence. It is asked often.');
L('chem', 2, 'GS', 'Matter & Chemistry', 'Everything is made of atoms. Know their parts, how they join, and how matter changes.',
  ['An atom has protons (+) and neutrons in the nucleus, with electrons (−) around it.', 'An element is one kind of atom. A compound is two or more elements joined.', 'A physical change keeps the same substance. A chemical change makes a new one.'], 'On the pH scale, 7 is neutral. Below 7 is an acid, above 7 is a base.');
L('phys', 2, 'GS', 'Energy, Heat, Light & Sound', 'Energy changes form but is never lost. Know how heat, light and sound travel.',
  ['Kinetic energy is energy of motion. Potential energy is stored energy.', 'Heat moves three ways: conduction (touch), convection (moving liquid or gas), radiation (rays).', 'Sound needs something to travel through. Light does not.'], 'Metric prefixes: kilo means 1,000, centi means one hundredth, milli means one thousandth.');
L('elec', 3, 'EI', 'Electricity Basics', 'Electricity is moving electrons. Three ideas explain almost everything: voltage, current and resistance.',
  ['Voltage (volts) is the push. Current (amps) is the flow. Resistance (ohms) holds the flow back.', 'Current flows only in a closed loop, called a circuit.', 'Conductors (copper) let current flow easily. Insulators (rubber, plastic) do not.'], 'Think of water in a pipe: pressure is voltage, flow is current, a narrow pipe is resistance.');
L('ohm', 3, 'EI', 'Ohm\'s Law & Power', 'One short formula links volts, amps and ohms. A second one gives power in watts.',
  ['Ohm\'s law: volts = amps × ohms.', 'To find amps, divide volts by ohms. To find ohms, divide volts by amps.', 'Power: watts = volts × amps.'], 'Write down what you know and what you want. Then pick the form of the formula that has the unknown alone.');
L('circuits', 3, 'EI', 'Series & Parallel Circuits', 'Parts can be wired in one line or side by side. The two behave very differently.',
  ['Series: one path. The same current goes through every part, and resistances add.', 'Parallel: several paths. Every branch gets the full voltage, and total resistance goes down.', 'In series, one burned-out bulb stops everything. In parallel, the others stay lit.'], 'Count the paths. One path means series.');
L('parts', 3, 'EI', 'Components & Symbols', 'Circuits are built from a small set of parts. Know what each does and what its symbol looks like.',
  ['A resistor limits current. A capacitor stores charge. A diode lets current flow one way only.', 'A fuse or circuit breaker opens the circuit when the current is too high.', 'A voltmeter connects across a part. An ammeter connects in line with it.'], 'If a symbol has a zigzag, it is a resistor.');
L('acdc', 3, 'EI', 'AC, DC, Magnetism & Safety', 'Batteries give direct current. Wall outlets give alternating current. Magnets tie the two together.',
  ['DC flows one way. AC switches direction many times a second (60 hertz in the U.S.).', 'A transformer raises or lowers AC voltage. A generator turns motion into electricity.', 'House wiring: black is hot, white is neutral, green or bare is ground.'], 'A smaller wire gauge number means a thicker wire that can carry more current.');
L('engine', 4, 'AI', 'How an Engine Works', 'A gasoline engine burns fuel inside its cylinders. Four strokes turn that burning into motion.',
  ['The four strokes in order: intake, compression, power, exhaust.', 'The piston moves up and down. The crankshaft turns that into spinning.', 'A spark plug lights the fuel in a gasoline engine. A diesel lights it by squeezing the air until it is hot.'], 'Only one of the four strokes makes power.');
L('engsys', 4, 'AI', 'Engine Systems', 'An engine needs fuel, a spark, cooling, oil and a way to breathe out. Each need has its own system.',
  ['Cooling: the water pump moves coolant through the engine to the radiator.', 'Lubrication: the oil pump sends oil to moving parts so they do not grind.', 'Electrical: the battery starts the car. The alternator recharges it while the engine runs.'], 'Ask which system a part belongs to. The job follows from the system.');
L('drive', 4, 'AI', 'Drivetrain, Brakes, Steering & Suspension', 'How engine power reaches the wheels, and how a car stops, turns and rides.',
  ['Power path: engine, transmission, driveshaft, differential, axles, wheels.', 'Brakes use fluid pressure to squeeze pads against a spinning disc (or push shoes against a drum).', 'Springs hold the car up. Shock absorbers stop it from bouncing.'], 'The differential lets the outside wheel turn faster than the inside wheel in a curve.');
L('tools', 5, 'SI', 'Hand Tools', 'Every hand tool is made for one kind of job: striking, turning, gripping or prying.',
  ['Hammers strike. Screwdrivers and wrenches turn. Pliers grip.', 'Match the screwdriver tip to the screw head: flat for a slot, Phillips for a cross.', 'A torque wrench tightens a bolt to an exact tightness.'], 'Pick the tool that fits the fastener exactly. A loose fit rounds it off.');
L('cutmeas', 5, 'SI', 'Measuring, Cutting & Shaping', 'Measure first, then cut, then smooth. Each step has its own tools.',
  ['A square checks 90-degree corners. A level checks that something is flat.', 'A crosscut saw cuts across the wood grain. A rip saw cuts along it. A hacksaw cuts metal.', 'Sandpaper: a higher grit number is finer.'], '"Measure twice, cut once" is the oldest rule in the shop.');
L('fasten', 5, 'SI', 'Fasteners, Materials & Joining', 'Nails, screws, bolts, glue and welds hold things together. The material decides which to use.',
  ['A bolt goes through a hole and is held by a nut. A washer spreads the load.', 'Soldering joins metal with a low-melting filler. Welding melts the pieces themselves together.', 'Hardwood comes from leaf trees (oak, maple). Softwood comes from needle trees (pine).'], 'Screws hold better than nails. Bolts hold better than screws.');
L('force', 6, 'MC', 'Force, Motion, Work & Energy', 'Machines do not create energy. They trade a small push over a long distance for a big push over a short one.',
  ['Work = force × distance. In U.S. units it is measured in foot-pounds.', 'Mechanical advantage = load ÷ effort: how many times a machine multiplies your push.', 'An object keeps doing what it is doing unless a force changes it.'], 'If a machine makes the push smaller, you must push farther.');
L('lever', 6, 'MC', 'Levers', 'A lever is a stiff bar that turns on a point. The farther from that point you push, the less you need to push.',
  ['The fulcrum is the turning point. The load is what you move. The effort is your push.', 'A lever balances when effort × effort arm = load × load arm.', 'Mechanical advantage = effort arm ÷ load arm.'], 'A longer handle means less effort.');
L('pulley', 6, 'MC', 'Pulleys & Ramps', 'Ropes and slopes let you lift a heavy load with a smaller pull over a longer distance.',
  ['Count the rope sections holding the load. Effort = load ÷ that number.', 'A single fixed pulley only changes the direction of your pull.', 'A ramp\'s mechanical advantage = length ÷ height.'], 'Do not count the rope you pull down on if it does not lift the load.');
L('gear', 6, 'MC', 'Gears, Belts & Wheels', 'Gears and belts pass turning motion along and trade speed for turning force.',
  ['Two gears that touch turn in opposite directions.', 'A big gear driven by a small gear turns slower, with more turning force.', 'Driven speed = driver speed × driver teeth ÷ driven teeth.'], 'More teeth means slower.');
L('fluid', 6, 'MC', 'Pressure, Fluids & Springs', 'Liquids and gases push on everything they touch. Hydraulic machines use that push to multiply force.',
  ['Pressure = force ÷ area. "psi" is pounds per square inch.', 'Liquids cannot be squeezed smaller, so they pass pressure along. That is how hydraulics work.', 'Water pressure grows with depth.'], 'A bigger piston gives a bigger push, but moves a shorter distance.');

// unit checkpoints
for (const u of UNITS) {
  const unitLevels = LEVELS.filter((l) => l.unit === u.id && !l.checkpoint);
  if (!unitLevels.length) continue;
  const at = LEVELS.indexOf(unitLevels[unitLevels.length - 1]) + 1;
  LEVELS.splice(at, 0, { id: 'check' + u.id, unit: u.id, title: `Unit ${u.id} Checkpoint`, checkpoint: true, sec: unitLevels[0].sec,
    gen: (d) => pick(unitLevels).gen(d), why: `A mixed review of everything in "${u.title}". Pass it to unlock the next unit.`,
    rules: unitLevels.map((l) => l.title), tip: 'Mixed practice is harder than one topic at a time, and much closer to the real test.' });
}

const secGen = (sec) => { const ls = LEVELS.filter((l) => l.sec === sec && !l.checkpoint); return (d) => pick(ls).gen(d); };
const TESTS = {
  GS: { id: 'GS', name: 'General Science', short: 'GS', count: 15, minutes: 12, gens: [secGen('GS')], unlockAfter: 'check2', about: 'Life, earth and physical science facts. On the computer ASVAB this section is 15 scored questions in 12 minutes.' },
  EI: { id: 'EI', name: 'Electronics Information', short: 'EI', count: 15, minutes: 10, gens: [secGen('EI')], unlockAfter: 'check3', about: 'Electricity, circuits and electronic parts. On the computer ASVAB this section is 15 scored questions in 10 minutes.' },
  AI: { id: 'AI', name: 'Auto Information', short: 'AI', count: 10, minutes: 7, gens: [secGen('AI')], unlockAfter: 'check4', about: 'How cars work and how they are repaired. On the computer ASVAB this section is 10 scored questions in 7 minutes.' },
  SI: { id: 'SI', name: 'Shop Information', short: 'SI', count: 10, minutes: 6, gens: [secGen('SI')], unlockAfter: 'check5', about: 'Tools, fasteners and shop practice. On the computer ASVAB this section is 10 scored questions in 6 minutes.' },
  MC: { id: 'MC', name: 'Mechanical Comprehension', short: 'MC', count: 15, minutes: 22, gens: [secGen('MC')], unlockAfter: 'check6', about: 'Forces, simple machines and how things move. On the computer ASVAB this section is 15 scored questions in 22 minutes.' },
};

const nCards = LEVELS.reduce((a, l) => a + (l.cards ? l.cards.length : 0), 0), nQs = Object.values(ST).reduce((a, x) => a + ((x.qs || []).length), 0);
const CFG = {
  app: 'ASVAB Science & Tech', key: 'asvabTech.v1', sections: SEC, guided: false, hasVideo: false,
  otherApps: [{ name: 'ASVAB Math', url: 'https://asvab-math.vercel.app', note: 'Arithmetic Reasoning and Mathematics Knowledge: half of the AFQT.' }, { name: 'ASVAB English', url: 'https://asvab-english.vercel.app', note: 'Word Knowledge and Paragraph Comprehension: the other half of the AFQT.' }],
  introHTML: '<b>How it works:</b> each level teaches one topic with short picture cards. Then you study its flashcards a few at a time, practice on your own, and pass a short Level Check to unlock the next level. Your score shows how ready you are for the ASVAB science and technical sections.',
  practiceHint: 'Read every choice before you pick. On the real test you cannot go back.',
  testRules: ['Like the computer ASVAB, you can\'t go back to change an answer.', 'These sections are fast: about 40 to 50 seconds a question, except Mechanical Comprehension. Answer what you know and keep moving.'],
  passingTitle: 'What your score means',
  bands: ['Ready for a strong score', 'Strong: well prepared', 'On track', 'Getting closer', 'Building the foundation'],
  passingHTML: `<p>These five sections are <b>not</b> part of the AFQT, the score that decides whether you can enlist. They decide <b>which jobs</b> you can get. Each branch adds them to your math and English scores to make <b>line scores</b> (the Army's GT, MM and EL, the Air Force's M, A, G and E, and so on), and every job has a minimum line score.</p>
    <p>So there is no single passing mark here. A higher score opens more jobs, above all mechanical, electrical and technical ones. Ask a recruiter which line scores the job you want needs.</p>
    <p><b>How to read your readiness:</b> 60% or more means you are on track; 75% or more is a strong score; 90% or more means these sections should be a strength. For the AFQT itself, use <a href="https://asvab-math.vercel.app">ASVAB Math</a> and <a href="https://asvab-english.vercel.app">ASVAB English</a>.</p>`,
  aboutHTML: `<p><b>What it covers:</b> five ASVAB sections outside the AFQT: General Science, Electronics Information, Auto Information, Shop Information and Mechanical Comprehension. ${LEVELS.filter((l) => !l.checkpoint).length} levels with ${nCards} flashcards and ${nQs} written questions, plus computed problems for Ohm's law, circuits, levers, pulleys, ramps, gears and pressure. Every question has 4 answer choices, like the real test.</p>
    <p><b>Not covered:</b> Assembling Objects, a picture-puzzle section that only a few jobs use.</p>
    <p><b>Timed tests:</b> the same length as the computer ASVAB: General Science 15 questions in 12 minutes, Electronics 15 in 10, Auto 10 in 7, Shop 10 in 6 and Mechanical Comprehension 15 in 22. The real test can add unscored tryout questions, with extra time for them.</p>`,
};

root.ASVAB = { UNITS, LEVELS, TESTS, CFG, H: { pick, rnd }, DATA: { ST, GEN } };
})(typeof window !== 'undefined' ? window : globalThis);
