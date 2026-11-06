# Tablero de tareas — El Cerrajero

Este tablero es la vista de trabajo para el colaborador. El alcance y las specs viven en [`odd/tasks/el-cerrajero.md`](../odd/tasks/el-cerrajero.md); el diseño técnico vive en [`docs/DESIGN.md`](DESIGN.md).

## Cómo tomar una tarea

1. Leé la tarea completa y sus criterios de aceptación.
2. Verificá que sus dependencias estén `done`.
3. Creá la rama `feat/<id>-<slug>`.
4. Implementá, agregá tests y actualizá esta tabla.
5. Abrí un PR contra `main` con la plantilla de `CONTRIBUTING.md`.
6. No marques `done` hasta que `npm test` pase y el owner revise.

Estados: `done`, `in progress`, `review`, `blocked`, `todo`.

> **Diseño aprobado (2026-11-05, D6 incluido):** [`docs/DESIGN.md`](DESIGN.md) es la referencia técnica. La capa visual está en [`docs/VISUAL-DESIGN.md`](VISUAL-DESIGN.md). El freeze F1-F5 es el siguiente paso; no empezar T3-T6 hasta que esté.

## Milestone actual

**M1 — Nivel 1 jugable y documentación de handoff.**

- T1 completado.
- T2 en revisión (falta smoke test de navegador y alineación con el diseño).
- T3+ esperan el congelamiento de interfaces de `docs/DESIGN.md`.

## Tabla

