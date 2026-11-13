# Guía de assets — Taller del Nivel 1

Esta guía define todos los sprites que necesita el mockup. Los archivos actuales en `assets/sprites/` son **SVG provisionales**; los definitivos deben guardarse como **PNG** en la misma carpeta, con el nombre exacto indicado.

El mockup puede cargar los PNG sin cambiar el código:

```text
index.html?sprites=png
```

También se pueden reemplazar los `src` de los SVG por los PNG cuando estén aprobados.

---

## 1. Biblia visual para todos los assets

**Dirección:** precisión noir + taller art déco de los años 30. Un objeto físico, caro y silencioso. Nada de steampunk decorativo, pixel art, CRT, neón ni caricatura.

**Paleta:**

| Uso | Hex |
|---|---|
| Fondo tinta | `#070B10` |
| Superficie | `#141B24` |
| Latón | `#D4A72C` |
| Latón claro | `#F0CF6A` |
| Ivory / papel | `#F2EDE3` |
| Teal / camino válido | `#38C6B8` |
| Coral / alarma | `#F06A4A` |
| Violeta / llave 4 | `#A18BE0` |
| Nogal | `#2B1D16` |
| Cuero | `#221A18` |
| Cobre | `#B87333` |
| Lacre | `#8E2F2A` |

**Luz:** clave cálida desde arriba a la izquierda; rim light fría teal desde la derecha; sombras profundas, sin negros puros. Los objetos deben verse **fotografiados sobre una mesa**, no dibujados en una interfaz.

**Cámara:** frontal o 3/4 muy leve. Sin perspectiva agresiva. Los objetos se recortan limpios y centrados.

**Materiales:** latón cepillado, acero oscuro, nogal, cuero, papel ivory, vidrio, lacre.

**Reglas de producción:**

- Generar a 2× de la medida final y reducir.
- Fondo transparente real para todos los props. Guardar PNG-24 con alfa.
- Sin texto, letras, marcas de agua ni logotipos (las llaves llevan solo su número).
- Sin sombra horneada fuerte: el CSS ya aplica sombras; una sombra de contacto suave es aceptable.
- Mantener la misma dirección de luz y el mismo nivel de detalle en todos los sprites.
- No mezclar estilos entre proveedores. Si se usa una IA, conservar modelo, semilla y estilo entre assets.

**Bloque de estilo base para IA** (se puede anteponer a cada prompt):

```text
Precision noir game asset, 1930s art deco electromechanical workshop, aged brass, dark walnut, ivory paper, muted teal and coral accents, cinematic warm key light from top-left and cool teal rim light from the right, handcrafted premium puzzle game, highly detailed, clean silhouette, centered, isolated on transparent background, no text, no watermark, no logo, no pixel art, no CRT scanlines, no neon, no steampunk goggles, no background clutter.
```

**Negative prompt:**

```text
text, letters, words, watermark, logo, signature, UI frame, browser chrome, heavy baked shadow, pixel art, CRT scanlines, neon, cyberpunk, steampunk goggles, cartoon, chibi, low detail, blurry, cropped, multiple objects, perspective distortion, noisy background
```

---

## 2. Lista maestra

| Archivo final | Medida recomendada | Provisional | Dónde se usa |
|---|---:|---|---|
| `fondo-banco.png` | 2048×1280 | `fondo-banco.svg` | Fondo de la escena |
| `mesa-madera.png` | 2048×640 | `mesa-madera.svg` | Superficie del banco |
| `placa-mecanismo.png` | 2048×1280 | `placa-mecanismo.svg` | Placa de latón |
| `rueda-engranaje.png` | 1024×1024 | `rueda-engranaje.svg` | Ruedas I y II |
| `bocallave-entrada.png` | 512×768 | `bocallave-entrada.svg` | Entrada |
| `cilindro-cerradura.png` | 768×960 | `cilindro-cerradura.svg` | Cerrojo |
| `perno.png` | 1024×256 | `perno.svg` | Perno del cerrojo |
| `campana-alarma.png` | 512×512 | `campana-alarma.svg` | Campana |
| `llave-1.png` | 512×1024 | `llave-1.svg` | Llave 1 |
| `llave-2.png` | 512×1024 | `llave-2.svg` | Llave 2 |
| `llave-3.png` | 512×1024 | `llave-3.svg` | Llave 3 |
| `llave-4.png` | 512×1024 | `llave-4.svg` | Llave 4 |
| `tijeras.png` | 1024×512 | `tijeras.svg` | Herramienta tijera |
| `carrete-cobre.png` | 1024×1024 | `carrete-cobre.svg` | Herramienta cable |
| `engranaje-herramienta.png` | 1024×1024 | `engranaje-herramienta.svg` | Herramienta bloqueada |
| `ladron.png` | 1024×2048 | `ladron.svg` | Personaje |
| `contrato.png` | 1024×768 | `contrato.svg` | Objeto contrato |
| `nota-pista.png` | 768×768 | `nota-pista.svg` | Objeto pista |
| `libreta.png` | 768×768 | `libreta.svg` | Objeto bitácora |

