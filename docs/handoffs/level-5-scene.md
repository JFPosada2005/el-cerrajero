# Handoff — escena del nivel 5 (sala de recuento)

- **Estado:** completed.
- **Rama:** `feat/remaster-integration`.
- **Cubre:** `docs/REMASTER-PLAN.md` §Nivel 5 (Banco Central) y `docs/REMASTER-SCENE-CONTRACT.md` §Nivel 5.

## Archivos tocados (solo superficie autorizada)

- `src/ui/levels/level5Scene.js` (nuevo): `createLevelScene({ level, puzzle, phase })` → `{ element, editorSlot, statusSlot, setPhase, dispose }`.
- `src/ui/levels/level5.css` (nuevo): alcance `.level-scene[data-level="5"]`.
- `tests/level5Scene.test.js` (nuevo): 9 tests con DOM falso mínimo propio.
- `docs/handoffs/level-5-scene.md` (este archivo).

No se tocó `src/main.js`, `styles.css`, `index.html`, `src/core`, `src/game`, tests existentes, `mockups/` ni git.

## API entregada

```js
import { createLevelScene } from './levels/level5Scene.js';

const scene = createLevelScene({ level, puzzle, phase: 'repair' });
parentStage.append(scene.element);   // section.level-scene[data-level="5"]
scene.editorSlot;                    // div[data-slot="editor"] — el parent monta #tape-panel y #drum reales
scene.statusSlot;                    // div[data-slot="status"] — contador del mecanismo
scene.setPhase('build');             // 'repair'→'Reparación', 'build'→'Construcción'
scene.dispose();                     // retira la escena
```

- `element` va dentro de `slots.stage` del shell; el marco aporta fondo de sala (`n5.background`), mesa, marco de cinta con cabezal (`n5.tape`, `n5.head`), marco de tambor (`n5.drum`, `n5.pin`) y boleta de depósito (`n5.depositSlip`).
- La maqueta de cinta (7 casillas, cabezal al centro) y los anillos del tambor son decorativos (`aria-hidden`); los anillos se derivan de `puzzle.sections` solo como conteo visual, sin púas ni botones.
- La boleta muestra `level.client`, `puzzle.goal` y la primera corrida (`La cinta 1 debe dejar 10.`), todo por `textContent`.
- La escena no importa ni crea editores, no toca la protección de la sección "Listo" y no contiene juicio ni lógica.

## Decisiones

- **`statusSlot` incluido** aunque el contrato lo marca opcional: la sala necesita dónde apoye el contador sin tocar la cinta.
- **`setPhase` extra** (no pedido por el contrato): traduce `repair`/`build`; acepta la palabra ya traducida del parent.
- **Sin `createElementNS`/SVG propio**: placeholders con DOM+CSS; los SVG decorativos de terminales usan gradiente inline del mockup si el parent los quiere, aquí son `div`.
- **Vocabulario de taller**: cinta, cabezal, tambor, púa, anillo, boleta, contador, caja, cerrojo, alarma. Sin "estado/transición/lenguaje/autómata".
- Comentarios evitan los literales `drumEditor`/`tapePanel` para no romper el test estático (misma lección que el handoff de la cáscara con `innerHTML`).

## Tests

- `node --test tests/level5Scene.test.js` → **9 pass, 0 fail**.
- `node --test` completo → **293 pass, 0 fail** (284 preexistentes + 9 nuevos).

Cobertura: raíz/data-level, editorSlot vacío, statusSlot, no-editor (estático + estructural), placeholders `a producir` con slots `n5.*`, aria/decoración, vocabulario, setPhase/dispose, textContent con marcas literales, CSS (alcance, 44 px, foco, reduced-motion, sin `url(`).

## Supuestos y riesgos

- El parent monta `#tape-panel` y `#drum` reales en `editorSlot` y conserva `handleProbe`, `handleAssault`, `handlePinEdit`, `toMachine`, jueces y callbacks (verificado por lectura de `src/main.js`; sin cambios).
- Sin verificación en navegador real: foco visible y 44 px dependen del CSS aquí entregado; el ticket de integración deberá cargar `level5.css` solo en pantalla de taller y tomar capturas 1440/390.
- `phase` se trata como etiqueta (`repair`/`build` o ya traducida), igual que `phaseWord()` en `main.js`.
- Los 6 slots de assets siguen `a producir`; la escena no se bloquea sin ellos.

## Cómo integrarlo en `main.js` (parent)

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

1. Nombrar un módulo prohibido en un comentario rompe el test estático que lo veta: la escena debe aludir a "los editores del taller" sin escribir sus identificadores.
2. Los anillos decorativos pueden derivarse de `puzzle.sections` como conteo visual sin crear lógica, siempre que no generen botones ni púas.
3. La boleta de depósito es el lugar natural de la muestra `input → output` del nivel 5, por `textContent` y sin tocar Probar/Ensayo.
4. Un `statusSlot` con nombre de taller ("Contador del mecanismo") evita la palabra congelada "estado" y cubre la ranura opcional del contrato.
5. El aviso "a producir" vive mejor en atributos `data-asset`/`data-status` que en texto visible: se testea sin manchar la lectura del taller.
