# El Cerrajero — Lógica del juego

> **Para qué sirve este documento.** Es la referencia completa y verificada contra el código de cómo funciona la lógica de los cinco niveles: qué modelo formal usa cada nivel, qué acepta o computa exactamente, cómo decide el juez y cómo fluye la partida. Existe para que el owner entienda su propio código y para proteger la lógica durante la remasterización visual: si algo está descrito aquí, no se toca sin decisión explícita del owner.
>
> **Nota sobre referencias.** Cada afirmación no obvia cita `ruta:símbolo` y, cuando ayuda, rangos de líneas vigentes al **2026-11-12**. Los números de línea pueden moverse con el tiempo; **los nombres de símbolos (funciones, exports, campos) son la referencia estable**. Todas las referencias se verificaron leyendo el código; no se inventó ninguna API.

---

## 1. Para qué sirve este documento y contrato de congelamiento

Durante la remasterización visual, **la lógica está congelada**. La regla vive en `AGENTS.md:11-19` y se resume así:

- **No modificar:** `src/core/*`, `src/game/*` y el flujo funcional de `src/main.js` (`startLevel`, fases, `handleProbe`, `handleAssault`, `handlePinEdit`, progreso). Tampoco los datos de nivel (`level1.js`…`level5.js`), jueces, oráculos, funciones, `blueprint`, `machines` ni `levels.js` (`AGENTS.md:15`).
- **Presentación libre:** `styles.css`, `index.html`, la presentación de `src/ui/*`, assets, fuentes, sonido, animaciones y la capa visual de `main.js`, siempre que no cambien las reglas, los datos que se pasan a los motores ni los callbacks (`AGENTS.md:16`).
- **Si un cambio de lógica parece necesario:** preguntar al owner primero, explicar por qué es necesario, qué se rompe si no se hace y qué alternativas hay; no ejecutarlo sin respuesta (`AGENTS.md:17`).
- **Si se modifica algo congelado por error:** informar al owner, explicar qué se cambió y por qué ocurrió; el owner decide si se mantiene o se revierte (`AGENTS.md:18`).
- **Cada tarea de remaster** debe declarar en su PR si tocó algún archivo congelado; si la respuesta es sí, el PR no se mergea sin decisión del owner (`AGENTS.md:19`).

Este documento es la contraparte técnica de ese contrato: describe exactamente qué protege cada regla.

---

## 2. Mapa de capas y flujo de datos

La arquitectura en tres capas está definida en `docs/DESIGN.md:81-114`. El código real la implementa así:

```text
src/game/level1.js … level5.js ──► src/game/levels.js (validateLevel · getLevel · LEVELS)
            │ puzzle                        edit events
            ▼                               ───────────────────────► src/game/blueprint.js
src/ui/graphEditor.js · src/ui/drumEditor.js                                  applyEdit (gating de partes)
            ▲                                             toMachine ──► src/core/{dfa,nfa,pda,tm}.js
            │ frames / líneas                             runXxx ──► frames ──► resaltado en el editor
            │                                             ◄─── src/main.js (handleProbe / handleAssault)
src/game/judge.js ◄── src/game/oracles.js · src/game/functions.js
        │ Verdict
        ▼
src/game/thief.js (thiefReport: Verdict → texto) ──► bitácora en src/main.js:appendLog
src/game/catalog.js (tarjetas del mapa, levelStatus) ──► src/main.js:renderMap
```

Qué puede y qué no puede saber cada capa (verificado en el código):

| Capa | Contiene | Puede importar | No debe |
|---|---|---|---|
| `src/core/` | Motores puros: `symbols.js`, `limits.js`, `order.js`, `dfa.js`, `nfa.js`, `pda.js`, `tm.js` | `core` entre sí (`dfa.js:1` importa `symbols.js`; `nfa.js:1-2` importa `symbols.js` y `dfa.js`; `pda.js:1-2`, `tm.js:1` importan lo suyo) | Tocar el DOM o `localStorage`, o saber qué es un nivel |
| `src/game/` | Datos (`level1.js`…`level5.js`, `catalog.js`), `levels.js`, `blueprint.js`, `machines.js`, `judge.js`, `oracles.js`, `functions.js`, `thief.js` | `core`, `game` | Tocar el DOM |
| `src/ui/` | Solo renderizado: `graphEditor.js:createGraphEditor`, `drumEditor.js:createDrumEditor`, `tapePanel.js:createTapePanel` | Nada de `core` ni `game` (los editores reciben datos ya cocidos y emiten eventos `onConnect`/`onCut`/`onEdit`) | Decidir corrección o equivalencia |
| `src/main.js` | Orquestación: pantallas, `localStorage`, despacho de eventos | Todo | Contener teoría o ramas `if (level.id === n)` con reglas (usa `toMachine`, `judge`, `thiefReport`) |

**Flujo de datos de una edición** (`docs/DESIGN.md:106-113`, verificado en `src/main.js:419-471`):

1. `getLevel(id)` (`src/game/levels.js:337-343`) devuelve el nivel; `state.puzzle` es la fase activa.
2. El editor renderiza un clon del blueprint inicial (`src/main.js:476`: `structuredClone(state.puzzle.blueprint)`).
3. Cada edición llama a `applyEdit(puzzle, parts, blueprint, edit)` (`src/game/blueprint.js:118-126`), que devuelve `{ blueprint, effect, reason }`; `main.js` registra el efecto en la bitácora.
4. **Probar:** `toMachine` (`src/game/machines.js:65-77`) → `runDFA`/`runNFA`/`runPDA`/`runTM` con `{ record: true }` → `frames` → resaltado (`src/main.js:954-971`).
5. **Ensayo/Asalto:** `toMachine` → `judge(puzzle, machine)` (`src/game/judge.js:118-140`) → `Verdict`; `thiefReport(verdict, level)` (`src/game/thief.js:9-16`) produce el texto; si hay contraejemplo, se re-ejecuta la máquina con él y se anima el recorrido (`src/main.js:972-997`).

---

## 3. Teoría por nivel

### Nivel 1 — La caja de seguridad (AFD, lenguaje finito)

