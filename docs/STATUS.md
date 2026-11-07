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
- **Mapa de contratos:** 5 cartas, candado en las bloqueadas, desbloqueo al completar la anterior y corona en el jefe final.
- Nivel 1:
  - taller SVG con 4 celdas y **un cable por par de celdas**, con todos sus valores en una etiqueta;
  - mecanismo inicial **incompleto**: falta un cable y sobran dos;
  - conectar con clic en origen → destino; **cortar con la tijera**; Escape cancela una selección pendiente;
  - **ficha del contrato persistente** con cliente y regla en palabras llanas;
  - prueba de la llave legítima `123`;
  - asalto con contraejemplo concreto y **diagnóstico forense** (`intruder` / `lockout`);
  - modal de victoria y persistencia en `localStorage`.
- Tests: **64 pasando** con `node --test`, incluido un test de DOM del editor.

## Qué está en revisión

- T2 (nivel 1): falta el smoke test de navegador y la alineación con `docs/DESIGN.md`.
- La UI del taller no tiene todavía un modo de construcción libre; el nivel 1 es de reparación.

## Diseño técnico

- [`docs/DESIGN.md`](DESIGN.md) aprobado el 2026-11-05, incluida D6: arquitectura por capas, contratos de datos, juez exacto para AFD/AFND y acotado para AP/MT, esquema de niveles, UI y plan de tests.
- Propone **dos puzzles por nivel** (reparar y construir) y un ladrón que escala.
- **D6 aprobado:** el nivel 3 usa “contiene 1-2-2 o 2-1-1”, para que el bifurcador sea necesario.
- **Addendum visual:** [`docs/VISUAL-DESIGN.md`](VISUAL-DESIGN.md) con la dirección “precisión noir”, tokens, tipografía Fraunces + Inter, motion, accesibilidad y checklist “no retro”.
- **Investigación visual adicional integrada:** reflow 320 px, foco no obscurecido por sticky, alternativa a drag, View Transitions progresiva, textura estática y tamaños de librerías corregidos.
- **F1 congelado:** `symbols`, `limits`, `order`, `runDFA` con frames y `validateDFA` estricto. F2-F5 en curso.

## Qué sigue

1. **F1 hecho.** Sigue F2 (blueprint, machines, juez exacto, format, thief), F3 (levels + build de L1), F4 (flow, progress) y F5 (main data-driven).
2. Repositorio creado y `main` subido: <https://github.com/JFPosada2005/el-cerrajero> (privado).
3. Invitación enviada a **MateoTorres1543** con permiso `write`; pendiente de aceptar.
4. Implementar T3 (nivel 2) y T4 (AFND) sobre contratos congelados.
5. Implementar T5 (AP) y T6 (MT).
6. Remaster visual (animaciones, texturas, sonido) recién cuando los 5 niveles funcionen.
7. Pulido T7 e informe T8.

## Tests

```text
tests/dfa.test.js       23 passing
tests/order.test.js      5 passing
tests/limits.test.js     4 passing
tests/level1.test.js     8 passing
tests/thief.test.js      5 passing
tests/graphEditor.test.js   8 passing
tests/catalog.test.js   11 passing
total                   64 passing
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
