import { level1 } from './game/level1.js';
import { buildPlayerDFA, runHeist, testKey } from './game/rules.js';
import { thiefReport } from './game/thief.js';
import { createWorkshop } from './ui/workshop.js';

const PROGRESS_KEY = 'el-cerrajero:progress';
const app = document.querySelector('#app');

let playerTransitions = structuredClone(level1.initialTransitions);
let workshop = null;
let selectedKey = level1.alphabet[0];

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
      <p class="progress">Contratos completados: ${progress.completed.length} / 5</p>
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
    button.className = `key key-${key}${key === selectedKey ? ' is-active' : ''}`;
    button.textContent = key;
    button.setAttribute('aria-label', `Llave ${key}`);
    button.setAttribute('aria-pressed', String(key === selectedKey));
    button.addEventListener('click', () => selectKey(key));
    palette.append(button);
  }
}

function selectKey(key) {
  selectedKey = key;
  document.querySelector('#active-key').textContent = `Llave activa: ${key}`;
  for (const button of document.querySelectorAll('.key')) {
    const active = button.textContent === key;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (workshop) {
    workshop.setSelectedKey(key);
  }
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

function cutWire(source, symbol) {
  const row = playerTransitions[source] ?? {};
  if (!(symbol in row)) {
    return;
  }
  const target = row[symbol];
  delete row[symbol];
  appendLog(`Cortaste el cable ${symbol}: ${source} → ${target}.`);
}

function renderLevel() {
  playerTransitions = structuredClone(level1.initialTransitions);
  selectedKey = level1.alphabet[0];
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
          <h2>Llaves</h2>
          <div id="palette" class="palette"></div>
          <p class="hint">Elegí una llave y tocá origen y destino para conectar. Tocá un cable para cortarlo. Un cable que falta manda la llave a la alarma.</p>
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
  workshop = createWorkshop({
    svg: document.querySelector('#canvas'),
    level: level1,
    transitions: playerTransitions,
    onConnect: connectTransition,
    onCut: cutWire,
  });
  document.querySelector('#test-key').addEventListener('click', handleTestKey);
  document.querySelector('#heist').addEventListener('click', handleHeist);
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
