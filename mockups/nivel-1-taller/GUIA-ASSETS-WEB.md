# Assets para buscar en sitios web

Esta guía cubre solo los assets donde conviene usar un **vector, un icono o una textura existente** en lugar de IA: engranajes, pernos, tijeras, campanas, texturas de madera/latón y piezas de geometría exacta.

Para fondo, personaje, papel, cuero y props orgánicos, usá [`GUIA-ASSETS-IA.md`](GUIA-ASSETS-IA.md). Para el índice general y la tabla de decisión, usá [`GUIA-ASSETS.md`](GUIA-ASSETS.md).

---

## 1. Por qué estos assets van por web

La IA generativa suele fallar en objetos que deben ser **simétricos, repetibles o encajar entre sí**:

- Un engranaje con dientes irregulares se nota al girar.
- Un perno con perspectiva rara no encaja con el cerrojo.
- Una tijera con dedos o pivote mal dibujado se ve mal a tamaño de icono.
- Una textura de madera generada por IA puede tener vetas que no se repiten.

Un SVG limpio o una textura CC0 te da:

- geometría exacta;
- escala sin pérdida;
- recoloreo fácil;
- licencia clara;
- peso bajo.

---

## 2. Sitios recomendados y licencias

| Sitio | Qué tiene | Licencia | Notas |
|---|---|---|---|
| [Game-icons.net](https://game-icons.net/) | Miles de iconos SVG: engranajes, llaves, cerraduras, tijeras, campanas, lupas, libretas | **CC BY 3.0** | La mejor opción para iconos mecánicos. Requiere atribución al autor. |
| [Kenney.nl](https://kenney.nl/assets) | Packs de game assets, UI, iconos, props | **CC0** | Sin atribución. Estilo más cartoon; elegir con cuidado. |
| [SVG Repo](https://www.svgrepo.com/) | Iconos y vectores de muchos estilos | **Mixta** | Verificar la licencia de cada icono; algunos son CC0 y otros requieren atribución. |
| [OpenGameArt.org](https://opengameart.org/) | Sprites y arte de juego de la comunidad | **Mixta** | Buscar CC0 o CC BY; la calidad varía. |
| [itch.io](https://itch.io/game-assets/free) | Packs de assets indie | **Mixta** | Buscar “free”, “CC0”, “art deco”, “steampunk UI”. Revisar cada pack. |
| [CraftPix.net](https://craftpix.net/freebies/) | Assets 2D y UI para juegos | **Free license** | Revisar si permite uso comercial y modificación. |
| [Poly Haven](https://polyhaven.com/textures) | Texturas PBR, HDRIs y modelos | **CC0** | Ideal para madera, latón, cuero y metal. |
| [AmbientCG](https://ambientcg.com/) | Texturas PBR | **CC0** | Alternativa a Poly Haven; buena resolución. |
| [Flaticon](https://www.flaticon.com/) | Iconos | **Free con atribución** | Útil para iconos simples; menos estilo de juego. |
| [Freepik](https://www.freepik.com/) | Vectores e ilustraciones | **Free con atribución** | Revisar límites; no usar sin acreditar. |
| [Pixabay](https://pixabay.com/), [Unsplash](https://unsplash.com/), [Pexels](https://www.pexels.com/) | Fotos | **Free** | Solo como referencia/fondo; no son sprites. |
| [Textures.com](https://www.textures.com/) | Texturas | **Créditos free limitados** | No es 100 % gratis; revisar. |
| [Photopea](https://www.photopea.com/) | Editor | **Free** | Para recortar, recolorear, quitar fondo y componer. |
| [Photoroom](https://www.photoroom.com/) / [remove.bg](https://www.remove.bg/) | Quitar fondo | **Free limitado** | Para previews; para finales, revisar resolución/watermark. |

**Evitar:**

- Spriters Resource, rips de juegos, capturas de otros juegos.
- Assets con watermark o “editorial use only”.
- Packs sin licencia clara.
- Iconos con texto o logos.
- Fotos de stock con personas o marcas para el ladrón.

---

## 3. Tabla maestra de búsqueda

| Archivo final | Medida | Qué buscar | Prioridad |
|---|---:|---|---|
| `mesa-madera.png` | 2048×640 | textura de nogal oscuro, cuero, borde de mesa | **Web** |
| `placa-mecanismo.png` | 2048×1280 | textura de latón, panel art déco, placa con tornillos | **Híbrido** |
| `rueda-engranaje.png` | 1024×1024 | engranaje de latón, rueda dentada, SVG | **Web** |
| `perno.png` | 1024×256 | perno de acero, cerrojo, barra metálica | **Web** |
| `campana-alarma.png` | 512×512 | campana de latón, campana de alarma | **Web** |
| `tijeras.png` | 1024×512 | tijeras vintage, tijeras de sastre | **Web** |
| `engranaje-herramienta.png` | 1024×1024 | engranaje con mango, herramienta de engranaje | **Web** |
| `llave-1.png` … `llave-4.png` | 512×1024 | llave ornamentada, llave art déco, SVG | **Web o IA** |
| `bocallave-entrada.png` | 512×768 | bocallave art déco, placa de cerradura | Web si falla la IA |
| `cilindro-cerradura.png` | 768×960 | cilindro de cerradura, bombín, cerradura de latón | Web/3D si falla la IA |
| `resorte.png` | 512×1024 | resorte de latón, muelle | Web/opcional |
| `terminal.png` | 128×128 | conector de cable, terminal de latón | Web/opcional |
| `chispa.png` | 128×128 | chispa teal, VFX | Web/opcional |

---

## 4. Búsquedas y características por asset

### `mesa-madera.png` — 2048×640

**Palabras clave:**

```text
dark walnut wood texture seamless
walnut table top texture
workbench leather inlay texture
dark wood PBR texture
```

**Dónde buscar:** Poly Haven, AmbientCG, Textures.com.

**Qué mirar:**

- Textura **seamless** o al menos un corte frontal que no muestre perspectiva.
- Nogal oscuro, no roble claro ni madera pintada.
- Vetas sutiles, sin nudos gigantes.
- Si tiene cuero, que sea una banda oscura con costura, no un sofá.
- Resolución ≥ 2048 px de ancho.
- Luz neutra; la luz cálida la pone el CSS.
- Sin watermark.

**Post-proceso:** recortar a 2048×640; si la textura es cuadrada, repetirla o escalarla; oscurecer un 15–25 % para que la placa resalte; agregar un borde superior con transparencia si se quiere que se vea la escena detrás.

---

### `placa-mecanismo.png` — 2048×1280

**Palabras clave:**

```text
brass metal texture seamless
aged brass panel texture
art deco brass plate
vintage control panel brass
engraved brass texture
```

**Dónde buscar:** Poly Haven, AmbientCG, Textures.com, SVG Repo (marcos), Photopea.

**Qué mirar:**

- Latón envejecido, no dorado brillante.
- Superficie frontal o textura plana; sin perspectiva 3D.
- Espacio central relativamente limpio.
- Relación 16:10.
- Sin texto, logos ni tornillos gigantes.
- Si es una textura, que se pueda repetir.

**Post-proceso (híbrido):** usar la textura como base; agregar en Photopea:

- marco biselado;
- cuatro tornillos en las esquinas;
- placa oscura superior;
- placa serial inferior izquierda;
- surcos/rayones;
- viñeta.
El HTML superpone los textos; no los hornees.

---

### `rueda-engranaje.png` — 1024×1024

**Palabras clave:**

```text
brass gear icon
cogwheel svg
clockwork gear vector
ornate gear silhouette
gear wheel front view
```

**Dónde buscar:** Game-icons.net, SVG Repo, Kenney, OpenGameArt.

**Qué mirar:**

- **Simetría perfecta**: si no gira bien, se nota.
- 20–24 dientes parejos.
- Vista frontal, no 3/4.
- Centro con buje y agujero.
- SVG o PNG transparente.
- Sin texto, sin números, sin sombras horneadas.
- Estilo latón/steel, no cartoon ni pixel.
- Ideal: un solo color/base para recolorear.

**Post-proceso:** importar el SVG a Photopea; aplicar gradiente latón; exportar PNG 1024×1024 con alfa. El numeral I/II lo pone el HTML.

---

### `perno.png` — 1024×256

**Palabras clave:**

```text
steel latch bolt icon
door bolt side view
heavy steel bolt svg
metal bar latch
```

**Dónde buscar:** Game-icons.net, SVG Repo, Kenney, OpenGameArt.

**Qué mirar:**

- Vista lateral, horizontal, punta a la derecha.
- Barra gruesa con chaflán.
- Acero oscuro, no plástico.
- Sin sombra horneada.
- Fondo transparente.
- Proporción 4:1.

**Post-proceso:** recortar; agregar un collar de latón si el icono es muy simple; exportar PNG con alfa.

---

### `campana-alarma.png` — 512×512

**Palabras clave:**

```text
brass alarm bell icon
vintage service bell svg
bell with striker
art deco bell
```

**Dónde buscar:** Game-icons.net, SVG Repo, Kenney, Flaticon.

**Qué mirar:**

- Campana con cúpula, base y badajo/striker.
- Latón/steel, no cartoon.
- Vista frontal o 3/4 leve.
- Sin texto, sin soporte raro.
- Transparente.

**Post-proceso:** recolorear a latón; el LED rojo puede ser HTML/CSS; exportar 512×512.

---

### `tijeras.png` — 1024×512

**Palabras clave:**

```text
vintage scissors icon
tailor scissors svg
brass scissors vector
ornate scissors side view
```

**Dónde buscar:** Game-icons.net, SVG Repo, Kenney, Flaticon.

**Qué mirar:**

- Dos hojas y dos anillas.
- Pivote central.
- Vista lateral, no abierta en ángulo raro.
- Acero + latón.
- Sin manos, sin tela.
- Transparente.

**Post-proceso:** recortar; agregar brillo en el pivote; exportar 1024×512.

---

### `engranaje-herramienta.png` — 1024×1024

**Palabras clave:**

```text
gear crank icon
cog tool vector
mechanism gear handle
brass gear tool
```

**Dónde buscar:** Game-icons.net, SVG Repo, Kenney.

**Qué mirar:**

- Engranaje con mango o encastre.
- Latón/madera, no plástico.
- Vista frontal.
- Sin texto.
- Transparente.

**Post-proceso:** recolorear; el candado de “bloqueado” lo pone el CSS, no el sprite.

---

### `llave-1.png` … `llave-4.png` — 512×1024

**Palabras clave:**

```text
ornate brass key svg
art deco skeleton key
vintage key vector
long key silhouette
```

**Dónde buscar:** Game-icons.net, SVG Repo, Kenney, OpenGameArt.

**Qué mirar:**

- Silueta vertical, bow ornamentado, asta larga y paletón claro.
- SVG o PNG transparente.
- Una sola silueta para las cuatro; solo cambia el color del esmalte.
- Sin texto, sin llavero, sin etiqueta.
- Legible a 40 px de ancho.

**Post-proceso:** elegir una; duplicar y recolorear la banda de esmalte en Photopea: 1 latón, 2 teal, 3 coral, 4 violeta. Exportar 512×1024 con alfa.

---

### `bocallave-entrada.png` — 512×768 (si la IA falla)

**Palabras clave:**

```text
art deco keyhole escutcheon
brass door keyhole plate
vintage keyhole svg
ornate keyhole vector
```

**Dónde buscar:** SVG Repo, Game-icons.net, Flaticon, Freepik.

**Qué mirar:**

- Placa vertical con arco.
- Ojo de cerradura negro.
- Tornillos en las esquinas.
- Latón envejecido.
- Sin texto.
- Transparente.

**Post-proceso:** quitar fondo; oscurecer el ojo; exportar 512×768.

---

### `cilindro-cerradura.png` — 768×960 (si la IA falla)

**Palabras clave:**

```text
brass lock cylinder icon
pin tumbler lock front view
vintage lock mechanism vector
keyway lock svg
```

**Dónde buscar:** SVG Repo, Game-icons.net, OpenGameArt, modelos 3D gratuitos.

**Qué mirar:**

- Vista frontal.
- Ojo de cerradura central.
- Anillos concéntricos.
- Pines visibles.
- Sin llave insertada.
- Sin texto.
- Transparente.

**Post-proceso:** recortar; el LED y el perno van aparte; exportar 768×960.

---

### `resorte.png` — 512×1024 (opcional)

**Palabras clave:**

```text
brass coil spring icon
clockwork spring svg
vintage spring mechanism
```

**Dónde buscar:** SVG Repo, Game-icons.net, OpenGameArt.

**Qué mirar:** espiral clara, latón/steel, vertical, sin texto, transparente.

---

### `terminal.png` — 128×128 (opcional)

**Palabras clave:**

```text
brass cable terminal icon
banana plug connector
vintage electrical connector
```

**Dónde buscar:** SVG Repo, Game-icons.net, Flaticon.

**Qué mirar:** conector pequeño, latón/steel, vista superior o lateral, transparente.

---

### `chispa.png` — 128×128 (opcional)

**Palabras clave:**

```text
teal spark vfx
electric spark icon
glowing particle png
```

**Dónde buscar:** OpenGameArt, itch.io, SVG Repo.

**Qué mirar:** chispa teal/blanca, fondo transparente, sin texto. Es un VFX; si no aparece, se puede hacer con CSS/SVG.

---

## 5. Checklist antes de descargar

- [ ] La licencia permite uso y modificación. CC0 > CC BY > free con atribución.
- [ ] No es un rip de un juego comercial.
- [ ] No tiene watermark, texto ni logo.
- [ ] Es SVG o PNG con transparencia.
- [ ] La resolución alcanza para 2× (1024+ para props, 2048+ para texturas/fondo).
- [ ] La luz y la paleta se parecen a “precisión noir”.
- [ ] La silueta se lee a 64 px.
- [ ] El engranaje es simétrico y tiene dientes parejos.
- [ ] La llave se puede recolorear.
- [ ] La textura de madera/latón es seamless o se puede recortar sin perspectiva.
- [ ] Guardaste el crédito: autor, URL, licencia y fecha.

## 6. Cómo limpiar y preparar el archivo

1. Abrir el SVG/PNG en **Photopea**.
2. Recortar al contenido; dejar 4–8 % de margen.
3. Recolorear con capas de ajuste; no destruir el original.
4. Quitar fondo con máscara o varita mágica; revisar bordes.
5. Exportar **PNG-24 con alfa** al tamaño recomendado.
6. Guardar con el nombre exacto en `assets/sprites/`.
7. Probar `index.html?sprites=png`.
8. Anotar el crédito en `CREDITS.md`.

## 7. Si no encontrás el asset

- **Engranaje/perno/tijera/campana:** construí una versión simple en SVG o Photopea; es más rápido que pelear con IA.
- **Textura de madera/latón:** generá una textura con IA solo como base y corregí en Photopea; no la uses tal cual si se nota el patrón.
- **Bocallave/cerradura:** usá el prompt de `GUIA-ASSETS-IA.md` y limpiá el resultado.
- **Llave:** usá el prompt de la llave en `GUIA-ASSETS-IA.md` o un SVG; no generes cuatro.
- **Fondo/ladrón:** IA; el stock no va a mantener la dirección visual.
