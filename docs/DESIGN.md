# El Cerrajero — Diseño técnico

> **Estado:** aprobado el 2026-11-05, incluida D6. Los contratos se congelan con F1-F5. La capa visual está en [`docs/VISUAL-DESIGN.md`](VISUAL-DESIGN.md).

> **Idioma:** documento técnico en inglés; los términos de UI van en español. El resumen en español está abajo.

## Resumen en español

- Cinco niveles, cada uno con dos puzzles: **reparar** (tutorial de la pieza nueva) y **construir** (el desafío). El ladrón juzga ambos: ensayo en reparar, asalto real en construir.
- Tres capas: `core` (motores puros), `game` (datos, juez, ladrón, flujo), `ui` (SVG y DOM). `main.js` solo orquesta.
- Juez **exacto** para AFD/AFND (niveles 1-3): equivalencia y contraejemplo más corto. Juez **acotado** para AP/MT (niveles 4-5): barrido exhaustivo pequeño + familias dirigidas, con límites declarados.
- Cambio propuesto en el nivel 3 (D6): en vez de "contiene 01 o 10", usar "contiene 1-2-2 o 2-1-1". La primera regla equivale a "contiene ambos símbolos" y su AFD mínimo tiene 4 estados, así que el bifurcador quedaría opcional. Con la segunda, el AFD mínimo tiene 6 estados y el AFND con bifurcador tiene 8: la pieza nueva sí enseña.
- D6 aprobado: el nivel 3 usa “contiene 1-2-2 o 2-1-1”. El colaborador puede pushear ramas feature (no `main`); las etiquetas ▲/▼ del nivel 4 quedan.
- Addendum visual: [`docs/VISUAL-DESIGN.md`](VISUAL-DESIGN.md).

---

**Bottom line.** El Cerrajero is a five-level game with four engines behind it. The code is split into three layers: `core` holds the pure engines, `game` holds level data, the judge, the thief and the game flow, and `ui` holds SVG and DOM work only. Every level has two puzzles, **repair** and **build**. The thief judges both. On repair the thief's run is a practice run (*ensayo*). On build it is the real break-in (*asalto*). For levels 1–3 the thief is **exact**: it checks equivalence and finds the shortest counterexample. For levels 4–5 the thief is **bounded**: it runs an exhaustive small-input sweep plus targeted families, and the game and the report both say so honestly.

---

## 0. Decisions at a glance

| # | Decision | Why |
|---|---|---|
| D1 | Levels are ES modules that export plain, JSON-compatible objects (`src/game/level1.js` … `level5.js`). | No `fetch`, no JSON import attributes, and Node tests import them directly. Matches the file names in TASKS.md. |
| D2 | Each puzzle fixes its **cells** (id, position, start, lock). The player edits only **wires**, or **pins** on level 5. The player never places cells and never chooses which cell is the lock. | Keeps the UI small (S8). The number of cells sets the difficulty. |
| D3 | One judge contract: `judge(puzzle, machine) → Verdict`. It keeps the TASKS.md field names `correct`, `counterexample`, `reason`. | TASKS.md's `judge(player, target)` has no room for the bounded settings. |
| D4 | Counterexamples are ordered **shortlex**, using the level's key order. Exact judges return the globally shortest one; bounded judges return the shortest among the inputs they tested. | Results are deterministic, so tests can pin exact strings. |
| D5 | Each level unlocks new parts: gear (self-loop) from L2, fork and spring from L3, stack from L4, drum and tape on L5. | Makes S4's "one new part per level" concrete. |
| D6 | **L3 rule: "contains 1-2-2 or 2-1-1"**, not "contains 01 or 10". **Approved 2026-11-05.** | "01 or 10" is the same as "has both symbols": its minimal deterministic machine has 4 cells, while the fork version needs 6, so the fork would teach nothing (verified). |
| D7 | L4 repair = balanced lever turns (never empty). L4 build = Aⁿ Bⁿ with n ≥ 1. The stack mechanism accepts **by final state**, over a base symbol `Z`. | Difficulty goes up: the build needs a phase cell that the repair does not. |
| D8 | L5 = **binary addition**. Repair = a +1 counter. Build = an adder made of the +1 section, a −1 section and a loop. 15 pins in total (verified). | Matches Engram decision #254 and the "computation judge" the brief asks for. Reusing the repaired section shows progress. |
| D9 | One thief character who learns a new trick per level. `game/thief.js` turns a verdict into story lines. | S4 asks for a thief that gets smarter. |
| D10 | Saved progress format v2: `{ version: 2, completed, repaired }`. The current v1 format is migrated. | Lets the map unlock levels and lets a player skip a repair they already did. |

**Changes from the current docs**, to apply when this design is frozen:

- **TASKS.md:229**: replace the judge signature with D3.
- **TASKS.md:230**: replace the workshop contract with `createGraphEditor` (§7).
- **TASKS.md:127**: change the L3 rule as in D6.
- **TASKS.md:232**: the banned word "lenguaje" collides with the course name at `src/main.js:45`. Move that credit line to an allow-list (§9).

---

## 1. Product summary and pillars

**Fiction.** You are the best locksmith in the city. Each level is a contract: a client describes the rule in plain words, you repair a mechanism and then build one, and the thief breaks in to test it. Passing a contract opens the next one on the map.

**Loop per level:** map → contract brief → **Reparar** (tutorial for the new part) → rehearsal with the thief → **Construir** → **Asalto** → win → map.

**Contract card.** The client, the contract number and the rule stay pinned in the workshop while the player builds (`level.contract`, `level.client`, `puzzle.goal`). The card states the condition in plain words, never a table of test cases: *"Abre solo con la secuencia 1 · 2 · 3."*

**Forensic thief.** The thief never hands over a hint. The player sees evidence: the verdict's `reason` separates `intruder` (the mechanism accepted a key the client never gave) from `lockout` (the mechanism rejected the client's own key), and the line names the key that left the mark. The replay of the counterexample on the mechanism is the proof.

