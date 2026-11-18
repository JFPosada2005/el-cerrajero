# Handoff — Unidad C: carretes de cable (`spoolPalette.css`)

> Rama `feat/remaster-integration` · Contrato: `docs/REMASTER-VISUALS-CONTRACT.md` (unidad C, aprobada 2026-11-17) + `docs/REMASTER-SCENE-CONTRACT.md`.
> Estado: **listo para integrar** · No commitea (el parent decide).

## Estado

El inventario deja de mostrar cuatro llaves y pasa a mostrar **cuatro carretes
de cable**, uno por símbolo (dorado = `1`, teal = `2`, coral = `3`,
violeta = `4`). CSS-only, sin tocar lógica, datos, jueces, `main.js` ni
ningún archivo congelado. Solo 3 archivos nuevos:

- `src/ui/spoolPalette.css` — el override (alcance estricto `.wb-scene`, solo `#palette`).
- `tests/spoolPalette.test.js` — 11 tests estáticos (`node --test`, en verde).
- `docs/handoffs/spool-palette.md` — este documento.

Nada más se tocó: `main.js`, `index.html`, `workbenchScene.*`,
`gameChrome.css`, `styles.css`, tests existentes, `mockups/` y git quedan
intactos.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/ui/spoolPalette.css` | Nuevo. Reemplazo visual llave → carrete dentro de `#palette`. |
| `tests/spoolPalette.test.js` | Nuevo. Tests estáticos del CSS. |
| `docs/handoffs/spool-palette.md` | Nuevo. Este handoff. |

## API / integración

Sin JS ni API: es una hoja de estilo que se suma a la escena del taller.

```html
<link rel="stylesheet" href="src/ui/gameChrome.css">
<link rel="stylesheet" href="src/ui/spoolPalette.css">
```

Cargarla **después** de `src/ui/gameChrome.css`: iguala la especificidad de
sus reglas (`#palette .key[data-key="N"]` / `.key-N`) y gana por orden,
anulando las cuatro `llave-N.png` sin `!important` y sin tocar herramientas
(`.tools > .tool`, `#scissors`, `#spring-tool`) ni acciones (`.wb-actions`).

Mapeo con el DOM real que monta `main.js` → `renderPalette`:

| Elemento real | Regla | Acabado |
|---|---|---|
| `#palette .key.key-N` / `[data-key="N"]`, N = 1–4 | una regla por carrete | `carrete-cobre.png` como héroe (54 px) + velo de color (`::before` con `mix-blend-mode: color`) + chapa inferior del color del cable con el número encima; `border-bottom` del mismo color |
| `#palette .key` (base) | geometría y texto | 64 × 88 px (mínimos 44), número oscuro sobre la chapa clara (`#17130a`, peso 700) con sombra clara; `aria-label` ("Llave N") intacto porque el texto del botón no se oculta ni se reemplaza |
| `.key.is-active` | elevado + brillo | `translateY(-6px)`, `brightness(1.15)` y halo del color del cable (`--spool-glow`); punto de luz `::after` teñido por carrete |
| hover / focus-visible / disabled | estados | hover eleva 3 px con halo; foco outline teal 2 px + offset 3 px; disabled (`:disabled` y `[aria-disabled]`) a 45 % + `grayscale`, sin desplazamiento |

Colores (mismos del contrato y de `gameChrome.css`): 1 latón `#d4a72c`,
2 teal `#38c6b8`, 3 coral `#f06a4a`, 4 violeta `#a18be0`, siempre como
`var(--wb-*, <hex>)` con respaldo por si el orden de carga cambia.

## Decisiones

- Un solo asset (`carrete-cobre.png`, ya existente) teñido por CSS en vez de
  cuatro sprites nuevos: el velo `::before` usa `mix-blend-mode: color` para
  conservar el sombreado del cobre con el tono del cable. Si el navegador no
  soporta el blend, el carrete queda cobre con chapa y borde del color: la
  variante se sigue distinguiendo por chapa + borde + número.
- El número **no** se mueve ni se oculta: es el texto del botón sobre la
  chapa (gradiente inferior al 42 %), con tinta oscura legible en los cuatro
  colores. El color nunca es la única señal.
- Se conserva el riel de latón (`#palette::before`) y el giro colgante de
  `gameChrome.css`: los carretes "cuelgan" del mismo riel.
- Sin `!important` en todo el archivo: el override gana por igualdad de
  especificidad + orden de carga.

## Tests

`node --test tests/spoolPalette.test.js` → 11/11 en verde. Verifican sin navegador:

- alcance: todo selector empieza con `.wb-scene`; sin `body`/`html`/`:root`/`*`;
- cada `url()` apunta a `mockups/nivel-1-taller/assets/` y el archivo existe;
- el héroe es `carrete-cobre.png` y no queda ninguna referencia a `llave-`
  (comparación sin comentarios);
- cuatro variantes con regla por símbolo (`[data-key]` y `.key-N`), cada una
  con el carrete y su color;
- targets ≥ 44 px en `#palette .key`;
- chapa en gradiente + estados hover/activo/foco/disabled (`:disabled` y
  `[aria-disabled]`);
- `prefers-reduced-motion` con `transition: none` y `transform: none`;
- el texto del botón no se oculta (sin `text-indent` negativo, `font-size: 0`
  ni `color: transparent`);
- cero fugas: ningún selector menciona `.wb-actions`, `.tools > .tool`,
  `#scissors` ni `#spring-tool`.

Suite completa `node --test` → verde (364 preexistentes + 11 nuevos).

## Supuestos

- El parent monta carretes como `button.key.key-{símbolo}` con `data-key` y
  texto del símbolo (verificado en `main.js` → `renderPalette`); por eso cada
  variante tiene doble selector (`[data-key="N"]` y `.key-N`).
- Niveles con más de 4 símbolos heredan la base dorada sin sprite dedicado;
  hoy todos los niveles usan 1–4.
- `spoolPalette.css` carga después de `gameChrome.css`.

## Riesgos

- Sin verificación visual en navegador en esta unidad: el parent la hace en
  N1–N4 a 1440/390. El teñido por `mix-blend-mode: color` puede variar de
  intensidad según el motor; si algún tono queda apagado, ajustar solo
  `--spool-wash` de esa variante.
- `mix-blend-mode` mezcla el velo con lo que haya detrás del botón (fondo del
  inventario, oscuro): en fondos oscuros el tinte se satura bien; en un futuro
  fondo claro habría que re-verificar.
- El override depende del orden de carga (después de `gameChrome.css`); si se
  invierte, las llaves vuelven a verse. Los tests no pueden verificar el orden
  de `<link>`: lo confirma el parent al integrar.

## Integración (pasos del parent)

1. Agregar el `<link>` a `spoolPalette.css` después de `gameChrome.css`.
2. Verificar N1–N4 en 1440/390 y correr `node --test`.
3. No cambia reglas, datos, jueces ni callbacks: si algo visual tapa un control,
   se ajusta aquí, nunca en `main.js`.
