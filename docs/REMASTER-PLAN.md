# El Cerrajero — Auditoría de diseño y plan de remasterización

> **Rama:** `feat/t7-mockup-taller-nivel-1` · **HEAD auditado:** `7eb0a3f` · **Fecha:** 2026-11-17.
>
> **Fuente y recuperación.** Este documento reconstruye el informe del verificador de diseño que se canceló después de entregarlo. El agente no dejó checkpoint en `$env:TEMP` ni en Engram; la copia de referencia es este `.md`. Las capturas de evidencia quedaron en `$env:TEMP\opencode\cerrajero-audit-43d84a08\shots\` (temporal).
>
> **Alcance.** Solo lectura: no se modificó el workspace. La lógica del juego sigue congelada. Cualquier cambio que necesite tocarla está en la sección 8 y requiere autorización del owner.

## Resumen ejecutivo

La dirección visual del mockup funciona y vale la pena continuarla. El problema es que el mockup **no puede integrarse al juego tal como está** por tres razones:

1. **El objetivo no se ve en pantalla.** La regla del contrato solo aparece si se abre el papel.
2. **Los cables no sirven para el juego real.** No muestran dirección, se tapan con las piezas y el código mezcla los dos sentidos de un mismo par de piezas.
3. **La celda y el engranaje del contrato 02 son el mismo dibujo.** En el nivel 2 eso confunde la pieza nueva con las celdas.

Además, para montar la mesa del mockup dentro del juego hay que tocar `renderWorkshop` y `renderDrumWorkshop`. `docs/LOGIC.md` §10 los marca como congelados, mientras que `AGENTS.md` permite tocar la capa visual de `main.js`. Esa contradicción la tiene que resolver el owner antes de integrar (ver Aut-1).

### Cómo se verificó

- Edge headless con perfil temporal, a 320, 360, 390, 768, 1024, 1280×600, 1366 y 1440 px. Capturas, medición de DOM y red, y gestos táctiles.
- Recorrido del juego real desde el título y el mapa hasta los niveles 1 a 5. El progreso se simuló en el `localStorage` del perfil temporal.
- `npm test` en una copia del proyecto: **253 pruebas pasan, 0 fallan**.

---

## 1. Dirección de diseño actual

### Qué propone el mockup

Es “precisión noir” llevado a una mesa de trabajo:

- **Materiales:** latón envejecido, nogal, papel ivory con lacre y cuero.
- **Luz:** cálida desde arriba a la izquierda y un borde teal a la derecha (`styles.css:370-380`).
- **Composición:** fondo a pantalla completa, placa del mecanismo de 900×560 al centro como protagonista, ladrón a la derecha, papeles abajo a la izquierda y bandeja de inventario.
- **Tipografía:** Bodoni Moda para títulos, Jost para la interfaz e IBM Plex Mono para las lecturas técnicas (`styles.css:1-54`).
- **Movimiento:** el cable se estira en 400 ms, la rueda gira en 650 ms y el corte dura 300 ms.
- **Tono:** silencioso, con ficción de taller.

### Qué funciona

- La placa como héroe y el ladrón presente en la escena: se entiende el taller de un vistazo (captura a 1440).
- La línea de alarma con la campana es una buena metáfora de “la llave cae a la alarma”.
- Las etiquetas de los cables combinan número y color (`app.js:519-532`).
- Los papeles como objetos que se abren encajan con la ficción.
- El sonido está apagado por defecto y es sintetizado, sin archivos.
- Las ventanas modales bloquean el fondo y atrapan el foco, y Esc las cierra (`app.js:800-891`).
- Con movimiento reducido, la animación del ladrón se apaga.

### Qué conviene refinar

La primera lectura de la pantalla tendría que ser el objetivo y la llave activa (`VISUAL-DESIGN.md` §1). Hoy es la escena. El texto es diminuto y los cables, aunque lindos, no se pueden leer como mecanismo.

### Desvíos respecto de `VISUAL-DESIGN.md`

| Tema | Qué dice `VISUAL-DESIGN.md` | Qué hace el mockup |
|---|---|---|
| Fuentes | Fraunces + Inter (§4) | Bodoni Moda + Jost + Plex Mono, 103 KB en total. Entra en el presupuesto, pero faltan los archivos de licencia OFL |
| Imágenes | “Solo SVG y CSS; nada de imágenes raster” (§10) | 8,1 MB de imágenes por carga |
| CSS | Menos de 20 KB | 38,6 KB |
| Contrato | Siempre visible, “nunca se colapsa” (§7) | Solo como papel que hay que abrir |
| Arrastrar | No se usa (§7) | Se arrastra desde el inventario; hay alternativa con clic |
| Animación infinita | Prohibida (§1, §8) | El ladrón respira en bucle (`styles.css:404`) |
| Escala de texto | Mínimo 12 px | Textos de 7 a 10 px |
| Color de fondo `--bg` | `#0B0F14` | `#070b10` (`styles.css:35`) |
| Llave activa | Anillo teal | Anillo latón (`styles.css:1192-1208`) |
| Aviso flotante | 4 s, arriba a la derecha | 2,4 s, abajo al centro |
| Ventana modal | 480 px | 540 px |
| Animaciones | Solo `transform` y `opacity` | Anima filtros (`part-flash`, `.scene`); 26 elementos con filtro en reposo |