| Lvl | Client rule (plain words) | New part | Thief's trick | Hidden model |
|---|---|---|---|---|
| 1 | Opens only with 1-2-3; build: 3-1-4 | memory cell | short combinations | DFA, finite language |
| 2 | Odd number of 1s; build: ends with 2-1 | gear (loop) | long, repeating keys | DFA, infinite regular language |
| 3 | Contains 1-2-2; build: contains 1-2-2 or 2-1-1 | fork + spring | the two signatures overlapping | NFA with ε, subset construction |
| 4 | Balanced turns; build: n ups, then n downs | stack spring | counting attacks | PDA, context-free language |
| 5 | +1 counter; build: adds two deposits | drum + tape | forged deposits | Turing machine, computation |

**What the player learns without being told:**

- L1: a cell is memory.
- L2: a mechanism has to keep listening, so every key needs a wire.
- L3: guessing (forking) saves wiring, and the thief cannot tell the difference.
- L4: counting needs a stack.
- L5: a tape can compute.

**Pillars**

1. **The mechanism is the rule.** You win by being equivalent to the target, never by "looking right".
2. **The thief is the teacher.** Every failure comes with one concrete key and a replay.
3. **Workshop words only** (§7.1).
4. **Small and finished.** Five levels, two puzzles each, nothing extra (S5, S8).

---

## 2. System architecture

```text
 game/level1..5.js (data) ──► game/levels.js  validateLevel · getLevel · LEVELS
            │
            ▼ puzzle                     edit events
 ui/graphEditor | ui/drumEditor ───────────────────────► game/blueprint.js
            ▲                                             applyEdit (part gating)
            │ frames / lines                              toMachine ──► core/{dfa,nfa,pda,tm}.js
            │                                                                 ▲
 ui/animator ◄── game/machines.js runMachine ◄──────────────────────────────────┤
 ui/log      ◄── game/thief.js ◄── game/judge.js ◄── game/oracles.js            │
 ui/dialogs                         (exact | bounded) ───────────────────────────┘
            ▲
 main.js ── composes everything; owns the DOM root and localStorage
            └─► game/flow.js (pure reducer) · game/progress.js (pure parse/serialize)
```

| Layer | Owns | May import | Must not |
|---|---|---|---|
| `src/core/` | engines, `EPSILON`, limits, shortlex helpers | `core` only | touch the DOM or storage, or know about levels |
| `src/game/` | level data, blueprint↔machine adapter, judge, oracles, thief text, flow, progress | `core`, `game` | touch the DOM |
| `src/ui/` | rendering, input, animation, Spanish UI copy | `ui` only | decide correctness, import `core` |
| `src/main.js` | wiring, `localStorage` (inside try/catch), `dispatch` | everything | contain theory or `if (level.id === n)` |

**Data flow**

1. `getLevel(id)` returns the level. `puzzle = level.phases[phase]`.
2. The blueprint is a `structuredClone(puzzle.blueprint)`, and the editor renders it.
3. Each edit calls `applyEdit(puzzle, level.parts, blueprint, edit)`, which returns `{ blueprint, effect, reason }`. `main` logs the effect.
4. **Probar** (test a key): `toMachine` → `runMachine(machine, example, { record: true })` → `frames` → animator.
5. **Ensayo / Asalto**: `toMachine` → `judge(puzzle, machine)` → `Verdict`. Then `thiefReport(verdict, level, phase)` produces lines, `dispatch({ type: 'verdict', verdict })` moves the flow, and if there is a counterexample `runMachine(machine, cx, { record: true })` replays it.

---

## 3. Core data contracts

### 3.1 Conventions shared by all engines

- **Symbol**: a string of length 1 (ASCII). **Word**: a string, iterated one character at a time. `''` is the empty key.
- `EPSILON = 'ε'` lives in `core/symbols.js`. It must never be in an alphabet. Level files import the constant instead of writing `'ε'`.
- Every engine exports the same four functions:
  - `validateX(m)` returns `true` or throws `Error` with a message.
  - `createX(spec)` returns a deep, normalized copy.
  - `runX(m, word, options)` returns a `RunResult`.
  - `acceptsX(m, word)` returns a boolean.
- `core/limits.js` holds `DEFAULT_LIMITS = { maxSteps: 5000, maxConfigs: 20000, maxStack: 64, maxFrames: 2000 }` and `withLimits(partial)`.
- `core/order.js` holds:
  - `shortlexCompare(alphabet)`
  - `enumerateWords(alphabet, maxLength)` (shortlex, includes `''`)
  - `seededRandom(seed)` (mulberry32)
  - `randomWords(alphabet, { seed, count, minLength, maxLength })`

```text
RunResult = {
  accepted: boolean,
  outcome: 'accept' | 'reject' | 'missing' | 'invalid-symbol' | 'alarm' | 'limit',
  steps: number,
  frames: Frame[]          // [] when options.record !== true
}
```

| Engine | Frame | Possible outcomes |
|---|---|---|
| DFA | `{ consumed, state, symbol }` | accept · reject · missing · invalid-symbol |
| NFA | `{ consumed, active: string[], symbol }` (`active` sorted in `states` order) | accept · reject · missing (active set empty) · invalid-symbol |
| PDA | `{ consumed, state, stack, rule }` along one chosen path: the accepting path if there is one, otherwise the one that read the most input, then the fewest steps | accept · reject · limit · invalid-symbol |
| TM | `{ step, state, head, read, rule, window: { start, symbols } }` | accept · alarm · limit · invalid-symbol |

### 3.2 DFA (exists: `src/core/dfa.js`)

```json
{ "type": "dfa", "states": ["t0","t1"], "alphabet": ["1","2"], "start": "t0",
  "accept": ["t1"], "transitions": { "t0": { "1": "t1" }, "t1": {} } }
```

**Invariants**
- The transition function may be partial. A missing transition goes to an implicit alarm, which is a rejecting sink (`completeDFA` adds it).
- `accept` is a subset of `states`.

**Additions in the freeze step**
- `runDFA` wraps `simulateDFA` and maps its trace to frames.
- `validateDFA` also rejects:
  - duplicate states or symbols;
  - symbols longer than one character;
  - `EPSILON` in the alphabet;
  - transition rows whose source is not a known state.
- `simulateDFA` stays as it is, because the existing tests depend on it.

