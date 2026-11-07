import { LEVELS, levelStatus } from './game/catalog.js';
import { getLevel } from './game/levels.js';
import { applyEdit } from './game/blueprint.js';
import { toMachine } from './game/machines.js';
import { runDFA } from './core/dfa.js';
import { runNFA } from './core/nfa.js';
import { judge } from './game/judge.js';
import { thiefReport } from './game/thief.js';
import { createGraphEditor } from './ui/graphEditor.js';
const PROGRESS_KEY = 'el-cerrajero:progress';
const app = document.querySelector('#app');
const state = { level: null, phase: 'repair', puzzle: null, blueprint: null };
let workshop = null;
let selectedKey = null;
let cutMode = false;
let springMode = false;
const ICON_LOCK = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>';
const ICON_KEY = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="16" r="4"></circle><path d="M11 13 20 4"></path><path d="M16 8l3 3"></path><path d="M13.5 10.5l2.5 2.5"></path></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"></path></svg>';
const ICON_CROWN = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l3.5 3L12 5l5.5 6L21 8l-1.6 10H4.6L3 8z"></path><path d="M5 21h14"></path></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l14 8-14 8z"></path></svg>';
function statusWord(status) {
  if (status === 'completed') {
    return 'Completado';
  }
  if (status === 'available') {
    return 'Disponible';
  }
  return 'Bloqueado';
}
function statusIcon(status) {
  if (status === 'completed') {
    return ICON_CHECK;
  }
  if (status === 'available') {
    return ICON_KEY;
  }
  return ICON_LOCK;
}
function levelAlphabet() {
  return state.level.keys.map((entry) => entry.symbol);
}
function phaseWord() {
  if (state.phase === 'repair') {
    return 'Reparación';
  }
  return 'Construcción';
}
function handleLevelOpen(level) {
  if (level.playable) {
    startLevel(level.id);
    return;
  }
  const note = document.querySelector('#map-note');
  note.textContent = `El contrato ${level.contract} todavía está en preparación.`;
}
function buildLevelCard(level, progress) {
  const status = levelStatus(level, progress);
  const card = document.createElement('article');
  card.className = `level-card is-${status}`;
  card.setAttribute('role', 'listitem');
  if (level.boss) {
    card.setAttribute('data-boss', 'true');
  }
  const medallion = document.createElement('div');
  medallion.className = 'level-medallion';
  if (level.boss) {
    medallion.innerHTML = ICON_CROWN;
  } else {
    medallion.textContent = level.contract;
  }
  const contract = document.createElement('p');
  contract.className = 'level-contract';
  contract.textContent = `Contrato ${level.contract}`;
  const heading = document.createElement('h2');
  heading.className = 'level-title';
  heading.textContent = level.title;
  const client = document.createElement('p');
  client.className = 'level-client';
  client.textContent = level.client;
  card.append(medallion);
  card.append(contract);
  card.append(heading);
  card.append(client);
  if (level.boss) {
    const bossLabel = document.createElement('p');
    bossLabel.className = 'boss-label';
    bossLabel.textContent = 'Jefe final';
    card.append(bossLabel);
  }
  const statusRow = document.createElement('div');
  statusRow.className = 'level-status';
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = statusIcon(status);
  const label = document.createElement('span');
  label.textContent = statusWord(status);
  button.append(label);
  button.setAttribute('aria-label', `Contrato ${level.contract}: ${level.title}, ${statusWord(status)}`);
  if (status === 'locked') {
    button.disabled = true;
  } else {
    button.addEventListener('click', () => handleLevelOpen(level));
  }
  statusRow.append(button);
  card.append(statusRow);
  return card;
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw === null) {
      return { completed: [] };
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.completed)) {
      return { completed: parsed.completed };
    }
    return { completed: [] };
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
  if (log === null) {
    return;
  }
  const item = document.createElement('li');
  if (tone === '') {
    item.className = 'log-item';
  } else {
    item.className = `log-item ${tone}`;
  }
  item.textContent = message;
  log.append(item);
  log.scrollTop = log.scrollHeight;
}
function renderTitle() {
  const progress = loadProgress();
  app.replaceChildren();
  const main = document.createElement('main');
  main.className = 'start title-screen';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'Proyecto final';
  const title = document.createElement('h1');
  title.textContent = 'El Cerrajero';
  const lead = document.createElement('p');
  lead.className = 'lead';
  lead.textContent = 'Sos el mejor cerrajero de la ciudad. Cada bóveda es un mecanismo; cada mecanismo, un secreto. El ladrón ya está afuera.';
  const button = document.createElement('button');
  button.id = 'play-button';
  button.type = 'button';
  button.className = 'primary';
  button.innerHTML = ICON_PLAY;
  const label = document.createElement('span');
  label.textContent = 'Jugar';
  button.append(label);
  button.addEventListener('click', renderMap);
  const progressLine = document.createElement('p');
  progressLine.className = 'progress';
  progressLine.textContent = `Contratos completados: ${progress.completed.length} / 5 · build 4`;
  main.append(eyebrow);
  main.append(title);
  main.append(lead);
  main.append(button);
  main.append(progressLine);
  app.append(main);
}
function renderMap() {
  const progress = loadProgress();
  app.replaceChildren();
  const main = document.createElement('main');
  main.className = 'start map-screen';
  const head = document.createElement('div');
  head.className = 'map-head';
  const headText = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'Contratos';
  const title = document.createElement('h1');
  title.textContent = 'Elegí un contrato';
  headText.append(eyebrow);
  headText.append(title);
  const back = document.createElement('button');
  back.id = 'map-back';
  back.type = 'button';
  back.className = 'ghost';
  back.textContent = 'Volver';
  back.addEventListener('click', renderTitle);
  head.append(headText);
  head.append(back);
  const strip = document.createElement('div');
  strip.className = 'map-strip';
  strip.setAttribute('role', 'list');
  for (const level of LEVELS) {
    strip.append(buildLevelCard(level, progress));
  }
  const note = document.createElement('p');
  note.id = 'map-note';
  note.className = 'map-note';
  note.setAttribute('aria-live', 'polite');
  const progressLine = document.createElement('p');
  progressLine.className = 'progress';
  progressLine.textContent = `Contratos completados: ${progress.completed.length} / 5 · build 4`;
  main.append(head);
  main.append(strip);
  main.append(note);
  main.append(progressLine);
  app.append(main);
}
function renderPalette() {
  const palette = document.querySelector('#palette');
  palette.replaceChildren();
  for (const entry of state.level.keys) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `key key-${entry.symbol}`;
    button.dataset.key = entry.symbol;
    button.textContent = entry.symbol;
    button.setAttribute('aria-label', `Llave ${entry.symbol}`);
    button.addEventListener('click', () => selectKey(entry.symbol));
    palette.append(button);
  }
}
function renderTools() {
  const activeKey = document.querySelector('#active-key');
  const scissors = document.querySelector('#scissors');
  if (activeKey === null || scissors === null) {
    return;
  }
  if (cutMode) {
    activeKey.textContent = 'Herramienta: tijera';
  } else if (springMode) {
    activeKey.textContent = 'Herramienta: resorte';
  } else {
    activeKey.textContent = `Llave activa: ${selectedKey}`;
  }
  if (cutMode) {
    scissors.classList.add('is-active');
  } else {
    scissors.classList.remove('is-active');
  }
  scissors.setAttribute('aria-pressed', String(cutMode));
  const spring = document.querySelector('#spring-tool');
  if (spring !== null) {
    if (springMode) {
      spring.classList.add('is-active');
    } else {
      spring.classList.remove('is-active');
    }
    spring.setAttribute('aria-pressed', String(springMode));
  }
  for (const button of document.querySelectorAll('.key')) {
    const active = cutMode === false && springMode === false && button.dataset.key === selectedKey;
    if (active) {
      button.classList.add('is-active');
    } else {
      button.classList.remove('is-active');
    }
    button.setAttribute('aria-pressed', String(active));
  }
  const hint = document.querySelector('#tool-hint');
  if (cutMode) {
    hint.textContent = 'Tocá un cable para cortarlo. La tijera corta el cable completo.';
  } else if (springMode) {
    hint.textContent = 'Tocá origen y destino para tender un resorte.';
  } else {
    hint.textContent = 'Elegí una llave y tocá origen y destino para conectar.';
  }
}
function selectKey(key) {
  cutMode = false;
  springMode = false;
  selectedKey = key;
  if (workshop !== null) {
    workshop.setSelectedKey(key);
  }
  renderTools();
}
function toggleScissors() {
  cutMode = cutMode === false;
  springMode = false;
  if (workshop === null) {
    return;
  }
  if (cutMode) {
    workshop.setCutting();
  } else {
    workshop.setSelectedKey(selectedKey);
  }
  renderTools();
}
function toggleSpring() {
  springMode = springMode === false;
  cutMode = false;
  if (workshop === null) {
    return;
  }
  if (springMode) {
    workshop.setSpring();
  } else {
    workshop.setSelectedKey(selectedKey);
  }
  renderTools();
}
function cableKeys(from, to) {
  const keys = [];
  for (const wire of state.blueprint.wires) {
    if (wire.from === from && wire.to === to && wire.spring !== true) {
      keys.push(wire.key);
    }
  }
  return keys.join(',');
}
function previousTarget(from, key) {
  const found = state.blueprint.wires.find((wire) => wire.from === from && wire.key === key && wire.spring !== true);
  if (found === undefined) {
    return null;
  }
  return found.to;
}
function handleConnect(from, to, tool) {
  const key = tool.kind === 'spring' ? null : tool.key;
  const before = tool.kind === 'spring' ? null : previousTarget(from, tool.key);
  const result = applyEdit(state.puzzle, state.level.parts, state.blueprint, { type: 'connect-wire', from, to, tool });
  if (result.effect === 'blocked') {
    if (result.reason === 'needs-gear') {
      appendLog('Ese cable necesita un engranaje para cerrar sobre la misma celda.', 'bad');
    } else if (result.reason === 'spring-loop') {
      appendLog('Ese resorte no se puede tender sobre la misma celda.', 'bad');
    } else {
      appendLog('Ese cable no se puede conectar sobre la misma celda.', 'bad');
    }
    return;
  }
  if (result.effect === 'kept') {
    if (tool.kind === 'spring') {
      appendLog(`Ese resorte ya está puesto: ${from} → ${to}.`);
    } else {
      appendLog(`Ese cable ya está puesto: ${from} → ${to}.`);
    }
    return;
  }
  state.blueprint = result.blueprint;
  workshop.setBlueprint(state.blueprint);
  if (tool.kind === 'spring') {
    appendLog(`Tendiste un resorte: ${from} → ${to}.`);
    return;
  }
  if (result.effect === 'moved') {
    appendLog(`Moviste la llave ${key}: ${before} → ${to}.`);
    return;
  }
  appendLog(`Conectaste la llave ${key}: ${from} → ${to}.`);
}
function handleCut(from, to) {
  const keys = cableKeys(from, to);
  const result = applyEdit(state.puzzle, state.level.parts, state.blueprint, { type: 'cut-wire', from, to });
  if (result.effect === 'kept') {
    appendLog(`Ese cable ya está puesto: ${from} → ${to}.`);
    return;
  }
  state.blueprint = result.blueprint;
  workshop.setBlueprint(state.blueprint);
  if (keys === '') {
    appendLog(`Cortaste el resorte: ${from} → ${to}.`);
    return;
  }
  appendLog(`Cortaste el cable ${keys}: ${from} → ${to}.`);
}
function startLevel(id) {
  state.level = getLevel(id);
  state.phase = 'repair';
  state.puzzle = state.level.phases.repair;
  state.blueprint = structuredClone(state.puzzle.blueprint);
  selectedKey = state.level.keys[0].symbol;
  cutMode = false;
  springMode = false;
  renderWorkshop();
}
function startBuild() {
  state.phase = 'build';
  state.puzzle = state.level.phases.build;
  state.blueprint = structuredClone(state.puzzle.blueprint);
  selectedKey = state.level.keys[0].symbol;
  cutMode = false;
  springMode = false;
  renderWorkshop();
}
function renderWorkshop() {
  app.replaceChildren();
  const shell = document.createElement('div');
  shell.className = 'game';
  const header = document.createElement('header');
  header.className = 'game-header';
  const headerText = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'El Cerrajero';
  const title = document.createElement('h1');
  title.textContent = `Contrato ${state.level.contract} · ${phaseWord()}`;
  headerText.append(eyebrow);
  headerText.append(title);
  const back = document.createElement('button');
  back.id = 'back-button';
  back.type = 'button';
  back.className = 'ghost';
  back.textContent = 'Volver';
  back.addEventListener('click', renderMap);
  header.append(headerText);
  header.append(back);
  const layout = document.createElement('main');
  layout.className = 'layout';
  const brief = document.createElement('aside');
  brief.className = 'panel brief';
  const contract = document.createElement('section');
  contract.className = 'contract';
  contract.setAttribute('aria-label', 'Contrato del cliente');
  const number = document.createElement('p');
  number.className = 'contract-number';
  number.textContent = `Contrato ${state.level.contract}`;
  const client = document.createElement('h2');
  client.className = 'contract-client';
  client.textContent = state.level.client;
  const rule = document.createElement('p');
  rule.className = 'contract-rule';
  rule.textContent = state.puzzle.goal;
  const note = document.createElement('p');
  note.className = 'contract-note';
  note.textContent = 'Cualquier otra combinación deja la alarma encendida.';
  contract.append(number);
  contract.append(client);
  contract.append(rule);
  contract.append(note);
  const briefTitle = document.createElement('h2');
  briefTitle.textContent = 'El encargo';
  const intro = document.createElement('p');
  intro.textContent = state.puzzle.intro;
  const legend = document.createElement('div');
  legend.className = 'legend';
  for (const [dot, word] of [['legend-start', 'Entrada'], ['legend-accept', 'Cerrojo'], ['legend-alarm', 'Alarma implícita']]) {
    const entry = document.createElement('span');
    const icon = document.createElement('i');
    icon.className = `legend-dot ${dot}`;
    entry.append(icon);
    entry.append(word);
    legend.append(entry);
  }
  const toolsTitle = document.createElement('h2');
  toolsTitle.textContent = 'Llaves y herramientas';
  const tools = document.createElement('div');
  tools.className = 'tools';
  const palette = document.createElement('div');
  palette.id = 'palette';
  palette.className = 'palette';
  const scissors = document.createElement('button');
  scissors.id = 'scissors';
  scissors.type = 'button';
  scissors.className = 'tool';
  scissors.setAttribute('aria-pressed', 'false');
  scissors.setAttribute('aria-label', 'Cortar cables');
  scissors.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>';
  const scissorsLabel = document.createElement('span');
  scissorsLabel.textContent = 'Cortar';
  scissors.append(scissorsLabel);
  tools.append(palette);
  tools.append(scissors);
  if (state.level.parts.includes('spring')) {
    const spring = document.createElement('button');
    spring.id = 'spring-tool';
    spring.type = 'button';
    spring.className = 'tool';
    spring.setAttribute('aria-pressed', 'false');
    spring.setAttribute('aria-label', 'Tender resortes');
    spring.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l3-6 3 12 3-12 3 12 3-12 3 6"></path></svg>';
    const springLabel = document.createElement('span');
    springLabel.textContent = 'Resorte';
    spring.append(springLabel);
    spring.addEventListener('click', toggleSpring);
    tools.append(spring);
  }
  const hint = document.createElement('p');
  hint.id = 'tool-hint';
  hint.className = 'hint';
  const actions = document.createElement('div');
  actions.className = 'actions';
  const probe = document.createElement('button');
  probe.id = 'test-key';
  probe.type = 'button';
  probe.className = 'secondary';
  probe.textContent = 'Probar la llave';
  const assault = document.createElement('button');
  assault.id = 'heist';
  assault.type = 'button';
  assault.className = 'primary';
  if (state.phase === 'repair') {
    assault.textContent = 'Ensayo';
  } else {
    assault.textContent = 'Asalto';
  }
  actions.append(probe);
  actions.append(assault);
  brief.append(contract);
  brief.append(briefTitle);
  brief.append(intro);
  brief.append(legend);
  brief.append(toolsTitle);
  brief.append(tools);
  brief.append(hint);
  brief.append(actions);
  const shop = document.createElement('section');
  shop.className = 'panel workshop';
  const shopHead = document.createElement('div');
  shopHead.className = 'workshop-head';
  const shopTitle = document.createElement('h2');
  shopTitle.textContent = 'Taller';
  const active = document.createElement('span');
  active.id = 'active-key';
  active.className = 'active-key';
  active.textContent = `Llave activa: ${selectedKey}`;
  shopHead.append(shopTitle);
  shopHead.append(active);
  const canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  canvas.id = 'canvas';
  canvas.setAttribute('viewBox', '0 0 820 520');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Mecanismo de la cerradura');
  shop.append(shopHead);
  shop.append(canvas);
  const logPanel = document.createElement('aside');
  logPanel.className = 'panel log-panel';
  const logTitle = document.createElement('h2');
  logTitle.textContent = 'Bitácora';
  const log = document.createElement('ul');
  log.id = 'log';
  log.className = 'log';
  log.setAttribute('aria-live', 'polite');
  log.setAttribute('aria-label', 'Bitácora del taller');
  logPanel.append(logTitle);
  logPanel.append(log);
  layout.append(brief);
  layout.append(shop);
  layout.append(logPanel);
  shell.append(header);
  shell.append(layout);
  app.append(shell);
  renderPalette();
  workshop = createGraphEditor({ svg: document.querySelector('#canvas'), cells: state.puzzle.cells, alphabet: levelAlphabet(), blueprint: state.blueprint, onConnect: handleConnect, onCut: handleCut });
  document.querySelector('#test-key').addEventListener('click', handleProbe);
  document.querySelector('#scissors').addEventListener('click', toggleScissors);
  document.querySelector('#heist').addEventListener('click', handleAssault);
  renderTools();
  appendLog(state.puzzle.intro);
  if (state.phase === 'repair') {
    appendLog('Probá la llave y después pedí el ensayo.');
  } else {
    appendLog('Probá la llave y después lanzá el asalto.');
  }
}
function runMachine(machine, word, options) {
  if (machine.type === 'nfa') {
    return runNFA(machine, word, options);
  }
  return runDFA(machine, word, options);
}
function frameStates(frames) {
  if (Array.isArray(frames[0]?.active)) {
    return frames.flatMap((frame) => frame.active);
  }
  return frames.map((frame) => frame.state);
}
function handleProbe() {
  const machine = toMachine(levelAlphabet(), state.puzzle, state.blueprint);
  const word = state.puzzle.examples.open[0];
  const result = runMachine(machine, word, { record: true });
  if (result.accepted) {
    appendLog(`La llave ${word} abrió la caja.`, 'good');
  } else {
    appendLog(`La llave ${word} no abrió la caja.`, 'bad');
  }
  workshop.highlight(frameStates(result.frames));
}
function handleAssault() {
  const machine = toMachine(levelAlphabet(), state.puzzle, state.blueprint);
  const verdict = judge(state.puzzle, machine);
  const report = thiefReport(verdict, state.level);
  appendLog(report.text, report.tone);
  if (verdict.correct) {
    workshop.clearHighlight();
    if (state.phase === 'repair' && state.level.phases.build !== undefined) {
      showRepairModal();
    } else {
      showWin();
    }
    return;
  }
  if (verdict.counterexample !== null) {
    const replay = runMachine(machine, verdict.counterexample, { record: true });
    workshop.highlight(frameStates(replay.frames));
  }
}
function openModal(eyebrow, title, body, actionLabel, onAction) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('section');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  const brow = document.createElement('p');
  brow.className = 'eyebrow';
  brow.textContent = eyebrow;
  const heading = document.createElement('h2');
  heading.textContent = title;
  const text = document.createElement('p');
  text.textContent = body;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'primary';
  button.textContent = actionLabel;
  button.addEventListener('click', () => {
    backdrop.remove();
    onAction();
  });
  modal.append(brow);
  modal.append(heading);
  modal.append(text);
  modal.append(button);
  backdrop.append(modal);
  backdrop.tabIndex = -1;
  backdrop.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      backdrop.remove();
    }
  });
  document.body.append(backdrop);
  button.focus();
}
function showRepairModal() {
  openModal(`Contrato ${state.level.contract}`, 'Mecanismo reparado', state.level.phases.build.goal, 'Construir el nuevo', startBuild);
}
function showWin() {
  const progress = loadProgress();
  if (progress.completed.includes(state.level.id) === false) {
    progress.completed.push(state.level.id);
    saveProgress(progress);
  }
  openModal(`Contrato ${state.level.contract}`, 'Bóveda asegurada', state.level.thief.giveUp, 'Volver al mapa', renderMap);
}
renderTitle();
