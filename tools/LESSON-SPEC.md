# Lesson spec (ASVAB Prep)

A lesson is what a learner sees in the **Learn** step of a level, before guided practice. The learner is a young adult who finds math hard, may read at about a 6th-grade level, and is studying alone on a phone. The first version of this app taught with a list of rules and two worked examples; the owner tried it and said it "wasn't easy to understand". These lessons replace that.

## How to teach (follow all of these)
1. **One idea per card.** A card is one phone screen: a short title, 1–3 short sentences, and usually a picture.
2. **Picture before symbols.** Show the idea with a picture first (number line, fraction bar, stacked arithmetic, a labeled shape), then the numbers. Never explain with a wall of text.
3. **Plain words.** Sentences under 18 words. Explain every math word the first time, in the same sentence: "the denominator (the bottom number)". No "simply", "just", "obviously".
4. **Explain WHY, briefly,** not only what to do: "We carry the 1 because 10 ones make 1 ten."
5. **One running example**, built up step by step across cards, then a **second example where the learner does the steps** (ask cards).
6. **Check understanding often.** At least 3 cards have an `ask`. The learner must answer correctly to move on. Ask about the step just taught, not something new. The first card never asks.
7. **Name the classic mistake** in one "Watch out" card (set `tip: true`), e.g. "Do not add the bottom numbers."
8. **End with a "Remember" card**: 2–3 short takeaways, `say` only, using `<br>` between lines.
9. **Match the practice.** Read the level's generator in `math/levels.js` / `math/levels2.js` (or `english/levels.js`) and its `rules`. Teach exactly the skills its questions ask (all of its question types, briefly), using the same vocabulary and method its step-by-step solutions use.
10. Numbers in examples stay small and friendly. Everyday settings (money, sports, cooking, driving, military training) are welcome. Nothing about real people, brands, politics or religion.
11. The text is also **read aloud and used as video narration**, so `say` must make sense when heard: write "3 times 4" in a sentence rather than only symbols, and do not write "as shown below".

## File format
One file per unit, plain JavaScript, no imports:

```js
window.LESSONS = window.LESSONS || {};
LESSONS.add = {
  hook: 'One sentence on why this skill matters in real life or on the test.',   // max 30 words
  cards: [
    { t: 'Line up the places', say: 'Write the numbers on top of each other. Ones go under ones, and tens go under tens.', fig: V.stack(47, 38, '+', { ans: false, marks: false }) },
    { t: 'Add the ones first', say: 'Start on the right. 7 plus 8 is 15. That is 1 ten and 5 ones.', fig: V.stack(47, 38, '+', { show: 1, hi: 0 }) },
    { t: 'Your turn', say: 'Now the tens. Remember the 1 we carried.',
      fig: V.stack(47, 38, '+', { show: 1 }),
      ask: { q: '4 + 3 + 1 = ?', num: 8, why: '4 tens + 3 tens = 7 tens, plus the 1 ten we carried makes 8 tens.' } },
    { t: 'Which is right?', say: 'Look at where the carried 1 goes.',
      ask: { q: 'What is 26 + 17?', opts: ['43', '33', '313', '42'], a: 0, why: '6 + 7 = 13: write 3, carry 1. Then 2 + 1 + 1 = 4. The answer is 43.' } },
    { t: 'Watch out', tip: true, say: 'Do not forget the carried 1. Write it small above the next column so you see it.' },
    { t: 'Remember', say: 'Line up the places.<br>Start on the right.<br>Ten or more in a column? Write the ones digit and carry 1.' },
  ],
};
```

