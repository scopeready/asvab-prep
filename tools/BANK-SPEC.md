# Fact-bank spec (ASVAB Science & Tech)

The third app, `science/`, teaches the ASVAB sections that are not part of the AFQT: General Science (GS), Electronics Information (EI), Auto Information (AI), Shop Information (SI) and Mechanical Comprehension (MC). These sections ask what a learner **knows**, so each level is built from three things:

1. a **lesson** (picture cards, same format and rules as `tools/LESSON-SPEC.md`),
2. **flashcards** (`facts`): the terms to know cold,
3. a **question bank** (`qs`): four-choice questions like the real test, each with a short explanation.

The learner is a young adult studying alone on a phone, reading at about a 6th-grade level, with no shop class, no car experience and little science behind them. Assume nothing. Plain words, short sentences, everyday comparisons.

## Files

One data file and one lesson file per unit:

| Unit | Section | Data file | Lesson file | Level ids (never rename) |
|---|---|---|---|---|
| 1 Life Science | GS | `science/data/gs1.js` | `science/lessons/gs1.js` | `life`, `body`, `eco` |
| 2 Earth, Space & Physical Science | GS | `science/data/gs2.js` | `science/lessons/gs2.js` | `earth`, `space`, `chem`, `phys` |
| 3 Electronics | EI | `science/data/ei.js` | `science/lessons/ei.js` | `elec`, `ohm`, `circuits`, `parts`, `acdc` |
| 4 Auto | AI | `science/data/ai.js` | `science/lessons/ai.js` | `engine`, `engsys`, `drive` |
| 5 Shop | SI | `science/data/si.js` | `science/lessons/si.js` | `tools`, `cutmeas`, `fasten` |
| 6 Mechanical | MC | `science/data/mc.js` | `science/lessons/mc.js` | `force`, `lever`, `pulley`, `gear`, `fluid` |

## What each level covers

