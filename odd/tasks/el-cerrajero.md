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
Acceptance: the contract card stays visible during play (client + rule in plain words); the thief's report reads as forensic evidence (pick marks, attempt log), never as a friendly hint; the repair phase starts with the mechanism incomplete, never one wire away from solved; the UI uses workshop vocabulary (memory cell, loop gear, fork, spring, stack spring, tape), never formal vocabulary.

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
Web, vanilla JavaScript ES modules, SVG, CSS; no framework; Node's built-in test runner; local server via `python serve.py` (no-store headers). Rationale: zero-install demo, easy to inspect, matches the user's Node 24 environment.
Acceptance: `npm test` passes; `npm run serve` serves the game.

S13 — Visual quality and UX.
User: "Que no se sienta como si estuviera jugando un juego retro o creado con los pies."
User (2026-11-06): "como juego graficamente se ve muy simple, me hubiera gusta algo mas elaborado, que se vea como un juego de verdad, con animaciones, texturas, sonidos y muchas mas cosas que caractericen un juego."
Acceptance: `docs/VISUAL-DESIGN.md` applied; "precision noir" direction; self-hosted Fraunces + Inter; WCAG AA; 44px targets; visible focus; `prefers-reduced-motion`; responsive 320/360/768/1440; no retro anti-patterns; playtest with 5 users. The full remaster (animations, textures, sound) is a named phase after all five levels work; the functional pass keeps the event hooks and tokens that make it possible without rewriting the levels.

## Tasks

| ID | Task | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | Scaffold + DFA core (simulate, complete, minimize, equivalence, shortest counterexample) + tests | S3, S9, S12 | inline | done | `9d71345` |
| T2 | Game shell + Level 1 vertical slice (repair, test, heist, win) | S1-S4, S7-S9 | inline | done | `04be402` |
| T3 | Level 2 (DFA loop/parity) + thief escalation | S3-S5, S9 | inline | pending | - |
| T4 | NFA core + Level 3 (AFND-lambda fork) | S5, S6, S9 | inline | pending | - |
| T5 | PDA core + Level 4 (stack) | S5, S9 | inline | pending | - |
| T6 | TM core + Level 5 (tape boss) | S5, S9 | inline | pending | - |
| T7 | Polish: visual system, level select, persistence, feedback, README, demo script | S4, S8, S9, S13 | inline | pending | - |
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
- No implementation or file writes from the design agent; the parent persisted the returned document as `docs/DESIGN.md`.

### L11 — Design received (2026-11-05)

- `docs/DESIGN.md` now contains the independent design: three layers (`core`, `game`, `ui`), data contracts for DFA/NFA/PDA/TM, exact judge for L1-L3, bounded judge for L4-L5, level schema, UI components, per-level design, testing strategy.
- Key decisions: D1 levels as ES modules; D2 fixed cells / editable wires; D3 single `judge` contract; D4 shortlex counterexamples; D5 one new part per level; D7 stack by final state; D8 binary addition; D9 one thief; D10 progress v2.
- D6 approved on 2026-11-05: L3 uses "contains 1-2-2 or 2-1-1". Evidence: minimal DFA is 4 states for the former and 6 for the latter; the fork is optional in the former.
- Contracts freeze with F1-F5.

### L12 — Repo and collaborator authorization (2026-11-05)

User: "Ademas crea un repositorio en github de este proyecto porque agregaremos un colaborador a nuestro proyecto".
User: "MateoTorres1543 es el usuario colaborador".

- Private repo created: <https://github.com/JFPosada2005/el-cerrajero>; `main` pushed.
- GitHub issues created for T3-T8; T3 assigned to MateoTorres1543.
- Invitation sent to MateoTorres1543 with `write` permission; acceptance pending.
- The initial push is covered by the user's explicit repo-creation request. Future pushes to `main` remain gated by S10 and user verification.

### L13 — Visual design addendum (2026-11-05)

User: "Algo mas que quiero que se tuviera en cuenta en el diseño tambien en el atractivo visual, investiguen skills de diseño, librerias, recursos y demas que puedan ayudar al correcto funcionamiento pero tambien al correcto enganche visual y comodidad al jugar. Que no se sienta como si estuviera jugando un juego retro o creado con los pies."

- `docs/VISUAL-DESIGN.md`: "precision noir" direction, tokens, Fraunces + Inter self-hosted, motion table, accessibility, performance, library decisions, "no retro" checklist.
- `skills/el-cerrajero-visual-design/SKILL.md` and `AGENTS.md` added so UI work follows the visual contract.
- Launched a read-only web research explorer (background session `ses_e53686566ffelUVHYJSrMBsXIQ`) to find additional references and gaps without filling the parent context.
- Engram was degraded at launch; memory saves may be incomplete until it recovers.

