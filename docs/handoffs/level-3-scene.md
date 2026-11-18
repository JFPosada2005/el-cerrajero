# Handoff — escena del nivel 3 (Museo del Llano)

- **Estado:** completed (contención en el stage: la escena ya no desborda la página).
- **Rama:** `feat/remaster-integration`.
- **Contrato:** `docs/REMASTER-SCENE-CONTRACT.md` §Nivel 3 · **Plan:** `docs/REMASTER-PLAN.md` §Nivel 3 (El museo).
- **Referencia de contención:** `src/ui/levels/level5.css` (N5: raíz con techo de alto, desborde interno).

## Archivos tocados

- `src/ui/levels/level3Scene.js`: nuevo contenedor `.museum-room` (columna flexible con placa + marcha); fondo y mesa siguen como decorado absoluto. API intacta.
- `src/ui/levels/level3.css`: raíz `display: grid; grid-template-rows: minmax(0, 1fr); height: 100%; max-height: 100%; min-height: 0; overflow: hidden; box-sizing: border-box`; sala `flex column` con placa `flex: 1 1 auto` y marcha fija; slot `flex: 1 1 auto; min-height: 0; overflow: auto` (fuera `min-height` en px); `#canvas` escala por alto (`height: 100%; width: auto; max-width: 100%; margin-inline: auto`, sin `width: 100%`); a ≤900 px de alto los glifos y la nota salen del flujo; en ≤700 px la raíz pasa a alto libre, se esconden los rótulos de ala y el `min-width: 560px` queda confinado al slot.
- `tests/level3Scene.test.js`: el test del `#canvas` ahora fija el contrato de contención (raíz, sala, placa, slot, canvas, 700px y alturas bajas).
- `docs/handoffs/level-3-scene.md` (este archivo).

No se tocó nada fuera de la superficie: sin cambios en `main.js`, `styles.css`, `index.html`, `src/core`, `src/game`, tests existentes, `mockups/` ni git. (El árbol tiene cambios concurrentes de otras unidades; no son míos y no los toqué.)

## API entregada

```js
createLevelScene({ level, puzzle, phase }) => {
  element,     // section.level-scene.level-scene--museum[data-level="3"][data-phase]
  editorSlot,  // div.museum-editor-slot[data-slot="editor"][data-cells="5-8"], role="group"
  statusSlot,  // aside.museum-status[data-slot="status"], aria-live="polite"
  dispose(),   // suelta la escena del parent, idempotente
}
```

- La escena suma un contenedor interno `.museum-room` (placa flexible + marcha fija); la API y el contrato no cambian.
- `phase` acepta `'repair' | 'build'` y las palabras del taller; la placa muestra la palabra y la raíz lleva `data-phase`.
- La escena **no** crea editor, cables, llaves, juicio ni lógica: el parent monta el `svg#canvas` real en `editorSlot` y la marcha en `statusSlot`. Solo 4 SVG propios (Y, resorte, 2 lámparas).
- Placeholders con `data-asset` + `data-status="a producir"`: `n3.background.day/night`, `n3.lamp` ×2, `n3.fork`, `n3.spring`, fondo de placa.
- Vocabulario de taller (sin AFD/AFND/autómata/estado/transición/lenguaje); la marcha se nombra “la marcha del mecanismo”.
- Foco `:focus-visible` teal (incluye `#canvas`), blancos de 44 px, `prefers-reduced-motion`.

## Tests

- `node --test tests/level3Scene.test.js` → **11 pass, 0 fail** (RED previo: el canvas escalaba por ancho y los glifos comían el alto del editor).
- `node --test` completo → verde (ver validación; incluye pruebas concurrentes de otras unidades).

Cobertura: raíz/`data-level`/`editorSlot` (5–8 casillas), fases, no-editor (estructural + estático), placeholders “a producir”, alas/lámparas/glifos, serie/alarma, `#canvas` 1440/390, materia mockup, aria, `dispose()`, CSS con alcance/foco/44 px/reduced-motion/sin URLs externas.

## Supuestos y riesgos

- El bloqueo observado (scroll de página, canvas 832×528 fuera del stage) se corrige por CSS: techo de alto en la raíz, escala por alto en el canvas y glifos/nota fuera del flujo a ≤900 px. Estimación a 1440×900: slot ≈ 360 px de alto → tablero ≈ 570×360 (≥ 480×300). Sin verificación en navegador real de este turno: validar `scrollHeight === 900`, `scrollWidth === 1440`, canvas `bottom <= 604`, y a 390×844 escena ≤ stage con `scrollWidth === 390`.
- El parent monta `createGraphEditor` (`svg#canvas`, viewBox 820×520) en `editorSlot`; el SVG conserva su `preserveAspectRatio` de origen, así que `width/height 100%` no deforma: la carta se ve entera y centrada.
- En angosto la raíz pasa a alto libre con `overflow: hidden`: la página puede crecer en vertical pero nunca en horizontal; el `min-width: 560px` del canvas vive confinado al slot.
- No verificado en navegador real: la luz día/noche y lámparas son CSS/SVG pendientes del asset final (`n3.background.day/night`, `n3.lamp`).

## Cómo integrarlo en `main.js`

```js
import { createLevelScene } from './ui/levels/level3Scene.js';

const museum = createLevelScene({ level: state.level, puzzle: state.puzzle, phase: state.phase });
workbenchView.slots.stage.append(museum.element);
museum.editorSlot.append(canvasDelEditor); // el svg#canvas de createGraphEditor
museum.statusSlot.append(bloqueDeMarcha);  // opcional: marcha de la prueba
```

Cargar `src/ui/levels/level3.css` solo en pantalla de taller del nivel 3.

## Key Learnings

- El `svg#canvas` del editor (viewBox 820×520) se integra con `width: 100%` + `aspect-ratio` y `min-width` con scroll en angosto: la escena enmarca sin tocar el mecanismo.
- El techo de alto (`height/max-height: 100%`, `min-height: 0`, `overflow: hidden`) tiene que estar en cada nivel de la cadena (raíz → sala → placa → slot): un solo `min-height` fijo en píxeles rompe todo el flex y devuelve el scroll de página.
- `width/height: 100%` sobre un SVG con viewBox no deforma (su `preserveAspectRatio` centra la carta), pero sí la achica: el tablero debe escalar por alto (`height: 100%; width: auto; max-width: 100%; margin-inline: auto`) para quedar a ≥ 480×300.
- Los glifos decorativos no pueden comerle 150 px al editor: a ≤900 px salen del flujo (siguen en el DOM y en los tests de texto) y en angosto también se esconden los rótulos de ala.
- En angosto, el `min-width` del canvas solo es seguro si el slot tiene `overflow: auto`: el scroll interno evita el scroll horizontal de página.
- `data-status="a producir"` alinea la escena con el manifiesto y con las unidades N2/N4/N5; `data-todo` se conserva por compatibilidad.