- **Modelo formal:** autómata finito determinista (AFD). Cada celda recuerda cuántas teclas correctas van; no hay memoria más allá del estado actual.
- **Lenguaje exacto:** reparación `{ "123" }` (`src/game/level1.js:46-60`); construcción `{ "314" }` (`src/game/level1.js:81-95`). Lenguajes finitos de una sola palabra: el AFD objetivo es una cadena lineal `t0 —1→ t1 —2→ t2 —3→ t3` sin más transiciones (lo no definido cae a la alarma implícita, §4).
- **Reparar (pieza nueva: la celda como memoria):** el blueprint inicial trae dos cables cruzados de más (`q0 —2→ q3`, `q1 —1→ q3`) y le falta el del medio (`q1 —2→ q2`) (`src/game/level1.js:38-45`). Solución en `docs/SOLUTIONS.md:13-30`.
- **Construir:** cablear `3-1-4` desde un blueprint vacío (`src/game/level1.js:80`).
- **Contraejemplos fijados en tests:** blueprint inicial de reparación → `'2'`, razón `intruder` (`tests/level1.test.js:36-41`); blueprint vacío de construcción → `'314'`, razón `lockout` (`tests/level1.test.js:48-53`); máquina vacía contra reparación → `'123'`, `lockout` (`tests/judge.test.js:41-50`). El diseño además documenta la progresión `2` → `11` → `123` (`docs/DESIGN.md:585`); `2` y `314`/`123` son los fijados en tests.
- **Por qué el modelo es la mecánica:** ganar exige equivalencia exacta con el objetivo, no "parecerse": cualquier cable de más acepta una llave intrusa y cualquier cable de menos deja fuera la llave del cliente. La celda *es* la memoria del prefijo leído.

### Nivel 2 — El ascensor (AFD con bucle, lenguaje infinito regular)

- **Modelo formal:** AFD con auto-lazos (pieza nueva `gear`, `src/game/level2.js:14`). Los lazos permiten lenguajes infinitos: el mecanismo "sigue escuchando" después de cualquier prefijo.
- **Lenguaje exacto:** reparación = cantidad impar de `1`s (ignorando `2`s): objetivo de 2 estados `c ⇄ o` con `1`, lazos `2` en ambas (`src/game/level2.js:41-52`). Construcción = termina en `2·1`: objetivo de 3 estados (`src/game/level2.js:73-86`).
- **Reparar (tutorial del engranaje):** falta el lazo `Abierta —2→ Abierta` (`src/game/level2.js:34-40`); sin él, toda llave con un `2` después de un número impar de `1`s muere en la alarma. Solución: conectar `o —2→ o` (`docs/SOLUTIONS.md:38-51`).
- **Construir:** los 6 cables de `termina en 2·1` desde cero (`docs/SOLUTIONS.md:53-60`; fijado en `tests/level2.test.js:40-46`).
- **Contraejemplo fijado:** reparación inicial → `'12'`, razón `lockout` (`tests/level2.test.js:21-26`): `1` abre, pero el `2` siguiente no tiene cable y cae a la alarma.
- **Por qué el modelo es la mecánica:** sin auto-lazo el mecanismo se queda sordo tras el primer prefijo; el engranaje es literalmente "seguir aceptando más entrada en la misma celda". El cerrojo tiene que seguir escuchando: los cables que faltan son alarma permanente.

### Nivel 3 — El museo (AFND con épsilon, dos ramas en paralelo)

- **Modelo formal:** autómata finito no determinista con transiciones épsilon (AFND-λ). Piezas nuevas `fork` (bifurcador: dos cables con la misma llave desde la misma celda) y `spring` (resorte: transición instantánea sin consumir llave, compilada a `EPSILON` en `src/game/machines.js:30-33`).
- **Lenguaje exacto:** reparación = contiene `1·2·2` (`src/game/level3.js:49-64`); construcción = contiene `1·2·2` o `2·1·1` (`src/game/level3.js:100-118`). La rama de noche (`nw —2→ n1 —1→ n2 —1→ lock`) es el espejo de la de día.
- **Decisión D6** (`docs/DESIGN.md:31,605-607`): se eligió "contiene 1-2-2 o 2-1-1" en vez de "contiene 01 o 10" porque la segunda equivale a "contiene ambos símbolos" (AFD mínimo de 4 estados) y el bifurcador quedaría opcional; con la elegida, el AFD mínimo tiene 6 estados y el AFND con bifurcador tiene 8 celdas: la pieza nueva sí enseña.
- **Reparar (tutorial del bifurcador):** falta el lazo `Espera —1→ Espera` que, junto al ya puesto `Espera —1→ Día 1`, forma el bifurcador (`src/game/level3.js:38-48`). Solución en `docs/SOLUTIONS.md:62-77`.
- **Construir:** sin romper la rama de día, agregar el resorte `Entrada —resorte→ Noche` y los 5 cables de noche (`docs/SOLUTIONS.md:79-89`; fijado en `tests/level3.test.js:37-49`).
- **Contraejemplos fijados:** reparación inicial → `'1122'`, `lockout` (`tests/level3.test.js:17-22`); construcción inicial (solo rama de día) → `'211'`, `lockout` (`tests/level3.test.js:31-36`).
- **Por qué el modelo es la mecánica:** el bifurcador es no determinismo explícito: con la misma llave el mecanismo avanza por dos caminos a la vez (Probar ilumina varias celdas). El juez no distingue AFND de AFD equivalente (construcción de subconjuntos, §4): adivinar bien equivale a cablear más.

### Nivel 4 — El teatro (AP, lenguaje independiente del contexto)

- **Modelo formal:** autómata de pila (AP) no determinista con aceptación **por estado final**, sobre el símbolo base `Z` (`src/game/level4.js:1`: `stack = { base: 'Z', chip: 'X', ... }`). La ficha `X` nunca se confunde con las llaves `A`/`B`.
- **Lenguaje exacto:** reparación = giros balanceados nunca vacíos (`balanced-turns`: nunca baja de más y termina en cero, y la palabra vacía no abre — `src/game/oracles.js:1-21`); construcción = `AⁿBⁿ` con n ≥ 1 (`src/game/oracles.js:22-41`). El objetivo del puzzle es `{ kind: 'language', id }` (`src/game/level4.js:46,68`): ya no hay máquina objetivo, hay un oráculo predicado.
- **Reparar (tutorial de la pila):** el resorte al cerrojo quedó con condición "da igual" y deja pasar `A` (`src/game/level4.js:38-44`). La reparación es cortarlo y tenderlo con condición **base** (`docs/SOLUTIONS.md:96-111`; fijado en `tests/level4.test.js:23-32`).
- **Construir:** 5 cables con dos celdas de fase (`Cargando` solo carga, `Soltando` solo descarga) más el resorte final sobre la base (`docs/SOLUTIONS.md:113-119`; fijado en `tests/level4.test.js:39-50`).
- **Contraejemplos fijados:** reparación inicial → `'A'`, `intruder` (`tests/level4.test.js:17-22`); construcción vacía → `'AB'`, `lockout` (`tests/level4.test.js:33-38`).
- **Por qué el modelo es la mecánica:** contar visitas necesita memoria no acotada; con 4 celdas y sin pila no se puede (argumento heurístico del diseño, no prueba). La pila es el contador: `A` carga fichas, `B` las suelta, y el resorte final solo abre si la pila volvió a la base. La dificultad sube del repair al build porque el build exige una celda de fase que el repair no necesita (`docs/DESIGN.md:7` D7).

