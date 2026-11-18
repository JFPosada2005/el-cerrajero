import { LEVELS, levelStatus } from './game/catalog.js';
import { getLevel } from './game/levels.js';
import { applyEdit } from './game/blueprint.js';
import { toMachine } from './game/machines.js';
import { runDFA } from './core/dfa.js';
import { runNFA } from './core/nfa.js';
import { runPDA } from './core/pda.js';
import { runTM } from './core/tm.js';
import { functionFor } from './game/functions.js';
import { judge } from './game/judge.js';
import { thiefReport } from './game/thief.js';
import { createGraphEditor } from './ui/graphEditor.js';
import { createDrumEditor } from './ui/drumEditor.js';
import { createTapePanel } from './ui/tapePanel.js';
import { createWorkbenchScene } from './ui/workbenchScene.js';
import { decorateGraph } from './ui/graphVisuals.js';
import { createLevelScene as createLevel1Scene } from './ui/levels/level1Scene.js';
import { createLevelScene as createLevel2Scene } from './ui/levels/level2Scene.js';
import { createLevelScene as createLevel3Scene } from './ui/levels/level3Scene.js';
import { createLevelScene as createLevel4Scene } from './ui/levels/level4Scene.js';
import { createLevelScene as createLevel5Scene } from './ui/levels/level5Scene.js';
import { loadManifest } from './ui/assets.js';
import { createAudio } from './ui/audio.js';
const PROGRESS_KEY = 'el-cerrajero:progress';
const SOUND_KEY = 'el-cerrajero:sound';
const app = document.querySelector('#app');
const state = { level: null, phase: 'repair', puzzle: null, blueprint: null };
let workshop = null;
let drumEditor = null;
let tapePanel = null;
let workbenchView = null;
let graphVisuals = null;
let audio = null;
let manifest = null;
let soundOn = true;
if (typeof localStorage !== 'undefined') {
  try {
    if (localStorage.getItem(SOUND_KEY) === 'off') {
      soundOn = false;
    }
  } catch {
    // Sin almacenamiento disponible, el sonido queda encendido.
  }
}
let selectedKey = null;
let cutMode = false;
let springMode = false;
let stackTop = 'any';
let stackAction = 'keep';
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
  if (workbenchView !== null) {
    const normalized = tone === 'good' ? 'good' : tone === 'bad' ? 'bad' : 'neutral';
    workbenchView.addLog(message, normalized);
    return;
  }
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
  if (graphVisuals !== null) {
    graphVisuals.dispose();
    graphVisuals = null;
  }
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
  if (graphVisuals !== null) {
    graphVisuals.dispose();
    graphVisuals = null;
  }
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
    // Tono del carrete: el CSS tiñe por data-tone; data-key queda como fallback 1–4.
    if (typeof entry.tone === 'string' && entry.tone !== '') {
      button.setAttribute('data-tone', entry.tone);
    }
    button.textContent = entry.symbol;
    button.setAttribute('aria-label', `Llave ${entry.symbol}`);
    button.addEventListener('click', () => selectKey(entry.symbol));
    palette.append(button);
  }
}
function stackTopWord() {
  if (stackTop === 'base') {
    return 'base';
  }
  if (stackTop === 'chip') {
    return 'ficha';
  }
  return 'da igual';
}
function stackActionWord() {
  if (stackAction === 'push') {
    return 'cargar';
  }
  if (stackAction === 'pop') {
    return 'soltar';
  }
  return 'no tocar';
}
function selectStackTop(value) {
  stackTop = value;
  renderTools();
}
function selectStackAction(value) {
  stackAction = value;
  renderTools();
}
function renderStack(stack) {
  const panel = document.querySelector('#stack-panel');
  if (panel === null) {
    return;
  }
  panel.replaceChildren();
  if (stack.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'stack-empty';
    empty.textContent = 'vacía';
    panel.append(empty);
    return;
  }
  for (const symbol of stack) {
    const chip = document.createElement('div');
    chip.className = 'stack-chip';
    if (symbol === state.puzzle.stack.base) {
      chip.textContent = state.puzzle.stack.labels.base;
      chip.classList.add('is-base');
    } else {
      chip.textContent = state.puzzle.stack.labels.chip;
    }
    panel.append(chip);
  }
}
function renderTools() {
  const activeKey = document.querySelector('#active-key');
  const scissors = document.querySelector('#scissors');
  if (activeKey === null || scissors === null) {
    return;
  }
  const short = document.querySelector('.wb-scene.is-immersive') !== null;
  if (cutMode) {
    activeKey.textContent = short ? 'Tijera' : 'Herramienta: tijera';
  } else if (springMode) {
    activeKey.textContent = short ? 'Resorte' : 'Herramienta: resorte';
  } else {
    activeKey.textContent = symbolText();
  }
  if (cutMode) {
    scissors.classList.add('is-active');
  } else {
    scissors.classList.remove('is-active');
  }
  scissors.setAttribute('aria-pressed', String(cutMode));
  for (const node of document.querySelectorAll('[data-action="cut"]')) {
    node.classList.toggle('is-active', cutMode);
    node.setAttribute('aria-pressed', String(cutMode));
  }
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
  if (hint !== null) {
    if (cutMode) {
      hint.textContent = 'Tocá un cable para cortarlo. La tijera corta el cable completo.';
    } else if (springMode) {
      hint.textContent = 'Tocá origen y destino para tender un resorte.';
    } else {
      hint.textContent = 'Elegí una llave y tocá origen y destino para conectar.';
    }
  }
  if (state.level.machine === 'pda') {
    for (const [id, value] of [['#stack-top-any', 'any'], ['#stack-top-base', 'base'], ['#stack-top-chip', 'chip']]) {
      const button = document.querySelector(id);
      if (button === null) {
        continue;
      }
      const topActive = stackTop === value;
      if (topActive) {
        button.classList.add('is-active');
      } else {
        button.classList.remove('is-active');
      }
      button.setAttribute('aria-pressed', String(topActive));
    }
    for (const [id, value] of [['#stack-action-keep', 'keep'], ['#stack-action-push', 'push'], ['#stack-action-pop', 'pop']]) {
      const button = document.querySelector(id);
      if (button === null) {
        continue;
      }
      const actionActive = stackAction === value;
      if (actionActive) {
        button.classList.add('is-active');
      } else {
        button.classList.remove('is-active');
      }
      button.setAttribute('aria-pressed', String(actionActive));
    }
  }
  // Reflejo genérico: los selectores del escenario marcan su estado igual.
  for (const node of document.querySelectorAll('[data-stack-top]')) {
    const topActive = node.getAttribute('data-stack-top') === stackTop;
    node.classList.toggle('is-active', topActive);
    node.setAttribute('aria-pressed', String(topActive));
  }
  for (const node of document.querySelectorAll('[data-stack-action]')) {
    const actionActive = node.getAttribute('data-stack-action') === stackAction;
    node.classList.toggle('is-active', actionActive);
    node.setAttribute('aria-pressed', String(actionActive));
  }
}
function selectKey(key) {
  cutMode = false;
  springMode = false;
  selectedKey = key;
  sfx('click');
  if (workshop !== null) {
    workshop.setSelectedKey(key);
  }
  renderTools();
}
function toggleScissors() {
  cutMode = cutMode === false;
  springMode = false;
  sfx('click');
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
  sfx('click');
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
  const editTool = tool.kind === 'spring' ? { kind: 'spring' } : { kind: 'key', key: tool.key };
  if (state.level.machine === 'pda') {
    editTool.stack = { top: stackTop, action: stackAction };
  }
  const result = applyEdit(state.puzzle, state.level.parts, state.blueprint, { type: 'connect-wire', from, to, tool: editTool });
  if (result.effect === 'blocked') {
    sfx('error');
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
    sfx('error');
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
    sfx('cable');
    appendLog(`Tendiste un resorte: ${from} → ${to}.`);
    return;
  }
  if (result.effect === 'moved') {
    sfx('cable');
    appendLog(`Moviste la llave ${key}: ${before} → ${to}.`);
    return;
  }
  sfx('cable');
  appendLog(`Conectaste la llave ${key}: ${from} → ${to}.`);
}
function handleCut(from, to) {
  const keys = cableKeys(from, to);
  const result = applyEdit(state.puzzle, state.level.parts, state.blueprint, { type: 'cut-wire', from, to });
  if (result.effect === 'kept') {
    sfx('error');
    appendLog(`Ese cable ya está puesto: ${from} → ${to}.`);
    return;
  }
  state.blueprint = result.blueprint;
  workshop.setBlueprint(state.blueprint);
  sfx('cut');
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
  selectedKey = firstKey();
  cutMode = false;
  springMode = false;
  stackTop = 'any';
  stackAction = 'keep';
  renderWorkshop();
}
function startBuild() {
  state.phase = 'build';
  state.puzzle = state.level.phases.build;
  state.blueprint = structuredClone(state.puzzle.blueprint);
  selectedKey = firstKey();
  cutMode = false;
  springMode = false;
  stackTop = 'any';
  stackAction = 'keep';
  renderWorkshop();
}
function firstKey() {
  if (state.level.keys.length === 0) {
    return null;
  }
  return state.level.keys[0].symbol;
}
function selectedEntry() {
  return state.level.keys.find((entry) => entry.symbol === selectedKey) ?? null;
}
function symbolText() {
  const entry = selectedEntry();
  const symbol = entry === null ? selectedKey : entry.symbol;
  if (entry !== null && typeof entry.label === 'string' && entry.label.trim() !== '' && entry.label !== entry.symbol) {
    return `Símbolo: ${symbol} · ${entry.label}`;
  }
  return `Símbolo: ${symbol}`;
}
function createLevelSceneFor(level) {
  const options = { level, puzzle: state.puzzle, phase: state.phase };
  if (level.id === 5) {
    return createLevel5Scene(options);
  }
  if (level.id === 4) {
    return createLevel4Scene(options);
  }
  if (level.id === 3) {
    return createLevel3Scene(options);
  }
  if (level.id === 2) {
    return createLevel2Scene(options);
  }
  return createLevel1Scene(options);
}
function renderSceneWorkshop() {
  if (graphVisuals !== null) {
    graphVisuals.dispose();
    graphVisuals = null;
  }
  const scene = createWorkbenchScene({
    contract: state.level.contract,
    title: state.level.title,
    client: state.level.client,
    phase: phaseWord(),
    objective: { rule: state.puzzle.goal, intro: state.puzzle.intro },
    soundEnabled: soundOn,
    diegeticActions: true,
    immersive: true,
    handlers: {
      onBack: renderMap,
      onProbe: handleProbe,
      onAssault: handleAssault,
      onOpenDoc: openWorkshopDoc,
      onToggleSound: toggleSound
    }
  });
  workbenchView = scene;
  const levelScene = createLevelSceneFor(state.level);
  app.replaceChildren(scene.element);
  scene.slots.stage.append(levelScene.element);

  const diegeticHandlers = {
    contract: () => openWorkshopDoc('contract'),
    hint: () => openWorkshopDoc('hint'),
    log: () => openWorkshopDoc('log'),
    probe: handleProbe,
    assault: handleAssault,
    cut: toggleScissors,
  };
  for (const node of levelScene.element.querySelectorAll('[data-action]')) {
    const handler = diegeticHandlers[node.getAttribute('data-action')];
    if (typeof handler === 'function') {
      node.addEventListener('click', handler);
    }
  }

  // Selectores de pila del escenario (N4): la escena decide, el taller obedece.
  for (const node of levelScene.element.querySelectorAll('[data-stack-top]')) {
    const value = node.getAttribute('data-stack-top');
    node.addEventListener('click', () => selectStackTop(value));
  }
  for (const node of levelScene.element.querySelectorAll('[data-stack-action]')) {
    const value = node.getAttribute('data-stack-action');
    node.addEventListener('click', () => selectStackAction(value));
  }

  const canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  canvas.id = 'canvas';
  canvas.setAttribute('viewBox', '0 0 820 520');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Mecanismo de la cerradura');
  levelScene.editorSlot.append(canvas);

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
  if (levelScene.element.querySelector('[data-action="cut"]') !== null) {
    scissors.hidden = true;
    scissors.style.display = 'none';
  }
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
  let stackTools = null;
  let stackHelp = null;
  if (state.level.machine === 'pda') {
    stackTools = document.createElement('div');
    stackTools.className = 'stack-tools';
    const topText = document.createElement('span');
    topText.className = 'stack-tools-label';
    topText.textContent = 'Si la pila tiene arriba';
    stackTools.append(topText);
    for (const [id, value, word] of [['stack-top-any', 'any', 'Da igual'], ['stack-top-base', 'base', 'Base'], ['stack-top-chip', 'chip', 'Ficha']]) {
      const option = document.createElement('button');
      option.id = id;
      option.type = 'button';
      option.className = 'tool';
      option.textContent = word;
      option.setAttribute('aria-pressed', String(stackTop === value));
      option.addEventListener('click', () => selectStackTop(value));
      stackTools.append(option);
    }
    const actionText = document.createElement('span');
    actionText.className = 'stack-tools-label';
    actionText.textContent = 'Acción';
    stackTools.append(actionText);
    for (const [id, value, word] of [['stack-action-keep', 'keep', 'No tocar'], ['stack-action-push', 'push', 'Cargar'], ['stack-action-pop', 'pop', 'Soltar']]) {
      const option = document.createElement('button');
      option.id = id;
      option.type = 'button';
      option.className = 'tool';
      option.textContent = word;
      option.setAttribute('aria-pressed', String(stackAction === value));
      option.addEventListener('click', () => selectStackAction(value));
      stackTools.append(option);
    }
    stackHelp = document.createElement('p');
    stackHelp.className = 'stack-help';
    stackHelp.textContent = 'La pila es memoria: cargar apila, soltar saca, no tocar deja igual. Se lee: llave · arriba · acción.';
  }
  const toolsTitle = document.createElement('h2');
  toolsTitle.textContent = 'Herramientas';
  scene.slots.inventory.append(toolsTitle);
  // Ranuras de la escena: si el nivel expone `keysSlot`, los carretes y las
  // herramientas viven en la mesa; si no, queda el inventario del shell.
  const keysHost = levelScene.keysSlot ?? scene.slots.inventory;
  keysHost.append(tools);
  // Si la escena ya trae sus selectores de pila, la fila del shell sobra.
  const hasDiegeticStack = levelScene.element.querySelector('[data-stack-top]') !== null;
  if (stackTools !== null && !hasDiegeticStack) {
    keysHost.append(stackTools);
  }
  if (stackHelp !== null) {
    scene.slots.status.append(stackHelp);
  }

  const immersive = scene.element.classList.contains('is-immersive');
  const active = document.createElement('span');
  active.id = 'active-key';
  active.className = 'active-key';
  active.textContent = symbolText();
  scene.slots.status.append(active);

  const legend = document.createElement('div');
  legend.className = 'legend';
  const alarmWord = immersive ? 'Alarma' : 'Alarma implícita';
  for (const [dot, word] of [['legend-start', 'Entrada'], ['legend-accept', 'Cerrojo'], ['legend-alarm', alarmWord]]) {
    const entry = document.createElement('span');
    const icon = document.createElement('i');
    icon.className = `legend-dot ${dot}`;
    entry.append(icon);
    entry.append(word);
    legend.append(entry);
  }
  scene.slots.status.append(legend);

  const hint = document.createElement('p');
  hint.id = 'tool-hint';
  hint.className = 'hint';
  // En inmersivo la ayuda vive en contrato/pista; la línea queda en una sola frase.
  if (!immersive) {
    scene.slots.status.append(hint);
  }

  if (state.level.machine === 'pda') {
    const block = document.createElement('div');
    block.className = 'stack-block';
    const stackTitle = document.createElement('h2');
    stackTitle.textContent = 'Pila · arriba primero';
    const stackPanel = document.createElement('div');
    stackPanel.id = 'stack-panel';
    stackPanel.className = 'stack-panel';
    stackPanel.setAttribute('aria-live', 'polite');
    stackPanel.setAttribute('aria-label', 'Pila del mecanismo');
    block.append(stackTitle);
    block.append(stackPanel);
    const host = levelScene.statusSlot ?? scene.slots.status;
    host.append(block);
  }

  // La línea de estado se muda a la mesa cuando la escena expone su ranura.
  if (levelScene.hudSlot) {
    levelScene.hudSlot.append(scene.slots.status);
  }
  if (levelScene.keysSlot || levelScene.hudSlot) {
    scene.element.classList.add('is-slotted');
  }

  const assaultButton = scene.slots.actions.querySelector('[data-action="assault"]');
  if (assaultButton !== null) {
    assaultButton.textContent = state.phase === 'repair' ? 'Ensayo' : 'Asalto';
    assaultButton.setAttribute('aria-label', state.phase === 'repair' ? 'Ejecutar el ensayo' : 'Ejecutar el asalto');
  }
  renderPalette();
  workshop = createGraphEditor({ svg: canvas, cells: state.puzzle.cells, alphabet: levelAlphabet(), blueprint: state.blueprint, stack: state.puzzle.stack ?? null, onConnect: handleConnect, onCut: handleCut });
  graphVisuals = decorateGraph(canvas, { level: state.level, cells: state.puzzle.cells });
  document.querySelector('#scissors').addEventListener('click', toggleScissors);
  renderTools();
  if (state.level.machine === 'pda') {
    renderStack(state.puzzle.stack.base);
  }
  appendLog(state.puzzle.intro);
  if (state.phase === 'repair') {
    appendLog('Probá la llave y después pedí el ensayo.');
  } else {
    appendLog('Probá la llave y después lanzá el asalto.');
  }
}
function renderWorkshop() {
  if (state.level.workspace === 'drum') {
    renderDrumWorkshop();
    return;
  }
  renderSceneWorkshop();
}
function sectionLabel(id) {
  const found = state.puzzle.sections.find((section) => section.id === id);
  if (found === undefined) {
    return id;
  }
  return found.label;
}
function moveArrow(move) {
  if (move === 'L') {
    return '←';
  }
  return '→';
}
function readLabel(symbol) {
  if (symbol === state.puzzle.tape.blank) {
    return 'vacío';
  }
  return symbol;
}
function renderDrumScene() {
  if (graphVisuals !== null) {
    graphVisuals.dispose();
    graphVisuals = null;
  }
  const scene = createWorkbenchScene({
    contract: state.level.contract,
    title: state.level.title,
    client: state.level.client,
    phase: phaseWord(),
    objective: { rule: state.puzzle.goal, intro: state.puzzle.intro },
    soundEnabled: soundOn,
    diegeticActions: true,
    immersive: true,
    handlers: {
      onBack: renderMap,
      onProbe: handleProbe,
      onAssault: handleAssault,
      onOpenDoc: openWorkshopDoc,
      onToggleSound: toggleSound
    }
  });
  workbenchView = scene;
  const levelScene = createLevel5Scene({ level: state.level, puzzle: state.puzzle, phase: state.phase });
  app.replaceChildren(scene.element);
  scene.element.classList.add('is-drum-room');
  scene.slots.stage.append(levelScene.element);
  // Enganche diegético genérico: cuando N5 aporte sus props, usan los mismos handlers.
  for (const node of levelScene.element.querySelectorAll('[data-action]')) {
    const action = node.getAttribute('data-action');
    if (action === 'probe') {
      node.addEventListener('click', handleProbe);
    } else if (action === 'assault') {
      node.addEventListener('click', handleAssault);
    } else if (action === 'contract' || action === 'hint' || action === 'log') {
      node.addEventListener('click', () => openWorkshopDoc(action));
    }
  }
  if (levelScene.hudSlot) {
    levelScene.hudSlot.append(scene.slots.status);
    scene.element.classList.add('is-slotted');
  }
  scene.slots.inventory.hidden = true;
  scene.slots.inventory.style.display = 'none';
  const tapeRoot = document.createElement('div');
  tapeRoot.id = 'tape-panel';
  const drumRoot = document.createElement('div');
  drumRoot.id = 'drum';
  levelScene.editorSlot.append(tapeRoot);
  levelScene.editorSlot.append(drumRoot);
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Tocá una púa para escribir, mover y elegir la sección siguiente.';
  scene.slots.status.append(hint);
  const probeButton = scene.slots.actions.querySelector('[data-action="probe"]');
  if (probeButton !== null) {
    probeButton.textContent = 'Probar la cinta';
  }
  const assaultButton = scene.slots.actions.querySelector('[data-action="assault"]');
  if (assaultButton !== null) {
    assaultButton.textContent = state.phase === 'repair' ? 'Ensayo' : 'Asalto';
    assaultButton.setAttribute('aria-label', state.phase === 'repair' ? 'Ejecutar el ensayo' : 'Ejecutar el asalto');
  }
  workshop = null;
  drumEditor = createDrumEditor({ root: drumRoot, sections: state.puzzle.sections, symbols: state.puzzle.tape.symbols, labels: state.puzzle.tape.labels, rules: state.blueprint.rules, onEdit: handlePinEdit });
  tapePanel = createTapePanel({ root: tapeRoot, blankLabel: state.puzzle.tape.labels[state.puzzle.tape.blank] ?? '' });
  appendLog(state.puzzle.intro);
  if (state.phase === 'repair') {
    appendLog('Probá la cinta y después pedí el ensayo.');
  } else {
    appendLog('Probá la cinta y después lanzá el asalto.');
  }
}
function renderDrumWorkshop() {
  renderDrumScene();
}
function showTapeFrame(run) {
  if (run.frames.length === 0) {
    return;
  }
  const frame = run.frames[run.frames.length - 1];
  tapePanel.show({ window: frame.window, head: frame.head, sectionLabel: sectionLabel(frame.state) });
  drumEditor.light(frame.state, frame.read);
}
function probeTape() {
  const machine = toMachine(levelAlphabet(), state.puzzle, state.blueprint, state.level.machine);
  const input = state.puzzle.examples.runs[0].input;
  const run = runTM(machine, input, { maxSteps: state.puzzle.judge.limits.maxSteps, record: true });
  showTapeFrame(run);
  const fn = functionFor(state.puzzle.target.id);
  const expected = fn.compute(input);
  if (fn.matches(run.output, expected)) {
    appendLog(`La cinta ${input} dejó ${run.output}.`, 'good');
  } else {
    appendLog(`La cinta ${input} dejó ${run.output}.`, 'bad');
  }
  appendLog(`El cliente esperaba ${expected}.`);
}
function assaultTape(machine, verdict) {
  if (verdict.correct) {
    drumEditor.clearLight();
    if (state.phase === 'repair' && state.level.phases.build !== undefined) {
      showRepairModal();
    } else {
      showWin();
    }
    return;
  }
  if (verdict.counterexample === null) {
    return;
  }
  const run = runTM(machine, verdict.counterexample, { maxSteps: state.puzzle.judge.limits.maxSteps, record: true });
  showTapeFrame(run);
}
function handlePinEdit(edit) {
  const rules = structuredClone(state.blueprint.rules);
  sfx('gear');
  if (rules[edit.section] === undefined) {
    rules[edit.section] = {};
  }
  if (edit.pin === null) {
    delete rules[edit.section][edit.read];
  } else {
    rules[edit.section][edit.read] = { write: edit.pin.write, move: edit.pin.move, to: edit.pin.to };
  }
  state.blueprint.rules = rules;
  drumEditor.setRules(state.blueprint.rules);
  if (edit.pin === null) {
    appendLog(`Púa vacía (alarma): ${sectionLabel(edit.section)} · ${readLabel(edit.read)}.`);
    return;
  }
  appendLog(`Púa de ${sectionLabel(edit.section)} · ${readLabel(edit.read)}: ${readLabel(edit.pin.write)} ${moveArrow(edit.pin.move)} ${sectionLabel(edit.pin.to)}.`);
}
function runMachine(machine, word, options) {
  if (machine.type === 'nfa') {
    return runNFA(machine, word, options);
  }
  if (machine.type === 'pda') {
    return runPDA(machine, word, options);
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
  if (state.level.machine === 'tm') {
    probeTape();
    return;
  }
  const machine = toMachine(levelAlphabet(), state.puzzle, state.blueprint, state.level.machine);
  const word = state.puzzle.examples.open[0];
  const result = runMachine(machine, word, { record: true });
  if (result.accepted) {
    sfx('lock');
    appendLog(`La llave ${word} abrió la caja.`, 'good');
  } else {
    sfx('error');
    appendLog(`La llave ${word} no abrió la caja.`, 'bad');
  }
  workshop.highlight(frameStates(result.frames));
  if (state.level.machine === 'pda' && result.frames.length > 0) {
    renderStack(result.frames[result.frames.length - 1].stack);
  }
}
function handleAssault() {
  const machine = toMachine(levelAlphabet(), state.puzzle, state.blueprint, state.level.machine);
  const verdict = judge(state.puzzle, machine);
  const report = thiefReport(verdict, state.level);
  if (report.tone === 'bad') {
    sfx('error');
  } else {
    sfx('lock');
  }
  appendLog(report.text, report.tone);
  if (state.level.machine === 'tm') {
    assaultTape(machine, verdict);
    return;
  }
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
    if (state.level.machine === 'pda' && replay.frames.length > 0) {
      renderStack(replay.frames[replay.frames.length - 1].stack);
    }
  }
}
function openWorkshopDoc(kind) {
  sfx('paper');
  if (kind === 'contract') {
    openModal(`Contrato ${state.level.contract}`, state.level.client, state.puzzle.goal, 'Entendido', () => {});
    return;
  }
  if (kind === 'hint') {
    const hints = state.puzzle.hints ?? [];
    const text = hints.length > 0 ? hints[0] : 'No hay pistas para este contrato.';
    openModal('Pista', 'Pista del taller', text, 'Entendido', () => {});
    return;
  }
  if (kind === 'log') {
    const entries = workbenchView !== null && workbenchView.slots?.log !== undefined
      ? [...workbenchView.slots.log.querySelectorAll('.wb-log-entry')].map((item) => item.textContent)
      : [];
    const body = entries.length > 0 ? entries.join('\n') : state.puzzle.intro;
    openModal('Bitácora', 'Notas del caso', body, 'Cerrar', () => {});
  }
}
async function toggleSound() {
  soundOn = soundOn === false;
  if (workbenchView !== null) {
    workbenchView.setSound(soundOn);
  }
  if (manifest === null) {
    manifest = await loadManifest();
  }
  if (audio === null) {
    audio = createAudio({ manifest });
  }
  audio.setEnabled(soundOn);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
    } catch {
      // Sin almacenamiento, la preferencia vive solo en la sesión.
    }
  }
  if (soundOn) {
    audio.play('click');
  }
}
function sfx(id) {
  if (audio !== null) {
    audio.play(id);
  }
}
async function initAudio() {
  if (manifest === null) {
    manifest = await loadManifest();
  }
  if (audio === null) {
    audio = createAudio({ manifest, enabled: soundOn });
  }
  audio.setEnabled(soundOn);
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
  text.style.whiteSpace = 'pre-line';
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
      return;
    }
    // Trampa de foco: el Tab circula dentro del diálogo y no se escapa al taller.
    if (event.key !== 'Tab') {
      return;
    }
    const focusables = [...modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')]
      .filter((node) => node.disabled !== true);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document.body.append(backdrop);
  button.focus();
}
function showRepairModal() {
  openModal(`Contrato ${state.level.contract}`, 'Mecanismo reparado', state.level.phases.build.goal, 'Construir el nuevo', startBuild);
}
function showWin() {
  sfx('bell');
  const progress = loadProgress();
  if (progress.completed.includes(state.level.id) === false) {
    progress.completed.push(state.level.id);
    saveProgress(progress);
  }
  openModal(`Contrato ${state.level.contract}`, 'Bóveda asegurada', state.level.thief.giveUp, 'Volver al mapa', renderMap);
}
renderTitle();
initAudio();
