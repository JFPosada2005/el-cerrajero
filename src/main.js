import { level1 } from './game/level1.js';
import { buildPlayerDFA, runHeist, testKey } from './game/rules.js';
import { thiefReport } from './game/thief.js';
import { createGraphEditor } from './ui/graphEditor.js';

const PROGRESS_KEY = 'el-cerrajero:progress';
const app = document.querySelector('#app');

let playerTransitions = structuredClone(level1.initialTransitions);
let workshop = null;
let selectedKey = level1.alphabet[0];
let cutMode = false;

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      return { completed: [] };
    }
    const parsed = JSON.parse(raw);
    return { completed: Array.isArray(parsed.completed) ? parsed.completed : [] };
  } catch {
    return { completed: [] };
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    return;
  }
}

function appendLog(message, tone = '') {
  const log = document.querySelector('#log');
  if (!log) {
    return;
  }
  const item = document.createElement('li');
  item.className = `log-item${tone ? ` ${tone}` : ''}`;
  item.textContent = message;
  log.append(item);
  log.scrollTop = log.scrollHeight;
}

function renderStart() {
  const progress = loadProgress();
  app.innerHTML = `
    <main class="start">
      <p class="eyebrow">Proyecto final</p>
      <h1>El Cerrajero</h1>
      <p class="lead">Sos el mejor cerrajero de la ciudad. Cada bóveda es un mecanismo; cada mecanismo, un secreto. El ladrón ya está afuera.</p>
      <section class="start-card">
        <p>Cinco contratos. Cinco mecanismos. Una regla: la bóveda abre solo para la llave correcta.</p>
        <button id="start-button" class="primary">Aceptar el contrato</button>
      </section>
      <p class="progress">Contratos completados: ${progress.completed.length} / 5 · build 4</p>
    </main>
  `;
  document.querySelector('#start-button').addEventListener('click', renderLevel);
}

function renderPalette() {
  const palette = document.querySelector('#palette');
  palette.replaceChildren();
  for (const key of level1.alphabet) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `key key-${key}`;
    button.dataset.key = key;
    button.textContent = key;
    button.setAttribute('aria-label', `Llave ${key}`);
    button.addEventListener('click', () => selectKey(key));
    palette.append(button);
  }
}

