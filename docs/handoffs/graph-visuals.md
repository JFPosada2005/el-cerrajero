# Handoff — nodos y cables del taller (unidad A)

- **Estado:** completed.
- **Rama:** `feat/remaster-integration`.

## Archivos tocados

- `src/ui/graphVisuals.js` (nuevo): `decorateGraph(svg, { level, cells }) => { dispose() }`.
- `src/ui/graphVisuals.css` (nuevo): todo bajo `#canvas.gv-decorated`.
- `tests/graphVisuals.test.js` (nuevo): 11 tests con DOM falso mínimo propio.
- `docs/handoffs/graph-visuals.md` (este archivo).

No se tocó nada fuera de la superficie: sin cambios en `graphEditor.js`, `main.js`, `styles.css`, `index.html`, `src/core`, `src/game`, tests existentes, `mockups/` ni git.

## API entregada

```js
import { decorateGraph } from './ui/graphVisuals.js';

const view = decorateGraph(svg, { level: state.level, cells: state.puzzle.cells });
// …al desmontar el taller:
view.dispose();
```

- `svg`: el `<svg id="canvas">` ya creado por el editor real. Se le suma la clase `gv-decorated` + `gv-level-<id>`; los círculos/etiquetas viejos se ocultan por CSS sin quitar grupos, hit areas ni listeners.
- `level` (`{ id, keys }`): `id === 1` usa las piezas del mockup; otro id usa el fallback genérico. `keys` (símbolos u objetos `{ symbol }`) ordena los tonos oro → teal → coral → violeta.
- `cells`: aceptado por contrato y reservado para localizar celdas sin `transform`; hoy las coordenadas salen del `transform` real del grupo.
- N1 por rol: inicio → `bocallave-entrada.png`; cerrojo → `cilindro-cerradura.png` + `perno.svg` (el perno cede con `is-lit`); intermedias → `rueda-engranaje.png`. Todo como `<image>` **dentro** de cada `g.state`, con `aria-hidden` y `pointer-events: none`.
- N2–N4: todas las celdas con `rueda-engranaje.png` (placeholder celda-relé/engranaje) hasta tener assets finales.
- Cables: cada `g.wire` suma `gv-key-gold|teal|coral|violet` según la primera llave de su rótulo, o `gv-spring` si el trazo es resorte. No se toca el modelo (`blueprint` intacto) ni los callbacks.
- `dispose()`: retira imágenes, clases y el observador; restaura las clases originales de cables y SVG.
- El editor re-renderiza con `replaceChildren` en cada clic: un `MutationObserver` (`childList` del svg, sin `subtree` para no re-dispararse con los retoques propios) reaplica la decoración. Sin observador (tests) la pasada simple queda intacta.

## Decisiones

- **Imágenes dentro del grupo, no en capa encima:** el clic y el foco viven en el `g.state`; al meter el sprite adentro, la pieza y su hit area se mueven juntos y no hay nada que re-sincronizar. La capa encima habría exigido `pointer-events: none` global y recalcular posiciones.
- **Círculo invisible en vez de eliminado:** `.state-body` (r=44) pasa a `fill: transparent; stroke: none` —sigue recibiendo puntero y teclado— mientras anillo y etiquetas se apagan con `display: none`. Así se cumple “ocultar sin quitar hit areas ni listeners” y los 44 px (88 px de diámetro real).
- **Tono por primera llave:** un cable agrupa varias llaves (`1,2`) y el CSS tiñe un solo trazo; la primera del rótulo manda. Los resortes con pila (`base · =`) se detectan por `is-spring`, no por texto, para no confundir “base” con una llave.
- **Sin `xlink:href`:** solo `href` SVG2, suficiente para los navegadores objetivo y testeable en el DOM falso.
- **Tijera con blanco de 44 px** (`.edge-hit` de 18 a 44) solo en `is-cutting`, que es cuando el cable trae `tabindex`: fuera de ese modo no intercepta clics de celdas. `is-lit` sigue teal con glow e `is-cutting:hover` sigue coral —las reglas de tono llevan `:not()` para no pisarlos—.

## Tests

- `node --test tests/graphVisuals.test.js` → **11 pass, 0 fail**.
- `node --test` completo → **364 pass, 0 fail** (353 base en el árbol + 11 nuevos).

Cobertura: API/`dispose` sin grupos nuevos, sprites N1 por rol con archivos existentes en el mockup, grupos interactivos intactos (rol/tabindex/transform/listeners/hijos), trenzas por llave (oro/teal/coral/violeta) con modelo y celdas sin cambios, resorte sin tono, fallback N2 con placeholder, `dispose` que restaura, estático sin lógica (sin editor/juicio/máquinas/`innerHTML`, con `MutationObserver`) y CSS (alcance, 4 trenzas, foco, 44 px, movimiento reducido, sin resets).

## Supuestos y riesgos

- El parent importa `decorateGraph`, lo llama después del editor real y carga `graphVisuals.css` solo en pantalla de taller; en `dispose` del taller llama `view.dispose()`.
- No verificado en navegador real: el encaje sprite ↔ celda (tamaños 104–124 px sobre r=44) y el perno deslizante dependen de captura a 1440/390 del parent.
- Si un sprite final llega (`assets/levels/*` + `manifest.json`), se cambia la ruta en `SPRITES`/`N1_ASSETS` sin tocar la API; un sprite faltante no bloquea (el círculo invisible sigue recibiendo clics).
- La decoración no sigue cambios de `level.keys` en caliente: si el parent cambia llaves sin recrear el taller, los tonos son los del montaje.

## Cómo integrarlo en `main.js`

```js
import { decorateGraph } from './ui/graphVisuals.js';

let graphVisuals = null;
// después de createGraphEditor:
graphVisuals = decorateGraph(canvas, { level: state.level, cells: state.puzzle.cells });
// al desmontar / antes de renderSceneWorkshop:
graphVisuals?.dispose();
graphVisuals = null;
```

Y en el HTML del taller, junto a los demás CSS de escena:

```html
<link rel="stylesheet" href="src/ui/graphVisuals.css">
```

## Key Learnings

- Decorar **dentro** del grupo interactivo evita sincronizar capas: la pieza hereda posición, clic y foco sin costo.
- Un círculo con `fill: transparent` sigue siendo hit area; con `display: none` o `fill: none` se pierde: ocultar no es lo mismo que apagar el puntero.
- El editor re-renderiza todo el SVG por clic, así que cualquier decoración necesita reaplicación (observador) o muere al primer cable.
