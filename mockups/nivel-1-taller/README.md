# Mockup — Taller del Nivel 1

Prototipo visual de “La mesa del cerrajero” para el contrato 01, fase de reparación. Esta versión reemplaza la columna de paneles por una mesa de trabajo a pantalla completa y usa sprites provisionales en `assets/sprites/`.

## Abrir

Abrir `index.html` directamente en el navegador. No necesita servidor.

También se puede servir desde la raíz del proyecto:

```text
http://localhost:8000/mockups/nivel-1-taller/
```

## Interacciones del prototipo

- **Llaves:** hacer clic en una llave del llavero para seleccionarla. El cursor cambia a esa llave.
- **Herramientas:** hacer clic en el carrete de cobre, las tijeras o el engranaje. El cursor cambia a la herramienta.
- **Arrastrar:** mantener presionado un objeto del inventario y soltarlo sobre una pieza de la cerradura.
- **Llave sobre rueda:** hace girar la rueda.
- **Llave sobre cerrojo:** retrae o cierra el perno.
- **Carrete de cobre:** hacer clic en dos piezas para tender un cable temporal. El cable toma el color de la llave activa.
- **Tijeras:** hacer clic sobre un cable para cortarlo.
- **Campana:** hacer clic para hacerla sonar.
- **Contrato, pista y bitácora:** son objetos sobre la mesa. Al hacer clic se abren como documentos. `Esc`, el botón de cerrar o el fondo los cierran.
- **Probar:** demostración visual del recorrido y del perno.
- **Ensayo:** demostración visual del ladrón acercándose a la cerradura.
- **Sonido:** apagado por defecto; el botón del parlante activa clics sintetizados con Web Audio.

Los botones `Probar` y `Ensayo` no ejecutan la lógica del juego: son demostraciones visuales del mockup.

## Sprites

Los archivos actuales son **SVG provisionales** para que la interfaz ya se pueda evaluar. Los definitivos deben ir en `assets/sprites/` con los nombres y tamaños del índice [`GUIA-ASSETS.md`](GUIA-ASSETS.md).

La guía está dividida en dos rutas:

- [`GUIA-ASSETS-IA.md`](GUIA-ASSETS-IA.md): prompts completos para generar con IA el fondo, el ladrón, el papel, el cuero y los props orgánicos.
- [`GUIA-ASSETS-WEB.md`](GUIA-ASSETS-WEB.md): palabras clave, sitios, licencias y características para buscar engranajes, pernos, tijeras, campanas, texturas de madera/latón y piezas de geometría exacta.

En resumen: **IA para atmósfera y materiales; web/SVG para mecánica y geometría exacta; Photopea para limpiar, recolorear y componer.**

Para probar los PNG definitivos sin cambiar el código:

```text
index.html?sprites=png
```

Ese parámetro reemplaza cada `assets/sprites/nombre.svg` por `assets/sprites/nombre.png`; si un PNG falta, conserva el SVG.

## Archivos

```text
index.html               estructura y objetos de la escena
styles.css               dirección visual, layout y estados
app.js                   interacción de demo, modales, cursor y sonido
assets/sprites/*.svg     sprites provisionales
GUIA-ASSETS.md           índice y tabla de decisión de assets
GUIA-ASSETS-IA.md        prompts para generar assets con IA
GUIA-ASSETS-WEB.md       keywords y características para buscar assets
preview-1440.png         captura de referencia
preview-390.png          captura móvil de referencia
```

## Qué no hace

No hay lógica de juego, ni importaciones de `src/core` o `src/game`, ni validación de autómatas, ni persistencia. No modifica `styles.css`, `index.html` ni `src/` del juego. Vive aislado en `mockups/`.

## Notas de integración

- Las fuentes definitivas serán Fraunces e Inter self-hosted; este mockup usa Georgia y Segoe UI como sustituto.
- Las coordenadas principales del mecanismo usan un `viewBox 900×560` y posiciones porcentuales para facilitar el reemplazo del editor SVG.
- El cursor personalizado oculta el cursor nativo solo sobre el escenario. En los objetos de papel y en el inventario se usa el cursor normal.
- En pantallas angostas el mecanismo se desplaza horizontalmente dentro del escenario; la página no genera scroll lateral.
- El mockup no toca la lógica congelada ni los tests del juego.