- `life` Cells & Living Things: cell parts and their jobs (nucleus, membrane, cell wall, mitochondria, chloroplast, cytoplasm, ribosome, vacuole), plant vs animal cells, photosynthesis, respiration, how living things are grouped (kingdom … species), vertebrates and invertebrates.
- `body` The Human Body & Health: circulatory (heart, arteries, veins, capillaries, blood parts), respiratory, digestive, nervous, skeletal and muscular systems; what each main organ does; nutrients (carbohydrates, proteins, fats, vitamins, minerals).
- `eco` Genetics & Ecology: DNA, genes, chromosomes, dominant and recessive traits, inherited vs learned; producers, consumers (herbivore, carnivore, omnivore), decomposers, food chains, ecosystems, habitats, adaptation.
- `earth` Earth Science: Earth's layers, the three rock types and the rock cycle, plate tectonics (earthquakes, volcanoes), weathering and erosion, the water cycle, atmosphere layers, weather (fronts, air pressure, cloud types, humidity).
- `space` Space: the solar system and the order of the planets, inner vs outer planets, the Sun as a star, rotation (day) and revolution (year), why there are seasons, moon phases, solar and lunar eclipses, tides, galaxies, light-years.
- `chem` Matter & Chemistry: atoms (proton, neutron, electron), elements and the periodic table, atomic number, molecules and compounds, mixtures and solutions, states of matter and changes of state, physical vs chemical change, acids and bases (pH), common symbols (H, O, C, N, Na, Fe, H₂O, CO₂, NaCl).
- `phys` Energy, Heat, Light & Sound: metric units and prefixes (kilo, centi, milli), temperature scales (water freezes at 32 °F / 0 °C, boils at 212 °F / 100 °C), kinetic and potential energy, energy changes form, heat transfer (conduction, convection, radiation), waves (wavelength, frequency), sound, light (reflection, refraction, the visible spectrum), magnets.
- `elec` Electricity Basics: charge and electrons, current (amps), voltage (volts), resistance (ohms), conductors and insulators, the water-pipe comparison, what a circuit needs, open, closed and short circuits, units and their symbols (A, V, Ω, W).
- `ohm` Ohm's Law & Power: V = I × R in all three forms, P = V × I (watts), what happens to current when voltage or resistance changes. **Numbers questions come from a generator** (see below); the bank holds the concept questions.
- `circuits` Series & Parallel Circuits: one path vs several paths, what happens when one bulb burns out, resistances add in series, current is the same everywhere in series, voltage is the same across parallel branches, adding a parallel branch lowers total resistance, how homes are wired.
- `parts` Components & Symbols: resistor, capacitor, inductor/coil, diode, LED, transistor, fuse, circuit breaker, switch, relay, transformer, battery/cell, ground; what each does; reading a simple schematic; multimeter, voltmeter (connects in parallel), ammeter (connects in series), ohmmeter.
- `acdc` AC, DC, Magnetism & Safety: direct vs alternating current, frequency in hertz (60 Hz in U.S. homes), 120 V outlets, generators, motors, electromagnets, transformers step voltage up or down, rectifier (AC to DC), grounding, wire colors in U.S. house wiring (black hot, white neutral, green or bare ground), wire gauge (smaller number = thicker wire), fuses and breakers protect against too much current.
- `engine` How an Engine Works: the four strokes (intake, compression, power, exhaust), cylinder, piston, connecting rod, crankshaft, camshaft, valves, spark plug, combustion chamber, engine layouts (inline, V), gasoline vs diesel (diesel ignites by compression, no spark plugs).
- `engsys` Engine Systems: fuel (tank, pump, filter, injectors, carburetor on older cars, air filter, throttle), ignition (battery, coil, spark plugs), cooling (radiator, water pump, thermostat, coolant/antifreeze), lubrication (oil, oil pump, oil filter, oil pan, viscosity), exhaust (manifold, catalytic converter, muffler), electrical (battery, alternator, starter).
- `drive` Drivetrain, Brakes, Steering & Suspension: clutch, manual and automatic transmission, driveshaft, differential, axles, front-, rear- and four-wheel drive; brakes (disc, drum, pads, rotors, calipers, master cylinder, brake fluid, ABS); steering (rack and pinion, power steering, alignment); suspension (springs, shock absorbers, struts); tires (tread, pressure, rotation).
- `tools` Hand Tools: hammers (claw, ball-peen, mallet, sledge), screwdrivers (flat/slotted, Phillips), wrenches (open-end, box-end, combination, adjustable, socket and ratchet, torque wrench, Allen/hex key, pipe wrench), pliers (slip-joint, needle-nose, locking, wire cutters), clamps and vises, chisels and punches, pry bar.
- `cutmeas` Measuring, Cutting & Shaping: tape measure, steel rule, squares (try, framing, combination), level, plumb bob, calipers, micrometer; saws (crosscut, rip, hacksaw, coping, circular, jigsaw, band, miter); drills and bits, twist drill, countersink; planes, files, rasps, sandpaper grit (higher number = finer), grinder, lathe.
- `fasten` Fasteners, Materials & Joining: nails (common, finishing, brad; "penny" sizes), screws (wood, machine, sheet-metal), bolts, nuts, washers (flat, lock), rivets, thread pitch; glue, soldering, brazing, welding (arc, MIG, oxyacetylene); woods (hardwood vs softwood, plywood, grain); metals (steel, aluminum, copper, brass; alloy; rust); concrete (cement, sand, gravel, water); paint and finishes; shop safety.
- `force` Force, Motion, Work & Energy: force, mass vs weight, gravity, friction, Newton's three laws in plain words, speed and acceleration, work = force × distance (foot-pounds), power is work per time, kinetic and potential energy, mechanical advantage (MA) as "how many times a machine multiplies your push", machines trade force for distance.
- `lever` Levers: fulcrum, load, effort, effort arm and load arm; the three classes with everyday examples (seesaw/crowbar; wheelbarrow/nutcracker; tweezers/fishing rod); effort × effort arm = load × load arm; MA = effort arm ÷ load arm; torque as "turning force".
- `pulley` Pulleys & Ramps: fixed pulley (changes direction, MA 1), movable pulley (MA 2), block and tackle (MA = number of rope sections holding the load); you pull more rope than the load rises; inclined plane (MA = length ÷ height), wedge, screw.
- `gear` Gears, Belts & Wheels: meshing gears turn in opposite directions; an idler gear between them makes the first and last turn the same way; a small gear driving a big gear gives less speed and more turning force; driven speed = driver speed × driver teeth ÷ driven teeth; belts and pulleys (same direction unless the belt is crossed); wheel and axle; cams.
- `fluid` Pressure, Fluids & Springs: pressure = force ÷ area (psi); liquids do not compress, gases do; hydraulics (a small piston pushing a large piston multiplies force); water pressure grows with depth; flow speeds up in a narrow pipe; buoyancy and density (float or sink); springs (stretch grows with load; springs side by side share the load); heat makes most things expand.

