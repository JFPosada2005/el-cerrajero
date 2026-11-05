# El Cerrajero — Final Project (Lenguajes de Programación)

Objective: build a 5-level browser puzzle game where the player designs vault mechanisms that are formally DFAs, NFAs with epsilon transitions, PDAs, and a Turing machine. The game never names the formalism; the report does.

Branch: `main` stable; work units use `feat/<task-id>-<slug>`.
Delivery: work-unit commits; push only after the user verifies and explicitly approves.
Test runner: `node --test` (Node 24, zero dependencies).

## Specs

S1 — The deliverable is a game, not a visualizer.
User: "realizar un videojuego sencillo que aplique alguno de estos temas".
Acceptance: a playable fiction with a locksmith, vaults, a thief, and 5 levels.

S2 — No academic feel.
User: "no quiero que se sienta como si estuvieramos estudiando aun mas o quemando cabeza".
User: "no traigamos cosas como construye un afd o afnd o cosas asi".
Acceptance: no AFD/AFND/AP/MT labels in the game UI; no test-case tables; no grades or rankings.

S3 — The automata are the mechanics.
User: "el juego emplee estas cosas para lograr algo o avanzar en algo dentro de el mismo".
Acceptance: each level is won by making a mechanism accept the client's keys and reject the thief's; the formal model is the win condition.

S4 — Progress and a rising difficulty curve.
User: "que realmente se sienta que se esta consiguiendo un progreso y que progresivamente la dificultad aumenta".
Acceptance: 5 levels, one new part per level, a thief that escalates, a level-select map with unlocks.

S5 — Exactly 5 levels; level 5 is the Turing machine boss.
User: "hagamos 5 niveles que lleven la teoria de cada acto y donde se encuentre el jefe final sera el nivel 5 implementando la MT".
Acceptance: L1 DFA fixed sequence, L2 DFA loop/parity, L3 AFND-lambda, L4 PDA, L5 TM.

S6 — Level 3 is AFND-lambda.
User: "deja afnd-lambda como tercer nivel".
Acceptance: L3 uses a fork (nondeterminism) and a spring (epsilon transition).

S7 — The Cerrajero fiction.
Accepted design: the player is a locksmith; each level is a contract; the client gives the rule; the thief tests the mechanism; each level has repair, build, and heist phases.
Acceptance: the UI uses workshop vocabulary (memory cell, loop gear, fork, spring, stack spring, tape), never formal vocabulary.

S8 — Scope discipline.
User: "no vamos a extendernos de mas en esto".
Acceptance: no extra acts or levels; a vertical slice first; the 5 levels are the whole game.

S9 — Code style.
Stored preferences: zero/minimal comments; never crammed code (no semicolon chains, one statement per line); no personal PC paths in outputs; no np.str_ artifacts; visually organized.
Acceptance: source has no explanatory comments except where required; no `C:\Users\...` strings in the game; tests cover the core.

S10 — Delivery gate.
Stored preference: local commits close tasks; push only after the user verifies and explicitly approves; never infer push authorization.
Acceptance: local commits only; no remote until approval.

S11 — Final report and presentation.
Rubric: Título, Autores, Resumen ejecutivo, Introducción, Marco teórico/referencial, Metodología, Resultados, Discusión, Conclusiones, Referencias. Single author: Juan Posada, código 160004831. Use the `redactor` agent for the formal document.
Acceptance: report follows the rubric; one chapter per level; results from the playtest.

S12 — Stack assumption (marked as assumption).
Web, vanilla JavaScript ES modules, SVG, CSS; no framework; Node's built-in test runner; local server via `python -m http.server`. Rationale: zero-install demo, easy to inspect, matches the user's Node 24 environment.
Acceptance: `npm test` passes; `npm run serve` serves the game.

## Tasks

| ID | Task | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | Scaffold + DFA core (simulate, complete, minimize, equivalence, shortest counterexample) + tests | S3, S9, S12 | inline | done | `9d71345` |
| T2 | Game shell + Level 1 vertical slice (repair, test, heist, win) | S1-S4, S7-S9 | inline | review | `9b8911c` |
| T3 | Level 2 (DFA loop/parity) + thief escalation | S3-S5, S9 | inline | pending | - |
| T4 | NFA core + Level 3 (AFND-lambda fork) | S5, S6, S9 | inline | pending | - |
| T5 | PDA core + Level 4 (stack) | S5, S9 | inline | pending | - |
| T6 | TM core + Level 5 (tape boss) | S5, S9 | inline | pending | - |
| T7 | Polish: level select, persistence, feedback, README, demo script | S4, S8, S9 | inline | pending | - |
| T8 | Final report + presentation | S11 | delegated (redactor) | pending | - |

