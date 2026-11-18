const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const NS = 'http://www.w3.org/2000/svg';

const stage = $('#stage');
const gameShell = $('.game-shell');
const stageViewport = $('#stage-viewport');
const mechanism = $('#mechanism');
const wireGroup = $('#wire-group');
const wires = $('#wires');
const pulseLayer = $('#pulse-layer');
const previewLayer = $('#preview-layer');
const toolStatus = $('.tool-status');
const toolStatusText = $('#tool-status-text');
const toastEl = $('#toast');
const overlay = $('#overlay');
const dossier = $('#dossier');
const dossierContent = $('#dossier-content');
const overlayClose = $('#overlay-close');
const soundButton = $('#sound-button');
const thief = $('#thief');
const probeButton = $('#probe-button');
const assaultButton = $('#assault-button');

const PARTS = {
  entry: { x: 145, y: 300, r: 54, label: 'la entrada' },
  'gear-1': { x: 355, y: 190, r: 67, label: 'la rueda I' },
  'gear-2': { x: 555, y: 300, r: 67, label: 'la rueda II' },
  lock: { x: 745, y: 190, r: 60, label: 'el cerrojo' },
  bell: { x: 815, y: 470, r: 26, label: 'la campana' },
};

const KEY_TONES = {
  1: { base: '#2e2213', light: '#f0cf6a', dark: '#8a651f', cable: '#b08a3e' },
  2: { base: '#0c2422', light: '#38c6b8', dark: '#1d6f67', cable: '#2b9a90' },
  3: { base: '#2b1510', light: '#f06a4a', dark: '#8a3324', cable: '#c05a44' },
  4: { base: '#1a1528', light: '#a18be0', dark: '#5a4a8a', cable: '#7d6cba' },
};

const HINTS = [
  'La caja no pide una llave larga: pide tres pasos en orden. Cada rueda debe recordar el suyo.',
  'Hay un cable de más. El pulso encuentra un atajo y el cerrojo no llega a ceder.',
];

const state = {
  tool: 'wire',
  key: '1',
  source: null,
  dragging: false,
  dragTool: null,
  dragKey: null,
  suppressClickUntil: 0,
  hintIndex: 0,
  sound: false,
  lastFocus: null,
  cables: new Map(),
};

const spriteParam = new URLSearchParams(window.location.search).get('sprites');
if (spriteParam === 'png') {
  $$('img[data-sprite]').forEach((image) => {
    const source = image.src;
    const name = image.dataset.sprite;
    const probe = new Image();
    probe.addEventListener('load', () => {
      image.src = probe.src;
    });
    probe.addEventListener('error', () => {
      image.src = source;
    });
    probe.src = `assets/sprites/${name}.png`;
  });
}

$$('img').forEach((image) => {
  image.addEventListener('dragstart', (event) => event.preventDefault());
});

/* Sonido sintetizado, sin archivos externos. */
let audioContext = null;

function audio() {
  if (state.sound === false) {
    return null;
  }
  if (audioContext === null) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor === undefined) {
      return null;
    }
    audioContext = new AudioCtor();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function tone({ frequency = 220, duration = 0.06, type = 'sine', volume = 0.04, slide = 0, delay = 0 }) {
  const context = audio();
  if (context === null) {
    return;
  }
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slide !== 0) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), start + duration);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noise({ duration = 0.08, volume = 0.03, frequency = 1800, delay = 0 }) {
  const context = audio();
  if (context === null) {
    return;
  }
  const frames = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frames; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 1.2;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(start);
}