### Nivel 5 — El banco central (MT, computación)

- **Modelo formal:** máquina de Turing determinista de una cinta, infinita en ambas direcciones (implementada como `Map` disperso, `src/core/tm.js:154-157`). Aceptación por **estado final sin reglas** (`src/core/tm.js:93-98`, `src/core/tm.js:163-166`); sin regla aplicable → `alarm` (`src/core/tm.js:167-172`); sin `maxSteps` → `limit` (`src/core/tm.js:174-177`).
- **Función exacta:** reparación = incremento binario (`binary-increment`, `src/game/functions.js:1-22`); construcción = suma binaria `x+y` sobre `bin(x)+bin(y)` (`src/game/functions.js:23-52`). El objetivo es `{ kind: 'function', id }` (`src/game/level5.js:44,71`). Los ceros a la izquierda se toleran y la posición final del cabezal se ignora (`src/game/functions.js:17-22,47-52`: `matches` compara valores con `parseInt`, exige `/^[01]+$/`).
- **Reparar (tutorial del tambor):** la púa `Llevar · 1` escribe `1` en vez de `0`: con cinta `1` el contador marca `11` en vez de `10` (`src/game/level5.js:37-43`; `docs/SOLUTIONS.md:127-131`). La reparación es una sola púa: escribir `0` (`tests/level5.test.js:25-33`).
- **Construir:** el sumador reusa la sección `+1` (`seek`, `carry`) y agrega `Restar`, `Volver al signo` y `Limpiar`: **16 púas** en total (el diseño cita 15; la tabla implementada y verificada tiene 16: 4 en `seek`, 3 en `dec`, 3 en `toPlus`, 3 en `carry`, 3 en `clean`) (`docs/SOLUTIONS.md:133-156`; referencia completa fijada en `tests/level5.test.js:40-56`, que verifica los 256 pares y `coverage.tested >= 256`).
- **Contraejemplos fijados:** reparación inicial → `'1'`, `wrong-output` con `expected '10'`, `actual '11'` (`tests/level5.test.js:13-24`); construcción inicial → `'0+0'`, `alarm` (la sección heredada `seek` no tiene púa `+`) (`tests/level5.test.js:34-39`).
- **Por qué el modelo es la mecánica:** sumar necesita leer, escribir y volver atrás sobre la entrada: ni un AFD ni una pila alcanzan. El tambor (tabla sección × símbolo → escribir/mover/siguiente) *es* la función de transición δ de la MT; cada púa es una regla y cada púa vacía es una alarma.

---

## 4. Los motores (`src/core/`)

### 4.0 Convenciones comunes

- **Símbolo** = cadena de longitud 1; **palabra** = cadena, iterada carácter a carácter; `''` es la llave vacía.
- `EPSILON = 'ε'` vive en `src/core/symbols.js:1`. Nunca debe estar en un alfabeto (`src/core/dfa.js:25-28` lo rechaza).
- Los cuatro motores exportan el mismo contrato: `validateX` (devuelve `true` o lanza `Error`), `createX` (copia profunda normalizada), `runX(máquina, palabra, opciones)` → `RunResult`, `acceptsX` (booleano).
- `RunResult = { accepted, outcome, steps, frames }`, con `frames` vacío salvo `record: true`.
- Límites (`src/core/limits.js:1-4`): `DEFAULT_LIMITS = { maxSteps: 5000, maxConfigs: 20000, maxStack: 64, maxFrames: 2000 }`; `withLimits(parcial)` los combina.
- Orden shortlex (`src/core/order.js`): `shortlexCompare(alfabeto)` (`order.js:1-14`) compara por longitud y luego lexicográficamente según el orden del alfabeto del nivel; `enumerateWords(alfabeto, maxLength)` (`order.js:15-31`) enumera `''` primero y por niveles (2047 palabras para longitud ≤ 10 sobre 2 símbolos); `seededRandom` (`order.js:32-40`, mulberry32) y `randomWords` (`order.js:41-53`) dan aleatoriedad determinista por semilla.

### 4.1 DFA (`src/core/dfa.js`)

- **API:** `validateDFA` (`dfa.js:5-61`), `createDFA` (`dfa.js:63-76`), `completeDFA` (`dfa.js:86-114`), `reachableDFA` (`dfa.js:116-146`), `simulateDFA` (`dfa.js:148-163`), `acceptsDFA` (`dfa.js:165-167`), `runDFA` (`dfa.js:169-185`), `minimizeDFA` (`dfa.js:187-252`), `areEquivalentDFA` (`dfa.js:272-299`), `shortestCounterexample` (`dfa.js:301-304`).
- **Algoritmo de ejecución:** `simulateDFA` recorre la palabra símbolo a símbolo desde `start`; devuelve `{ accepted, trace }`, o `{ missing: { state, symbol } }` si falta transición, o `{ error }` si el símbolo no está en el alfabeto. `runDFA` mapea eso a `outcome`: `accept` · `reject` · `missing` · `invalid-symbol`, con `steps = trace.length - 1` y `frames` de forma `{ consumed, state, symbol }` si `record: true`.
- **Invariantes:** la transición puede ser parcial; lo que falta va a una alarma implícita que rechaza (`completeDFA` la materializa con un sumidero `__sink` de nombre único, `dfa.js:78-84,86-114`). `accept ⊆ states`. Validación estricta: sin estados/símbolos duplicados, símbolos de un carácter, sin `ε` en el alfabeto, filas de dueños conocidos (`dfa.js:15-45`).
- **Equivalencia exacta (producto BFS):** `areEquivalentDFA` completa ambos AFD con el alfabeto unión, recorre pares de estados en anchura expandiendo símbolos en orden y reconstruye la palabra con punteros al padre (`dfa.js:254-299`). El primer par que discrepa en aceptación da el contraejemplo. **Por qué es el más corto en shortlex:** el BFS expande en el orden de llaves del nivel, así que el primer camino registrado hacia cada par es su camino shortlex-mínimo; los pares salen de la cola en ese mismo orden, de modo que el primer par distinguidor que sale da el mínimo global (argumento de `docs/DESIGN.md:286`).
- **Minimización:** `minimizeDFA` = completar + alcanzables + refinamiento de particiones por firmas de transición (`dfa.js:187-252`).

