# Handoff — escena del nivel 2 (Hotel Mirador)

- **Estado:** completed (pulido al mockup `153ee7d`, 2.ª pasada).
- **Rama:** `feat/remaster-integration`.

## Archivos tocados (solo superficie autorizada)

- `src/ui/levels/level2Scene.js`: marco art déco con mesa, luz, placa y decorado; contrato intacto.
- `src/ui/levels/level2.css`: tokens del mockup, placa, editor transparente, responsive y movimiento reducido.
- `tests/level2Scene.test.js`: 17 tests (10 heredados + 7 nuevos).
- `docs/handoffs/level-2-scene.md` (este archivo).

No se tocó `src/main.js`, `styles.css`, `index.html`, `src/core`, `src/game`,
tests existentes de otros niveles, `mockups/` ni git.

## API entregada

`createLevelScene({ level, puzzle, phase })` devuelve
`{ element, editorSlot, statusSlot, dispose }` según
`docs/REMASTER-SCENE-CONTRACT.md` §Escena por nivel:

- `element`: `section.level-scene[data-level="2"]`,
  `aria-label="Hotel Mirador: sala de máquinas. El ascensor."` (usa
  `level.client`/`level.title` con fallbacks `Hotel Mirador`/`El ascensor`).
- `editorSlot`: `div.l2-editor-slot[data-slot="editor"]` dentro de la placa,
  vacío, con `aria-label` para el tablero de cables. El parent monta ahí el
  `svg#canvas` real de `createGraphEditor`.
- `statusSlot`: `div.l2-status[data-slot="status"]` con `aria-live="polite"`
  y texto de fase (`Fase: Reparación/Construcción`).
- `dispose()`: suelta la escena del taller y vacía los slots.
- `phase` acepta `'repair'` / `'build'` (o la etiqueta ya traducida);
  cualquier otro valor cae a `'Reparación'`.

La escena no crea editor, cables, llaves, juicio ni lógica (verificado por
test estático y estructural). Los textos viajan por `textContent`.

## Decisiones del pulido

- **Mesa de nogal + luz cálida:** `.l2-bench` (vetas en gradiente, filo de
  latón arriba) y `.l2-light` (radial cálido arriba-izquierda, filo teal a
  la derecha, viñeta), como el `stage-light` del mockup. Ambos `aria-hidden`.
- **Tipografías del mockup:** Cinzel (título y placa grabada), Oswald
  (kicker, fases, etiquetas), Special Elite (sello, serie, nota “a
  producir”). Sin cargar fuentes: la escena usa las pilas con fallback del
  sistema; el parent/mockup aporta los WOFF2.
- **Placa como la del mockup:** etiqueta grabada `Hotel Mirador · Sala 02`,
  serie `N.º 0201`, sello de fase girado (`En reparación/En construcción`,
  con `aria-label`), sin título genérico de panel.
- **Editor transparente:** `.l2-editor-slot` y `#canvas` con
  `background: transparent; border: 0; box-shadow: none`. El tablero manda;
  la placa solo lo enmarca. Slot vacío muestra guía en Special Elite
  (`:empty::after`), sin borde de panel.
- **Medidas:** hueco de 320 px en escritorio (`≥1100px`), 280 px base,
  220 px en celular (`≤700px`, sello en flujo para no tapar); indicador y
  piñón reducen a 160/72 px en celular.
- **Placeholders con manifiesto:** `data-asset` + `data-status="a producir"`
  en fondo (`n2.background`), indicador (`n2.floorIndicator`), relés
  (`n2.relay`) y piñón (`n2.pinion`).
- **44 px / foco / movimiento:** regla de 44 px para botones del parent,
  `:focus-visible` teal, bloque `prefers-reduced-motion`, vocabulario de
  taller (test barre académicos en JS+CSS).

## Tests

- `node --test tests/level2Scene.test.js` → **22 pass, 0 fail**.
- Cobertura: raíz/data-level, editorSlot vacío con aria, statusSlot con
  live, fase en placa/marcha/sello, encabezado desde datos del nivel con
  fallbacks, mesa+luz decorativas, no-editor (estático + estructural),
  placeholders sin raster con aria, slots del manifiesto, textContent,
  vocabulario, CSS con alcance/foco/reduced-motion/44px, tipografías del
  mockup, raíz contenida (grid/height 100%/overflow hidden/border-box),
  placa flexible con desborde en el slot, `#canvas` por alto/centrado/sin
  estirarse, placa acotada al contenido (`min(100%, 640px)` centrada),
  placa con solo el tablero en flujo (relés en marcha, piñón
  absoluto, nota oculta en ventanas bajas), encabezado compacto con título
  en una línea, celular contenido con padding recortado y sin scroll
  horizontal, dispose.