const sounds = {
  click() {
    noise({ duration: 0.012, volume: 0.012, frequency: 2600 });
    tone({ frequency: 620, duration: 0.025, type: 'triangle', volume: 0.012, slide: -140 });
  },
  plug() {
    tone({ frequency: 150, duration: 0.1, type: 'triangle', volume: 0.05, slide: -55 });
    tone({ frequency: 1100, duration: 0.035, type: 'square', volume: 0.01, slide: -350 });
    noise({ duration: 0.03, volume: 0.014, frequency: 1700 });
  },
  snip() {
    noise({ duration: 0.035, volume: 0.04, frequency: 5200 });
    tone({ frequency: 2600, duration: 0.045, type: 'triangle', volume: 0.014, slide: -900 });
    noise({ duration: 0.02, volume: 0.018, frequency: 3000, delay: 0.055 });
  },
  gear() {
    for (let index = 0; index < 5; index += 1) {
      noise({ duration: 0.03, volume: 0.012, frequency: 1500 + index * 160, delay: index * 0.045 });
      tone({ frequency: 86 + index * 4, duration: 0.04, type: 'triangle', volume: 0.012, delay: index * 0.045 });
    }
    tone({ frequency: 64, duration: 0.18, type: 'sine', volume: 0.025, slide: -8 });
  },
  lock() {
    noise({ duration: 0.05, volume: 0.025, frequency: 520 });
    tone({ frequency: 74, duration: 0.24, type: 'sine', volume: 0.06, slide: -12 });
    tone({ frequency: 300, duration: 0.08, type: 'triangle', volume: 0.018, slide: -90 });
  },
  bell() {
    const partials = [
      [523, 0.032, 1.5],
      [1248, 0.016, 1.05],
      [1560, 0.012, 0.85],
      [2184, 0.008, 0.65],
      [2808, 0.005, 0.45],
    ];
    for (const [frequency, volume, duration] of partials) {
      tone({ frequency, duration, type: 'sine', volume, slide: -10 });
    }
    tone({ frequency: 261, duration: 1.2, type: 'sine', volume: 0.015, slide: -3 });
    noise({ duration: 0.025, volume: 0.016, frequency: 3200 });
  },
  paper() {
    noise({ duration: 0.1, volume: 0.018, frequency: 1100 });
    noise({ duration: 0.06, volume: 0.01, frequency: 2400, delay: 0.05 });
  },
  error() {
    tone({ frequency: 140, duration: 0.14, type: 'sawtooth', volume: 0.018, slide: -20 });
    noise({ duration: 0.05, volume: 0.012, frequency: 420 });
  },
  approach() {
    noise({ duration: 0.25, volume: 0.012, frequency: 650 });
    tone({ frequency: 66, duration: 0.32, type: 'sine', volume: 0.018, slide: -4 });
    noise({ duration: 0.12, volume: 0.008, frequency: 1200, delay: 0.12 });
  },
  verdict() {
    tone({ frequency: 220, duration: 0.18, type: 'sine', volume: 0.018 });
    tone({ frequency: 330, duration: 0.24, type: 'sine', volume: 0.014, delay: 0.08 });
  },
};

/* Herramienta activa y estado del taller. */
function setTool(tool, key = state.key) {
  if (tool === 'gear') {
    showToast('El engranaje se desbloquea en el contrato 02.');
    sounds.error();
    return;
  }
  state.tool = tool;
  state.key = String(key);
  document.body.dataset.tool = tool;
  document.body.dataset.key = state.key;
  $$('.inventory-key').forEach((button) => {
    button.classList.toggle('is-active', state.tool === 'key' && button.dataset.key === state.key);
  });
  $$('.inventory-tool').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tool === tool);
  });
  $$('.cable.is-targeted').forEach((cable) => cable.classList.remove('is-targeted'));
  clearSource();
  updateToolStatus();
}

function showToast(message, duration = 2400) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toastEl.hidden = true;
  }, duration);
}

function updateToolStatus() {
  if (toolStatusText === null) {
    return;
  }
  if (state.tool === 'key') {
    const guidance = state.source === null
      ? 'Selecciona origen y destino'
      : `Origen: ${PARTS[state.source].label}. Selecciona el destino`;
    toolStatusText.textContent = `Llave ${state.key} en mano — ${guidance}`;
  } else if (state.tool === 'wire') {
    const guidance = state.source === null
      ? 'Selecciona origen y destino'
      : `Origen: ${PARTS[state.source].label}. Selecciona el destino`;
    toolStatusText.textContent = `Carrete de cobre en mano — ${guidance}`;
  } else if (state.tool === 'scissors') {
    toolStatusText.textContent = 'Tijeras en mano — Haz clic en un cable para cortarlo';
  }
  if (toolStatus !== null) {
    toolStatus.classList.toggle('is-cutting', state.tool === 'scissors');
  }
}

const STAGE_WIDTH = 1600;
const STAGE_HEIGHT = 900;

