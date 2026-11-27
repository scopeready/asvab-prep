/* ASVAB Prep — shared app engine (v2), used by ASVAB Math and ASVAB English.
   Level flow: Learn (picture lesson with checks) → Do it together (guided steps) or Flashcards → Practice → Level Check.
   Plus: daily warm-up (spaced review), fix-my-mistakes, read-aloud, timed tests, readiness score.
   Progress is stored on this device (localStorage), so everything works offline. */
(function () {
'use strict';
const { UNITS, LEVELS, TESTS, H, CFG } = window.ASVAB;
const LESSONS = window.LESSONS || {};
const app = document.getElementById('app');
const SECS = Object.keys(CFG.sections), SUBJ = CFG.app.replace('ASVAB ', '');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LETTERS = ['A', 'B', 'C', 'D'];
const PRACTICE_NEED = 5, RETRY_NEED = 3, GUIDED_NEED = 2, CHECK_N = 10, CHECKPOINT_N = 12, PASS = 0.8, TESTOUT = 0.9, ROUND = 8, WARM_N = 6, GAPS = [1, 1, 2, 4, 8, 16];
const KEY = CFG.key, MINUS = '−';
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- storage ----------
let DB = load();
function load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.profiles) return d; } catch (e) { /* private mode */ } return { profiles: {}, current: null }; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { toast('Could not save progress on this device.'); } }
const P = () => DB.profiles[DB.current];
function newProfile(name) { const id = 'p' + Date.now().toString(36); DB.profiles[id] = { id, name, created: Date.now(), levels: {}, tests: [], answered: 0, correct: 0, days: [], missed: [], cards: {} }; DB.current = id; save(); }
function LV(id) {
  const p = P(), lv = p.levels[id] || (p.levels[id] = { learned: false, practiced: 0, need: PRACTICE_NEED, passed: false, best: 0, attempts: 0, recent: [] });
  if (lv.gdone == null && (lv.passed || lv.practiced > 0)) lv.gdone = true; // progress made in version 1
  return lv;
}
const lvOf = (id) => P().levels[id];
const idx = (id) => LEVELS.findIndex((l) => l.id === id);
const unlocked = (i) => i === 0 || !!(lvOf(LEVELS[i - 1].id) || {}).passed;
function currentIndex() { const i = LEVELS.findIndex((l) => !(lvOf(l.id) || {}).passed); return i === -1 ? LEVELS.length : i; }
const levelNo = {}; { let n = 0; for (const l of LEVELS) if (!l.checkpoint) levelNo[l.id] = ++n; }
const CARDLEVEL = {}; for (const l of LEVELS) if (l.cards) for (const c of l.cards) CARDLEVEL[c.id] = l;
const label = (l) => (l.checkpoint ? l.title : `Level ${levelNo[l.id]}: ${l.title}`);
const lessonOf = (l) => LESSONS[l.lesson || l.id];
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
function record(levelId, ok) {
  const p = P(); p.answered++; if (ok) p.correct++;
  if (levelId) { const lv = LV(levelId); lv.recent.push(ok ? 1 : 0); if (lv.recent.length > 12) lv.recent.shift(); }
  const k = dayKey(new Date()); if (!p.days.includes(k)) { p.days.push(k); if (p.days.length > 500) p.days.shift(); }
}
function streak() { const s = new Set(P().days); const d = new Date(); if (!s.has(dayKey(d))) d.setDate(d.getDate() - 1); let n = 0; while (s.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); } return n; }
function addMissed(q, lid) {
  const p = P(); p.missed = p.missed || []; if (p.missed.some((m) => m.q === q.q)) return;
  p.missed.push({ lid: lid || null, q: q.q, choices: q.choices, answer: q.answer, steps: q.steps, fig: q.fig || '', sfig: q.sfig || '', ns: q.passage ? 1 : 0 }); if (p.missed.length > 40) p.missed.shift();
}
// which steps a level has, and where the learner is
function flow(l, lv) {
  const hasLearn = !l.checkpoint && (!!lessonOf(l) || !l.cards);
  const mid = l.cards ? 'cards' : (CFG.guided && !l.checkpoint && l.guided !== false ? 'guide' : null);
  const learned = !hasLearn || lv.learned, gdone = !mid || lv.gdone || lv.passed, practiced = lv.passed || lv.practiced >= lv.need;
  const next = !learned ? 'learn' : !gdone ? mid : !practiced ? 'practice' : 'check';
  return { hasLearn, mid, learned, gdone, practiced, next };
}

// ---------- readiness score ----------
function readiness() {
  const p = P(), out = {};
  for (const sec of SECS) {
    const ls = LEVELS.filter((l) => !l.checkpoint && l.sec === sec); let sum = 0, passed = 0;
    for (const l of ls) { const lv = p.levels[l.id]; if (lv && lv.passed) { passed++; const rec = lv.recent.length ? lv.recent.reduce((a, c) => a + c, 0) / lv.recent.length : lv.best; sum += 0.5 * lv.best + 0.5 * rec; } }
    const skill = sum / ls.length, t = p.tests.filter((x) => x.id === sec).slice(-3);
    const test = t.length ? t.reduce((a, x) => a + x.correct / x.total, 0) / t.length : null;
    const val = test == null ? skill * 0.85 : 0.5 * skill + 0.5 * test;
    out[sec] = { val: Math.round(val * 100), skill: Math.round(skill * 100), test: test == null ? null : Math.round(test * 100), passed, total: ls.length, tests: t.length };
  }
  out.overall = Math.round(SECS.reduce((a, k) => a + out[k].val, 0) / SECS.length);
  return out;
}
function band(v) {
  if (v >= 90) return ['Ready to pass with ease', 'great'];
  if (v >= 75) return ['Strong: likely to pass comfortably', 'good'];
  if (v >= 60) return ['On track to pass', 'ok'];
  if (v >= 40) return ['Getting closer', 'warn'];
  return ['Building the foundation', 'low'];
}