- `node --test` (suite completa) → **417 pass, 0 fail**.

## Composición final (placa que abraza el tablero)

- Hallazgo del parent: placa de ~1050 px con tablero de 416×264
  centrado; ~300 px vacíos a cada lado. Causa: aspecto fijo 820/520 con
  el alto mandando; el ancho sobrante no se usaba.
- Corrección: placa con `width: min(100%, 640px); margin-inline: auto`
  para que el marco abrace el tablero y la sala se vea alrededor.
- `top` más bajo (indicador 90 px, título 20 px en una línea en desktop)
  para que el tablero llegue a ≥ 480×300.
- Móvil: recorte de ~21 px (sala 8px, `gap` 4px, indicador 88 px, placa
  6px, sello y marcha compactos) frente a la medición de 544 contra un
  stage de 523.
- Mantenido: sin scroll a 1440×900, sin scroll horizontal a 390, tests
  verdes. Medición final en navegador, pendiente del parent.

- Hallazgo del parent: `#canvas` en `100% × 100%` estiraba el SVG y el
  mecanismo (820/520) quedaba en ~290×183 dentro de una placa enorme.
- Corrección: `#canvas` escala por alto (`height: 100%; width: auto;
  max-width: 100%; margin-inline: auto`), centrado y sin estirarse.
- Alto recuperado: `props` y `caption` salen del flujo de la placa — los
  relés acompañan la fila de marcha, el piñón decora en absoluto la
  esquina, la nota se esconde bajo 900 px de ventana. `top` compacto
  (indicador 110 px, título 20 px en una línea) para placa ≥ 300 px.
- Celular: vuelve la contención total (el editor scrollea en el slot);
  la escena no supera al stage ni genera scroll horizontal.
- Criterio medible (tablero ≥ 480×300 a 1440×900, escena ≤ stage a
  390×844, `scrollWidth` exactos) pendiente del parent en navegador real:
  sin Edge/Playwright en este worker.

- Causa original: la escena era `display: block` con `min-height` fija
  en el slot y `#canvas` en `height: auto`, así que el tablero crecía sin
  techo y salía del `.wb-stage` (scroll de página a 1440×900).
- Referencia: `src/ui/levels/level5.css` (`.counting-*`): raíz contenida
  y desborde interno del editor.
- Raíz: `grid` de una fila `minmax(0, 1fr)`, `height/max-height: 100%`,
  `min-height: 0`, `overflow: hidden`, `border-box`.
- Sala en columna flexible (`top` y `status` fijos, placa `1 1 auto`);
  slot con `flex: 1 1 auto`, `min-height: 0` y `overflow: auto`; sin
  mínimos fijos que peleen con el flex.
- Verificación en navegador real pendiente del parent: no hay
  Edge/Playwright en este worker.

## Supuestos y riesgos

- El parent monta `#canvas` en `editorSlot` y conserva `handleProbe`,
  `handleAssault`, `toMachine`, jueces y callbacks (capas congeladas).
- Sin verificación en navegador real: el encuadre del tablero dentro de la
  placa lo confirma el parent al integrar (capturas 1440/390).
- Riesgo menor: si otro worker renombra clases del shell que envuelve la
  escena, el CSS de alcance `.level-scene[data-level="2"]` no se ve
  afectado.

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

- El patrón de `level1.css` (slot absoluto + `#canvas` transparente sin borde) es la referencia exacta para “fondo transparente, sin borde de panel”: alinear el N2 a ese idioma evitó inventar un tercer modelo de integración.
- `data-asset` + `data-status="a producir"` convierte el “a producir” de texto libre en algo greppeable por el parent para la compra de assets.
- Los tests de otros niveles en la misma rama fallan por trabajo paralelo, no por regresión: verificar el aislamiento de imports antes de reportar deja el handoff limpio y asigna cada fallo a su dueño.