### 3.3 NFA with ε (new: `src/core/nfa.js`)

```json
{ "type": "nfa", "states": ["e","w","d1","d2","lock"], "alphabet": ["1","2"],
  "start": "e", "accept": ["lock"],
  "transitions": { "e": { "ε": ["w"] }, "w": { "1": ["w","d1"], "2": ["w"] },
                   "d1": { "2": ["d2"] }, "d2": { "2": ["lock"] },
                   "lock": { "1": ["lock"], "2": ["lock"] } } }
```

**Invariants**
- Every target list contains known states.
- `createNFA` removes duplicates and empty lists and sorts targets in `states` order.
- ε-cycles are allowed: the closure function handles them.

**API**
- `epsilonClosure(nfa, states) → string[]`
- `moveNFA(nfa, states, symbol) → string[]`
- `runNFA` and `acceptsNFA`. A word is accepted if the final closure contains an accept state.
- `nfaToDFA(nfa, alphabet = nfa.alphabet) → DFA`:
  - builds only reachable subsets;
  - names each subset `{a,b}` with its members in `states` order;
  - never creates the empty subset, so a missing transition goes to the alarm.

### 3.4 PDA (new: `src/core/pda.js`)

```json
{ "type": "pda", "states": ["q0","q1","q2","q3"], "alphabet": ["A","B"],
  "stackAlphabet": ["Z","X"], "stackStart": "Z", "start": "q0", "accept": ["q3"],
  "transitions": [
    { "from": "q0", "read": "A", "pop": "Z", "push": "XZ", "to": "q1" },
    { "from": "q1", "read": "A", "pop": "X", "push": "XX", "to": "q1" },
    { "from": "q1", "read": "B", "pop": "X", "push": "",   "to": "q2" },
    { "from": "q2", "read": "B", "pop": "X", "push": "",   "to": "q2" },
    { "from": "q2", "read": "ε", "pop": "Z", "push": "Z",  "to": "q3" } ] }
```

**Semantics**
- The stack is a string written **top first**.
- A rule fires when:
  - the current state is `from`;
  - the top of the stack is `pop`;
  - `read` is ε, or `read` equals the next input symbol.
- Firing pops the top and pushes `push`, top first. This is the textbook notation δ(q,a,X) = (p,γ).
- A word is accepted **only by final state**: all input read, current state in `accept`. ε-moves are allowed after the input ends.
- With an empty stack, no rule can fire.
- Nondeterminism is allowed.
- The stack chip symbol is `X` (not `A`), so it is never confused with key `A`.

**Search: `runPDA(pda, word, { maxConfigs, maxStack, record })`**
- Breadth-first search over configurations `(state, consumed, stack)`, keeping a visited set.
- A branch whose stack would grow past `maxStack` is pruned, and the run is marked `truncated`.
- Result:
  - `accept` as soon as an accepting configuration is found;
  - `limit` if more than `maxConfigs` configurations were explored, or the search ran out with `truncated` set;
  - `reject` otherwise.
- Frames are rebuilt from parent pointers.

### 3.5 TM (new: `src/core/tm.js`)

```json
{ "type": "tm", "states": ["seek","carry","done"], "inputAlphabet": ["0","1"],
  "tapeAlphabet": ["0","1","_"], "blank": "_", "start": "seek", "accept": ["done"],
  "transitions": {
    "seek":  { "0": {"write":"0","move":"R","to":"seek"}, "1": {"write":"1","move":"R","to":"seek"},
               "_": {"write":"_","move":"L","to":"carry"} },
    "carry": { "1": {"write":"0","move":"L","to":"carry"}, "0": {"write":"1","move":"R","to":"done"},
               "_": {"write":"1","move":"R","to":"done"} },
    "done":  {} } }
```

**Invariants**
- The machine is deterministic by shape: at most one rule per (state, symbol).
- The blank is in the tape alphabet and not in the input alphabet. The input alphabet is a subset of the tape alphabet.
- `move` is `L` or `R`.
- Accept states have no rules.

**Semantics**
- The tape is infinite in both directions (stored as a sparse `Map`). The head starts at index 0.
- Each step:
  1. In an accept state → halt with `accept`.
  2. No rule for the current symbol → halt with `alarm`.
  3. `steps === maxSteps` → halt with `limit`.
- `runTM` also returns `output`: the tape from the leftmost to the rightmost non-blank cell.

---

## 4. Judge and oracle strategy

```text
Verdict = {
  correct: boolean,
  counterexample: string | null,
  reason: null | 'intruder' | 'lockout' | 'jam' | 'alarm' | 'wrong-output',
  expected: boolean | string | null,
  actual: boolean | string | null,
  method: 'exact' | 'bounded',
  coverage: null | { exhaustiveLength, tested, families: string[], maxSteps }
}
```

**Reasons:**
- `intruder`: the player's mechanism opens and the target does not.
- `lockout`: the target opens and the player's mechanism does not.
- `jam`: the player's run hit a limit on a word the target accepts.
- `alarm` and `wrong-output`: level 5 only.

`judge` chooses its strategy from `puzzle.target.kind`.

### 4.1 Exact: DFA and NFA (`target.kind = "machine"`)

1. Convert both machines to DFAs using **the level's key order** as the alphabet: DFA stays as is, NFA goes through `nfaToDFA`.
   - Watch out: `areEquivalentDFA` builds the alphabet from the left machine's order first. Always normalize first.
2. Call `areEquivalentDFA`, which searches the product automaton breadth-first.
3. Set `reason` from `acceptsDFA(target, cx)`: target accepts → `lockout`, otherwise `intruder`.

**Why the result is the shortest and the shortlex-first.** BFS expands symbols in key order, so the first path recorded for each pair of states is that pair's shortlex-smallest path. Pairs leave the queue in that same order. Any distinguishing word reaches a distinguishing pair whose recorded path is no longer than the word and also distinguishes. So the first distinguishing pair to leave the queue gives the global minimum. Write this argument into the report.

**Cost.** At most 2^|Q| subsets. Level 3 has 8 cells, so a 9-subset DFA in practice (verified), which is instant.