---

## 2. Auditoría del nivel 1 (mockup)

### Fortalezas

- La jerarquía de la escena y el lenguaje de los objetos.
- Las etiquetas de los cables.
- Un solo botón primario: Ensayo.
- Foco atrapado y Esc en los papeles.
- Áreas táctiles de 44 px en casi todo; la única excepción es la campana.
- No hay scroll horizontal de la página entre 320 y 1440.
- Las fuentes son propias del proyecto y cargan bien.
- Sin errores en consola.

### Corregir

#### P0 — Bloquean la integración

| ID | Problema | Evidencia | Corrección |
|---|---|---|---|
| M1 | El objetivo no se ve; el contrato solo aparece al abrir el papel | `index.html:26-30,204-214`; captura a 1440 | Ficha fija “Abre solo con 1 · 2 · 3” en el encabezado o sobre la placa, y el papel para el detalle |
| M2 | Los cables no muestran dirección y se tapan con las piezas. El cable 2 de Entrada al Cerrojo pasa detrás de la rueda II y parece “Entrada → Rueda II” | `cables-crop.png`; `app.js:429-453` (la curva solo revisa el punto medio) | Terminal con flecha en el extremo de destino y una curva que esquive las piezas |
| M3 | El modelo de cables no coincide con el juego. `pairKey` ordena los extremos (`app.js:351-353`): conectar Rueda I → Entrada borró el cable Entrada → Rueda I. Tampoco permite un cable con varias llaves (1,2), y el doble clic sobre la misma pieza cancela (`app.js:340-344`), cuando en el nivel 2 eso es el engranaje | Comprobado en el navegador | Agrupar igual que `graphEditor` (origen, destino, resorte, pila) y cancelar con Esc |
| M4 | Texto de 7 a 10 px: encabezado, placa, nota del mockup, Probar/Ensayo a 9 px (`styles.css:1319`). La nota del mockup tiene contraste 2,81:1. A 1280×600, las etiquetas de los cables quedan en unos 8 px reales | Medición a 1440 | Escala 12/14/16/18/22; botones de 14–16 px en minúscula normal |
| M5 | El color es la única señal visible de cada llave: los números HTML se retiraron (`REVISION-ASSETS.md:43`). Además, `llave-2/3/4.png` tienen grabado un “1” porque se recolorearon desde `llave-1` | `llave-3.png` | Volver a exportar las llaves sin número y agregar una chapa numerada HTML de 14 px o más, siempre visible |
| M6 | 8,1 MB de imágenes en 27 pedidos (8,29 MB en total). Las imágenes miden entre 4 y 12 veces su tamaño en pantalla: libreta 12×, carrete 11×, nota-pista 10,8×, tijeras 10,5×, campana 7,2×, rueda 6,7× (1,27 MB para 153 px) | Medición de red y DOM | Exportar en WebP al doble del tamaño en pantalla; estimado menos de 1 MB, falta medirlo |
| M7 | En el celular, un gesto de scroll dispara acciones. Deslizar en vertical sobre la llave 3 (a 360×740) no movió la página, cambió la llave activa y, al soltar sobre la Entrada, mostró “La llave entra en la entrada.” | `app.js:924-964`; `touch-action: none` en `styles.css:1156` | Arrastrar solo con mouse o lápiz, con umbral de 8 px; en pantallas táctiles, solo clic y clic |
| M8 | Las llaves tienen comportamientos que el juego no tiene: elegir una llave cambia la herramienta a “llave”; la llave sobre una rueda la gira y sobre el cerrojo lo abre (`app.js:196-220,308-320`). Probar siempre abre el perno (`app.js:767-771`). Así se enseña algo falso | Lectura del código | La llave elige el valor del próximo cable y Probar refleja el resultado real |
| M9 | El contenido de ejemplo contradice la lógica. La bitácora dice “Llave 1-1: la alarma quedó armada” (`index.html:232`), pero con el mecanismo inicial `11` abre: `1` lleva a la Celda 1 y otro `1` al Cerrojo (`level1.js:40-42`; `DESIGN.md` §8 lo marca como intruso). La pista 2 dice “Hay un cable de más”, y los datos dicen “Falta un cable y hay dos de más” (`level1.js:31,66-69`) | Lectura de datos | Usar intro, hints y las líneas del ladrón tal como están en los datos |

