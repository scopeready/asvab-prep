# ASVAB Prep

Two study apps for the ASVAB sections that make up the AFQT (the score that decides whether someone can enlist):

| App | Covers | Live |
|---|---|---|
| **ASVAB Math** (`math/`) | Arithmetic Reasoning and Mathematics Knowledge: 32 levels in 5 units, from adding whole numbers to algebra and geometry | https://asvab-math.vercel.app |
| **ASVAB English** (`english/`) | Word Knowledge and Paragraph Comprehension: 505 flashcards (420 words, 85 word parts), 5 reading levels | https://asvab-english.vercel.app |

Both are plain HTML, CSS and JavaScript. There is no build step, no account and no server. Progress is saved on the learner's own device, and after one visit with internet the whole app (videos included) works offline. They install to a phone's home screen.

## How a level teaches

Every level is locked until the one before it is passed.

1. **Learn.** About ten short cards. One idea per card, a picture before the symbols, plain words, and the reason behind each step. Most cards end with a quick check that has to be answered correctly before the next card opens. Any card can be read aloud. Eight math lessons open with a one-minute narrated video.
2. **Do it together** (math). The app walks through two problems one step at a time and the learner types the missing number in each step. Two wrong tries on a step offers "Show me this step".
   **Flashcards** (English word levels). Eight cards at a time: study them, then a quiz that keeps bringing back any card that was missed.
3. **Practice.** Five correct answers on their own, with hints on request. A miss shows every step, and the question goes on the "Fix my mistakes" list.
4. **Level Check.** Ten questions, no hints, 8 right to pass. A unit ends with a 12-question checkpoint. A learner who already knows a level can take the check straight away and needs 9 of 10.

Around the levels:

- **Today's warm-up**: six questions a day from levels already passed, on a spaced schedule (1, 2, 4, 8, 16 days; a miss resets it), so old skills are not forgotten.
- **Fix my mistakes**: every missed question stays on a list until it is answered correctly.
- **Timed practice tests** at the real computer-test length: AR 15 questions in 55 minutes, MK 15 in 31, WK 15 in 9, PC 10 in 27 ([official ASVAB site](https://www.officialasvab.com/applicants/what-to-expect/)).
- **Readiness score** per section: half from levels passed and recent accuracy, half from the last three timed tests.

This design follows the U.S. Institute of Education Sciences practice guides: explicit teaching in small steps, pictures and concrete models before symbols, worked examples that fade into guided practice, feedback on every answer, and practice spread out over time
([struggling students in math](https://ies.ed.gov/ncee/wwc/PracticeGuide/26), [organizing instruction and study](https://ies.ed.gov/ncee/wwc/PracticeGuide/1)).

## Layout

```
shared/     the engine both apps use
  app.js          screens, progress, warm-up, mistakes list, read-aloud, tests, score
  styles.css
  viz.js          the picture library (V.stack, V.nl, V.fbars, V.rect, V.plane, …), all drawn in code so the math is exact
  sw.template.js  offline worker (answers video byte-range requests from the cache, which Safari needs)
math/       levels.js, levels2.js (question generators), figs.js (pictures for practice questions),
            lessons/u1–u5.js (lesson cards), lessons/videos.js, video/*.mp4
english/    levels.js, data/ (words, word parts, passages), lessons/all.js
tools/
  sync.cjs        copies shared/ into each app folder and writes each sw.js
  LESSON-SPEC.md  how a lesson is written, and the file format
  video/          scripts.js (scene text), narration.cjs, build.cjs (renders frames, joins them with the voice)
tests/      see below
```

`math/` and `english/` are each deployed on their own (two Vercel projects, root directory `math` and `english`), so each folder holds a copy of the shared files. **Edit the shared files in `shared/`, then run the sync.** The copies of `app.js`, `styles.css`, `viz.js` and `sw.js` inside the app folders are written by the tool.

## After any change

```bash
node tools/sync.cjs v4          # copy shared files, bump the offline cache name (use the next number each release)
node tests/lesson-check.cjs math math/lessons/u1.js     # format and length rules for lesson cards
node tests/stress.cjs math      # thousands of generated questions per level: 4 different choices, valid answer, no broken text
node tests/stress.cjs english   # also checks no vocabulary question offers a near-synonym as a wrong choice
node tests/answers.cjs          # works out every math answer from the question text alone and compares it with the keyed choice
node tests/e2e.cjs math         # a phone-sized browser plays level 1 start to finish and opens every lesson card
node tests/e2e.cjs english
node tests/playthrough.cjs math # plays EVERY level, checkpoint and timed test in order (a few minutes; also: english)
node tests/offline.cjs math     # loads once, cuts the connection, checks a lesson and a video still load
node tests/upgrade.cjs math     # progress saved by an older version still works
```

The browser tests need Playwright (`npm i -D playwright`, or set `PW=/path/to/playwright`). To look at the app locally: `cd math && python3 -m http.server 8000`.

Bump the version in `tools/sync.cjs`'s argument on every release, or phones keep serving the old cached files.

## Rules that keep saved progress working

- The storage keys (`asvabMath.v1`, `asvabEnglish.v1`) and the level ids (`add`, `sub`, … `v1-1`, `pcmain`, …) must not change. A learner's progress is stored under them on their phone.
- New fields on a saved level must be optional (see `LV()` in `shared/app.js`).

## Lessons

`tools/LESSON-SPEC.md` is the standard: one idea per card, picture before symbols, sentences under 18 words, every math word explained the first time, a running example, at least three checks, one "Watch out" card, a "Remember" card, and the lesson must teach exactly what that level's generator asks. A wrong lesson is worse than no lesson, so every number in a card is recomputed by hand before it ships.

## Videos

Eight math lessons (adding, subtracting, multiplying, dividing, order of operations, negative numbers, adding fractions, percents) open with a narrated video of about a minute. The pictures are drawn by `viz.js`, the same drawings the lesson uses; only the voice is generated (text-to-speech from the `say` lines in `tools/video/scripts.js`, slowed slightly). Each scene shows its narration as a caption.

```bash
# put one clip per scene in a folder, named <id>-<scene>.mp3 (add-1.mp3 … add-6.mp3), then:
node tools/video/build.cjs path/to/clips          # writes math/video/*.mp4, *.jpg and math/lessons/videos.js
node tools/sync.cjs v4
```

## Not affiliated

A study tool. Not affiliated with or endorsed by the U.S. Department of Defense or any branch of the military. The readiness score is an estimate, not an official ASVAB or AFQT score.