### 4.2 Bounded: PDA (`target.kind = "language"`)

**Honest limit.** Equivalence of context-free languages is undecidable. Equivalence of deterministic PDAs is decidable (Sénizergues) but far too complex to implement. Player machines may also be nondeterministic.

**Test set.** T = Σ^{≤N} ∪ families(maxN) ∪ random(seed, count, length 11..maxLength).
1. Remove duplicates.
2. Sort shortlex.
3. Return the first mismatch against `oracle.accepts(word)`.

**Defaults:** N = 10 (2,047 words, verified), maxN = 16, 200 seeded random words up to length 24, `maxConfigs` 20000, `maxStack` 64.

**What it guarantees:**
- (a) If any counterexample of length ≤ 10 exists, the thief returns the shortest one.
- (b) Structural near-misses up to n = 16 are always tried.
- (c) Passing is **evidence, not proof**.

The win line says so in fiction: "probó {tested} combinaciones y se rindió". With 4 cells, a mechanism cannot count past a few symbols without the stack. That is a heuristic argument for the report, not a proof.

**How a `limit` outcome is scored:**
- Target accepts → `jam`.
- Target rejects → treated as closed: a jammed vault does not open.

### 4.3 Bounded computation: TM (`target.kind = "function"`)

**Honest limit.** By Rice's theorem, any non-trivial property of what a TM computes is undecidable, and halting is undecidable. That is why every run has a step limit.

**Inputs:**
- Every pair `bin(x)+bin(y)` with 0 ≤ x, y < 2^maxBits (maxBits = 4 gives 256 pairs).
- Carry-chain stress cases: (2^k−1)+1 for k ≤ 8, and (2^k−1)+(2^k−1) for k ≤ 5.

Keep the second number at 31 or less. The reference adder is O(y·length): 31+31 takes 520 steps, and 1+255 would go past 5000.

Inputs are sorted shortlex with symbol order `0, 1, +`. The first five are `0+0, 0+1, 1+0, 1+1, 0+10` (verified).

**Checks, in order:**
1. `limit` → `jam`.
2. `alarm` → `alarm`.
3. The output must match `/^[01]+$/` and have value x+y; otherwise `wrong-output`.

Leading zeros are tolerated. The final head position is ignored. A leftover `+` fails.

The reference solution's worst case is 230 steps for x, y < 16 and 520 for 31+31, so `maxSteps` 5000 leaves about a 10× margin.

### 4.4 Oracles (`game/oracles.js`)

```text
languages['balanced-turns'] = { alphabet: ['A','B'], accepts(word), families({ maxN }) }
languages['a-n-b-n']        = { alphabet: ['A','B'], accepts(word), families({ maxN }) }
functions['binary-increment'] = { inputs({ maxBits, stress }), compute(input), matches(output, expected) }
functions['binary-sum']       = { inputs({ maxBits, stress }), compute(input), matches(output, expected) }
```

**Families for `a-n-b-n`**, for n = 1..maxN:
- AⁿBⁿ
- AⁿBⁿ⁻¹
- AⁿBⁿ⁺¹
- Aⁿ⁺¹Bⁿ
- (AB)ⁿ
- AⁿBⁿA

**Families for `balanced-turns`:**
- (AB)ⁿ
- AⁿBⁿ
- A(AB)ⁿB
- AⁿBⁿ⁻¹
- Aⁿ⁻¹Bⁿ
- (AB)ⁿB

---

## 5. Level data schema

```text
Level = { id, contract, title, client, brief, machine: 'dfa'|'nfa'|'pda'|'tm',
          workspace: 'graph'|'drum', keys: Key[], parts: Part[], newPart,
          thief: Thief, phases: { repair: Puzzle, build: Puzzle } }
Key    = { symbol, label, tone }
Part   = 'wire'|'gear'|'fork'|'spring'|'stack'|'drum'
Puzzle = { goal, intro, cells?: Cell[], sections?: Section[], tape?: Tape, stack?: Stack,
           blueprint, target, judge, examples, hints: string[1..3] }
Cell   = { id, label, x, y, start?, accept? }      // inside viewBox 820x520, 50px margin
Section= { id, label, start?, accept? }
Tape   = { symbols: string[], blank: '_', labels: { '_': '' } }
Stack  = { base: 'Z', chip: 'X', labels: { base: 'base', chip: 'ficha' } }
Thief  = { trick, intro, giveUp, lines: { intruder?, lockout?, jam?, alarm?, 'wrong-output'?, empty } }
target = { kind: 'machine', machine } | { kind: 'language', id } | { kind: 'function', id }
judge  = { method: 'exact' }
       | { method: 'bounded', exhaustiveLength, maxN, random: { seed, count, maxLength }, limits }
       | { method: 'bounded', inputs: { maxBits, stress }, limits }
examples = { open: string[], closed: string[] } | { runs: [{ input, output }] }
```

**Blueprints**, the editable game-side shapes:

```json
{ "wires": [ { "from": "q0", "to": "q1", "key": "1" },
             { "from": "e",  "to": "w",  "spring": true },
             { "from": "q1", "to": "q1", "key": "A", "stack": { "top": "chip", "action": "push" } } ] }
```

- A wire has exactly one of `key` or `spring: true`.
- `stack.top` is `base`, `chip` or `any`; `stack.action` is `push`, `pop` or `keep`. On level 4 the default is `{ any, keep }`.
- A wire's identity is the tuple (from, to, key/spring, stack).

Drum blueprint: `{ "rules": { "<section>": { "<symbol>": { "write", "move", "to" } } } }`.

**What `validateLevel(level)` checks:**
- Exactly one start cell and at least one lock per puzzle.
- Ids are unique and every wire references an existing cell.
- Keys are single characters and match the target's alphabet.
- The initial blueprint respects the level's parts.
- Every example in `examples.open` opens the target and every example in `examples.closed` does not.
- Every reason the judge can return for this target has a thief line.
- The level's text passes the vocabulary test (§9).

### 5.1 Level 1, complete