function fitStage() {
  if (stageViewport === null) {
    return;
  }
  if (window.matchMedia('(max-width: 900px)').matches) {
    stage.style.removeProperty('--stage-scale');
    return;
  }
  const rect = stageViewport.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return;
  }
  const scale = Math.min(rect.width / STAGE_WIDTH, rect.height / STAGE_HEIGHT);
  stage.style.setProperty('--stage-scale', String(scale));
}

window.addEventListener('resize', fitStage);
window.addEventListener('load', fitStage);
if (window.ResizeObserver !== undefined && stageViewport !== null) {
  new ResizeObserver(fitStage).observe(stageViewport);
}

/* Piezas. */
function partElement(id) {
  return $(`.part[data-part="${id}"]`);
}

function flashPart(element) {
  element.classList.remove('is-flashing');
  void element.offsetWidth;
  element.classList.add('is-flashing');
  window.setTimeout(() => element.classList.remove('is-flashing'), 460);
}

function clearSource() {
  state.source = null;
  $$('.part.is-source').forEach((part) => part.classList.remove('is-source'));
  hideCablePreview();
  updateToolStatus();
}

function rotateGear(element) {
  const sprite = $('.gear-sprite', element);
  if (sprite === null) {
    return;
  }
  const angle = Number(element.dataset.angle ?? 0) + 45;
  element.dataset.angle = String(angle);
  sprite.style.transform = `rotate(${angle}deg)`;
  flashPart(element);
}

function ringBell(element, message = null) {
  element.classList.remove('is-ringing');
  void element.offsetWidth;
  element.classList.add('is-ringing');
  if (state.sound) {
    sounds.bell();
  }
  showToast(message ?? (state.sound
    ? 'La campana de alarma está lista. Suena cuando una llave cae en un contacto vacío.'
    : 'La campana de alarma está lista. Activa el sonido para escucharla.'));
  window.setTimeout(() => element.classList.remove('is-ringing'), 700);
}

function applyToPart(element) {
  const id = element.dataset.part;
  if (id === 'bell') {
    if (state.source !== null) {
      clearSource();
      hideCablePreview();
    }
    ringBell(element);
    return;
  }
  if (state.tool === 'key') {
    flashPart(element);
    sounds.click();
    if (id === 'lock') {
      showToast('El cerrojo solo cede cuando el mecanismo se desbloquea.');
      return;
    }
    if (id === 'entry') {
      showToast('La llave entra en la entrada. Pulsa Probar para recorrer el mecanismo.');
      return;
    }
    showToast('La rueda recuerda la tecla cuando el pulso la atraviesa.');
    return;
  }
  if (state.tool === 'wire') {
    handleWireClick(id, element);
    return;
  }
  if (state.tool === 'scissors') {
    showToast('Ahí no hay un cable que cortar.');
    sounds.error();
  }
}

function handleWireClick(id, element) {
  if (state.source === null) {
    state.source = id;
    element.classList.add('is-source');
    sounds.click();
    updateToolStatus();
    return;
  }
  if (state.source === id) {
    clearSource();
    showToast('Cable cancelado.');
    return;
  }
  const from = state.source;
  clearSource();
  connectCable(from, id);
}

/* Cables. */
function pairKey(from, to) {
  return [from, to].sort().join('|');
}

function registerCable(element) {
  const from = element.dataset.from;
  const to = element.dataset.to;
  if (from === undefined || to === undefined) {
    return;
  }
  state.cables.set(pairKey(from, to), element);
  element.addEventListener('click', (event) => {
    if (state.tool !== 'scissors') {
      return;
    }
    if (performance.now() < state.suppressClickUntil) {
      return;
    }
    event.stopPropagation();
    cutCable(element, event);
  });
  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    if (state.tool !== 'scissors') {
      showToast('Elige las tijeras para cortar el cable.');
      sounds.error();
      return;
    }
    cutCable(element, event);
  });
  const hit = $('.cable-hit', element);
  if (hit !== null) {
    hit.addEventListener('pointerenter', () => {
      if (state.tool === 'scissors') {
        element.classList.add('is-targeted');
      }
    });
    hit.addEventListener('pointerleave', () => {
      element.classList.remove('is-targeted');
    });
  }
}