#### P1

| ID | Problema | Evidencia | Corrección |
|---|---|---|---|
| M10 | El cable enfocado con teclado no muestra contorno, solo un brillo casi invisible | `styles.css:801-811`; `focus-cable.png` | Contorno teal de 3 px |
| M11 | Barras de scroll en los papeles: `.paper` está rotado −0,35° dentro de un contenedor con scroll | `styles.css:1392-1397,1450`; el contrato mide 225 px en un espacio de 223 a 1440×900, 1280×600 y 844×390 | Rotar el contenedor exterior y no el papel |
| M12 | En el celular, el ladrón queda tapado por la placa y el fondo se corta al desplazar: la escena cubre de −351 a 17 px y el ladrón de −80 a 12 px | `styles.css:1782-1812`; `preview-390.png` está desactualizado | Sacar el fondo y el ladrón de la zona que se desplaza; en el celular, el ladrón como retrato en el encabezado |
| M13 | La celda está dibujada como rueda dentada (`rueda-engranaje.png`) y la herramienta “Engranaje · contrato 02” usa el mismo dibujo. Además el mockup dice “Rueda de memoria I” y los datos dicen “Celda 1” | `index.html:108-118,174-176` | Celda = caja de relé con visor; el dibujo dentado queda solo para el bucle |
| M14 | Animación infinita del ladrón y filtros animados | `styles.css:404,991-998,367` | Brillos como capas que cambian de opacidad; ladrón quieto en reposo |
| M15 | `?sprites=png` produce 5 errores 404: `mesa-madera`, `fondo-banco`, `placa-textura`, `placa-marco`, `perno` | Medición de red | Quitar ese modo o limitarlo a una lista de nombres que existan |
| M16 | La ranura punteada entre I y II (`index.html:92-94`) muestra la solución antes de que el ladrón la marque | Lectura del HTML | Mostrarla solo con la pista 2, o sacarla |
| M17 | Con teclado se recorre todo el mecanismo antes de llegar a las herramientas | Orden medido | Encabezado → contrato → inventario → mecanismo → acciones |
| M18 | La bitácora es una ventana que tapa el mecanismo, así que no se puede leer la línea del ladrón mientras se ve la repetición | Captura | Mostrar la última entrada como tira debajo de la placa y la libreta completa como panel lateral |
| M19 | La campana mide 40×41 a 1280×600 | Medición | 44 px como mínimo |

#### P2

- **M20:** `user-select: none` en toda la página y selección transparente (`styles.css:66-69,96-99`). No se puede seleccionar el texto del contrato.
- **M21:** el cursor propio esconde el nativo (`styles.css:334-344`) y se mueve con `left/top` (`app.js:222-229`). Conviene moverlo con `transform`.
- **M22:** el grosor del cable depende de su largo por el escalado uniforme (`README.md:76`). En `cables-crop.png`, el cable corto es fino y el largo, grueso.
- **M23:** “Reparar” en el mockup y “Reparación” en el juego (`main.js:52-57`). Hay que unificar.
- **M24:** la indicación del escenario, de 9 px, se esconde a los 6,2 s (`app.js:1026`), y el aviso flotante dura 2,4 s.

### Añadir

| ID | Qué agregar | Prioridad |
|---|---|---|
| N1 | Ficha de objetivo siempre visible + indicador “Llave activa: 1” | Imprescindible |
| N2 | Mostrar el encargo (`puzzle.intro`) al entrar, como nota del taller, y una guía inicial de 3 pasos: llave → cable → Ensayo | Imprescindible |
| N3 | “Probar 1·2·3” mostrando qué llave se prueba (`examples.open[0]`). El pulso avanza de pieza en pieza; si falta un cable, cae a la línea de alarma y suena la campana | Imprescindible |
| N4 | Ensayo forense: el ladrón mete la llave del contraejemplo (fila de llaves), se repite el recorrido, queda una marca de ganzúa y una entrada en la bitácora. Dos finales: intruso (el perno cede) y bloqueo (la llave del cliente se traba) | Imprescindible |
| N5 | Ventanas de fase con sello: “Mecanismo reparado” → objetivo de construcción; “Bóveda asegurada” | Imprescindible |
| N6 | Fase Construir: la misma placa sin cables y con el sello “Construcción” | Imprescindible |
| N7 | Estados de carga y deshabilitado durante el Ensayo; estados vacíos | Deseable |
| N8 | Leyenda Entrada / Cerrojo / Alarma sobre la placa | Deseable |

---

## 3. Plan de los niveles 2–5

### Base común para todos