```json
{
  "id": 1, "contract": "01", "title": "La caja de seguridad", "client": "Banco del Llano",
  "brief": "El banco necesita una cerradura que abra solo con su combinación. El ladrón va a probar cualquier cosa.",
  "machine": "dfa", "workspace": "graph",
  "keys": [ { "symbol": "1", "label": "1", "tone": "gold" }, { "symbol": "2", "label": "2", "tone": "teal" },
            { "symbol": "3", "label": "3", "tone": "coral" }, { "symbol": "4", "label": "4", "tone": "violet" } ],
  "parts": ["wire"], "newPart": "cell",
  "thief": {
    "trick": "short",
    "intro": "El ladrón prueba combinaciones cortas, una por una.",
    "giveUp": "El ladrón probó todas las combinaciones y se fue con las manos vacías.",
    "lines": { "intruder": "El ladrón abrió la caja con {key}.",
               "lockout": "Con {key} ni el cliente puede abrir su propia caja.",
               "empty": "El ladrón empujó la puerta sin tocar ninguna llave y se abrió." }
  },
  "phases": {
    "repair": {
      "goal": "Abre solo con 1-2-3.",
      "intro": "El mecanismo quedó a medio armar. Falta un cable y hay dos de más.",
      "cells": [ { "id": "q0", "label": "Entrada", "x": 140, "y": 270, "start": true },
                 { "id": "q1", "label": "Celda 1", "x": 340, "y": 150 },
                 { "id": "q2", "label": "Celda 2", "x": 540, "y": 270 },
                 { "id": "q3", "label": "Cerrojo", "x": 720, "y": 150, "accept": true } ],
      "blueprint": { "wires": [ { "from": "q0", "to": "q1", "key": "1" }, { "from": "q0", "to": "q3", "key": "2" },
                                { "from": "q1", "to": "q3", "key": "1" },
                                { "from": "q2", "to": "q3", "key": "3" } ] },
      "target": { "kind": "machine", "machine": { "type": "dfa", "states": ["t0","t1","t2","t3"],
                  "alphabet": ["1","2","3","4"], "start": "t0", "accept": ["t3"],
                  "transitions": { "t0": { "1": "t1" }, "t1": { "2": "t2" }, "t2": { "3": "t3" }, "t3": {} } } },
      "judge": { "method": "exact" },
      "examples": { "open": ["123"], "closed": ["12", "1234"] },
      "hints": [ "Probá la llave 1-2-3 y mirá por dónde pasa.",
                 "Cada celda recuerda cuántas teclas correctas van. ¿Alguna deja pasar una tecla de más?" ]
    },
    "build": {
      "goal": "Abre solo con 3-1-4.",
      "intro": "El banco cambió la combinación. Cableá un mecanismo nuevo.",
      "cells": [ { "id": "b0", "label": "Entrada", "x": 140, "y": 270, "start": true },
                 { "id": "b1", "label": "Celda 1", "x": 340, "y": 150 },
                 { "id": "b2", "label": "Celda 2", "x": 540, "y": 270 },
                 { "id": "b3", "label": "Cerrojo", "x": 720, "y": 150, "accept": true } ],
      "blueprint": { "wires": [] },
      "target": { "kind": "machine", "machine": { "type": "dfa", "states": ["t0","t1","t2","t3"],
                  "alphabet": ["1","2","3","4"], "start": "t0", "accept": ["t3"],
                  "transitions": { "t0": { "3": "t1" }, "t1": { "1": "t2" }, "t2": { "4": "t3" }, "t3": {} } } },
      "judge": { "method": "exact" },
      "examples": { "open": ["314"], "closed": ["31", "3144"] },
      "hints": [ "Una celda por tecla correcta.", "Un cable que falta manda la llave a la alarma." ]
    }
  }
}
```

### 5.2 Sketches for levels 2–5

These show only what differs from level 1. Client names are placeholder content.

**L2 · Hotel elevator.** `machine: dfa`, keys `1, 2`, parts `wire, gear`.
- Repair cells: `c` "Cerrada" (start), `o` "Abierta" (lock).
  - Blueprint: `c-1→o`, `o-1→c`, `c-2→c`.
  - Target: odd number of 1s (2-state DFA).
- Build cells: `s0` "Espera" (start), `s1` "Atenta", `s2` "Cerrojo" (lock). Blank blueprint.
  - Target: ends with 2-1, as `{s0:{1:s0,2:s1}, s1:{1:s2,2:s1}, s2:{1:s0,2:s1}}`.

**L3 · Museum.** `machine: nfa`, parts `+ fork, spring`.
- Repair cells: `e, w, d1, d2, lock`.
  - Blueprint: `e~w`, `w-2→w`, `w-1→d1`, `d1-2→d2`, `d2-2→lock`, `lock-1,2→lock`.
- Build: 8 cells, `e, dw, d1, d2, nw, n1, n2, lock`. The repaired day branch is carried over.
  - Target NFA:
    ```json
    {"e":{"ε":["dw","nw"]},"dw":{"1":["dw","d1"],"2":["dw"]},"d1":{"2":["d2"]},"d2":{"2":["lock"]},
     "nw":{"1":["nw"],"2":["nw","n1"]},"n1":{"1":["n2"]},"n2":{"1":["lock"]},"lock":{"1":["lock"],"2":["lock"]}}
    ```

**L4 · Theater lever.** `machine: pda`, keys `A` "▲ Subir" and `B` "▼ Bajar", parts `+ stack`.
- Repair cells: `q0` Entrada, `q1` Trabajo, `q2` Cerrojo. Target `{ kind: language, id: balanced-turns }`.
- Build cells: `q0` Entrada, `q1` Cargando, `q2` Soltando, `q3` Cerrojo. Blank blueprint.
  - Target `a-n-b-n`.
  - Judge: `{ method: bounded, exhaustiveLength: 10, maxN: 16, random: { seed: 4, count: 200, maxLength: 24 }, limits: { maxConfigs: 20000, maxStack: 64 } }`.

**L5 · Central bank.** `machine: tm`, `workspace: drum`.
- Repair sections: `seek` "Buscar el final", `carry` "Llevar", `done` "Listo" (lock). Tape `0, 1, _`.
  - Target `binary-increment`, inputs maxBits 6 plus 2^k−1 for k ≤ 10.
