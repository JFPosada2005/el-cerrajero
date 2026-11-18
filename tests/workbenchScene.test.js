import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createWorkbenchScene } from '../src/ui/workbenchScene.js';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'src', 'ui', 'workbenchScene.js'), 'utf8');
const css = readFileSync(join(here, '..', 'src', 'ui', 'workbenchScene.css'), 'utf8');
const modalCss = readFileSync(join(here, '..', 'src', 'ui', 'paperModal.css'), 'utf8');
const mainSource = readFileSync(join(here, '..', 'src', 'main.js'), 'utf8');

// --- DOM falso mínimo (solo document.createElement + textContent) ---
function element(tag) {
  const listeners = new Map();
  return {
    tag,
    children: [],
    textContent: '',
    className: '',
    type: undefined,
    hidden: false,
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
  const scene = createWorkbenchScene({
    contract: '01',
    title: 'La caja de seguridad',
    client: 'Banco del Llano',
    phase: 'Reparación',
    objective: {
      rule: 'Abre solo con 1 · 2 · 3.',
      intro: 'El taller huele a aceite.',
      note: ALARM_NOTE,
    },
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
  return { scene, calls };
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

function click(node) {
  node.fire('click');
}

test('raíz y header siguen el contrato', () => {
  const { scene } = setup();
  assert.equal(scene.element.tag, 'section');
  assert.ok(classes(scene.element).includes('wb-scene'));

  const header = findOne(scene.element, (n) => classes(n).includes('wb-header'));
  assert.equal(header.tag, 'header');
  assert.equal(findOne(header, (n) => classes(n).includes('wb-brand')).textContent, 'El Cerrajero');
  assert.equal(findOne(header, (n) => classes(n).includes('wb-contract')).textContent, 'Contrato 01');
  const title = findOne(header, (n) => classes(n).includes('wb-title'));
  assert.equal(title.tag, 'h1');
  assert.equal(title.textContent, 'La caja de seguridad');
  assert.equal(findOne(header, (n) => classes(n).includes('wb-phase')).textContent, 'Reparación');

  const back = findOne(header, (n) => n.attributes['data-action'] === 'back');
  assert.equal(back.tag, 'button');
  assert.equal(back.type, 'button');
  assert.equal(back.textContent, 'Volver');

  const sound = findOne(header, (n) => n.attributes['data-action'] === 'sound');
  assert.equal(sound.tag, 'button');
  assert.equal(sound.type, 'button');
  assert.equal(sound.getAttribute('aria-pressed'), 'false');
});

test('ficha de objetivo fija con regla, intro, nota y botón de contrato', () => {
  const { scene } = setup();
  const aside = findOne(scene.element, (n) => classes(n).includes('wb-objective'));
  assert.equal(aside.tag, 'aside');
  assert.equal(aside.getAttribute('aria-label'), 'Objetivo del contrato');
  assert.equal(findOne(aside, (n) => classes(n).includes('wb-rule')).textContent, 'Abre solo con 1 · 2 · 3.');
  assert.equal(findOne(aside, (n) => classes(n).includes('wb-intro')).textContent, 'El taller huele a aceite.');
  assert.equal(findOne(aside, (n) => classes(n).includes('wb-note')).textContent, ALARM_NOTE);
  const open = findOne(aside, (n) => n.attributes['data-doc'] === 'contract');
  assert.equal(open.tag, 'button');
  assert.equal(open.type, 'button');
});

test('la nota cae al texto de la alarma cuando no viene', () => {
  const { scene } = setup({ objective: { rule: 'R', intro: 'I' } });
  const aside = findOne(scene.element, (n) => classes(n).includes('wb-objective'));
  assert.equal(findOne(aside, (n) => classes(n).includes('wb-note')).textContent, ALARM_NOTE);
});

test('slots de stage, objective, log, status, inventory y actions', () => {
  const { scene } = setup();
  const stage = findOne(scene.element, (n) => n.attributes['data-slot'] === 'stage');
  assert.equal(stage.tag, 'section');
  assert.ok(classes(stage).includes('wb-stage'));
  assert.strictEqual(scene.slots.stage, stage);

  const objective = findOne(scene.element, (n) => n.attributes['data-slot'] === 'objective');
  assert.strictEqual(scene.slots.objective, objective);

  const status = findOne(scene.element, (n) => n.attributes['data-slot'] === 'status');
  assert.strictEqual(scene.slots.status, status);

  const inventory = findOne(scene.element, (n) => n.attributes['data-slot'] === 'inventory');
  assert.equal(inventory.tag, 'footer');
  assert.strictEqual(scene.slots.inventory, inventory);

  const actions = findOne(scene.element, (n) => n.attributes['data-slot'] === 'actions');
  assert.strictEqual(scene.slots.actions, actions);

  const logSlot = findOne(scene.element, (n) => n.attributes['data-slot'] === 'log');
  const list = findOne(logSlot, (n) => classes(n).includes('wb-log-list'));
  assert.strictEqual(scene.slots.log, list);

  for (const slot of [stage, status, inventory]) {
    assert.equal(slot.children.length, 0, 'los slots llegan vacíos para que el parent los monte');
  }
});

test('barra de acciones con Probar, Ensayo, Contrato, Pista y Bitácora', () => {
  const { scene } = setup();
  const bar = findOne(scene.element, (n) => classes(n).includes('wb-actions'));
  const probe = findOne(bar, (n) => n.attributes['data-action'] === 'probe');
  const assault = findOne(bar, (n) => n.attributes['data-action'] === 'assault');
  assert.equal(probe.textContent, 'Probar');
  assert.equal(assault.textContent, 'Ensayo');
  assert.ok(classes(assault).includes('wb-btn-primary'));
  assert.equal(findOne(bar, (n) => n.attributes['data-doc'] === 'contract').textContent, 'Contrato');
  assert.equal(findOne(bar, (n) => n.attributes['data-doc'] === 'hint').textContent, 'Pista');
  assert.equal(findOne(bar, (n) => n.attributes['data-doc'] === 'log').textContent, 'Bitácora');
  for (const button of findAll(bar, (n) => n.tag === 'button')) {
    assert.equal(button.type, 'button');
    assert.ok(button.getAttribute('aria-label'), 'todo botón de acción tiene aria-label');
  }
});

test('callbacks de volver, probar, ensayo, documentos y sonido', () => {
  const { scene, calls } = setup();
  click(findOne(scene.element, (n) => n.attributes['data-action'] === 'back'));
  click(findOne(scene.element, (n) => n.attributes['data-action'] === 'probe'));
  click(findOne(scene.element, (n) => n.attributes['data-action'] === 'assault'));
  click(findOne(scene.element, (n) => n.attributes['data-action'] === 'sound'));
  assert.deepEqual([calls.back, calls.probe, calls.assault, calls.sound], [1, 1, 1, 1]);

  click(findOne(scene.element, (n) => classes(n).includes('wb-open-contract')));
  for (const kind of ['contract', 'hint', 'log']) {
    click(findOne(scene.element, (n) => n.tag === 'button' && n.attributes['data-doc'] === kind && !classes(n).includes('wb-open-contract')));
  }
  assert.deepEqual(calls.docs, ['contract', 'contract', 'hint', 'log']);
});

test('sin handlers no lanza', () => {
  const scene = createWorkbenchScene({
    contract: '02',
    title: 'T',
    phase: 'Construcción',
    objective: { rule: 'R', intro: 'I' },
  });
  for (const button of findAll(scene.element, (n) => n.tag === 'button')) {
    click(button);
  }
});

test('setPhase actualiza la fase', () => {
  const { scene } = setup();
  scene.setPhase('Construcción');
  assert.equal(findOne(scene.element, (n) => classes(n).includes('wb-phase')).textContent, 'Construcción');
});

test('setObjective actualiza regla, intro y nota', () => {
  const { scene } = setup();
  scene.setObjective({ rule: 'Nueva regla', intro: 'Nueva intro', note: 'Nueva nota' });
  const aside = findOne(scene.element, (n) => classes(n).includes('wb-objective'));
  assert.equal(findOne(aside, (n) => classes(n).includes('wb-rule')).textContent, 'Nueva regla');
  assert.equal(findOne(aside, (n) => classes(n).includes('wb-intro')).textContent, 'Nueva intro');
  assert.equal(findOne(aside, (n) => classes(n).includes('wb-note')).textContent, 'Nueva nota');
  scene.setObjective({ note: '' });
  assert.equal(findOne(aside, (n) => classes(n).includes('wb-note')).textContent, ALARM_NOTE);
});

test('setSound refleja el estado con aria-pressed', () => {
  const { scene } = setup({ soundEnabled: false });
  const sound = findOne(scene.element, (n) => n.attributes['data-action'] === 'sound');
  scene.setSound(true);
  assert.equal(sound.getAttribute('aria-pressed'), 'true');
  scene.setSound(false);
  assert.equal(sound.getAttribute('aria-pressed'), 'false');
});

test('addLog y clearLog con tonos; la bitácora se muestra y se oculta', () => {
  const { scene } = setup();
  const logAside = findOne(scene.element, (n) => classes(n).includes('wb-log'));
  assert.equal(logAside.hidden, true);
  assert.equal(scene.slots.log.children.length, 0);
  scene.addLog('Pulso inicial');
  scene.addLog('La llave abrió', 'good');
  scene.addLog('La alarma quedó armada', 'bad');
  scene.addLog('Tono raro', 'weird');
  const entries = findByClass(scene.slots.log, 'wb-log-entry');
  assert.equal(entries.length, 4);
  assert.deepEqual(
    entries.map((entry) => entry.attributes['data-tone']),
    ['neutral', 'good', 'bad', 'neutral'],
  );
  assert.equal(entries[0].textContent, 'Pulso inicial');
  assert.equal(logAside.hidden, false);
  scene.clearLog();
  assert.equal(scene.slots.log.children.length, 0);
  assert.equal(logAside.hidden, true);
  scene.addLog('Después de limpiar');
  assert.equal(findByClass(scene.slots.log, 'wb-log-entry').length, 1);
});

test('los datos del nivel viajan por textContent, sin HTML', () => {
  assert.ok(!source.includes('.innerHTML'), 'el shell no debe asignar innerHTML');
  assert.ok(!source.includes('insertAdjacentHTML'), 'el shell no debe usar insertAdjacentHTML');
  const evil = '<img src=x onerror=alert(1)> & <b>negrita</b>';
  const { scene } = setup({ objective: { rule: evil, intro: evil, note: evil } });
  scene.addLog(evil, 'good');
  const texts = findAll(scene.element, (n) => n.textContent === evil);
  assert.ok(texts.length >= 4, 'regla, intro, nota y bitácora conservan el texto literal');
  for (const node of texts) {
    assert.equal(node.children.length, 0, 'el texto con marcas no se parsea como nodos');
  }
});

test('el shell no crea escena de nivel, editor, cables ni llaves', () => {
  assert.ok(!source.includes('graphEditor'), 'sin importar el editor de grafos');
  assert.ok(!source.includes('drumEditor'), 'sin importar el editor de tambor');
  assert.ok(!source.includes('createElementNS'), 'sin SVG propio');
  const { scene } = setup();
  const tags = new Set(findAll(scene.element, () => true).map((node) => node.tag));
  assert.ok(!tags.has('svg'), 'sin nodos svg');
  assert.ok(!tags.has('canvas'), 'sin canvas');
  for (const banned of ['key', 'palette', 'wire', 'edge', 'state', 'drum', 'tape']) {
    assert.equal(findByClass(scene.element, banned).length, 0, `sin nodos .${banned}`);
  }
  assert.ok(!source.includes('handleProbe'), 'la lógica de probar vive en el parent');
  assert.ok(!source.includes('handleAssault'), 'la lógica del ensayo vive en el parent');
});

test('botones reales, con foco posible y sin trampas de foco', () => {
  const { scene } = setup();
  const buttons = findAll(scene.element, (n) => n.tag === 'button');
  assert.ok(buttons.length >= 7, `hay ${buttons.length} botones`);
  for (const button of buttons) {
    assert.equal(button.type, 'button');
  }
  const trapped = findAll(scene.element, (n) => n.listenerTypes().some((type) => type !== 'click'));
  assert.equal(trapped.length, 0, 'el shell solo escucha click; los modales y el foco los maneja el parent');
  const labelled = ['back', 'sound', 'probe', 'assault'].map(
    (action) => findOne(scene.element, (n) => n.attributes['data-action'] === action),
  );
  for (const button of labelled) {
    assert.ok(button.getAttribute('aria-label'), 'acciones principales con aria-label');
  }
});

test('el objetivo se puede plegar y desplegar sin romper callbacks', () => {
  const { scene, calls } = setup();
  const aside = findOne(scene.element, (n) => classes(n).includes('wb-objective'));
  const toggle = findOne(aside, (n) => classes(n).includes('wb-objective-toggle'));
  assert.equal(toggle.tag, 'button');
  assert.equal(toggle.type, 'button');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(aside.getAttribute('data-collapsed'), 'false');
  assert.ok(toggle.getAttribute('aria-label'), 'el plegable tiene etiqueta accesible');

  click(toggle);
  assert.equal(aside.getAttribute('data-collapsed'), 'true');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(toggle.textContent, 'Desplegar');
  click(toggle);
  assert.equal(aside.getAttribute('data-collapsed'), 'false');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.textContent, 'Plegar');

  // Los callbacks del shell siguen intactos tras plegar.
  click(findOne(scene.element, (n) => n.attributes['data-action'] === 'probe'));
  click(findOne(scene.element, (n) => n.attributes['data-action'] === 'assault'));
  assert.deepEqual([calls.probe, calls.assault], [1, 1]);
  const trapped = findAll(scene.element, (n) => n.listenerTypes().some((type) => type !== 'click'));
  assert.equal(trapped.length, 0, 'el plegable solo escucha click');
});

test('la bitácora se puede plegar y conserva mostrar/ocultar por contenido', () => {
  const { scene } = setup();
  const logAside = findOne(scene.element, (n) => classes(n).includes('wb-log'));
  const toggle = findOne(logAside, (n) => classes(n).includes('wb-log-toggle'));
  assert.equal(toggle.tag, 'button');
  assert.equal(toggle.type, 'button');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(logAside.hidden, true);

  scene.addLog('Pulso inicial');
  assert.equal(logAside.hidden, false);
  click(toggle);
  assert.equal(logAside.getAttribute('data-collapsed'), 'true');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(logAside.hidden, false, 'plegar no vacía la bitácora');
  click(toggle);
  assert.equal(logAside.getAttribute('data-collapsed'), 'false');
  assert.equal(scene.slots.log.children.length, 1);
  scene.clearLog();
  assert.equal(logAside.hidden, true);
});

test('el dock agrupa inventario y acciones sin romper slots', () => {
  const { scene } = setup();
  const dock = findOne(scene.element, (n) => classes(n).includes('wb-dock'));
  assert.equal(dock.tag, 'div');
  assert.deepEqual(
    dock.children,
    [scene.slots.inventory, scene.slots.actions],
    'el dock contiene inventario y luego acciones, en ese orden',
  );
  assert.strictEqual(scene.slots.inventory.tag, 'footer');
  const bar = findOne(scene.element, (n) => classes(n).includes('wb-actions'));
  assert.strictEqual(bar, scene.slots.actions);
});

test('el css móvil (≤768px) fija el dock, compacta inventario y pliega papeles', () => {
  const mobileAt = css.indexOf('max-width: 768px');
  assert.ok(mobileAt > 0, 'hay un bloque móvil a 768px');
  const after = css.slice(mobileAt);
  const dockAt = after.indexOf('.wb-dock');
  assert.ok(dockAt > 0, 'el dock tiene reglas móviles');
  const dockRules = after.slice(dockAt, dockAt + 600);
  assert.ok(dockRules.includes('position: sticky'), 'el dock queda fijo abajo en móvil');
  assert.ok(dockRules.includes('max-height'), 'el dock tiene alto acotado');
  assert.ok(dockRules.includes('252px'), 'el dock llega a ~252px más el área segura, con todo visible');
  assert.ok(!/\.wb-actions\s*\{[^}]*position:\s*sticky/.test(after), 'las acciones ya no son sticky por separado: el dock las lleva');
  const actionsAt = after.indexOf('.wb-dock .wb-actions');
  assert.ok(actionsAt > 0, 'las acciones tienen reglas móviles');
  const actionsRules = after.slice(actionsAt, actionsAt + 900);
  assert.ok(actionsRules.includes('flex-wrap: nowrap'), 'las cinco acciones van en una sola fila');
  assert.ok(actionsRules.includes('white-space: normal'), 'la etiqueta puede bajar a dos líneas en vez de recortarse');
  assert.ok(!actionsRules.includes('overflow: hidden'), 'nada recorta la etiqueta de las acciones');
  assert.ok(!actionsRules.includes('text-overflow'), 'sin puntos suspensivos en las acciones');
  assert.ok(after.includes('.wb-inventory'), 'el inventario tiene reglas móviles');
  assert.ok(!after.includes('overflow-x: auto'), 'el inventario ya no scrollea en horizontal');
  assert.ok(!after.includes('overflow-y'), 'el inventario no tiene scroll vertical interno');
  assert.ok(!after.includes('max-height: 104px'), 'el inventario muestra sus dos filas sin tope');
  assert.ok(after.includes('overflow-x: clip'), 'sin desborde horizontal en el dock');
  assert.ok(after.includes('flex-wrap: wrap'), 'la cabecera envuelve y el inventario baja a dos filas');
  assert.ok(after.includes('data-collapsed'), 'los papeles se pliegan en móvil');
  assert.ok(after.includes('scroll-margin-bottom: 260px'), 'el stage scrollea por encima del dock opaco');
  assert.ok(after.includes('.wb-dock .wb-actions .wb-btn::before'), 'los remaches no tapan la etiqueta en el dock compacto');
  assert.ok(after.includes('.wb-inventory > .tools'), 'las herramientas caben y envuelven dentro del inventario');
  assert.ok(after.includes('safe-area-inset-bottom'), 'respeta el área segura');
  assert.ok(after.includes('overflow-x: clip'), 'sin scroll horizontal de página');
});

test('las acciones móviles mantienen target de 44px en una fila', () => {
  const mobile = css.slice(css.indexOf('max-width: 768px'));
  const btnAt = mobile.indexOf('.wb-dock .wb-actions .wb-btn');
  assert.ok(btnAt > 0, 'los botones de acción tienen reglas móviles');
  const btnRules = mobile.slice(btnAt, btnAt + 900);
  assert.ok(btnRules.includes('min-width: 0'), 'los botones ceden ancho para entrar los cinco');
  assert.ok(btnRules.includes('min-height: 44px'), 'cada acción mide ≥44px de alto');
  assert.ok(btnRules.includes('clamp(10px, 3.1vw, 12px)'), 'la etiqueta escala sin recortarse');
  assert.ok(btnRules.includes('flex: 1 1 0'), 'las cinco se reparten la fila');
  assert.ok(!mobile.includes('overflow: hidden'), 'el móvil no recorta etiquetas en ningún lado');
  assert.ok(!mobile.includes('text-overflow: ellipsis'), 'el móvil no usa puntos suspensivos');
});

test('el dock no cambia el escritorio: display contents en base', () => {
  const base = css.slice(0, css.indexOf('max-width: 768px'));
  const dockAt = base.indexOf('.wb-dock');
  assert.ok(dockAt > 0, 'el dock existe en base');
  assert.ok(base.slice(dockAt, dockAt + 200).includes('display: contents'), 'en escritorio el dock desaparece del layout');
});

test('los plegables no cambian el escritorio: ocultos por defecto', () => {
  const base = css.slice(0, css.indexOf('max-width: 768px'));
  assert.ok(base.includes('.wb-objective-toggle'), 'el plegable del objetivo existe en base');
  assert.ok(base.includes('.wb-log-toggle'), 'el plegable de la bitácora existe en base');
  assert.ok(base.includes('display: none'), 'los plegables están ocultos en escritorio');
});

test('el escritorio (≥900px) conserva su composición', () => {
  const desktopAt = css.indexOf('(min-width: 900px)');
  assert.ok(desktopAt > 0, 'el bloque de escritorio sigue existiendo');
  const desktop = css.slice(desktopAt);
  assert.ok(desktop.includes('.wb-log'), 'la bitácora de escritorio sigue gobernada');
  assert.ok(desktop.includes('display: none !important'), 'la bitácora de escritorio sigue oculta');
  assert.ok(desktop.includes('clamp(380px'), 'el escenario de escritorio conserva su altura');
});
test('el css usa alcance propio, foco visible y movimiento reducido', () => {
  assert.ok(css.includes('.wb-stage'), 'expone el contenedor de escena');
  assert.ok(css.includes(':focus-visible'), 'foco visible');
  assert.ok(css.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
  assert.ok(css.includes('min-height: 44px'), 'targets táctiles de 44 px');
  assert.ok(!/^\s*\*\s*\{/m.test(css), 'sin reset global con *');
  assert.ok(!/^\s*(html|body)\s*\{/m.test(css), 'sin tocar html/body');
  const sizes = [...css.matchAll(/font-size\s*:\s*([^;]+);/g)].map((m) => m[1].trim());
  const tooSmall = sizes.filter((value) => {
    const px = Number.parseFloat(value);
    return value.endsWith('px') && Number.isFinite(px) && px < 12;
  });
  assert.deepEqual(tooSmall, [], 'ningún font-size bajo 12 px');
});

test('diegeticActions suma is-diegetic y retira la barra de acciones', () => {
  const { scene } = setup({ diegeticActions: true });
  assert.ok(classes(scene.element).includes('is-diegetic'), 'la raíz marca el modo diegético');
  assert.ok(classes(scene.element).includes('wb-scene'), 'conserva la clase del shell');
  const plain = setup().scene;
  assert.ok(!classes(plain.element).includes('is-diegetic'), 'sin la opción no hay marca');
  const barAt = css.indexOf('.wb-scene.is-diegetic .wb-actions');
  assert.ok(barAt > 0, 'hay regla diegética para la barra');
  assert.ok(css.slice(barAt, barAt + 120).includes('display: none'), 'la barra se oculta en modo diegético');
  const bar = findOne(scene.element, (n) => classes(n).includes('wb-actions'));
  assert.strictEqual(bar, scene.slots.actions, 'el slot de acciones sigue expuesto para el parent');
});

test('en modo diegético el contrato de papel reemplaza al botón del objetivo', () => {
  const { scene } = setup({ diegeticActions: true });
  const open = findOne(scene.element, (n) => classes(n).includes('wb-open-contract'));
  assert.equal(open.tag, 'button', 'el botón sigue en el DOM');
  const at = css.indexOf('.wb-scene.is-diegetic .wb-open-contract');
  assert.ok(at > 0, 'el CSS oculta Abrir contrato en modo diegético');
  assert.ok(css.slice(at, at + 120).includes('display: none'), 'display none para el botón del objetivo');
  const aside = findOne(scene.element, (n) => classes(n).includes('wb-objective'));
  assert.equal(findOne(aside, (n) => classes(n).includes('wb-rule')).textContent, 'Abre solo con 1 · 2 · 3.');
  assert.equal(findOne(aside, (n) => classes(n).includes('wb-intro')).textContent, 'El taller huele a aceite.');
});

test('la franja de estado se lee sobre el fondo oscuro', () => {
  assert.ok(css.includes('rgba(242, 237, 227, 0.92)'), 'tinta clara del taller a opacidad 0.92');
  const statusAt = css.indexOf('.wb-scene .wb-status');
  assert.ok(statusAt > 0, 'la franja de estado tiene reglas propias');
  assert.ok(/\.wb-scene \.wb-status[\s\S]{0,600}font-size:\s*1[4-9]px/.test(css), 'estado con piso de 14 px');
  assert.ok(css.includes('border-bottom: 2px solid rgba(212, 167, 44, 0.65)'), 'línea grabada de latón');
  assert.ok(css.includes('.wb-scene .active-key'), 'la llave activa comparte el piso');
  assert.ok(css.includes('.wb-scene .legend'), 'la leyenda comparte el piso');
});

test('immersive agrega is-immersive y libera la ventana', () => {
  const { scene } = setup({ immersive: true });
  assert.ok(classes(scene.element).includes('is-immersive'), 'la raíz marca el modo inmersivo');
  assert.ok(!classes(setup().scene.element).includes('is-immersive'), 'sin la opción no hay marca');
  const rootAt = css.indexOf('.wb-scene.is-immersive {');
  assert.ok(rootAt > 0, 'hay reglas inmersivas');
  const root = css.slice(rootAt, css.indexOf('}', rootAt));
  assert.ok(root.includes('height: 100dvh'), 'toda la ventana');
  assert.ok(root.includes('overflow: hidden'), 'sin scroll de página');
});

test('en inmersivo no hay panel de objetivo ni bitácora', () => {
  for (const slot of ['.wb-objective', '.wb-log']) {
    const at = css.indexOf(`.wb-scene.is-immersive ${slot}`);
    assert.ok(at > 0, `${slot} tiene regla inmersiva`);
    assert.ok(css.slice(at, at + 160).includes('display: none'), `${slot} se retira`);
  }
  const bodyAt = css.indexOf('.wb-scene.is-immersive .wb-body');
  assert.ok(bodyAt > 0, 'el body colapsa a una columna');
  assert.ok(css.slice(bodyAt, bodyAt + 120).includes('height: 100%'), 'el body cede todo el alto al stage');
});

test('el stage inmersivo no tiene marco y el header flota', () => {
  const stageAt = css.indexOf('.wb-scene.is-immersive .wb-stage');
  assert.ok(stageAt > 0, 'el stage tiene reglas inmersivas');
  const stage = css.slice(stageAt, stageAt + 420);
  assert.ok(stage.includes('position: absolute'), 'el stage cubre la ventana');
  assert.ok(stage.includes('top: var(--wb-header-h)'), 'el stage arranca debajo del header');
  assert.ok(stage.includes('height: calc(100dvh - var(--wb-header-h))'), 'sin scroll de página');
  assert.ok(stage.includes('z-index: 0'), 'atrapado bajo el header');
  assert.ok(stage.includes('border: 0'), 'sin borde de caja');
  assert.ok(stage.includes('background: none'), 'el fondo lo pone la escena');
  const headerAt = css.indexOf('.wb-scene.is-immersive .wb-header');
  assert.ok(headerAt > 0, 'el header tiene reglas inmersivas');
  const header = css.slice(headerAt, headerAt + 260);
  assert.ok(header.includes('position: absolute'), 'el header flota');
  assert.ok(header.includes('top: 0'), 'arriba');
  assert.ok(header.includes('z-index: 50'), 'siempre por encima de la escena');
  assert.ok(header.includes('linear-gradient'), 'degradado tenue para legibilidad');
});

test('el alto del header es variable: 84px escritorio, 113px móvil', () => {
  const rootAt = css.indexOf('.wb-scene.is-immersive {');
  assert.ok(rootAt > 0, 'la raíz inmersiva declara la variable');
  assert.ok(css.slice(rootAt, css.indexOf('}', rootAt)).includes('--wb-header-h: 84px'), 'escritorio 84px');
  const mobile = css.slice(css.indexOf('max-width: 768px'));
  const mobileAt = mobile.indexOf('.wb-scene.is-immersive {');
  assert.ok(mobileAt > 0, 'el móvil ajusta la variable');
  assert.ok(mobile.slice(mobileAt, mobile.indexOf('}', mobileAt)).includes('--wb-header-h: 113px'), 'móvil 113px');
});

test('main.js engancha los selectores de pila del escenario', () => {
  assert.ok(mainSource.includes('[data-stack-top]'), 'engancha data-stack-top');
  assert.ok(mainSource.includes('[data-stack-action]'), 'engancha data-stack-action');
  assert.ok(mainSource.includes('selectStackTop(value)'), 'llama a selectStackTop');
  assert.ok(mainSource.includes('selectStackAction(value)'), 'llama a selectStackAction');
  assert.ok(mainSource.includes("getAttribute('data-stack-top') === stackTop"), 'refleja is-active/aria-pressed del tope');
  assert.ok(mainSource.includes("getAttribute('data-stack-action') === stackAction"), 'refleja is-active/aria-pressed de la acción');
  assert.ok(mainSource.includes('hasDiegeticStack'), 'la fila del shell sobra si la escena trae selectores');
});

test('el header queda por encima de la escena en todos los niveles', () => {
  const headerAt = css.indexOf('.wb-scene .wb-header {');
  assert.ok(headerAt > 0, 'el header base tiene regla propia');
  const header = css.slice(headerAt, css.indexOf('}', headerAt));
  assert.ok(header.includes('position: relative'), 'el header crea su capa');
  assert.ok(header.includes('z-index: 50'), 'Volver y Sonido por encima de todo prop');
  const stageAt = css.indexOf('.wb-scene .wb-stage {');
  assert.ok(stageAt > 0, 'el stage base tiene regla propia');
  const stage = css.slice(stageAt, css.indexOf('}', stageAt));
  assert.ok(stage.includes('position: relative'), 'la escena absoluta se contiene en el stage');
  assert.ok(stage.includes('z-index: 0'), 'la escena queda bajo el header');
  const mobile = css.slice(css.indexOf('max-width: 768px'));
  const mobileHeaderAt = mobile.indexOf('.wb-scene .wb-header {');
  assert.ok(mobileHeaderAt > 0, 'el header móvil tiene regla propia');
  const mobileHeader = mobile.slice(mobileHeaderAt, mobile.indexOf('}', mobileHeaderAt));
  assert.ok(!mobileHeader.includes('z-index'), 'el móvil conserva el z-index 50 de base');
  assert.ok(!mobileHeader.includes('position:'), 'el móvil conserva la capa de base');
});

test('is-slotted retira rack y estado del shell cuando la escena los aloja', () => {
  const statusAt = css.indexOf('.wb-scene.is-immersive > .wb-status');
  assert.ok(statusAt > 0, 'la línea del shell sigue como fallback');
  assert.ok(css.slice(statusAt, statusAt + 140).includes('position: absolute'), 'fallback flotante');
  const slottedAt = css.indexOf('.wb-scene.is-immersive.is-slotted');
  assert.ok(slottedAt > 0, 'hay reglas para escena con ranuras');
  const slotted = css.slice(slottedAt, slottedAt + 220);
  assert.ok(slotted.includes('.wb-dock .wb-inventory'), 'el rack del shell se retira');
  assert.ok(slotted.includes('display: none'), 'sin duplicar rack ni línea');
  const actionsAt = css.indexOf('.wb-scene.is-immersive .wb-actions');
  assert.ok(actionsAt > 0 && css.slice(actionsAt, actionsAt + 80).includes('display: none'), 'sin barra de acciones');
});

test('el velo del modal tapa rack, estado, header y props', () => {
  assert.ok(modalCss.includes('.modal-backdrop'), 'el velo tiene reglas propias');
  const veilAt = modalCss.indexOf('.modal-backdrop {');
  assert.ok(veilAt >= 0, 'regla del backdrop');
  const veil = modalCss.slice(veilAt, modalCss.indexOf('}', veilAt));
  assert.ok(veil.includes('position: fixed'), 'cubre la ventana');
  assert.ok(veil.includes('inset: 0'), 'sin bordes');
  const zIndex = Number((veil.match(/z-index:\s*(\d+)/) || [])[1]);
  assert.ok(Number.isFinite(zIndex) && zIndex >= 100, `z-index ${zIndex} por encima del header (50)`);
});

test('el estado mudado a la escena es línea sin caja en cualquier nivel', () => {
  const at = css.indexOf('.wb-scene.is-immersive .level-scene .wb-status');
  assert.ok(at > 0, 'hay regla genérica para el estado dentro de la escena');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.ok(rule.includes('background: none'), 'sin fondo de franja');
  assert.ok(rule.includes('border: 0'), 'sin borde de caja');
  assert.ok(rule.includes('border-radius: 0'), 'sin radio de caja');
  assert.ok(rule.includes('font-size: 14px'), 'línea de 14 px');
  assert.ok(rule.includes('rgba(242, 237, 227, 0.92)'), 'tinta clara del taller');
  assert.ok(rule.includes('border-bottom'), 'una línea grabada, no una barra');
});

test('el estado muestra el símbolo del alfabeto, no el carrete', () => {
  assert.ok(!mainSource.includes('Carrete'), 'sin "Carrete" en la línea de estado');
  assert.ok(mainSource.includes('function symbolText'), 'helper del símbolo');
  assert.ok(mainSource.includes('entry.symbol'), 'el símbolo sale de state.level.keys');
  assert.ok(mainSource.includes('entry.label'), 'el label acompaña cuando aporta');
  assert.ok(mainSource.includes('Símbolo: ${symbol}'), 'formato Símbolo: X');
  assert.ok(mainSource.includes('active.textContent = symbolText()'), 'N1 monta la línea con el símbolo');
  assert.ok(mainSource.includes('activeKey.textContent = symbolText()'), 'renderTools conserva el símbolo');
  assert.ok(mainSource.includes("'Herramienta: tijera'") && mainSource.includes("'Herramienta: resorte'"), 'herramientas intactas');
});
