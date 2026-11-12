# Mockup estático — Taller del Nivel 1

Prototipo visual de “La mesa del cerrajero” para el contrato 01, fase de reparación.

## Abrir

Abrir `index.html` directamente en el navegador. No necesita servidor ni JavaScript.

También se puede servir desde la raíz del proyecto:

```text
http://localhost:8000/mockups/nivel-1-taller/
```

## Vista previa

- `preview-1440.png` — taller completo en escritorio.
- `preview-390.png` — adaptación móvil con desplazamiento interno del mecanismo.

## Qué incluye

- Barra superior con contrato, fase, progreso y sonido.
- Escena del Banco del Llano: bóveda, ventana, lámpara y ladrón en penumbra.
- Placa de latón con ruedas, cables, zócalos abiertos, bus de alarma y cerrojo.
- Expediente con contrato ivory, encargo, pista y notas del caso.
- Dock de herramientas con llavero, cable, tijera y engranaje bloqueado.
- Estados de hover y foco. La selección de llave y herramienta funciona con CSS.
- Adaptación responsive. En pantallas angostas el mecanismo se puede desplazar dentro del escenario.

## Qué es falso

Todo. No hay lógica de juego, ni importaciones de `src/core` o `src/game`, ni llamadas a motores, ni persistencia. Los botones “Probar la llave” y “Ensayo” no ejecutan nada: son parte del mockup visual.

## Notas para la implementación

- Las fuentes Fraunces e Inter todavía no están self-hosted; este mockup usa Georgia y Segoe UI como sustituto. La versión integrada debe cargar los WOFF2 locales.
- Las coordenadas del mecanismo respetan el `viewBox 820×520` del juego para facilitar el reemplazo del editor SVG.
- Los ganchos visuales (`wheel`, `cable`, `tag`, `plate`) están separados de los nombres de lógica para que la futura implementación conserve los callbacks existentes.
- El mockup no modifica `styles.css`, `index.html` ni `src/` del juego. Vive aislado en `mockups/`.
