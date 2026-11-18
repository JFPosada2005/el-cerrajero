# Handoff — escena del nivel 2 (Hotel Mirador)

- **Estado:** completed.
- **Rama:** `feat/remaster-integration`.

## Archivos tocados (solo superficie autorizada)

- `src/ui/levels/level2Scene.js` (nuevo): `createLevelScene({ level, puzzle, phase })`.
- `src/ui/levels/level2.css` (nuevo): alcance `.level-scene[data-level="2"]`.
- `tests/level2Scene.test.js` (nuevo): 10 tests con DOM falso mínimo propio.
- `docs/handoffs/level-2-scene.md` (este archivo).

No se tocó `src/main.js`, `styles.css`, `index.html`, `src/core`, `src/game`,
tests existentes, `mockups/` ni git.

## API entregada

`createLevelScene({ level, puzzle, phase })` devuelve
`{ element, editorSlot, statusSlot, dispose }` según
`docs/REMASTER-SCENE-CONTRACT.md` §Escena por nivel:

- `element`: `section.level-scene[data-level="2"]`,
  `aria-label="Sala de máquinas del ascensor"`.
- `editorSlot`: `div.l2-editor-slot[data-slot="editor"]` dentro de la placa,
  vacío, con `aria-label` para el tablero de cables. El parent monta ahí el
  `#canvas` real de `createGraphEditor`; el CSS ya deja el `svg`/`#canvas`
  a ancho completo y marca el foco con `:focus-within` teal.
- `statusSlot`: `div.l2-status[data-slot="status"]` con `aria-live="polite"`
  y texto de fase (`Fase: Reparación/Construcción`).
- `dispose()`: suelta la escena del taller y vacía los slots.
- `phase` acepta `'repair'` / `'build'` (o la etiqueta ya traducida);
  cualquier otro valor cae a `'Reparación'`.

La escena no crea editor, cables, llaves, juicio ni lógica (verificado por
test estático y estructural). Los textos viajan por `textContent`.

## Decisiones

- **Sala art déco en CSS/SVG:** fondo de níquel con retícula de latón,
  indicador de pisos semicircular (Baja · 1 · 2, aguja fija), placa con dos
  relés de adorno (`Cerrada`/`Abierta`) y piñón de bucle de 8 dientes. Nada
  de imágenes externas: cero raster, cero `src`/`href`.
- **Indicador y piñón son adornos** (`aria-hidden` en props; el indicador
  lleva `role="img"` y avisa que es adorno). El recorrido real lo muestra el
  tablero del parent; la aguja no se mueve con el juego.
- **Vocabulario de taller:** placa, relé, piñón, pisos, tablero, marcha,
  fase. Sin términos académicos (test lo barre en JS+CSS).
- **44 px / foco / movimiento:** regla de 44 px para botones que el parent
  monte dentro, `:focus-visible` teal y bloque `prefers-reduced-motion`.
- **Leyenda “a producir”** visible en la placa para fondo, indicador y piñón.

## Tests

- `node --test tests/level2Scene.test.js` → **10 pass, 0 fail**.
- Cobertura: raíz/data-level, editorSlot vacío con aria, statusSlot con
  live, fase en placa y marcha, no-editor (estático + estructural),
  placeholders sin raster con aria, textContent literal, vocabulario,
  CSS con alcance/foco/reduced-motion/44px, dispose.

## Supuestos y riesgos

- El parent monta `#canvas` en `editorSlot` y conserva `handleProbe`,
  `handleAssault`, `toMachine`, jueces y callbacks (capas congeladas).
- Sin verificación en navegador real: el encuadre del tablero dentro de la
  ranura punteada lo confirma el parent al integrar.
- `phase` se trata como etiqueta; si el contrato cambia el formato, se
  ajusta `phaseWord` sin tocar la estructura.

## A producir (slots de `docs/ASSET-MANIFEST.md`)

- `n2.background` → `assets/levels/02/background.webp` (P1).
- `n2.relay` → celda-relé compartida (P0).
- `n2.pinion` → `assets/levels/02/pinion.webp` (P0).
- `n2.floorIndicator` → `assets/levels/02/floor-indicator.svg` (P1).
- `n2.bell` → campana compartida (P1).

## Cómo integrarlo en `main.js` (parent)

```js
import { createLevelScene } from './ui/levels/level2Scene.js';

const scene = createLevelScene({ level: state.level, puzzle: state.puzzle, phase: state.phase });
workbenchView.slots.stage.append(scene.element);
scene.editorSlot.append(canvasDelEditor); // svg#canvas de createGraphEditor
```

Cargar `src/ui/levels/level2.css` solo en pantalla de taller.

## Key Learnings

- El namespace SVG (`http://www.w3.org/...`) rompe un grep literal de
  `http`: la aserción de “sin URLs externas” debe buscar `https://` y
  raster/`src=`/`href=`, no la subcadena `http`.
- Un stub con `createElementNS` + `parentNode`/`remove` alcanza para probar
  una escena con SVG decorativo sin navegador.
- Fijar `className` y atributo `class` a la vez hace el módulo tolerante a
  distintos harnesses de test (el de grafos lee `attributes.class`).