// ---------- read aloud ----------
const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
function toSpeech(html) {
  return String(html)
    .replace(/<(svg|table|pre)[\s\S]*?<\/\1>/g, ' ').replace(/<div class="(stack|figure)"[\s\S]*?<\/div>\s*<\/div>/g, ' ')
    .replace(/<span class="fr"><span class="fn">(.*?)<\/span><span class="fd">(.*?)<\/span><\/span>/g, ' $1 over $2 ')
    .replace(/<sup>2<\/sup>/g, ' squared').replace(/<sup>3<\/sup>/g, ' cubed').replace(/<sup>(.*?)<\/sup>/g, ' to the power $1 ')
    .replace(/<br\s*\/?>/g, '. ').replace(/<\/(p|li|div|h\d)>/g, '. ').replace(/<[^>]+>/g, '')
    .replace(/&gt;/g, ' is greater than ').replace(/&lt;/g, ' is less than ').replace(/&amp;/g, ' and ').replace(/&[a-z#0-9]+;/g, ' ')
    .replace(/≥/g, ' is greater than or equal to ').replace(/≤/g, ' is less than or equal to ').replace(/×|·/g, ' times ').replace(/÷/g, ' divided by ')
    .replace(/(\d)\s*[−-]\s*(\d)/g, '$1 minus $2').replace(/−\s*(\d)/g, ' negative $1').replace(/−/g, ' minus ').replace(/\+/g, ' plus ').replace(/=/g, ' equals ')
    .replace(/√/g, ' the square root of ').replace(/π/g, ' pi ').replace(/²/g, ' squared').replace(/³/g, ' cubed').replace(/°/g, ' degrees').replace(/%/g, ' percent')
    .replace(/→/g, ', so ').replace(/[✓✗▢]/g, ' ').replace(/\$(\d[\d,]*)\.(\d\d)\b/g, '$1 dollars and $2 cents').replace(/\s+/g, ' ').trim();
}
function speak(text) {
  if (!canSpeak) return; const sy = window.speechSynthesis; if (sy.speaking) { sy.cancel(); return; }
  const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.92;
  const v = sy.getVoices().find((x) => /en[-_]US/i.test(x.lang) && x.localService) || sy.getVoices().find((x) => /^en/i.test(x.lang)); if (v) u.voice = v;
  sy.speak(u);
}
const sayBtn = (html) => (canSpeak ? `<button class="say" data-act="say" data-t="${esc(toSpeech(html))}" aria-label="Read this aloud">🔊 Listen</button>` : '');

// ---------- rendering helpers ----------
let STATE = {}, timer = null, deferredInstall = null;
function header(title) {
  const off = navigator.onLine ? '' : '<span class="offline" title="No internet needed">Offline</span>';
  return `<header class="top"><button class="hbtn" data-act="go" data-to="#/home" aria-label="Home">⌂ Home</button><div class="brand">${title || CFG.app}</div>${off}<button class="hbtn" data-act="go" data-to="#/settings" aria-label="Settings">⚙︎</button></header>`;
}
function page(html, title) { if (canSpeak) window.speechSynthesis.cancel(); app.innerHTML = header(title) + `<main>${html}</main>`; }
function ring(v, cls = '', sub = 'ready') { return `<div class="ring ${cls}" style="--v:${v}"><div><b>${v}%</b><span>${sub}</span></div></div>`; }
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
function choicesHTML(q, mode, picked) { // mode: 'answer' | 'select' | 'review' | 'show' | 'static'
  return `<div class="choices">${q.choices.map((c, i) => {
    let cls = '';
    if (mode === 'review' || mode === 'show') { if (i === q.answer) cls = 'right'; else if (i === picked) cls = 'wrong'; }
    if (mode === 'select' && i === picked) cls = 'sel';
    const dis = mode === 'review' || mode === 'show' || mode === 'static' ? 'disabled' : '';
    return `<button class="choice ${cls}" data-act="pick" data-i="${i}" ${dis}><span class="L">${LETTERS[i]}</span><span>${c}</span></button>`;
  }).join('')}</div>`;
}
const fig = (h) => (h ? `<div class="figure">${h}</div>` : '');
const qHTML = (q) => `<div class="qtext">${q.q}</div>${fig(q.fig)}`;
const stepsHTML = (q, upto, newest = -1) => `${upto == null ? fig(q.sfig) : ''}<ol class="steps">${q.steps.slice(0, upto == null ? q.steps.length : upto).map((s, i) => `<li class="${i === newest ? 'new' : ''}">${s}</li>`).join('')}</ol>`;
const keypad = () => `<div class="keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => `<button class="key" data-act="key" data-k="${k}">${k}</button>`).join('')}<button class="key wide" data-act="key" data-k="±">+/${MINUS}</button><button class="key wide go" data-act="key" data-k="ok">Check ✓</button></div>`;
const numbox = (v) => `<span class="numbox ${v ? '' : 'empty'}">${v ? esc(v.replace('-', MINUS)) : '?'}</span>`;
function typeKey(S, k) { let v = S.input || ''; if (k === '⌫') v = v.slice(0, -1); else if (k === '±') v = v.startsWith('-') ? v.slice(1) : '-' + v; else if (k === '.') { if (!v.includes('.')) v += v === '' || v === '-' ? '0.' : '.'; } else if (v.replace(/\D/g, '').length < 9) v += k; S.input = v; }
const numOK = (input, ans) => input !== '' && input !== '-' && Math.abs(parseFloat(input) - ans) < 1e-9;

// find the last "= number" in a solution step, so the learner can fill it in
function blankOf(h) {
  const cut = h.search(/\.? \(?Check:/);
  if (cut > 0) { const b = blankOf(h.slice(0, cut)); if (b) b.post += h.slice(cut); return b; }
  const re = /(^| )(=|≤|≥|&lt;|&gt;) (<b>)?(−|-)?(\$)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(%|°)?(<\/b>)?/g; let m, best = null;
  while ((m = re.exec(h))) {
    const before = h.slice(0, m.index).replace(/<[^>]+>/g, ''), rest = h.slice(m.index + m[0].length);
    if ((before.match(/\(/g) || []).length > (before.match(/\)/g) || []).length) continue; // inside a side note
    if (!/^(?:[.,;:!]|\s*$|\s*✓|\s+(?![×÷+−·*\/^√π<(=\d-])\S)/.test(rest)) continue;
    best = { pre: h.slice(0, m.index) + m[1] + m[2] + ' ' + (m[5] || ''), ans: parseFloat((m[6] + (m[7] || '')).replace(/,/g, '')) * (m[4] ? -1 : 1), pct: m[8] || '', post: rest };
  }
  if (!best && (m = / (is|are) (<b>)?(−|-)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(%|°)?(<\/b>)?\.?$/.exec(h)))
    best = { pre: h.slice(0, m.index) + ' ' + m[1] + ' ', ans: parseFloat((m[4] + (m[5] || '')).replace(/,/g, '')) * (m[3] ? -1 : 1), pct: m[6] || '', post: h.slice(m.index + m[0].length) };
  return best;
}

// ---------- router ----------
let ownNav = 0; // go() renders right away; the hashchange event it causes is then skipped
function go(h) { if (location.hash !== h) { ownNav++; location.hash = h; } route(); }
function route() {
  if (timer) { clearInterval(timer); timer = null; }
  if (!DB.current || !P()) return viewWho();
  const p = P(); p.missed = p.missed || []; p.cards = p.cards || {};
  const [r, a] = (location.hash || '#/home').slice(2).split('/');
  const views = { home: viewHome, level: viewLevel, learn: viewLearn, guide: viewGuide, cards: viewCards, practice: viewPractice, check: viewCheck, test: viewTest, score: viewScore, settings: viewSettings, who: viewWho, about: viewAbout, warm: viewWarm, fix: viewFix };
  (views[r] || viewHome)(a);
  if (STATE.keepScroll) STATE.keepScroll = false; else window.scrollTo(0, 0);
}
const rerender = () => { STATE.keepScroll = true; const y = window.scrollY; route(); window.scrollTo(0, y); };
window.addEventListener('hashchange', () => { if (ownNav > 0) ownNav--; else route(); });
window.addEventListener('online', rerender); window.addEventListener('offline', rerender);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });

// ---------- who is practicing ----------
function viewWho() {
  const ps = Object.values(DB.profiles);
  app.innerHTML = `<header class="top"><div class="brand">${CFG.app}</div></header><main>
    <div class="card hero"><h1>Who's practicing?</h1><p class="muted">Each person gets their own progress, saved on this device.</p></div>
    ${ps.map((p) => `<button class="lvl" data-act="usep" data-id="${p.id}"><span class="ic">${esc(p.name.charAt(0).toUpperCase())}</span><span class="grow"><span class="t">${esc(p.name)}</span><br><span class="s">${Object.values(p.levels).filter((l) => l.passed).length} of ${LEVELS.length} levels passed</span></span></button>`).join('')}
    <div class="card"><h3>${ps.length ? 'Add someone new' : 'What\'s your first name?'}</h3>
    <input type="text" id="nm" maxlength="24" placeholder="First name" autocomplete="given-name">
    <button class="btn gold" data-act="addp">Start learning</button></div>
    ${ps.length ? '' : `<div class="card info small"><b>How it works:</b> you start with the basics. Each level teaches one skill with pictures, one small step at a time. Then you solve problems together with the app, practice on your own, and pass a short Level Check to unlock the next level. Your score shows how close you are to passing the ASVAB ${SUBJ} sections.</div>`}
  </main>`;
  const nm = document.getElementById('nm'); if (nm) nm.addEventListener('keydown', (e) => { if (e.key === 'Enter') ACT.addp(); });
}

// ---------- home ----------
const STEPNAME = { learn: 'Learn', guide: 'Do it together', cards: 'Flashcards', practice: 'Practice', check: 'Level Check' };
function viewHome() {
  const p = P(), r = readiness(), [bl, bc] = band(r.overall), ci = currentIndex(), cur = LEVELS[ci], st = streak();
  let next;
  if (cur) { const f = flow(cur, LV(cur.id)); next = `<div class="card gold"><p class="small muted" style="margin:0">UP NEXT</p><h3 style="margin:4px 0">${label(cur)}</h3><p class="small" style="margin:0">Next step: ${cur.checkpoint && f.next === 'check' ? 'Checkpoint test' : STEPNAME[f.next]}</p><button class="btn" data-act="go" data-to="#/level/${cur.id}">Continue →</button></div>`; }
  else next = `<div class="card gold"><h3>🎉 Every level is passed!</h3><p>Keep your edge with the daily warm-up and timed practice tests.</p><button class="btn" data-act="go" data-to="#/score">See my score</button></div>`;
  const nPassed = LEVELS.filter((l) => (lvOf(l.id) || {}).passed).length, nCards = Object.keys(p.cards).length;
  const warm = (nPassed || nCards) ? (p.warm === today() ? `<div class="card small">✓ Today's warm-up is done. Come back tomorrow for the next one.</div>`
    : `<button class="lvl cur" data-act="go" data-to="#/warm"><span class="ic">☀</span><span class="grow"><span class="t">Today's warm-up</span><br><span class="s">${WARM_N} quick questions from what you've already learned, so you don't forget it</span></span></button>`) : '';
  const fix = p.missed.length ? `<button class="lvl" data-act="go" data-to="#/fix"><span class="ic">↻</span><span class="grow"><span class="t">Fix my mistakes (${p.missed.length})</span><br><span class="s">Try the questions you missed again until you get them right</span></span></button>` : '';
  const units = UNITS.map((u) => {
    const ls = LEVELS.filter((l) => l.unit === u.id), done = ls.filter((l) => (lvOf(l.id) || {}).passed).length;
    return `<section class="unit"><div class="unit-h"><h2>Unit ${u.id}: ${u.title}</h2><span class="small muted">${done}/${ls.length}</span></div><p class="small muted" style="margin:0 0 4px">${u.blurb}</p>
      ${ls.map((l) => { const i = idx(l.id), lv = lvOf(l.id) || {}, open = unlocked(i), isCur = i === ci;
        const cls = lv.passed ? 'done' : isCur ? 'cur' : '', ic = lv.passed ? '✓' : open ? (l.checkpoint ? '★' : levelNo[l.id]) : '🔒';
        const sub = lv.passed ? `Passed · best ${Math.round(lv.best * 100)}%` : isCur ? 'You are here' : open ? 'Open' : 'Locked: pass the level before it';
        return `<button class="lvl ${cls}" data-act="go" data-to="#/level/${l.id}" ${open ? '' : 'disabled'}><span class="ic">${ic}</span><span class="grow"><span class="t">${l.title}</span><br><span class="s">${sub}</span></span></button>`; }).join('')}</section>`;
  }).join('');
  const tests = Object.values(TESTS).map((t) => {
    const open = (lvOf(t.unlockAfter) || {}).passed, last = p.tests.filter((x) => x.id === t.id).slice(-1)[0];
    return `<button class="lvl" data-act="go" data-to="#/test/${t.id}" ${open ? '' : 'disabled'}><span class="ic">${open ? '⏱' : '🔒'}</span><span class="grow"><span class="t">${t.name} practice test</span><br><span class="s">${open ? (last ? `Last score ${Math.round(last.correct / last.total * 100)}%` : `${t.count} questions · ${t.minutes} minutes`) : `Unlocks after the ${LEVELS[idx(t.unlockAfter)].title}`}</span></span></button>`;
  }).join('');
  page(`<div class="card hero row" data-act="go" data-to="#/score" role="button" tabindex="0" style="cursor:pointer">${ring(r.overall)}<div class="grow"><p class="muted small" style="margin:0">Hi ${esc(p.name)}${st ? ` · 🔥 ${st}-day streak` : ''}</p><h3 style="margin:4px 0 6px">${SUBJ} readiness</h3><span class="pill ${bc}">${bl}</span><p class="small muted" style="margin:8px 0 0">Tap to see your full score →</p></div></div>
    ${next}${warm}${fix}${units}<section class="unit"><h2>ASVAB practice tests</h2><p class="small muted" style="margin:0">Timed, like the real computer test. These count most toward your readiness score.</p>${tests}</section>`);
}

// ---------- level page ----------
function viewLevel(id) {
  const i = idx(id); if (i < 0 || !unlocked(i)) return go('#/home');
  const l = LEVELS[i], lv = LV(id), f = flow(l, lv), les = lessonOf(l);
  const nCheck = l.checkpoint ? CHECKPOINT_N : CHECK_N, needOk = Math.ceil(nCheck * PASS), next = LEVELS[i + 1];
  let n = 0; const st = (key, done, open, title, desc, btn) => { n++; const now = f.next === key && !lv.passed; return `<div class="card stepcard ${done ? 'done' : now ? 'now' : ''}"><span class="stepnum">${done ? '✓' : n}</span><div class="grow"><h3>${title}</h3><p class="small muted" style="margin:0">${desc}</p>${btn(now, open)}</div></div>`; };
  const B = (to, text, now, open, act) => `<button class="btn ${now ? 'gold' : 'ghost sm'}" data-act="${act || 'go'}" data-to="${to}" data-id="${id}" ${open ? '' : 'disabled'}>${text}</button>`;
  let h = '';
  if (f.hasLearn) h += st('learn', lv.learned, true, 'Learn', les ? `${les.cards.length} short picture cards${les.video ? ' and a 1-minute video' : ''}. One idea at a time, with quick checks.` : 'Key ideas and worked examples, one step at a time.', (now) => B(`#/learn/${id}`, lv.learned ? 'Review the lesson' : (lv.card ? 'Continue the lesson' : 'Start the lesson'), now, true));
  if (f.mid === 'guide') h += st('guide', f.gdone, f.learned, 'Do it together', `Solve ${GUIDED_NEED} problems step by step. You fill in each step and the app checks it.`, (now, open) => B(`#/guide/${id}`, f.gdone ? 'Do another one together' : 'Start', now, open));
  if (f.mid === 'cards') { const total = Math.ceil(l.cards.length / ROUND); h += st('cards', f.gdone, f.learned, 'Flashcards', `${l.cards.length} cards in ${total} small rounds of ${ROUND}. Study a few, then prove you know them.${lv.rounds && !f.gdone ? ` Rounds done: ${lv.rounds} of ${total}.` : ''}`, (now, open) => B(`#/cards/${id}`, f.gdone ? 'Review the flashcards' : lv.rounds ? 'Continue' : 'Start', now, open)); }
  h += st('practice', f.practiced, f.learned && f.gdone, 'Practice', lv.passed ? 'Passed. Extra practice keeps the skill sharp.' : `Get ${lv.need} correct on your own. Hints are there if you need them.`
    , (now, open) => (!lv.passed && open ? `<div class="dots">${Array.from({ length: lv.need }, (_, k) => `<i class="${k < lv.practiced ? 'on' : ''}"></i>`).join('')}</div>` : '') + B(`#/practice/${id}`, lv.passed ? 'Practice more' : 'Practice', now, open));
  h += st('check', lv.passed, f.learned && f.gdone && f.practiced, l.checkpoint ? 'Checkpoint test' : 'Level Check', `${nCheck} questions, no hints. Get ${needOk} right to ${l.checkpoint ? 'finish the unit' : 'unlock the next level'}.${lv.attempts ? ` Best so far: ${Math.round(lv.best * 100)}%.` : ''}`
    , (now, open) => B('', lv.passed ? 'Retake' : (l.checkpoint ? 'Take the Checkpoint' : 'Take the Level Check'), now, open, 'startcheck'));
  page(`<p class="small muted" style="margin:0">Unit ${l.unit}: ${UNITS[l.unit - 1].title}</p><h1>${label(l)}</h1><p>${(les && les.hook) || l.why}</p>
    ${l.checkpoint ? `<div class="card info small"><b>Covers:</b> ${l.rules.join(' · ')}</div>` : ''}${h}
    ${!lv.passed && !l.checkpoint && !(f.learned && f.gdone && f.practiced) ? `<p class="small muted center">Already know this? <button class="link" data-act="testout" data-id="${id}">Take the Level Check now</button> (you need ${Math.ceil(nCheck * TESTOUT)} of ${nCheck} to skip the lesson).</p>` : ''}
    ${lv.passed && next ? `<button class="btn" data-act="go" data-to="#/level/${next.id}">Next: ${label(next)} →</button>` : ''}`);
}
const afterLearn = (l) => { const f = flow(l, LV(l.id)); return f.next === 'check' ? `#/level/${l.id}` : `#/${f.next}/${l.id}`; };

// ---------- learn: picture lesson ----------
function viewLearn(id) {
  const i = idx(id); if (i < 0 || !unlocked(i)) return go('#/home');
  const l = LEVELS[i], les = lessonOf(l), lv = LV(id); if (!les) return viewLearnBasic(l);
  if (!STATE.les || STATE.les.id !== id) STATE.les = { id, k: lv.learned ? 0 : Math.min(lv.card || 0, les.cards.length - 1) };
  const S = STATE.les, n = les.cards.length, c = les.cards[S.k], a = c.ask;
  if (a && S.ask !== S.k) { S.ask = S.k; S.ok = null; S.picked = null; S.input = ''; S.order = a.opts ? shuffle([0, 1, 2, 3]) : null; }
  let ask = '';
  if (a) {
    const done = S.ok === true;
    ask = `<div class="card ask"><p class="small muted" style="margin:0"><b>YOUR TURN</b></p><div class="qtext">${a.q}</div>`;
    if (a.opts) ask += `<div class="choices">${S.order.map((oi, j) => `<button class="choice ${S.picked === j ? (oi === a.a ? 'right' : 'wrong') : (done && oi === a.a ? 'right' : '')}" data-act="lpick" data-i="${j}" ${done ? 'disabled' : ''}><span class="L">${LETTERS[j]}</span><span>${a.opts[oi]}</span></button>`).join('')}</div>`;
    else ask += done ? `<p class="center">${numbox(String(a.num))}</p>` : `<p class="center">${numbox(S.input)}</p>${keypad()}`;
    if (S.ok === true) ask += `<div class="fb ok">✓ Correct! ${a.why}</div>`;
    else if (S.ok === false) ask += `<div class="fb bad">Not quite. ${a.why}<br><b>Try it again.</b></div>`;
    ask += `</div>`;
  }
  const canNext = !a || S.ok === true || lv.learned, last = S.k === n - 1;
  page(`<p class="small muted" style="margin:0">${l.title} · ${S.k + 1} of ${n}</p><div class="bar" style="margin:6px 0 10px"><i style="width:${(S.k + (canNext ? 1 : 0.5)) / n * 100}%"></i></div>
    ${S.k === 0 && les.video ? `<div class="card vid"><p class="small muted" style="margin:0 0 6px"><b>WATCH FIRST</b> · a short video of this lesson</p><video controls playsinline preload="metadata" src="${les.video}"${les.poster ? ` poster="${les.poster}"` : ''}></video></div>` : ''}
    <div class="card lcard ${c.tip ? 'tip' : ''}"><div class="row"><h2 class="grow" style="margin:0">${c.tip ? '⚠ ' : ''}${c.t}</h2>${sayBtn(c.say + (a ? '. ' + a.q : ''))}</div>${fig(c.fig)}<p class="lsay">${c.say}</p></div>${ask}
    <div class="btnrow">${S.k > 0 ? `<button class="btn ghost" data-act="lprev">← Back</button>` : ''}<button class="btn gold" data-act="lnext" ${canNext ? '' : 'disabled'}>${last ? (lv.learned ? 'Done' : 'Finish the lesson →') : 'Next →'}</button></div>
    ${canNext ? '' : `<p class="small muted center">Answer the question to keep going.</p>`}`);
}
function viewLearnBasic(l) { // levels without a written lesson: key ideas + worked examples
  const id = l.id; if (!STATE.learn || STATE.learn.id !== id) STATE.learn = { id, n: 0, q: l.gen(1), shown: 1 };
  const S = STATE.learn, q = S.q, all = S.shown >= q.steps.length;
  page(`<p class="small muted" style="margin:0">${label(l)}</p><h1>Learn</h1>
    <div class="card"><h3>Key ideas</h3><ul class="rules">${l.rules.map((r) => `<li>${r}</li>`).join('')}</ul></div><div class="card gold small"><b>Test tip:</b> ${l.tip}</div>
    <h2>Worked example ${S.n + 1} of 2</h2><div class="card">${qHTML(q)}${choicesHTML(q, all ? 'show' : 'static', -1)}</div>
    <h3>Solution, one step at a time</h3>${stepsHTML(q, S.shown, S.shown - 1)}
    ${!all ? `<button class="btn gold" data-act="nextstep">Show the next step (${S.shown} of ${q.steps.length})</button>`
      : `<div class="fb ok">The answer is ${LETTERS[q.answer]}: ${q.choices[q.answer]}</div>${S.n === 0 ? `<button class="btn gold" data-act="nextex">Next example →</button>` : `<button class="btn gold" data-act="learned">I'm ready →</button>`}<button class="btn ghost" data-act="anotherex">Show me a different example</button>`}`);
}

// ---------- do it together: guided steps ----------
function newGuide(l, lv) { const q = l.gen((lv.guided || 0) < 1 ? 1 : 2); return { id: l.id, q, i: 0, input: '', tries: 0, open: false, helped: false, typed: q.steps.some((s) => blankOf(s)) }; }
function viewGuide(id) {
  const i = idx(id); if (i < 0 || !unlocked(i)) return go('#/home');
  const l = LEVELS[i], lv = LV(id); if (!flow(l, lv).learned) return go('#/level/' + id);
  if (!STATE.gd || STATE.gd.id !== id) STATE.gd = newGuide(l, lv);
  const G = STATE.gd, q = G.q, n = q.steps.length, done = G.i >= n, count = lv.guided || 0;
  let body = `<ol class="steps">`;
  for (let j = 0; j < Math.min(G.i, n); j++) body += `<li class="okstep">${q.steps[j]}</li>`;
  let controls = '';
  if (!done) {
    const b = blankOf(q.steps[G.i]);
    if (!b && !G.typed && G.i === n - 1 && !G.open) { // nothing to type in this problem: pick the answer before seeing the last step
      controls = `<p class="small muted center"><b>Your turn:</b> pick the answer.</p>${choicesHTML(q, 'answer', -1)}${G.tries ? `<div class="fb bad">Not that one. Read the steps again and try another.</div>` : ''}<button class="btn ghost sm" data-act="gshow">Show me</button>`;
    } else if (b && !G.open) {
      body += `<li class="cur">${b.pre}${numbox(G.input)}${b.pct}</li>`;
      controls = (G.tries ? `<div class="fb bad">${G.tries === 1 ? 'Not yet. Check your work and try again.' : 'Still not right. Try once more, or tap “Show me”.'}</div>` : `<p class="small muted center">Work out the missing number and type it in.</p>`) + keypad() + `<button class="btn ghost sm" data-act="gshow">Show me this step</button>`;
    } else {
      body += `<li class="${G.open && !G.helped ? 'okstep new' : 'new'}">${q.steps[G.i]}</li>`;
      controls = (G.open && !G.helped ? `<div class="fb ok">✓ Right!</div>` : '') + `<button class="btn gold" data-act="gnext">${G.i === n - 1 ? 'Finish →' : 'Next step →'}</button>`;
    }
  }
  body += `</ol>`;
  const finished = done ? `<div class="card gold"><h3>✓ Solved: ${q.choices[q.answer]}</h3><p class="small" style="margin:0">${count >= GUIDED_NEED ? 'You are ready to practice on your own.' : `${count} of ${GUIDED_NEED} done. One more together.`}</p>
    ${count >= GUIDED_NEED ? `<button class="btn" data-act="go" data-to="#/practice/${id}">Practice on my own →</button><button class="btn ghost" data-act="gnew">Do another one together</button>` : `<button class="btn" data-act="gnew">Next problem →</button>`}</div>` : '';
  page(`<p class="small muted" style="margin:0">${label(l)}</p><h1>Do it together</h1>
    <div class="progress"><span>Problems solved: ${Math.min(count, GUIDED_NEED)} of ${GUIDED_NEED}</span><span>${done ? '' : `Step ${G.i + 1} of ${n}`}</span></div><div class="bar ok"><i style="width:${Math.min(100, count / GUIDED_NEED * 100)}%"></i></div>
    <div class="card">${qHTML(q)}</div>${done ? fig(q.sfig) : ''}${body}${controls}${finished}`);
}

// ---------- flashcards ----------
function viewCards(id) {
  const i = idx(id); if (i < 0 || !unlocked(i)) return go('#/home');
  const l = LEVELS[i], lv = LV(id); if (!l.cards || !flow(l, lv).learned) return go('#/level/' + id);
  const total = Math.ceil(l.cards.length / ROUND);
  if (!STATE.fc || STATE.fc.id !== id) STATE.fc = { id, r: Math.min(lv.rounds || 0, total - 1), phase: (lv.rounds || 0) >= total ? 'done' : 'study', i: 0, flip: false };
  const F = STATE.fc, set = l.cards.slice(F.r * ROUND, (F.r + 1) * ROUND), head = `<p class="small muted" style="margin:0">${label(l)}</p><h1>Flashcards</h1>`;
  if (F.phase === 'done') return page(`${head}<div class="card gold"><h3>✓ All ${total} rounds done</h3><p class="small">You have studied every card in this level.</p><button class="btn" data-act="go" data-to="#/practice/${id}">Go to practice →</button></div>
    <h2>Study a round again</h2>${Array.from({ length: total }, (_, r) => `<button class="lvl" data-act="fround" data-r="${r}"><span class="ic">${r + 1}</span><span class="grow"><span class="t">Round ${r + 1}</span><br><span class="s">${l.cards.slice(r * ROUND, (r + 1) * ROUND).map((c) => c.front).join(', ')}</span></span></button>`).join('')}`);
  if (F.phase === 'study') {
    const c = set[F.i];
    return page(`${head}<div class="progress"><span>Round ${F.r + 1} of ${total} · Study</span><span>Card ${F.i + 1} of ${set.length}</span></div><div class="bar"><i style="width:${F.i / set.length * 100}%"></i></div>
      <button class="flash ${F.flip ? 'flipped' : ''}" data-act="fflip"><span class="fw">${c.front}</span>${c.sub ? `<span class="fs">${c.sub}</span>` : ''}${F.flip ? `<span class="fb2">${c.back}</span>${c.ex ? `<span class="fx">${c.ex}</span>` : ''}` : `<span class="fhint">Say what you think it means, then tap to check</span>`}</button>
      ${F.flip ? `<div class="center">${sayBtn(c.front + '. ' + c.back + '. ' + (c.ex || ''))}</div><div class="btnrow">${F.i > 0 ? `<button class="btn ghost" data-act="fprev">← Back</button>` : ''}<button class="btn gold" data-act="fnext">${F.i === set.length - 1 ? 'Quiz me on these →' : 'Next card →'}</button></div>` : `<button class="btn gold" data-act="fflip">Show the meaning</button>`}`);
  }
  const q = F.q, ans = F.picked != null, ok = ans && F.picked === q.answer; // quiz
  page(`${head}<div class="progress"><span>Round ${F.r + 1} of ${total} · Quiz</span><span>${set.length - F.queue.length} of ${set.length} known</span></div><div class="bar ok"><i style="width:${(set.length - F.queue.length) / set.length * 100}%"></i></div>
    <div class="card">${qHTML(q)}${choicesHTML(q, ans ? 'review' : 'answer', F.picked)}</div>
    ${ans ? (ok ? `<div class="fb ok">✓ Correct!</div>` : `<div class="fb bad">Not quite. This card will come back.</div>${stepsHTML(q)}`) + `<button class="btn gold" data-act="fq">${F.queue.length ? 'Next →' : 'Finish the round →'}</button>` : ''}`);
}

// ---------- practice ----------
function viewPractice(id) {
  const i = idx(id); if (i < 0 || !unlocked(i)) return go('#/home');
  const l = LEVELS[i], lv = LV(id), f = flow(l, lv); if (!f.learned || !f.gdone) return go('#/level/' + id);
  if (!STATE.pr || STATE.pr.id !== id) STATE.pr = { id, d: 1, run: 0, q: l.gen(1), picked: null, hint: 0 };
  const S = STATE.pr, q = S.q, ans = S.picked != null, ok = ans && S.picked === q.answer;
  const goal = lv.passed ? '' : `<div class="progress"><span>Correct answers: ${Math.min(lv.practiced, lv.need)} of ${lv.need}</span><span>Difficulty ${'●'.repeat(S.d)}${'○'.repeat(3 - S.d)}</span></div><div class="bar ok"><i style="width:${Math.min(100, lv.practiced / lv.need * 100)}%"></i></div>`;
  let fb = '';
  if (ans) {
    const ready = !lv.passed && lv.practiced >= lv.need;
    fb = ok ? `<div class="fb ok">✓ Correct!${S.run >= 3 ? ` That's ${S.run} in a row.` : ''}</div><details class="rev"><summary>See the steps</summary>${stepsHTML(q)}</details>`
      : `<div class="fb bad">Not quite. The right answer is ${LETTERS[q.answer]}. Read each step:</div>${stepsHTML(q)}`;
    fb += ready ? `<div class="card gold"><h3>You're ready for the ${l.checkpoint ? 'Checkpoint' : 'Level Check'}!</h3><button class="btn" data-act="startcheck" data-id="${id}">Take it now →</button><button class="btn ghost" data-act="nextq">Keep practicing</button></div>`
      : `<button class="btn gold" data-act="nextq">${ok ? 'Next question →' : 'Got it. Try a new one →'}</button>${ok || !f.mid ? '' : `<button class="btn ghost sm" data-act="go" data-to="#/${f.mid}/${id}">${f.mid === 'guide' ? 'Do one together instead' : 'Back to the flashcards'}</button>`}`;
  } else if (S.hint) fb = `<div class="card info"><p class="small muted" style="margin:0"><b>HINT</b></p>${stepsHTML(q, S.hint, S.hint - 1)}</div>`;
  page(`<p class="small muted" style="margin:0">${label(l)}</p><h1>Practice</h1>${goal}
    <div class="card">${qHTML(q)}${choicesHTML(q, ans ? 'review' : 'answer', S.picked)}</div>${fb}
    ${ans ? '' : `${S.hint < q.steps.length - 1 ? `<button class="btn ghost sm" data-act="hint">💡 ${S.hint ? 'Another hint' : 'Give me a hint'}</button>` : ''}<p class="small muted center">${CFG.practiceHint}</p>`}`);
}

// ---------- level check / checkpoint ----------
function startCheck(id, testout) {
  const l = LEVELS[idx(id)], n = l.checkpoint ? CHECKPOINT_N : CHECK_N;
  const qs = []; for (let k = 0; k < n; k++) qs.push(l.gen(k < 3 ? 2 : pick([2, 3, 3])));
  STATE.ck = { id, qs, i: 0, picks: Array(n).fill(null), sel: null, done: false, testout: !!testout };
  go('#/check/' + id);
}
function viewCheck(id) {
  const S = STATE.ck; if (!S || S.id !== id) return go('#/level/' + id);
  const l = LEVELS[idx(id)], n = S.qs.length, need = Math.ceil(n * (S.testout ? TESTOUT : PASS));
  if (S.done) return viewCheckResults(l, S, need);
  const q = S.qs[S.i];
  page(`<p class="small muted" style="margin:0">${label(l)}</p><h1>${l.checkpoint ? 'Checkpoint' : 'Level Check'}</h1>
    <div class="progress"><span>Question ${S.i + 1} of ${n}</span><span>Pass: ${need} right</span></div><div class="bar"><i style="width:${S.i / n * 100}%"></i></div>
    <div class="card">${qHTML(q)}${choicesHTML(q, 'select', S.sel)}</div>
    <button class="btn gold" data-act="checknext" ${S.sel == null ? 'disabled' : ''}>${S.i + 1 < n ? 'Lock in answer →' : 'Finish →'}</button>
    <p class="small muted center">No hints here. Answers are shown at the end.</p>`);
}
const reviewHTML = (qs, picks) => qs.map((q, k) => { const ok = picks[k] === q.answer, none = picks[k] == null;
  return `<details class="rev" ${ok ? '' : 'open'}><summary>${ok ? '✓' : '✗'} Question ${k + 1}${ok ? '' : none ? ' — not answered' : ` — you chose ${LETTERS[picks[k]]}, the answer is ${LETTERS[q.answer]}`}</summary><div style="font-size:.9em">${qHTML(q)}</div>${choicesHTML(q, 'review', picks[k])}${ok ? '' : stepsHTML(q)}</details>`; }).join('');
function viewCheckResults(l, S, need) {
  const lv = LV(l.id), right = S.picks.filter((p, k) => p === S.qs[k].answer).length, passed = right >= need, nxt = LEVELS[idx(l.id) + 1], f = flow(l, lv);
  page(`<div class="card ${passed ? 'gold' : 'info'} center"><div class="big">${right} / ${S.qs.length}</div>
    <h2 style="margin:6px 0">${passed ? (l.checkpoint ? '🎉 Unit complete!' : '🎉 Level passed!') : 'Not yet. You need ' + need + '.'}</h2>
    <p>${passed ? (nxt ? `You unlocked <b>${label(nxt)}</b>.` : 'You have passed every level. Time for the practice tests!') : S.testout ? 'No problem. Work through the lesson and you will get it.' : `Look at the ones you missed below, practice ${lv.need} more, then try again.`}</p>
    ${passed ? (nxt ? `<button class="btn" data-act="go" data-to="#/level/${nxt.id}">Go to the next level →</button>` : `<button class="btn" data-act="go" data-to="#/home">Home</button>`) : S.testout ? `<button class="btn" data-act="go" data-to="#/level/${l.id}">Start the lesson →</button>` : `<button class="btn" data-act="go" data-to="#/practice/${l.id}">Practice now →</button>${f.mid === 'guide' ? `<button class="btn ghost" data-act="go" data-to="#/guide/${l.id}">Do one together first</button>` : ''}${f.hasLearn ? `<button class="btn ghost" data-act="go" data-to="#/learn/${l.id}">Review the lesson</button>` : ''}`}</div>
    <h2>Review</h2>${reviewHTML(S.qs, S.picks)}`);
}

// ---------- daily warm-up (spaced review) ----------
function buildWarm() {
  const p = P(), t = today(), items = [];
  const passed = LEVELS.filter((l) => !l.checkpoint && (lvOf(l.id) || {}).passed);
  const dueCards = shuffle(Object.entries(p.cards).filter(([cid, v]) => v[1] <= t && CARDLEVEL[cid])).sort((a, b) => a[1][0] - b[1][0]);
  const dueLv = passed.filter((l) => !l.cards && (lvOf(l.id).due || 0) <= t).sort((a, b) => (lvOf(a.id).due || 0) - (lvOf(b.id).due || 0));
  const nCard = Math.min(dueCards.length, dueLv.length ? Math.ceil(WARM_N / 2) : WARM_N);
  dueCards.slice(0, nCard).forEach(([cid]) => items.push({ l: CARDLEVEL[cid], cid }));
  for (const l of dueLv) { if (items.length >= WARM_N) break; items.push({ l }); }
  const pool = passed.length ? passed : Object.keys(p.cards).map((cid) => CARDLEVEL[cid]).filter(Boolean);
  while (items.length < WARM_N && pool.length) { const l = pick(pool); items.push(l.cards ? { l, cid: pick(l.cards.filter((c) => p.cards[c.id]) .concat(l.cards.slice(0, 1))).id } : { l }); }
  return shuffle(items).map((it) => ({ ...it, q: it.cid ? it.l.cardQ(it.cid) : it.l.gen(2) }));
}
function viewWarm() {
  if (!STATE.wm) { const items = buildWarm(); if (!items.length) return go('#/home'); STATE.wm = { items, i: 0, picked: null, right: 0 }; }
  const W = STATE.wm, n = W.items.length;
  if (W.i >= n) return page(`<div class="card gold center"><div class="big">${W.right} / ${n}</div><h2 style="margin:6px 0">Warm-up done ☀</h2><p>${W.right === n ? 'Perfect. Those skills are sticking.' : 'Nice work. The ones you missed will come back sooner, and they are saved in “Fix my mistakes”.'}</p><button class="btn" data-act="go" data-to="#/home">Back to my levels →</button></div>`, 'Warm-up');
  const it = W.items[W.i], q = it.q, ans = W.picked != null, ok = ans && W.picked === q.answer;
  page(`<h1>Today's warm-up</h1><div class="progress"><span>Question ${W.i + 1} of ${n}</span><span>${it.l.title}</span></div><div class="bar"><i style="width:${W.i / n * 100}%"></i></div>
    <div class="card">${qHTML(q)}${choicesHTML(q, ans ? 'review' : 'answer', W.picked)}</div>
    ${ans ? (ok ? `<div class="fb ok">✓ Correct!</div>` : `<div class="fb bad">Not quite. The right answer is ${LETTERS[q.answer]}.</div>${stepsHTML(q)}`) + `<button class="btn gold" data-act="wnext">${W.i + 1 < n ? 'Next →' : 'Finish →'}</button>` : ''}`, 'Warm-up');
}

// ---------- fix my mistakes ----------
function viewFix() {
  const p = P(); if (!STATE.fx) STATE.fx = { left: p.missed.length, fixed: 0, picked: null, order: null };
  const X = STATE.fx, m = p.missed[0];
  if (!m || X.left <= 0) { const h = `<div class="card gold center"><div class="big">${X.fixed}</div><h2 style="margin:6px 0">mistake${X.fixed === 1 ? '' : 's'} fixed</h2><p>${p.missed.length ? `${p.missed.length} still on your list. Come back to them later.` : 'Your list is empty. Great work.'}</p><button class="btn" data-act="go" data-to="#/home">Back to my levels →</button></div>`; STATE.fx = null; return page(h, 'Fix my mistakes'); }
  if (!X.order) X.order = m.ns ? [0, 1, 2, 3] : shuffle([0, 1, 2, 3]);
  const q = { q: m.q, fig: m.fig, sfig: m.sfig, steps: m.steps, choices: X.order.map((k) => m.choices[k]), answer: X.order.indexOf(m.answer) };
  X.q = q; const ans = X.picked != null, ok = ans && X.picked === q.answer;
  page(`<h1>Fix my mistakes</h1><div class="progress"><span>${X.left} to go</span><span>${X.fixed} fixed</span></div>
    <div class="card">${qHTML(q)}${choicesHTML(q, ans ? 'review' : 'answer', X.picked)}</div>
    ${ans ? (ok ? `<div class="fb ok">✓ Fixed! This one comes off your list.</div>` : `<div class="fb bad">Not yet. Read the steps. It stays on your list for next time.</div>${stepsHTML(q)}`) + `<button class="btn gold" data-act="xnext">Next →</button>` : ''}`, 'Fix my mistakes');
}

// ---------- practice tests ----------
function viewTest(tid) {
  const T = TESTS[tid]; if (!T) return go('#/home');
  if (!(lvOf(T.unlockAfter) || {}).passed) return go('#/home');
  const S = STATE.test && STATE.test.id === tid ? STATE.test : null;
  if (!S) {
    const hist = P().tests.filter((x) => x.id === tid).slice(-5).reverse();
    return page(`<h1>${T.name} practice test</h1><p>${T.about}</p>
      <div class="card"><ul class="rules"><li><b>${T.count} questions, ${T.minutes} minutes.</b> The timer keeps running.</li>${CFG.testRules.map((r) => `<li>${r}</li>`).join('')}<li>If time runs out, unanswered questions count as wrong. Guessing is better than leaving one blank.</li></ul></div>
      <button class="btn gold" data-act="starttest" data-id="${tid}">Start the timer →</button>
      ${hist.length ? `<h2>Your recent scores</h2><table class="hist"><tr><th>Date</th><th>Score</th><th>Time</th></tr>${hist.map((h) => `<tr><td>${new Date(h.date).toLocaleDateString()}</td><td>${h.correct}/${h.total} (${Math.round(h.correct / h.total * 100)}%)</td><td>${Math.floor(h.secs / 60)}:${pad(h.secs % 60)}</td></tr>`).join('')}</table>` : ''}`);
  }
  if (S.done) return viewTestResults(T, S);
  const q = S.qs[S.i];
  page(`<div class="progress"><span>${T.short} · Question ${S.i + 1} of ${S.qs.length}</span><span class="timer" id="timer"></span></div><div class="bar"><i style="width:${S.i / S.qs.length * 100}%"></i></div>
    <div class="card">${qHTML(q)}${choicesHTML(q, 'select', S.sel)}</div>
    <button class="btn gold" data-act="testnext" ${S.sel == null ? 'disabled' : ''}>${S.i + 1 < S.qs.length ? 'Lock in answer →' : 'Finish test →'}</button>
    <button class="btn ghost sm" data-act="quittest">Quit test</button>`, `${T.short} test`);
  const tick = () => { const left = Math.max(0, Math.round((S.end - Date.now()) / 1000)), el = document.getElementById('timer'); if (el) { el.textContent = `⏱ ${Math.floor(left / 60)}:${pad(left % 60)}`; el.classList.toggle('low', left < 120); } if (left <= 0) finishTest(true); };
  tick(); timer = setInterval(tick, 1000);
}
function finishTest(timeUp) {
  const S = STATE.test; if (!S || S.done) return;
  S.done = true; S.timeUp = !!timeUp;
  const right = S.picks.filter((p, k) => p === S.qs[k].answer).length;
  S.secs = Math.min(Math.round((Date.now() - S.start) / 1000), TESTS[S.id].minutes * 60);
  S.before = readiness().overall;
  S.qs.forEach((q, k) => { const ok = S.picks[k] === q.answer; record(null, ok); if (!ok) addMissed(q); });
  P().tests.push({ id: S.id, date: Date.now(), correct: right, total: S.qs.length, secs: S.secs }); save();
  route();
}
function viewTestResults(T, S) {
  const right = S.picks.filter((p, k) => p === S.qs[k].answer).length, pct = Math.round(right / S.qs.length * 100), after = readiness().overall;
  const msg = pct >= 85 ? 'Excellent. That is a strong, comfortable score.' : pct >= 70 ? 'Solid work. Keep it up to build a safety margin.' : pct >= 55 ? 'Close. Review the missed questions and the levels behind them.' : 'Keep going. Review the levels for the questions you missed, then try again.';
  page(`<div class="card hero center"><p class="muted" style="margin:0">${T.name}${S.timeUp ? ' · time ran out' : ''}</p><div class="big">${right} / ${S.qs.length}</div><h2 style="margin:4px 0">${pct}% correct</h2><p class="muted">${msg}</p>
    <p class="small muted">Time used: ${Math.floor(S.secs / 60)}:${pad(S.secs % 60)} of ${T.minutes}:00 · Readiness ${S.before}% → <b style="color:#fff">${after}%</b></p></div>
    <div class="btnrow"><button class="btn" data-act="go" data-to="#/score">See my score</button><button class="btn ghost" data-act="retest" data-id="${T.id}">Take another</button></div>
    <h2>Review</h2>${reviewHTML(S.qs, S.picks)}`);
}

// ---------- score ----------
function viewScore() {
  const p = P(), r = readiness(), [bl, bc] = band(r.overall);
  const passed = LEVELS.filter((l) => (lvOf(l.id) || {}).passed).length, nCards = Object.keys(p.cards).length;
  const sec = (k, name) => { const s = r[k], [b2, c2] = band(s.val);
    return `<div class="card"><div class="row"><div class="grow"><h3 style="margin:0">${name} (${k})</h3><span class="pill ${c2}">${b2}</span></div><b style="font-size:24px">${s.val}%</b></div>
      <div class="bar" style="margin:10px 0 6px"><i style="width:${s.val}%"></i></div>
      <p class="small muted" style="margin:0">Levels passed: ${s.passed} of ${s.total} · Skill score ${s.skill}% · ${s.test == null ? 'No practice tests yet' : `Practice tests (last ${s.tests}): ${s.test}%`}</p></div>`; };
  const weak = LEVELS.filter((l) => !l.checkpoint && (lvOf(l.id) || {}).passed).map((l) => { const lv = lvOf(l.id); const acc = lv.recent.length ? lv.recent.reduce((a, c) => a + c, 0) / lv.recent.length : lv.best; return { l, acc }; }).sort((a, c) => a.acc - c.acc).slice(0, 3).filter((w) => w.acc < 0.9);
  const row = (a, b) => `<div class="row"><div class="grow">${a}</div><b>${b}</b></div>`;
  page(`<h1>${esc(p.name)}'s score</h1>
    <div class="card row">${ring(r.overall, 'light big')}<div class="grow"><h3>${SUBJ} readiness</h3><span class="pill ${bc}">${bl}</span><p class="small muted">An estimate of how ready you are for the two ASVAB ${SUBJ} sections, based on the levels you've passed, your recent accuracy and your timed practice tests.</p></div></div>
    ${SECS.map((k) => sec(k, CFG.sections[k])).join('')}
    <div class="card">${row('Levels passed', `${passed} / ${LEVELS.length}`)}${nCards ? row('Flashcards learned', nCards) : ''}${row('Questions answered', p.answered)}${row('Accuracy overall', (p.answered ? Math.round(p.correct / p.answered * 100) : 0) + '%')}${row('Practice streak', `${streak()} day${streak() === 1 ? '' : 's'}`)}${row('Mistakes waiting to be fixed', p.missed.length)}</div>
    ${weak.length ? `<h2>Weak spots to review</h2>${weak.map((w) => `<button class="lvl" data-act="go" data-to="#/practice/${w.l.id}"><span class="ic">!</span><span class="grow"><span class="t">${w.l.title}</span><br><span class="s">Recent accuracy ${Math.round(w.acc * 100)}% · tap to practice</span></span></button>`).join('')}` : ''}
    <h2>What "passing" means</h2><div class="card small">${CFG.passingHTML}<p class="muted">This is a study estimate, not an official score. Only the real ASVAB gives an official AFQT.</p></div>`, 'My score');
}

// ---------- settings ----------
function viewSettings() {
  const p = P(), others = Object.values(DB.profiles).filter((x) => x.id !== p.id);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  page(`<h1>Settings</h1>
    <div class="card"><h3>Studying as ${esc(p.name)}</h3>${others.map((o) => `<button class="btn ghost sm" data-act="usep" data-id="${o.id}">Switch to ${esc(o.name)}</button> `).join('')}<button class="btn ghost sm" data-act="go" data-to="#/who">Add another person</button></div>
    <div class="card"><h3>Use it without wifi</h3>${standalone ? '<p class="small">✓ Installed. It works with no internet connection.</p>' : ios
      ? '<p class="small">In Safari, tap the <b>Share</b> button, then <b>Add to Home Screen</b>. Open it from the home screen icon and it works with no internet.</p>'
      : `<p class="small">Install it as an app so it opens from your home screen and works with no internet.</p>${deferredInstall ? '<button class="btn gold" data-act="install">Install the app</button>' : '<p class="small muted">In Chrome, open the ⋮ menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</p>'}`}
      <p class="small muted">Once you've opened it one time with internet, everything works offline${CFG.hasVideo ? ', including the videos' : ''}.</p></div>
    <div class="card"><h3>${CFG.otherApp.name}</h3><p class="small">The other half of the AFQT. Same layout, its own progress.</p><a class="btn ghost sm" href="${CFG.otherApp.url}">Open ${CFG.otherApp.name}</a></div>
    <div class="card"><h3>Share this app</h3><p class="small">Send the link to someone else who is studying. Their progress stays on their own device.</p><button class="btn ghost sm" data-act="share">Share the link</button></div>
    <div class="card"><h3>Back up progress</h3><p class="small">Progress is saved on this device only. Save a backup file before switching phones or clearing your browser.</p>
      <button class="btn ghost sm" data-act="backup">Save a backup file</button> <label class="btn ghost sm" style="display:inline-flex">Restore from a file<input type="file" accept="application/json,.json" id="restore" hidden></label></div>
    <div class="card"><h3>Start over</h3><p class="small">Erase ${esc(p.name)}'s progress on this device.</p><button class="btn ghost sm" data-act="reset">Erase progress</button></div>
    <button class="btn ghost" data-act="go" data-to="#/about">About this app</button>`, 'Settings');
  const f = document.getElementById('restore'); if (f) f.addEventListener('change', restore);
}
function viewAbout() {
  page(`<h1>About ${CFG.app}</h1><div class="card small">${CFG.aboutHTML}
    <p><b>How it teaches:</b> every level goes Learn → ${CFG.guided ? 'Do it together → ' : ''}Practice → Level Check. Lessons use pictures and one small step at a time, with a quick check on each idea. A daily warm-up brings back older skills so they are not forgotten, and “Fix my mistakes” keeps every missed question until it is answered correctly. This follows what research on learning recommends: clear step-by-step teaching with pictures, guided practice before independent practice, feedback on every answer, and practice spread out over time.</p>
    <p class="muted">This app is a study tool. It is not affiliated with or endorsed by the U.S. Department of Defense or any branch of the military, and its readiness score is an estimate, not an official ASVAB or AFQT score.</p></div>`, 'About');
}
function restore(e) {
  const file = e.target.files[0]; if (!file) return;
  const rd = new FileReader();
  rd.onload = () => { try { const d = JSON.parse(rd.result); const prof = d.profile || d; if (!prof || !prof.levels || !prof.name) throw new Error('bad');
    prof.id = prof.id || 'p' + Date.now().toString(36); DB.profiles[prof.id] = prof; DB.current = prof.id; save(); toast(`Restored ${prof.name}'s progress.`); go('#/home'); } catch (err) { toast(`That file is not an ${CFG.app} backup.`); } };
  rd.readAsText(file);
}

// ---------- actions ----------
function review(it, ok) { // spaced-review bookkeeping after a warm-up answer
  const t = today(), p = P();
  if (it.cid) { const c = p.cards[it.cid] || [1, t]; c[0] = ok ? Math.min(5, c[0] + 1) : 1; c[1] = t + GAPS[c[0]]; p.cards[it.cid] = c; }
  else { const lv = LV(it.l.id); lv.box = ok ? Math.min(5, (lv.box || 1) + 1) : 1; lv.due = t + GAPS[lv.box]; }
}
function nextFlashQ(F, l) { F.q = l.cardQ(F.queue[0]); F.picked = null; }
const ACT = {
  go: (t) => go(t.dataset.to),
  say: (t) => speak(t.dataset.t),
  addp: () => { const el = document.getElementById('nm'), v = (el && el.value || '').trim(); if (!v) { toast('Type a first name to start.'); if (el) el.focus(); return; } newProfile(v.slice(0, 24)); STATE = {}; go('#/home'); },
  usep: (t) => { DB.current = t.dataset.id; save(); STATE = {}; go('#/home'); },
  // lesson
  lpick: (t) => { const S = STATE.les, a = lessonOf(LEVELS[idx(S.id)]).cards[S.k].ask; if (S.ok === true) return; S.picked = +t.dataset.i; S.ok = S.order[S.picked] === a.a; rerender(); },
  lprev: () => { const S = STATE.les; S.k = Math.max(0, S.k - 1); S.ask = null; route(); },
  lnext: () => { const S = STATE.les, l = LEVELS[idx(S.id)], les = lessonOf(l), lv = LV(S.id);
    if (S.k < les.cards.length - 1) { S.k++; S.ask = null; lv.card = Math.max(lv.card || 0, S.k); save(); return route(); }
    const first = !lv.learned; lv.learned = true; save(); STATE.les = null; go(first ? afterLearn(l) : '#/level/' + l.id); },
  key: (t) => {
    const k = t.dataset.k, h = location.hash;
    if (h.startsWith('#/learn/')) { const S = STATE.les, a = lessonOf(LEVELS[idx(S.id)]).cards[S.k].ask; if (!a || a.opts || S.ok === true) return;
      if (k === 'ok') { if (!S.input || S.input === '-') return; S.ok = numOK(S.input, a.num); if (!S.ok) S.input = ''; } else { typeKey(S, k); if (S.ok === false) S.ok = null; } return rerender(); }
    if (h.startsWith('#/guide/')) { const G = STATE.gd, b = blankOf(G.q.steps[G.i] || ''); if (!b || G.open) return;
      if (k === 'ok') { if (!G.input || G.input === '-') return; if (numOK(G.input, b.ans)) { G.open = true; G.helped = false; } else { G.tries++; G.input = ''; } } else typeKey(G, k); return rerender(); }
  },
  nextstep: () => { STATE.learn.shown++; rerender(); },
  nextex: () => { const l = LEVELS[idx(STATE.learn.id)]; STATE.learn = { id: l.id, n: 1, q: l.gen(2), shown: 1 }; route(); },
  anotherex: () => { const S = STATE.learn, l = LEVELS[idx(S.id)]; S.q = l.gen(S.n === 0 ? 1 : 2); S.shown = 1; route(); },
  learned: () => { const l = LEVELS[idx(STATE.learn.id)]; LV(l.id).learned = true; save(); STATE.learn = null; go(afterLearn(l)); },
  // guided
  gshow: () => { const G = STATE.gd; G.open = true; G.helped = true; rerender(); },
  gnext: () => { const G = STATE.gd, lv = LV(G.id); G.i++; G.input = ''; G.tries = 0; G.open = false; G.helped = false;
    if (G.i >= G.q.steps.length) { lv.guided = (lv.guided || 0) + 1; if (lv.guided >= GUIDED_NEED) lv.gdone = true; record(G.id, true); save(); } rerender(); },
  gnew: () => { const G = STATE.gd, l = LEVELS[idx(G.id)]; STATE.gd = newGuide(l, LV(l.id)); route(); },
  // flashcards
  fflip: () => { STATE.fc.flip = true; rerender(); },
  fprev: () => { const F = STATE.fc; F.i = Math.max(0, F.i - 1); F.flip = false; route(); },
  fnext: () => { const F = STATE.fc, l = LEVELS[idx(F.id)], set = l.cards.slice(F.r * ROUND, (F.r + 1) * ROUND);
    if (F.i < set.length - 1) { F.i++; F.flip = false; } else { F.phase = 'quiz'; F.queue = shuffle(set.map((c) => c.id)); nextFlashQ(F, l); } route(); },
  fq: () => { const F = STATE.fc, l = LEVELS[idx(F.id)], lv = LV(F.id), p = P(), total = Math.ceil(l.cards.length / ROUND);
    if (F.queue.length) { nextFlashQ(F, l); return route(); }
    l.cards.slice(F.r * ROUND, (F.r + 1) * ROUND).forEach((c) => { if (!p.cards[c.id]) p.cards[c.id] = [1, today() + 1]; });
    lv.rounds = Math.max(lv.rounds || 0, F.r + 1); if (lv.rounds >= total) lv.gdone = true; save();
    if (lv.rounds >= total) { STATE.fc = { id: F.id, r: 0, phase: 'done', i: 0, flip: false }; toast('All rounds done!'); } else { STATE.fc = { id: F.id, r: lv.rounds, phase: 'study', i: 0, flip: false }; toast(`Round ${F.r + 1} done. Next round!`); }
    route(); },
  fround: (t) => { const F = STATE.fc; STATE.fc = { id: F.id, r: +t.dataset.r, phase: 'study', i: 0, flip: false }; route(); },
  pick: (t) => {
    const i = +t.dataset.i, h = location.hash;
    if (h.startsWith('#/practice/')) { const S = STATE.pr; if (!S || S.picked != null) return; S.picked = i; const ok = i === S.q.answer, lv = LV(S.id);
      record(S.id, ok); if (ok) { S.run++; if (!lv.passed) lv.practiced++; } else { S.run = 0; addMissed(S.q, S.id); } save(); rerender(); }
    else if (h.startsWith('#/guide/')) { const G = STATE.gd; if (G.open) return; if (i === G.q.answer) { G.open = true; G.helped = false; } else G.tries++; rerender(); }
    else if (h.startsWith('#/check/')) { STATE.ck.sel = i; rerender(); }
    else if (h.startsWith('#/test/')) { STATE.test.sel = i; rerender(); }
    else if (h.startsWith('#/cards/')) { const F = STATE.fc; if (F.picked != null) return; F.picked = i; const ok = i === F.q.answer, cid = F.queue.shift(); record(F.id, ok); if (!ok) F.queue.push(cid); save(); rerender(); }
    else if (h.startsWith('#/warm')) { const W = STATE.wm; if (W.picked != null) return; W.picked = i; const it = W.items[W.i], ok = i === it.q.answer; if (ok) W.right++; else addMissed(it.q, it.l.id); record(it.l.id, ok); review(it, ok); save(); rerender(); }
    else if (h.startsWith('#/fix')) { const X = STATE.fx; if (X.picked != null) return; X.picked = i; const p = P(), ok = i === X.q.answer, m = p.missed.shift(); X.left--; if (ok) X.fixed++; else p.missed.push(m); record(m.lid, ok); save(); rerender(); }
  },
  hint: () => { STATE.pr.hint++; rerender(); },
  nextq: () => { const S = STATE.pr, l = LEVELS[idx(S.id)], ok = S.picked === S.q.answer;
    S.d = ok ? (S.run >= 4 ? 3 : S.run >= 2 ? Math.max(S.d, 2) : S.d) : Math.max(1, S.d - 1); S.q = l.gen(S.d); S.picked = null; S.hint = 0; route(); },
  startcheck: (t) => startCheck(t.dataset.id, false),
  testout: (t) => startCheck(t.dataset.id, true),
  checknext: () => {
    const S = STATE.ck; if (S.sel == null) return;
    S.picks[S.i] = S.sel; S.sel = null; S.i++;
    if (S.i >= S.qs.length) {
      S.done = true; const lv = LV(S.id), right = S.picks.filter((p, k) => p === S.qs[k].answer).length, pct = right / S.qs.length;
      S.qs.forEach((q, k) => { const ok = S.picks[k] === q.answer; record(S.id, ok); if (!ok) addMissed(q, S.id); });
      lv.attempts++; lv.best = Math.max(lv.best, pct);
      if (right >= Math.ceil(S.qs.length * (S.testout ? TESTOUT : PASS))) { lv.passed = true; lv.learned = true; lv.gdone = true; lv.practiced = Math.max(lv.practiced, lv.need); lv.box = 1; lv.due = today() + 1; }
      else if (!lv.passed && !S.testout) { lv.practiced = 0; lv.need = RETRY_NEED; }
      save(); STATE.pr = null;
    }
    route();
  },
  wnext: () => { const W = STATE.wm; W.i++; W.picked = null; if (W.i >= W.items.length) { P().warm = today(); save(); } route(); if (W.i >= W.items.length) STATE.wm = null; },
  xnext: () => { const X = STATE.fx; X.picked = null; X.order = null; route(); },
  starttest: (t) => { const T = TESTS[t.dataset.id], qs = []; for (let k = 0; k < T.count; k++) qs.push(pick(T.gens)(pick([2, 3, 3]))); STATE.test = { id: T.id, qs, i: 0, picks: Array(T.count).fill(null), sel: null, start: Date.now(), end: Date.now() + T.minutes * 60000, done: false }; route(); },
  testnext: () => { const S = STATE.test; if (S.sel == null) return; S.picks[S.i] = S.sel; S.sel = null; S.i++; if (S.i >= S.qs.length) finishTest(false); else route(); },
  quittest: () => { if (confirm('Quit this test? It will not be scored.')) { STATE.test = null; go('#/home'); } },
  retest: (t) => { STATE.test = null; go('#/test/' + t.dataset.id); },
  install: async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => {}); deferredInstall = null; route(); },
  share: async () => { const url = location.origin + location.pathname; try { if (navigator.share) await navigator.share({ title: CFG.app, text: `Practice ASVAB ${SUBJ} step by step. Works offline.`, url }); else { await navigator.clipboard.writeText(url); toast('Link copied.'); } } catch (e) { /* cancelled */ } },
  backup: () => { const p = P(), blob = new Blob([JSON.stringify({ app: CFG.key, version: 2, saved: new Date().toISOString(), profile: p }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${CFG.app.toLowerCase().replace(/ /g, '-')}-${p.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${dayKey(new Date())}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); },
  reset: () => { const p = P(); if (confirm(`Erase all of ${p.name}'s progress? This cannot be undone.`) && confirm('Are you sure? Save a backup first if you might want it.')) { Object.assign(p, { levels: {}, tests: [], answered: 0, correct: 0, days: [], missed: [], cards: {}, warm: null }); save(); STATE = {}; go('#/home'); } },
};
app.addEventListener('click', (e) => { const t = e.target.closest('[data-act]'); if (!t || t.disabled) return; const f = ACT[t.dataset.act]; if (f) { e.preventDefault(); f(t); } });
app.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-act]')) { e.preventDefault(); e.target.click(); } });
document.addEventListener('keydown', (e) => { // keyboard: digits type into a number box, 1–4 or A–D pick an answer, Enter continues
  if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey) return;
  if (document.querySelector('.keys')) { const k = e.key === 'Backspace' ? '⌫' : e.key === 'Enter' ? 'ok' : e.key === '-' ? '±' : /^[0-9.]$/.test(e.key) ? e.key : null; if (k) { e.preventDefault(); const b = document.querySelector(`.key[data-k="${k}"]`); if (b) b.click(); } return; }
  const k = e.key.toUpperCase(), i = ['1', '2', '3', '4'].indexOf(k) >= 0 ? +k - 1 : LETTERS.indexOf(k);
  if (i >= 0) { const b = document.querySelector(`.choice[data-i="${i}"]:not(:disabled)`); if (b) { b.click(); return; } }
  if (e.key === 'Enter') { const b = document.querySelector('main .btn.gold:not(:disabled)'); if (b) b.click(); }
});
if (canSpeak) window.speechSynthesis.getVoices();
window.ASVAB_APP = { blankOf, toSpeech, state: () => STATE };
route();
})();
