# Handoff — escena del nivel 5 (sala de recuento)

- **Estado:** completed (limpieza de duplicación + ajuste al marco).
- **Rama:** `feat/remaster-integration`.
- **Cubre:** `docs/REMASTER-PLAN.md` §Nivel 5 (Banco Central) y `docs/REMASTER-SCENE-CONTRACT.md` §Nivel 5.

## Qué cambió en esta pasada

- La escena mostraba **dos talleres**: una cinta decorativa de 7 casillas y un
  tambor decorativo de anillos/púas **más** el `#tape-panel` y `#drum` reales
  que el parent monta en `editorSlot`. La página medía ~996 px de alto en
  1440×900 y desbordaba el `wb-stage`.
- Ahora hay **un solo taller**: se quitaron `counting-tape-frame`,
  `counting-drum-frame`, `counting-cabinet`, `tape-mock*` y `drum-mock*`. La
  placa única (`counting-bench-plate`) trae un riel de cabezal decorativo
  (`plate-rail`, sin casillas ni púas, `aria-hidden`) y el `editorSlot` con el
  editor real. El costado conserva la boleta de depósito y el `statusSlot`
  para el contador.
- `src/ui/levels/level5.css` reescrito: la escena ocupa `height: 100%` con
  `max-height: 100%` y `overflow: hidden` (filas `auto minmax(0, 1fr)`), el
  cuerpo es `minmax(0, 1fr) 260px`, y el desborde del tambor vive dentro de
  `.counting-editor` (`overflow: auto`). Integra `#tape-panel`, `#drum`,
  `.drum-section`, `.drum-pin` y `.tape-cell` en la placa (solo presentación;
  el editor no se toca). En móvil (≤900 px) una columna con costado acotado
  al 32 % y desplazamiento interno. Se mantienen 44 px, foco visible y
  `prefers-reduced-motion`.

## Archivos tocados (solo superficie autorizada)

- `src/ui/levels/level5Scene.js` (reescrito): `createLevelScene({ level, puzzle, phase })` → `{ element, editorSlot, statusSlot, setPhase, dispose }`.
- `src/ui/levels/level5.css` (reescrito): alcance `.level-scene[data-level="5"]`.
- `tests/level5Scene.test.js` (ampliado): 12 tests.
- `docs/handoffs/level-5-scene.md` (este archivo).

No se tocó `src/main.js`, `styles.css`, `index.html`, `src/core`, `src/game`, tests existentes, `mockups/` ni git.

## API entregada

```js
import { createLevelScene } from './levels/level5Scene.js';

const scene = createLevelScene({ level: state.level, puzzle: state.puzzle, phase: state.phase });
parentStage.append(scene.element);   // section.level-scene[data-level="5"]
scene.editorSlot.append(tapeRoot, drumRoot); // #tape-panel y #drum reales
scene.statusSlot.append(...);                // lectura del contador si aplica
// En startBuild(): scene.setPhase('build');
```

- `element` va dentro de `slots.stage` del shell; el marco aporta fondo de sala (`n5.background`), riel de cabezal + placa (`n5.tape`, `n5.head`, `n5.drum`, `n5.pin`) y boleta de depósito (`n5.depositSlip`).
- El riel es atmósfera (`aria-hidden`, sin casillas ni púas); el editor real es el único mecanismo visible.
- La boleta muestra `level.client`, `puzzle.goal` y la primera corrida (`La cinta 1 debe dejar 10.`), todo por `textContent`.
- La escena no importa ni crea editores, no toca la protección de la sección "Listo" y no contiene juicio ni lógica.

## Decisiones

