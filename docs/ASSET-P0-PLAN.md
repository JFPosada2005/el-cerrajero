# Plan de assets P0 — remaster

**Estado:** P0 completo en `feat/remaster-assets` y pusheado (N1, fuentes, iconos, props, N2–N5 y SFX). PR a `feat/remaster-integration` pendiente de abrir. Queda confirmar la licencia exacta de `click.mp3` y las dos dudas de layout con Felipe.
**Rama de trabajo:** `feat/remaster-assets`, creada desde `origin/feat/remaster-integration` (`53339d3`).
**Alcance:** `assets/`, `docs/` y `CREDITS.md`. No se toca `src/`, `src/game`, `tests/`, `index.html` ni `styles.css` del juego.
**Contrato:** [`docs/ASSET-MANIFEST.md`](ASSET-MANIFEST.md) y [`assets/manifest.json`](../assets/manifest.json).

## 1. Contexto y objetivo

La rama `feat/remaster-integration` ya tiene la dirección visual acordada: Cinzel/Oswald/Special Elite, cables SVG procedurales, tablero 16:9 y la mesa del mockup como base. El código tolera placeholders: un asset faltante no bloquea el nivel.

El objetivo de esta rama es convertir los placeholders del Nivel 1 en assets finales y producir los P0 compartidos que destraban los niveles 2–5, respetando los presupuestos de peso y el manifest.

## 2. Decisiones

1. **Nivel 1 primero.** Reutilizar los assets del mockup y reexportarlos a WebP al doble del tamaño en pantalla. No se genera arte nuevo para el Nivel 1 salvo las llaves sin número grabado.
2. **Iconos de UI:** extraer los SVG inline del mockup (`sound`, `close`, `lock`) o usar Lucide (ISC), 24×24 y trazo 1,5 px. No requieren IA.
3. **Geometría precisa:** bifurcador, resorte, base/ficha de pila, cinta y púa se hacen en SVG o con Pillow. No conviene IA para piezas que deben encajar.
4. **Piezas materiales:** relé, cabezal y tambor se generan con IA por su materialidad. El piñón se deriva del engranaje existente o se genera aparte.
5. **Audio:** renderizar la paleta sintetizada del mockup a OGG; si no hay herramienta local, usar SFX CC0 con licencia registrada.
6. **Licencias:** descargar los textos OFL de las tres fuentes y registrar todo en `CREDITS.md`.
7. **Presupuesto:** N1 completo en ≤1,5 MB de imagen. El mockup actual pesa ~8,1 MB; hay que reexportar, no copiar.
8. **Placeholders:** si un asset no queda listo, el manifest conserva `status: "placeholder"` o `"synthetic"` y el código sigue funcionando.

## 3. Tabla P0

La columna **Ya tenemos** se refiere a lo que existe en `mockups/nivel-1-taller/assets/` o en `assets/fonts/`. Las medidas de props son el objetivo propuesto a 2× del tamaño del mockup; confirmar con Felipe si el workbench final los muestra más grandes.

### 3.1 Fuentes y licencias

| Slot / archivo final | Ruta final | Formato / objetivo | Ya tenemos | Ruta recomendada |
|---|---|---|---|---|
| `font.display` | `assets/fonts/Cinzel-Variable.woff2` | WOFF2, 25,3 KB; total de fuentes ≤150 KB | Sí, disponible | Descargar `OFL.txt` de Google Fonts |
| `font.ui` | `assets/fonts/Oswald-Variable.woff2` | WOFF2, 27,8 KB | Sí, disponible | Descargar `OFL.txt` |
| `font.paper` | `assets/fonts/SpecialElite-Regular.woff2` | WOFF2, 52 KB | Sí, disponible | Descargar `LICENSE.txt` (Apache 2.0) |
| Licencias de fuentes | `assets/fonts/OFL-Cinzel.txt`, `OFL-Oswald.txt`, `LICENSE-SpecialElite.txt` | Texto | Sí | Google Fonts GitHub |

### 3.2 UI compartida

| Slot / archivo final | Ruta final | Formato / objetivo | Ya tenemos | Ruta recomendada |
|---|---|---|---|---|
| `ui.sound` | `assets/shared/ui/sound.svg` | SVG, 24×24, trazo 1,5 px | SVG inline en `index.html` del mockup | Extraer del mockup o Lucide `volume-2`/`volume-x` |
| `ui.close` | `assets/shared/ui/close.svg` | SVG, 24×24, trazo 1,5 px | SVG inline en el mockup | Extraer o Lucide `x` |
| `ui.lock` | `assets/shared/ui/lock.svg` | SVG, 24×24, trazo 1,5 px | SVG inline del candado | Extraer o Lucide `lock` |

