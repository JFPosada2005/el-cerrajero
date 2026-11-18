# El Cerrajero — instrucciones para agentes

Antes de tocar UI o documentación de producto:

1. Leé `docs/DESIGN.md` y `docs/VISUAL-DESIGN.md`.
2. Para cualquier tarea visual, cargá `skills/el-cerrajero-visual-design/SKILL.md`.
3. No muestres vocabulario académico en la UI: AFD, AFND, AP, MT, autómata, estado, transición, lenguaje.
4. Corré `npm test` antes de cerrar una tarea.
5. No hagas push a `main` sin aprobación del owner.

## Planes y documentos

Todo agente que diseñe un plan (de diseño, remasterización, implementación o investigación) debe escribirlo en un archivo Markdown dentro de `docs/` o `odd/` **antes de ejecutarlo o de cerrar su turno**. El archivo debe incluir contexto, objetivo, decisiones, alternativas, riesgos, pendientes y estado. Un plan que solo vive en el chat o en la memoria del agente no cuenta: si el agente se cancela o falla, el `.md` debe quedar utilizable. Para trabajos largos, guardar checkpoints incrementales en el mismo archivo.

## Autorizaciones de remasterización (2026-11-17)

El owner autorizó:

- **Aut-1:** reescribir la capa visual de `renderWorkshop`, `renderDrumWorkshop`, `openModal`, `renderTitle` y `renderMap`, manteniendo las mismas llamadas a los editores, `toMachine`, `handleProbe`, `handleAssault`, `handlePinEdit`, los callbacks y los datos que reciben los motores. No cambia reglas.
- **Aut-2:** pasar los pasos completos de la corrida a la interfaz (`frameStates`, `renderStack`, `showTapeFrame`) sin tocar los motores.
- El contrato de assets vive en [`docs/ASSET-MANIFEST.md`](docs/ASSET-MANIFEST.md); los recursos faltantes usan placeholder y no bloquean.

El resto del congelamiento sigue vigente.

## Congelamiento de la lógica (fase de remasterización)

La lógica del juego está congelada. La referencia completa es [`docs/LOGIC.md`](docs/LOGIC.md).

- **No modificar** `src/core/*`, `src/game/*` ni el flujo funcional de `src/main.js` (`startLevel`, fases, `handleProbe`, `handleAssault`, `handlePinEdit`, progreso). Tampoco los datos de nivel (`level1.js`…`level5.js`), jueces, oráculos, funciones, `blueprint`, `machines` ni `levels.js`.
- **Permitido en el remaster:** `styles.css`, `index.html`, la presentación de `src/ui/*`, assets, fuentes, sonido, animaciones y la capa visual de `main.js`, siempre que no cambien las reglas, los datos que se pasan a los motores ni los callbacks.
- **Presentación libre no significa lógica libre:** el guard de `src/ui/drumEditor.js` que bloquea las secciones con `accept: true` es parte del congelado, porque impide que una púa llegue a la sección final y que `createTM` reciba reglas en un estado de aceptación. Un remaster puede rehacer el tambor, pero debe conservar esa invariante (o moverla a otra capa sin perderla).
- **`tests/*` es la red de seguridad:** no se modifica ni se borra un test para que pase un cambio visual; sí se pueden agregar tests. `serve.py` es infraestructura de desarrollo y no forma parte del remaster.
- Si un cambio en la lógica parece necesario, **preguntar al owner primero** y explicar por qué es necesario, qué se rompe si no se hace y qué alternativas hay. No ejecutarlo sin respuesta.
- Si se modifica por error, **informar al owner**, explicar qué se cambió y por qué ocurrió, y el owner decide si se mantiene o se revierte. Con más razón que un cambio pedido.
- Cada tarea de remaster debe declarar en su PR si tocó algún archivo congelado; si la respuesta es sí, el PR no se mergea sin decisión del owner.
