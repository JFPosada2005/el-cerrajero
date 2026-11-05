# Estado del proyecto — El Cerrajero

Actualizado: 2026-11-05.

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
- Nivel 1:
  - taller SVG con 4 celdas y cables por llave;
  - dos cables incorrectos que el jugador debe cortar;
  - prueba de la llave legítima `123`;
  - asalto con contraejemplo concreto;
  - modal de victoria y persistencia en `localStorage`.
- Tests: **17 pasando** con `node --test`.

## Qué está en revisión

- T2 (nivel 1): falta el smoke test de navegador y la alineación con `docs/DESIGN.md`.
- La UI del taller no tiene todavía un modo de construcción libre; el nivel 1 es de reparación.

## Diseño técnico

- [`docs/DESIGN.md`](DESIGN.md) aprobado el 2026-11-05, incluida D6: arquitectura por capas, contratos de datos, juez exacto para AFD/AFND y acotado para AP/MT, esquema de niveles, UI y plan de tests.
- Propone **dos puzzles por nivel** (reparar y construir) y un ladrón que escala.
- **D6 aprobado:** el nivel 3 usa “contiene 1-2-2 o 2-1-1”, para que el bifurcador sea necesario.
- **Addendum visual:** [`docs/VISUAL-DESIGN.md`](VISUAL-DESIGN.md) con la dirección “precisión noir”, tokens, tipografía Fraunces + Inter, motion, accesibilidad y checklist “no retro”.
- Los contratos se congelan con F1-F5.

## Qué sigue

1. Congelar interfaces (F1-F5) y aplicar la base visual.
2. Repositorio creado y `main` subido: <https://github.com/JFPosada2005/el-cerrajero> (privado).
3. Invitación enviada a **MateoTorres1543** con permiso `write`; pendiente de aceptar.
4. Implementar T3 (nivel 2) y T4 (AFND) en ramas separadas.
5. Implementar T5 (AP) y T6 (MT).
6. Pulido T7 y informe T8.

## Tests

```text
tests/dfa.test.js      12 passing
tests/level1.test.js    5 passing
total                  17 passing
```

Comando: `npm test`.

## Riesgos

- **Equivalencia de AP y MT**: indecidible en general. El diseño debe usar pruebas acotadas y ser honesto en el informe. No prometer un juez exacto.
- **Alcance**: cinco niveles con cuatro motores distintos es mucho para un curso. La mitigación es el orden vertical slice: un nivel completo antes de abrir el siguiente.
- **Diversión**: un puzzle que no engancha es peor que un visualizador claro. La mitigación es el ladrón como feedback inmediato y el vocabulario de taller.
- **UI del nivel 5**: la cinta y el tambor de control son la parte más cara. Empezar temprano o simplificar.
- **Informe**: la rúbrica no evalúa código. Si el informe queda flojo, el juego no salva la nota.

## Decisiones recientes

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