function rimPoint(from, to, radius) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: from.x + (dx / length) * radius,
    y: from.y + (dy / length) * radius,
  };
}

const CABLE_STYLE = {
  rise: 0.17,
  maxRise: 80,
  amplitude: 2.9,
};

let cableSerial = 0;

function partClearance(point) {
  let clearance = Infinity;
  for (const part of Object.values(PARTS)) {
    clearance = Math.min(clearance, Math.hypot(point.x - part.x, point.y - part.y) - part.r);
  }
  return clearance;
}

function autoBow(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: dy / length, y: -dx / length };
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  let best = 1;
  let bestClearance = -Infinity;
  for (const sign of [1, -1]) {
    const clearance = partClearance({
      x: midX + normal.x * 55 * sign,
      y: midY + normal.y * 55 * sign,
    });
    if (clearance > bestClearance) {
      best = sign;
      bestClearance = clearance;
    }
  }
  return best;
}

function chooseBow(from, to) {
  return autoBow(PARTS[from], PARTS[to]);
}

function arcGeometry(start, end, bow) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const chord = Math.hypot(dx, dy) || 1;
  const normal = { x: dy / chord, y: -dx / chord };
  const rise = Math.min(CABLE_STYLE.maxRise, chord * CABLE_STYLE.rise) * bow;
  const control = {
    x: (start.x + end.x) / 2 + normal.x * rise * 2,
    y: (start.y + end.y) / 2 + normal.y * rise * 2,
  };
  return {
    start,
    end,
    chord,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    control,
    path: `M${start.x} ${start.y}Q${control.x} ${control.y} ${end.x} ${end.y}`,
  };
}

function braidPath(start, control, end, twists, phase) {
  const steps = Math.max(30, Math.round(twists * 12));
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const inverse = 1 - t;
    const x = inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x;
    const y = inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y;
    const tangentX = 2 * inverse * (control.x - start.x) + 2 * t * (end.x - control.x);
    const tangentY = 2 * inverse * (control.y - start.y) + 2 * t * (end.y - control.y);
    const length = Math.hypot(tangentX, tangentY) || 1;
    const normalX = tangentY / length;
    const normalY = -tangentX / length;
    const wave = Math.sin(t * twists * Math.PI * 2 + phase) * CABLE_STYLE.amplitude;
    points.push(`${index === 0 ? 'M' : 'L'}${(x + normalX * wave).toFixed(2)} ${(y + normalY * wave).toFixed(2)}`);
  }
  return points.join(' ');
}

function placeLabel(label) {
  if (label.startsWith('el ')) {
    return `al ${label.slice(3)}`;
  }
  return `a ${label}`;
}

function buildTerminal(geometry, which, tone) {
  const point = which === 'start' ? geometry.start : geometry.end;
  const angle = which === 'start' ? geometry.angle : geometry.angle + 180;
  const group = svgElement('g', {
    class: `cable-terminal is-${which}`,
    transform: `translate(${point.x} ${point.y}) rotate(${angle})`,
  });
  group.append(svgElement('rect', {
    class: 'cable-terminal-body',
    x: '-4.5',
    y: '-6.5',
    width: '17',
    height: '13',
    rx: '3.5',
  }));
  group.append(svgElement('rect', {
    class: 'cable-terminal-ring',
    x: '4.2',
    y: '-6',
    width: '2.4',
    height: '12',
    rx: '1',
    fill: tone.light,
  }));
  group.append(svgElement('circle', {
    class: 'cable-terminal-pin',
    cx: '13.5',
    cy: '0',
    r: '2.2',
  }));
  return group;
}

