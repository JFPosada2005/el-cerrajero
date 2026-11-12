# El Cerrajero — instrucciones para agentes

Antes de tocar UI o documentación de producto:

1. Leé `docs/DESIGN.md` y `docs/VISUAL-DESIGN.md`.
2. Para cualquier tarea visual, cargá `skills/el-cerrajero-visual-design/SKILL.md`.
3. No muestres vocabulario académico en la UI: AFD, AFND, AP, MT, autómata, estado, transición, lenguaje.
4. Corré `npm test` antes de cerrar una tarea.
5. No hagas push a `main` sin aprobación del owner.

## Congelamiento de la lógica (fase de remasterización)

La lógica del juego está congelada. La referencia completa es [`docs/LOGIC.md`](docs/LOGIC.md).

- **No modificar** `src/core/*`, `src/game/*` ni el flujo funcional de `src/main.js` (`startLevel`, fases, `handleProbe`, `handleAssault`, `handlePinEdit`, progreso). Tampoco los datos de nivel (`level1.js`…`level5.js`), jueces, oráculos, funciones, `blueprint`, `machines` ni `levels.js`.
- **Permitido en el remaster:** `styles.css`, `index.html`, la presentación de `src/ui/*`, assets, fuentes, sonido, animaciones y la capa visual de `main.js`, siempre que no cambien las reglas, los datos que se pasan a los motores ni los callbacks.
- Si un cambio en la lógica parece necesario, **preguntar al owner primero** y explicar por qué es necesario, qué se rompe si no se hace y qué alternativas hay. No ejecutarlo sin respuesta.
- Si se modifica por error, **informar al owner**, explicar qué se cambió y por qué ocurrió, y el owner decide si se mantiene o se revierte. Con más razón que un cambio pedido.
- Cada tarea de remaster debe declarar en su PR si tocó algún archivo congelado; si la respuesta es sí, el PR no se mergea sin decisión del owner.