## Log

### L1 — Original request (verbatim)

"Necesito hacer un proyecto con base al tema de lenguajes de programacion. Que temas hay en este curso: Estan lenguajes regulares, AFD, AFND, AFND-lambda, automatas en pila, maquinas de turing. Entonces necesito que revisemos que proyecto podemos realizar que contenga al menos uno de los temas mencionados. Investiga que opciones hay, la idea es que sea un proyecto interesante pero facil de comprender, no necesitas incluir todo en un solo proyecto, solo tiene que contener al menos un tema y la idea es que no sea complicado pero que sea interesante asi causa una buena impresion."

### L2 — Game direction (verbatim)

"me presentaste buenas opciones, que pensarias de realizar un videojuego sencillo que aplique alguno de estos temas, no seria mas interesante al espectador?"

### L3 — Full game, no study feel (verbatim)

"yo digo que hagamos el juego completo, pero no quiero que se sienta como si estuvieramos estudiando aun mas o quemando cabeza, la idea es que si es un puzzle no traigamos cosas como construye un afd o afnd o cosas asi y solo se verifique quien lo hizo mejor, sino que el juego emplee estas cosas para lograr algo o avanzar en algo dentro de el mismo, que realmente se sienta que se esta consiguiendo un progreso y que progresivamente la dificultad aumenta. Que te parece esto?"

### L4 — Scope: 5 levels, MT boss (verbatim)

"me parece re bien la idea que ya planteaste pero vamos a cambiarlo, no vamos a extendernos de mas en esto, la idea es presentar como funciona la teoria implementada en un juego asi que no vamos a hacer tantos nuveles ni actos, en vez de hacer 5 actos con varios niveles mejor hagamos 5 niveles que lleven la teoria de cada acto y donde se encuentre el jefe final sera el nivel 5 implementando la MT. Te parece bien?"

### L5 — Level 3 locked + ODD start (verbatim)

"deja afnd-lambda como tercer nivel. Carga mis preferencias de desarrollo guardadas en engram (recalcamelas de nuevo) e iniciemos una fase odd"

### L6 — Preferences recalculated (2026-11-05)

Applied: zero/minimal comments; no crammed code; no PC paths; organized output; local commits; push only after user verification; single author; rubric report; `redactor` for formal docs.

Superseded: the old SDD "delegate everything / ask before delegating" preference is replaced by the current ODD delegation contract and the available agent set (only `redactor` is available). The Muse Spark 1.3 model preference is stale/contested and is not applied. The security+scaling standing rule was scoped to the published agy-bridge tool, not this game.

### L7 — T1 evidence (2026-11-05)

- `npm test` -> 12 passing (DFA core).
- Commit -> `9d71345` (`feat(el-cerrajero): add DFA core engine`).

### L8 — T2 evidence (2026-11-05)

- Level 1 vertical slice implemented: start screen, SVG workshop, palette, legitimate-key test, thief heist, win modal, localStorage progress.
- `node --check` clean on `src/main.js`, `src/ui/workshop.js`, `src/game/level1.js`, `src/game/rules.js`.
- `npm test` -> 17 passing (12 DFA + 5 level 1).
- Commit -> `9b8911c` (`feat(el-cerrajero): add level 1 vertical slice`).
- Pending: browser smoke test (start → level → repair → heist → win) and design-doc alignment.

### L9 — Collaborator documentation (2026-11-05)

- `README.md` -> project overview, quick start, structure, theory map, conventions.
- `CONTRIBUTING.md` -> setup, branch/commit/PR flow, code style, tests, definition of done.
- `docs/TASKS.md` -> detailed task board T1-T8 with acceptance criteria, dependencies, parallelizable work, frozen interfaces.
- `docs/STATUS.md` -> current state, tests, risks, next steps, blockers.
- GitHub repo created (private): <https://github.com/JFPosada2005/el-cerrajero>; `main` pushed.
- GitHub issues created for T3-T8: #1 (T3), #5 (T4), #6 (T5), #2 (T6), #3 (T7), #4 (T8).
- Collaborator invite sent to **MateoTorres1543** with `write` permission on 2026-11-05; acceptance pending.
- Pending: `docs/DESIGN.md` from the independent design model.

### L10 — Design delegation (2026-11-05)

- Launched an independent read-only architecture design task on `gentle-ai-verify` (background session `ses_e53857deeffe8TcIPlBOAHGMTp`).
- Scope: module boundaries, data contracts for DFA/NFA/PDA/TM, judge/oracle strategy, level schema, game state machine, UI components, per-level design, testing strategy, file structure, collaborator handoff, risks.
- No implementation or file writes from the design agent; the parent will persist the returned document as `docs/DESIGN.md`.