`ui.speed` es P1 y no entra en este lote.

### 3.3 Props compartidos

| Slot / archivo final | Ruta final | Formato / objetivo | Ya tenemos | Ruta recomendada |
|---|---|---|---|---|
| `prop.relay` | `assets/shared/props/relay.webp` | WebP con alfa, 256×256 (2× de una celda de 88 px) | No; el mockup usa el engranaje como celda | IA (prompt R1) |
| `prop.fork` | `assets/shared/props/fork.svg` | SVG, 64×64; glifo “Y” de latón | No como archivo; el editor ya dibuja un bifurcador | SVG manual |
| `prop.spring` | `assets/shared/props/spring.svg` | SVG, 64×64; resorte de latón | No como archivo; el editor usa líneas discontinuas | SVG manual |

### 3.4 Nivel 1 — Banco del Llano

| Slot / archivo final | Ruta final | Formato / objetivo | Ya tenemos | Ruta recomendada |
|---|---|---|---|---|
| `n1.background` | `assets/levels/01/background.webp` | WebP, 2048×1152; objetivo ≤250 KB | `fondo-banco.jpg`, 425,8 KB | Reexportar a WebP |
| `n1.thief` | `assets/levels/01/thief.webp` | WebP con alfa; 2× del tamaño mostrado; actual 387×960 | `ladron.png`, 163,9 KB | Reexportar a WebP con alfa |
| `n1.contract` | `assets/levels/01/props/contract.webp` | WebP con alfa; objetivo ~256×313 | `contrato.png`, 913,8 KB | Reducir y reexportar |
| `n1.hint` | `assets/levels/01/props/hint.webp` | WebP con alfa; objetivo ~192×164 | `nota-pista.png`, 589,8 KB | Reducir y reexportar |
| `n1.log` | `assets/levels/01/props/log.webp` | WebP con alfa; objetivo ~192×150 | `libreta.png`, 672,1 KB | Reducir y reexportar |
| `n1.entry` | `assets/levels/01/props/entry.webp` | WebP con alfa; objetivo ~384×658 | `bocallave-entrada.png`, 572,1 KB | Reducir y reexportar |
| `n1.lock` | `assets/levels/01/props/lock.webp` | WebP con alfa; objetivo ~416×628 | `cilindro-cerradura.png`, 826,1 KB | Reducir y reexportar |
| `n1.spool` | `assets/levels/01/props/spool.webp` | WebP con alfa; objetivo ~160×171 | `carrete-cobre.png`, 887,3 KB | Reducir y reexportar |
| `n1.gear` | `assets/levels/01/props/gear.webp` | WebP con alfa; 256×256 (o 512×512 si el bucle lo pide) | `rueda-engranaje.png`, 1.269,2 KB | Reducir y reexportar |
| `n1.bell` | `assets/levels/01/props/bell.webp` | WebP con alfa; objetivo ~256×258 | `campana-alarma.png`, 349,5 KB | Reexportar |
| `n1.scissors` | `assets/levels/01/props/scissors.webp` | WebP con alfa; objetivo ~192×89 | `tijeras.png`, 179,0 KB | Reexportar |
| `n1.keys.1…4` | `assets/levels/01/props/key-1.webp` … `key-4.webp` | WebP con alfa; ~128×420 cada una | `llave-1…4.png`, 165 KB cada una | Borrar el “1” grabado y reexportar; el número visible va en HTML |

**Nota de llaves:** las llaves 2–4 se recolorearon desde la llave 1 y conservan el “1” grabado. El asset final debe salir sin número; el número visible se agrega en la UI (M5 del plan de remaster). También conviene que el color de la llave no sea la única señal.

**Nota sobre `n1.gear`:** el plan de remaster propone que la celda sea un relé y que el engranaje quede para el bucle. Confirmar con Felipe si `n1.gear` sigue siendo necesario o si `prop.relay` lo reemplaza en la celda.

### 3.5 Nivel 2 — Hotel Mirador, P0

