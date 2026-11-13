const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const NS = 'http://www.w3.org/2000/svg';

const stage = $('#stage');
const mechanism = $('#mechanism');
const wireGroup = $('#wire-group');
const pulseLayer = $('#pulse-layer');
const toolCursor = $('#tool-cursor');
const toolCursorImg = $('#tool-cursor-img');
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

const KEY_COLORS = {
  1: '#f0cf6a',
  2: '#38c6b8',
  3: '#f06a4a',
  4: '#a18be0',
};

const HINTS = [
  'Probá la llave 1-2-3 y mirá por dónde pasa.',
  'Cada rueda recuerda cuántas teclas correctas van. ¿Alguna deja pasar una tecla de más?',
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

const isFinePointer = window.matchMedia('(pointer: fine)').matches;
if (isFinePointer) {
  document.body.classList.add('has-custom-cursor');
}

const spriteParam = new URLSearchParams(window.location.search).get('sprites');
if (spriteParam === 'png') {
  $$('img[data-sprite]').forEach((image) => {
    const source = image.src;
    const name = image.dataset.sprite;
    const probe = new Image();
    probe.addEventListener('load', () => {
      image.src = probe.src;
      if (toolCursorImg.src.includes(`${name}.svg`)) {
        toolCursorImg.src = probe.src;
      }
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

function tone({ frequency = 220, duration = 0.06, type = 'sine', volume = 0.04, slide = 0 }) {
  const context = audio();
  if (context === null) {
    return;
  }
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (slide !== 0) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), now + duration);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function noise({ duration = 0.08, volume = 0.03, frequency = 1800 }) {
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
  const now = context.currentTime;
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 1.2;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(now);
}

const sounds = {
  click() {
    tone({ frequency: 420, duration: 0.035, type: 'triangle', volume: 0.025 });
  },
  plug() {
    tone({ frequency: 120, duration: 0.12, type: 'sine', volume: 0.05, slide: -40 });
    noise({ duration: 0.045, volume: 0.018, frequency: 900 });
  },
  snip() {
    noise({ duration: 0.06, volume: 0.05, frequency: 3200 });
    tone({ frequency: 1400, duration: 0.04, type: 'square', volume: 0.015, slide: -500 });
  },
  gear() {
    tone({ frequency: 240, duration: 0.05, type: 'square', volume: 0.018 });
    noise({ duration: 0.03, volume: 0.012, frequency: 2400 });
  },
  lock() {
    tone({ frequency: 95, duration: 0.18, type: 'sine', volume: 0.075, slide: -30 });
    noise({ duration: 0.05, volume: 0.02, frequency: 500 });
  },
  bell() {
    tone({ frequency: 880, duration: 0.6, type: 'sine', volume: 0.045, slide: -80 });
    tone({ frequency: 1320, duration: 0.45, type: 'sine', volume: 0.025, slide: -60 });
  },
  paper() {
    noise({ duration: 0.12, volume: 0.022, frequency: 1200 });
  },
  error() {
    tone({ frequency: 180, duration: 0.12, type: 'sawtooth', volume: 0.025, slide: -30 });
  },
};

/* Cursor y herramienta. */
function cursorSource(tool, key) {
  if (tool === 'key') {
    return $(`.inventory-key[data-key="${key}"] img`);
  }
  return $(`.inventory-tool[data-tool="${tool}"] img`);
}

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
    button.classList.toggle('is-active', button.dataset.key === state.key);
  });
  $$('.inventory-tool').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tool === tool);
  });
  const source = cursorSource(tool, state.key);
  if (source !== undefined && source !== null) {
    toolCursorImg.src = source.src;
  }
  clearSource();
  hideStageHint();
}

function showCursor(x, y) {
  if (isFinePointer === false) {
    return;
  }
  toolCursor.hidden = false;
  toolCursor.style.left = `${x}px`;
  toolCursor.style.top = `${y}px`;
}

function hideCursor() {
  toolCursor.hidden = true;
}

function showToast(message, duration = 2400) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toastEl.hidden = true;
  }, duration);
}