### Card fields
| Field | Required | Rules |
|---|---|---|
| `t` | yes | Title, at most 44 characters. |
| `say` | yes | 4–55 words of simple HTML. Allowed tags: `<b> <i> <br> <sup> <sub> <mark> <u>`. For a fraction use `V.fr(3, 4)` inside a template string. |
| `fig` | most cards | A picture: a call to a `V.` function (below), or several joined with `+`. |
| `tip` | no | `true` styles the card as a "Watch out" warning. |
| `ask` | 3+ cards | A check. Either multiple choice `{ q, opts: [4 different strings], a: indexOfRightAnswer, why }` (the app shuffles the choices), or a typed number `{ q, num: 12, why }`. Use `num` only for whole numbers, decimals or negative numbers the learner can type on a number pad. `why` (max 45 words) is shown after a wrong answer AND after a right one, so write it as the explanation, not as "Wrong!". |

Use `×`, `÷`, `−` (real minus sign U+2212), `²`, `√`, `π`, `°`, `≥`, `≤` characters directly. Use `<sup>` for other powers. Variables go in `<i>x</i>`.

## Pictures: the `V` library (`shared/viz.js`)
Open `tests/gallery.html` to see what each one looks like (source: `shared/viz.js`). All return an HTML string.

| Call | Draws |
|---|---|
| `V.stack(a, b, '+' \| '-' \| 'x', opts)` | Stacked column arithmetic with carry/borrow marks. `opts`: `{ ans:false }` hide the answer row; `{ show:k }` show only the k right-most answer digits (build up step by step); `{ hi:k }` highlight column k (0 = ones); `{ marks:false }` hide carry/borrow marks. A 2-digit multiplier shows partial products. |
| `V.longdiv(680, 20)` | Long division with the work. `{ work:false }` shows only the bracket and quotient. |
| `V.pv(4372)` | Place-value chart. |
| `V.nl(min, max, { pts:[[value,'label']], jumps:[[from,to,'+5']], step:1, labelEvery:1 })` | Number line with points and jump arrows (green = right/up, red = left/down). |
| `V.fbar(n, d)` / `V.fbars([[1,2],[2,4]])` | One fraction bar / stacked bars of equal width (equal fractions, common denominators, comparing). |
| `V.pie(n, d)` | Circle with n of d slices shaded. |
| `V.dots(rows, cols)` / `V.groups(total, size)` | Array of dots (multiplication) / dots circled in groups (division). |
| `V.grid100(p)` / `V.pbar(p, { whole: 80 })` | 100-square grid with p shaded / percent bar with the part labeled under it. |
| `V.balance('2x + 3', '11')` | Level balance scale (both sides equal). |
| `V.eq([['2<i>x</i> + 3 = 11'], ['2<i>x</i> = 8', 'subtract 3 from both sides'], …])` | Lined-up equation steps with a note beside each. |
| `V.tbl(rows, head)` | Small table, e.g. `V.tbl([['2','$3'],['10','?']], ['pens','cost'])`. |
| `V.rect(w, h, { unit:'ft', inside:'area = ?' })`, `V.square(s)`, `V.tri(base, h)`, `V.rtri(a, b, c)` (strings allowed, e.g. `'?'`), `V.circle({ r:5 })` or `{ d:10 }`, `V.box(l, w, h)`, `V.cyl(r, h)`, `V.trap(b1, b2, h)`, `V.para(b, h)` | Labeled shapes. |
| `V.ang(60)`, `V.angsplit(90, 35)`, `V.angsplit(180, 110)`, `V.triang('77°','72°','?')` | Angles: one angle; a right angle or straight line split into a known angle and "?"; a triangle with its three angles labeled. |
| `V.plane({ pts:[[1,2],[4,5]], line:[m, b], rise:true })` | Coordinate grid with points, a line y = mx + b, and rise/run. |
| `V.fr(3, 4)` | An inline stacked fraction for use inside `say`, `q`, `opts`, `why`. |

If no picture fits a card, leave `fig` out. Do not invent other helpers and do not write raw `<svg>`.

## Check your work
```bash
node tests/lesson-check.cjs math math/lessons/u1.js add,sub,mul,div,order,neg
```
It must print `ALL OK`. Then reread every `ask`: is the stated answer really correct, and are the three other choices really wrong? Recompute every number in every card by hand. A wrong lesson is worse than no lesson.