| Slot / archivo final | Ruta final | Formato / objetivo | Ya tenemos | Ruta recomendada |
|---|---|---|---|---|
| `n2.pinion` | `assets/levels/02/pinion.webp` | WebP con alfa; 512×512; piñón de bucle | Se puede derivar de `rueda-engranaje.png` | Reutilizar/derivar; prompt R2 solo si se quiere un piñón distinto |
| `prop.relay` | `assets/shared/props/relay.webp` | Ver 3.3 | No | IA (R1) |

### 3.6 Nivel 4 — Teatro Municipal, P0

| Slot / archivo final | Ruta final | Formato / objetivo | Ya tenemos | Ruta recomendada |
|---|---|---|---|---|
| `n4.stackBase` | `assets/levels/04/stack-base.webp` | WebP con alfa; 128×40 (2× de 64×20); base de pila | No; CSS/SVG | IA (Leonardo) con fondo removido |
| `n4.chip` | `assets/levels/04/chip.webp` | WebP con alfa; 112×64 (2× de 56×32); ficha | No; CSS/SVG | IA (Leonardo) con fondo removido |

### 3.7 Nivel 5 — Banco Central, P0

| Slot / archivo final | Ruta final | Formato / objetivo | Ya tenemos | Ruta recomendada |
|---|---|---|---|---|
| `n5.tape` | `assets/levels/05/tape.svg` | SVG; celdas de cinta a 2× | No; CSS/SVG | SVG manual |
| `n5.head` | `assets/levels/05/head.webp` | WebP con alfa; 256×256; cabezal | No | IA (prompt R4) o vector 3D |
| `n5.drum` | `assets/levels/05/drum.webp` | WebP con alfa; 512×512; tambor | No | IA (prompt R3) |
| `n5.pin` | `assets/levels/05/pin.svg` | SVG, 32×32; púa | No; CSS/SVG | SVG manual |

### 3.8 SFX P0

| Slot / archivo final | Ruta final | Formato / objetivo | Ya tenemos | Ruta recomendada |
|---|---|---|---|---|
| `sfx.click` | `assets/audio/sfx/click.ogg` | OGG/MP3, <1 s | Sí, síntesis en `app.js` | Renderizar la paleta del mockup |
| `sfx.cable` | `assets/audio/sfx/cable.ogg` | OGG/MP3, <1 s | Sí, síntesis | Renderizar |
| `sfx.cut` | `assets/audio/sfx/cut.ogg` | OGG/MP3, <1 s | Sí, síntesis | Renderizar |
| `sfx.gear` | `assets/audio/sfx/gear.ogg` | OGG/MP3, <2 s | Sí, síntesis | Renderizar |
| `sfx.lock` | `assets/audio/sfx/lock.ogg` | OGG/MP3, <1 s | Sí, síntesis | Renderizar |
| `sfx.bell` | `assets/audio/sfx/bell.ogg` | OGG/MP3, ~1,5 s | Sí, síntesis | Renderizar |
| `sfx.paper` | `assets/audio/sfx/paper.ogg` | OGG/MP3, <1 s | Sí, síntesis | Renderizar |
| `sfx.error` | `assets/audio/sfx/error.ogg` | OGG/MP3, <1 s | Sí, síntesis | Renderizar |

Presupuesto de audio: ≤400 KB por nivel; estos ocho archivos deberían quedar muy por debajo.

## 4. Lotes de entrega

### P0-1 — Destrabar Nivel 1

1. Crear `assets/levels/01/props/`, `assets/shared/ui/`, `assets/fonts/` (ya existe).
2. Reexportar los 12 assets de N1 desde el mockup a WebP con Pillow.
3. Corregir las llaves 1–4: borrar el “1” grabado; conservar el color de cada llave.
4. Extraer los iconos `sound`, `close`, `lock` a SVG.
5. Añadir las licencias OFL y `CREDITS.md`.
6. Actualizar `assets/manifest.json`.
7. Validar y commitear.

Resultado: N1 completo con assets finales y sin dependencia de arte nuevo.

### P0-2 — Props compartidos y niveles 2–5

1. Generar `relay`, `head`, `drum` con los prompts.
2. Derivar `pinion` del engranaje o generarlo.
3. Crear en SVG: `fork`, `spring`, `tape`, `pin`. Generar `stack-base` y `chip` con IA.
4. Actualizar manifest y credits.
5. Commit y push.

### P0-3 — SFX

1. Renderizar los ocho SFX desde la paleta del mockup a OGG.
2. Normalizar y comprobar duración/peso.
3. Registrar licencia propia.
4. Actualizar manifest, commit y push.