function hideStageHint() {
  const hint = $('#stage-hint');
  if (hint !== null) {
    hint.classList.add('is-hidden');
  }
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
  sounds.gear();
}

function toggleLock(element) {
  const open = element.dataset.open !== 'true';
  element.dataset.open = String(open);
  flashPart(element);
  sounds.lock();
  showToast(open ? 'El perno se retrae con un golpe seco.' : 'El perno vuelve a cerrar la caja.');
}

function ringBell(element) {
  element.classList.remove('is-ringing');
  void element.offsetWidth;
  element.classList.add('is-ringing');
  sounds.bell();
  showToast('La campana de alarma está lista.');
  window.setTimeout(() => element.classList.remove('is-ringing'), 480);
}

function applyToPart(element) {
  const id = element.dataset.part;
  if (id === 'bell') {
    ringBell(element);
    return;
  }
  if (state.tool === 'key') {
    if (id === 'lock') {
      toggleLock(element);
      return;
    }
    if (id === 'entry') {
      flashPart(element);
      sounds.click();
      showToast('La llave entra en la entrada.');
      return;
    }
    rotateGear(element);
    return;
  }
  if (state.tool === 'wire') {
    handleWireClick(id, element);
    return;
  }
  if (state.tool === 'scissors') {
    showToast('Apuntá a un cable para cortarlo.');
    sounds.error();
  }
}

function handleWireClick(id, element) {
  if (state.source === null) {
    state.source = id;
    element.classList.add('is-source');
    sounds.click();
    showToast(`Cable desde ${PARTS[id].label}. Elegí el destino.`);
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
    cutCable(element);
  });
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

function curveMidpoint(start, control, end) {
  return {
    x: 0.25 * start.x + 0.5 * control.x + 0.25 * end.x,
    y: 0.25 * start.y + 0.5 * control.y + 0.25 * end.y,
  };
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
  const start = rimPoint(PARTS[from], PARTS[to], PARTS[from].r);
  const end = rimPoint(PARTS[to], PARTS[from], PARTS[to].r);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const control = {
    x: (start.x + end.x) / 2 - (dy / length) * 44,
    y: (start.y + end.y) / 2 + (dx / length) * 44,
  };
  const path = `M${start.x} ${start.y}Q${control.x} ${control.y} ${end.x} ${end.y}`;
  const cable = svgElement('g', {
    class: 'cable is-new',
    'data-cable': `dynamic-${Date.now()}`,
    'data-key': state.key,
    'data-from': from,
    'data-to': to,
  });
  cable.append(svgElement('path', { class: 'cable-hit', d: path, fill: 'none' }));
  cable.append(svgElement('path', { class: 'cable-shadow', d: path, fill: 'none' }));
  cable.append(svgElement('path', { class: 'cable-core', d: path, fill: 'none' }));
  cable.append(svgElement('path', { class: 'cable-sheen', d: path, fill: 'none' }));
  cable.append(svgElement('circle', { class: 'terminal', cx: start.x, cy: start.y, r: 7 }));
  cable.append(svgElement('circle', { class: 'terminal', cx: end.x, cy: end.y, r: 7 }));

  const midpoint = curveMidpoint(start, control, end);
  const tag = svgElement('g', { class: 'cable-tag', transform: `translate(${midpoint.x} ${midpoint.y})` });
  tag.append(svgElement('path', { class: 'tag-loop', d: 'M0-14v-7' }));
  tag.append(svgElement('circle', { class: 'tag-ring', cx: 0, cy: -24, r: 3.5 }));
  tag.append(svgElement('rect', { class: 'tag-body', x: -19, y: -14, width: 38, height: 28, rx: 5 }));
  tag.append(svgElement('circle', { class: 'tag-dot', cx: -9, cy: 0, r: 4.5, fill: KEY_COLORS[state.key] }));
  const text = svgElement('text', { class: 'tag-text', x: 7, y: 4, 'text-anchor': 'middle' });
  text.textContent = state.key;
  tag.append(text);
  cable.append(tag);

  wireGroup.append(cable);
  registerCable(cable);
  updateMissingSocket();
  flashPart(partElement(from));
  flashPart(partElement(to));
  sounds.plug();
  showToast(`Cable de la llave ${state.key}: ${PARTS[from].label} → ${PARTS[to].label}.`);
}