- **`statusSlot` incluido** aunque el contrato lo marca opcional: la sala necesita dónde apoye el contador sin tocar la cinta.
- **`setPhase` extra** (no pedido por el contrato): traduce `repair`/`build`; acepta la palabra ya traducida del parent.
- **Sin `createElementNS`/SVG propio**: placeholders con DOM+CSS.
- **Estilos del editor real con alcance**: `#tape-panel .tape-cell`, `#drum .drum-pin`, etc. bajo `.level-scene[data-level="5"]`; solo color, borde y tamaño mínimo (44 px); la púa final (`is-final`) queda atenuada con `not-allowed` sin cambiar su `disabled` del editor.
- **Vocabulario de taller**: cinta, cabezal, tambor, púa, anillo, boleta, contador, caja, cerrojo, alarma. Sin "estado/transición/lenguaje/autómata".
- Comentarios evitan los literales `drumEditor`/`tapePanel` para no romper el test estático.

## Tests

- `node --test tests/level5Scene.test.js` → **12 pass, 0 fail**.
- `node --test` completo → ver `validation` del handoff del parent (la suite crece con estos 12).

Cobertura: raíz/data-level, editorSlot vacío, statusSlot, no-editor (estático + estructural), **marco sin duplicados** (`tape-mock*`/`drum-mock*` ausentes, riel sin casillas ni púas), placa con `editorSlot` dentro y `data-asset` con `n5.tape/head/drum/pin`, placeholders `a producir`, aria/decoración, vocabulario, setPhase/dispose, textContent con marcas literales, CSS (alcance, 44 px, foco, reduced-motion, sin `url(`, integración `#tape-panel/#drum/.drum-* /.tape-cell`, límite `max-height: 100%` + `overflow`).

## Supuestos y riesgos

- El parent monta `#tape-panel` y `#drum` reales en `editorSlot` y conserva `handleProbe`, `handleAssault`, `handlePinEdit`, `toMachine`, jueces y callbacks (verificado por lectura de `src/main.js`; sin cambios).
- Sin verificación en navegador real: el ajuste a 1440×900 y 390×844 depende del CSS aquí entregado (`wb-stage` ≈ 545 px a 1440×900 por `clamp(380px, calc(100vh - 355px), 580px)`); el ticket de integración deberá tomar capturas 1440/390 y confirmar que no hay scroll de página.
- `phase` se trata como etiqueta (`repair`/`build` o ya traducida), igual que `phaseWord()` en `main.js`.
- Los 6 slots de assets siguen `a producir` en atributos `data-asset`/`data-status`; la escena no se bloquea sin ellos.

## Cómo integrarlo en `main.js` (parent)

Sin cambios respecto a la pasada anterior:

```js
import { createLevelScene } from './ui/levels/level5Scene.js';

const scene = createLevelScene({ level: state.level, puzzle: state.puzzle, phase: state.phase });
workbench.slots.stage.append(scene.element); // o el contenedor que el parent use
scene.editorSlot.append(tapeRoot, drumRoot); // #tape-panel y #drum reales
scene.statusSlot.append(...);                // lectura del contador si aplica
// En startBuild(): scene.setPhase('build');
```

Cargar `src/ui/levels/level5.css` solo en pantalla de taller.

## Key Learnings

1. La escena del N5 duplicaba el mecanismo: una cinta y un tambor decorativos junto al editor real hacían ver dos talleres y desbordaban el `wb-stage` (~996 px de página en 1440×900).
2. El riel del cabezal puede quedarse como atmósfera sin casillas ni púas: marca el lugar del mecanismo real sin competir con él y conserva los `data-asset` de producción.
3. Limitar la escena a `height: 100% / max-height: 100% / overflow: hidden` con filas `auto minmax(0, 1fr)` y dar `overflow: auto` al marco del editor contiene el tambor sin scroll de página.
4. Estilar `#tape-panel`, `#drum`, `.drum-section`, `.drum-pin` y `.tape-cell` con alcance `.level-scene[data-level="5"]` integra el editor en la placa sin tocar su lógica ni la protección de "Listo".
5. Nombrar un módulo prohibido en un comentario rompe el test estático que lo veta: la escena alude a "los editores del taller" sin escribir sus identificadores.
