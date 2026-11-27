/* ASVAB English — curriculum and question engine.
   Word Knowledge questions are built from the word lists (data/words-t*.js) and word parts (data/parts.js);
   Paragraph Comprehension questions come from the passage bank (data/pc*.js). Every question has 4 choices
   and a step-by-step explanation. Generators take a difficulty tier d = 1, 2 or 3. */
(function (root) {
'use strict';
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const b = (s) => `<b>${s}</b>`;
const POS = { adj: 'adjective (describes a noun)', noun: 'noun (a person, place, thing or idea)', verb: 'verb (an action)', adv: 'adverb (describes how)' };
// seeded order so each word set mixes letters and parts of speech, and stays the same between visits
function seeded(arr, seed) { let s = seed; const r = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- data ----------
const seen = new Set();
function tier(list, t) {
  return (list || []).map(([word, pos, def, sent]) => ({ word: String(word).toLowerCase().trim(), pos, def: String(def).trim(), sent, t }))
    .filter((w) => w.word && w.def && w.sent && !seen.has(w.word) && seen.add(w.word));
}
const T1 = tier(root.ASVAB_EN_T1, 1), T2 = tier(root.ASVAB_EN_T2, 2), T3 = tier(root.ASVAB_EN_T3, 3);
const ALL = [...T1, ...T2, ...T3];
const PARTS = root.ASVAB_EN_PARTS || { prefixes: [], suffixes: [], roots: [] };
const PASSAGES = [...(root.ASVAB_EN_PC1 || []), ...(root.ASVAB_EN_PC2 || []), ...(root.ASVAB_EN_PC3 || [])];
const PCQ = []; // every passage question, flattened
for (const p of PASSAGES) p.qs.forEach((q, k) => PCQ.push({ p, q, key: `${p.id}:${k}` }));

// avoid repeating the same item within a short run (a check is 10–12 questions)
const recent = []; const RECENT_MAX = 14;
function fresh(items, keyOf) {
  const pool = items.filter((it) => !recent.includes(keyOf(it)));
  const it = pick(pool.length ? pool : items); recent.push(keyOf(it)); if (recent.length > RECENT_MAX) recent.shift();
  return it;
}

function highlight(sent, word) {
  const re = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i');
  return esc(sent).replace(re, '<mark>$1</mark>');
}
function choices(correct, wrongs) {
  const set = [correct]; for (const w of wrongs) { if (set.length >= 4) break; if (w && !set.includes(w)) set.push(w); }
  const ch = shuffle(set); return { choices: ch, answer: ch.indexOf(correct) };
}
// three wrong definitions: same part of speech, different meaning, preferably the same tier
function wrongDefs(w, n = 3) {
  const same = (x) => x.def !== w.def && x.word !== w.word;
  let pool = shuffle(ALL.filter((x) => same(x) && x.pos === w.pos && x.t === w.t));
  if (pool.length < n) pool = pool.concat(shuffle(ALL.filter((x) => same(x) && x.pos === w.pos && x.t !== w.t)));
  if (pool.length < n) pool = pool.concat(shuffle(ALL.filter(same)));
  const out = []; for (const x of pool) { if (!out.includes(x.def)) out.push(x.def); if (out.length >= n) break; }
  return out;
}

// ---------- Word Knowledge question types ----------
function qWordAlone(w) {
  const c = choices(w.def, wrongDefs(w));
  return { q: `<span class="kicker">Word Knowledge</span>${b(esc(w.word))} most nearly means:`, ...c, steps: [
    `${cap(w.word)} is a ${POS[w.pos]}. The right answer will be the same kind of word.`,
    `See it used in a sentence: "${highlight(w.sent, w.word)}"`,
    `Swap each choice in for <i>${esc(w.word)}</i>. Only "${esc(w.def)}" keeps the sentence's meaning.`,
    `Answer: ${b(esc(w.def))}` ] };
}
function qWordInContext(w) {
  const c = choices(w.def, wrongDefs(w));
  return { q: `<span class="kicker">Word Knowledge</span><span class="sent">${highlight(w.sent, w.word)}</span>In this sentence, ${b(esc(w.word))} most nearly means:`, ...c, steps: [
    'Read the whole sentence and look for a clue: a definition, an example, a contrast ("but", "unlike") or a cause ("because", "so").',
    `Put each choice in place of <i>${esc(w.word)}</i> and reread the sentence.`,
    `"${esc(w.def)}" fits the clues; the other choices change or break the meaning.`,
    `Answer: ${b(esc(w.def))}` ] };
}
function qWhichWord(w) {
  let pool = shuffle(ALL.filter((x) => x.pos === w.pos && x.def !== w.def && x.t === w.t));
  if (pool.length < 3) pool = pool.concat(shuffle(ALL.filter((x) => x.pos === w.pos && x.def !== w.def)));
  const c = choices(w.word, pool.slice(0, 3).map((x) => x.word));
  return { q: `<span class="kicker">Word Knowledge</span>Which word means ${b('"' + esc(w.def) + '"')}?`, ...c, steps: [
    'Go through the choices and say what each word means.',
    `${cap(w.word)}: "${highlight(w.sent, w.word)}"`,
    `Answer: ${b(esc(w.word))}` ] };
}
function vocabQ(w, d) {
  if (d === 1) return Math.random() < 0.7 ? qWordInContext(w) : qWordAlone(w);
  if (d === 2) return pick([qWordInContext, qWordAlone, qWordAlone, qWhichWord])(w);
  return pick([qWordAlone, qWordAlone, qWordInContext, qWhichWord])(w);
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- word parts ----------
// parts whose meanings overlap: never offered as each other's wrong answer
const LOOKALIKE = [['hyper-', 'super-', 'over-'], ['hypo-', 'sub-', 'under-'], ['un-', 'dis-', 'de-'], ['co-', 'inter-'],
  ['-ist', '-er/-or'], ['-ous', '-ful', '-ive', '-ic'], ['-ness', '-ment', '-ion', '-ship', '-ism'],
  ['vid', 'spect'], ['graph', 'scrib'], ['aud', 'phon', 'voc'], ['voc', 'dict'], ['geo', 'terr'], ['port', 'duc', 'mit'], ['photo', 'sol']];
const lookalike = (a, c) => LOOKALIKE.some((g) => g.includes(a) && g.includes(c));
function partQ(list, kind, d, only) {
  if (!list.length) return null;
  const it = only || fresh(list, (x) => kind + x[0]), [part, meaning, ex] = it;
  const others = shuffle(list.filter((x) => x[1] !== meaning && !lookalike(x[0], part)));
  const label = kind === 'root' ? `the root ${b(esc(part))}` : `the ${kind} ${b(esc(part))}`;
  const [exWord, exMean] = pick(ex);
  if (d >= 2 && Math.random() < 0.55) { // whole-word meaning
    const wrong = others.slice(0, 3).map((x) => pick(x[2])[1]);
    const c = choices(exMean, wrong);
    return { q: `Using what you know about word parts, ${b(esc(exWord))} means:`, ...c, steps: [
      `Find the part you know in ${b(esc(exWord))}: ${label}.`, `${cap(kind === 'root' ? 'the root' : 'the ' + kind)} ${esc(part)} means "${esc(meaning)}".`,
      `Put the parts together: ${esc(exWord)} = ${b(esc(exMean))}.`, ex.length > 1 ? `Another example: ${ex.filter((e) => e[0] !== exWord).map((e) => `${esc(e[0])} (${esc(e[1])})`).join(', ')}.` : '' ].filter(Boolean) };
  }
  const c = choices(meaning, others.slice(0, 3).map((x) => x[1]));
  return { q: `What does ${label} mean, as in ${b(esc(exWord))}?`, ...c, steps: [
    `Look at a word you know that uses it: ${ex.map((e) => `${esc(e[0])} = ${esc(e[1])}`).join('; ')}.`,
    `What those words share is the meaning of ${esc(part)}: "${esc(meaning)}".`, `Answer: ${b(esc(meaning))}` ] };
}

// ---------- Paragraph Comprehension ----------
const PC_LABEL = { main: 'Main idea', detail: 'Stated detail', inference: 'Inference', vocab: 'Word in context', purpose: "Author's purpose", tone: "Author's tone" };
function passageHTML(p) { return `<div class="passage">${p.text.split(/\n\n+/).map((para) => `<p>${esc(para)}</p>`).join('')}</div>`; }
function pcQ(types, d) {
  const maxD = d === 1 ? 2 : 3, minD = d === 3 ? 2 : 1;
  let items = PCQ.filter((x) => types.includes(x.q.type) && x.p.d >= minD && x.p.d <= maxD);
  if (!items.length) items = PCQ.filter((x) => types.includes(x.q.type));
  if (!items.length) return null;
  const { p, q, key } = fresh(items, (x) => x.key);
  return { q: `<span class="kicker">${PC_LABEL[q.type] || 'Reading'}</span>${passageHTML(p)}<span class="qline">${esc(q.q)}</span>`, choices: q.c.map(esc), answer: q.a,
    steps: [...q.why.map(esc), `Answer: ${b(esc(q.c[q.a]))}`], key, passage: true };
}

// ---------- the course ----------
const UNITS = [
  { id: 1, title: 'Word Building', blurb: 'Unlock thousands of words by learning their parts and reading the clues around them.' },
  { id: 2, title: 'Foundation Vocabulary', blurb: 'Common words that every test and job uses. Learn them cold.' },
  { id: 3, title: 'Test-Level Vocabulary', blurb: 'The kind of words that show up on ASVAB Word Knowledge.' },
  { id: 4, title: 'Reading Comprehension', blurb: 'Paragraph Comprehension: read a short passage, then answer what it says and what it means.' },
  { id: 5, title: 'Advanced Vocabulary', blurb: 'The harder words the computer test gives you when you are doing well.' },
];
const ROUND_SIZE = 8;
const LEVELS = [];
const L = (o) => LEVELS.push(o);
// flashcards: every word part and every vocabulary word is a card the learner studies in small rounds
function partCards(list, kind) {
  const by = {}; const cards = list.map((it) => { const id = kind.charAt(0) + ':' + it[0]; by[id] = it; return { id, front: esc(it[0]), sub: kind, back: esc(it[1]), ex: it[2].map((e) => `${esc(e[0])} = ${esc(e[1])}`).join('<br>') }; });
  return { cards, cardQ: (id) => partQ(list, kind, by[id] && Math.random() < 0.4 ? 2 : 1, by[id]) };
}
function wordCards(ws) {
  const by = {}; const cards = ws.map((w) => { const id = 'w:' + w.word; by[id] = w; return { id, front: esc(w.word), sub: w.pos, back: esc(w.def), ex: highlight(w.sent, w.word) }; });
  return { cards, cardQ: (id) => vocabQ(by[id], 2) };
}

L({ id: 'prefix', unit: 1, title: 'Prefixes', sec: 'WK', gen: (d) => partQ(PARTS.prefixes, 'prefix', d), ...partCards(PARTS.prefixes, 'prefix'),
  why: 'A prefix at the start of a word changes its meaning. Knowing 30 prefixes helps you decode hundreds of words you have never seen.',
  rules: ['A prefix is added to the FRONT of a word: un + happy = unhappy (not happy).', 'Cover the prefix, find the base word, then add the prefix meaning back.', 'Some prefixes look alike but differ: anti- (against) and ante- (before).'],
  tip: 'On the test, a word you do not know often has a prefix you do. Start there.' });
L({ id: 'suffix', unit: 1, title: 'Suffixes', sec: 'WK', gen: (d) => partQ(PARTS.suffixes, 'suffix', d), ...partCards(PARTS.suffixes, 'suffix'),
  why: 'A suffix at the end of a word tells you what kind of word it is and adds meaning.',
  rules: ['A suffix is added to the END of a word: fear + less = fearless (without fear).', 'Suffixes often change the part of speech: -ness makes a noun (kindness), -ly makes an adverb (quickly), -ify makes a verb (simplify).'],
  tip: 'The suffix tells you if the answer should be a noun, verb or describing word. Eliminate choices that do not match.' });
L({ id: 'roots', unit: 1, title: 'Roots', sec: 'WK', gen: (d) => partQ(PARTS.roots, 'root', d), ...partCards(PARTS.roots, 'root'),
  why: 'Most long English words are built on Latin and Greek roots. Each root you learn is a key to a whole family of words.',
  rules: ['A root carries the core meaning: "spect" = look, so inspect, spectator and spectacles are all about looking.', 'Break a long word into prefix + root + suffix and translate each part.'],
  tip: 'If two choices seem close, pick the one that matches the root meaning.' });
L({ id: 'context', unit: 1, title: 'Context Clues', sec: 'WK', gen: (d) => qWordInContext(fresh([...T1, ...T2], (x) => x.word)),
  why: 'Many Word Knowledge questions put the word in a sentence. The sentence almost always contains a clue to the meaning.',
  rules: ['Definition clue: the sentence explains the word ("…an arid region, one that gets almost no rain").', 'Synonym clue: a nearby word means the same thing.', 'Contrast clue: "but", "unlike", "however" signal the opposite meaning.', 'Example clue: "such as" or "for example" lists things that show the meaning.', 'Test it: replace the word with your answer. The sentence should still make sense.'],
  tip: 'Always read the full sentence before looking at the answer choices.' });

function wordTable(ws) {
  return `<div class="wordlist">${ws.map((w) => `<div class="wd"><div><b>${esc(w.word)}</b> <span class="pos">${w.pos}</span> — ${esc(w.def)}</div><div class="ex">${highlight(w.sent, w.word)}</div></div>`).join('')}</div>`;
}
function partTable(list) {
  return `<div class="wordlist">${list.map(([p, m, ex]) => `<div class="wd"><div><b>${esc(p)}</b> — ${esc(m)}</div><div class="ex">${ex.map((e) => `${esc(e[0])} (${esc(e[1])})`).join(' · ')}</div></div>`).join('')}</div>`;
}
function wordSets(list, size, unit, prefix, title, seed) {
  const order = seeded(list, seed), n = Math.max(1, Math.round(order.length / size));
  for (let i = 0; i < n; i++) {
    const ws = order.slice(Math.floor(i * order.length / n), Math.floor((i + 1) * order.length / n));
    L({ id: `${prefix}${i + 1}`, unit, title: `${title} ${i + 1}`, sec: 'WK', words: ws, gen: (d) => vocabQ(fresh(ws, (x) => x.word), d), ...wordCards(ws), lesson: i === 0 && prefix === 'v1-' ? 'vocab' : 'none',
      why: `${ws.length} words to learn, ${ROUND_SIZE} at a time. Study each small group of flashcards, then prove you know them.`,
      rules: ['Read each word out loud, then its meaning and the sentence.', 'Cover the meaning and try to remember it before looking.', 'Make up your own sentence for the words that feel new.'],
      tip: 'Spaced practice works: come back to a set you passed a few days later and do a few practice questions.' });
  }
}
wordSets(T1, 35, 2, 'v1-', 'Word Set', 101);
wordSets(T2, 32, 3, 'v2-', 'Word Set', 202);
L({ id: 'pcmain', unit: 4, title: 'The Main Idea', sec: 'PC', gen: (d) => pcQ(['main'], d),
  why: 'The most common Paragraph Comprehension question: what is the passage mostly about?',
  rules: ['The main idea covers the WHOLE passage, not just one sentence.', 'Look at the first and last sentences; they often state it.', 'Trap: a choice that is a true detail but too narrow. Another trap: a choice so broad it could fit any passage.', 'Ask: if I had to give this passage a title, what would it be?'], tip: 'Read the question first, then the passage, so you know what to look for.' });
L({ id: 'pcdetail', unit: 4, title: 'Stated Details', sec: 'PC', gen: (d) => pcQ(['detail'], d),
  why: '"According to the passage…" questions: the answer is written in the passage. You just have to find it.',
  rules: ['Find the key word from the question in the passage and read that sentence carefully.', 'The right answer often uses different words for the same fact.', 'Trap: a choice that is true in real life but not stated in the passage.'], tip: 'Do not answer from memory or outside knowledge. Point to the line that proves it.' });
L({ id: 'pcinfer', unit: 4, title: 'Making Inferences', sec: 'PC', gen: (d) => pcQ(['inference'], d),
  why: '"It can be inferred…" questions: the answer is not stated, but the passage clearly points to it.',
  rules: ['An inference is a small, logical step from what the passage says.', 'The right answer must be supported by evidence in the passage.', 'Trap: a choice that goes too far or adds ideas the passage never suggests.'], tip: 'Pick the choice that needs the smallest leap from the text.' });
L({ id: 'pcvocab', unit: 4, title: 'Words in Context', sec: 'PC', gen: (d) => pcQ(['vocab'], d),
  why: '"As used in the passage…" questions test whether you can read a word\'s meaning from the sentence around it.',
  rules: ['Find the word in the passage and reread the whole sentence.', 'Replace the word with each choice. The right one keeps the meaning.', 'Trap: the word\'s most common meaning, when the passage uses a different one.'], tip: 'The context matters more than the dictionary.' });
L({ id: 'pcpurpose', unit: 4, title: "Author's Purpose & Tone", sec: 'PC', gen: (d) => pcQ(['purpose', 'tone'], d),
  why: 'Why did the author write this, and how do they feel about the subject?',
  rules: ['Purpose: to inform (facts), explain how (steps), persuade (opinion, "should"), warn (danger), or entertain (a story).', 'Tone: the author\'s attitude: neutral, admiring, concerned, critical, hopeful…', 'Most ASVAB passages are informative and neutral. Pick a strong tone only if the words show it.'], tip: 'Look for opinion words like "should", "best" or "unfortunately". If there are none, the purpose is probably to inform.' });
wordSets(T3, 30, 5, 'v3-', 'Advanced Set', 303);

// unit checkpoints
for (const u of UNITS) {
  const unitLevels = LEVELS.filter((l) => l.unit === u.id && !l.checkpoint);
  if (!unitLevels.length) continue;
  const at = LEVELS.indexOf(unitLevels[unitLevels.length - 1]) + 1;
  LEVELS.splice(at, 0, { id: 'check' + u.id, unit: u.id, title: `Unit ${u.id} Checkpoint`, checkpoint: true, sec: unitLevels[0].sec,
    gen: (d) => pick(unitLevels).gen(d), why: `A mixed review of everything in "${u.title}". Pass it to unlock the next unit.`,
    rules: unitLevels.map((l) => l.title), tip: 'Mixed practice is harder than one topic at a time, and much closer to the real test.' });
}

const vocabAll = (d) => vocabQ(fresh(pick([T1, T2, T2, T3, T3].filter((t) => t.length)), (x) => x.word), d);
const TESTS = {
  WK: { id: 'WK', name: 'Word Knowledge', short: 'WK', count: 15, minutes: 9, gens: [vocabAll], unlockAfter: 'check3', about: 'Vocabulary: what a word means, alone or in a sentence. On the computer ASVAB this section is 15 scored questions in 9 minutes, so you need to move fast.' },
  PC: { id: 'PC', name: 'Paragraph Comprehension', short: 'PC', count: 10, minutes: 27, gens: [(d) => pcQ(['main', 'detail', 'inference', 'vocab', 'purpose', 'tone'], d)], unlockAfter: 'check4', about: 'Short passages with a question each. On the computer ASVAB this section is about 11 questions in 22 minutes.' },
};

const CFG = {
  app: 'ASVAB English', key: 'asvabEnglish.v1', sections: { WK: 'Word Knowledge', PC: 'Paragraph Comprehension' }, guided: false, hasVideo: false,
  otherApp: { name: 'ASVAB Math', url: 'https://asvab-math.vercel.app' },
  practiceHint: 'Read every choice before you pick. On the real test you cannot go back.',
  testRules: ['Like the computer ASVAB, you can\'t go back to change an answer.', 'Word Knowledge is fast: about 35 seconds a question. Do not get stuck on one word.'],
  passingHTML: `<p>The ASVAB score the military uses to decide if you can enlist is the <b>AFQT</b>. It is built from four sections: the two English sections here, <b>Word Knowledge</b> and <b>Paragraph Comprehension</b> (combined into a Verbal score that counts <b>double</b>), plus two math sections (Arithmetic Reasoning and Mathematics Knowledge). Because English counts double, it is half of your AFQT.</p>
    <p>The AFQT is a percentile from 1 to 99. Most branches require about <b>31 to 36</b> with a high school diploma, the Coast Guard asks for more, and many jobs need higher line scores. Check the current minimum with a recruiter.</p>
    <p><b>How to read your readiness:</b> 60% or more means you are on track for the English half; 75% or more gives you a comfortable cushion; 90% or more means you should pass the English sections with ease. For the math half, use the <a href="https://asvab-math.vercel.app">ASVAB Math</a> app.</p>`,
  aboutHTML: `<p><b>What it covers:</b> the two ASVAB English sections. Word Knowledge (${T1.length + T2.length + T3.length} words in three tiers, plus ${PARTS.prefixes.length} prefixes, ${PARTS.suffixes.length} suffixes and ${PARTS.roots.length} roots, all as flashcards) and Paragraph Comprehension (${PASSAGES.length} original passages with ${PCQ.length} questions on main idea, details, inference, words in context, and purpose and tone). Every question has 4 answer choices, like the real test.</p>
    <p><b>Timed tests:</b> the same length as the computer ASVAB: 15 Word Knowledge questions in 9 minutes and 10 Paragraph Comprehension questions in 27 minutes. The real test can add unscored tryout questions, with extra time for them.</p>`,
};

root.ASVAB = { UNITS, LEVELS, TESTS, CFG, H: { pick, rnd }, DATA: { T1, T2, T3, PARTS, PASSAGES, PCQ } };
})(typeof window !== 'undefined' ? window : globalThis);