### L14 — Visual research handoff integrated (2026-11-05)

- Explorer returned a compact handoff (no raw pages in the parent context).
- Added to `docs/VISUAL-DESIGN.md`: WCAG 2.2 reflow at 320 CSS px, focus-not-obscured check for sticky actions, single-pointer alternative if dragging is added, View Transitions as progressive enhancement, static texture only, corrected library sizes (Motion Mini 3.12 kB minimum, GSAP 27.29 kB, Anime.js ~24.5 KB aggregate with measurement caveat).
- Added references for WCAG 2.2, MDN, web.dev, Mobbin, Game UI Database and Monument Valley.
- Engram unavailable during the explorer run; persistence deferred.

### L15 — Bomb-fiction ideas adapted, locksmith kept (2026-11-06)

User: "no, sabes que, dejemoslo con la idea del cerrajero aunque si te parece buena alguna idea que tenia que ver con lo de la bomba y la puedes adaptar al proyecto entonces dime cual y revisamos si la adaptamos"

User: "perfecto, hagamoslo de esa forma"

- The locksmith fiction stays; the bomb is not adopted as the theme.
- Two ideas were adapted, both inside the freeze F1-F5:
  1. **Contract card.** The rule of each level lives in a persistent paper card (client, contract number, plain-language rule), not only in the intro copy. Uses `level.contract`, `level.client` and `puzzle.goal` from the schema in `docs/DESIGN.md` §5.
  2. **Forensic report.** The thief's result reads as evidence ("Marcas de ganzúa en {key}"), not as a hint. `runHeist` now returns `reason: 'intruder' | 'lockout'`, derived from whether the counterexample is accepted by the target.
- Deferred: optional countdown mode (practice by default, never blocks progress, WCAG 2.2.1), after the freeze.
- Deferred to T7: two-role demo script (one reader, one operator).
- RED observed first: 26 tests fail/pass as expected; GREEN after `src/game/thief.js`, `runHeist.reason`, the card markup and tokens.

### L16 — Level 1 feedback and editor interaction (2026-11-06)

User: "funciona bien, el primer nivel esta bastante sencillo a mi parecer, aunque como juego graficamente se ve muy simple, me hubiera gusta algo mas elaborado, que se vea como un juego de verdad, con animaciones, texturas, sonidos y muchas mas cosas que caractericen un juego. Vamos a realizarlo de la siguiente forma, podemos terminar el juego como lo estas haciendo por el momento, despues de ver que todos los niveles andan bien y el se completan de manera exitosa entonces remasterizaremos el juego y usaremos la logica ya creada en la que sabemos que funciona bien los niveles. Una cosa que note es que ya venia puestas transcisiones en el juego en el nivel uno, la idea seria que no venga esto porque practicamente ya estaba armada casi la solucion cuando entre a completar el nivel, ademas para quitar una transcicion tengo que elegir la llave que tiene el numero y volver a elegir las celdas como si fuera a ponerlo per pues hace el efecto contrario, no se si dejarlo asi o implementar esto mejor de una forma que sea mas comodo porque en ese sentido no fue intuitivo, eso lo tuve que descubrir."

- **Plan aprobado:** completar los 5 niveles funcionales y verificados primero; el remaster visual (animaciones, texturas, sonido) va después, sobre la lógica ya probada.
- **Nivel 1 no está casi resuelto:** el blueprint inicial perdió el cable del medio. Secuencia de feedback: `123` lockout → agregar el cable → `121`/`223` intruder → cortar los dos cruzados → equivalente.
- **Corte de cables:** clic directo sobre el cable (hit area de 18 px, hover coral, foco teal, Enter/Space, aria-label). Un cable por llave, dibujado en paralelo. Conectar de nuevo un cable existente ya no lo corta: es `kept`.
- **Escape** cancela una selección pendiente.
- **Docs:** `DESIGN.md` §5.1/§7.2/§8, `VISUAL-DESIGN.md` (componente Cable + editor), `TASKS.md` T2, `STATUS.md`.
- **Evidencia:** RED primero; GREEN con 24 tests.

### L17 — Editor repair: explicit scissors, one cable per pair (2026-11-06)

User: "no, arreglalo, no sirve, ya no se pueden conectar los cables usando las llaves, de hecho haciendo clic en ellos o tab enter no se quitan, no son seleccionables para quitarlos, los puedo seleccionar para conectarlo y no funciona tampoco, coloca un boton con una tijera que indique que seleccionandola se puede cortar un cable, ademas lo de dejar muchos cables que lleven un valor cada uno no me suena, si mas adelante hay mas valores entonces se vuelve un revueltijo, igual tampoco esta opcion funciona, en la vista inicial que ya tiene cables con dos valores sigue apareciendo un cable con los dos, busca una mejor forma que no separe los cables."