function renderTools() {
  const activeKey = document.querySelector('#active-key');
  const scissors = document.querySelector('#scissors');
  if (!activeKey || !scissors) {
    return;
  }
  activeKey.textContent = cutMode ? 'Herramienta: tijera' : `Llave activa: ${selectedKey}`;
  scissors.classList.toggle('is-active', cutMode);
  scissors.setAttribute('aria-pressed', String(cutMode));
  for (const button of document.querySelectorAll('.key')) {
    const active = !cutMode && button.dataset.key === selectedKey;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  const hint = document.querySelector('#tool-hint');
  hint.textContent = cutMode
    ? 'Tocá un cable para cortarlo. La tijera corta el cable completo.'
    : 'Elegí una llave y tocá origen y destino para conectar.';
}

function selectKey(key) {
  cutMode = false;
  selectedKey = key;
  if (workshop) {
    workshop.setSelectedKey(key);
  }
  renderTools();
}

function toggleScissors() {
  cutMode = !cutMode;
  if (!workshop) {
    return;
  }
  if (cutMode) {
    workshop.setCutting();
  } else {
    workshop.setSelectedKey(selectedKey);
  }
  renderTools();
}

function connectTransition(source, target, symbol) {
  const row = playerTransitions[source] ?? {};
  playerTransitions[source] = row;
  if (row[symbol] === target) {
    appendLog(`Ese cable ya está puesto: ${source} → ${target}.`);
    return;
  }
  if (symbol in row) {
    const previous = row[symbol];
    row[symbol] = target;
    appendLog(`Moviste la llave ${symbol}: ${previous} → ${target}.`);
    return;
  }
  row[symbol] = target;
  appendLog(`Conectaste la llave ${symbol}: ${source} → ${target}.`);
}

function cutWire(source, target) {
  const row = playerTransitions[source] ?? {};
  const symbols = Object.keys(row).filter(symbol => row[symbol] === target);
  if (symbols.length === 0) {
    return;
  }
  for (const symbol of symbols) {
    delete row[symbol];
  }
  appendLog(`Cortaste el cable ${symbols.join(',')}: ${source} → ${target}.`);
}

function renderLevel() {
  playerTransitions = structuredClone(level1.initialTransitions);
  selectedKey = level1.alphabet[0];
  cutMode = false;
  app.innerHTML = `
    <div class="game">
      <header class="game-header">
        <div>
          <p class="eyebrow">El Cerrajero</p>
          <h1>${level1.title}</h1>
        </div>
        <button id="back-button" class="ghost">Volver</button>
      </header>
      <main class="layout">
        <aside class="panel brief">
          <section class="contract" aria-label="Contrato del cliente">
            <p class="contract-number">Contrato ${level1.contract}</p>
            <h2 class="contract-client">${level1.client}</h2>
            <p class="contract-rule">${level1.goal}</p>
            <p class="contract-note">Cualquier otra combinación deja la alarma encendida.</p>
          </section>
          <h2>El encargo</h2>
          <p>${level1.brief}</p>
          <div class="legend">
            <span><i class="legend-dot legend-start"></i>Entrada</span>
            <span><i class="legend-dot legend-accept"></i>Cerrojo</span>
            <span><i class="legend-dot legend-alarm"></i>Alarma implícita</span>
          </div>
          <h2>Llaves y herramientas</h2>
          <div class="tools">
            <div id="palette" class="palette"></div>
            <button id="scissors" class="tool" type="button" aria-pressed="false" aria-label="Cortar cables">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
              </svg>
              <span>Cortar</span>
            </button>
          </div>
          <p id="tool-hint" class="hint"></p>
          <div class="actions">
            <button id="test-key" class="secondary">Probar la llave</button>
            <button id="heist" class="primary">Iniciar el asalto</button>
          </div>
        </aside>
        <section class="panel workshop">
          <div class="workshop-head">
            <h2>Taller</h2>
            <span id="active-key" class="active-key">Llave activa: ${selectedKey}</span>
          </div>
          <svg id="canvas" viewBox="0 0 820 520" role="img" aria-label="Mecanismo de la cerradura"></svg>
        </section>
        <aside class="panel log-panel">
          <h2>Bitácora</h2>
          <ul id="log" class="log" aria-live="polite" aria-label="Bitácora del taller"></ul>
        </aside>
      </main>
    </div>
  `;
  document.querySelector('#back-button').addEventListener('click', renderStart);
  renderPalette();
  workshop = createGraphEditor({
    svg: document.querySelector('#canvas'),
    level: level1,
    transitions: playerTransitions,
    onConnect: connectTransition,
    onCut: cutWire,
  });
  document.querySelector('#test-key').addEventListener('click', handleTestKey);
  document.querySelector('#scissors').addEventListener('click', toggleScissors);
  document.querySelector('#heist').addEventListener('click', handleHeist);
  renderTools();
  appendLog('El mecanismo está a medio armar.');
  appendLog('Probá la llave legítima y después llamá al ladrón.');
}

function handleTestKey() {
  const player = buildPlayerDFA(level1, playerTransitions);
  const result = testKey(player, level1.legitimateKey);
  if (result.accepted) {
    appendLog(`La llave ${level1.legitimateKey} abrió la caja.`, 'good');
  } else {
    appendLog(`La llave ${level1.legitimateKey} no abrió la caja.`, 'bad');
  }
  workshop.highlight(result.trace);
}

function handleHeist() {
  const player = buildPlayerDFA(level1, playerTransitions);
  const result = runHeist(player, level1.target);
  const report = thiefReport(result, level1);
  appendLog(report.text, report.tone);
  if (!result.escaped) {
    workshop.clearHighlight();
    showWin();
    return;
  }
  workshop.highlight(testKey(player, result.counterexample).trace);
}

function showWin() {
  const progress = loadProgress();
  if (!progress.completed.includes(level1.id)) {
    progress.completed.push(level1.id);
    saveProgress(progress);
  }
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="win-title">
      <p class="eyebrow">Contrato 01</p>
      <h2 id="win-title">Bóveda asegurada</h2>
      <p>El ladrón se rindió. El banco ya puede dormir.</p>
      <button id="modal-home" class="primary">Volver al inicio</button>
    </section>
  `;
  document.body.append(backdrop);
  document.querySelector('#modal-home').addEventListener('click', () => {
    backdrop.remove();
    renderStart();
  });
}

renderStart();