## Data file format

Plain JavaScript, no imports. The picture library `V` (see `tools/LESSON-SPEC.md` plus the new pictures below) is loaded before the data files, so a question may carry a picture.

```js
window.ST = window.ST || {};
ST.lever = {
  facts: [
    // [term, meaning, optional short example]
    ['fulcrum', 'the point a lever turns on', 'the middle support of a seesaw'],
    ['effort', 'the push or pull you put into a machine'],
  ],
  qs: [
    { q: 'A seesaw balances on a support in the middle. What is that support called?',
      c: ['The fulcrum', 'The load', 'The effort', 'The axle'], a: 0,
      why: 'A lever turns on its fulcrum. On a seesaw, that is the support in the middle.' },
    { q: 'Which lever in the picture needs the least effort to lift the load?', fig: V.lever({ load: 100, effort: '?', dl: 1, de: 5 }),
      c: ['…', '…', '…', '…'], a: 2, d: 2, why: '…' },
  ],
};
```

### `facts` (flashcards): 14 to 18 per level
- `term`: 1 to 4 words, lower case unless it is a proper name. `meaning`: at most 14 words, plain, starts with a lower-case letter, no period. Optional `example`: at most 14 words.
- The app builds quiz questions from the cards of one level: "What is a fulcrum?" with three other meanings **from the same level** as wrong choices, and the reverse ("Which term means …?"). So within a level **every meaning must fit only its own term**. Do not include two terms whose meanings could be swapped or confused (for example both "artery: a vessel that carries blood" and "vein: a blood vessel"). Make each meaning say what sets the term apart ("artery: a vessel that carries blood **away from** the heart").
- A meaning must not contain its own term.

### `qs` (question bank): 26 to 30 per level
- `q`: the question, at most 40 words. `c`: exactly 4 different choices, each at most 14 words. `a`: index of the right one (0–3); spread the right answers across positions. `why`: 1 or 2 sentences (at most 40 words) that teach the fact, written so it reads well after a right answer or a wrong one. Optional `d`: 1 easy, 2 medium (default), 3 hard. Optional `fig`: a `V.` picture.
- **One defensible answer.** Three choices must be clearly wrong to someone who knows the topic; none may be "also sort of true". No "all of the above", "none of the above", "both A and B", and no negative stems ("Which is NOT…") except rarely and with NOT in capitals.
- **Do not let length give the answer away.** The right choice must not usually be the longest. Keep the four choices about the same length and the same kind of thing (four organs, four tools, four units). A test fails the file if the right answer is the single longest choice in more than 34% of a level's questions.
- Do not name a choice by its position ("the first choice") in `why`.
- Mix the question styles the real test uses: "what is it", "what does it do", "which one would you use to…", "what happens if…", and short everyday situations. At least 6 of the questions in each level should be "what happens if / which would you use" application questions rather than definitions.
- Cover the whole scope listed above for the level, not only the flashcard terms. A learner who studied the lesson and the cards should be able to answer about three quarters of the bank; the rest stretch a little.
- Facts must be standard, textbook-level and uncontroversial. If you are not sure a fact is right, leave it out. Use U.S. customary units where a mechanic or carpenter would (inches, pounds, psi) and metric where science does.
- Nothing about real people, brands, politics or religion.

## Numbers come from generators

These levels also get computed questions from `science/levels.js`, mixed with the bank. The lesson for each must teach exactly these methods, with these words:

| Level | Generated questions |
|---|---|
| `ohm` | volts = amps × ohms; amps = volts ÷ ohms; ohms = volts ÷ amps; watts = volts × amps |
| `circuits` | total resistance in series = add them up; two equal resistors in parallel = half of one; current in a series circuit = volts ÷ total ohms |
| `force` | work = force × distance, in foot-pounds; mechanical advantage = load ÷ effort |
| `lever` | effort × effort arm = load × load arm (find the effort); mechanical advantage = effort arm ÷ load arm |
| `pulley` | effort = load ÷ number of rope sections holding the load; ramp effort = load × height ÷ length; ramp mechanical advantage = length ÷ height |
| `gear` | driven speed = driver speed × driver teeth ÷ driven teeth; direction of the last gear in a row of 2 or 3 |
| `fluid` | pressure = force ÷ area (psi); hydraulic output force = input force × (large piston area ÷ small piston area) |

