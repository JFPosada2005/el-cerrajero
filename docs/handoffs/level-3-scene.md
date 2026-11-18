# Handoff — escena del nivel 3 (Museo del Llano)

- **Estado:** completed.
- **Rama:** `feat/remaster-integration`.
- **Contrato:** `docs/REMASTER-SCENE-CONTRACT.md` §Nivel 3 · **Plan:** `docs/REMASTER-PLAN.md` §Nivel 3 (El museo).

## Archivos tocados

- `src/ui/levels/level3Scene.js` (nuevo): `createLevelScene({ level, puzzle, phase })`.
- `src/ui/levels/level3.css` (nuevo): alcance `.level-scene[data-level="3"]`.
- `tests/level3Scene.test.js` (nuevo): 8 tests con DOM falso mínimo propio.
- `docs/handoffs/level-3-scene.md` (este archivo).

No se tocó nada fuera de la superficie: sin cambios en `src/main.js`, `styles.css`, `index.html`, `src/core`, `src/game`, tests existentes, `mockups/` ni git.

## API entregada

```js
createLevelScene({ level, puzzle, phase }) => {
  element,     // section.level-scene[data-level="3"][data-phase]
  editorSlot,  // div.museum-editor-slot[data-slot="editor"][data-cells="5-8"], role="group"
  statusSlot,  // aside.museum-status[data-slot="status"], aria-live="polite"
  dispose(),   // suelta la escena del parent, idempotente
}
```

- `phase` acepta `'repair' | 'build'` y las palabras del taller (`'Reparación' | 'Construcción'`); la placa muestra la palabra y la raíz lleva `data-phase`.
- La escena **no** crea editor, cables, llaves, juicio ni lógica (verificado por test estático + estructural): el parent monta el `#canvas` real en `editorSlot` y la marcha de la prueba en `statusSlot`.
- Glifos inline SVG con `createElementNS`: bifurcador en “Y” (`n3.fork`) y resorte en zigzag punteado (`n3.spring`); lámparas de día/noche (`n3.lamp`); fondo día/noche (`n3.background.day/night`); todo con `data-status="placeholder"` + `data-todo="a producir"`, sin imágenes externas.
- Vocabulario de taller en toda la UI visible y en los `aria-label` (sin AFD/AFND/autómata/estado/transición/lenguaje). Nota: “estado” está vedado por `AGENTS.md`, así que el slot de estado se nombra “la marcha del mecanismo”.
- Foco `:focus-visible` teal, blancos mínimos de 44 px para futuros botones, `prefers-reduced-motion` que apaga animación y transición.

## Tests

- `node --test tests/level3Scene.test.js` → **8 pass, 0 fail** (RED previo: fallaban placeholders por el namespace SVG `http://` y “estado” en el vocabulario; corregido sin tocar lógica).
- `node --test` completo → **292 pass, 0 fail** (284 preexistentes + 8 nuevos).

Cobertura: raíz/`data-level`/`editorSlot` (5–8 casillas), fases repair/build, no-editor (estructural + estático), placeholders “a producir”, alas/lámparas/glifos con vocabulario de taller, aria (`role="group"`, SVGs `aria-hidden`, `aria-live`), `dispose()` idempotente, CSS con alcance/foco/44 px/reduced-motion/sin URLs externas.

## Supuestos y riesgos

- El parent monta `createGraphEditor` en `editorSlot` y decide si usa `statusSlot`; la escena no impone tamaños de celda, solo reserva la placa (`min-height: 220px`, ancho hasta 860 px).
- En celular, el encuadre/scroll del mecanismo lo resuelve el parent o el editor; la escena no fija scroll propio.
- No verificado en navegador real: la pintura de luz (día cálida / noche teal) y las lámparas son CSS/SVG y están pendientes del asset final de Mateo (`n3.background.day/night`, `n3.lamp`).

## Cómo integrarlo en `main.js`

```js
import { createLevelScene } from './ui/levels/level3Scene.js';

const museum = createLevelScene({ level: state.level, puzzle: state.puzzle, phase: state.phase });
workbenchView.slots.stage.append(museum.element);
museum.editorSlot.append(canvasDelEditor); // el #canvas de createGraphEditor
museum.statusSlot.append(bloqueDeMarcha);  // opcional: marcha de la prueba
```

Cargar `src/ui/levels/level3.css` solo en pantalla de taller del nivel 3.

## Key Learnings

- El namespace SVG (`http://www.w3.org/2000/svg`) rompe cualquier aserción ingenua de “sin http”: el test de placeholders debe buscar `<img`/`url(` en su lugar.
- “Estado” es vocabulario académico vedado en esta UI: el slot con `aria-live` se nombra “la marcha del mecanismo” y pasa el mismo control de vocabulario que el texto visible.
- Contar los SVG propios en el test (Y + resorte + 2 lámparas = 4) fija el límite de “la escena no dibuja mecanismos”: si alguien agrega un SVG de pieza, el test lo acusa.
