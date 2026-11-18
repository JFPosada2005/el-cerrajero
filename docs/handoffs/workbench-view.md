# Handoff — vista de la cáscara del taller

- **Estado:** completed.
- **Rama:** `feat/remaster-integration` · **HEAD:** `53339d3`.

## Archivos tocados

- `src/ui/workbenchView.js` (nuevo): `createWorkbenchView(options)` según `docs/REMASTER-INTERFACES.md`.
- `tests/workbenchView.test.js` (nuevo): 15 tests con DOM falso mínimo propio.
- `docs/handoffs/workbench-view.md` (este archivo).

No se tocó nada fuera de la superficie: sin cambios en `styles.css`, `src/main.js`, `index.html`, `src/core`, `src/game`, tests existentes, `mockups/` ni otros documentos. No se corrió git ni se instaló nada.

## API entregada

`createWorkbenchView({ contract, title, client, phase, objective: { rule, intro, note }, logLines, soundEnabled, handlers: { onBack, onProbe, onAssault, onOpenDoc, onToggleSound } })`
devuelve `{ element, slots: { stage, status, inventory, log }, setPhase, setObjective, setSound, addLog, clearLog }`.

- Estructura y clases idénticas al contrato (`workbench`, `workbench-header`, `workbench-layout`, `workbench-objective`, `workbench-stage`, `workbench-log` + `log-list`, `workbench-status`, `workbench-inventory`, `workbench-actions`).
- Entradas de bitácora: `.log-entry` con `data-tone="neutral|good|bad"`; tono inválido cae a `neutral`.
- `slots.log` apunta al contenedor de entradas (`.log-list`); el `aside` conserva `data-slot="log"` según el contrato.
- Datos del nivel solo por `textContent`; el módulo no contiene asignaciones a `innerHTML` (verificado por test estático) y no usa `createElementNS`/SVG.
- Handlers opcionales: sin handlers, los clicks no lanzan. `onOpenDoc` recibe `'contract' | 'hint' | 'log'`.
- `setSound` solo refleja `aria-pressed`; el estado lo guarda el parent. La vista no escucha teclado: sin trampas de foco (solo listeners `click`).

## Decisiones

- **No se crearon `contractCard.js` ni `inventory.js`:** la cáscara es una sola unidad cohesiva y el contrato los marca opcionales. Si el parent prefiere dividir, la API no cambia.
- **`client` se acepta pero no se renderiza:** la estructura del contrato no tiene nodo de cliente (igual que el HUD del mockup, que muestra contrato/título/fase y deja el cliente para el papel del contrato). El parent ya tiene `state.level.client` para el modal.
- **`setObjective` parcial:** actualiza solo las claves presentes; `note` ausente conserva la actual y `note` vacía cae al texto de la alarma (`'Cualquier otra combinación deja la alarma encendida.'`, tomado de `src/main.js`).
- **Botones de acción sin clase propia** salvo `is-primary` en Ensayo, tal como el contrato; el parent puede agregar `is-disabled`.
- **`aria-label` en los 4 botones de acción y los 4 documentales** (los textos cortos como "Probar" o "Sonido" no alcanzan solos con `aria-pressed`).
- **Tests con DOM falso propio** (no el de `graphEditor.test.js`): la vista usa `document.createElement` + `className` + propiedades reales, así que el stub implementa ese subconjunto en vez de `createElementNS`.

## Tests

- `node --test tests/workbenchView.test.js` → **15 pass, 0 fail**.
- `node --test` completo → **284 pass, 0 fail** (269 preexistentes + 15 nuevos).

Cobertura: estructura y slots, callbacks (incluido `onOpenDoc` con sus 3 kinds y ausencia de handlers), `setPhase`, `setObjective`, `setSound`, `addLog`/`clearLog`/tonos, `textContent` con marcas literales (`<img onerror…>` no se parsea), no-`innerHTML`, no editor/cables/llaves (estático + estructural), botones reales sin listeners de teclado.

## Supuestos y riesgos

- El parent monta editor, pila/cinta, llaves y modales en `slots.stage/status/inventory`, y abre los modales de contrato/pista/bitácora desde `onOpenDoc`. Nada de eso existe en esta unidad por diseño.
- `phase` se trata como etiqueta ya traducida (`'Reparación' | 'Construcción'`), igual que `phaseWord()` en `main.js`; la vista no traduce.
- El `client` no renderizado es intencional (ver Decisiones); si diseño quiere mostrarlo en el header, es un cambio al contrato, no a esta unidad.
- No verificado en navegador real (sin CSS del remaster en esta rama): foco visible y targets ≥44px dependen de `styles.css` del agente de diseño.

## Cómo integrarlo en `main.js`

```js
import { createWorkbenchView } from './ui/workbenchView.js';

const view = createWorkbenchView({
  contract: state.level.contract,
  title: state.level.title,
  client: state.level.client,
  phase: phaseWord(),
  objective: { rule: state.puzzle.goal, intro: state.puzzle.intro },
  soundEnabled: false, // o el estado real cuando exista audio.js
  handlers: {
    onBack: renderMap,
    onProbe: handleProbe,
    onAssault: handleAssault,
    onOpenDoc: (kind) => { /* modal existente: kind 'contract' | 'hint' | 'log' */ },
    onToggleSound: () => { /* setSound(view, ...) cuando exista audio.js */ },
  },
});
app.replaceChildren(view.element);
view.slots.stage.append(canvasDelEditor);   // createGraphEditor / drumEditor + tapePanel
view.slots.status.append(bloqueDeEstado);   // pila/cinta/estado
view.slots.inventory.append(herramientas);  // llaves/tijera/resorte
view.addLog(state.puzzle.intro);
```

`setPhase(phaseWord())` se llama al pasar de reparación a construcción; `setObjective` cuando cambie el puzzle; `setSound` cuando el agente de audio entregue el estado.

## Key Learnings

- La estructura del contrato manda sobre los params: `client` no tiene nodo y va al modal del parent, no a la cáscara.
- Un stub mínimo propio (`createElement` + `className`) testea mejor esta vista que reutilizar el falso DOM del editor (`createElementNS`).
- Mencionar `innerHTML` en un comentario rompe un grep literal: la aserción debe buscar `.innerHTML` (uso real), no la palabra.
