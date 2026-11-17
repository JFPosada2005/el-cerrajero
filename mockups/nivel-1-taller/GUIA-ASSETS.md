# Guía de assets — índice y decisión

La guía se dividió en dos rutas para que no mezcles prompts de IA con búsquedas de banco:

| Documento | Para qué sirve |
|---|---|
| [`GUIA-ASSETS-IA.md`](GUIA-ASSETS-IA.md) | Assets donde la IA tiene ventaja: fondo, ladrón, papel, cuero, props orgánicos. Incluye prompts completos en inglés. |
| [`GUIA-ASSETS-WEB.md`](GUIA-ASSETS-WEB.md) | Assets donde conviene un SVG/textura: engranajes, pernos, tijeras, campanas, madera, latón. Incluye keywords y características. |

## Regla rápida

- **IA** si el asset necesita **atmósfera, material, desgaste o silueta de personaje**.
- **Web/SVG** si el asset necesita **simetría, geometría exacta, repetición o recoloreo**.
- **Híbrido** si la base puede ser IA o textura, pero los detalles geométricos se agregan en Photopea.

---

## Tabla maestra

| Archivo final | Medida | Ruta recomendada | Guía |
|---|---:|---|---|
| `fondo-banco.png` | 2048×1280 | **IA** | IA |
| `ladron.png` | 1024×2048 | **IA** | IA |
| `contrato.png` | 1024×768 | **IA + Photopea** | IA |
| `nota-pista.png` | 768×768 | **IA o iconos web** | IA / Web |
| `libreta.png` | 768×768 | **IA o icono web** | IA / Web |
| `bocallave-entrada.png` | 512×768 | **IA o vector web** | IA / Web |
| `cilindro-cerradura.png` | 768×960 | **IA o 3D/vector web** | IA / Web |
| `carrete-cobre.png` | 1024×1024 | **IA o icono web** | IA / Web |
| `llave-1.png` | 512×1024 | **IA o SVG web** | IA / Web |
| `llave-2.png` | 512×1024 | Recolorear `llave-1` | IA |
| `llave-3.png` | 512×1024 | Recolorear `llave-1` | IA |
| `llave-4.png` | 512×1024 | Recolorear `llave-1` | IA |
| `placa-mecanismo.png` | 2048×1280 | **Híbrido** | IA / Web |
| `mesa-madera.png` | 2048×640 | **Textura web** | Web |
| `rueda-engranaje.png` | 1024×1024 | **SVG/vector web** | Web |
| `perno.png` | 1024×256 | **SVG/vector web** | Web |
| `campana-alarma.png` | 512×512 | **SVG/vector web** | Web |
| `tijeras.png` | 1024×512 | **SVG/vector web** | Web |
| `engranaje-herramienta.png` | 1024×1024 | **SVG/vector web** | Web |
| `resorte.png` | 512×1024 | SVG/vector web (opcional) | Web |
| `terminal.png` | 128×128 | SVG/vector web (opcional) | Web |
| `chispa.png` | 128×128 | VFX web/SVG (opcional) | Web |

---

## Por qué esta división

**La IA es mejor para:**

- fondo del banco: luz, niebla, composición;
- ladrón: silueta, ropa, actitud;
- papel, lacre, cuero, madera desgastada;
- una llave ornamentada;
- una placa de latón base con textura.

**La web es mejor para:**

- engranajes: dientes parejos y simetría;
- pernos, tijeras, campanas: geometría clara y legible;
- texturas de madera/latón: resolución y repetición;
- iconos que después vas a recolorear;
- cualquier pieza que deba girar o encajar.

**La IA suele fallar en:**

- engranajes simétricos;
- manos y pies del personaje;
- textos y números (mejor ponerlos en HTML/Photopea);
- placas con tornillos exactos;
- texturas seamless.

---

## Cómo usar las guías

1. Abrí `GUIA-ASSETS-IA.md` y generá los assets de la ruta IA. Empezá por el fondo, el ladrón y la llave base.
2. Abrí `GUIA-ASSETS-WEB.md` y buscá los SVG/texturas. Empezá por el engranaje, la madera y la placa.
3. Limpiá todo en Photopea: recorte, alfa, recoloreo y tamaño exacto.
4. Guardá los PNG en `assets/sprites/` con el nombre exacto.
5. Probá:

```text
index.html?sprites=png
```

Si falta un PNG, el mockup conserva el SVG provisional.

---

## Nombres exactos

```text
fondo-banco.png
mesa-madera.png
placa-mecanismo.png
rueda-engranaje.png
bocallave-entrada.png
cilindro-cerradura.png
perno.png
campana-alarma.png
llave-1.png
llave-2.png
llave-3.png
llave-4.png
tijeras.png
carrete-cobre.png
engranaje-herramienta.png
ladron.png
contrato.png
nota-pista.png
libreta.png
```

Opcionales: `resorte.png`, `terminal.png`, `chispa.png`.

---

## Reglas de integración

- Props: PNG-24 con alfa, 2× de la medida final, 4–8 % de margen transparente.
- Fondo: full-bleed, sin transparencia, 2048×1152 (16:9) o 2048×1280 (16:10); el mockup usa 2048×1152.
- Mesa: PNG con transparencia arriba del borde superior; abajo, madera.
- Placa: PNG con transparencia fuera del rectángulo; placas de texto en blanco para superponer en HTML.
- Llaves: una sola silueta; las variantes 2–4 se recolorean.
- Engranaje: simétrico, centrado, sin texto; el numeral I/II va en HTML.
- Sin sombras horneadas fuertes: el CSS ya aplica sombras.
- Sin texto, logos, watermarks ni rips de juegos.

**Estado del mockup:** el fondo y la textura de la placa se optimizaron a JPG; los props con transparencia siguen en PNG. La placa se compone de `placa-textura.jpg` + `placa-marco.svg`. Los originales PNG quedan en las carpetas del escritorio.

## Créditos

Anotá en `CREDITS.md`:

- nombre del archivo;
- herramienta o sitio;
- autor;
- URL;
- licencia;
- fecha.

Para Game-icons.net, la licencia CC BY 3.0 exige atribución. Para Kenney y Poly Haven, CC0. Para SVG Repo, OpenGameArt e itch.io, revisá cada archivo.
