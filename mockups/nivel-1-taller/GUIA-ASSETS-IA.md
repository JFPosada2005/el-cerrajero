# Assets para generar con IA

Esta guía cubre solo los assets donde la IA generativa tiene ventaja real: escenas, personajes, props con textura orgánica y papel. Para engranajes, pernos, tijeras, campanas, texturas de madera/latón y piezas de geometría exacta, conviene buscar en la web: ver [`GUIA-ASSETS-WEB.md`](GUIA-ASSETS-WEB.md).

La guía completa de nombres, medidas e integración está en [`GUIA-ASSETS.md`](GUIA-ASSETS.md).

---

## 1. Cómo decidir qué generar y qué buscar

| Tipo de asset | Mejor ruta | Por qué |
|---|---|---|
| Fondo de escena | **IA** | La IA produce atmósfera, luz y composición; una foto de stock no coincide con el art déco. |
| Personaje / ladrón | **IA** | Necesitás silueta, actitud y rim light; el stock no tiene la misma dirección. |
| Props orgánicos: papel, lacre, cuero, madera con desgaste | **IA** | La IA maneja bien la textura y el desgaste. |
| Llave ornamentada | **IA o vector web** | La IA da detalle; un SVG limpio da silueta perfecta y recoloreo fácil. |
| Engranajes, pernos, tijeras, campanas, cerraduras | **Web / SVG** | Necesitan simetría, dientes parejos y geometría exacta; la IA suele fallar. |
| Texturas de madera y latón | **Web (CC0)** | Poly Haven / AmbientCG tienen texturas reales, sinépticas y de alta resolución. |
| Placa de mecanismo | **Híbrido** | Generá o buscá una base de latón; agregá tornillos, placa y textos en Photopea/SVG. |

**Regla práctica:** si el objeto tiene que **girar, encajar o repetirse** (engranaje, perno, tijera, campana), usá vector o textura web. Si el objeto tiene que **transmitir material, desgaste o atmósfera** (fondo, ladrón, papel, cuero), usá IA.

---

## 2. Bloque de estilo base

Usa este bloque al inicio de cada prompt. Si la herramienta limita el largo (Firefly corta en 750 caracteres), conservá la primera frase y el objeto; recortá el resto.

```text
Precision noir game asset, 1930s art deco electromechanical workshop, aged brass, dark walnut, ivory paper, muted teal and coral accents, cinematic warm key light from top-left and cool teal rim light from the right, handcrafted premium puzzle game, highly detailed, clean silhouette, centered, isolated on transparent background, no text, no watermark, no logo, no pixel art, no CRT scanlines, no neon, no steampunk goggles, no background clutter.
```

**Negative prompt base:**

```text
text, letters, words, watermark, logo, signature, UI frame, browser chrome, heavy baked shadow, pixel art, CRT scanlines, neon, cyberpunk, steampunk goggles, cartoon, chibi, low detail, blurry, cropped, multiple objects, perspective distortion, noisy background
```

**Ajustes comunes:**

- Generar a 2× de la medida final y reducir después.
- 3–4 variantes por asset; elegir una y descartar el resto.
- Usar la misma semilla/modelo/estilo para todos los assets de la misma familia.
- Generar sobre fondo plano oscuro si la herramienta no exporta alfa real. Quitar el fondo en Firefly, Photoroom o Photopea.
- No pedir texto legible: el HTML superpone los textos del contrato y de la placa.
- Para Firefly: usá modelos Adobe Firefly para seguridad comercial; los “partner models” pueden tener otras condiciones.
- Para Leonardo: usá Image Guidance / Style Reference con el asset ancla aprobado; las imágenes del plan free son públicas.

---

## 3. Orden de generación recomendado

1. **Ancla de estilo:** `rueda-engranaje` no se genera con IA, pero puedes usar una imagen de referencia de brass/gear de la web. El ancla real puede ser `bocallave-entrada` o `ladron`.
2. **Personaje:** `ladron.png`.
3. **Escenario:** `fondo-banco.png`.
4. **Props de papel/cuero:** `contrato.png`, `nota-pista.png`, `libreta.png`.
5. **Props metálicos orgánicos:** `bocallave-entrada.png`, `cilindro-cerradura.png`, `carrete-cobre.png`.
6. **Llave base:** `llave-1.png`; después recoloreás 2, 3 y 4.
7. **Placa:** base de latón; los detalles geométricos van en Photopea.

---

## 4. Prompts por elemento

### `fondo-banco.png` — 2048×1280

**Ruta:** IA. **Uso:** fondo full-bleed de la escena.

```text
Precision noir game background, interior of an art deco bank at night, 1930s, tall arched window with cold moonlight and rain on the left, massive circular steel vault door with brass details on the right, dark marble columns, walnut paneling, a banker's lamp with a green glass shade on a side desk, deep navy and ink shadows, warm brass highlights, cool teal rim light, cinematic wide composition, center dark and uncluttered for a game mechanism overlay, painted game background, highly detailed, no people, no text, no logo, no UI, no pixel art, no neon, 16:10.
```