function createCable({ from, to, key, bow, animate = false }) {
  const start = rimPoint(PARTS[from], PARTS[to], PARTS[from].r);
  const end = rimPoint(PARTS[to], PARTS[from], PARTS[to].r);
  const geometry = arcGeometry(start, end, bow);
  const tone = KEY_TONES[key] ?? KEY_TONES[1];
  const twists = Math.max(4, Math.round(geometry.chord / 50));
  cableSerial += 1;
  const cable = svgElement('g', {
    class: `cable${animate ? ' is-drawing' : ''}`,
    'data-cable': `cable-${cableSerial}`,
    'data-key': key,
    'data-from': from,
    'data-to': to,
    role: 'button',
    tabindex: '0',
    'aria-label': `Cable de la llave ${key}: ${PARTS[from].label} ${placeLabel(PARTS[to].label)}`,
  });
  cable.append(svgElement('path', { class: 'cable-body-shadow', d: geometry.path, fill: 'none', pathLength: '1' }));
  cable.append(svgElement('path', {
    class: 'cable-body',
    d: geometry.path,
    fill: 'none',
    pathLength: '1',
    stroke: tone.base,
  }));
  const strands = [
    [0, tone.cable, 'is-light'],
    [Math.PI / 2, tone.dark, 'is-dark'],
    [Math.PI, tone.cable, 'is-light'],
    [(Math.PI * 3) / 2, tone.dark, 'is-dark'],
  ];
  for (const [phase, color, variant] of strands) {
    cable.append(svgElement('path', {
      class: `cable-strand ${variant}`,
      d: braidPath(start, geometry.control, end, twists, phase),
      fill: 'none',
      pathLength: '1',
      stroke: color,
    }));
  }
  cable.append(svgElement('path', {
    class: 'cable-sheen',
    d: braidPath(start, geometry.control, end, twists, Math.PI / 4),
    fill: 'none',
    pathLength: '1',
    stroke: tone.light,
  }));
  cable.append(buildTerminal(geometry, 'start', tone));
  cable.append(buildTerminal(geometry, 'end', tone));
  cable.append(svgElement('path', { class: 'cable-hit', d: geometry.path, fill: 'none' }));

  wireGroup.append(cable);
  registerCable(cable);

  if (animate) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => cable.classList.add('is-drawn'));
    });
    window.setTimeout(() => cable.classList.remove('is-drawing', 'is-drawn'), 700);
  }
  return cable;
}

const INITIAL_CABLES = [
  { from: 'entry', to: 'gear-1', key: '1', bow: 1 },
  { from: 'entry', to: 'lock', key: '2', bow: -1 },
  { from: 'gear-1', to: 'lock', key: '1', bow: 1 },
  { from: 'gear-2', to: 'lock', key: '3', bow: 1 },
];

function seedCables() {
  for (const cable of INITIAL_CABLES) {
    createCable(cable);
  }
}

function hoveredPartId(clientX, clientY, sourceId) {
  const target = document.elementFromPoint(clientX, clientY);
  const part = target === null ? null : target.closest('.part');
  if (part === null) {
    return null;
  }
  const id = part.dataset.part;
  if (id === sourceId || id === 'bell' || PARTS[id] === undefined) {
    return null;
  }
  return id;
}

function ensurePreview() {
  let cable = $('.cable-preview-cable', previewLayer);
  if (cable !== null) {
    return {
      cable,
      shadow: $('.cable-preview-shadow', previewLayer),
      base: $('.cable-preview-base', previewLayer),
      strandA: $('.cable-preview-strand.is-a', previewLayer),
      strandB: $('.cable-preview-strand.is-b', previewLayer),
      strandC: $('.cable-preview-strand.is-c', previewLayer),
      strandD: $('.cable-preview-strand.is-d', previewLayer),
      line: $('.cable-preview-line', previewLayer),
      plug: $('.cable-preview-plug', previewLayer),
    };
  }
  cable = svgElement('g', { class: 'cable-preview-cable' });
  const shadow = svgElement('path', { class: 'cable-preview-shadow', fill: 'none' });
  const base = svgElement('path', { class: 'cable-preview-base', fill: 'none' });
  const strandA = svgElement('path', { class: 'cable-preview-strand is-a', fill: 'none' });
  const strandB = svgElement('path', { class: 'cable-preview-strand is-b', fill: 'none' });
  const strandC = svgElement('path', { class: 'cable-preview-strand is-c', fill: 'none' });
  const strandD = svgElement('path', { class: 'cable-preview-strand is-d', fill: 'none' });
  cable.append(shadow);
  cable.append(base);
  cable.append(strandA);
  cable.append(strandB);
  cable.append(strandC);
  cable.append(strandD);
  const line = svgElement('path', { class: 'cable-preview-line', fill: 'none' });
  const plug = svgElement('g', { class: 'cable-preview-plug' });
  plug.append(svgElement('circle', { class: 'cable-preview-ring', r: '12' }));
  plug.append(svgElement('circle', { class: 'cable-preview-dot', r: '5' }));
  previewLayer.append(cable);
  previewLayer.append(line);
  previewLayer.append(plug);
  return { cable, shadow, base, strandA, strandB, strandC, strandD, line, plug };
}

