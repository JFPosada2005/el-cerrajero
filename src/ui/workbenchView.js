/**
 * Cáscara del taller. Solo construye la estructura y los slots del contrato;
 * el parent monta el editor real, la pila/cinta, las llaves y los modales.
 *
 * No crea ni simula editor, cables, llaves, juicio ni lógica.
 * Los datos del nivel solo viajan por `textContent`, nunca por `innerHTML`.
 */

const DEFAULT_NOTE = 'Cualquier otra combinación deja la alarma encendida.';

const VALID_TONES = new Set(['neutral', 'good', 'bad']);

function normalizeTone(tone) {
  return VALID_TONES.has(tone) ? tone : 'neutral';
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function makeButton({ text, label, action, doc, className }) {
  const button = make('button', className, text);
  button.type = 'button';
  if (action) {
    button.setAttribute('data-action', action);
  }
  if (doc) {
    button.setAttribute('data-doc', doc);
  }
  if (label) {
    button.setAttribute('aria-label', label);
  }
  return button;
}

/**
 * @param {object} options
 * @param {string} options.contract Número de contrato ('01').
 * @param {string} options.title Título del contrato.
 * @param {string} options.client Cliente (reservado para el modal del parent; la cáscara no tiene nodo de cliente).
 * @param {string} options.phase 'Reparación' | 'Construcción'.
 * @param {{ rule: string, intro: string, note?: string }} options.objective Textos exactos del puzzle.
 * @param {Array<{ text: string, tone?: string }>} options.logLines Entradas iniciales.
 * @param {boolean} options.soundEnabled Estado inicial del sonido.
 * @param {object} options.handlers onBack, onProbe, onAssault, onOpenDoc(kind), onToggleSound.
 */
export function createWorkbenchView(options = {}) {
  const {
    contract = '01',
    title = '',
    phase = 'Reparación',
    objective = {},
    logLines = [],
    soundEnabled = false,
    handlers = {},
  } = options;
  const { onBack, onProbe, onAssault, onOpenDoc, onToggleSound } = handlers;

  const call = (fn, arg) => {
    if (typeof fn === 'function') {
      fn(arg);
    }
  };

  const element = make('section', 'workbench');

  // --- Header ---
  const header = make('header', 'workbench-header');
  const brand = make('p', 'workbench-brand', 'El Cerrajero');
  const heading = make('div', 'workbench-heading');
  const contractLine = make('p', 'workbench-contract', `Contrato ${contract}`);
  const titleHeading = make('h1', 'workbench-title', title);
  heading.append(contractLine, titleHeading);
  const phaseBadge = make('span', 'workbench-phase', phase);
  const backButton = makeButton({ text: 'Volver', label: 'Volver al mapa', action: 'back', className: 'workbench-back' });
  const soundButton = makeButton({ text: 'Sonido', label: 'Activar o desactivar el sonido', action: 'sound', className: 'workbench-sound' });
  soundButton.setAttribute('aria-pressed', String(Boolean(soundEnabled)));
  backButton.addEventListener('click', () => call(onBack));
  soundButton.addEventListener('click', () => call(onToggleSound));
  header.append(brand, heading, phaseBadge, backButton, soundButton);

  // --- Layout ---
  const layout = make('div', 'workbench-layout');

  const objectiveAside = make('aside', 'workbench-objective');
  objectiveAside.setAttribute('aria-label', 'Objetivo del contrato');
  const kicker = make('p', 'objective-kicker', 'Objetivo');
  const ruleEl = make('p', 'objective-rule', objective.rule ?? '');
  const introEl = make('p', 'objective-intro', objective.intro ?? '');
  const noteEl = make('p', 'objective-note', objective.note || DEFAULT_NOTE);
  const openContract = makeButton({ text: 'Abrir contrato', label: 'Abrir contrato', doc: 'contract', className: 'objective-open' });
  openContract.addEventListener('click', () => call(onOpenDoc, 'contract'));
  objectiveAside.append(kicker, ruleEl, introEl, noteEl, openContract);

  const stage = make('section', 'workbench-stage');
  stage.setAttribute('data-slot', 'stage');
  stage.setAttribute('aria-label', 'Mecanismo');

  const logAside = make('aside', 'workbench-log');
  logAside.setAttribute('data-slot', 'log');
  logAside.setAttribute('aria-label', 'Bitácora');
  const logTitle = make('p', 'log-title', 'Bitácora');
  const logList = make('div', 'log-list');
  logAside.append(logTitle, logList);

  layout.append(objectiveAside, stage, logAside);

  // --- Status + inventory ---
  const status = make('div', 'workbench-status');
  status.setAttribute('data-slot', 'status');
  status.setAttribute('aria-label', 'Estado del mecanismo');

  const inventory = make('footer', 'workbench-inventory');
  inventory.setAttribute('data-slot', 'inventory');
  inventory.setAttribute('aria-label', 'Inventario');

  // --- Actions ---
  const actions = make('div', 'workbench-actions');
  const probeButton = makeButton({ text: 'Probar', label: 'Probar la llave', action: 'probe' });
  const assaultButton = makeButton({ text: 'Ensayo', label: 'Pedir el ensayo', action: 'assault', className: 'is-primary' });
  const contractDoc = makeButton({ text: 'Contrato', label: 'Abrir contrato', doc: 'contract' });
  const hintDoc = makeButton({ text: 'Pista', label: 'Abrir pista', doc: 'hint' });
  const logDoc = makeButton({ text: 'Bitácora', label: 'Abrir bitácora', doc: 'log' });
  probeButton.addEventListener('click', () => call(onProbe));
  assaultButton.addEventListener('click', () => call(onAssault));
  for (const [button, kind] of [[contractDoc, 'contract'], [hintDoc, 'hint'], [logDoc, 'log']]) {
    button.addEventListener('click', () => call(onOpenDoc, kind));
  }
  actions.append(probeButton, assaultButton, contractDoc, hintDoc, logDoc);

  element.append(header, layout, status, inventory, actions);

  function setPhase(nextPhase) {
    phaseBadge.textContent = String(nextPhase);
  }

  function setObjective(next = {}) {
    if (next.rule !== undefined) {
      ruleEl.textContent = String(next.rule);
    }
    if (next.intro !== undefined) {
      introEl.textContent = String(next.intro);
    }
    if (next.note !== undefined) {
      noteEl.textContent = next.note ? String(next.note) : DEFAULT_NOTE;
    }
  }

  function setSound(enabled) {
    soundButton.setAttribute('aria-pressed', String(Boolean(enabled)));
  }

  function addLog(text, tone = 'neutral') {
    const entry = make('p', 'log-entry', String(text));
    entry.setAttribute('data-tone', normalizeTone(tone));
    logList.append(entry);
    return entry;
  }

  function clearLog() {
    logList.replaceChildren();
  }

  for (const line of logLines) {
    addLog(line.text, line.tone);
  }

  return {
    element,
    slots: { stage, status, inventory, log: logList },
    setPhase,
    setObjective,
    setSound,
    addLog,
    clearLog,
  };
}