**Negative extra:** `people, thief, text, sign, logo, bright center, busy center, cartoon`.

**Generación:** 16:10 o 3:2; 2048×1280; 2–4 variantes; mantener el centro oscuro porque la placa tapa esa zona.

**Post-proceso:** recortar a 2048×1280; si la IA agrega texto o un letrero, borrarlo en Photopea; no hace falta transparencia.

---

### `ladron.png` — 1024×2048

**Ruta:** IA. **Uso:** personaje a la derecha de la mesa.

```text
Precision noir game character sprite, full-body thief standing in a dark workshop, 1930s art deco, long black trench coat with visible folds, wide fedora, dark scarf, leather gloves, one hand holding a slim lockpick, the other hand relaxed, boots, face almost entirely in shadow with a subtle jawline, cool teal rim light on the left and warm brass rim light on the right, elegant and menacing, realistic proportions, centered, full body on a flat neutral dark background for easy masking, no text, no logo, no weapon other than the lockpick, 1:2.
```

**Negative extra:** `visible face, smile, cartoon, chibi, extra fingers, extra arms, guns, knives, text, logo, busy background`.

**Generación:** 1:2; 1024×2048; 4 variantes; verificar manos, pies y sombrero. Si la cara sale demasiado visible, pedir “face in deep shadow” o corregir en Photopea.

**Post-proceso:** quitar el fondo; dejar 4–8 % de margen; si falta un pie, regenerar; no recortar el sombrero.

---

### `bocallave-entrada.png` — 512×768

**Ruta:** IA o vector web. **Uso:** pieza de entrada del mecanismo.

```text
Precision noir game asset, vertical art deco brass keyhole escutcheon, elegant arched top, beveled edges, engraved geometric border, central dark keyhole with a brass rim, small warm glass indicator at the top, four corner screws, aged brass with dark patina, warm top-left light and subtle teal rim, physical door hardware, centered, isolated on transparent background, no text, no logo, no background, 2:3.
```

**Negative extra:** `modern keyhole, plastic, cartoon, text, logo, multiple keyholes, background`.

**Generación:** 2:3; 512×768; 3 variantes. La placa debe ser vertical y legible a 100 px de alto.

**Post-proceso:** quitar fondo; si el ojo de la cerradura no es negro profundo, oscurecerlo en Photopea.

---

### `cilindro-cerradura.png` — 768×960

**Ruta:** IA o 3D/vector web. **Uso:** cerrojo principal.

```text
Precision noir game asset, front view of a heavy brass and steel lock cylinder mounted on a rectangular brass plate, concentric machined rings, visible pin chambers around the top, dark keyway in the center, small red indicator window at the bottom, aged metal with fine scratches, warm key light from top-left, cool teal rim, physical high-security lock, centered, isolated on transparent background, no text, no logo, no key, 4:5.
```

**Negative extra:** `padlock, modern lock, plastic, cartoon, text, logo, key inserted, hands, background`.

**Generación:** 4:5; 768×960; 4 variantes. El ojo de la cerradura debe quedar centrado; el perno va aparte.

**Post-proceso:** quitar fondo; el LED rojo se puede reemplazar por un punto HTML/CSS para que cambie a teal al abrir.

---

### `carrete-cobre.png` — 1024×1024

**Ruta:** IA o icono web. **Uso:** herramienta de cable.

```text
Precision noir game asset, compact spool of copper wire, dark walnut end discs, thick brass axle, tightly wound copper coil with a loose wire end curling out, warm metallic highlights, subtle patina, physical workshop tool, three-quarter front view, centered, isolated on transparent background, no text, no logo, no hands, 1:1.
```

**Negative extra:** `plastic spool, yarn, rope, text, logo, background, multiple spools`.

**Generación:** 1:1; 1024×1024; 3 variantes. El extremo suelto del cable debe quedar visible.

**Post-proceso:** quitar fondo; si el cobre sale naranja neón, bajar saturación en Photopea.

---

### `contrato.png` — 1024×768

**Ruta:** IA + Photopea. **Uso:** objeto clickeable sobre la mesa.

```text
Precision noir game asset, folded ivory paper contract lying at a slight angle, visible crease, abstract handwritten lines without readable text, dark red wax seal with a subtle keyhole emboss, thin red ribbon, aged paper edges, warm top-left light, soft contact shadow, physical prop, isolated on transparent background, no readable text, no logo, 4:3.
```

**Negative extra:** `readable text, modern paper, white background, logo, hands, envelope, multiple papers`.

**Generación:** 4:3; 1024×768; 3 variantes. No pedir texto real; las líneas deben ser abstractas.