Opcionales para niveles futuros:

| Archivo final | Medida | Uso |
|---|---:|---|
| `resorte.png` | 512×1024 | Resorte del nivel 3 |
| `terminal.png` | 128×128 | Conector de cable |
| `chispa.png` | 128×128 | Pulso / chispa |
| `llavero.png` | 1024×256 | Riel del llavero |
| `cursor-llave.png` | 64×64 | Cursor nativo alternativo |
| `cursor-cable.png` | 64×64 | Cursor nativo alternativo |
| `cursor-tijera.png` | 64×64 | Cursor nativo alternativo |

---

## 3. Prompts por archivo

### `fondo-banco.png` — 2048×1280

**Búsqueda:** `art deco bank interior night`, `1920s bank vault`, `moody bank office background`, `game background vault`.

**Prompt:**

```text
Precision noir game background, interior of an art deco bank at night, 1930s, tall arched window with cold moonlight and rain on the left, massive circular steel vault door with brass details on the right, dark marble columns, walnut paneling, a banker's lamp with a warm green glass shade on a side desk, deep navy and ink shadows, warm brass highlights, cool teal rim light, cinematic wide composition with the center relatively dark and uncluttered for a game mechanism overlay, painted game background, highly detailed, no text, no logo, no characters, no UI, no pixel art, no neon.
```

*Nota:* el centro de la imagen queda tapado por la placa; no poner detalles importantes ahí.

### `mesa-madera.png` — 2048×640

**Búsqueda:** `dark walnut workbench top`, `leather inlay table top`, `game table surface`, `wood workbench texture`.

**Prompt:**

```text
Precision noir game asset, wide dark walnut workbench top seen straight on, rich wood grain, worn edges, a dark leather inlay strip with brass trim, small scratches and a faint cup ring, warm top-left light, deep shadows, art deco craft furniture, transparent background above the tabletop edge, bottom filled with the wood surface, photorealistic game prop, no text, no logo, no tools, no clutter, no perspective distortion.
```

*Nota:* la parte superior debe ser transparente para que se vea la escena detrás.

### `placa-mecanismo.png` — 2048×1280

**Búsqueda:** `brass control plate art deco`, `engraved brass machine panel`, `game UI plate`, `vintage control panel`.

**Prompt:**

```text
Precision noir game asset, large rectangular aged brass mechanism plate, art deco beveled border, brushed metal, dark patina, corner screws with slots, subtle engraved measurement grid, a blank dark nameplate at the top center and a blank serial plate at the bottom left, warm brass highlights, deep brown shadows, elegant machined surface, slight top-left light, isolated on transparent background, no text, no letters, no logos, no gears, no cables, no clutter.
```

*Nota:* dejar la placa superior y la placa serial **sin texto**; el HTML superpone “Banco del Llano · Caja 01” y “N.º 0147”.

### `rueda-engranaje.png` — 1024×1024

**Búsqueda:** `brass gear cog`, `ornate clockwork gear`, `art deco cog`, `game gear icon`.

**Prompt:**

```text
Precision noir game asset, ornate brass gear wheel seen from the front, perfectly centered and symmetrical, twenty-four teeth, dark steel face, brass rim, eight spokes, central hub with a large screw, small rivets, subtle wear and patina, warm top-left highlight and cool teal edge light, physical mechanism, isolated on transparent background, no text, no numbers, no logo, no background, no perspective.
```

*Nota:* debe girar bien; por eso el centro y los dientes tienen que ser simétricos. El numeral I/II lo pone el HTML.

### `bocallave-entrada.png` — 512×768

**Búsqueda:** `art deco keyhole escutcheon`, `brass door keyhole plate`, `vintage keyhole`, `game prop keyhole`.

**Prompt:**

```text
Precision noir game asset, vertical art deco brass keyhole escutcheon, elegant arched top, beveled edges, engraved geometric border, central dark keyhole with a brass rim, small warm glass indicator at the top, four corner screws, aged brass with dark patina, warm top-left light and subtle teal rim, physical door hardware, isolated on transparent background, no text, no logo, no background, no clutter.
```

### `cilindro-cerradura.png` — 768×960