Friction is ignored in every computed question, as on the ASVAB. Say so once in each of those lessons.

## Lessons

Follow `tools/LESSON-SPEC.md` exactly (9 to 10 cards, a hook, at least 3 `ask` cards, one "Watch out" card with `tip: true`, a final "Remember" card, sentences under 18 words, `say` 4–55 words, `why` at most 45 words, title at most 44 characters). File format:

```js
window.LESSONS = window.LESSONS || {};
LESSONS.lever = { hook: '…', cards: [ { t: '…', say: '…', fig: V.lever({ … }) }, … ] };
```

A lesson cannot teach every flashcard. Teach the **big picture and the ideas that connect the facts** (how the four strokes follow each other, why a parallel branch lowers resistance, how blood moves through the heart and lungs), and leave the long lists of names to the flashcards. In an `ask`, use multiple choice (`opts`, `a`) for facts and `num` only for a number the learner works out.

Most cards need a picture. For these subjects, use:

| Call | Draws |
|---|---|
| `V.chain(['Grass', 'Rabbit', 'Fox'])` | Boxes joined by arrows: a food chain, the path of power or blood or current, steps in order. Up to 4 short labels sit in a row; longer lists stack downward (keep to 6 items, each under 28 characters). |
| `V.cycle(['Intake', 'Compression', 'Power', 'Exhaust'])` | 3 to 6 steps around a circle, clockwise (each label under 14 characters). |
| `V.layers([['Crust', 'thin solid rock'], ['Mantle', 'hot, slow-flowing rock']])` | Bands stacked top to bottom, each with a name (under 16 characters) and a note (under 26 characters). Good for Earth's layers, the atmosphere, "which is bigger" ladders. |
| `V.tbl(rows, head)` | A small table: 2 or 3 columns, short cells. The workhorse for comparing things (part / job, tool / used for). Keep each cell under 26 characters and at most 5 rows. |
| `V.eq([['V = I × R', 'volts = amps × ohms'], ['V = 2 × 6', 'put in the numbers'], ['V = 12', '12 volts']])` | Lined-up steps with a note beside each. |
| `V.sym(['battery', 'switch', 'lamp'])` | Schematic symbols with names. Available: `resistor`, `battery`, `switch`, `lamp`, `fuse`, `capacitor`, `diode`, `ground`. Up to 4 at once. |
| `V.circuit('series' \| 'parallel', { v: 12, r: [4, 2], total: true })` | A battery and 1 to 3 resistors with volts and ohms labeled. Values may be strings such as `'?'`. `total: true` adds "Total resistance: …" (numbers only). |
| `V.lever({ cls: 1, load: 100, effort: '?', dl: 2, de: 4 })` | A lever of class 1, 2 or 3 with fulcrum, load (lb), effort (lb), load arm `dl` and effort arm `de` (ft). For class 2, `dl` < `de`; for class 3, `de` < `dl`. |
| `V.pulley(n, { load: 100 })` | A pulley system where `n` rope sections (1 to 4) hold the load. The pull shown is load ÷ n unless you pass `effort: '?'`. |
| `V.gears(12, 36, { rpm: 90 })` | Two meshing gears with tooth counts and (optional) speeds; pass `rpm2: false` to show "? rpm" on the second gear. The gears carry arrows showing which way each turns; pass `arrows: false` when the question asks the direction. |
| `V.incline(10, 2, { load: 200 })` | A ramp with its length and height. |
| `V.nl`, `V.pbar`, `V.rect`, `V.box`, `V.cyl`, `V.circle` | From the math library, for scales (pH, temperature), areas of pistons and tanks. |

Do not write raw `<svg>` and do not invent other helpers. If no picture fits, use `V.tbl` or leave `fig` out.

## Check your work

```bash
node tests/bank-check.cjs science                      # every data file: counts, lengths, 4 different choices, answer balance
node tests/lesson-check.cjs science science/lessons/mc.js force,lever,pulley,gear,fluid
node tests/stress.cjs science
```

All must end with `ALL OK`. Then reread every question as a test-taker: is the keyed answer right, and is each other choice clearly wrong? A wrong fact is worse than a missing one.
