# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Three offline study apps for the ASVAB. Two cover the four sections that make up the AFQT; the third covers the science and technical sections:

- **ASVAB Math** (`math/`): Arithmetic Reasoning and Mathematics Knowledge. Live at https://asvab-math.vercel.app
- **ASVAB English** (`english/`): Word Knowledge and Paragraph Comprehension. Live at https://asvab-english.vercel.app
- **ASVAB Science & Tech** (`science/`): General Science, Electronics, Auto, Shop and Mechanical Comprehension. Live at https://asvab-science.vercel.app

Plain HTML, CSS and JavaScript. No framework, no build step, no server, no account. Progress is saved on the learner's own device. `README.md` has the layout, how a level teaches, and every test command; read it first.

The learner is a young adult who finds math hard and is studying alone on a phone. The owner tried the first version and said the math "wasn't easy to understand", which is why the lessons are picture cards with small steps. Keep everything that plain.

This project is deliberately separate from the owner's Medicare and insurance repositories. Do not put ASVAB code in any other repository, and do not put anything else in this one.

## Publishing (important)

The three Vercel projects, `asvab-math`, `asvab-english` and `asvab-science`, are **not** linked to this repository, so a merge to `main` does not update the live sites. After a merge, create a production deployment for each project from the new `main` commit (Vercel `create_deployment` with a GitHub `gitSource` for `scopeready/asvab-prep`, `ref: main`, the commit `sha`, `target: production`). Their root directories are `math`, `english` and `science`. Then fetch each live URL and confirm the new `sw.js` cache name is being served.

Publish only when the owner asks.

## Rules that protect a learner's saved progress

- Never change the storage keys (`asvabMath.v1`, `asvabEnglish.v1`, `asvabTech.v1`) or an existing level id (`add`, `sub`, … `v1-1`, `pcmain`, … `life`, `ohm`, `lever`, …). Progress on the learner's phone is stored under them.
- New fields on a saved level must be optional (see `LV()` in `shared/app.js`).
- Every release needs a new offline cache name, or phones keep serving old files: `node tools/sync.cjs v6` (use the next number).

## Where to edit

- The engine, styles and picture library live in `shared/`. `math/app.js`, `math/styles.css`, `math/viz.js`, `math/sw.js` and the same four files in `english/` and `science/` are **copies written by `tools/sync.cjs`**. Edit `shared/`, then run the sync. Never hand-edit the copies.
- Lessons: `math/lessons/u1–u5.js`, `english/lessons/all.js`. The standard is `tools/LESSON-SPEC.md`. Pictures come only from the `V` library in `shared/viz.js`; do not write raw SVG in a lesson.
- Question generators: `math/levels.js`, `math/levels2.js`. Vocabulary and reading data: `english/data/`.
- Science & Tech: flashcards and question banks in `science/data/`, lessons in `science/lessons/`, the course and its computed questions in `science/levels.js`. The standard is `tools/BANK-SPEC.md`.

## Content standards (each of these was a real defect once)

- **A wrong lesson is worse than no lesson.** Recompute every number in a card before it ships, and have new or changed content checked by someone who did not write it.
- **Math answers** are verified by `tests/answers.cjs`, which works out each answer from the question text alone. A new question type needs a solver there.
- **Vocabulary**: a near-synonym must never be offered as a wrong choice. When you add or redefine a word, add it to the `SYNONYMS` groups in `english/levels.js`. `tests/stress.cjs` checks this.
- **Reading**: the correct choice must not usually be the longest of the four. `tests/reading-balance.cjs` fails above 34%. Do not name a choice by its position in an explanation line; name it by its content.
- **Science & Tech banks**: one defensible answer per question, and no flashcard meaning that could fit another term in the same level (the app uses the other meanings as wrong choices). `tests/bank-check.cjs` checks the form; only an independent reader can check the facts.
- **Test facts**: the computer ASVAB gives AR 15 questions in 55 minutes, MK 15 in 31, WK 15 in 9, PC 10 in 27, GS 15 in 12, EI 15 in 10, AI 10 in 7, SI 10 in 6, MC 15 in 22 (official ASVAB site for the first five; the last four could not be re-checked against it from the build environment, so confirm them when it is reachable). Keep the timed tests and every sentence that mentions them in line with that.
- Test pictures and wording on a phone-sized screen (360 px wide). `tests/playthrough.cjs` fails on anything wider than the screen.

## Before any push

Run the commands in the README's "After any change" section. `tests/playthrough.cjs` takes a few minutes per app and is worth it before a release.

## Lesson videos

Eight math lessons open with a one-minute narrated video (`math/video/`). The pictures are drawn by `shared/viz.js`; only the voice is generated, one clip per scene from the `say` lines in `tools/video/scripts.js`, then joined by `tools/video/build.cjs`. If a scene's `say` text changes, that clip must be regenerated; if only its picture changes, rebuilding is enough. The narration clips are not stored in this repository.

## Not affiliated

A study tool. Not affiliated with or endorsed by the U.S. Department of Defense or any branch of the military. The readiness score is an estimate, not an official ASVAB or AFQT score. Keep that statement in both apps.