function updateCablePreview(sourceId, clientX, clientY) {
  const from = PARTS[sourceId];
  if (from === undefined) {
    previewLayer.replaceChildren();
    return;
  }
  const rect = wires.getBoundingClientRect();
  const pointer = {
    x: ((clientX - rect.left) / rect.width) * 900,
    y: ((clientY - rect.top) / rect.height) * 560,
  };
  const targetId = hoveredPartId(clientX, clientY, sourceId);
  const target = targetId === null ? pointer : PARTS[targetId];
  const start = rimPoint(from, target, from.r);
  const end = targetId === null ? pointer : rimPoint(target, from, target.r);
  const bow = targetId === null ? autoBow(start, end) : chooseBow(sourceId, targetId);
  const geometry = arcGeometry(start, end, bow);
  const twists = Math.max(4, Math.round(geometry.chord / 50));
  const preview = ensurePreview();
  preview.shadow.setAttribute('d', geometry.path);
  preview.base.setAttribute('d', geometry.path);
  preview.base.setAttribute('stroke', '#0c2422');
  const strands = [
    [preview.strandA, 0, '#38c6b8'],
    [preview.strandB, Math.PI / 2, '#2b9a90'],
    [preview.strandC, Math.PI, '#38c6b8'],
    [preview.strandD, (Math.PI * 3) / 2, '#2b9a90'],
  ];
  for (const [path, phase, color] of strands) {
    path.setAttribute('d', braidPath(start, geometry.control, end, twists, phase));
    path.setAttribute('stroke', color);
  }
  preview.line.setAttribute('d', geometry.path);
  preview.plug.setAttribute('transform', `translate(${end.x} ${end.y})`);
  preview.plug.classList.toggle('is-target', targetId !== null);
  preview.line.classList.toggle('is-target', targetId !== null);
}

function hideCablePreview() {
  previewLayer.replaceChildren();
}