| ID | Tarea | Estado | Dueño | Specs | Depende de | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | Scaffold + motor AFD + tests | done | Juan | S3, S9, S12 | — | — |
| T2 | Shell del juego + Nivel 1 vertical slice | review | Juan | S1-S4, S7-S9 | T1 | — |
| T3 | Nivel 2 (AFD con bucle / paridad) | todo | MateoTorres1543 | S3-S5, S9 | T2, diseño congelado | [#1](https://github.com/JFPosada2005/el-cerrajero/issues/1) |
| T4 | Motor AFND + Nivel 3 (AFND-λ) | todo | colaborador | S5, S6, S9 | T2, diseño congelado | [#5](https://github.com/JFPosada2005/el-cerrajero/issues/5) |
| T5 | Motor AP + Nivel 4 (pila) | todo | colaborador | S5, S9 | T2, diseño congelado | [#6](https://github.com/JFPosada2005/el-cerrajero/issues/6) |
| T6 | Motor MT + Nivel 5 (jefe final) | todo | colaborador | S5, S9 | T2, diseño congelado | [#2](https://github.com/JFPosada2005/el-cerrajero/issues/2) |
| T7 | Pulido: mapa, persistencia, feedback, demo | todo | colaborador | S4, S8, S9 | T3-T6 | [#3](https://github.com/JFPosada2005/el-cerrajero/issues/3) |
| T8 | Informe + sustentación | todo | Juan + redactor | S11 | T3-T7, playtest | [#4](https://github.com/JFPosada2005/el-cerrajero/issues/4) |

## T1 — Scaffold + motor AFD

**Estado:** done.

**Archivos:** `package.json`, `.gitignore`, `src/core/dfa.js`, `tests/dfa.test.js`.

**Qué incluye:**

- `createDFA`, `validateDFA`, `simulateDFA`, `acceptsDFA`.
- `completeDFA` con estado sumidero.
- `reachableDFA`.
- `minimizeDFA` por refinamiento de particiones.
- `areEquivalentDFA` por BFS del producto.
- `shortestCounterexample`.

**Criterios de aceptación:**

- [x] Simula la secuencia exacta `123`.
- [x] Trata transiciones faltantes como rechazo.
- [x] Agrega sumidero y elimina estados inalcanzables.
- [x] Minimiza un AFD con estados equivalentes.
- [x] Reconoce dos AFD equivalentes con estados redundantes.
- [x] Devuelve el contraejemplo más corto.
- [x] 12 tests pasando.

**Tests:** `node --test tests/dfa.test.js`.

## T2 — Shell del juego + Nivel 1

**Estado:** review.

**Archivos:** `index.html`, `styles.css`, `src/main.js`, `src/game/level1.js`, `src/game/rules.js`, `src/game/thief.js`, `src/ui/workshop.js`, `tests/level1.test.js`, `tests/thief.test.js`.

**Qué incluye:**

- Pantalla de inicio y pantalla de nivel.
- **Ficha del contrato persistente** con cliente, número y regla en palabras llanas.
- Taller SVG con 4 celdas fijas y un cable clickeable por llave.
- Fase de reparación: falta un cable y sobran dos.
- **Conectar** con clic en origen → destino; **cortar** con clic directo sobre el cable.
- Botón “Probar la llave” y “Iniciar el asalto”.
- Juez por equivalencia de AFD y contraejemplo más corto.
- **Diagnóstico forense** del ladrón: `intruder` (marcas de ganzúa) o `lockout` (la llave del cliente no cedió).
- Persistencia de progreso en `localStorage`.
- Modal de victoria.

**Criterios de aceptación:**

- [x] El mecanismo inicial no abre con la llave del cliente (`123`).
- [x] El mecanismo inicial no está casi resuelto: falta un cable y sobran dos.
- [x] El ladrón reporta `lockout` con `123` mientras falta el cable.
- [x] Al agregar el cable faltante, el ladrón entra por `121` o `223` (`intruder`).
- [x] Al cortar los dos cables cruzados, el mecanismo es equivalente.
- [x] El mecanismo reparado abre con `123` y rechaza `1234`, `12` y `223`.
- [x] Conectar de nuevo un cable existente no lo corta: el corte es un clic aparte.
- [x] Escape cancela una selección pendiente.
- [x] 24 tests totales pasando.
- [ ] Smoke test en navegador: inicio → nivel → reparar → asalto → victoria.
- [x] La UI del nivel no muestra vocabulario académico (guard en `tests/level1.test.js`).

**Tests:** `node --test tests/level1.test.js tests/thief.test.js`.

## T3 — Nivel 2: AFD con bucle / paridad

**Estado:** todo. **Asignada a:** MateoTorres1543.

**Objetivo:** introducir el bucle y los lenguajes regulares infinitos sin nombrarlos.

**Regla del cliente (propuesta del diseño):** reparar = cantidad impar de `1`; construir = termina en `2-1`.

**Pieza nueva:** engranaje de bucle.

**Archivos:** `src/game/level2.js`, `src/game/rules.js` (generalizar si hace falta), `src/ui/workshop.js` (modo construir si el diseño lo pide), `tests/level2.test.js`, `src/main.js`.

**Criterios de aceptación:**

- [ ] El nivel tiene un objetivo AFD para paridad.
- [ ] La máquina inicial falla con un contraejemplo concreto.
- [ ] La máquina correcta es equivalente al objetivo.
- [ ] El ladrón escala respecto al nivel 1 (prueba longitudes mayores).
- [ ] La UI habla de “bucle” o “engranaje”, nunca de autómata.
- [ ] Tests de nivel pasando.

**Depende de:** T2 y del esquema de niveles congelado en `docs/DESIGN.md`.

## T4 — Motor AFND + Nivel 3

**Estado:** todo. **Dueño sugerido:** colaborador.

**Objetivo:** implementar no determinismo y clausura épsilon, y usarlos como mecánica.

**Archivos:** `src/core/nfa.js`, `tests/nfa.test.js`, `src/game/level3.js`, `tests/level3.test.js`, `src/ui/workshop.js`, `src/main.js`.

**Criterios de aceptación:**

- [ ] `epsilonClosure`, `simulateNFA`, `nfaToDFA` (construcción de subconjuntos) y `areEquivalentNFA` implementados.
- [ ] El nivel 3 acepta “contiene 1-2-2 o 2-1-1” (D6 propuesto; pendiente de aprobación).
- [ ] El jugador puede usar bifurcador y resorte épsilon.
- [ ] El juez es equivalencia exacta vía determinización.
- [ ] El contraejemplo más corto se muestra en la UI.
- [ ] Tests unitarios y de nivel pasando.

**Depende de:** T2, T3 (para reutilizar el editor) y diseño congelado.

## T5 — Motor AP + Nivel 4

**Estado:** todo. **Dueño sugerido:** colaborador.

**Objetivo:** introducir la pila y el lenguaje `A^n B^n` como salto conceptual.

**Archivos:** `src/core/pda.js`, `tests/pda.test.js`, `src/game/level4.js`, `tests/level4.test.js`, `src/ui/stackPanel.js`, `src/main.js`.

**Criterios de aceptación:**

- [ ] Simulación de AP con pila, configuración y límite de pasos.
- [ ] Aceptación por estado final o pila vacía, según el diseño.
- [ ] Juez por pruebas acotadas y búsqueda de contraejemplo; documentar que la equivalencia general de AP es indecidible.
- [ ] El nivel 4 acepta `A^n B^n` para n razonable.
- [ ] Panel de pila visible y animado.
- [ ] Tests pasando.

**Depende de:** T2 y diseño congelado.

## T6 — Motor MT + Nivel 5

**Estado:** todo. **Dueño sugerido:** colaborador.

**Objetivo:** cerrar con el jefe final: una máquina de Turing que computa.

**Archivos:** `src/core/tm.js`, `tests/tm.test.js`, `src/game/level5.js`, `tests/level5.test.js`, `src/ui/tapePanel.js`, `src/main.js`.

**Criterios de aceptación:**

- [ ] Simulación de cinta con cabezal, lectura/escritura, movimiento y límite de pasos.
- [ ] Juez por función de referencia (suma binaria o comparación de mitades) sobre un conjunto de entradas.
- [ ] El nivel 5 tiene UI de tambor de control y cinta.
- [ ] El ladrón maestro busca el contraejemplo más corto dentro del límite.
- [ ] Tests pasando.

**Depende de:** T2 y diseño congelado.

## T7 — Pulido y demo

**Estado:** todo.

**Objetivo:** que los 5 niveles se sientan un juego completo, no cinco demos.

**Incluye:**

- Mapa de contratos con desbloqueo.
- Persistencia de progreso por nivel.
- Transiciones y feedback visual.
- Sonido opcional o feedback háptico visual.
- README final y guion de demo de 10 minutos.
- Smoke test de los 5 niveles.

**Diseño visual (obligatorio):**

- [ ] Tokens de [`docs/VISUAL-DESIGN.md`](VISUAL-DESIGN.md) aplicados en `styles.css`.
- [ ] Fuentes self-hosted Fraunces + Inter, sin requests externos.
- [ ] Contraste AA, foco visible, targets ≥ 44 px, `prefers-reduced-motion`.
- [ ] Responsive 320 / 360 / 768 / 1440; shell sin scroll horizontal; foco no tapado por la barra sticky.
- [ ] Si hay drag, alternativa de un solo puntero.
- [ ] Checklist “no retro / no hecho con los pies” completo.
- [ ] Captura/GIF por nivel y smoke test visual.

**Criterios de aceptación:**

- [ ] Se puede jugar del nivel 1 al 5 sin tocar la consola.
- [ ] El progreso sobrevive a recargar.
- [ ] No hay términos académicos en la UI.
- [ ] El juego se ve y se siente como un puzzle moderno, no retro.
- [ ] Guion de demo probado.

## T8 — Informe y sustentación

**Estado:** todo.

**Objetivo:** convertir el juego en un informe que cumpla la rúbrica.

**Secciones:** Título, Autores, Resumen ejecutivo, Introducción, Marco teórico/referencial, Metodología, Resultados, Discusión, Conclusiones, Referencias.

**Incluye:**

- Un capítulo por nivel con su modelo formal y decisiones de diseño.
- Tabla de resultados: nivel, máquina, piezas óptimas, intentos, tiempo.
- Playtest con 5-10 compañeros.
- Diagramas de autómatas y capturas del juego.
- Referencias clásicas y actuales.

**Criterios de aceptación:**

- [ ] Todas las secciones de la rúbrica presentes.
- [ ] Un solo autor: Juan Posada, código 160004831.
- [ ] Sin rutas personales ni datos sensibles.
- [ ] Referencias contextualizadas.

## Trabajo paralelizable

Una vez congelado `docs/DESIGN.md`:

- T3 (nivel 2) y T4 (AFND) pueden ir en paralelo si el editor se comparte con cuidado.
- T5 (AP) y T6 (MT) pueden ir en paralelo porque tienen UI y motores distintos.
- T7 espera a que T3-T6 estén integrados.
- T8 empieza cuando haya una versión jugable de los 5 niveles.

## Interfaces congeladas antes de paralelizar

- Forma de un nivel (`LevelSpec`) y del autómata del jugador.
- Contrato del juez: `judge(player, target) -> { correct, counterexample, reason }`.
- Contrato del taller: `createWorkshop({ svg, level, machine, onToggle })`.
- Contrato de persistencia: `loadProgress`, `saveProgress`.
- Vocabulario de UI prohibido: AFD, AFND, AP, MT, autómata, lenguaje, estado, transición.

## Bloqueos actuales

- `docs/DESIGN.md` en authoría por el modelo de diseño; no empezar T3-T6 hasta que esté.
- Repo de GitHub pendiente de confirmación de visibilidad y push inicial.
- Colaborador pendiente de invitar (falta usuario de GitHub).
