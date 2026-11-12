# Estado del proyecto — El Cerrajero

Actualizado: 2026-11-06.

## Resumen

El proyecto tiene un **nivel 1 jugable** y el **motor AFD completo**. Los niveles 2-5 están diseñados a nivel de producto y pendientes de implementación. La documentación de handoff para el colaborador está creada; el diseño técnico sección por sección está en authoría por el modelo de diseño.

## Qué funciona

- Motor AFD (`src/core/dfa.js`):
  - validación y normalización;
  - simulación con traza;
  - completado con sumidero;
  - estados alcanzables;
  - minimización por refinamiento de particiones;
  - equivalencia por BFS del producto;
  - contraejemplo más corto.
- Motor AFND-λ (`src/core/nfa.js`):
  - clausura épsilon con ciclos;
  - movimiento por símbolo y conjuntos activos;
  - simulación con frames de conjuntos;
  - construcción de subconjuntos a AFD;
  - equivalencia de AFND vía AFD.
- Motor AP (`src/core/pda.js`):
  - pila top-first y reglas δ(q, a, X);
  - búsqueda BFS con configuraciones visitadas;
  - límites de configuraciones y de pila (`truncated`);
  - frames con estado, pila y regla.
- Motor MT (`src/core/tm.js`):
  - cinta dispersa y cabezal;
  - lectura/escritura y movimiento L/R;
  - resultados accept/alarm/limit/invalid-symbol y `output`;
  - frames con ventana de 7 celdas.
- **Mapa de contratos:** 5 cartas, candado en las bloqueadas, desbloqueo al completar la anterior y corona en el jefe final.
- **Niveles 1, 2, 3 y 4 jugables** con el flujo reparar → construir → asalto:
  - taller SVG con celdas por fase y **un cable por par de celdas**, con todos sus valores en una etiqueta;
  - conectar con clic en origen → destino; **cortar con la tijera**; Escape cancela una selección pendiente;
  - **ficha del contrato persistente** con cliente y regla en palabras llanas;
  - **Probar** corre la llave de ejemplo y resalta el camino;
  - **Ensayo / Asalto** con juez exacto, contraejemplo concreto y **diagnóstico forense** (`intruder` / `lockout`);
  - modal de “Mecanismo reparado” y de victoria; persistencia en `localStorage`.
- **Nivel 1:** reparar `1-2-3` y construir `3-1-4`.
- **Nivel 2 (ascensor):** engranaje, paridad de `1` en la reparación y “termina en `2-1`” en la construcción.
- **Nivel 3 (museo):** AFND con épsilon, bifurcador y resorte; dos ramales (`1-2-2` y `2-1-1`).
- **Nivel 4 (teatro):** AP con pila, giros balanceados y `A^n B^n`; juez acotado (evidencia, no prueba) y panel de pila.
- Tests: **208 pasando** con `node --test`, incluidos DOM del editor, blueprint de cables, juez exacto y acotado, esquema de niveles, niveles 1-4 y los motores AFD/AFND/AP/MT.

## Qué está en revisión

- Los niveles 1 y 2 están migrados al esquema; falta el smoke test de navegador de esta versión.
- Los niveles 3-5 siguen bloqueados y sin datos.

## Diseño técnico

- [`docs/DESIGN.md`](DESIGN.md) aprobado el 2026-11-05, incluida D6: arquitectura por capas, contratos de datos, juez exacto para AFD/AFND y acotado para AP/MT, esquema de niveles, UI y plan de tests.
- Propone **dos puzzles por nivel** (reparar y construir) y un ladrón que escala.
- **D6 aprobado:** el nivel 3 usa “contiene 1-2-2 o 2-1-1”, para que el bifurcador sea necesario.
- **Addendum visual:** [`docs/VISUAL-DESIGN.md`](VISUAL-DESIGN.md) con la dirección “precisión noir”, tokens, tipografía Fraunces + Inter, motion, accesibilidad y checklist “no retro”.
- **Investigación visual adicional integrada:** reflow 320 px, foco no obscurecido por sticky, alternativa a drag, View Transitions progresiva, textura estática y tamaños de librerías corregidos.
- **F1 congelado:** `symbols`, `limits`, `order`, `runDFA` con frames y `validateDFA` estricto. **F2 en curso:** `game/blueprint.js` con `applyEdit` (cables, compuertas de engranaje/bifurcador/resorte), `game/machines.js` (`toMachine` a DFA) y `game/judge.js` (juez exacto con `Verdict`). **F3:** `level1.js` migrado al esquema `Level`, `level2.js` como datos, `levels.js` con `validateLevel`/`getLevel`.

## Qué sigue

