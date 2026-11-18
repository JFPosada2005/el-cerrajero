# El Cerrajero — Contrato de interfaces del remaster

> **Rama:** `feat/remaster-integration` · **Base visual:** `mockups/nivel-1-taller` @ `153ee7d` · **Fecha:** 2026-11-17.
>
> Este contrato permite trabajar en paralelo sin pisarse. El parent es dueño de `src/main.js`, `index.html`, la integración, los commits y el seam check. Los agentes no tocan esos archivos.

## Reglas de convivencia

- **Un dueño por archivo.** Si un agente necesita un archivo fuera de su superficie, se detiene y lo pide.
- **Nada de git, instalaciones ni formatters globales.**
- **No tocar lógica:** `src/core/*`, `src/game/*`, jueces, datos, `levels.js`, `blueprint`, `machines`.
- **No tocar `tests/*` existentes.** Cada unidad agrega su propio archivo de test.
- **No tocar `styles.css`** salvo el agente de diseño.
- **No tocar `src/main.js` ni `index.html`**: los integra el parent.
- Cada agente deja su handoff en `docs/handoffs/<unidad>.md`.

## API de la vista del taller

Archivo nuevo: `src/ui/workbenchView.js` (puede dividirse en `contractCard.js` e `inventory.js`).

```js
createWorkbenchView({
  contract,          // '01'
  title,             // 'La caja de seguridad'
  client,            // 'Banco del Llano'
  phase,             // 'Reparación' | 'Construcción'
  objective: {
    rule,            // texto exacto de puzzle.goal
    intro,           // texto exacto de puzzle.intro
    note             // texto opcional; por defecto el de la alarma
  },
  logLines = [],     // [{ text, tone }] iniciales, tone: 'neutral' | 'good' | 'bad'
  soundEnabled = false,
  handlers: {
    onBack,
    onProbe,
    onAssault,
    onOpenDoc,       // (kind: 'contract' | 'hint' | 'log') => void
    onToggleSound
  }
}) => {
  element,           // HTMLElement raíz
  slots: {
    stage,           // donde el parent monta el editor real
    status,          // donde el parent monta pila/cinta/estado
    inventory,       // donde el parent monta llaves/herramientas
    log              // contenedor de entradas
  },
  setPhase(phase),
  setObjective({ rule, intro, note }),
  setSound(enabled),
  addLog(text, tone = 'neutral'),
  clearLog()
}
```

La vista **no** crea ni simula el editor, los cables, las llaves ni el juicio. Solo construye la cáscara y los slots. El parent mantiene los callbacks y la lógica.

### Estructura y clases

```html
<section class="workbench">
  <header class="workbench-header">
    <p class="workbench-brand">El Cerrajero</p>
    <div class="workbench-heading">
      <p class="workbench-contract">Contrato 01</p>
      <h1 class="workbench-title">La caja de seguridad</h1>
    </div>
    <span class="workbench-phase">Reparación</span>
    <button class="workbench-back" type="button" data-action="back">Volver</button>
    <button class="workbench-sound" type="button" data-action="sound" aria-pressed="false">Sonido</button>
  </header>

  <div class="workbench-layout">
    <aside class="workbench-objective" aria-label="Objetivo del contrato">
      <p class="objective-kicker">Objetivo</p>
      <p class="objective-rule">…</p>
      <p class="objective-intro">…</p>
      <p class="objective-note">…</p>
      <button class="objective-open" type="button" data-doc="contract">Abrir contrato</button>
    </aside>

    <section class="workbench-stage" data-slot="stage" aria-label="Mecanismo"></section>

    <aside class="workbench-log" data-slot="log" aria-label="Bitácora">
      <p class="log-title">Bitácora</p>
      <div class="log-list"></div>
    </aside>
  </div>

  <div class="workbench-status" data-slot="status" aria-label="Estado del mecanismo"></div>

  <footer class="workbench-inventory" data-slot="inventory" aria-label="Inventario"></footer>

  <div class="workbench-actions">
    <button type="button" data-action="probe">Probar</button>
    <button type="button" data-action="assault" class="is-primary">Ensayo</button>
    <button type="button" data-doc="contract">Contrato</button>
    <button type="button" data-doc="hint">Pista</button>
    <button type="button" data-doc="log">Bitácora</button>
  </div>
</section>
```

- Las entradas de bitácora usan `.log-entry` y `data-tone="neutral|good|bad"`.
- Los botones deben tener `aria-label` cuando el texto no alcance.
- No usar `innerHTML` con datos del nivel; usar `textContent`.
- El parent puede agregar clases de estado (`is-primary`, `is-disabled`) sin cambiar la estructura.

## API de assets

Archivo nuevo: `src/ui/assets.js`.

```js
loadManifest(url = 'assets/manifest.json') => Promise<manifest> // cachea
assetUrl(manifest, id, { allowPlaceholder = true } = {}) => string | null
sfxUrl(manifest, id) => string | null
musicUrl(manifest, id) => string | null
```

Regla:

- Si `status === 'available'`, usa `final`.
- Si no, usa `placeholder` cuando `allowPlaceholder` y exista.
- Si no hay ninguno, `null`; el consumidor usa CSS/silencio.
- No lanzar si el manifest no existe: devolver `null` y dejar que el consumidor use su fallback.

## API de audio

Archivo nuevo: `src/ui/audio.js`.

```js
createAudio({ manifest, enabled = false }) => {
  play(id),          // sfx; si no hay archivo, synth de respaldo o silencio
  setEnabled(enabled),
  isEnabled(),
  playMusic(id),     // loop; si no hay archivo, no hace nada
  stopMusic(),
  dispose()
}
```

- Sin autoplay: `enabled = false` por defecto.
- Si `AudioContext` no existe, no lanzar; devolver un objeto inerte.
- SFX P0 con respaldo sintetizado: `click`, `cable`, `cut`, `gear`, `lock`, `bell`, `paper`, `error`.
- SFX sin archivo ni synth: silencio.
- La música solo se reproduce si `manifest` tiene `status: "available"`.
- No crear `AudioContext` hasta el primer `play`/`playMusic` con `enabled` verdadero.

## Tests

- `tests/workbenchView.test.js` (nuevo): estructura, slots, callbacks, `setPhase`, `setObjective`, `setSound`, `addLog`.
- `tests/assets.test.js` (nuevo): `assetUrl`/`sfxUrl`/`musicUrl` con manifest available/placeholder/missing; manifest inválido.
- `tests/audio.test.js` (nuevo, opcional): objeto inerte sin `AudioContext`, `setEnabled`, no autoplay.
- Cada test usa el DOM falso del repo o stubs; no agregar dependencias.

## Handoff

Cada agente escribe `docs/handoffs/<unidad>.md` con:

- estado (`completed` / `partial` / `blocked`);
- archivos tocados;
- API entregada y decisiones;
- tests ejecutados y resultado;
- supuestos, riesgos y lo que el parent debe integrar.

El parent revisa el diff contra la superficie, corre `npm test`, hace el seam check y commitea. Los agentes no commitean.