- El mismo escenario, encabezado, papeles, bandeja de inventario, etiquetas, avisos, ventanas, sonido y cursor.
- **Encuadre automático:** la vista del dibujo se ajusta al área que ocupan las celdas. Así, con 2 a 4 celdas el mecanismo entra en 360 px sin scroll. Es solo presentación: las coordenadas de las celdas vienen de los datos y no se mueven.
- **Pantallas:**
  - **Escritorio (1100 px o más):** encabezado de 56–64 px, placa protagonista con la ficha del contrato fija, inventario de 112–124 px y bitácora como panel lateral.
  - **Tableta:** encabezado en dos filas, escenario al 60 % de la altura y bitácora como panel inferior.
  - **Celular:** objetivo en el encabezado, escenario con encuadre o scroll horizontal, inventario y acciones fijos abajo, papeles como paneles inferiores.

### Nivel 2 · El ascensor (Hotel Mirador)

- **Metáfora:** la sala de máquinas de un ascensor art déco. Placa de níquel y latón con un indicador de pisos semicircular arriba. Las celdas son relés; el engranaje es un piñón chico montado sobre una celda: el mecanismo “sigue escuchando”.
- **Qué cambia respecto del nivel 1:**
  - Solo dos llaves: `1` latón y `2` teal.
  - Aparecen los bucles.
  - Hay cables en los dos sentidos entre el mismo par (Cerrada ⇄ Abierta con la llave 1), así que M2 y M3 son requisito.
- **Pantallas:** 2 celdas al reparar y 3 al construir, todas en escala 1,2. En el celular entran sin scroll gracias al encuadre automático.
- **Interacción central:** herramienta Engranaje + llave + clic en una celda. `graphEditor` ya emite `onConnect(a, a)`. El piñón aparece arriba de la celda con su etiqueta (“2” o “1,2”) y gira un diente por paso.
- **Elementos:**
  - **A producir:** fondo del hotel, piñón de bucle, indicador de pisos en SVG, celda-relé (compartida con los demás niveles).
  - **Existen:** llaves 1–2 (hay que corregir el número grabado), marco SVG de la placa.
- **Movimiento y sonido:** el piñón gira 45° por paso (260 ms) y la aguja de pisos se mueve. Sonidos: campanilla al abrir y “tic” del piñón. Música opcional: jazz de lobby muy bajo.
- **Guía y ladrón:** la intro de los datos (“La celda Abierta perdió su cable de la llave 2”) más una guía: “Elegí la llave 2 y tocá dos veces la celda Abierta”. Contraejemplo `12` (bloqueo): el piso 1 se enciende y el 2 cae a la alarma.
- **Accesibilidad:** `aria-label` del tipo “Engranaje de la llave 2 en Abierta”; número visible en cada llave.
- **Rendimiento:** solo un fondo nuevo, de 200 KB o menos en WebP.
- **Se reutiliza casi todo el nivel 1.** Es nuevo: el piñón, las flechas de dirección y el indicador de pisos.
- **Dependencias de lógica:** ninguna.

### Nivel 3 · El museo

- **Metáfora:** la sala de seguridad del museo, con un ala de **Día** (luz cálida de claraboya, arriba) y un ala de **Noche** (luz teal de luna, abajo); la luz va pintada en el fondo. El bifurcador es una derivación en “Y” de latón; el resorte, un muelle en zigzag punteado y sin llave.
- **Qué cambia:**
  - De 5 a 8 celdas.
  - Herramienta nueva: Resorte (ya existe `toggleSpring`).
  - Probar enciende varias celdas a la vez.
  - La construcción hereda la rama de día.
- **Pantallas:** al construir, las celdas ocupan `y = 80–440`, así que la placa va completa en escritorio y en tableta. En el celular: scroll horizontal con celdas de al menos 56 px dibujadas y 44 px tocables. Como extra deseable, un minimapa o una lupa por ala.
- **Interacción central:**
  - El bifurcador no es una herramienta: cuando una segunda salida usa la misma llave desde la misma celda, aparece el glifo “Y” en el origen.
  - El resorte se tiende con clic en origen y clic en destino.
- **Elementos a producir:** fondo del museo, `resorte.png` (ya figura en la guía), glifo “Y” en SVG y lámparas.
- **Movimiento y sonido:** el resorte “salta” (180 ms) y hay pulsos simultáneos en teal. Sonidos: “boing” metálico corto y eco de sala. Música opcional.
- **Guía y ladrón:** “Con el bifurcador, una misma llave puede salir dos veces de la misma celda.” Contraejemplo `1122` (bloqueo), con los dos caminos en la repetición.
- **Accesibilidad:** el resorte se distingue por la forma y por el texto “resorte” en su etiqueta; `aria-label` del tipo “Bifurcador de la llave 1 en Espera: 2 caminos”.
- **Se reutiliza:** todo el sistema. Es nuevo: resorte, bifurcador, zonas de luz y minimapa.
- **Dependencias de lógica:** encender las celdas paso a paso requiere los datos agrupados por paso → ver Aut-2. Sin esa autorización se muestra el recorrido completo de una vez, como hoy.