### 4.2 NFA con ε (`src/core/nfa.js`)

- **API:** `validateNFA` (`nfa.js:24-72`), `createNFA` (`nfa.js:74-98`), `epsilonClosure` (`nfa.js:100-113`), `moveNFA` (`nfa.js:115-123`), `runNFA` (`nfa.js:125-152`), `acceptsNFA` (`nfa.js:154-156`), `nfaToDFA` (`nfa.js:158-184`), `areEquivalentNFA` (`nfa.js:186-190`).
- **Algoritmo:** clausura-ε por pila con conjunto `seen` (tolera ciclos ε, `nfa.js:100-113`); `moveNFA` junta destinos por símbolo; `runNFA` alterna clausura/move por cada símbolo. Acepta si la clausura final contiene un estado de aceptación. Conjunto activo vacío → `outcome 'missing'`; símbolo ajeno → `'invalid-symbol'`. Frames: `{ consumed, active: string[], symbol }` con `active` ordenado según `states` (`nfa.js:127-144`).
- **Invariantes:** cada lista de destinos contiene estados conocidos; `createNFA` deduplica, elimina listas vacías y ordena destinos según `states` (`nfa.js:74-98`).
- **Construcción de subconjuntos:** `nfaToDFA(nfa, alfabeto)` solo construye subconjuntos alcanzables desde la clausura del inicio, nombra cada subconjunto `{a,b}` con miembros en orden de `states` y **nunca crea el subconjunto vacío**: la transición ausente va a la alarma (`nfa.js:158-184`). El nivel 3 con 8 celdas produce un AFD de 9 subconjuntos en la práctica (`docs/DESIGN.md:289`).

### 4.3 AP (`src/core/pda.js`)

- **API:** `validatePDA` (`pda.js:48-101`), `createPDA` (`pda.js:103-115`), `runPDA` (`pda.js:117-168`), `acceptsPDA` (`pda.js:170-172`).
- **Semántica:** la pila es una cadena con la **cima primera** (`pda.js:27,37`). Una regla dispara si estado y cima coinciden y `read` es ε o igual al siguiente símbolo (`pda.js:23-39`, `fireRule`). Disparar desapila la cima y apila `push` (cima primero): notación de libro δ(q,a,X) = (p,γ). Aceptación **solo por estado final** con toda la entrada leída; se permiten movimientos ε después del fin de la entrada. Con pila vacía, ninguna regla dispara. Se permite no determinismo. El símbolo de pila es `X`, distinto de las llaves, para no confundirlos (`docs/DESIGN.md:217`).
- **Búsqueda:** BFS sobre configuraciones `(estado, consumidos, pila)` con conjunto visitado por clave `estado\0consumidos\0pila` (`pda.js:4-6,126-134`). Ramas que superarían `maxStack` se podan y marcan `truncated`. Resultado: `accept` al hallar configuración aceptadora; `limit` si se exploran más de `maxConfigs` o se agota la búsqueda con `truncated`; `reject` en otro caso (`pda.js:135-167`).
- **Frames:** se reconstruyen por punteros al padre; si hay camino aceptador se muestra ese, si no el que más entrada leyó (y entre ellos el de menos pasos): `isBetter` en `pda.js:41-46`. Forma `{ consumed, state, stack, rule }` (`pda.js:8-21`).
- **El porqué:** la equivalencia de lenguajes independientes del contexto es indecidible, así que el AP no se juzga por equivalencia sino por muestreo acotado (§5). Los límites `maxConfigs`/`maxStack` convierten la posible divergencia en un `limit` observable que el juez puntúa como `jam` o cierre (§5).

### 4.4 MT (`src/core/tm.js`)

- **API:** `validateTM` (`tm.js:50-122`), `createTM` (`tm.js:124-143`), `runTM` (`tm.js:145-194`), `acceptsTM` (`tm.js:196-198`).
- **Invariantes:** determinista por forma (a lo sumo una regla por par estado/símbolo); el blanco está en el alfabeto de cinta pero no en el de entrada; el alfabeto de entrada ⊆ alfabeto de cinta; `move` es `L` o `R`; los estados de aceptación no tienen reglas (`tm.js:50-122`).
- **Semántica:** cinta infinita en ambas direcciones como `Map` disperso; cabezal inicia en 0 (`tm.js:154-160`). Cada paso: si el estado acepta → `accept`; si no hay regla → `alarm`; si `steps === maxSteps` → `limit`; si no, escribir/mover/transitar (`tm.js:162-193`). `output` = cinta del primer al último símbolo no blanco (`tapeOutput`, `tm.js:28-48`).
- **Frames:** `{ step, state, head, read, rule, window: { start, symbols } }` con ventana de 7 casillas (`head ± 3`, `windowSymbols` en `tm.js:8-14`), tope `maxFrames` (`tm.js:16-26`).
- **El porqué:** por Rice, cualquier propiedad no trivial de lo que computa una MT es indecidible, y la detención también lo es; por eso cada corrida lleva tope de pasos y el juez trata el tope como `jam` (§5).

---

## 5. Los jueces (`src/game/judge.js`)

### 5.1 Forma del veredicto

```text
Verdict = { correct, counterexample, reason, expected, actual, method, coverage }
```

