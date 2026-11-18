# Mockup — Taller del Nivel 1

Prototipo visual de “La mesa del cerrajero” para el contrato 01, fase de reparación. La escena usa un tablero fijo de 16:9 que se escala proporcionalmente para que las ruedas, los cables y los objetos no se deformen al cambiar el tamaño de la ventana.

## Abrir

Abrir `index.html` directamente en el navegador. No necesita servidor.

También se puede servir desde la raíz del proyecto:

```text
http://localhost:8000/mockups/nivel-1-taller/
```

## Interacciones del prototipo

- **Llaves:** hacer clic en una llave del llavero para seleccionarla. La llave activa se eleva y brilla; el estado aparece en la barra inferior. El puntero se mantiene nativo.
- **Herramientas:** hacer clic en el carrete de cobre, las tijeras o el engranaje. La herramienta activa se resalta en el inventario y el estado cambia en la barra inferior.
- **Arrastrar:** mantener presionado un objeto del inventario y soltarlo sobre una pieza del mecanismo.
- **Llave sobre rueda o cerrojo:** solo muestra una explicación; no gira ruedas ni abre el perno. El cerrojo se abre únicamente cuando `Probar` recorre un mecanismo completo.
- **Carrete de cobre:** hacer clic en dos piezas para tender un cable. La trenza se dibuja desde el origen hasta el destino y toma el color de la llave activa; no usa etiquetas colgantes.
- **Tijeras:** hacer clic sobre un cable para cortarlo. La tijera del inventario hace el gesto de corte, el cable salta y deja una chispa.
- **Teclado:** Tab recorre llaves, herramientas, cables y botones; Enter o Espacio activa. Con las tijeras, Enter sobre un cable enfocado también lo corta.
- **Campana:** hacer clic para hacerla sonar. Es la señal de alarma cuando una llave cae en un contacto vacío; no decide por sí sola el resultado del nivel.
- **Contrato, pista y bitácora:** son objetos sobre la mesa. Al hacer clic se abren como documentos. `Esc`, el botón de cerrar o el fondo los cierran.
- **Probar:** prueba una llave en el mecanismo. Si falta el cable central, la campana marca el error y el cerrojo sigue cerrado; si el mecanismo está completo, el pulso gira las ruedas y el perno cede.
- **Ensayo:** prueba el mecanismo con el ladrón. Si el mecanismo está completo, el ladrón se retira; si falta el cable central, el ensayo falla y se vuelve al taller. No hay pantalla de derrota.
- **Sonido:** apagado por defecto; el botón del parlante activa una paleta sintetizada con Web Audio (trinquete, campana, tijera, perno y cable).

Los botones `Probar` y `Ensayo` no ejecutan la lógica del juego: son demostraciones visuales con el mismo significado que tendrán en el juego real. Un fallo de ensayo no consume el nivel; el jugador vuelve a editar el mecanismo.

## Sprites

La mayoría de los props principales usan los **assets de IA** integrados: fondo, ladrón, contrato, pista, libreta, bocallave, cilindro, carrete, llaves 1–4, ruedas de engranaje, campana, tijeras y la textura de la placa. Los cables son SVG procedurales; quedan en SVG el perno, la mesa y el marco de la placa, porque necesitan geometría exacta o no había un equivalente fotorrealista.

La revisión completa de lo recibido está en [`REVISION-ASSETS.md`](REVISION-ASSETS.md): qué se usó, qué se ajustó y por qué los ZIP de la carpeta WEB no encajaron.

El índice de assets y las dos guías siguen disponibles:

- [`GUIA-ASSETS.md`](GUIA-ASSETS.md): índice y tabla de decisión.
- [`GUIA-ASSETS-IA.md`](GUIA-ASSETS-IA.md): prompts para generar con IA.
- [`GUIA-ASSETS-WEB.md`](GUIA-ASSETS-WEB.md): palabras clave, sitios y licencias para buscar.

Para probar PNG/JPEG definitivos sin cambiar el código:

```text
index.html?sprites=png
```

El mockup usa `fondo-banco.jpg` y `placa-textura.jpg` optimizados; si aparece un `fondo-banco.png` o `placa-textura.png` en la carpeta, `?sprites=png` lo prefiere.

## Archivos

```text
index.html               estructura y objetos de la escena
styles.css               dirección visual, layout y estados
app.js                   interacción de demo, estado, modales y sonido
assets/sprites/          PNG de IA, JPG optimizados y SVG de mecánica
GUIA-ASSETS.md           índice y tabla de decisión de assets
GUIA-ASSETS-IA.md        prompts para generar assets con IA
GUIA-ASSETS-WEB.md       keywords y características para buscar assets
REVISION-ASSETS.md       revisión de los assets recibidos y decisiones
preview-1440.png         captura de referencia
preview-390.png          captura móvil de referencia
```

## Qué no hace

No hay lógica de juego, ni importaciones de `src/core` o `src/game`, ni validación de autómatas, ni persistencia. No modifica `styles.css`, `index.html` ni `src/` del juego. Vive aislado en `mockups/`.

## Notas de integración

- Las fuentes son **Cinzel** (títulos y cabeceras), **Oswald** (etiquetas y controles) y **Special Elite** (contrato, pistas y bitácora), self-hosted en `assets/fonts/`.
- Los cables son SVG: una trenza de cuatro hebras sobre un alma oscura, con terminales de latón. El color de la trenza identifica la llave activa (oro, teal, coral o violeta) y no hay etiquetas ni números colgando.
- La trenza se dibuja desde el origen al conectar; el terminal de destino aparece al final. El asset fotográfico del cable se descartó.
- El riel del llavero queda detrás de las llaves: el latón se ve a través del ojo de cada llave y la pieza no parece cortada al seleccionarla.
- El escenario es un tablero fijo de 1600×900 (16:9) escalado con JavaScript; las distancias entre ruedas, cables y objetos se mantienen. En pantallas angostas el tablero se recorre horizontalmente.
- Los botones `Probar` y `Ensayo` son placas físicas con bisel, remaches, textura metálica y hundimiento al presionar.
- El estado de la herramienta activa vive en una barra de latón entre el tablero y el inventario; no hay cursor de imagen.
- El mockup no toca la lógica congelada ni los tests del juego.
