# Handoff — shell compartido del taller

- **Estado:** completed en su superficie; suite completa con 6 fallos ajenos (ver §Riesgos).
- **Rama:** `feat/remaster-integration`.

## Archivos tocados (solo superficie autorizada)

- `src/ui/workbenchScene.js` (nuevo): `createWorkbenchScene(options)` según `docs/REMASTER-SCENE-CONTRACT.md`.
- `src/ui/workbenchScene.css` (nuevo): estilos con alcance propio `.wb-*`, sin tocar `styles.css`.
- `tests/workbenchScene.test.js` (nuevo): 15 tests con DOM falso mínimo propio.
- `docs/handoffs/shared-workbench-scene.md` (este archivo).

No se tocó nada fuera de la superficie: sin cambios en `src/main.js`, `styles.css`, `index.html`, `src/core`, `src/game`, tests existentes, `mockups/`, `workbenchView.js` ni git.

## API entregada

`createWorkbenchScene({ contract, title, client, phase, objective: { rule, intro, note }, soundEnabled, handlers: { onBack, onProbe, onAssault, onOpenDoc, onToggleSound } })`
devuelve `{ element, slots: { stage, status, inventory, actions, objective, log }, setPhase, setObjective, setSound, addLog, clearLog }`.

- Estructura: `section.wb-scene` → `header.wb-header` (marca, contrato, título `h1`, fase, Volver, Sonido) + `div.wb-body` (`aside.wb-objective` papel fijo con regla/intro/nota + botón Abrir contrato; `section.wb-stage` vacía para la escena del nivel; `aside.wb-log` oculto con `div.wb-log-list`) + `div.wb-status` (`role=status`, `aria-live=polite`) + `footer.wb-inventory` vacío + `div.wb-actions` (Probar, Ensayo primario, Contrato, Pista, Bitácora).
- `slots.log` apunta a la lista de entradas (`.wb-log-list`); el `aside` conserva `data-slot="log"`, igual que `workbenchView`.
- Bitácora oculta al inicio; `addLog` la muestra, `clearLog` la vuelve a ocultar. Los botones documentales solo llaman a `onOpenDoc(kind)`; el parent abre los modales y puede alternar el panel vía `slots`.
- Entradas: `p.wb-log-entry` con `data-tone="neutral|good|bad"`; tono inválido cae a `neutral`. Buena/mala se distinguen también por marca (`✓`/`!` vs `·`) y peso, no solo por color.
- Datos del nivel solo por `textContent`; sin `createElementNS`/SVG, sin canvas.
- Handlers opcionales: sin handlers, los clicks no lanzan. `setSound` solo refleja `aria-pressed`.
- `client` se acepta pero no se renderiza (queda para el modal del parent, igual que `workbenchView`).
- `setObjective` parcial; `note` ausente conserva la actual y `note` vacía cae al texto de la alarma (`'Cualquier otra combinación deja la alarma encendida.'`).

## Decisiones

- **Sin `logLines` iniciales:** el contrato de esta unidad no las incluye (la bitácora empieza oculta y el parent agrega con `addLog`). Diferencia intencional respecto de `workbenchView`.
- **`slots.actions` trae los botones base** (Probar/Ensayo + 3 documentales) y el parent puede montar extras encima; `onProbe`/`onAssault` se usan en esos botones.
- **CSS con `@font-face` propio** hacia `assets/fonts/` (Cinzel/Oswald/Special Elite, ya presentes en el repo); resto todo bajo `.wb-scene`, sin resets globales ni `html/body`.
- Botones `min-height/min-width: 44px`, `font-size ≥ 12px` (verificado por test estático), `:focus-visible` teal, `prefers-reduced-motion` sin transiciones, layout a una columna bajo 1100 px.

## Tests

- `node --test tests/workbenchScene.test.js` → **15 pass, 0 fail**.
- Estructura/header, ficha de objetivo, nota por defecto, 6 slots, acciones + documentales, callbacks (incluidos los 3 kinds y ausencia de handlers), `setPhase`, `setObjective`, `setSound`, `addLog`/`clearLog`/tonos/mostrar-ocultar, `textContent` literal, no-escena/editor/cables/llaves (estático + estructural), botones sin listeners de teclado, CSS (alcance, foco, reduced-motion, 44 px, sin resets, fuentes ≥12 px).

## Cómo integrarlo en `main.js`

```js
import { createWorkbenchScene } from './ui/workbenchScene.js';

const scene = createWorkbenchScene({
  contract: state.level.contract,
  title: state.level.title,
  client: state.level.client,
  phase: phaseWord(),
  objective: { rule: state.puzzle.goal, intro: state.puzzle.intro },
  soundEnabled: false,
  handlers: {
    onBack: renderMap,
    onProbe: handleProbe,
    onAssault: handleAssault,
    onOpenDoc: (kind) => { /* modal existente: 'contract' | 'hint' | 'log' */ },
    onToggleSound: () => { /* setSound(scene, ...) cuando haya audio */ },
  },
});
app.replaceChildren(scene.element);
scene.slots.stage.append(levelScene.element); // escena del nivel
scene.slots.inventory.append(herramientas);   // llaves/herramientas
scene.addLog(state.puzzle.intro);
```

Cargar `src/ui/workbenchScene.css` solo en pantalla de taller. `setPhase(phaseWord())` al pasar a construcción.

## Supuestos y riesgos

- `phase` llega ya traducida (`'Reparación' | 'Construcción'`); el shell no traduce.
- El parent monta escena de nivel, editor, pila/cinta, llaves y modales en los slots; nada de eso existe aquí por diseño.
- **Suite completa: 327 pass / 6 fail.** Los 6 fallos están en `tests/level2Scene.test.js` (1), `tests/level3Scene.test.js` (3) y `tests/level4Scene.test.js` (2): archivos **untracked de unidades concurrentes** (`src/ui/levels/` + esos tests aparecieron en el árbol durante esta tarea, fuera de mi superficie). Mis 15 tests y todos los preexistentes pasan; no toqué esos archivos.
- No verificado en navegador real: el CSS es nuevo y conviene captura a 360/1440 en la integración del parent.

## Key Learnings

1. El contrato manda la forma exacta: `slots` lleva 6 entradas (`stage, status, inventory, actions, objective, log`) y `log` apunta a la lista interna, no al `aside`.
2. `addLog`/`clearLog` pueden gobernar la visibilidad del panel sin romper el contrato: mostrar con contenido y ocultar al vaciar es el comportamiento que el parent espera de "contenedor oculto/visible".
3. Un stub de DOM propio (`createElement` + `className` + `hidden`) alcanza para testear el shell sin `createElementNS` ni SVG, igual que en `workbenchView`.
4. Declarar `@font-face` en el CSS del shell no es un reset global: reutiliza las fuentes ya vendorizadas en `assets/fonts/` sin tocar `styles.css`.
5. En ramas con workers concurrentes, `git status --short` delimita la responsabilidad: los 6 fallos de la suite viven en archivos untracked ajenos a esta superficie.