function svgElement(tag, attributes) {
  const element = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

function connectCable(from, to) {
  if (from === 'bell' || to === 'bell') {
    showToast('Ahí no va un cable.');
    sounds.error();
    return;
  }
  const key = pairKey(from, to);
  const existing = state.cables.get(key);
  if (existing !== undefined) {
    existing.remove();
    state.cables.delete(key);
  }
  createCable({
    from,
    to,
    key: state.key,
    bow: chooseBow(from, to),
    animate: true,
  });
  hideCablePreview();
  updateMissingSocket();
  flashPart(partElement(from));
  flashPart(partElement(to));
  sounds.plug();
  showToast(`Cable de la llave ${state.key}: ${PARTS[from].label} → ${PARTS[to].label}.`);
}

function spawnCutSpark(x, y) {
  const spark = document.createElement('div');
  spark.className = 'cut-spark';
  spark.style.left = `${x}px`;
  spark.style.top = `${y}px`;
  document.body.append(spark);
  window.setTimeout(() => spark.remove(), 420);
}

function cutCable(element, event = null) {
  const from = element.dataset.from;
  const to = element.dataset.to;
  if (from !== undefined && to !== undefined) {
    state.cables.delete(pairKey(from, to));
  }
  const lock = partElement('lock');
  if (lock !== null && lock.dataset.open === 'true' && mechanismComplete() === false) {
    lock.dataset.open = 'false';
    window.setTimeout(() => flashPart(lock), 320);
  }
  element.classList.add('is-cutting');
  let x = 0;
  let y = 0;
  if (event !== null && event.clientX !== undefined) {
    x = event.clientX;
    y = event.clientY;
  } else {
    const rect = element.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }
  spawnCutSpark(x, y);
  const scissorsButton = $('.inventory-tool[data-tool="scissors"]');
  if (scissorsButton !== null) {
    scissorsButton.classList.add('is-snapping');
    window.setTimeout(() => scissorsButton.classList.remove('is-snapping'), 260);
  }
  const hadFocus = document.activeElement === element;
  sounds.snip();
  showToast('El cable salta y queda cortado.');
  window.setTimeout(() => {
    element.remove();
    updateMissingSocket();
    if (hadFocus === true) {
      const remaining = wireGroup.querySelector('.cable');
      if (remaining !== null) {
        remaining.focus();
      } else {
        wires.focus();
      }
    }
  }, 300);
}

function updateMissingSocket() {
  const filled = state.cables.has(pairKey('gear-1', 'gear-2'));
  $$('.open-socket, .missing-groove').forEach((element) => {
    element.classList.toggle('is-filled', filled);
  });
}

function mechanismComplete() {
  return state.cables.has(pairKey('gear-1', 'gear-2'));
}

/* Probar una llave y ensayar con el ladrón: demostraciones visuales, sin lógica de juego. */
function probeMechanism() {
  clearSource();
  const lock = partElement('lock');
  if (mechanismComplete() === false) {
    if (lock.dataset.open === 'true') {
      lock.dataset.open = 'false';
      flashPart(lock);
    }
    stage.classList.add('is-alarm');
    mechanism.classList.add('is-probing');
    ringBell(partElement('bell'), 'El pulso cayó en el contacto vacío; la campana marcó el error. La caja sigue cerrada.');
    window.setTimeout(() => {
      stage.classList.remove('is-alarm');
      mechanism.classList.remove('is-probing');
    }, 1200);
    return;
  }
  mechanism.classList.add('is-probing');
  rotateGear(partElement('gear-1'));
  rotateGear(partElement('gear-2'));
  sounds.gear();
  lock.dataset.open = 'true';
  flashPart(lock);
  $$('.cable').forEach((cable, index) => {
    cable.style.setProperty('--pulse-delay', `${index * 70}ms`);
    cable.classList.add('is-pulsing');
  });
  sounds.plug();
  showToast('La llave recorrió el mecanismo. El perno cedió.', 2600);
  window.setTimeout(() => {
    sounds.lock();
  }, 420);
  window.setTimeout(() => {
    mechanism.classList.remove('is-probing');
    $$('.cable').forEach((cable) => {
      cable.classList.remove('is-pulsing');
      cable.style.removeProperty('--pulse-delay');
    });
    lock.dataset.open = 'false';
    sounds.lock();
  }, 1800);
}

function assaultMechanism() {
  const complete = mechanismComplete();
  const lock = partElement('lock');
  if (lock !== null) {
    lock.dataset.open = 'false';
  }
  stage.classList.add('is-heist');
  thief.classList.add('is-leaning');
  sounds.approach();
  if (complete) {
    showToast('El ladrón prueba el mecanismo…', 2200);
    window.setTimeout(() => {
      stage.classList.remove('is-heist');
      thief.classList.remove('is-leaning');
      sounds.lock();
      sounds.verdict();
      showToast('El ladrón se retira: el ensayo resistió. La caja no cedió.', 2800);
    }, 1800);
    return;
  }
  showToast('El ladrón busca un punto débil…', 2200);
  window.setTimeout(() => {
    stage.classList.remove('is-heist');
    thief.classList.remove('is-leaning');
    ringBell(partElement('bell'), 'El ladrón encontró el camino. El ensayo falló; vuelve al taller.');
    sounds.error();
  }, 1800);
}

/* Overlays. */
function openOverlay(kind) {
  state.lastFocus = document.activeElement;
  const template = $(`#tpl-${kind}`);
  if (template === null) {
    return;
  }
  toastEl.hidden = true;
  dossierContent.replaceChildren(template.content.cloneNode(true));
  overlay.hidden = false;
  gameShell.inert = true;
  document.body.classList.add('has-overlay');
  if (kind === 'hint') {
    renderHint();
  }
  if (kind === 'log') {
    dossier.setAttribute('aria-label', 'Bitácora del caso');
  } else if (kind === 'hint') {
    dossier.setAttribute('aria-label', 'Pista del caso');
  } else {
    dossier.setAttribute('aria-label', 'Contrato del cliente');
  }
  sounds.paper();
  overlayClose.focus();
}

function closeOverlay() {
  overlay.hidden = true;
  document.body.classList.remove('has-overlay');
  gameShell.inert = false;
  dossierContent.replaceChildren();
  if (state.lastFocus !== null && document.contains(state.lastFocus)) {
    state.lastFocus.focus();
  }
}

function renderHint() {
  const index = $('#hint-index');
  const text = $('#hint-text');
  const next = $('#next-hint');
  if (index === null || text === null || next === null) {
    return;
  }
  index.textContent = String(state.hintIndex + 1);
  text.textContent = HINTS[state.hintIndex];
  next.textContent = state.hintIndex < HINTS.length - 1 ? 'Siguiente pista' : 'Volver a la primera';
}

dossierContent.addEventListener('click', (event) => {
  const next = event.target.closest('#next-hint');
  if (next === null) {
    return;
  }
  state.hintIndex = (state.hintIndex + 1) % HINTS.length;
  renderHint();
  sounds.paper();
});

overlay.addEventListener('click', (event) => {
  if (event.target.matches('[data-close]')) {
    closeOverlay();
  }
});

overlayClose.addEventListener('click', closeOverlay);

document.addEventListener('keydown', (event) => {
  if (overlay.hidden === true) {
    return;
  }
  if (event.key === 'Escape') {
    closeOverlay();
    return;
  }
  if (event.key !== 'Tab') {
    return;
  }
  const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', dossier)
    .filter((element) => element.offsetParent !== null);
  if (focusable.length === 0) {
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (event.shiftKey === false && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

$$('.table-object').forEach((button) => {
  button.addEventListener('click', () => openOverlay(button.dataset.overlay));
});

/* Sonido. */
soundButton.addEventListener('click', () => {
  state.sound = state.sound === false;
  document.body.classList.toggle('is-sound-on', state.sound);
  soundButton.setAttribute('aria-pressed', String(state.sound));
  soundButton.setAttribute('aria-label', state.sound ? 'Desactivar sonido' : 'Activar sonido');
  if (state.sound) {
    sounds.click();
  }
});

/* Inventario. */
$$('.inventory-item').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    if (button.dataset.tool === 'gear') {
      setTool('gear');
      return;
    }
    if (button.dataset.tool === 'key') {
      setTool('key', button.dataset.key);
    } else {
      setTool(button.dataset.tool);
    }
    sounds.click();
  });

  button.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || button.dataset.tool === 'gear') {
      return;
    }
    state.dragging = true;
    state.dragTool = button.dataset.tool;
    state.dragKey = button.dataset.key ?? state.key;
    setTool(state.dragTool, state.dragKey);
    document.body.classList.add('is-dragging');
  });
});

