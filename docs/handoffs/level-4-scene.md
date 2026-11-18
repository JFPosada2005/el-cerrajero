# Handoff — escena del nivel 4 (Teatro Municipal)

- **Estado:** contenida al `wb-stage`, sin desbordar la página ni tocar el dock.
- **Rama:** `feat/remaster-integration`.

## Archivos tocados (solo superficie autorizada)

- `src/ui/levels/level4Scene.js`: rig contenido (`l4-rig`), cabecera compacta (`l4-head` con `l4-titles` + `l4-levers`), leyenda de una sola línea con el texto completo en `title`, `data-status="a producir"` en cada placeholder.
- `src/ui/levels/level4.css`: contención total (raíz grid 100 % + `overflow: hidden`, rig/body/placa con `min-height: 0`, editor `flex: 1` con scroll interno, pila con `max-height` + scroll interno), canvas por alto sin estirar, diales compactos, celular con scroll vertical y cero horizontal.
- `tests/level4Scene.test.js`: 16 tests (contención, canvas, pila, cabecera, celular).
- `docs/handoffs/level-4-scene.md` (este archivo).

No se tocó nada fuera de la superficie: sin cambios en `src/main.js`, `styles.css`, `index.html`, `src/core`, `src/game`, otros tests, `mockups/` ni git.

## API entregada (sin cambios)

`createLevelScene({ level, puzzle, phase })` devuelve `{ element, editorSlot, statusSlot, dispose }`.

- `element`: `section.level-scene[data-level="4"]`, `aria-label="Tramoya del Teatro Municipal"`, para montar en `slots.stage` del shell. Ahora con techo propio: `height/max-height: 100%`, `overflow: hidden`, `box-sizing: border-box`.
- `editorSlot` (`data-slot="editor"`): `flex: 1 1 auto`, `min-height: 0`, `overflow: auto`; el `#canvas` real escala por alto (`height: 100%; width: auto; max-width: 100%; margin-inline: auto`), centrado y sin deformar — no se estira como pasó en el N2.
- `statusSlot` (`data-slot="status"`): `flex: 0 0 auto`, `aria-label="Pila del montacargas"`, `aria-live="polite"`; `#stack-panel`/`.stack-panel` con `max-height: 200px` + `overflow: auto`, fichas de 44 px.
- `dispose()`: retira el elemento (`element.remove()`).
- `phase` se muestra tal cual en el sello de la placa; `level.keys[].label` arma palancas y leyenda (`▲ Subir · ▼ Bajar`) solo por `textContent`.

## Decorado y contención

- Fondo de terciopelo granate + cortinas + riel de latón (placeholder `n4.background`); luz cálida + mesa de nogal (CSS estructural, fuera de lectores).
- Cabecera de una fila: títulos + palancas decorativas `n4.levers` con `padding-right` para el sello; no le roba alto al editor.
- Leyenda de **una sola línea** (título + palancas, con ellipsis): el texto completo vive donde ya estaba duplicado — el `stackHelp` del dock del parent — y en el `title` de la ficha. ~34 px en vez de ~130 px.
- Columna de contrapesos: cuerda, 3 fichas `n4.chip` y base `n4.stackBase` (decorativas, `aria-hidden`); diales `n4.selectors` compactos (cara de 52 px) como `role="img"`; **no son controles**.
- Todo placeholder lleva `data-placeholder="a-producir"` + `data-status="a producir"` + `data-asset` del manifest.
- Sin botones ni listeners: decorado puro. Sin SVG/`createElementNS`, sin marcas parseadas, sin palabras académicas.
- En celular (`≤ 700px`) la escena también queda contenida (`height/max-height: 100%`, `overflow: hidden`): el stage móvil pone el alto, el cuerpo scrollea adentro, la leyenda se esconde (su texto vive en el dock y en el `title`), la cabecera se compacta (título 16 px, palancas 36 px) y el editor reserva 240 px con scroll interno y canvas por ancho.

## Tests

- `node --test tests/level4Scene.test.js` → **16 pass, 0 fail**.
- `node --test` completo → **414 pass, 2 fail ajenos**: `tests/level5Scene.test.js:292 y :305` (cuño/título del N5; importan solo `level5Scene.js`, sin menciones al N4, archivos con edición concurrente). El fallo del N2 del parte anterior ya lo cerró su worker.
- Cobertura nueva: raíz contenida (grid/`height`/`max-height`/`min-height`/`overflow`/`box-sizing`), editor flexible + canvas por alto sin `min-height` heredados (280/320), pila con techo + scroll + 44 px, cabecera fija + diales de 52 px, celular contenido (raíz 100 % + cuerpo con scroll + leyenda oculta + editor 240 px + canvas por ancho), rig/cabecera en el DOM, leyenda de 2 nodos con `title` completo.

## Supuestos y riesgos

- El parent monta `#canvas` en `editorSlot` y `.stack-block > #stack-panel` en `statusSlot`; el dock conserva `stackHelp` (duplicado intencional de la leyenda) y los selectores reales de pila.
- `phase` llega ya traducida, igual que en `workbenchView`.
- Medición real en navegador (900/604/390) pendiente del parent: la contención es estructural (cadena de altos definidos + `min-height: 0` + desbordes internos), pero el presupuesto del editor (~300 px a 1440×900) se estimó por suma de fijos, no por captura.
- En celular la escena mide `height: 100%` del stage: queda ≤ 523 por construcción; el cuerpo scrollea adentro y no hay scroll horizontal.
- El `node --test` global queda en rojo por 2 tests del N5 en obra concurrente; esta unidad está verde en su superficie.

## Cómo integrarlo en `main.js`

Sin cambios respecto al handoff anterior:

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

1. Escalar un SVG con `viewBox` por ancho (`width: 100%; height: 100%`) lo estira hasta lo irreconocible (lección del N2: 290×183 en placa de 1000 px); `height: 100%; width: auto; max-width: 100%; margin-inline: auto` lo encaja por alto, centrado y sin deformar.
2. La leyenda de ~130 px duplicaba el `stackHelp` que el parent ya monta en el dock: una línea visible + texto completo en `title` recupera casi 100 px de editor sin perder información ni accesibilidad; en móvil se esconde del todo porque el dock la cubre.
3. Contener es una cadena o nada: raíz `height/max-height: 100%` + cada nivel intermedio con `min-height: 0` y desborde declarado; un solo eslabón con alto mínimo heredado (320/280) o una media query que suelte la raíz (`height: auto`) vuelve a empujar la página — en móvil el stage manda y la escena también se contiene.
4. `cssBlocks(selector)` por `indexOf` exacto con `{` distingue la regla desktop de la mobile del mismo selector y permite pinnear el contrato responsive sin navegador.
5. Un `node --test` global en rojo por tests ajenos (N5, sin menciones al N4) se delimita mostrando independencia de imports; `partial` honesto vale más que un verde fingido.
