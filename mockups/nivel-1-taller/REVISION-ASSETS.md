# Revisión de assets recibidos

Fecha: 2026-11-17.

Se revisaron las dos carpetas del escritorio:

- `assets IA/`
- `assets WEB/` (incluidos los ZIP)

Objetivo: separar lo que realmente sirve para “precisión noir”, adaptarlo al mockup y documentar por qué el resto no se usó.

---

## 1. Assets IA integrados

Todos los PNG de IA tenían fondo transparente real (alpha en las esquinas) salvo el fondo, que es una escena opaca. Se recortaron los márgenes transparentes, se agregó un 4 % de padding y se optimizaron.

| Archivo | Original | Uso en el mockup | Ajuste aplicado |
|---|---:|---|---|
| `fondo-banco.png` | 2752×1536 | Fondo de escena | Reencuadrado a 2048×1152 y optimizado a `fondo-banco.jpg` |
| `ladron.png` | 1024×1024 | Personaje | Recorte al cuerpo, 387×960; se usa a la derecha |
| `bocallave-entrada.png` | 1696×2528 | Entrada | Recorte + reducción a 525×900 |
| `cilindro-cerradura.png` | 1856×2304 | Cerrojo | Recorte + reducción a 597×900 |
| `carrete-cobre.png` | 1024×1024 | Herramienta cable | Recorte a 841×900 |
| `contrato.png` | 1024×1024 | Objeto contrato | Recorte a 736×900 |
| `libreta.png` | 1024×1024 | Objeto bitácora | Recorte a 900×704 |
| `llave-1.png` | 1024×1024 | Llave 1 | Recorte a 250×820 |
| `nota-pista (con fondo).png` | 1024×1024 | Objeto pista | Se quitó el fondo negro y se recortó a 900×766 |
| `placa-mecanismo.png` | 1024×1024 | Placa | Se usó su superficie interior para `placa-textura`; el marco se rehizo en SVG |
| `engranaje.png` | 2048×2048 | Ruedas de memoria I y II | Recorte y reducción a `rueda-engranaje.png` (1022×1024) |
| `alarma.png` | 2048×2048 | Campana de alarma | Recorte y reducción a `campana-alarma.png` (508×512) |
| `tijeras.png` | 1456×720 | Herramienta de corte y cursor | Recorte y reducción a `tijeras.png` (800×369) |
| `cable.png` | 2752×1536 | Cables del mecanismo | Recorte a 1600×480; se usa como arco entre piezas, no como sprite recto |

### Llaves 2–4

Se generaron a partir de `llave-1.png` recoloreando la banda de esmalte en HSV:

- `llave-2.png`: teal.
- `llave-3.png`: coral.
- `llave-4.png`: violeta.

La silueta es idéntica. Los distintivos numéricos HTML se retiraron: partían visualmente la llave en el llavero. La identificación queda en el `aria-label`, el color de la banda y la posición dentro del riel.

### Cursor de llave

Se recortó el arco de la llave para `llave-cursor.png` (126×200). Así el cursor no es una llave de 46 px de alto con el mango fuera de pantalla.

### Nota-pista

La versión `nota-pista.png` era solo la lupa. La versión `(con fondo)` era una libreta + lupa sobre negro. Se hizo un flood fill desde los bordes para volver transparente el fondo negro, se erosionó 1 px el alpha para quitar el borde negro y se recortó. Queda un prop completo de pista.

### Placa

La placa de IA es un panel vertical con marco y dos placas. Para no deformarla en el formato horizontal del taller:

- se extrajo la superficie interior (sin marcos ni placas);
- se ajustó a 1200×746 (16:10);
- se le dio un tono bronce/latón y una pátina teal;
- se guardó como `placa-textura.jpg`;
- el marco, tornillos y placas se rehicieron en `placa-marco.svg`, un SVG transparente que se superpone a la textura.

Así se usa el material de la placa sin perder el layout horizontal del mecanismo.

---

## 2. Assets WEB revisados

| ZIP | Contenido | Veredicto |
|---|---|---|
| `Cog Wheels - Gears (rueda-engranaje).zip` | 110 PNG de engranajes bronce/plata, 26–59 px, y spritesheets | **No usado.** Es pixel art de baja resolución; al escalarlo a 130 px se rompe el estilo pintado. El engranaje SVG actual tiene más detalle y gira mejor. |
| `gothic_coffee_table_4k.blend (mesa-madera).zip` | `.blend` + texturas difusa/normal/roughness 4K | **No usado.** Es un modelo 3D y un atlas de textura gótico, no una superficie de mesa lista. Sin Blender no se puede renderizar; el atlas es demasiado recargado para el banco. |
| `KayKit_RPGToolsBits_1.0_FREE (tijeras y mas herramientas).zip` | 206 modelos FBX/glTF/OBJ y texturas; incluye `scissors.fbx` | **No usado.** Estilo cartoon/low-poly, incompatible con la dirección noir. Además requiere Blender para renderizar. |
| `Metal Textures (placa-mecanismo).zip` | 404 texturas de metal de 64×64 (JustMetal, Grassed, Old, Rusty) | **No usado.** 64×64 es demasiado poco para una placa de 1200 px; se vería repetido y pixelado. La textura de la IA tiene mejor patina. |
| `old-screw-nail-heads-set-metal-bolts-rivets (pernos).zip` | `3275.jpg`, hoja de cabezas de tornillos sobre damero | **No usado.** Es un JPG con fondo damero, no recortes transparentes. La placa ya tiene tornillos en el marco SVG. |

### Conclusión de la revisión WEB

Los packs no eran sprites listos para este estilo: eran pixel art, modelos 3D cartoon, texturas de 64 px o un atlas de mesa. Con la segunda tanda de IA se reemplazaron las piezas mecánicas más visibles —engranajes, campana, tijeras y cable— y quedaron en SVG solo el perno, la mesa y el marco de la placa.

Si más adelante se quiere subir el realismo del perno o de la mesa, el siguiente paso sería renderizar modelos 3D con Blender o encargar esos sprites en el mismo estilo de la IA.

---

## 3. Piezas que siguen en SVG

| Archivo | Estado | Por qué |
|---|---|---|
| `perno.svg` | Se usa | Barra de acero con collar de latón; el asset WEB no tenía un perno adecuado |
| `mesa-madera.svg` | Se usa | Superficie de banco oscura y limpia; el .blend gótico no era un sprite |
| `placa-marco.svg` | Nuevo | Marco de bronce, tornillos y placas sobre la textura de la IA |

Los SVG de engranajes, campana, tijeras y engranaje-herramienta quedan como respaldo, pero el mockup ya usa los PNG de IA. `cable-braid.png` se descartó: el cable se resuelve con la imagen completa recortada en arco.

---

## 4. Ajustes técnicos aplicados

- Recorte de alpha y padding del 4 % en todos los props.
- Fondo y textura de placa convertidos a JPG para bajar peso; los props con transparencia siguen en PNG-24.
- Llaves 2–4 recoloreadas desde una sola silueta.
- Números de llave en HTML para no hornear cuatro imágenes distintas.
- Cursor de llave recortado al arco.
- Nota-pista con fondo eliminado por flood fill.
- Placa compuesta por textura + marco SVG.
- Placa y fondo con versiones optimizadas; los PNG originales quedan en las carpetas del escritorio.
- El mockup sigue sin tocar `src/`, la lógica ni los tests del juego.

## 5. Pendiente / opcional

- Un perno pintado con la misma luz de la IA.
- Una mesa de nogal fotorrealista recortada en primer plano.
- Si se consiguen, se guardan con los mismos nombres y el mockup los toma sin cambiar la estructura.
