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

## Qué sigue

1. Recibir `docs/DESIGN.md` del modelo de diseño y congelar interfaces.
2. Crear el repositorio de GitHub y subir el estado actual (pendiente de confirmación de visibilidad).
3. Invitar al colaborador (falta su usuario de GitHub).
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
