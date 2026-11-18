# El Cerrajero — Contrato de acabado visual (ola 2)

> Rama `feat/remaster-integration` · Fecha 2026-11-17. Complementa `docs/REMASTER-SCENE-CONTRACT.md`.

## Objetivo

Cerrar la brecha entre la escena ya montada y el mockup: nodos del editor, cables, llavero y botones. Sin tocar lógica, datos, jueces ni `main.js`.

## Unidad A — Nodos y cables

Archivos nuevos:

- `src/ui/graphVisuals.js`
- `src/ui/graphVisuals.css`
- `tests/graphVisuals.test.js`
- `docs/handoffs/graph-visuals.md`

API:

```js
decorateGraph(svg, { level, cells }) => { dispose() }
```

- Recibe el `<svg id="canvas">` ya creado por `createGraphEditor`.
- Para N1, reemplaza visualmente las celdas por las piezas del mockup:
  - inicio → `bocallave-entrada.png`;
  - aceptación → `cilindro-cerradura.png` + `perno.svg`;
  - celdas intermedias → `rueda-engranaje.png`.
- Oculta círculos/etiquetas viejos con una clase en el SVG, sin quitar los grupos interactivos.
- Estiliza los cables como trenzas de color por llave (oro/teal/coral/violeta) con SVG/CSS, sin cambiar el modelo de datos ni los callbacks.
- Para N2–N4, usa un fallback genérico (celda-relé/engranaje) hasta tener assets.
- No edita `graphEditor.js`, `main.js`, `styles.css`, `src/core`, `src/game`, tests existentes, `mockups/` ni git.
- No crea editor, cables, llaves, juicio ni lógica; solo decora el SVG existente.
- 44 px de hit area, foco visible, `prefers-reduced-motion`.

## Unidad B — Llavero y botones

Archivos nuevos:

- `src/ui/gameChrome.css`
- `tests/gameChrome.test.js`
- `docs/handoffs/game-chrome.md`

Tarea CSS-only, alcance `.wb-scene`:

- Llaves del inventario con las imágenes del mockup (`llave-1…4.png`), número visible o banda de color, sin perder `aria-label` ni el botón real.
- Botones Probar/Ensayo/Contrato/Pista/Bitácora con placas de latón, bisel, remaches y estados hover/pressed/focus/disabled como el mockup.
- Herramientas (cortar, resorte) con iconos coherentes.
- No editar `styles.css`, `workbenchScene.css`, `main.js`, `index.html`, tests existentes ni lógica.
- 44 px, foco visible, `prefers-reduced-motion`, sin imágenes externas fuera de `mockups/nivel-1-taller/assets/`.
- Tests estáticos: selectores con alcance, assets existentes, targets ≥44 px, sin resets globales.

## Integración del parent

1. Importar `decorateGraph` y llamarlo después de `createGraphEditor`.
2. Cargar `graphVisuals.css` y `gameChrome.css` en el taller.
3. Verificar N1–N4 en 1440/390 y correr `node --test`.
4. No cambiar reglas, datos, jueces ni callbacks.

## Handoff

Cada worker escribe su handoff con estado, archivos, API, decisiones, tests, supuestos, riesgos e integración. No commitea.