- `correct`: booleano.
- `counterexample`: la llave/cinta testigo, o `null` si pasa.
- `reason`: `null` | `intruder` (el mecanismo abre y el objetivo no) | `lockout` (el objetivo abre y el mecanismo no) | `jam` (la corrida tocó un límite en una palabra que el objetivo acepta) | `alarm` y `wrong-output` (solo nivel 5).
- `expected`/`actual`: booleanos en L1–L4; en L5, cadenas de salida esperada vs obtenida.
- `method`: `'exact'` (L1–L3) o `'bounded'` (L4–L5). Los éxitos exactos llevan `coverage: null`.
- `coverage`: `{ exhaustiveLength, tested, families, maxSteps }` en el juez acotado.
- `judge(puzzle, máquina)` despacha por `puzzle.target.kind` (`judge.js:118-140`): `function` → `judgeFunction`, `language` → `judgeLanguage`, `machine` → rama exacta, otro → `throw new Error('judge: unsupported target kind: …')`.

### 5.2 Juez exacto de máquinas, L1–L3 (`src/game/judge.js:126-140`)

1. Toma el alfabeto del objetivo (`puzzle.target.machine.alphabet`, que por `checkTarget` en `src/game/levels.js:179-189` es exactamente los símbolos de llave **en orden**).
2. Normaliza ambas máquinas a AFD con ese orden (`normalized`, `judge.js:13-18`; `withAlphabet`, `judge.js:9-11`): el AFD se re-etiqueta, el AFN pasa por `nfaToDFA`. La normalización importa porque `areEquivalentDFA` construye el alfabeto desde el orden del primer operando (`src/core/dfa.js:273`).
3. Llama a `areEquivalentDFA` (producto BFS, §4.1) y clasifica: `simulateDFA(objetivo, contraejemplo).accepted === true` → `lockout`, si no → `intruder` (`judge.js:136-139`).
4. El contraejemplo devuelto es el globalmente más corto en shortlex con ese orden de llaves (fijado en tests: `'2'`, `'123'`, `'1122'`, `'211'` — `tests/judge.test.js:30-72`).

### 5.3 Juez acotado de lenguaje, L4 (`src/game/judge.js:20-73`)

- **Límite honesto:** la equivalencia de lenguajes independientes del contexto es indecidible; pasar es **evidencia, no prueba** (`docs/DESIGN.md:292-306`).
- **Conjunto de prueba** (`judgeLanguage`, `judge.js:23-52`): `enumerateWords(alfabeto, exhaustiveLength)` (N = 10 → 2047 palabras con `''`) + familias `AⁿBⁿ`, `Aⁿ⁻¹Bⁿ`, `AⁿBⁿ⁻¹` para n = 1..`maxN` (16) + 200 palabras aleatorias con semilla (`seed 4`, longitud 11..24) vía `randomWords`. Se deduplica, se ordena en shortlex y se devuelve el **primer** desacuerdo contra el oráculo (`oracleAccepts`, `src/game/oracles.js:43-49`).
- **Puntuación del `limit`** (`judge.js:61-66`): si el objetivo acepta → `jam`; si el objetivo rechaza → se trata como cerrado (una bóveda trabada no abre) y se sigue.
- **Garantías:** (a) si existe contraejemplo de longitud ≤ 10, el ladrón devuelve el más corto; (b) los casi-aciertos estructurales hasta n = 16 siempre se prueban; (c) el `coverage` informa `{ exhaustiveLength, tested, families, maxSteps }` (`languageCoverage`, `judge.js:20-22`). Los tests exigen `coverage.tested >= 2000` (`tests/level4.test.js:51-61`).
- **Qué alimenta al juez:** `ORACLES = { 'balanced-turns': balancedTurns, 'a-n-b-n': anbn }` (`src/game/oracles.js:42`); `balancedTurns` rechaza `''`, símbolos ajenos y caídas bajo cero (`oracles.js:1-21`); `anbn` exige forma `AⁿBⁿ` con n ≥ 1 (`oracles.js:22-41`).

### 5.4 Juez acotado de función, L5 (`src/game/judge.js:74-117`)

- **Límite honesto:** por Rice y por la indecidibilidad de la detención, cada corrida lleva tope de pasos (`docs/DESIGN.md:313-331`).
- **Entradas** (`sumInputs`, `src/game/functions.js:23-41`): los 256 pares `bin(x)+bin(y)` con 0 ≤ x, y < 16 (`maxBits: 4`, `src/game/level5.js:1`) más cadenas de acarreo: `(2^k−1)+1` para k ≤ 8 y `(2^k−1)+(2^k−1)` para k ≤ 5. El incremento usa `maxBits: 6` más `2^k−1` hasta k = 10 (`functions.js:1-13`, `level5.js:1`). Se ordenan en shortlex con orden `0, 1, +` (`judge.js:97`).
- **Chequeos en orden** (`judge.js:100-115`): `limit` → `jam`; `alarm`/`invalid-symbol` → `alarm`; salida que no cumple `/^[01]+$/` o cuyo valor difiere → `wrong-output` (vía `fn.matches`, `functions.js:47-52`); si no, se sigue. El `coverage` informa familias `['pairs', 'carry-chains']` (`functionFamilies`, `judge.js:74-79`) y `tested >= 256` en el sumador de referencia (`tests/level5.test.js:40-56`).
- **Qué alimenta al juez:** `FUNCTIONS = { 'binary-increment': …, 'binary-sum': … }` con `{ inputs, compute, matches }` (`functions.js:53-63`); `functionFor(id)` lanza `unknown function` si el id no existe (`functions.js:57-63`).

### 5.5 Cómo `oracles.js` y `functions.js` alimentan a los jueces

Los niveles 4 y 5 no tienen máquina objetivo sino **predicado** (`target: { kind: 'language'|'function', id }`). El juez resuelve el `id` contra `ORACLES`/`FUNCTIONS` y compara la máquina del jugador contra el predicado en cada entrada del conjunto acotado. `checkTarget` en `src/game/levels.js:168-189` valida que el `id` exista; `functionFor` y `oracleAccepts` lanzan error claro si no.

---

## 6. La capa de juego

### 6.1 `blueprint.js` — reglas de edición (`src/game/blueprint.js`)

`applyEdit(puzzle, parts, blueprint, edit)` (`blueprint.js:118-126`) solo entiende `cut-wire` y `connect-wire` (otro tipo → `throw 'unknown edit type'`). Identidad de cable: tupla (origen, destino, llave/resorte, pila) vía `sameWire` (`blueprint.js:14-28`).

