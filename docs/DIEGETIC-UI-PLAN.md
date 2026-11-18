# Interfaz diegética — plan de la fase 2 del remaster

**Estado:** aprobado por el owner el 2026-11-18 (corrección de rumbo sobre la barra de botones).
**Rama:** `feat/remaster-integration`.
**Antecedente:** los assets finales ya están integrados ([`ASSET-INTEGRATION.md`](ASSET-INTEGRATION.md)).
Este documento reemplaza la idea de "chrome + barra de acciones" por **objetos del taller que se tocan**.

## 1. Problema

La interfaz quedó como un marco moderno pegado sobre una escena ilustrada:

- Una barra inferior de botones (`Probar / Ensayo / Contrato / Pista / Bitácora`) repite en los cinco niveles y no pertenece a ningún objeto del mundo.
- Los props que **ya existen dibujados** no hacen nada: en el N1 el contrato, la lupa, la libreta y la campana están sobre la mesa; en el N2 los relés; en el N4 los selectores y las palancas.
- El inventario de carretes y la tijera viven en una franja con forma de botón, aunque el asset de tijeras existe.
- Quedan textos de producción visibles ("La placa aloja el editor real…", "Decorado de tramoya… a producir", "AQUÍ EL TALLER MUESTRA…") y un sello `repair` en inglés.
- Varios textos no se leen: el estado y las leyendas están a 12–14 px con poco contraste sobre fondo oscuro.
- Los sonidos existen en `assets/audio/sfx/` y `audio.js` los sabe reproducir, pero **solo se dispara `click`** al activar el sonido: ningún evento del juego suena.

## 2. Principio de diseño

1. **Nada con forma de botón genérico.** Cada acción es un objeto del escenario: papel, lupa, libreta, campana, tijera, carrete, palanca, boleta, tambor.
2. **El prop es el control real.** Se conservan los handlers y callbacks existentes; cambia dónde viven y cómo se ven.
3. **Toda acción sigue accesible.** Si un prop no tiene asset, se usa el placeholder actual hasta que llegue, pero la acción no desaparece.
4. **Una sola capa de estado.** El estado y la fase se leen en la placa/boleta del nivel, no en una franja aparte.
5. **Nada de texto de producción en la UI.** Los avisos "a producir" viven en `data-status`, nunca en texto visible.
6. **Contraste y tamaño.** Texto de UI ≥ 14 px, estado ≥ 14 px, contraste AA sobre el fondo real; los rótulos de 12 px solo para grabados decorativos.

## 3. Arquitectura de la interacción

- Cada prop accionable lleva `data-action="probe|assault|contract|hint|log|cut|spring|key"` (y `data-key` cuando aplica).
- `main.js`, después de montar la escena, consulta `scene.element.querySelectorAll('[data-action]')` y engancha **los mismos handlers** que hoy usan los botones. La escena sigue sin lógica.
- El shell (`workbenchScene.js`) acepta `diegeticActions: true`: oculta la barra de acciones y deja el escenario como único dueño de los controles. El inventario de carretes se monta **dentro de la escena** en el slot que cada nivel defina (`scene `).
- Navegación (`Volver`, `Sonido`) se convierte en dos interruptores de latón con los iconos `assets/shared/ui/*.svg`, sin caja de botón moderna.
- El foco de teclado y `aria-label` se mantienen en cada prop: el rediseño no puede romper accesibilidad.

## 4. Qué se va y qué lo reemplaza

### N1 — La caja de seguridad

| Se va | Lo reemplaza | Asset |
|---|---|---|
| Barra `Probar / Ensayo / Contrato / Pista / Bitácora` | Contrato, lupa, libreta y campana de la mesa | `levels.01.props.contract/hint/log/bell` |
| Botón `Cortar` con icono inline | Tijera sobre la mesa | `levels.01.scissors` |
| Franja de inventario | Carretes físicos sobre la mesa | `levels.01.spool`, `key-1..4` |
| Franja de estado | Placa grabada (fase + estado) | CSS/latón |
| `Probar` / `Ensayo` | La placa del mecanismo (tocar el borde) y la campana | — |

### N2 — El ascensor

| Se va | Lo reemplaza | Asset |
|---|---|---|
| Barra de acciones | Contrato/lupa/libreta como papeles en la mesa; `Ensayo` en la palanca del ascensor | `shared.paper.*` (pendiente) |
| Texto "Fondo, indicador, piñón y relés finales de la sala." | nada (se elimina) | — |
| Relés con cajita | Dos lámparas de relé sobre la placa | `shared.prop.relay` |
| Inventario en franja | Carretes sobre la mesa | `spool`, `key-*` |

### N3 — El museo

| Se va | Lo reemplaza | Asset |
|---|---|---|
| Texto "La placa aloja el editor real de 5 a 8 casillas." | nada | — |
| Texto "AQUÍ EL TALLER MUESTRA LA MARCHA DE LA PRUEBA." | la propia placa con su marcha | — |
| Barra de acciones | Papeles del conservador (contrato/pista/bitácora) y la lámpara | `shared.paper.*` (pendiente) |
| Leyendas con texto "Bifurcador…"/"Resorte…" | Placas grabadas con el glifo y tooltip | `shared.prop.fork/spring` |

### N4 — El teatro