- Build sections: `seek, dec` "Restar", `toPlus` "Volver al signo", `carry, clean` "Limpiar", `done`. Tape `0, 1, +, _`.
  - The repaired +1 section is carried over.
  - Target `binary-sum`, judge `{ inputs: { maxBits: 4, stress: "carry-chains" }, limits: { maxSteps: 5000 } }`.
  - Examples: `{ runs: [ { input: "101+11", output: "1000" }, { input: "1+1", output: "10" } ] }`.

---

## 6. Game state machine (`game/flow.js`, a pure reducer)

`FlowState = { screen, levelId, phase, verdict, progress }`

`reduce(state, event)` returns a new state. It has no side effects; `main` does rendering and saving.

| Screen | UI shows | Event → next |
|---|---|---|
| `title` | logo, "Aceptar el contrato" / "Continuar" | `start` → `map` |
| `map` | 5 contract cards: locked, open or completed | `open-level(n)` (only if unlocked) → `brief`; `back` → `title` |
| `brief` | client, brief, the new part | `accept-contract` → `workshop` (phase `build` if already repaired, else `repair`); `back` → `map` |
| `workshop` | header bar, palette, editor, log, buttons Probar / Ensayo or Asalto, Pista | `verdict` with phase repair: correct → `phaseCleared` and mark repaired; incorrect → stay, keeping the verdict. `verdict` with phase build → `heist`. `back` → `map` |
| `phaseCleared` | "Mecanismo reparado" dialog, reveals the build goal | `continue` → `workshop` (build) |
| `heist` | thief animation: replays the counterexample, or plays the give-up line | `heist-finished`: correct → `won` and mark completed; incorrect → `workshop` (build), keeping the verdict |
| `won` | "Bóveda asegurada"; level 5 shows the closing text | `continue` → `map` |

- Running **Probar** is local to the UI (the animator disables the buttons) and is not a flow state.
- There is no game over. A failed heist simply returns to the build phase.

**Saved progress** (`game/progress.js`, storage injected so it can be tested):
- `parseProgress(raw)`: `null`, invalid JSON or the v1 shape `{ completed }` all become `{ version: 2, completed: [], repaired: [] }` with v1 data preserved.
- Also: `serializeProgress`, `markRepaired`, `markCompleted`, `isUnlocked(p, id)` (`id === 1 || completed.includes(id - 1)`).
- Progress is saved on `phaseCleared` and on `won`.
- In-progress blueprints are **not** saved (S8).

---

## 7. UI components

### 7.1 Vocabulary (`ui/text.js` is the single source of UI copy)

| Part | UI words |
|---|---|
| cell | celda |
| wire | cable |
| self-loop | engranaje |
| fork | bifurcador |
| spring | resorte |
| stack | resorte de pila, with fichas and base |
| drum | tambor, with púas (pins) |
| tape | cinta, with cabezal (head) |
| accept / sink | cerrojo / alarma |

**Never in the UI:** AFD, AFND, AP, MT, autómata, estado, transición, lenguaje, ε, λ, Turing.

### 7.2 Components

| Component | Inputs | Outputs and methods | Must not know |
|---|---|---|---|
| `graphEditor.js` (formerly `workshop.js`) | `{ svg, cells, wires, describeWire, onEdit }` | `setTool(tool)` with `{ kind: 'key', key } \| { kind: 'cut' }`; `light({ cells, wires })`, `clearLight()`; emits `{ type: 'connect-wire', from, to, tool }` or `{ type: 'cut-wire', from, to }` | gating rules, acceptance, determinism |
| `geometry.js` | cell positions | `edgeGeometry`, `loopGeometry`, `springPath` | — |
| `palette.js` | keys, parts, stack labels | `onSelect(tool)`, where tool = `{ kind: 'key', key } \| { kind: 'spring' }` plus `stack` on L4 | — |
| `stackPanel.js` | `{ root, labels }` | `show(stack)`, `pulse('push' \| 'pop')` | the symbols `Z` / `X` (gets labels) |
| `drumEditor.js` | `{ root, sections, symbols, rules, onEdit }` | emits `{ type: 'set-pin', section, read, pin \| null }`; `light(section, read)` | validity of the tape program |
| `tapePanel.js` | `{ root, blankLabel }` | `show({ window, head, sectionLabel })` | numbers, expected results |
| `hud.js` | contract, phase, parts | `render()` | — |
| `log.js` | — | `append(text, tone)`, `clear()` | — |
| `dialogs.js` | `{ eyebrow, title, body, actions }` | opens a modal using `textContent`, traps focus | — |
| `animator.js` | frames, `onFrame`, `{ stepMs: 450 }` | returns `{ cancel }` | the frame's meaning (only calls back) |
| `screens.js` | levels, progress | title, map and level layout slots | — |

**Rules handled by `applyEdit` in `game/blueprint.js`**, not by the UI:

| Situation | Result |
|---|---|
| A cable is cut (`cut-wire`) | `removed` (every key on that cable) |
| An identical wire is connected again (`connect-wire`) | `kept` (no change; the cut is its own edit) |
| Self-loop without the gear part | `blocked: needs-gear` |
| Same key from the same cell, fork not unlocked | `moved` (the old wire is retargeted) |
| Same key from the same cell, fork unlocked | `added` |
| Spring from a cell to itself | `blocked: spring-loop` |
| Pin on the lock section | `blocked: lock-is-final` |

`describeWire` (in `ui/text.js`) chooses how each wire is drawn:
- key wires: one parallel curve per key, labeled with its own symbol;
- springs: a dashed zigzag with no text;
- forks: a glyph at the source;
- gears: a cog at the top of the loop;
- level 4 wires: `A · base · +ficha`.

---

## 8. Per-level design

Every counterexample below was checked in the scratch probes (Appendix A).

### L1: the safe (DFA, finite)
- **Repair**: the initial blueprint has two crossed wires and is missing the middle wire. Progression: **`2`** (intruder, a wire straight to the lock), then **`11`** (intruder, the second shortcut), then **`123`** (lockout, the missing wire), then the player adds it and the mechanism is equivalent. Each debris cable carries a single key, so the scissors cut is unambiguous.
- **Build**: 3-1-4 from a blank blueprint. The blank blueprint gives **`314`** (lockout).
- **Edge cases**: self-loop → `needs-gear`; a missing wire → alarm.

