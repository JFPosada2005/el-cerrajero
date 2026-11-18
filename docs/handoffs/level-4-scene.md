# Handoff — escena del nivel 4 (Teatro Municipal)

- **Estado:** completed.
- **Rama:** `feat/remaster-integration`.

## Archivos tocados (solo superficie autorizada)

- `src/ui/levels/level4Scene.js` (nuevo): `createLevelScene({ level, puzzle, phase })`.
- `src/ui/levels/level4.css` (nuevo): alcance estricto `.level-scene[data-level="4"]`.
- `tests/level4Scene.test.js` (nuevo): 7 tests con DOM falso mínimo propio.
- `docs/handoffs/level-4-scene.md` (este archivo).

No se tocó nada fuera de la superficie: sin cambios en `src/main.js`, `styles.css`, `index.html`, `src/core`, `src/game`, tests existentes, `mockups/` ni git.

## API entregada

`createLevelScene({ level, puzzle, phase })` devuelve `{ element, editorSlot, statusSlot, dispose }`.

- `element`: `section.level-scene[data-level="4"]`, `aria-label="Tramoya del Teatro Municipal"`, para montar en `slots.stage` del shell.
- `editorSlot` (`data-slot="editor"`): hueco de la placa donde el parent monta el `#canvas` real.
- `statusSlot` (`data-slot="status"`): `aria-label="Pila del montacargas"`, `aria-live="polite"`, para la pila real.
- `dispose()`: retira el elemento (`element.remove()`).
- `phase` se muestra tal cual en el sello de la placa ('Reparación' | 'Construcción'); `level.keys[].label` arma la leyenda de palancas (`▲ Subir · ▼ Bajar`) solo por `textContent`.

## Decorado

- Fondo de terciopelo granate + cortinas laterales + riel superior de latón (placeholder `n4.background`).
- Placa con marco de latón, "Tramoya del teatro", "Montacargas n.º 04" y leyenda visual del cable ("Se lee: llave · qué hay arriba · qué hace" + "Cargar apila una ficha…", mismo texto que `stackHelp` en `main.js`).
- Columna de contrapesos: cuerda, 3 fichas `n4.chip` y base `n4.stackBase` (decorativas, `aria-hidden`).
- Dos diales de selector `n4.selectors` ("Si arriba hay" / "Acción") como `role="img"` con su descripción; **no son controles**: los botones reales de pila los sigue montando el parent.
- Todo placeholder lleva `data-placeholder="a-producir"` + `data-asset` del manifest; la nota al pie lo dice en texto visible.
- Sin botones ni listeners: decorado puro. Sin SVG/`createElementNS` (todo CSS), sin `innerHTML`, sin palabras académicas en los textos.

## Tests

- `node --test tests/level4Scene.test.js` → **7 pass, 0 fail**.
- `node --test` completo → **291 pass, 0 fail** (284 preexistentes + 7 nuevos).

Cobertura: raíz/data-level/slots, reserva de placa y pila, no-editor (estático + estructural: sin botones ni listeners), placeholders con sus 4 assets, leyenda desde `level.keys` con inyección literal (`<img onerror…>` no se parsea), vocabulario de taller, sello de fase, `dispose`, y alcance CSS + foco + `prefers-reduced-motion`.

## Supuestos y riesgos

- El parent monta `#canvas` en `editorSlot`, `#stack-panel` (o su bloque) en `statusSlot`, y conserva `handleProbe`/`handleAssault`/selectores reales de pila en el inventario del shell.
- `phase` llega ya traducida, igual que en `workbenchView`.
- No verificado en navegador real: el `:empty::after` del slot ("Aquí va el mecanismo real") desaparece solo cuando el parent monta el editor dentro; si el parent lo reemplaza en vez de anexar, no se ve nada (correcto igual).
- Foco y targets ≥44px de los controles reales dependen del CSS del parent; la escena no agrega elementos interactivos.

## Cómo integrarlo en `main.js`

```js
import { createLevelScene } from './ui/levels/level4Scene.js';

// Solo cuando state.level.id === 4 y workspace === 'graph':
const scene = createLevelScene({ level: state.level, puzzle: state.puzzle, phase: phaseWord() });
workbench.slots.stage.append(scene.element);
scene.editorSlot.append(canvasDelEditor); // createGraphEditor sobre #canvas
scene.statusSlot.append(bloqueDePila);    // #stack-panel real
```

Cargar `src/ui/levels/level4.css` solo en pantalla de taller del nivel 4.

## Key Learnings

- La trampa del grep literal muerde de nuevo: el comentario "nunca por `innerHTML`" rompía `includes('innerHTML')`; la aserción debe buscar `.innerHTML` (uso real), como ya sabía el handoff de la cáscara.
- Un parser CSS línea a línea debe mirar solo las líneas con `{` (selectores) e ignorar declaraciones, comentarios y `@media`; si no, las custom properties parecen reglas fuera de alcance.
- Los selectores de pila de N4 son decorado `role="img"` en la escena y controles reales del parent: duplicar la forma sin duplicar la función evita lógica fantasma.
- Construir la leyenda de palancas desde `level.keys[].label` por `textContent` reutiliza los datos (`▲ Subir / ▼ Bajar`) sin crear llaves ni lógica.