1. **F1-F3 hechos.** Sigue F4 (flow/progress) y F5 (editor con resortes y `main` data-driven completo).
2. Repositorio creado y `main` subido: <https://github.com/JFPosada2005/el-cerrajero> (privado).
3. Invitación enviada a **MateoTorres1543** con permiso `write`; pendiente de aceptar.
4. **T4 (nivel 3, AFND-λ) listo:** motor, datos y UI de resortes; pendiente el smoke test de navegador.
5. **T5 (nivel 4, AP) listo:** motor, datos, oráculos, juez acotado y UI de pila; pendiente el smoke test de navegador.
6. **T6 (nivel 5, MT) en curso:** motor de cinta listo; faltan las funciones, el juez acotado y la UI de tambor/cinta.
7. Remaster visual (animaciones, texturas, sonido) recién cuando los 5 niveles funcionen.
8. T9: completar [`docs/SOLUTIONS.md`](SOLUTIONS.md) con los niveles 4-5 antes de la presentación.
9. Pulido T7 e informe T8.

## Tests

```text
tests/dfa.test.js       23 passing
tests/nfa.test.js       26 passing
tests/order.test.js      5 passing
tests/limits.test.js     4 passing
tests/level1.test.js     5 passing
tests/level2.test.js     4 passing
tests/level3.test.js     4 passing
tests/level4.test.js     5 passing
tests/thief.test.js      5 passing
tests/graphEditor.test.js  19 passing
tests/catalog.test.js   12 passing
tests/blueprint.test.js 14 passing
tests/machines.test.js   9 passing
tests/judge.test.js      9 passing
tests/levels.test.js    23 passing
tests/oracles.test.js    5 passing
tests/pda.test.js       20 passing
tests/tm.test.js        16 passing
total                  208 passing
```

Comando: `npm test`. Servidor: `npm run serve` (`serve.py`, con `Cache-Control: no-store`).

## Riesgos

- **Equivalencia de AP y MT**: indecidible en general. El diseño debe usar pruebas acotadas y ser honesto en el informe. No prometer un juez exacto.
- **Alcance**: cinco niveles con cuatro motores distintos es mucho para un curso. La mitigación es el orden vertical slice: un nivel completo antes de abrir el siguiente.
- **Diversión**: un puzzle que no engancha es peor que un visualizador claro. La mitigación es el ladrón como feedback inmediato y el vocabulario de taller.
- **UI del nivel 5**: la cinta y el tambor de control son la parte más cara. Empezar temprano o simplificar.
- **Informe**: la rúbrica no evalúa código. Si el informe queda flojo, el juego no salva la nota.

## Decisiones recientes

- **Plan por fases:** primero completar los 5 niveles de forma funcional y verificada; después remasterizar lo visual (animaciones, texturas, sonido) reutilizando la lógica ya probada. Coordinado con el usuario el 2026-11-06.
- **Corte de cables:** hay una **tijera** explícita en la paleta. Con la tijera activa, un clic sobre el cable lo corta completo; las celdas se atenúan y los cables pasan a ser objetivos. Conectar vuelve a elegir una llave.
- **Un cable por par de celdas:** todos sus valores van en una sola etiqueta (`1,2`). No se dibujan cables paralelos.
- **Servidor sin caché:** `serve.py` agrega `Cache-Control: no-store` para que el navegador no mezcle módulos viejos y nuevos (fue la causa de un editor roto).
- **Editor renombrado:** `src/ui/graphEditor.js` (antes `workshop.js`). La URL nueva fuerza al navegador a descargar el módulo aunque tenga el viejo en caché. La pantalla de inicio muestra `build 4`.
- **Test de DOM:** `tests/graphEditor.test.js` cubre conectar, cortar y teclado sin navegador.
- **Nivel 1:** el mecanismo inicial parte incompleto (falta un cable) además de tener dos cruzados, para que no se sienta casi resuelto.
- Se mantiene la ficción del cerrajero. De la idea de la bomba se adaptaron dos cosas: la **ficha del contrato persistente** y el **diagnóstico forense** del ladrón (marcas de ganzúa, no pistas). El modo contrarreloj queda opcional para después del freeze; el demo de dos roles va al guion de T7.
- Nivel 3 queda como **AFND-λ** (bifurcador + resorte), no como sumidero/complemento.
- Exactamente **5 niveles**, sin actos extra.
- Stack: HTML/CSS/JS con módulos ES y SVG, sin framework.
- El ladrón es un oráculo de contraejemplos, no un random.
- El juego no muestra vocabulario académico.

## Enlaces

- [`README.md`](../README.md)
- [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- [`docs/TASKS.md`](TASKS.md)
- [`odd/tasks/el-cerrajero.md`](../odd/tasks/el-cerrajero.md)
