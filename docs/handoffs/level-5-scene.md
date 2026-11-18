# Handoff — escena del nivel 5 (sala de recuento)

- **Estado:** completed (defectos de navegador real corregidos).
- **Rama:** `feat/remaster-integration`.
- **Cubre:** `docs/REMASTER-PLAN.md` §Nivel 5 (Banco Central) y `docs/REMASTER-SCENE-CONTRACT.md` §Nivel 5.

## Qué cambió en esta pasada (defectos vistos a 1440×900)

1. **Boleta con scroll horizontal:** el papel rotado (`rotate(-0.4deg`, el
   mismo desvío M11 del mockup) desbordaba la columna de ~250 px y abría
   una barra horizontal. Se quitó la rotación; la boleta suma
   `min-width: 0; max-width: 100%`, el cliente parte palabras largas
   (`overflow-wrap`) y la columna fija `overflow-x: hidden` con
   `overflow-y: auto` (el eje vertical sigue con scroll interno).
2. **Cuño sobre el título:** el sello absoluto arriba a la derecha tapaba
   "BOLETA DE DEPÓSITO". Ahora vive en flujo entre la nota y el pie
   (`inline-block`, sin `position: absolute`), así no puede superponerse a
   ningún texto; el lacre absoluto abajo a la derecha se mantiene y el pie
   lo salva con su `padding-right`.
3. **Tambor cortado:** cromo compacto para el stage de ~690 px del parent
   (riel 38 px, leyenda 6 px, `plate-top` con wrap y sin eventos) y tambor
   compacto (gaps 6 px, cabecera de sección en una línea, título/marca a
   12 px, contenido de púa a 12 px, sección con padding propio): tres
   secciones entran en ~460 px de editor; `overflow: auto` queda como red
   de seguridad.
4. **Leyenda en personaje:** "El tambor y la cinta del taller trabajan
   sobre esta placa" (nota de producción) → "La cinta corre y el tambor
   lleva la cuenta de la caja 05."

## Qué cambió en esta pasada

- La escena ya mostraba **un solo taller** (limpieza previa: sin
  `counting-tape-frame`, `drum-mock*` ni `tape-mock*`); pero seguía oscura
  y plana. Esta pasada la acerca al mockup (`nivel-1-taller` @ `153ee7d`):
  precisión noir, sala cálida, latón/madera/papel, sin assets finales.
- **Luz cálida:** capa `.counting-light` (`aria-hidden`) con brillo de
  lámpara arriba a la izquierda, filo teal a la derecha y viñeta; el fondo
  suma paneles verticales tenues sobre base cálida.
- **Mesa de nogal:** vetas y juntas de tablones en CSS, filo superior de
  latón y sombra de apoyo.
- **Placa de latón:** marco con remaches en las 4 esquinas (`plate-rivets`,
  `aria-hidden`), rótulo grabado (`plate-top`: "Banco Central · Caja 05" /
  "N.º 0501") y riel de cabezal como carcasa de latón con **cinta
  perforada decorativa** (14 orificios `rail-hole`, sin casillas ni
  símbolos) y ventana del cabezal con filo teal (`plate-rail-notch`).
- **Boleta de depósito** como papel ivory del mockup: degradados de papel,
  renglones, marco interior, pie de caja ("Caja 05 · N.º 0501"), **lacre**
  (`slip-seal`, `aria-hidden`) y **cuño de fase** (`slip-stamp`,
  `aria-hidden`, sigue a `setPhase`: "En reparación" / "En construcción").
- **Editor real integrado:** las casillas de la cinta son tarjetas de
  papel perforado (cabezal real con anillo teal); las secciones del tambor
  son aros oscuros con filo de latón y las púas, teclas de latón (la púa
  final sigue atenuada con `not-allowed`, sin tocar su `disabled`).
- Tipografías del mockup por variable con fallback local
  (`--font-display`/`--font-ui`/`--font-paper`, sin requests externos);
  ningún texto bajo 12 px (test que lo fija).
- Se mantienen: un solo taller, `height: 100%` / `max-height: 100%` /
  `overflow: hidden` sin scroll de página (el editor scrollea dentro de
  `.counting-editor`), 44 px, foco visible y `prefers-reduced-motion`.

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
- `tests/level5Scene.test.js` (ampliado): 19 tests.
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

- `node --test tests/level5Scene.test.js` → **19 pass, 0 fail**.
- `node --test` completo → **417 pass, 0 fail**.

Cobertura nueva de esta pasada: boleta sin `overflow-x` (columna recorta
x, conserva scroll vertical; papel sin rotación y acotado a su columna),
cuño en flujo antes del pie (sin `position: absolute` en ningún bloque
`.slip-stamp`), marco del editor para ~460 px (scroll interno conservado,
riel ≤ 40 px, leyenda ≤ 8 px) y leyenda en personaje (nombra la cinta, sin
la nota de producción).

Cobertura: raíz/data-level, editorSlot vacío, statusSlot, no-editor (estático + estructural), **marco sin duplicados** (`tape-mock*`/`drum-mock*` ausentes, riel sin casillas ni púas), placa con `editorSlot` dentro y `data-asset` con `n5.tape/head/drum/pin`, placeholders `a producir`, aria/decoración, vocabulario, setPhase/dispose, textContent con marcas literales, CSS (alcance, 44 px, foco, reduced-motion, sin `url(`, integración `#tape-panel/#drum/.drum-* /.tape-cell`, límite `max-height: 100%` + `overflow`), **atmósfera** (luz, rótulo, remaches, perforación), **boleta** (lacre, cuño que sigue a la fase, pie) y **piso de 12 px**.

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
2. El riel del cabezal puede quedarse como atmósfera con cinta perforada decorativa (orificios sin casillas ni símbolos): marca el lugar del mecanismo real sin competir con él y conserva los `data-asset` de producción.
3. Limitar la escena a `height: 100% / max-height: 100% / overflow: hidden` con filas `auto minmax(0, 1fr)` y dar `overflow: auto` al marco del editor contiene el tambor sin scroll de página.
4. Estilar `#tape-panel`, `#drum`, `.drum-section`, `.drum-pin` y `.tape-cell` con alcance `.level-scene[data-level="5"]` integra el editor en la placa sin tocar su lógica ni la protección de "Listo".
5. Nombrar un módulo prohibido en un comentario rompe el test estático que lo veta: la escena alude a "los editores del taller" sin escribir sus identificadores.
6. El mockup se evoca sin sus assets: luz cálida + filo teal, remaches y rótulo grabado en la placa, y boleta ivory con lacre y cuño alcanzan para la sala de recuento; todo con CSS y variables de fuente con fallback local.
7. Fijar el piso tipográfico en 12 px con un test evita que el grabado de la placa y el cuño de la boleta repitan el desvío M4 del mockup (textos de 7–10 px).
8. El papel rotado dentro de un contenedor con scroll repite el desvío M11 del mockup: la rotación de 0,4° bastó para abrir scroll horizontal en la columna de 250 px; la boleta va sin rotar y la columna recorta el eje x.
9. Un sello absoluto siempre puede caer sobre el título con otro contenido: en flujo (entre nota y pie) el cuño nunca se superpone, y el orden en el DOM lo fija un test.
10. El alto del editor se diseña por presupuesto: cromo compacto (riel 38 px, leyenda 6 px) + tambor compacto (gaps 6 px, cabeceras de una línea) para que tres secciones entren en ~460 px; el `overflow: auto` queda como red, no como estado visible.