- **Causa raíz:** el navegador servía `src/ui/workshop.js` desde caché (`304`) mientras cargaba el `main.js` nuevo. El editor recibía `onConnect` pero llamaba `onToggle`. Confirmado en el log de `python -m http.server`.
- **Arreglo del servidor:** `serve.py` con `Cache-Control: no-store`; `npm run serve` ahora lo usa.
- **Editor:** un cable por par de celdas, todas las llaves en una etiqueta (`1,2`). Botón `Cortar` con icono de tijera inline activa el modo corte; las celdas se atenúan, los cables pasan a ser botones (crosshair, hover coral) y clic o Enter corta el cable completo. Elegir una llave vuelve a conectar. Escape cancela una selección pendiente.
- **Secuencia del nivel 1:** `2` (intruso) → cortar → `11` (intruso) → cortar → `123` (lockout) → conectar el cable faltante → equivalente. Cada cable de escombro lleva una sola llave, así el corte con tijera no es ambiguo.
- **Guard de regresión:** `tests/workshop.test.js` (DOM falso) cubre conectar, propagación de la llave activa, cables inertes, corte con tijera, Enter y etiquetas multi-llave.
- **Evidencia:** RED primero; GREEN con 33 tests.

### L18 — Cache root cause and editor rename (2026-11-06)

User: "encargate tu de tomar las decisiones conmigo y siempre que sea a programar manda al worker, definitivamente no esta sirviendo, siguen sin conectar las celdas, cortar no hace nada."

- **Evidencia del log:** el navegador pidió `main.js`, `level1.js`, `rules.js` y `thief.js`, pero **nunca** `src/ui/workshop.js`. Seguía usando el módulo anterior a la corrección. `Cache-Control: no-store` solo evita guardar entradas nuevas; no invalida las viejas.
- **Arreglo:** el editor pasó a una URL que el navegador nunca vio: `src/ui/workshop.js` → `src/ui/graphEditor.js`, `createWorkshop` → `createGraphEditor`. La URL vieja ahora da 404; la nueva, 200.
- **Marcador de build:** la pantalla de inicio muestra `build 4` para identificar de un vistazo qué versión está corriendo.
- **Delegación:** la implementación la hizo `gentle-ai-worker`; el padre corrigió dos frases que el reemplazo literal dejó incoherentes en `DESIGN.md` y verificó las URLs servidas.
- **Evidencia del worker:** `node --test` 33/33; `node --check` limpio.

### L19 — T2 verified in the browser (2026-11-06)

User: "me parece bien, ya funciona todas estas opciones bien, cual es el siguiente paso?"

- T2 closes: the owner verified connect, cut with scissors, keyboard and the contract card in the browser.
- 33 tests passing. Commit `04be402`.
- Next: freeze F1 (`symbols`, `limits`, `order`, `runDFA`, stricter `validateDFA`), delegated to the worker.

### L20 — Level map selector and first demo push (2026-11-06)

User: "dejemos un selector de niveles antes de ir a alguno en especifico, que los bloqueados aparezcan con un candado y se vayan desbloqueando a medida que se pasa al siguiente nivel, que el nivel del jefe tenga otro simbolo que represente que va a ser mas complicado. has push con este primer demo con 1 nivel como completado por el momento"

- F1 freeze landed: `symbols.js`, `limits.js`, `order.js`, `runDFA` frames, stricter `validateDFA`. 64 tests after the map.
- `src/game/catalog.js`: 5 contracts, `levelStatus` (completed / available / locked).
- Map screen: 5 cards, padlock on locked, key on available, check on completed, crown + "Jefe final" on level 5. Locked cards are disabled buttons; unlocked-but-unimplemented levels show a polite note.
- Only level 1 is playable; the other cards unlock visually as the previous contract is completed.
- The owner explicitly authorized the push of this first demo with one completed level.

### L21 — Title menu, linear strip, blueprint F2 slice (2026-11-06)

User: "hazlo mas bien como menu luego de darle a play, tirar los niveles asi de primerazo no se mira bien, muestralos en linea, de izquierda a derecha. el resto se mira bien, de ahi ya empezamos con el siguiente nivel"

- The landing screen is now a **title screen** with a `Jugar` button; the contract map appears only after pressing it.
- The five cards are a **horizontal strip, left to right**, in `LEVELS` order; below 980 px the strip scrolls horizontally.
- The level back button and the win modal return to the map, not the title.
- Map layout fixed: full width up to 1500 px, five shrinkable columns, no horizontal scrollbar; wraps to 3/2/1 columns below 1100/760/520 px.
- F2 started: `src/game/blueprint.js` with pure `applyEdit` for graph blueprints (cut, identical kept, gear gate, fork move/add, spring loop) and 14 tests.
- 79 tests passing. No push this time: the owner did not authorize it for this slice.
