import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createWorkbenchView } from '../src/ui/workbenchView.js';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'src', 'ui', 'workbenchView.js'), 'utf8');

// --- DOM falso mínimo (solo document.createElement + textContent) ---
function element(tag) {
  const listeners = new Map();
  return {
    tag,
    children: [],
    textContent: '',
    className: '',
    type: undefined,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
    replaceChildren(...nodes) {
      this.children = [...nodes];
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
    fire(type, event = {}) {
      for (const handler of listeners.get(type) ?? []) {
        handler(event);
      }
    },
    listenerTypes() {
      return [...listeners.keys()];
    },
  };
}

globalThis.document = {
  createElement: (tag) => element(tag),
};

const ALARM_NOTE = 'Cualquier otra combinación deja la alarma encendida.';

function setup(overrides = {}) {
  const calls = { back: 0, probe: 0, assault: 0, docs: [], sound: 0 };
  const view = createWorkbenchView({
    contract: '01',
    title: 'La caja de seguridad',
    client: 'Banco del Llano',
    phase: 'Reparación',
    objective: {
      rule: 'Abre solo con 1 · 2 · 3.',
      intro: 'El taller huele a aceite.',
      note: ALARM_NOTE,
    },
    logLines: [{ text: 'Línea inicial', tone: 'neutral' }],
    soundEnabled: false,
    handlers: {
      onBack: () => calls.back++,
      onProbe: () => calls.probe++,
      onAssault: () => calls.assault++,
      onOpenDoc: (kind) => calls.docs.push(kind),
      onToggleSound: () => calls.sound++,
    },
    ...overrides,
  });
  return { view, calls };
}

function classes(node) {
  return (node.className || '').split(' ').filter(Boolean);
}

function* walk(node) {
  yield node;
  for (const child of node.children) {
    yield* walk(child);
  }
}

function findAll(root, predicate) {
  return [...walk(root)].filter(predicate);
}

function findByClass(root, className) {
  return findAll(root, (node) => classes(node).includes(className));
}

function findOne(root, predicate) {
  const found = findAll(root, predicate);
  assert.equal(found.length, 1, `se esperaba un nodo, hay ${found.length}`);
  return found[0];
}

function byAttr(root, name, value) {
  return findAll(root, (node) => node.attributes[name] === value);
}

function click(node) {
  node.fire('click');
}

test('raíz y header siguen el contrato', () => {
  const { view } = setup();
  assert.equal(view.element.tag, 'section');
  assert.ok(classes(view.element).includes('workbench'));

  const header = findOne(view.element, (n) => classes(n).includes('workbench-header'));
  assert.equal(header.tag, 'header');
  assert.equal(findOne(header, (n) => classes(n).includes('workbench-brand')).textContent, 'El Cerrajero');
  assert.equal(findOne(header, (n) => classes(n).includes('workbench-contract')).textContent, 'Contrato 01');
  const title = findOne(header, (n) => classes(n).includes('workbench-title'));
  assert.equal(title.tag, 'h1');
  assert.equal(title.textContent, 'La caja de seguridad');
  assert.equal(findOne(header, (n) => classes(n).includes('workbench-phase')).textContent, 'Reparación');

  const back = findOne(header, (n) => n.attributes['data-action'] === 'back');
  assert.equal(back.tag, 'button');
  assert.equal(back.type, 'button');
  assert.equal(back.textContent, 'Volver');
  assert.ok(classes(back).includes('workbench-back'));

  const sound = findOne(header, (n) => n.attributes['data-action'] === 'sound');
  assert.equal(sound.tag, 'button');
  assert.equal(sound.type, 'button');
  assert.equal(sound.getAttribute('aria-pressed'), 'false');
});

test('aside de objetivo con regla, intro, nota y botón de contrato', () => {
  const { view } = setup();
  const aside = findOne(view.element, (n) => classes(n).includes('workbench-objective'));
  assert.equal(aside.tag, 'aside');
  assert.equal(aside.getAttribute('aria-label'), 'Objetivo del contrato');
  assert.equal(findOne(aside, (n) => classes(n).includes('objective-kicker')).textContent, 'Objetivo');
  assert.equal(findOne(aside, (n) => classes(n).includes('objective-rule')).textContent, 'Abre solo con 1 · 2 · 3.');
  assert.equal(findOne(aside, (n) => classes(n).includes('objective-intro')).textContent, 'El taller huele a aceite.');
  assert.equal(findOne(aside, (n) => classes(n).includes('objective-note')).textContent, ALARM_NOTE);
  const open = findOne(aside, (n) => n.attributes['data-doc'] === 'contract');
  assert.equal(open.tag, 'button');
  assert.equal(open.type, 'button');
  assert.equal(open.textContent, 'Abrir contrato');
});

test('la nota cae al texto de la alarma cuando no viene', () => {
  const { view } = setup({ objective: { rule: 'R', intro: 'I' } });
  const aside = findOne(view.element, (n) => classes(n).includes('workbench-objective'));
  assert.equal(findOne(aside, (n) => classes(n).includes('objective-note')).textContent, ALARM_NOTE);
});

test('slots de stage, log, status e inventory', () => {
  const { view } = setup();
  const stage = findOne(view.element, (n) => n.attributes['data-slot'] === 'stage');
  assert.equal(stage.tag, 'section');
  assert.ok(classes(stage).includes('workbench-stage'));
  assert.equal(stage.getAttribute('aria-label'), 'Mecanismo');
  assert.strictEqual(view.slots.stage, stage);

  const logSlot = findOne(view.element, (n) => n.attributes['data-slot'] === 'log');
  assert.equal(logSlot.tag, 'aside');
  assert.ok(classes(logSlot).includes('workbench-log'));
  assert.equal(logSlot.getAttribute('aria-label'), 'Bitácora');
  assert.equal(findOne(logSlot, (n) => classes(n).includes('log-title')).textContent, 'Bitácora');
  const list = findOne(logSlot, (n) => classes(n).includes('log-list'));
  assert.strictEqual(view.slots.log, list);

  const status = findOne(view.element, (n) => n.attributes['data-slot'] === 'status');
  assert.equal(status.getAttribute('aria-label'), 'Estado del mecanismo');
  assert.strictEqual(view.slots.status, status);

  const inventory = findOne(view.element, (n) => n.attributes['data-slot'] === 'inventory');
  assert.equal(inventory.tag, 'footer');
  assert.equal(inventory.getAttribute('aria-label'), 'Inventario');
  assert.strictEqual(view.slots.inventory, inventory);

  for (const slot of [stage, list, status, inventory]) {
    assert.equal(slot.children.length, slot === list ? 1 : 0, 'los slots llegan vacíos salvo la bitácora inicial');
  }
});

test('barra de acciones con Probar, Ensayo, Contrato, Pista y Bitácora', () => {
  const { view } = setup();
  const bar = findOne(view.element, (n) => classes(n).includes('workbench-actions'));
  const probe = findOne(bar, (n) => n.attributes['data-action'] === 'probe');
  const assault = findOne(bar, (n) => n.attributes['data-action'] === 'assault');
  assert.equal(probe.textContent, 'Probar');
  assert.equal(assault.textContent, 'Ensayo');
  assert.ok(classes(assault).includes('is-primary'));
  assert.deepEqual(
    byAttr(bar, 'data-doc', 'contract').map((n) => n.textContent),
    ['Contrato'],
  );
  assert.equal(findOne(bar, (n) => n.attributes['data-doc'] === 'hint').textContent, 'Pista');
  assert.equal(findOne(bar, (n) => n.attributes['data-doc'] === 'log').textContent, 'Bitácora');
  for (const button of findAll(bar, (n) => n.tag === 'button')) {
    assert.equal(button.type, 'button');
    assert.ok(button.getAttribute('aria-label'), 'todo botón de acción tiene aria-label');
  }
});

test('callbacks de volver, probar, ensayo, documentos y sonido', () => {
  const { view, calls } = setup();
  click(findOne(view.element, (n) => n.attributes['data-action'] === 'back'));
  click(findOne(view.element, (n) => n.attributes['data-action'] === 'probe'));
  click(findOne(view.element, (n) => n.attributes['data-action'] === 'assault'));
  click(findOne(view.element, (n) => n.attributes['data-action'] === 'sound'));
  assert.deepEqual([calls.back, calls.probe, calls.assault, calls.sound], [1, 1, 1, 1]);

  click(findOne(view.element, (n) => classes(n).includes('objective-open')));
  for (const kind of ['contract', 'hint', 'log']) {
    click(findOne(view.element, (n) => n.tag === 'button' && n.attributes['data-doc'] === kind && !classes(n).includes('objective-open')));
  }
  assert.deepEqual(calls.docs, ['contract', 'contract', 'hint', 'log']);
});

test('sin handlers no lanza', () => {
  const view = createWorkbenchView({
    contract: '02',
    title: 'T',
    phase: 'Construcción',
    objective: { rule: 'R', intro: 'I' },
  });
  for (const button of findAll(view.element, (n) => n.tag === 'button')) {
    click(button);
  }
});

test('setPhase actualiza la fase', () => {
  const { view } = setup();
  view.setPhase('Construcción');
  assert.equal(findOne(view.element, (n) => classes(n).includes('workbench-phase')).textContent, 'Construcción');
});

test('setObjective actualiza regla, intro y nota', () => {
  const { view } = setup();
  view.setObjective({ rule: 'Nueva regla', intro: 'Nueva intro', note: 'Nueva nota' });
  const aside = findOne(view.element, (n) => classes(n).includes('workbench-objective'));
  assert.equal(findOne(aside, (n) => classes(n).includes('objective-rule')).textContent, 'Nueva regla');
  assert.equal(findOne(aside, (n) => classes(n).includes('objective-intro')).textContent, 'Nueva intro');
  assert.equal(findOne(aside, (n) => classes(n).includes('objective-note')).textContent, 'Nueva nota');
  view.setObjective({ note: '' });
  assert.equal(findOne(aside, (n) => classes(n).includes('objective-note')).textContent, ALARM_NOTE);
});

test('setSound refleja el estado con aria-pressed', () => {
  const { view } = setup({ soundEnabled: false });
  const sound = findOne(view.element, (n) => n.attributes['data-action'] === 'sound');
  view.setSound(true);
  assert.equal(sound.getAttribute('aria-pressed'), 'true');
  view.setSound(false);
  assert.equal(sound.getAttribute('aria-pressed'), 'false');
});

test('addLog y clearLog con tonos', () => {
  const { view } = setup({ logLines: [] });
  assert.equal(view.slots.log.children.length, 0);
  view.addLog('Pulso inicial');
  view.addLog('La llave abrió', 'good');
  view.addLog('La alarma quedó armada', 'bad');
  view.addLog('Tono raro', 'weird');
  const entries = findByClass(view.slots.log, 'log-entry');
  assert.equal(entries.length, 4);
  assert.deepEqual(
    entries.map((entry) => entry.attributes['data-tone']),
    ['neutral', 'good', 'bad', 'neutral'],
  );
  assert.equal(entries[0].textContent, 'Pulso inicial');
  view.clearLog();
  assert.equal(view.slots.log.children.length, 0);
  view.addLog('Después de limpiar');
  assert.equal(findByClass(view.slots.log, 'log-entry').length, 1);
});

test('las líneas iniciales usan el tono dado', () => {
  const { view } = setup({
    logLines: [
      { text: 'Bien', tone: 'good' },
      { text: 'Mal', tone: 'bad' },
    ],
  });
  assert.deepEqual(
    findByClass(view.slots.log, 'log-entry').map((entry) => [entry.textContent, entry.attributes['data-tone']]),
    [['Bien', 'good'], ['Mal', 'bad']],
  );
});

test('los datos del nivel viajan por textContent, sin innerHTML', () => {
  assert.ok(!source.includes('.innerHTML'), 'la vista no debe asignar innerHTML');
  assert.ok(!source.includes('insertAdjacentHTML'), 'la vista no debe usar insertAdjacentHTML');
  const evil = '<img src=x onerror=alert(1)> & <b>negrita</b>';
  const { view } = setup({ objective: { rule: evil, intro: evil, note: evil } });
  view.addLog(evil, 'good');
  const texts = findAll(view.element, (n) => n.textContent === evil);
  assert.ok(texts.length >= 4, 'regla, intro, nota y bitácora conservan el texto literal');
  for (const node of texts) {
    assert.equal(node.children.length, 0, 'el texto con marcas no se parsea como nodos');
  }
});

test('la vista no crea editor, cables ni llaves', () => {
  assert.ok(!source.includes('graphEditor'), 'sin importar el editor de grafos');
  assert.ok(!source.includes('drumEditor'), 'sin importar el editor de tambor');
  assert.ok(!source.includes('createElementNS'), 'sin SVG propio');
  const { view } = setup();
  const tags = new Set(findAll(view.element, () => true).map((node) => node.tag));
  assert.ok(!tags.has('svg'), 'sin nodos svg');
  assert.ok(!tags.has('canvas'), 'sin canvas');
  for (const banned of ['key', 'palette', 'wire', 'edge', 'state', 'drum', 'tape']) {
    assert.equal(findByClass(view.element, banned).length, 0, `sin nodos .${banned}`);
  }
  assert.ok(!source.includes('handleProbe'), 'la lógica de probar vive en el parent');
  assert.ok(!source.includes('handleAssault'), 'la lógica del ensayo vive en el parent');
});

test('botones reales, con foco posible y sin trampas de foco', () => {
  const { view } = setup();
  const buttons = findAll(view.element, (n) => n.tag === 'button');
  assert.ok(buttons.length >= 7, `hay ${buttons.length} botones`);
  for (const button of buttons) {
    assert.equal(button.type, 'button');
  }
  const trapped = findAll(view.element, (n) => n.listenerTypes().some((type) => type !== 'click'));
  assert.equal(trapped.length, 0, 'la vista solo escucha click; los modales y el foco los maneja el parent');
  const labelled = ['back', 'sound', 'probe', 'assault'].map(
    (action) => findOne(view.element, (n) => n.attributes['data-action'] === action),
  );
  for (const button of labelled) {
    assert.ok(button.getAttribute('aria-label'), 'acciones principales con aria-label');
  }
});