### L2: the elevator (loop)
- **Repair** (gear tutorial): the "Abierta" cell is missing its loop on key 2 → **`12`** (lockout).
- **Build** (ends with 2-1), common mistakes:
  - no loop on 2 at `s1` → **`221`**
  - `s2-2→s0` instead of `s1` → **`2121`**
- **Lesson**: the lock has to keep listening. Missing wires are a permanent alarm.

### L3: the museum (fork + spring)
- **Repair**: the waiting cell is missing its loop on key 1, which is the second half of the fork → **`1122`** (lockout).
- **Build** failures:
  - only the day branch (night spring missing) → **`211`**
  - night branch missing its 2-loop → **`2211`**
  - night branch missing its 1-loop → **`1211`**
  - spring straight from `e` to `lock` → `''`, using the empty-key line
- **Fork UI**: a second wire with the same key adds a branch, and **Probar** lights several cells at once.
- **Spring UI**: a "Resorte" tool with no key. Springs fire instantly with a pulse animation.
- **D6 evidence**:
  - "01 or 10": minimal DFA 4 states, ε-NFA 6.
  - "1-2-2 or 2-1-1": minimal DFA 6 states (needs back-edges), ε-NFA 8 with the natural layout.

### L4: the theater lever (stack)
- **Panel**: a vertical stack of chips over a base, animated on push and pop.
- **Palette**: key plus "si arriba hay: ficha / base / da igual" plus "cargar / soltar / no tocar".
- **Repair** (balanced, never empty): the spring to the lock has its condition set to "da igual" → **`A`** (intruder). The fix is to set it to "base".
- **Build** (Aⁿ Bⁿ, n ≥ 1):
  - no separate unloading cell → **`AABABB`**
  - final spring without the base check → **`AAB`**
  - the reference passes n = 16 and rejects 16/17.

### L5: the central bank (tape and control drum)
- **Layout**: the tape sits above the drum. The drum has one ring per section and one pin slot per symbol (0, 1, +, empty). A slot opens a popover with three pickers: write, move ←/→, next section. An empty slot means alarm.
- **Probar** animates the head step by step, with speeds 1×, 4× and instant. Frames are capped at 2000.
- **Repair** (+1): the 1-pin in the carry section writes 1 → **`1`** (wrong-output: shows 11, expected 10).
- **Build** (adder, 15 pins, all 256 pairs pass):
  - carried-over `seek` section has no `+` pin → **`0+0`** (alarm)
  - carry section still exits to "Listo" → **`0+1`** (wrong-output: `1+0`)
- **Thief lines**: forged deposits, e.g. "depositó {key} y el contador marcó {actual} en vez de {expected}".

**Win condition for every level**: the build-phase verdict is `correct`.

---

## 9. Testing strategy

| Suite | Must cover |
|---|---|
| `dfa` (exists) | + `runDFA` frames, stricter validation |
| `order` | shortlex order, `enumerateWords` count (2,047 for length ≤ 10 over 2 keys), seeded RNG is deterministic |
| `nfa` | ε-closure with cycles, active-set frames, `nfaToDFA` subset count, equivalence with a hand-written DFA |
| `pda` | push/pop and top-first order, ε after end of input, empty stack, `limit` on an ε push loop, accepting-path frames |
| `tm` | moving left of the start, alarm, limit, trimmed output, input on blank, accept state with no rules |
| `blueprint` | every `applyEdit` effect and block, `toMachine` for each machine type (`any` expands per stack symbol) |
| `judge` | the shortlex-first claim, `reason` classification, coverage numbers, same verdict on repeated runs |
| `flow`, `progress` | every row of §6, v1 → v2 migration, invalid JSON |
| `levelN` | the pinned counterexample and reason for each initial blueprint (§8); the solution in `tests/fixtures/solutions.js` passes and uses the new part; the target agrees with a predicate on all words ≤ 8; the examples hold |
| `vocabulary` | regex over level text fields, `src/ui/*`, `game/thief.js`, `index.html`, with an allow-list for the course credit line |
| `architecture` | the import-layer rules from §2 |
| `hygiene` | no `C:\Users`, `/Users/` or `/home/` paths; no `console.log` in `src` |

**UI smoke test.** `docs/SMOKE.md` holds a manual checklist per level: title → map → repair → rehearsal → build → heist → win → reload keeps progress. Node has no DOM and the project takes no dependencies, so this stays manual and is attached to every PR that touches the UI.

**Playtest for the report.**
- 5–10 classmates, observed by hand: stopwatch per phase, heist attempts, hints used, replays.
- Then a 1–5 survey: fun, "felt like studying", "understood the thief".
- Then, after the reveal, "which machine was level N?".

**Done.** A task is done when its acceptance criteria hold, `npm test` passes, its pinned tests exist, its smoke checklist was run, and it adds no banned words.

---

## 10. File structure and implementation order

```text
src/core/   symbols.js  limits.js  order.js  dfa.js  nfa.js(T4)  pda.js(T5)  tm.js(T6)
src/game/   level1.js … level5.js  levels.js  blueprint.js  machines.js  judge.js
            oracles.js(T5,T6)  thief.js  format.js  flow.js  progress.js      (rules.js removed)
src/ui/     text.js  geometry.js  graphEditor.js  palette.js  hud.js  log.js  dialogs.js
            screens.js  animator.js  stackPanel.js(T5)  drumEditor.js(T6)  tapePanel.js(T6)
tests/      fixtures/solutions.js + one *.test.js per row of §9
docs/       DESIGN.md  STATUS.md  TASKS.md  SMOKE.md
```

**Freeze (owner, sequential; this is the rest of T2):**
1. F1: `symbols`, `limits`, `order`, `runDFA`, DFA validation.
2. F2: `blueprint` (graph), `machines`, `judge` (exact), `format`, `thief`.
3. F3: `levels.js`, level 1 moved to the schema with its build phase.
4. F4: `flow`, `progress`.
5. F5: add `describeWire` and `applyEdit` gating to `graphEditor.js`; make `main.js` data-driven.

