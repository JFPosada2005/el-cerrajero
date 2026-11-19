# Tijera única + aire en N3 + orden Probar→Ensayo + fondo/lámpara por fase

## Contexto

Encargo del owner (4 puntos, capa visual; lógica congelada). El orquestador
dejó empezado: `src/ui/scissorsProp.js` + `src/ui/scissorsProp.css` (fábrica
`createScissorsProp`, asset N1 `assets/levels/01/props/scissors.webp`, slot
`levels.01.scissors`), N1 y N3 ya migrados, `index.html` ya enlaza el CSS.
Faltan N2 y N4, el posicionamiento junto a la bitácora, el aire del N3, el
orden Probar→Ensayo y el fondo/lámpara por fase del N3.

Base medida: `node --test` → 512 tests, 509 pass, 3 fail (los 3 en
`tests/level3Scene.test.js`, por el trabajo a medio hacer del orquestador:
conteo de SVG/img, clase del dock y orden probe/assault).

## Objetivo

1. Misma tijera del N1 en N1–N4, siempre al lado de la bitácora (solo CSS,
   sin tocar el DOM: hay tests que asertan el orden de hijos).
2. N3: `#canvas` llena el slot y sprites ×1.3 → ~1.12–1.18 con medición
   antes/después a 1440×900 (rect, viewBox, centros intactos, distancias).
3. N3: Probar a la izquierda, Ensayo a la derecha (ya está en el append;
   verificar en navegador y arreglar el comentario CSS invertido).
4. N3: reparación = día a pantalla completa, construcción = noche a pantalla
   completa; lámpara Probar amarilla en día / teal en noche; verificar la
   transición sin errores de consola.

## Decisiones

- Reutilizar `createScissorsProp` en N2 (`l2-scissors` + `l2-prop-name`) y
  N4 (`l4-cut` + `l4-cut-name`); clases y rótulos que los tests ya asertan.
- Posición junto a la bitácora solo con `order` (N2, N4) y `grid-areas`
  (N3); N1 ya está por CSS absoluto junto a los papeles.
- No tocar `src/main.js`: el `#canvas` llena el slot por CSS y la escala
  menor da el aire; `viewBoxForCells` y los centros quedan intactos.
- Tests de presentación desactualizados por un cambio pedido se actualizan
  con evidencia (autoriza el parent), sin debilitar aserciones de lógica.
- N5 no lleva tijera: no hay acción `cut` en la escena (verificado por grep).

## Cambios por archivo

- `src/ui/levels/level2Scene.js`: `buildScissors()` → fábrica; importar el
  prop; comentario del header (ya no es CSS/placeholder).
- `src/ui/levels/level2.css`: borrar `.l2-scissors-visual|blade|ring`
  (+ móvil); conservar `.l2-scissors` (tamaño, `is-active`, foco); `order`:
  papeles 1, tijera 2, keys 3, probar 4, palanca 5 (móvil: respetar el
  `order: 6` de keys existente).
- `src/ui/levels/level4Scene.js`: `l4-cut` → fábrica; importar el prop.
- `src/ui/levels/level4.css`: borrar `.l4-cut-glyph` (+ móvil); conservar
  `.l4-cut-name`, `is-active`, foco; `order`: papeles 1, tijera 2, keys 3.
- `src/ui/levels/level3.css`: dock `"papers cut keys"` (desktop y móvil);
  `#canvas` llena el slot; comentario alarm-group Probar→Ensayo; backdrop
  por fase (`data-phase`, una ala visible, `::after` y tags honestos);
  `.museum-lamp-btn--day` amarillo / `--night` teal.
- `src/ui/graphVisuals.css`: escala N3 1.3 → 1.15 (medir; alternativa 1.12
  o 1.18), etiquetas 17/14 px según medida, keyframes y perno compuestos,
  `prefers-reduced-motion` intacto.
- `tests/level2Scene.test.js`: placeholder ≥2 → solo palanca; tijera final
  `levels.01.scissors` con evidencia (era cambio pedido).
- `tests/level3Scene.test.js`: conteo SVG 4→3 / img 5→6 + asset tijera;
  clase `scissors-prop museum-cut` en el orden del dock; orden del grupo
  `['probe','assault']` (cambio pedido por el owner).

## Alternativas descartadas

- Mover el DOM en vez de CSS: no, los tests asertan el orden de hijos.
- Cambiar `viewBoxForCells` para otros niveles: prohibido; solo la llamada
  del N3 y solo si la medición lo pide (preferencia: no tocar `main.js`).
- Agregar tijera al N5: no, sería un prop muerto sin acción `cut`.

## Riesgos

- El filtro del host (`ERR_NETWORK_ACCESS_DENIED`) puede impedir la
  medición en navegador local: reintentar; si persiste, verificación
  estructural + reporte.
- La escala exacta (1.12/1.15/1.18) depende de la medición real de
  distancias entre sprites; elegir con números, no a ojo.

## Pendientes

- [x] Punto 1: N2 + N4 + órdenes CSS + tests
- [x] Punto 2: canvas lleno + escala + medición 1440×900 + capturas
- [x] Punto 3: comentario CSS + verificación visual + test
- [x] Punto 4: backdrop/lámpara por fase + verificación + capturas
- [x] `node --test` final + handoff

## Estado

Completado y verificado (2026-11-19): suite 513/513, navegador 1440×900
sin errores de consola, capturas en `%TEMP%\cv-n3\{cur,base}\`.

Cierre del parent en el shell real (1440×900, servidor `serve.py` del repo):
- La placa del N3 creció de 960 a 1080 px en escritorio (`.museum-plate` y
  `.museum-status`): el `#canvas` pasó de 900×442 a 1020×442 en reparación
  (+13 % de área útil) sin tocar `viewBox` ni los centros de las celdas.
- Orden móvil del N2 corregido: papeles → tijera → probar → palanca →
  carretes, para que la tijera siga pegada a la bitácora también en 390 px.
- Transición reparación→construcción probada con mouse real: modal
  "Mecanismo reparado" → "Construir el nuevo" → noche, lámpara teal,
  PROBAR antes que ASALTO, 8 celdas.