| Edición | Efecto / razón | Dónde |
|---|---|---|
| Cortar un par con cables (`cut-wire`) | `removed` (corta **todos** los cables del par, `applyCut`, `blueprint.js:58-64`); si no había nada, `kept` | `blueprint.js:58-64` |
| Conectar un cable idéntico | `kept` (sin duplicar) | `blueprint.js:88-91`, `74-77` |
| Auto-lazo sin `gear` | `blocked: needs-gear` | `blueprint.js:92-94` |
| Misma llave desde la misma celda, sin `fork` | `moved` (redirige el cable viejo) | `blueprint.js:95-108` |
| Misma llave desde la misma celda, con `fork` | `added` (segunda rama: el bifurcador) | `blueprint.js:101-104` |
| Resorte sobre su propia celda | `blocked: spring-loop` | `blueprint.js:67-69` |
| Púa del tambor sobre la sección final | No llega a `applyEdit`: `pinButton` marca la sección final como no editable en la UI (`src/ui/drumEditor.js:42-60`); `handlePinEdit` (`src/main.js:921-938`) escribe o borra la púa | `main.js:921-938` |

Nota: `moved` conserva la pila existente del cable (`tests/blueprint.test.js:48-…`).

### 6.2 `machines.js` — despacho blueprint → máquina (`src/game/machines.js`)

`toMachine(alfabeto, puzzle, blueprint, máquina = …)` (`machines.js:65-77`) despacha por tipo: `'tm'` → `toTM`, `'nfa'` → `toNFA`, `'pda'` → `toPDA`, si no → `toDFA`. El tipo por defecto sale de `puzzle.target?.machine?.type ?? 'dfa'`.

- `toDFA` (`machines.js:39-63`): un cable por (origen, llave); duplicado → `throw 'duplicate wire'`; los resortes se ignoran (un AFD no tiene ε).
- `toNFA` (`machines.js:15-37`): cada cable agrega un destino (`appendTarget`, `machines.js:7-13`); `spring: true` se compila a transición `EPSILON`. Sin celda inicial → `throw 'puzzle has no start cell'`.
- `toPDA` (`machines.js:87-112`): cada cable se expande por condición de pila (`top: 'any'` → ambas, `base`/`chip` → la suya; `pushFor`, `machines.js:78-86`, traduce `push`/`pop`/`keep` a la cadena a apilar). Sin `puzzle.stack` → `throw 'PDA puzzle is missing its stack'`.
- `toTM` (`machines.js:113-147`): las `rules` del tambor (sección → símbolo → `{ write, move, to }`) se copian a transiciones; púa `null` = sin regla = alarma. Sin `tape`/`sections` → `throw` claro.

### 6.3 `levels.js` — esquema y validación (`src/game/levels.js`)

- `LEVELS = [level1, …, level5]` (`levels.js:10`); `getLevel(id)` (`levels.js:337-343`) lanza `unknown level` si no existe.
- `validateLevel(level)` (`levels.js:317-336`) verifica: campos top-level (`checkTopLevel`, `levels.js:12-25`); llaves de un carácter sin duplicar (`checkKeys`, `26-43`); exactamente una celda/sección inicial y al menos un cerrojo (`checkPuzzleCells` 44-63, `checkDrumPuzzle` 64-96); cables contra celdas existentes, partes requeridas (`gear` para lazos, `spring` para resortes, `stack` para pilas) y sin resortes en lazo (`checkWires` 127-166, `checkDrumBlueprint` 97-126); alfabeto del objetivo igual a las llaves en orden (`checkTarget` 168-189); ejemplos que el objetivo acepta/rechaza (`checkExamples` 190-228); líneas de ladrón para cada razón posible del objetivo (`checkThief` 229-264); vocabulario sin palabras académicas (`checkCopy` 265-291, lista `BANNED` en `levels.js:11`); pila bien formada (`checkStack` 292-307).

### 6.4 `thief.js`, `catalog.js` y progreso

- `formatLine(plantilla, valores)` (`src/game/thief.js:1-8`) sustituye `{key}`, `{expected}`, `{actual}`; `thiefReport(verdict, level)` (`thief.js:9-16`) devuelve `{ text, tone }`: el `giveUp` si `correct`, si no la línea de la razón (con `intruder` como reserva). Las líneas viven en cada nivel (`level.thief.lines`), p. ej. L1 en `src/game/level1.js:18-27`, L5 con `jam`/`alarm`/`wrong-output` en `src/game/level5.js:14-26`.
- `catalog.js:1-8` lista jugable (`LEVELS` con contrato/título/cliente/jefe); `levelStatus(level, progress)` (`catalog.js:9-21`) devuelve `completed` / `available` / `locked` (`id === 1` o `completed` incluye `id − 1`).
- El progreso vive en `src/main.js:118-139` (`loadProgress`/`saveProgress`, clave `el-cerrajero:progress`, `setItem` dentro de `try/catch`): `{ completed: [] }`, y `showWin` (`main.js:1037-1044`) agrega el nivel. Ver §10 sobre la diferencia con el diseño.

---

## 7. El flujo de la partida (`src/main.js`)

Título → mapa → contrato → reparar → construir → asalto → victoria (los nombres de pantallas los owns `main.js`; no hay `flow.js` separado — ver §10):

1. `renderTitle` (`main.js:155-186`) → `renderMap` (`main.js:187-228`, tarjetas vía `buildLevelCard`, `main.js:66-117`).
2. `handleLevelOpen` (`main.js:58-65`) → `startLevel(id)` (`main.js:472-483`): fase `repair`, blueprint clonado, primera llave, modos reseteados → `renderWorkshop`.
3. `renderWorkshop` (`main.js:501-734`, taller de grafos) o `renderDrumWorkshop` (`main.js:754-882`, tambor + cinta) según `level.workspace`.
4. `handleProbe` (`main.js:954-971`): ejecuta el **ejemplo abierto primero** (`puzzle.examples.open[0]`; en tambor `probeTape`, `main.js:891-904`, usa `runs[0].input`) con `record: true` y resalta el recorrido (`workshop.highlight`, `frameStates` en `main.js:948-953`); en AP además muestra la pila final (`renderStack`, `main.js:269-293`).
5. `handleAssault` (`main.js:972-997`): `toMachine` → `judge` → `thiefReport` → `appendLog`; en tambor `assaultTape` (`main.js:905-920`); si `correct` y fase repair → `showRepairModal` (`main.js:1034-1036`) → `startBuild` (`main.js:484-494`); si `correct` y fase build → `showWin`; si falla, re-ejecuta el contraejemplo y lo resalta.
6. `handlePinEdit` (`main.js:921-938`) aplica ediciones del tambor; `handleConnect`/`handleCut` (`main.js:419-471`) las del grafo, con mensajes de `blocked` (`needs-gear`, `spring-loop`).
7. Modales vía `openModal` (`main.js:998-1033`, foco y `Escape`); `levelStatus` cierra el candado del mapa (`catalog.js:9-21`); el progreso se guarda en `showWin` y se lee en título/mapa.

