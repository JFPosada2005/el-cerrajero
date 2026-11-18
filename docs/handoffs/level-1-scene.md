# Handoff — escena del nivel 1 (Banco del Llano)

- **Estado:** completed.
- **Rama:** `feat/remaster-integration`.

## Archivos tocados

- `src/ui/levels/level1Scene.js` (nuevo): `createLevelScene({ level, puzzle, phase })`.
- `src/ui/levels/level1.css` (nuevo): todo bajo `.level-scene[data-level="1"]`.
- `tests/level1Scene.test.js` (nuevo): 10 tests con DOM falso mínimo propio.
- `docs/handoffs/level-1-scene.md` (este archivo).

No se tocó nada fuera de la superficie: sin cambios en `src/main.js`, `styles.css`, `index.html`, `src/core`, `src/game`, tests existentes, `mockups/` ni git.

## API entregada

`createLevelScene({ level, puzzle, phase })` devuelve `{ element, editorSlot, statusSlot, dispose }`.

- `element`: `section.level-scene.level-1` con `data-level="1"` y `aria-label` de taller (`"<cliente>: mesa de trabajo. <título>."`). Va dentro de `slots.stage` del shell.
- `editorSlot`: `div.level-editor` con `data-slot="editor"`, `role="group"` y `aria-label "Mecanismo de la cerradura"`. Vive dentro de la placa y llega vacío: el parent monta ahí el `#canvas` real. Sin `tabindex` propio: el foco lo tienen las celdas del editor real.
- `statusSlot`: `null`. El nivel 1 no usa pila ni cinta; el parent sigue usando el slot de estado del shell.
- `dispose()`: saca la escena (`element.remove()`) sin vaciar el slot: el parent desmonta el editor.
- `level` (`{ contract, title, client }`, con fallbacks `01 / La caja de seguridad / Banco del Llano`) pinta la etiqueta `"<cliente> · Caja <contrato>"` y el `aria-label`. `phase` (`'repair'` por defecto) pinta el sello `En reparación` / `En construcción`. `puzzle` se acepta por contrato y se ignora: el objetivo vive en la ficha del shell, no se duplica en la escena.
- La escena no agrega listeners, botones, SVG ni focos propios; datos por `textContent`, sin `innerHTML`.

Decorado (placeholders del mockup, sin copiar assets): `fondo-banco.jpg`, `mesa-madera.svg`, `ladron.png` (alt `El ladrón observa desde la penumbra`), `placa-textura.jpg` + `placa-marco.svg`, `contrato.png` / `nota-pista.png` / `libreta.png` (pies `Contrato / Pista / Bitácora`), `campana-alarma.png` (pie `Campana de alarma`), serie `N.º 0147` y rótulo `Alarma`. Todo el decorado lleva `alt` explícito (vacío + `aria-hidden` lo puramente visual) y `pointer-events: none` para no tapar el mecanismo.

## Decisiones

- **Campana y papeles decorativos, no botones:** los botones reales (`Contrato / Pista / Bitácora`, `Probar`, `Ensayo`) los monta el parent en el shell. Un botón sin acción sería una trampa; por eso la escena no crea ningún foco ni target: el requisito de 44 px se cumple por vacuidad y el `:focus-visible` del CSS queda para celdas y cables del `#canvas` real.
- **Sin `statusSlot` útil:** se devuelve `null` explícito en vez de un nodo vacío que ocupe layout; documentado para que el parent no lo espere.
- **Sello de fase en la placa:** usa `phase` sin lógica; el parent recrea la escena al cambiar de fase (igual que hoy recrea el taller).
- **`#canvas` integrado por CSS:** `.level-editor #canvas` apaga el panel oscuro de `styles.css` (fondo transparente, sin borde ni sombra) y ocupa el slot. La vista de celdas del `graphEditor` (coordenadas 140–720 × 150–270 sobre `viewBox 0 0 820 520`) cae dentro del área reservada (13 % / 6 % / 17 % / 6 % de la placa).
- **Textos ≥ 12 px** (escala del plan) y `prefers-reduced-motion` que congela animaciones.

## Tests

- `node --test tests/level1Scene.test.js` → **10 pass, 0 fail**.
- `node --test` completo → **343 pass, 0 fail** (incluye unidades hermanas en el árbol: workbench y niveles 2–5; 10 son de esta escena).

Cobertura: raíz y alcance, slot vacío dentro de la placa, etiqueta derivada (default + custom), sello de fase (repair/build/default), los 9 sprites con pies y alts, no-editor (estático + estructural: sin botones/SVG/focos/listeners), vocabulario (sin AFD/AFND/AP/MT/autómata/estado/transición/lenguaje), `dispose`, y CSS (alcance N1, canvas transparente sin borde, foco, movimiento reducido, ≥ 12 px).

## Supuestos y riesgos

- El parent carga `level1.css` solo en pantalla de taller, hace `slots.stage.append(scene.element)` y `scene.editorSlot.append(canvasDelEditor)`.
- No verificado en navegador real: el encaje visual placa ↔ `#canvas` (tamaños, solape del sello con celdas) depende de captura a 1440/390 del parent.
- Si un sprite final llega (`assets/levels/01/*` + `manifest.json`), se cambia la ruta en `SPRITES` sin tocar la API; un sprite faltante no bloquea (marco + fondo base).
- La serie `N.º 0147` es decorado fijo del mockup; si diseño quiere otro número, es cambio de dato, no de escena.

## Cómo integrarlo en `main.js`

```js
import { createLevelScene } from './ui/levels/level1Scene.js';

const scene = createLevelScene({ level: state.level, puzzle: state.puzzle, phase: state.phase });
view.slots.stage.append(scene.element);
scene.editorSlot.append(document.querySelector('#canvas'));
```

## Key Learnings

- Mencionar `handleProbe`/`toMachine` en un comentario rompe el grep literal del test: la escena se describe con vocabulario de taller (probar, ensayo, máquinas).
- Un stub falso propio con `remove()` y `parent` alcanza para probar `dispose()` sin navegador.
- Devolver `statusSlot: null` explícito evita que el parent espere un nodo de pila que el nivel 1 no tiene.