function cutCable(element) {
  const from = element.dataset.from;
  const to = element.dataset.to;
  if (from !== undefined && to !== undefined) {
    state.cables.delete(pairKey(from, to));
  }
  element.classList.add('is-cutting');
  sounds.snip();
  showToast('Cable cortado.');
  window.setTimeout(() => {
    element.remove();
    updateMissingSocket();
  }, 260);
}

function updateMissingSocket() {
  const filled = state.cables.has(pairKey('gear-1', 'gear-2'));
  $$('.open-socket, .missing-groove').forEach((element) => {
    element.classList.toggle('is-filled', filled);
  });
}

/* Probar y asaltar: demostraciones visuales, sin lógica de juego. */
function probeMechanism() {
  clearSource();
  mechanism.classList.add('is-probing');
  rotateGear(partElement('gear-1'));
  rotateGear(partElement('gear-2'));
  const lock = partElement('lock');
  if (lock.dataset.open !== 'true') {
    lock.dataset.open = 'true';
    flashPart(lock);
  }
  $$('.cable').forEach((cable, index) => {
    cable.style.animationDelay = `${index * 80}ms`;
    cable.classList.add('is-pulsing');
  });
  sounds.plug();
  showToast('La llave recorre el mecanismo. El perno cede.');
  window.setTimeout(() => {
    mechanism.classList.remove('is-probing');
    $$('.cable').forEach((cable) => {
      cable.classList.remove('is-pulsing');
      cable.style.animationDelay = '';
    });
  }, 1800);
}

function assaultMechanism() {
  stage.classList.add('is-heist');
  thief.classList.add('is-leaning');
  sounds.lock();
  showToast('El ladrón está probando la cerradura…', 2600);
  window.setTimeout(() => {
    stage.classList.remove('is-heist');
    thief.classList.remove('is-leaning');
    showToast('El ladrón se retira. Fin de la demostración.', 2200);
  }, 2800);
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
  document.body.classList.add('has-overlay');
  hideCursor();
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
  next.addEventListener('click', () => {
    state.hintIndex = (state.hintIndex + 1) % HINTS.length;
    renderHint();
    sounds.paper();
  });
}

overlay.addEventListener('click', (event) => {
  if (event.target.matches('[data-close]')) {
    closeOverlay();
  }
});

overlayClose.addEventListener('click', closeOverlay);

overlay.addEventListener('keydown', (event) => {
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
    toolCursor.classList.add('is-pressed');
    showCursor(event.clientX, event.clientY);
  });
});

document.addEventListener('pointermove', (event) => {
  if (state.dragging) {
    showCursor(event.clientX, event.clientY);
  }
});

document.addEventListener('pointerup', (event) => {
  if (state.dragging === false) {
    return;
  }
  state.dragging = false;
  document.body.classList.remove('is-dragging');
  toolCursor.classList.remove('is-pressed');
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const part = target === null ? null : target.closest('.part');
  const cable = target === null ? null : target.closest('.cable');
  if (part !== null) {
    state.suppressClickUntil = performance.now() + 260;
    applyToPart(part);
  } else if (cable !== null && state.tool === 'scissors') {
    state.suppressClickUntil = performance.now() + 260;
    cutCable(cable);
  }
  if (stage.contains(target) === false) {
    hideCursor();
  }
});

stage.addEventListener('pointermove', (event) => {
  if (isFinePointer === false) {
    return;
  }
  if (event.target.closest('.table-object') !== null) {
    hideCursor();
    return;
  }
  showCursor(event.clientX, event.clientY);
});

stage.addEventListener('pointerleave', () => {
  if (state.dragging === false) {
    hideCursor();
  }
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

$$('.cable').forEach(registerCable);

/* Botones de acción. */
probeButton.addEventListener('click', probeMechanism);
assaultButton.addEventListener('click', assaultMechanism);

/* Estado inicial. */
setTool('wire', '1');
updateMissingSocket();
window.setTimeout(hideStageHint, 6200);