**Post-proceso:** quitar fondo; si el lacre queda muy brillante, bajarlo; el texto del contrato va en el overlay HTML, no en el sprite.

---

### `nota-pista.png` — 768×768

**Ruta:** IA o composición de iconos web. **Uso:** objeto clickeable de pista.

```text
Precision noir game asset, small folded ivory note with a brass magnifying glass resting on top, dark leather handle, glass lens with a subtle teal reflection, abstract pencil marks without readable text, warm light, physical clue prop, centered, isolated on transparent background, no text, no logo, 1:1.
```

**Negative extra:** `readable text, modern sticky note, plastic magnifier, cartoon, logo, hands, background`.

**Generación:** 1:1; 768×768; 3 variantes. La lupa puede ser un objeto separado si la composición sale mal.

**Post-proceso:** quitar fondo; si la lupa tapa toda la nota, separarla en Photopea.

---

### `libreta.png` — 768×768

**Ruta:** IA o icono web. **Uso:** objeto clickeable de bitácora.

```text
Precision noir game asset, small dark leather notebook with a brass clasp and a slim pencil, worn edges, cream page block, subtle embossed art deco border, warm top-left light, cool teal edge, physical journal prop, three-quarter view, isolated on transparent background, no text, no logo, 1:1.
```

**Negative extra:** `modern notebook, spiral binding, text, logo, background, multiple books`.

**Generación:** 1:1; 768×768; 3 variantes.

**Post-proceso:** quitar fondo; si el lápiz sale flotando, borrarlo o corregirlo.

---

### `llave-1.png` — 512×1024

**Ruta:** IA o vector web. **Uso:** llave 1; las otras tres se recolorean.

```text
Precision noir game asset, long ornate brass key seen vertically, art deco bow with a circular opening, engraved shaft, complex bit at the bottom, aged brass with warm highlights, a narrow enamel band in the middle in pale gold, a small engraved numeral 1 on the shaft, physical key, centered, isolated on transparent background, no logo, no background, no keychain, 1:2.
```

**Negative extra:** `modern key, plastic, cartoon, multiple keys, keychain, text, logo, background, wrong number`.

**Generación:** 1:2; 512×1024; 4 variantes. Si el número sale mal, no importa: se puede borrar y poner en HTML/Photopea.

**Post-proceso:** elegir la mejor silueta; duplicar y recolorear la banda de esmalte para `llave-2` (teal), `llave-3` (coral) y `llave-4` (violeta). No generes cuatro llaves distintas: tienen que compartir la misma silueta.

---

### `placa-mecanismo.png` — 2048×1280

**Ruta:** híbrido. **Uso:** base de la placa; los textos y tornillos se ajustan en Photopea.

```text
Precision noir game asset, large rectangular aged brass mechanism plate, art deco beveled border, brushed metal, dark patina, corner screws with slots, subtle engraved measurement grid, a blank dark nameplate at the top center and a blank serial plate at the bottom left, warm brass highlights, deep brown shadows, elegant machined surface, slight top-left light, isolated on transparent background, no text, no letters, no logos, no gears, no cables, no clutter, 16:10.
```

**Negative extra:** `text, letters, numbers, logo, gears, cables, screws missing, perspective, modern panel, neon`.

**Generación:** 16:10; 2048×1280; 2–3 variantes. La placa debe quedar oscura para que los engranajes resalten.

**Post-proceso:** si la IA agrega texto, borrarlo; agregar tornillos y las placas en blanco en Photopea; el HTML superpone “Banco del Llano · Caja 01” y “N.º 0147”.

---

## 5. Si la IA falla

- **Engranaje asimétrico, con texto o dientes irregulares:** descartalo. Usá un SVG de [`GUIA-ASSETS-WEB.md`](GUIA-ASSETS-WEB.md) o el SVG provisional.
- **Llave con números raros:** borrá el número y ponelo en HTML/Photopea.
- **Personaje con manos o pies mal:** regenerá; no intentes arreglar anatomía compleja en Photopea.
- **Placa con texto:** borralo; el texto va en HTML.
- **Fondo demasiado ocupado en el centro:** recorta u oscurece el centro; la placa tapa esa zona.

## 6. Checklist de salida

- [ ] Fondo transparente real o fondo plano fácil de quitar.
- [ ] Sin texto, logos ni marcas de agua.
- [ ] Luz cálida desde arriba a la izquierda y teal desde la derecha.
- [ ] Paleta latón/ivory/teal/coral, sin neón ni pixel art.
- [ ] Silueta legible al tamaño de uso.
- [ ] Sin sombra horneada fuerte.
- [ ] Medida 2× y recorte con 4–8 % de margen.
- [ ] Nombre exacto del archivo y PNG-24 con alfa.
- [ ] Guardado en `assets/sprites/`.
- [ ] Probado con `index.html?sprites=png`.