document.addEventListener('pointerup', (event) => {
  if (state.dragging === false) {
    return;
  }
  state.dragging = false;
  document.body.classList.remove('is-dragging');
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const part = target === null ? null : target.closest('.part');
  const cable = target === null ? null : target.closest('.cable');
  if (part !== null) {
    state.suppressClickUntil = performance.now() + 260;
    applyToPart(part);
  } else if (cable !== null && state.tool === 'scissors') {
    state.suppressClickUntil = performance.now() + 260;
    cutCable(cable, event);
  }
});

document.addEventListener('pointercancel', () => {
  if (state.dragging === false) {
    return;
  }
  state.dragging = false;
  document.body.classList.remove('is-dragging');
});

stage.addEventListener('pointermove', (event) => {
  if (event.target.closest('.table-object') !== null) {
    hideCablePreview();
    return;
  }
  if (state.tool === 'wire' && state.source !== null) {
    updateCablePreview(state.source, event.clientX, event.clientY);
  }
});

stage.addEventListener('pointerleave', () => {
  hideCablePreview();
});

/* Piezas. */
$$('.part').forEach((part) => {
  part.addEventListener('click', (event) => {
    if (performance.now() < state.suppressClickUntil) {
      event.preventDefault();
      return;
    }
    applyToPart(part);
  });
  part.addEventListener('keydown', (event) => {
    if (part.tagName === 'BUTTON') {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      applyToPart(part);
    }
  });
});

/* Botones de acción. */
probeButton.addEventListener('click', probeMechanism);
assaultButton.addEventListener('click', assaultMechanism);

/* Estado inicial. */
fitStage();
seedCables();
setTool('wire', '1');
updateMissingSocket();