No hay derrota: un asalto fallido devuelve al taller de construcción con el veredicto visible.

---

## 8. Los datos de cada nivel

| Niv | Máquina / taller | Celdas o secciones | Partes | Reparar (objetivo) | Construir (objetivo) | Juez | Ejemplos |
|---|---|---|---|---|---|---|---|
| 1 | `dfa` / grafo | `q0..q3` / `b0..b3` (`level1.js:32-37,74-79`) | `wire` | `{123}` (quitar 2 cruzados, poner `q1—2→q2`) | `{314}` desde vacío | `exact` | abre `123`/`314`; cierra `12`,`1234`,`2`,`11` / `31`,`3144`,`3`,`4` |
| 2 | `dfa` / grafo | `c,o` / `s0,s1,s2` (`level2.js:30-33,67-71`) | `wire,gear` | impares de `1` (poner lazo `o—2→o`) | termina en `2·1` desde vacío | `exact` | abre `1`,`122`,`12` / `21`,`221`,`1221`; cierra ``,`2`,`11` / `2`,`1`,`12`,`211` |
| 3 | `nfa` / grafo | `e,w,d1,d2,lock` / 8 con `nw,n1,n2` (`level3.js:31-37,78-87`) | `+fork,spring` | contiene `122` (poner lazo `w—1→w`) | contiene `122` o `211` (6 cables de noche) | `exact` | abre `122`,`1122`,`1221` / `+211`,`2211`; cierra ``,`12`,`22`,`1211` / ``,`12`,`21`,`112`,`221` |
| 4 | `pda` / grafo + pila | `q0,q1,q2` / `q0..q3` (`level4.js:32-36,60-65`) | `+stack` | `balanced-turns` (resorte a `base`) | `a-n-b-n` (5 cables) | `bounded` N=10, maxN=16, seed 4/200/24 | abre `AB`,`AABB` / `+AAABBB`; cierra ``,`A`,`B`,`AAB`,`ABB` / `+BA` |
| 5 | `tm` / tambor | `seek,carry,done` / `+dec,toPlus,clean` (`level5.js:31-35,52-59`) | `drum` | `binary-increment` (púa `carry·1` → `0`) | `binary-sum` (16 púas) | `bounded` maxBits 4 + acarreos, 5000 pasos | `1→10`,`11→100` / `101+11→1000`,`1+1→10` |

Secciones exactas por archivo: contrato/título/cliente/brief/llaves/partes/ladrón en `levelN.js:3-27` aprox.; `phases.repair`/`phases.build` con `goal`, `intro`, celdas/secciones, `blueprint`, `target`, `judge`, `examples`, `hints`. Soluciones paso a paso en `docs/SOLUTIONS.md`.

---

## 9. Mapa de tests (`tests/*.test.js`, `npm test`)

| Archivo | Qué fija |
|---|---|
| `dfa.test.js` | `simulateDFA`/`runDFA`, validación estricta, `areEquivalentDFA` y mínimo shortlex (`'01'`/`'10'` de largo 2) |
| `nfa.test.js` | Clausura-ε con ciclos, frames de activos, `nfaToDFA`, equivalencia; `'211'` fijado |
| `pda.test.js` | push/pop y orden cima-primero, ε tras fin de entrada, pila vacía, `limit` en lazo ε, frames del camino aceptador |
| `tm.test.js` | Mover a la izquierda del inicio, `alarm`, `limit`, salida recortada, blanco, aceptador sin reglas |
| `order.test.js` | Orden shortlex, conteo `enumerateWords` (2047 con ≤ 10 sobre 2 llaves), RNG determinista |
| `limits.test.js` | `DEFAULT_LIMITS` y `withLimits` |
| `blueprint.test.js` | Cada efecto de `applyEdit`: `removed`/`kept`/`added`/`moved`/`blocked` (+`needs-gear`, `spring-loop`) |
| `machines.test.js` | `toMachine` por tipo (incluida expansión `any` por símbolo de pila) |
| `judge.test.js` | `method` exacto/acotado, razones `intruder`/`lockout`/`jam`/`alarm`/`wrong-output`, `coverage`, errores de tipo (`unsupported target kind`, `language targets need a PDA machine`, `function targets need a TM machine`) |
| `level1..5.test.js` | Contraejemplos iniciales fijados (`'2'`, `'314'`; `'12'`; `'1122'`, `'211'`; `'A'`, `'AB'`; `'1'`→`11` vs `10`, `'0+0'` alarma), soluciones que pasan y usan la pieza nueva, cobertura (`>= 2000` en L4, `>= 256` en L5) |
| `levels.test.js` | `getLevel`/`validateLevel`/`LEVELS`, rechazos (celda duplicada, sin inicio, cable desconocido, llave fuera de alfabeto), ejemplos contra el objetivo |
| `oracles.test.js` / `functions.test.js` | Predicados (`AAB` rechazado en ambos), generación de entradas y `compute`/`matches` |
| `graphEditor.test.js` / `drumEditor.test.js` | Render y edición de los editores (DOM) |
| `thief.test.js` / `catalog.test.js` | Líneas del ladrón con `{key}`/`{expected}`/`{actual}`; `levelStatus` |

Cómo correr: `npm test` (Node con runner nativo, sin dependencias). Los tests son la red de seguridad del congelamiento: si un cambio visual altera la lógica, estos tests lo delatan.

---

## 10. Contrato de remaster (preciso)

**Congelado** (`AGENTS.md:15`): `src/core/*`, `src/game/*`, el flujo funcional de `src/main.js` (`startLevel` 472, `startBuild` 484, `renderWorkshop` 501, `renderDrumWorkshop` 754, `handleProbe` 954, `handleAssault` 972, `handlePinEdit` 921, `loadProgress` 118, `saveProgress` 133, `showWin` 1037), datos `level1.js`…`level5.js`, jueces, oráculos, funciones, `blueprint`, `machines`, `levels.js`.