### Nivel 4 · El teatro

- **Metáfora:** el montacargas de la tramoya. La pila es una columna de contrapesos (fichas de latón) sobre una base de hierro, en un riel vertical al costado de la placa. Terciopelo granate y latón.
- **Qué cambia:**
  - Cada cable lleva tres datos (llave · qué hay arriba · acción), así que la etiqueta pasa a ser compuesta: ▲/▼, base/ficha/Ø (“da igual”) y +ficha/−ficha/=.
  - Dos selectores giratorios: “Si arriba hay” y “Acción”.
  - Se reemplaza la frase de ayuda en texto (`main.js:632`) por una leyenda visual.
- **Pantallas:** en escritorio, la columna de la pila a la derecha dentro del escenario; en tableta, debajo de la placa; en el celular, un medidor compacto sobre el inventario.
- **Interacción central:** llave + condición + acción (los selectores mantienen su valor) y después se tiende el cable. Las llaves muestran “▲ Subir / ▼ Bajar” usando `key.label` de los datos.
- **Elementos a producir:** fondo del teatro, ficha y base (SVG), selectores giratorios (SVG) y palancas ▲/▼ (variantes de llave).
- **Movimiento y sonido:** cargar y soltar fichas en 220 ms con un leve rebote. Sonidos: golpe de contrapeso, cuerda y “telón” al ganar. Música opcional.
- **Guía y ladrón:** la intro “da igual → base” más una guía de los selectores. Contraejemplo `A` (intruso); la fila de la repetición muestra ▲.
- **Accesibilidad:** selectores como grupos de opción única; la pila ya avisa sus cambios a lectores de pantalla; las fichas llevan texto.
- **Se reutiliza:** cables, etiquetas, celdas y resorte. Es nuevo: la pila, los selectores y las etiquetas compuestas.
- **Dependencias de lógica:** animar la pila paso a paso → Aut-2. Sin autorización se muestra el estado final, como hoy.

### Nivel 5 · El banco central (jefe final)

- **Metáfora:** la sala de recuento. Una cinta de papel perforada pasa por un cabezal de latón, sobre un tambor tipo caja de música: cada anillo es una sección y cada púa dice “escribe · mueve · siguiente”. Se puede reutilizar la bóveda de `fondo-banco` con otro tono.
- **Qué cambia:** no hay llaves ni cables. El inventario pasa a tener el punzón para editar una púa, la opción de vaciarla y las velocidades 1× / 4× / instantáneo.
- **Pantallas:**
  - **Escritorio:** la cinta arriba (7 casillas y el cabezal fijo al centro) y el tambor debajo, con 3 o 6 anillos por 3 o 4 púas.
  - **Celular:** anillos como filas de 4 púas de 72 px y la cinta fija arriba.
- **Interacción central:** tocar una púa abre un papel con 3 selectores y los botones Guardar, Vaciar y Cancelar. La sección “Listo” sigue deshabilitada: esa protección está congelada y se mantiene.
- **Elementos a producir:** cinta, cabezal, tambor y púas (todo SVG o CSS) y una boleta de depósito para el ladrón.
- **Movimiento y sonido:** la cinta avanza en 180 ms por paso y el anillo activo se destaca. Sonidos: “tic” de contador, sello y campana si hay alarma. Música opcional para el jefe final.
- **Guía y ladrón:** intro y pistas de los datos. Resultado equivocado: la boleta muestra “11” tachado y “10”.
- **Accesibilidad:** el editor de púas hoy es un grupo sin foco atrapado, así que hay que atraparlo. Las casillas de la cinta ya marcan cuál es la actual.
- **Se reutiliza:** encabezado, escena, papeles, botones y sonido. Es nuevo: cinta, tambor, editor de púas y control de velocidad.
- **Dependencias de lógica:** ninguna para animar la cinta, porque `showTapeFrame(run)` ya recibe la corrida completa (`main.js:883-890`) y no está en la lista de congelados. Elegir otra cinta para Probar sí requiere Aut-4.

---

## 4. Sistema de diseño global