**Búsqueda:** `brass lock cylinder`, `pin tumbler lock front`, `vintage lock mechanism`, `game lock prop`.

**Prompt:**

```text
Precision noir game asset, front view of a heavy brass and steel lock cylinder mounted on a rectangular brass plate, concentric machined rings, visible pin chambers around the top, dark keyway in the center, small red indicator window at the bottom, aged metal with fine scratches, warm key light from top-left, cool teal rim, physical high-security lock, isolated on transparent background, no text, no logo, no background, no key.
```

*Nota:* el perno es un archivo aparte para poder animarlo.

### `perno.png` — 1024×256

**Búsqueda:** `steel latch bolt`, `door bolt metal bar`, `heavy steel bolt`, `game mechanism part`.

**Prompt:**

```text
Precision noir game asset, thick horizontal steel latch bolt pointing right, chamfered tip, dark brushed steel with a brass collar near the base, subtle scratches, strong top highlight and dark underside, heavy physical mechanism, side view, isolated on transparent background, no text, no logo, no background, no shadow baked.
```

### `campana-alarma.png` — 512×512

**Búsqueda:** `brass alarm bell`, `vintage service bell`, `art deco bell`, `game alarm icon`.

**Prompt:**

```text
Precision noir game asset, small brass alarm bell with a dark steel base and a red felt striker, art deco curves, warm brass highlights, deep shadows, subtle red glow at the striker, physical alarm mechanism, centered, isolated on transparent background, no text, no logo, no background, no cartoon style.
```

### `llave-1.png` … `llave-4.png` — 512×1024

**Búsqueda:** `ornate brass key`, `art deco skeleton key`, `vintage key game inventory`, `brass key transparent`.

**Prompt base:**

```text
Precision noir game asset, long ornate brass key seen vertically, art deco bow with a circular opening, engraved shaft, complex bit at the bottom, aged brass with warm highlights, a narrow enamel band in the middle, physical key, centered, isolated on transparent background, no text except a small engraved number on the shaft, no logo, no background, no keychain.
```

Variantes:

| Archivo | Color del esmalte | Número |
|---|---|---|
| `llave-1.png` | latón claro `#F0CF6A` | 1 |
| `llave-2.png` | teal `#38C6B8` | 2 |
| `llave-3.png` | coral `#F06A4A` | 3 |
| `llave-4.png` | violeta `#A18BE0` | 4 |

*Nota:* generar una sola llave base y recolorear el esmalte para que las cuatro tengan exactamente la misma silueta.

### `tijeras.png` — 1024×512

**Búsqueda:** `vintage brass scissors`, `tailor scissors game icon`, `ornate scissors`, `steel scissors transparent`.

**Prompt:**

```text
Precision noir game asset, elegant vintage scissors seen from the side, two polished steel blades, brass pivot and finger loops, art deco curves, subtle scratches, warm top-left highlight, cool edge, physical tool, centered, isolated on transparent background, no text, no logo, no background, no hands.
```

### `carrete-cobre.png` — 1024×1024

**Búsqueda:** `copper wire spool`, `cable reel game icon`, `vintage wire spool`, `copper coil transparent`.

**Prompt:**

```text
Precision noir game asset, compact spool of copper wire, dark walnut end discs, thick brass axle, tightly wound copper coil with a loose wire end curling out, warm metallic highlights, subtle patina, physical workshop tool, three-quarter front view, centered, isolated on transparent background, no text, no logo, no background, no hands.
```

### `engranaje-herramienta.png` — 1024×1024

**Búsqueda:** `gear crank tool`, `brass cog tool`, `mechanism handle gear`, `game gear tool`.

**Prompt:**

```text
Precision noir game asset, heavy brass gear tool with a dark walnut handle and a square socket, large cog wheel with visible teeth, central hub, aged metal, warm top-left light and cool teal rim, physical locksmith tool, centered, isolated on transparent background, no text, no logo, no background, no extra tools.
```

*Nota:* en el mockup aparece bloqueado con un candado pequeño; el sprite no lleva candado.

### `ladron.png` — 1024×2048

**Búsqueda:** `noir thief silhouette`, `fedora trench coat character`, `lockpick thief`, `art deco villain silhouette`, `game character sprite transparent`.

**Prompt:**

```text
Precision noir game character sprite, full-body thief standing in a dark workshop, 1930s art deco, long black trench coat with visible folds, wide fedora, dark scarf, leather gloves, one hand holding a slim lockpick, the other hand relaxed, boots, face almost entirely in shadow with a subtle jawline, cool teal rim light on the left and warm brass rim light on the right, elegant and menacing, not cartoonish, realistic proportions, transparent background, no text, no logo, no background, no exaggerated facial features, no weapon other than the lockpick.
```

