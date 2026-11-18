# Handoff — assets + audio

- **Estado:** completed (con 1 fallo ajeno documentado en § Tests).
- **Unidad:** `assets-audio` · **Rama:** `feat/remaster-integration` · **Fecha:** 2026-11-17.

## Archivos tocados (dentro de la superficie autorizada)

- `src/ui/assets.js` (nuevo) — `loadManifest`, `assetUrl`, `sfxUrl`, `musicUrl`.
- `src/ui/audio.js` (nuevo) — `createAudio`.
- `tests/assets.test.js` (nuevo) — 8 tests.
- `tests/audio.test.js` (nuevo) — 8 tests.
- `assets/manifest.json` — **sin cambios**: el esquema ya cubre `status` (`available`/`placeholder`/`synthetic`/`missing`), `final` y `placeholder`; no hizo falta ajustarlo.

No se tocó `src/main.js`, `styles.css`, `index.html`, `src/core`, `src/game`, tests existentes, `mockups/` ni otros documentos.

## API entregada

```js
// src/ui/assets.js
loadManifest(url = 'assets/manifest.json') // Promise<manifest|null>; cachea por URL; null sin lanzar
assetUrl(manifest, id, { allowPlaceholder = true } = {}) // string|null
sfxUrl(manifest, id)   // string|null (solo sección sfx)
musicUrl(manifest, id) // string|null (solo sección music)

// src/ui/audio.js
createAudio({ manifest = null, enabled = false } = {}) =>
  { play, setEnabled, isEnabled, playMusic, stopMusic, dispose }
```

- `assetUrl`: `status === 'available'` → `final`; si no, `placeholder` si `allowPlaceholder` y existe; si no, `null`. Si `available` sin `final` válido, cae a `placeholder` (no a `null` en seco).
- Resolución de `id`: recorrido punteado directo (`levels.01.background`) más atajos por sección (`font.`/`fonts.`, `sfx.`, `music.`, `shared.` con claves que contienen puntos como `ui.sound`) y normalización de nivel (`n1.background`, `01.background` → `levels["01"].background`).
- `sfxUrl`/`musicUrl` solo miran su sección. Con el manifest actual, los 8 SFX P0 están en `synthetic` (sin archivo) → devuelven `null` y el audio usa synth; las 5 músicas están en `missing` → `null` (silencio).
- `audio.play(id)`: sin `enabled` → no-op. Con archivo disponible y `Audio` global → reproduce el archivo; si no, synth P0 (`click`, `cable`, `cut`, `gear`, `lock`, `bell`, `paper`, `error`, recetas adaptadas del mockup); resto → silencio. Nunca lanza.
- `playMusic(id)`: solo si `musicUrl` resuelve (o sea, `available`); loop, volumen 0.2. `setEnabled(false)` detiene la música; `setEnabled(true)` no inicia nada (sin autoplay).
- `AudioContext` perezoso (primer `play` habilitado), `resume()` si está suspendido, `dispose()` cierra el contexto, detiene la música y deja el objeto inerte. Sin `window`/`AudioContext` → objeto inerte.

## Decisiones

1. `manifest.json` intacto: ya expresaba todo lo que el contrato necesita.
2. `audio.js` importa `sfxUrl`/`musicUrl` de `assets.js` (reúso en vez de reimplementar la regla available/placeholder/null).
3. Detección de `AudioContext` en `window` primero y luego en `globalThis`, para que los tests en Node puedan inyectar un stub sin `window`.
4. Sin `Audio` global (Node) y con archivo disponible, un SFX P0 cae al synth en vez de quedar mudo; en navegador real `Audio` existe y manda el archivo.
5. `loadManifest` cachea solo éxitos; los fallos devuelven `null` sin cachear para permitir reintento.

## Tests

- `node --test tests/assets.test.js tests/audio.test.js` → **16/16 pass** (8 + 8).
- `node --test` completo → **283/284 pass**. El único fallo es `tests/workbenchView.test.js` → "los datos del nivel viajan por textContent, sin innerHTML", archivo de otra unidad que no toqué y que mis módulos no importan; lo dejo como evidencia para su dueño, no lo modifico.

## Riesgos

- El fallo de `workbenchView` es ajeno; si el parent lo ve en rojo, no viene de esta unidad.
- `playFile` usa `new Audio(url)` (elemento HTML, no WebAudio): en navegadores con autoplay-policy estricta el `play()` puede rechazarse; se ignora (`catch`) y ese SFX queda mudo en ese gesto (el synth solo suena cuando no hay archivo). Si el owner quiere synth también como respaldo de archivos que fallan, es un cambio de una línea en `play`.
- IDs de nivel de dos dígitos (`n10+`) normalizan con `padStart(2,'0')`; hoy solo hay `01`–`05`.

## Integración en `main.js` (parent)

```js
import { loadManifest } from './ui/assets.js';
import { createAudio } from './ui/audio.js';

const manifest = await loadManifest(); // null si falla → todo fallback
const audio = createAudio({ manifest }); // apagado por defecto
// toggle de sonido existente:
audio.setEnabled(soundOn);
if (soundOn) audio.play('click');
// ensayo/probar: audio.play('gear' | 'lock' | 'error' | 'bell' ...)
// cerrar nivel / toggle off: audio.stopMusic() (también lo hace setEnabled(false))
// al salir: audio.dispose()
```

## Key Learnings

- El manifest ya traía el campo `status` con cuatro valores (`available`, `placeholder`, `synthetic`, `missing`); la regla "available → final, si no placeholder, si no null" cae natural sobre `synthetic`/`missing` sin casos especiales.
- Las claves de `shared` contienen puntos (`"ui.sound"`), así que la búsqueda por sección debe probar la clave con y sin prefijo antes del recorrido punteado genérico.
- Probar `AudioContext` perezoso en Node exige mirar `globalThis` además de `window`; con eso el test de "no autoplay" es una aserción de contador de construcciones.
- Un `test-fail` en `workbenchView.test.js` convive en la misma suite: reportarlo como evidencia ajena en vez de tocarlo mantiene el contrato de "un dueño por archivo".
- `node --test` en Windows/PowerShell no acepta `| tail`; hay que correrlo sin pipe para ver el resumen.