| Área | Propuesta |
|---|---|
| Color | La paleta de `VISUAL-DESIGN.md` §3 más tokens de material ya usados (`--wood`, `--leather`, `--paper`, `--paper-2`, `--wax`, `--brass-dark`). Volver `--bg` a `#0B0F14` (o declarar `--bg-deep`). Un acento por nivel: N1 latón, N2 níquel, N3 bronce patinado con ámbar y teal, N4 granate, N5 acero frío. El coral queda solo para alarma y error |
| Tipografía | Bodoni Moda solo de 22 px para arriba, Jost para la interfaz (16 px de base, 12 px mínimo), Plex Mono para etiquetas, cinta y números (12 px mínimo). Escala 12/14/16/18/22/28/40/64. Mayúsculas solo en etiquetas de 12 px o más con espaciado de 0,08em. Botones en minúscula normal, Jost 600, 14–16 px |
| Luz y materiales | Luz cálida arriba a la izquierda y borde teal a la derecha. Activo = brillo teal; error = coral; éxito = pulso latón/teal de 420 ms. Sombras suaves solo en los objetos |
| Iconos | Lucide en línea de 1,5 px para los controles (sonido, cerrar, candado, velocidad); las herramientas de la ficción van como dibujos |
| Componentes | Contrato: ficha fija + papel. Pista: nota “Pista n de 2”, una a la vez. Bitácora: tira con la última entrada + libreta lateral, con aviso a lectores de pantalla. Ventanas: papel de 480 px con sello. Botones: primario latón, secundario y sin fondo. Inventario: riel de llaves con número visible y herramientas con nombre visible. Progreso: 5 cerraduras en el encabezado y 5 medallones en el mapa |
| Estados | Normal, encima, foco (contorno teal de 2 px; 3 px en cables y piezas), presionado, deshabilitado o bloqueado (candado + texto), seleccionado (anillo teal), origen pendiente (aura + estado avisado), error (coral + sacudida de 120 ms + texto), alarma (línea coral + campana + texto), éxito (pulso + sello), cargando (el ladrón trabajando), vacío |
| Transiciones | 120 / 180 / 260 / 360 / 420 ms, solo con `transform` y `opacity`. View Transitions como mejora progresiva. Con movimiento reducido, todo instantáneo |
| A decidir por el owner | Fuentes, imágenes raster, CSS de hasta 40 KB, arrastre solo con mouse, cursor propio (ver §9) |

---

## 5. Inventario de elementos faltantes

Todo lo marcado “a producir” no existe todavía.

| Categoría | Imprescindible | Deseable | Opcional |
|---|---|---|---|
| Fondos | N2 hotel, N3 museo, N4 teatro, N5 sala de recuento (puede reutilizar `fondo-banco` con otro tono) | Mapa de la ciudad para el mapa de contratos | Pantalla de título ilustrada |
| Objetos y dibujos | Celda-relé (reemplaza la rueda), piñón de bucle, resorte, glifo “Y”, ficha y base, cinta, cabezal, tambor y púas (SVG), llaves 1–4 sin número grabado | Indicador de pisos, selectores giratorios, palancas ▲/▼, boleta de depósito | Perno y mesa en el mismo estilo de la IA (`REVISION-ASSETS.md` §5) |
| Ladrón | El mismo dibujo base | Objetos por nivel: cronómetro, linterna de dos tonos, tiza, boleta | Poses nuevas |
| Fuentes | Archivos de licencia OFL junto a los `.woff2` | Subconjunto latino | — |
| Sonidos (ya existen: clic, enchufe, corte, engranaje, cerrojo, campana, papel, error) | Resorte, cargar/soltar ficha, “tic” de cinta, colocar púa, éxito (sello), el ladrón empieza (pasos) | Telón (N4), campanilla (N2) | — |
| Música | — | — | Un loop por nivel, de 60 s o menos, apagado por defecto y con control propio |
| Animaciones y guía | Pulso paso a paso, repetición forense, sellos de fase, guía de 3 pasos | Minimapa para el celular | View Transitions |
| Documentación | `CREDITS.md` (lo pide `GUIA-ASSETS.md` y no existe), `docs/SMOKE.md` (lo pide `VISUAL-DESIGN.md` y no existe), capturas nuevas a 360 y 1440 | — | — |

### Presupuesto propuesto

- **Imágenes:** 1,5 MB o menos en WebP por nivel, cargadas al entrar al nivel.
- **Fuentes:** 150 KB o menos (hoy 103 KB).
- **JavaScript:** 50 KB o menos.
- **CSS:** 40 KB o menos (requiere cambiar el límite actual en el documento).
- **Audio:** 400 KB o menos por nivel si hay música.

---

## 6. Correcciones del juego actual

Las del mockup del nivel 1 están en §2 (M1–M24). Estas son las del juego actual:

| ID | Prioridad | Problema | Evidencia |
|---|---|---|---|
| A1 | P0 | La bitácora muestra identificadores internos: “Conectaste la llave 2: q1 → q2.” | Prueba en el navegador; `main.js:439-470` |
| A2 | P0 | En el celular, las celdas miden 32×32; el taller queda debajo del encargo y no hay barra de acciones fija | Captura a 360; `VISUAL-DESIGN.md` §6 |
| A3 | P0 | Las pistas, `brief`, `newPart` y `thief.intro` están en los datos, pero el juego nunca los muestra | Búsqueda en `main.js` sin resultados |
| A4 | P1 | Las fuentes no cargan: Fraunces e Inter están declaradas pero sin archivos (`styles.css:20-21`); el navegador no registra ninguna fuente | Medición |
| A5 | P1 | Las entradas de la bitácora se estiran y quedan con huecos enormes | `styles.css:439-446,1021-1026`; capturas de N1 y N3 |
| A6 | P1 | La palabra “build 4” aparece en el título y en el mapa | `main.js:179,222` |
| A7 | P1 | En N3, la etiqueta “inicio” queda fuera del dibujo cuando la Entrada está en `x ≤ 100` | `graphEditor.js:120-123`; captura de N3 |
| A8 | P1 | En N4, la paleta muestra A/B en vez de “▲ Subir / ▼ Bajar”, que estaba aprobado | `main.js:237`; `DESIGN.md` §12 |
| A9 | P1 | Esc cierra “Mecanismo reparado” sin pasar a Construir; la ventana no atrapa el foco ni tiene título asociado | `main.js:998-1033` |
| A10 | P1 | Probar en N5 muestra solo el último paso; `DESIGN.md` §8 pide paso a paso con velocidades | `main.js:883-890` |
| A11 | P1 | Falta el glifo del bifurcador y el piñón del bucle que pide `DESIGN.md` §7 | `graphEditor.js` |
| A12 | P2 | La nota “Cualquier otra combinación deja la alarma encendida.” aparece también en N4 y N5 | `main.js:545,794` |
| A13 | P2 | En N3, el recorrido de Probar se arma como una lista plana y puede encender cables que no se recorrieron | `main.js:948-953`; `graphEditor.js:92-98` |
| A14 | P2 | Falta el favicon (error 404) | Medición |

---

## 7. Roadmap

Esfuerzo: **S** = 1 día, **M** = 2–4 días, **L** = 1 semana o más.

| Fase | Contenido | Depende de | Esfuerzo | Criterio de aceptación |
|---|---|---|---|---|
| R0 · Decisiones (V0) | Responder §9; actualizar `VISUAL-DESIGN.md` (fuentes, imágenes, CSS, arrastre); alinear `AGENTS.md` con `LOGIC.md` §10 | — | S | Documentos coherentes y Aut-1 resuelta |
| R1 · Mockup N1, P0 | M1–M9 | R0 | M | Objetivo visible, cables con dirección, texto de 12 px o más, sin acciones por scroll |
| R2 · Recursos gráficos | WebP al doble del tamaño en pantalla, llaves corregidas, celda-relé, `CREDITS.md`, licencias OFL | R0 | S–M | 1,5 MB o menos por nivel; ningún 404 |
| R3 · Integrar N1 al juego (V1) | Mesa dentro de `renderWorkshop` y aspecto nuevo de `graphEditor`, sin cambiar las llamadas | Aut-1, R1, R2 | L | `npm test` en verde, prueba manual de N1, A1–A9 |
| R4 · N2 y N3 | Bucles, resorte, bifurcador, encuadre automático | R3 | M + M | Prueba manual de N2 y N3 a 360 y 1440 |
| R5 · N4 y N5 | Pila y selectores; tambor y cinta animada | R3 | M + L | Prueba manual de N4 y N5; la protección de “Listo” sigue funcionando |
| R6 · Movimiento y sonido (V2) | Pulso, repetición forense, sellos, sonidos que faltan | R3–R5 | M | Todo se apaga con movimiento reducido; sin animaciones infinitas |
| R7 · Auditoría (V3) | axe, Lighthouse (rendimiento 90+, accesibilidad 95+), 320/360/768/1440, prueba con 5 personas | R6 | M | Checklist §12 completo |

**Qué haría primero:** R0 y R1, que no requieren autorización, y en paralelo R2.

**Qué dejaría afuera por tiempo:** música por nivel, poses nuevas del ladrón, minimapa en el celular, View Transitions, el modo `?sprites=png`, el cursor propio en pantallas táctiles y el arrastre.

### Riesgos

- La integración toca código congelado.
- El estilo de las imágenes de IA puede variar entre los 5 fondos: conviene usar el fondo del N1 como referencia de estilo.
- 8 celdas de N3 en el celular.
- El peso de las imágenes.
- Licencias de las imágenes de IA para el informe.
- Los filtros pueden ir lentos en notebooks modestas.

---

## 8. Requiere autorización

No hace falta tocar `src/core`, los jueces ni los oráculos.