**Presentación libre** (`AGENTS.md:16`): `styles.css`, `index.html`, el render de `src/ui/*` (`graphEditor.js`, `drumEditor.js`, `tapePanel.js`), assets, fuentes, sonido, animaciones y la capa visual de `main.js` — siempre que no cambien reglas, datos a motores ni callbacks (`onConnect`/`onCut`/`onEdit`, formas de `frames`, contrato `{ blueprint, effect, reason }`).

**Preguntar antes / informar después / declarar en el PR** (`AGENTS.md:17-19`): ver §1.

---

## 11. Glosario (término formal ↔ palabra de taller)

| Formal | Juego | Dónde vive la traducción |
|---|---|---|
| AFD (autómata finito determinista) | celda + cable | `toDFA` (`machines.js:39-63`) |
| estado | celda (`graph`) / sección (`drum`) | `cells`/`sections` en `levelN.js` |
| transición | cable / púa | `wires` / `rules` en blueprints |
| estado de aceptación | cerrojo | `accept: true` en celdas/secciones |
| transición ausente | alarma (implícita) | `completeDFA` (`dfa.js:86-114`); púa vacía en `toTM` |
| AFND-λ | bifurcador + resorte | `fork`/`spring` → `toNFA` (`machines.js:15-37`) |
| ε | resorte (disparo instantáneo) | `EPSILON` (`symbols.js:1`) |
| AP (autómata de pila) | pila de fichas sobre base | `stack: { base, chip }` (`level4.js:1`), `toPDA` |
| símbolo de pila / apilar / desapilar | ficha / cargar / soltar | `pushFor` (`machines.js:78-86`), `stackTopWord`/`stackActionWord` (`main.js:243-260`) |
| MT (máquina de Turing) | tambor + cinta + cabezal | `toTM` (`machines.js:113-147`) |
| función de transición δ | púas (`escribe · mueve · siguiente`) | `rules` en `level5.js:61-69` |
| palabra / lenguaje | llave / combinación | `keys`, `goal` en niveles |
| contraejemplo | marca del ladrón (`thiefReport`) | `src/game/thief.js:9-16` |
| veredicto de equivalencia | ensayo (reparar) / asalto (construir) | `handleAssault` (`main.js:972-997`), etiqueta en `main.js:648-652,824-828` |

En la UI visible están prohibidas las palabras académicas (`checkCopy`/`BANNED`, `levels.js:11,265-291`; `docs/DESIGN.md:541`): AFD, AFND, AP, MT, autómata, estado, transición, lenguaje, ε, λ, Turing.

---

## Discrepancias (código vs `docs/DESIGN.md`, sin ocultar)

1. **Sin `flow.js` ni `progress.js`.** El diseño (§2, §6) pone un reductor puro `game/flow.js` y `game/progress.js` con formato v2 `{ version: 2, completed, repaired }` (fases `title/map/brief/workshop/phaseCleared/heist/won`). El código real concentra el flujo en `src/main.js` (`renderTitle`, `renderMap`, `startLevel`, `startBuild`, `showRepairModal`, `showWin`, sin `phaseCleared`/`heist` como estados) y el progreso en `loadProgress`/`saveProgress` (`main.js:118-139`) con forma `{ completed: [] }` (sin `version` ni `repaired`). Tampoco existen `game/format.js`, `game/rules.js` ni los UI `geometry.js`, `palette.js`, `stackPanel.js`, `hud.js`, `log.js`, `dialogs.js`, `screens.js`, `animator.js` (el `ui/` real son `graphEditor.js`, `drumEditor.js`, `tapePanel.js`). Vale lo que hace el código.
2. **Familias del juez L4.** El diseño (§4.2) lista 6 familias (`(AB)ⁿ`, `AⁿBⁿ`, `A(AB)ⁿB`, `AⁿBⁿ⁻¹`, `Aⁿ⁻¹Bⁿ`, `(AB)ⁿB`); `judgeLanguage` (`judge.js:32-38`) solo agrega `AⁿBⁿ`, `Aⁿ⁻¹Bⁿ`, `AⁿBⁿ⁻¹`, y `languageCoverage` (`judge.js:20-22`) informa solo esas tres. El exhaustivo ≤ 10 igual cubre palabras cortas de las familias faltantes.
3. **Tope "segundo número ≤ 31" (L5).** El diseño (§4.3) lo enuncia como regla; el código no lo impone: lo que acota es `sumInputs` (`functions.js:23-41`, `maxBits: 4` + acarreos hasta k = 8/5). Efecto equivalente en la práctica.
4. **Línea de victoria.** El diseño (§4.2) cita "probó {tested} combinaciones y se rindió"; los `giveUp` reales dicen "El ladrón probó todas las combinaciones…" (p. ej. `level4.js:21`). Misma idea, otro texto.
5. **Suites de test del diseño (§9) sin archivo propio:** `flow`, `progress`, `vocabulary`, `architecture`, `hygiene` no existen como `tests/*.test.js` (la lista real está en §9); parte de esas reglas sí están cubiertas indirectamente (`levels.test.js` valida vocabulario vía `validateLevel`→`checkCopy`; `catalog.test.js` cubre desbloqueo).
6. **Conteo de púas del sumador L5.** El diseño (§8) dice 15; la tabla implementada y verificada en `tests/level5.test.js` tiene **16** (4 en `seek`, 3 en `dec`, 3 en `toPlus`, 3 en `carry`, 3 en `clean`). Manda la tabla verificada; el número del diseño quedó desactualizado.

## Key Learnings

1. El juez exacto de L1-L3 normaliza ambas máquinas a AFD con el orden de llaves del nivel antes del producto BFS, lo que garantiza el contraejemplo shortlex mínimo.
2. Los niveles 4 y 5 no tienen máquina objetivo sino predicados oráculo, porque la equivalencia de AP y la computación de MT son indecidibles y solo admiten juicio acotado honesto.
3. Cada pieza nueva es un concepto formal jugable: el engranaje es el auto-lazo, el bifurcador es el no determinismo, el resorte es la transición épsilon y la pila es la memoria no acotada.
4. El blueprint del jugador nunca se edita in place: applyEdit devuelve un blueprint nuevo con efecto declarado, y main.js solo lo adopta si el efecto no es blocked.
5. El progreso real guarda solo completed en main.js y el flujo vive en main.js sin flow.js, a diferencia de lo que describe DESIGN.md.