*Nota:* el personaje se coloca a la derecha de la mesa. Tiene que leerse como silueta incluso a tamaño pequeño y no tapar el mecanismo.

### `contrato.png` — 1024×768

**Búsqueda:** `old paper contract wax seal`, `vintage document game prop`, `folded contract prop`, `paper with red seal`.

**Prompt:**

```text
Precision noir game asset, folded ivory paper contract lying at a slight angle, visible crease, abstract handwritten lines without readable text, dark red wax seal with a subtle keyhole emboss, thin red ribbon, aged paper edges, warm top-left light, soft contact shadow, physical prop, isolated on transparent background, no readable text, no logo, no background.
```

### `nota-pista.png` — 768×768

**Búsqueda:** `folded note magnifying glass`, `vintage clue note`, `detective note prop`, `magnifying glass game icon`.

**Prompt:**

```text
Precision noir game asset, small folded ivory note with a brass magnifying glass resting on top, dark leather handle, glass lens with a subtle teal reflection, abstract pencil marks without readable text, warm light, physical clue prop, isolated on transparent background, no text, no logo, no background.
```

### `libreta.png` — 768×768

**Búsqueda:** `leather notebook brass clasp`, `vintage pocket notebook`, `game journal prop`, `leather book transparent`.

**Prompt:**

```text
Precision noir game asset, small dark leather notebook with a brass clasp and a slim pencil, worn edges, cream page block, subtle embossed art deco border, warm top-left light, cool teal edge, physical journal prop, three-quarter view, isolated on transparent background, no text, no logo, no background.
```

---

## 4. Opcionales para niveles futuros

### `resorte.png` — 512×1024

**Búsqueda:** `brass coil spring`, `clockwork spring game icon`, `vintage spring mechanism`.

```text
Precision noir game asset, tightly coiled brass spring with dark steel end caps, visible tension, warm highlights, physical clockwork part, vertical, centered, isolated on transparent background, no text, no logo, no background.
```

### `terminal.png` — 128×128

**Búsqueda:** `brass cable terminal`, `banana plug connector`, `vintage electrical connector`.

```text
Precision noir game asset, small brass cable terminal with a dark steel core and a ridged grip, top-down view, warm metallic highlights, isolated on transparent background, no text, no logo, no background.
```

### `chispa.png` — 128×128

**Búsqueda:** `teal spark game vfx`, `electric spark icon`, `glowing particle`.

```text
Precision noir game VFX asset, small teal electric spark with a bright white core, soft glow, transparent background, no text, no logo, no background scene.
```

### `llavero.png` — 1024×256

**Búsqueda:** `brass key ring rail`, `key holder game UI`, `brass rod with rings`.

```text
Precision noir game asset, horizontal brass key rail with two decorative end rings, aged metal, warm top-left light, isolated on transparent background, no keys, no text, no logo, no background.
```

### Cursores nativos — 64×64

El mockup usa los sprites de las herramientas como cursor personalizado. Si en la integración se prefiere un cursor CSS nativo, exportar:

- `cursor-llave.png`: llave pequeña, punta inferior izquierda, hotspot 8,8.
- `cursor-cable.png`: carrete de cobre pequeño, hotspot 8,8.
- `cursor-tijera.png`: tijeras pequeñas, hotspot 8,8.

---

## 5. Cómo integrar los PNG

1. Guardar cada archivo en `mockups/nivel-1-taller/assets/sprites/` con el nombre exacto de la tabla.
2. Abrir `index.html?sprites=png` para ver el mockup con los PNG.
3. Si el resultado gusta, cambiar los `src` de los SVG por los PNG o dejar el parámetro para la demo.
4. Mantener las proporciones; el CSS usa `width: 100%`, `object-fit` y posiciones porcentuales.
5. No recortar el objeto contra el borde: dejar 4–8 % de margen transparente para que las sombras y el cursor no se corten.
6. Para el fondo, la mesa y la placa, respetar la zona que queda tapada por el mecanismo y por el inventario.

## 6. Checklist de consistencia

- [ ] Todos los props tienen fondo transparente real.
- [ ] La luz viene de arriba a la izquierda en todos.
- [ ] El latón es el mismo tono en todos.
- [ ] Las llaves comparten silueta y solo cambia el esmalte.
- [ ] El ladrón se lee como silueta a 300 px de alto.
- [ ] La placa no tiene texto horneado.
- [ ] El fondo no compite con la placa.
- [ ] Los PNG están a 2× y se ven nítidos al tamaño de uso.
- [ ] No hay sombras horneadas fuertes.
- [ ] No hay texto, logos ni marcas de agua.