Then tag "contracts frozen" in TASKS.md.

**Interfaces to freeze first:**
- `RunResult` and frame shapes
- `Verdict`
- `Level` and `Puzzle`
- blueprint shapes
- `applyEdit` edit and effect shapes
- the vocabulary list

**Parallel lanes after the freeze:**

| Lane | Task | Size | Depends on | Files it may share |
|---|---|---|---|---|
| A | T3 (L2) | S | F5 | `text.js` (append only) |
| B | T4 (NFA + L3) | M | F5 | `graphEditor` spring and fork rendering, which **lands before C** |
| C | T5 (PDA + L4) | M–L | F5, B's rendering | `oracles.js`, `describeWire` |
| D | T6 (TM + L5) | L | F4 | `oracles.js` (append only) |
| — | T7, then T8 | — | A–D; report chapters can start per level as each lands | — |

---

## 11. Collaborator handoff

1. **Read, in order:**
   - README
   - CONTRIBUTING
   - this document's §3–§5, then §8 for your level
   - the ODD document `odd/tasks/el-cerrajero.md`
2. **Claim a task:** assign yourself the GitHub issue, set the TASKS.md row to `in progress`, and create a branch `feat/<id>-<slug>` (for example `feat/t4-nfa-level-3`).
3. **Commit:** Conventional Commits, no AI attribution. One work unit = code + tests + docs. One statement per line, no comments.
4. **Open a PR** with:
   - the task and specs it covers
   - the pinned counterexamples it adds
   - the smoke checklist results
   - `npm test` output
5. **Definition of done:** CONTRIBUTING §7 plus the done criteria in §9 above. Stop and ask when the design does not cover something. **Do not invent rules.**

---

## 12. Risks and open questions

| Risk | Mitigation |
|---|---|
| PDA search blows up, TM loops forever | `maxConfigs`, `maxStack` and `maxSteps`, plus the `jam` reason; tests run the solutions with a ≥ 2× margin |
| L5's drum UI is the most expensive piece | Fixed grid of sections × symbols; repair carry-over; start lane D early |
| Two puzzles per level doubles the content | Carry-over (L3, L5) and shared cell layouts (L1) |
| Players do not find the fork or spring | Repair phases teach each part on its own; hints come one at a time |
| Formal words leak into the UI | Vocabulary test plus `text.js` as the only place UI copy lives |
| Report overclaims what the thief proves | Use the "evidence, not proof" wording from §4.2 and §4.3. Cite Rabin–Scott, Moore/Hopcroft, Sénizergues and Rice, plus D'Antoni et al. (Automata Tutor) for counterexample feedback. **Check every citation before using it.** |
| Game served from `file://` | ES modules need `npm run serve` (Python is a stated requirement) |

**Resolved decisions (2026-11-05):**
1. D6 approved: L3 uses "contains 1-2-2 or 2-1-1".
2. The collaborator may push `feat/*` branches and open PRs; `main` remains gated by the owner.
3. L4 key labels "▲ Subir / ▼ Bajar" approved.

## 13. Visual design and feel

The visual and UX layer is specified in [`docs/VISUAL-DESIGN.md`](VISUAL-DESIGN.md). Non-negotiables:

- **Not retro, not improvised.** No pixel art, CRT, scanlines, neon, thick bevels, emoji icons, or default browser controls.
- **Direction:** "precision noir" — ink background, warm brass, ivory, teal, coral; editorial display type (Fraunces) plus a screen-first UI face (Inter), self-hosted.
- **Three reads:** goal and active key first, mechanism second, log/hints third.
- **Tokens only:** colors, spacing, radii, shadows, durations come from `VISUAL-DESIGN.md`; no one-off styles.
- **Accessibility:** WCAG AA, color plus shape/text, 44 px targets, visible focus, keyboard, `prefers-reduced-motion`.
- **Motion with purpose:** 120–420 ms, transform/opacity only, no infinite background animation.
- **Libraries:** native CSS and Web Animations API first; Motion mini (~3.4 KB) only if choreography needs it; no framework, no build step, no external runtime requests.
- **Definition of done:** the visual checklist in `VISUAL-DESIGN.md` §12 and the smoke test in `docs/SMOKE.md`.

---

## Appendix A: verification evidence

All probes ran in the scratch copy with `HOME`/`TMP` pointing inside it.

- `node --version` → `v24.16.0`.
- `node --test` → `tests 17 · pass 17 · fail 0`.
- `node probe1.mjs`:
  - minimal DFA sizes: 4 for "01|10", 6 for "122|211" contains; NFA cells 6 and 8
  - L1 `121`, L2 `12` / `221` / `2121`, L3 `1122`
- `node probe3a.mjs`: L3 build `211`, `2211`, `1211`, `''`; L1 build `314`.
- `node probe2.mjs` and `probe3b.mjs`:
  - L4: Dyck fix passes; Dyck bug `A`; AⁿBⁿ passes; `AABABB`; `AAB`; 2,047 words for length ≤ 10
  - L5: increment bug `1`; adder 15 pins, 0 failures over 256 pairs, worst case 230 steps (31+31 = 520, 127+127 = 2572)
  - L5 build bugs `0+0` (alarm) and `0+1` (wrong-output)
- `git status --short` in the workspace: empty before and after.

## Appendix B: existing issues found (advisory)

- `src/main.js`: level text is written with `innerHTML`, against CONTRIBUTING.md. Fix in F5.
- `src/main.js`: `setItem` must stay inside a try/catch. Already fixed in the current `saveProgress`.
- `src/main.js`: the course credit line that contained "Lenguajes" was removed on 2026-11-06; no allow-list is needed.
- `src/main.js`: level 1 is hard-coded. Fix in F5 (data-driven levels).
- `src/ui/graphEditor.js`: clicking the same cell twice makes an ungated self-loop. Fix in F5 with `applyEdit`. Escape cancels a pending selection.
- ODD doc: the T1/T2 commit rows were updated after this design was written; verify against the current file.
- ODD doc: add a log entry recording the user's explicit request to create the repo and the initial push.
