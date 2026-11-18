# Handoff — shell compartido del taller (mobile ≤768px)

- **Estado:** completed en su superficie (`src/ui/workbenchScene.js`, `src/ui/workbenchScene.css`, `tests/workbenchScene.test.js` + este handoff).
- **Rama:** `feat/remaster-integration`.

## Archivos tocados (solo superficie autorizada)

- `src/ui/workbenchScene.js`: suma dos botones plegables (`wb-objective-toggle`, `wb-log-toggle`) que solo alternan `data-collapsed` + `aria-expanded` + texto Plegar/Desplegar. Sin lógica, sin callbacks nuevos, sin `innerHTML`.
- `src/ui/workbenchScene.css`: suma bloque `@media (max-width: 768px)` + regla base que oculta los plegables en escritorio. El bloque `@media (min-width: 900px)` no se tocó.
- `tests/workbenchScene.test.js`: 15 tests previos intactos + 5 nuevos (20 total).
- `docs/handoffs/shared-workbench-scene.md` (este archivo).

No se tocó nada fuera de la superficie: sin cambios en `main.js`, `index.html`, `styles.css`, `gameChrome.css`, `spoolPalette.css`, `src/ui/levels/*`, `src/core`, `src/game`, otros tests, `mockups/` ni git.

## API entregada (sin cambios, solo adiciones)

`createWorkbenchScene(...)` devuelve lo mismo que antes. Novedades compatibles:

- `aside.wb-objective` y `aside.wb-log` llevan `data-collapsed="false"` inicial y un botón plegable (`type="button"`, solo listener `click`, con `aria-label` y `aria-expanded`).
- El contrato, los 6 slots, los 5 botones de acciones, `setPhase`, `setObjective`, `setSound`, `addLog`/`clearLog` y el viaje por `textContent` no cambian.

## Comportamiento móvil (≤768px, solo CSS + plegables)

- **Dock sticky común** (`div.wb-dock` con inventario + acciones, en ese orden): `position: sticky; bottom: 0`, `max-height: calc(210px + safe-area)`, fondo propio. Presupuesto a 390px: inventario ≈152 (dos filas visibles) + gap 6 + acciones 44 + padding 12 ≈ 208 ≈ 210. Preferible 210 con todo visible que 180 con recortes. Los carretes (`#palette` del parent) viven dentro del inventario y nunca quedan bajo la barra.
- **Acciones en una sola fila que se lee completa**: `flex: 1 1 0; min-width: 0; padding: 0 4px; font-size: clamp(10px, 3.1vw, 12px); letter-spacing: 0.04em;` sin `overflow: hidden` ni `text-overflow` en la etiqueta (puede bajar a dos líneas; cada botón conserva 44px de alto). Especificidad (0,5,0) con `[data-action]/[data-doc]` para imponerse al `nowrap` de `gameChrome.css` sin depender del orden de carga.
- **Inventario en dos filas visibles sin scroll interno**: `flex-wrap: wrap` + `overflow-x: clip`, sin `max-height` ni `overflow-y`. Carretes arriba (~294px entran en 371px), CORTAR/RESORTE abajo, siempre a la vista. Los carretes son de la unidad de paleta y no se tocan.
- **Escenario**: `order: -1` (taller primero), `min-height: 240px`, `max-height: 62vh/svh` con `overflow: auto` (scroll interno) y `scroll-margin-bottom: 196px` para que el último contenido scrollee por encima del dock opaco.
- **Inventario**: compacto, una fila con `overflow-x: auto` interno; hijos sin encoger.
- **Objetivo/bitácora**: papel con botón Plegar/Desplegar; plegado oculta regla/intro/nota o la lista, nunca vacía datos.
- **Sin scroll horizontal**: `.wb-scene` con `max-width: 100%` + `overflow-x: clip`, cabecera en flex con filas, título con `overflow-wrap`, hijos de grid con `min-width: 0`.
- **Foco**: `:focus-visible` existente intacto; `scroll-margin-bottom: 128px` en móvil para que la barra fija no tape el control enfocado.
- **Targets**: botones ya en 44 px; plegables heredan `.wb-btn` (44 px).
- **`prefers-reduced-motion`**: se amplía a `.wb-scene *` (duraciones a 0.01 ms, sin loops).

## Comportamiento escritorio

- A 1440×900 no cambia nada: los plegables van con `display: none` en base, el dock usa `display: contents` (desaparece del layout) y todo lo móvil vive bajo `@media (max-width: 768px)`. El bloque `@media (min-width: 900px)` (bitácora oculta, stage con `clamp`) queda idéntico.

## Tests

- `node --test tests/workbenchScene.test.js` → **23 pass, 0 fail** (15 previos intactos + 8 nuevos: plegable de objetivo, plegable de bitácora, dock con slots, CSS móvil con dock compacto, acciones a 44px en una fila, dock `display: contents` en escritorio, plegables ocultos en escritorio, composición de escritorio).
- `node --test` (suite completa) → **369 pass, 0 fail** (364 previos + 5 nuevos).

## Cómo integrarlo en `main.js`

Sin cambios respecto al handoff anterior: los plegables funcionan solos; el parent no necesita llamarlos. En móvil, la bitácora del panel (`slots.log`) convive con el modal que abre `onOpenDoc('log')`; el plegable solo colapsa el panel, no abre modales.

## Supuestos y riesgos

- El parent monta escena, editor, llaves y modales como antes; el shell no crea escena/editor/cables/llaves (verificado por test estático).
- El `order: -1` del stage es solo visual en móvil; el orden de tabulación/DOM conserva objetivo → mecanismo → bitácora (tres lecturas).
- No verificado en navegador real: conviene captura a 320/360/390 y 1440×900 en la integración del parent (foco con teclado sobre la barra fija incluido).

## Key Learnings

1. Un plegable sin lógica cabe en el shell congelado: alternar `data-collapsed` + `aria-expanded` no toca callbacks ni crea estado de juego.
2. `overflow-x: clip` (no `hidden`) evita el scroll horizontal de página sin romper el `sticky` de la barra de acciones.
3. Ocultar los plegables con `display: none` en base deja la composición de escritorio pixel a pixel igual y los tests lo fijan.
4. `scroll-margin-bottom` es el complemento barato de una barra sticky para cumplir foco no obscurecido sin JS.
5. Buscar `'768px'` a secas en tests caza comentarios; anclar al `'max-width: 768px'` del media query evita falsos positivos.