| ID | Qué | Por qué haría falta | En qué afecta |
|---|---|---|---|
| Aut-1 | Reescribir en lo visual `renderWorkshop`, `renderDrumWorkshop`, `openModal`, `renderTitle` y `renderMap` | `LOGIC.md` §10 congela los dos primeros, pero sin cambiarlos no se puede montar la mesa del mockup en el juego | Ninguna regla, si se mantienen las mismas llamadas a los editores, a `handleProbe`/`handleAssault` y a los selectores. Riesgo: errores de conexión entre piezas; se cubre con la prueba manual |
| Aut-2 | Pasar los pasos completos de la corrida a la interfaz (`frameStates`, `renderStack` en `handleProbe`/`handleAssault`) | Animar paso a paso las celdas de N3 y la pila de N4 | Cambia la forma de los datos que recibe la interfaz; los motores no cambian |
| Aut-3 | Cambiar datos de los niveles: `thief.intro` y `trick` por nivel (D9), y etiquetas “Rueda” si se quisieran | Hoy N1–N4 tienen la misma intro y el mismo truco | Pasa por la validación de vocabulario (`checkCopy`). Alternativa sin autorización: variar solo los objetos del ladrón |
| Aut-4 | Que el jugador elija la llave o la cinta en Probar | `handleProbe` usa `examples.open[0]` y `runs[0]` | Es el flujo del juego. Recomiendo no hacerlo y solo mostrar qué llave se prueba |
| Aut-5 | Comportamiento de Esc en “Mecanismo reparado” (A9) y pantalla de presentación del contrato antes del taller | Toca la transición entre fases (`handleLevelOpen` → `startLevel`) | Cambia la navegación entre fases |
| Aut-6 | Bitácora con nombres de celda en vez de identificadores (A1) | `handleConnect`/`handleCut` no están en la lista congelada, pero son parte del flujo: zona gris | Solo cambia el texto mostrado |
| Aut-7 | Guardar el progreso con “reparado” (`DESIGN.md` D10) | Para mostrar en el mapa los niveles ya reparados | Toca `loadProgress`/`saveProgress`. Recomiendo dejarlo fuera |

---

## 9. Preguntas abiertas

1. ¿Autorizás Aut-1, con la lista de llamadas que no pueden cambiar? Sin eso, el mockup no se puede integrar.
2. ¿Aceptás imágenes raster con presupuesto (1,5 MB o menos por nivel, en WebP) y actualizar `VISUAL-DESIGN.md` §10? La alternativa es todo en SVG, con menos atmósfera.
3. ¿Hacemos oficial Bodoni Moda + Jost + Plex Mono en lugar de Fraunces + Inter? Esto cambia el checklist de T7.
4. Contrato: ¿ficha mínima siempre visible más el papel para el detalle (recomendación), o solo el papel? Lo segundo contradice `VISUAL-DESIGN.md` §7.
5. ¿El ladrón “aprende un truco por nivel” cambiando los datos (Aut-3), o alcanza con variar sus objetos en pantalla?

---

## Pruebas para sumar al proyecto

Van al final de `mockups/nivel-1-taller/mockup.test.mjs` y usan las funciones auxiliares que ese archivo ya tiene. Hoy fallan las tres: pasan cuando se aplican las correcciones M4, M3 y M11.

```js
test('S-D1 no font-size below the 12px scale step', () => {
  const sizes = [...css.matchAll(/font-size\s*:\s*([^;]+);/g)].map((match) => match[1].trim());
  const tooSmall = sizes.filter((value) => {
    const px = minPx(value);
    return Number.isFinite(px) && px < 12;
  });
  assert.deepEqual(tooSmall, []);
});

test('S-D2 a cable keeps its direction: pairKey does not sort its ends', () => {
  assert.doesNotMatch(fnBody('pairKey'), /\.sort\(/);
});

test('S-D3 the rotated paper does not overflow its scroll container', () => {
  const rotates = /transform\s*:[^;]*rotate\(/.test(rules(css, '.paper').join(';'));
  const scrolls = /overflow(?:-y)?\s*:\s*(?:auto|scroll)/.test(rules(css, '#dossier-content').join(';'));
  assert.ok(!(rotates && scrolls), '.paper rotates inside an overflow:auto container');
});
```

---

## Key Learnings

1. El mockup del nivel 1 mezcla en un mismo cable los dos sentidos de un par de piezas y usa el doble clic para cancelar; eso choca con los cables de ida y vuelta y con los bucles del nivel 2.
2. `LOGIC.md` §10 congela `renderWorkshop` y `renderDrumWorkshop`, mientras que `AGENTS.md` permite tocar la capa visual de `main.js`; integrar la mesa necesita que el owner lo autorice explícitamente.
3. `llave-2/3/4.png` se recolorearon desde `llave-1` y conservan el “1” grabado; además, el color quedó como única señal visible de cada llave.
4. Los datos de los niveles ya traen `hints`, `brief`, `newPart` y `thief.intro`, pero el juego no los muestra; la guía inicial puede salir de ahí sin tocar lógica.
5. El mockup carga 8,1 MB de imágenes, con archivos entre 4 y 12 veces más grandes que su tamaño en pantalla, y contradice el “solo SVG y CSS” de `VISUAL-DESIGN.md` §10.
