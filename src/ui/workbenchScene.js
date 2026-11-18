/**
 * Shell compartido del taller. Solo construye la estructura y los slots del
 * contrato de escena (`docs/REMASTER-SCENE-CONTRACT.md`); el parent monta la
 * escena del nivel, el editor real, la pila/cinta, las llaves y los modales.
 *
 * No crea escena de nivel, editor, cables, llaves, juicio ni lógica.
 * Los datos del nivel solo viajan por `textContent`, nunca por HTML.
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
 * @param {string} options.client Cliente (reservado para el modal del parent; el shell no tiene nodo de cliente).
 * @param {string} options.phase Etiqueta de fase ('Reparación' | 'Construcción').
 * @param {{ rule: string, intro: string, note?: string }} options.objective Textos exactos del puzzle.
 * @param {boolean} options.soundEnabled Estado inicial del sonido.
 * @param {object} options.handlers onBack, onProbe, onAssault, onOpenDoc(kind), onToggleSound.
 */
export function createWorkbenchScene(options = {}) {
  const {
    contract = '01',
    title = '',
    phase = 'Reparación',
    objective = {},
    soundEnabled = false,
    handlers = {},
  } = options;
  const { onBack, onProbe, onAssault, onOpenDoc, onToggleSound } = handlers;

  const call = (fn, arg) => {
    if (typeof fn === 'function') {
      fn(arg);
    }
  };

  const element = make('section', 'wb-scene');
  element.setAttribute('aria-label', 'Taller del cerrajero');

  // --- Header ---
  const header = make('header', 'wb-header');
  const brand = make('p', 'wb-brand', 'El Cerrajero');
  const heading = make('div', 'wb-heading');
  const contractLine = make('p', 'wb-contract', `Contrato ${contract}`);
  const titleHeading = make('h1', 'wb-title', title);
  heading.append(contractLine, titleHeading);
  const phaseBadge = make('span', 'wb-phase', phase);
  const backButton = makeButton({ text: 'Volver', label: 'Volver al mapa', action: 'back', className: 'wb-btn wb-back' });
  const soundButton = makeButton({ text: 'Sonido', label: 'Activar o desactivar el sonido', action: 'sound', className: 'wb-btn wb-sound' });
  soundButton.setAttribute('aria-pressed', String(Boolean(soundEnabled)));
  backButton.addEventListener('click', () => call(onBack));
  soundButton.addEventListener('click', () => call(onToggleSound));
  header.append(brand, heading, phaseBadge, backButton, soundButton);

  // --- Body ---
  const body = make('div', 'wb-body');

  const objectiveAside = make('aside', 'wb-objective');
  objectiveAside.setAttribute('data-slot', 'objective');
  objectiveAside.setAttribute('aria-label', 'Objetivo del contrato');
  const kicker = make('p', 'wb-kicker', 'Objetivo');
  const ruleEl = make('p', 'wb-rule', objective.rule ?? '');
  const introEl = make('p', 'wb-intro', objective.intro ?? '');
  const noteEl = make('p', 'wb-note', objective.note || DEFAULT_NOTE);
  const openContract = makeButton({ text: 'Abrir contrato', label: 'Abrir el contrato en papel', doc: 'contract', className: 'wb-btn wb-open-contract' });
  openContract.addEventListener('click', () => call(onOpenDoc, 'contract'));
  objectiveAside.append(kicker, ruleEl, introEl, noteEl, openContract);

  const stage = make('section', 'wb-stage');
  stage.setAttribute('data-slot', 'stage');
  stage.setAttribute('aria-label', 'Mecanismo');

  const logAside = make('aside', 'wb-log');
  logAside.setAttribute('data-slot', 'log');
  logAside.setAttribute('aria-label', 'Bitácora');
  const logTitle = make('p', 'wb-log-title', 'Bitácora');
  const logList = make('div', 'wb-log-list');
  logAside.append(logTitle, logList);
  logAside.hidden = true;

  body.append(objectiveAside, stage, logAside);

  // --- Status + inventory + actions (slots para el parent) ---
  const status = make('div', 'wb-status');
  status.setAttribute('data-slot', 'status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-label', 'Estado del mecanismo');

  const inventory = make('footer', 'wb-inventory');
  inventory.setAttribute('data-slot', 'inventory');
  inventory.setAttribute('aria-label', 'Inventario');

  const actions = make('div', 'wb-actions');
  actions.setAttribute('data-slot', 'actions');
  actions.setAttribute('aria-label', 'Acciones');
  const probeButton = makeButton({ text: 'Probar', label: 'Probar la llave en el mecanismo', action: 'probe', className: 'wb-btn' });
  const assaultButton = makeButton({ text: 'Ensayo', label: 'Pedir el ensayo del ladrón', action: 'assault', className: 'wb-btn wb-btn-primary' });
  const contractDoc = makeButton({ text: 'Contrato', label: 'Abrir el contrato en papel', doc: 'contract', className: 'wb-btn' });
  const hintDoc = makeButton({ text: 'Pista', label: 'Abrir la pista del taller', doc: 'hint', className: 'wb-btn' });
  const logDoc = makeButton({ text: 'Bitácora', label: 'Abrir la bitácora del caso', doc: 'log', className: 'wb-btn' });
  probeButton.addEventListener('click', () => call(onProbe));
  assaultButton.addEventListener('click', () => call(onAssault));
  for (const [button, kind] of [[contractDoc, 'contract'], [hintDoc, 'hint'], [logDoc, 'log']]) {
    button.addEventListener('click', () => call(onOpenDoc, kind));
  }
  actions.append(probeButton, assaultButton, contractDoc, hintDoc, logDoc);

  element.append(header, body, status, inventory, actions);

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
    const entry = make('p', 'wb-log-entry', String(text));
    entry.setAttribute('data-tone', normalizeTone(tone));
    logList.append(entry);
    logAside.hidden = false;
    return entry;
  }

  function clearLog() {
    logList.replaceChildren();
    logAside.hidden = true;
  }

  return {
    element,
    slots: { stage, status, inventory, actions, objective: objectiveAside, log: logList },
    setPhase,
    setObjective,
    setSound,
    addLog,
    clearLog,
  };
}