## 5. Prompts P0 faltantes

Usar 1024×1024 o 2048×2048, fondo transparente real, luz cálida superior izquierda, sin texto. Generar 3 variantes y elegir la que mejor integre.

### R1 — Relé / celda-relé

```text
Single compact electromechanical relay cell for a precision-noir puzzle game, aged brass housing with a blued steel face, rounded rectangular casing, small inset glass window showing a warm amber filament, four slotted screw terminals, fine engraved seams, subtle patina and wear, photorealistic 3D render, centered composition, top-left warm key light, transparent background, 1024x1024, no text, no numbers, no logos, no wires, no gears, no neon, no UI.
```

Negativo:

```text
text, numbers, letters, logo, watermark, background, floor, table, multiple objects, cartoon, pixel art, low-poly, neon, glow, blurry, cropped, duplicate, perspective distortion.
```

### R2 — Piñón de bucle (opcional; preferible derivarlo del engranaje)

```text
Single machined pinion gear for a precision-noir clockwork mechanism, 12 precise teeth, aged brass and gunmetal, central axle hole, subtle wear on the teeth, photorealistic 3D render, centered, top-left warm light, transparent background, 1024x1024, no text, no numbers, no logos, no extra gears, no background, no neon.
```

Negativo: el mismo bloque de R1.

### R3 — Tambor de control

```text
Compact horizontal control drum for a 1930s bank vault mechanism, aged brass cylinder with engraved section rings, small pin holes, knurled edges, steel axle, warm patina, photorealistic 3D render, three-quarter view, centered, top-left warm light, transparent background, 1024x1024, no text, no numbers, no logos, no background, no neon.
```

Negativo: el mismo bloque de R1.

### R4 — Cabezal de cinta

```text
Vintage reel-to-reel magnetic tape head, brass and black Bakelite body, small precise read gap, two mounting screws, fine machining marks, photorealistic 3D render, three-quarter view, centered, top-left warm light, transparent background, 1024x1024, no text, no numbers, no logos, no tape reel, no background, no neon.
```

Negativo: el mismo bloque de R1.

### Sin prompt de IA

- `ui.sound`, `ui.close`, `ui.lock`: extraer del mockup o Lucide; licencia ISC.
- `fork`, `spring`, `tape`, `pin`: SVG; geometría precisa.
- `stack-base`, `chip`: IA (Leonardo) y recorte; son props, no iconos.
- `pinion`: derivar del engranaje; solo usar R2 si se quiere un dibujo distinto.
- SFX: renderizar la paleta del mockup; no IA.
- N1: reexportar los placeholders; no IA.
- Fuentes y licencias: descarga directa de Google Fonts.

## 6. Flujo de entrega y Git

### Sincronización inicial

```powershell
git fetch origin
git switch -c feat/remaster-assets origin/feat/remaster-integration
# Si ya existe:
git switch feat/remaster-assets
git pull --ff-only origin feat/remaster-assets
```

La rama local ya fue creada. Antes del primer push, quitar el upstream heredado de integración para no empujar por accidente:

```powershell
git branch --unset-upstream
```

### Primer push de la rama

```powershell
git push -u origin feat/remaster-assets
```

### Por cada lote

```powershell
# 1. Traer la integración más reciente
git fetch origin
git rebase origin/feat/remaster-integration

# 2. Añadir assets y manifest
git add assets docs/CREDITS.md
git status

# 3. Validar manifest y archivos
node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('assets/manifest.json','utf8')); const walk=(o,p)=>{for(const [k,v] of Object.entries(o)){if(v&&typeof v==='object'&&'final' in v){if(v.status==='available'&&!fs.existsSync(v.final))throw new Error('Falta '+v.final)}else if(v&&typeof v==='object')walk(v,p+'.'+k)}}; walk(m,''); console.log('manifest ok')"

# 4. Tests completos
npm test

# 5. Commit y push
git commit -m "assets(p0): add level 1 final WebP exports and UI icons"
git push
```

No se hace push a `main` ni a `feat/remaster-integration`. El PR va de `feat/remaster-assets` hacia `feat/remaster-integration`.

### Actualización del manifest

Cada asset entregado debe pasar de `placeholder`/`missing`/`synthetic` a `available`, mantener su `final` y añadir licencia/fuente. Ejemplo:

```json
"background": {
  "final": "assets/levels/01/background.webp",
  "placeholder": "mockups/nivel-1-taller/assets/sprites/fondo-banco.jpg",
  "kind": "image",
  "priority": "P0",
  "status": "available",
  "license": "Proyecto — asset IA",
  "source": "mockup 153ee7d, reexportado a WebP"
}
```

Para fuentes:

```json
"display": {
  "final": "assets/fonts/Cinzel-Variable.woff2",
  "kind": "font",
  "priority": "P0",
  "status": "available",
  "license": "OFL-1.1",
  "licenseFile": "assets/fonts/OFL-Cinzel.txt"
}
```

Actualizar `updated` al final de cada lote. No cambiar los `final` ya acordados.

## 7. Validación y definición de terminado

- `assets/manifest.json` parsea y todos los `available` existen.
- N1 ≤1,5 MB de imágenes; fuentes ≤150 KB; audio ≤400 KB por nivel.
- Sin 404 en la ruta final.
- Licencia y crédito en `CREDITS.md` y en el manifest.
- `npm test` pasa (253/253).
- Sin cambios en `src/`, `src/game`, `tests/`, `index.html` ni `styles.css` del juego.
- Felipe prueba el slot; si no encaja, se conserva el placeholder y se devuelve una nota.

## 8. Riesgos y pendientes

- **Tamaño final de los props:** las medidas de 2× se basan en el mockup; confirmar el layout real del workbench antes de exportar en masa.
- **Llaves con “1” grabado:** hay que retirarlo de las cuatro llaves y añadir el número visible en UI. Es un P0 heredado de M5.
- **`n1.gear` vs. celda-relé:** el plan de remaster propone relé para la celda; el manifest aún pide `n1.gear`. Confirmar con Felipe.
- **Audio:** verificar si hay `ffmpeg` o una librería local para OGG; si no, usar CC0 y registrar la fuente.
- **Licencias:** descargar los tres OFL y crear `CREDITS.md`, que hoy no existe.
- **Presupuesto:** no copiar los PNG del mockup tal cual; suman ~8,1 MB entre todos y el presupuesto N1 es 1,5 MB.
- **Dependencia de integración:** si `feat/remaster-integration` avanza, hacer `git fetch`/`rebase` antes de cada lote; no tocar `src/`.

## 9. Estado

### Checkpoint 2026-11-17 — P0-1

- Rama `feat/remaster-assets` creada desde `origin/feat/remaster-integration`.
- Nivel 1 reexportado a `assets/levels/01/` en WebP.
- Las 4 llaves se editaron para retirar el “1” grabado y se conservaron sus colores.
- `assets/shared/ui/sound.svg`, `close.svg` y `lock.svg` creados.
- Licencias: `OFL-Cinzel.txt`, `OFL-Oswald.txt` y `LICENSE-SpecialElite.txt`.
- `assets/manifest.json` actualizado: N1, fuentes e iconos P0 en `available`.
- `CREDITS.md` creado.
- Total de imágenes N1: **496.224 bytes** (≤1,5 MB).
- `npm test`: **253/253**.
- Sin push todavía.

### Checkpoint 2026-11-18 — P0 completo

- P0-1, P0-2 y P0-3 pusheados a `feat/remaster-assets`.
- Nivel 1: 15 WebP, 496.224 bytes.
- Fuentes y licencias: Cinzel, Oswald y Special Elite.
- Iconos de UI: `sound.svg`, `close.svg` y `lock.svg`.
- Props: relé, bifurcador, resorte, piñón, base de pila, ficha, cinta, cabezal, tambor y púa.
- SFX: 8 OGG, 63,3 KB; `cable` es síntesis propia.
- `assets/manifest.json`: **39 rutas `available`**, todas existen.
- `npm test`: **253/253**.
- `src/` intacto.
- Commits: `84493df`, `6aa1d7d`, `0d2a400`, `649ab57`.
- Pendiente: confirmar la página exacta de Freesound del `click.mp3`; confirmar con Felipe el tamaño final de los props y `n1.gear` vs. celda-relé.
- PR a `feat/remaster-integration` pendiente de abrir.

### Pendiente

- Confirmar la página exacta de Freesound del `click.mp3` para cerrar su licencia.
- Confirmar con Felipe el tamaño final del workbench y `n1.gear` vs. celda-relé.
- Abrir el PR de `feat/remaster-assets` hacia `feat/remaster-integration`.
