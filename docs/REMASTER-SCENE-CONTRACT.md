# El Cerrajero — Contrato de escena del remaster

> **Rama:** `feat/remaster-integration` · **Base visual:** `mockups/nivel-1-taller` @ `153ee7d` · **Fecha:** 2026-11-17.
>
> El objetivo es que el juego se vea como el mockup: mesa de trabajo, fondo, placa, ladrón, papeles, llavero y botones de latón, no paneles oscuros. El editor y la lógica reales se mantienen.

## Reglas

- Un dueño por archivo. El parent es dueño de `src/main.js`, `index.html`, `styles.css`, la integración y los commits.
- No tocar `src/core/*`, `src/game/*`, `tests/*` existentes, `mockups/*` ni git.
- Cada worker crea **solo archivos nuevos** de su unidad y su handoff en `docs/handoffs/`.
- CSS nuevo, con clases propias y alcance limitado; no editar `styles.css`.
- Nada de dependencias, instalaciones ni formatters.
- Placeholders: si un asset no existe, usar CSS/SVG o el asset del mockup; no bloquear.
- 44 px, foco visible, `prefers-reduced-motion`, vocabulario de taller.

## Shell compartido

Archivo: `src/ui/workbenchScene.js` + `src/ui/workbenchScene.css`.

```js
createWorkbenchScene({
  contract, title, client, phase,
  objective: { rule, intro, note },
  soundEnabled = false,
  handlers: { onBack, onProbe, onAssault, onOpenDoc, onToggleSound }
}) => {
  element,
  slots: { stage, status, inventory, actions, objective, log },
  setPhase(phase),
  setObjective({ rule, intro, note }),
  setSound(enabled),
  addLog(text, tone = 'neutral'),
  clearLog()
}
```

- Header con marca, contrato, título, fase, volver y sonido.
- Escenario: contenedor `.wb-stage` donde el parent monta la escena del nivel.
- Ficha de objetivo fija (papel), botones Contrato/Pista/Bitácora.
- Inventario y acciones como slots; el parent monta llaves/herramientas y los botones reales.
- Bitácora: contenedor oculto/visible; el parent agrega entradas.
- Clases nuevas con prefijo `.wb-*`, sin tocar `.workbench*` existente.
- Referencia visual: `mockups/nivel-1-taller/index.html`/`styles.css` (HUD, papeles, inventario, botones).

## Escena por nivel

Cada nivel crea:

```js
createLevelScene({ level, puzzle, phase }) => {
  element,       // .level-scene[data-level="N"]
  editorSlot,    // donde el parent monta #canvas / #drum / #tape-panel
  statusSlot,    // opcional, para pila/cinta/estado
  dispose()
}
```

- El `element` va dentro de `slots.stage` del shell.
- La escena aporta fondo, mesa, placa, props y decoración; **no** crea editor, cables, llaves, juicio ni lógica.
- El editor real se monta en `editorSlot`; la escena debe reservarle el espacio de la placa/tambor.
- CSS propio en `src/ui/levels/levelN.css`, con alcance `.level-scene[data-level="N"]`.
- Assets: N1 puede usar `mockups/nivel-1-taller/assets/sprites/*` como placeholder. N2–N5 usan CSS/SVG o placeholders; los assets finales están en `docs/ASSET-MANIFEST.md`.

### Nivel 1 — Banco del Llano

- Escena del mockup: fondo del banco, mesa de madera, ladrón, placa 900×560, papeles, campana.
- El `editorSlot` va sobre la placa; el `#canvas` real se monta ahí.
- Mantener la ficha de objetivo visible y los botones del shell.
- Usar los sprites del mockup como placeholders.

### Nivel 2 — Hotel Mirador

- Sala de máquinas art déco: níquel/latón, indicador de pisos, relés, piñón de bucle.
- La placa aloja el editor de 2–3 celdas.
- Placeholder CSS/SVG para fondo, piñón e indicador.

### Nivel 3 — Museo del Llano

- Ala de día (cálida) y ala de noche (teal), lámparas, bifurcador en “Y”, resorte.
- La placa aloja el editor de 5–8 celdas.
- Placeholder para fondo/lámparas; glifos SVG para bifurcador y resorte.

### Nivel 4 — Teatro Municipal

- Tramoya: terciopelo granate, latón, columna de contrapesos, selectores.
- La placa aloja el editor; la pila puede ir en `statusSlot`.
- Placeholder para fondo, ficha/base y selectores.

### Nivel 5 — Banco Central

- Sala de recuento: cinta perforada, cabezal, tambor de pines.
- El `editorSlot` aloja el tambor/cinta reales; la escena aporta el marco.
- Mantener la protección de la sección “Listo” (no tocar `drumEditor`).
- Placeholder para cinta/cabezal/tambor; el diseño completo del tambor queda para una unidad posterior.

## Integración del parent

1. Importar `createWorkbenchScene` y `createLevelScene`.
2. Cargar `src/ui/workbenchScene.css` y `src/ui/levels/levelN.css` solo en pantalla de taller.
3. `slots.stage.append(levelScene.element)`.
4. Montar `#canvas`/`#drum`/`#tape-panel` en `levelScene.editorSlot`.
5. Conservar `handleProbe`, `handleAssault`, `handlePinEdit`, `toMachine`, jueces, datos y callbacks.
6. `npm test` y capturas 1440/390.

## Handoff

Cada worker escribe `docs/handoffs/<unidad>.md` con estado, archivos, API, decisiones, tests, supuestos, riesgos y qué debe integrar el parent. No commitea.