| Se va | Lo reemplaza | Asset |
|---|---|---|
| Texto "Decorado de tramoya: … a producir." | nada | — |
| Sello `repair` | Sello `Reparación` (ya existe el idioma) | — |
| Fila de botones `Da igual / Base / Ficha / No tocar / Cargar / Soltar` | Los **selectores** de la pila y las palancas del escenario | `levels.04.selectors`, `lever-up/down` |
| Columna decorativa con fichas "a producir" duplicada | Solo la pila real, sobre la placa | `chip.webp`, `stack-base.webp` |
| Barra de acciones | Papeles y palancas | — |

### N5 — El banco central

| Se va | Lo reemplaza | Asset |
|---|---|---|
| Barra de acciones (`PROBAR LA CINTA`, etc.) | Manivela del tambor y boleta de depósito | `drum.webp`, `head.webp` |
| Franja de estado | Boleta y contador de la placa | — |

## 5. Audio

`audio.js` ya reproduce ocho SFX con respaldo sintetizado. Falta dispararlos:

| Evento | SFX |
|---|---|
| Conectar / tender cable | `cable` |
| Cortar | `cut` |
| Colocar engranaje / ficha | `gear` |
| Aceptar / cerradura cerrada | `lock` |
| Alarma | `bell` |
| Error / combinación inválida | `error` |
| Abrir contrato, pista o bitácora | `paper` |
| Cualquier clic de UI | `click` |
| Victoria | `lock` + `bell` (hasta que exista `success`) |

El sonido arranca **encendido** por defecto; el primer gesto del usuario desbloquea el contexto. El interruptor de sonido conserva el estado y se recuerda en `localStorage`.

## 6. Verificación obligatoria por cambio

1. `node --test` completo verde.
2. Captura a 1440×900 y 390×844 de **cada nivel tocado**; sin scroll de página, sin scroll horizontal, sin textos de producción visibles.
3. Contraste: leer a simple vista el estado, la fase y las etiquetas de props; si no se lee en la captura, no está listo.
4. Audio: probar en navegador real que conectar, cortar, abrir un papel, fallar y ganar suenan distinto.
5. Teclado: tabular por los props, foco visible, `Enter/Espacio` activan.
6. Registrar en este documento qué se tocó y qué quedó pendiente.

## 7. Fases

| Fase | Alcance | Estado |
|---|---|---|
| **F1** | Audio conectado a eventos + sonido por defecto | pendiente |
| **F2** | Shell sin barra de acciones; navegación como interruptores; props con `data-action` | pendiente |
| **F3** | N1 piloto diegético (papeles, lupa, libreta, campana, tijera, carretes) | pendiente |
| **F4** | N2–N5 diegéticos y limpieza de textos de producción | pendiente |
| **F5** | Pasada de contraste/tipografía y capturas finales | pendiente |

## 8. Riesgos

- **Congelado:** `src/core`, `src/game` y el flujo funcional de `main.js` no cambian; los handlers son los mismos. Si una acción necesita lógica nueva, se consulta al owner.
- **Accesibilidad:** convertir un botón en un prop no puede perder foco, nombre accesible ni teclado.
- **Assets faltantes:** papel, lámpara, boleta y SFX P1 siguen en placeholder; las acciones no se bloquean.
- **Alcance:** es una fase grande; se hace nivel por nivel con captura de verificación antes de pasar al siguiente.

## 9. Corrección del owner (2026-11-18): escena inmersiva

El nivel no puede sentirse "encerrado en un recuadro". La escena ocupa **toda la ventana** y la mesa de trabajo es el único lugar donde vive la máquina.

1. **Fondo a pantalla completa.** La imagen del nivel cubre `100dvh`; desaparecen el borde, el marco y el fondo del `wb-stage`. El header flota arriba (título, fase, Volver, Sonido) sobre un degradado tenue.
2. **Fuera el panel de objetivo.** La regla, la intro y las pistas viven en el contrato, la pista y la bitácora. La escena no reserva columna izquierda.
3. **La máquina, sobre la mesa.** La placa del mecanismo es el centro de la composición; los props (papeles, tijera, campana, carretes) están sobre la mesa alrededor.
4. **Estado sin barra.** El estado se lee en una línea grabada sobre la mesa o en la placa, no en una franja de interfaz.
5. **Animaciones de ambiente.** Todos los assets integrados pueden moverse con CSS respetando `prefers-reduced-motion`: respiración del ladrón, vaivén de la campana, roce de papeles, giro lento de engranajes, parpadeo de lámpara, brillo del carrete. Sin JS y sin costo de lógica.
6. **Se aplica a los cinco niveles**, no solo al N1.

### Fases actualizadas

| Fase | Alcance | Estado |
|---|---|---|
| **F1** | Audio conectado a eventos + sonido por defecto | hecho |
| **F2** | Shell diegético: sin barra de acciones, navegación como interruptores | N1 hecho |
| **F3** | N1 piloto diegético (papeles, lupa, libreta, campana, tijera, ladrón) | hecho, en verificación |
| **F4** | Shell inmersivo: fondo a pantalla completa y sin panel de objetivo | en curso |
| **F5** | Animaciones de ambiente en los cinco niveles | pendiente |
| **F6** | N2–N5 diegéticos y limpieza de textos de producción | pendiente |
| **F7** | Pasada de contraste/tipografía y capturas finales | pendiente |
