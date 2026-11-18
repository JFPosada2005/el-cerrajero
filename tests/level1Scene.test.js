import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLevelScene } from '../src/ui/levels/level1Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const source = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level1Scene.js'), 'utf8');
const css = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level1.css'), 'utf8');

// --- DOM falso mínimo (solo createElement + textContent + atributos) ---
function element(tag) {
  const listeners = new Map();
  const node = {
    tag,
    children: [],
    textContent: '',
    className: '',
    attributes: {},
    removed: false,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    append(...nodes) {
      this.children.push(...nodes);
      for (const child of nodes) {
        child.parent = this;
      }
    },
    remove() {
      this.removed = true;
      if (this.parent) {
        this.parent.children = this.parent.children.filter((child) => child !== this);
      }
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
    listenerTypes() {
      return [...listeners.keys()];
    },
  };
  return node;
}

globalThis.document = {
  createElement: (tag) => element(tag),
};

const LEVEL = { contract: '01', title: 'La caja de seguridad', client: 'Banco del Llano' };

function setup(overrides = {}) {
  return createLevelScene({ level: LEVEL, puzzle: {}, phase: 'repair', ...overrides });
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

function findOne(root, predicate, label = 'un nodo') {
  const found = findAll(root, predicate);
  assert.equal(found.length, 1, `se esperaba ${label}, hay ${found.length}`);
  return found[0];
}

function byClass(root, className) {
  return findAll(root, (node) => classes(node).includes(className));
}

function texts(root) {
  const out = [];
  for (const node of walk(root)) {
    if (node.textContent !== '') {
      out.push(node.textContent);
    }
    for (const name of ['aria-label', 'alt']) {
      const value = node.getAttribute(name);
      if (value !== null && value !== '') {
        out.push(value);
      }
    }
  }
  return out.join(' · ');
}

test('raíz con alcance de nivel y etiqueta de taller', () => {
  const view = setup();
  assert.equal(view.element.tag, 'section');
  assert.ok(classes(view.element).includes('level-scene'));
  assert.ok(classes(view.element).includes('level-1'));
  assert.equal(view.element.getAttribute('data-level'), '1');
  assert.match(view.element.getAttribute('aria-label'), /Banco del Llano/);
  assert.match(view.element.getAttribute('aria-label'), /mesa de trabajo/);
});

test('editorSlot reserva el área de la placa y llega vacío', () => {
  const view = setup();
  const slot = findOne(view.element, (n) => n.getAttribute('data-slot') === 'editor', 'el slot del editor');
  assert.strictEqual(view.editorSlot, slot);
  assert.equal(slot.getAttribute('role'), 'group');
  assert.match(slot.getAttribute('aria-label'), /cerradura/);
  assert.equal(slot.children.length, 0, 'el parent monta el #canvas real');
  const plate = findOne(view.element, (n) => classes(n).includes('level-plate'), 'la placa');
  assert.ok(findAll(plate, (n) => n === slot).length === 1, 'el slot vive dentro de la placa');
  assert.equal(slot.getAttribute('tabindex'), null, 'el slot no roba el foco: el foco lo tienen las celdas del editor real');
});

test('etiqueta de la placa con cliente y contrato', () => {
  const view = setup();
  const label = findOne(view.element, (n) => classes(n).includes('level-plate-label'), 'la etiqueta');
  assert.equal(label.textContent, 'Banco del Llano · Caja 01');
  const other = createLevelScene({ level: { contract: '02', client: 'Hotel Mirador' }, phase: 'repair' });
  assert.equal(
    findOne(other.element, (n) => classes(n).includes('level-plate-label'), 'la etiqueta').textContent,
    'Hotel Mirador · Caja 02',
  );
});

test('sello de fase con vocabulario de taller', () => {
  const repair = setup({ phase: 'repair' });
  assert.equal(findOne(repair.element, (n) => classes(n).includes('level-phase-seal'), 'el sello').textContent, 'En reparación');
  const build = setup({ phase: 'build' });
  assert.equal(findOne(build.element, (n) => classes(n).includes('level-phase-seal'), 'el sello').textContent, 'En construcción');
  const fallback = createLevelScene({ level: LEVEL });
  assert.equal(findOne(fallback.element, (n) => classes(n).includes('level-phase-seal'), 'el sello').textContent, 'En reparación');
});

test('fondo, ladrón, campana y papeles con los assets finales; mesa y placa en el mockup', () => {
  const view = setup();
  const images = findAll(view.element, (n) => n.tag === 'img');
  const sources = images.map((n) => n.getAttribute('src'));
  assert.ok(sources.length >= 10, `la escena trae sus props, hay ${sources.length} imágenes`);
  const finalSources = [
    'assets/levels/01/background.webp',
    'assets/levels/01/thief.webp',
    'assets/levels/01/props/contract.webp',
    'assets/levels/01/props/hint.webp',
    'assets/levels/01/props/log.webp',
    'assets/levels/01/props/bell.webp',
    'assets/levels/01/props/scissors.webp',
  ];
  for (const src of finalSources) {
    assert.ok(sources.includes(src), `falta el asset final ${src}`);
    assert.ok(existsSync(join(ROOT, src)), `el asset final existe en disco: ${src}`);
  }
  for (const sprite of ['mesa-madera.svg', 'placa-textura.jpg', 'placa-marco.svg']) {
    assert.ok(
      sources.some((src) => src === `mockups/nivel-1-taller/assets/sprites/${sprite}`),
      `mesa y placa siguen en el mockup: ${sprite}`,
    );
  }
  const marked = findAll(view.element, (n) => n.getAttribute('data-status') === 'final');
  assert.equal(marked.length, finalSources.length, 'cada asset final declara su estado');
  for (const node of marked) {
    const slot = String(node.getAttribute('data-asset'));
    assert.ok(/^n1\./.test(slot) || slot === 'levels.01.scissors', `el slot viene del manifiesto: ${slot}`);
    assert.ok(existsSync(join(ROOT, String(node.getAttribute('data-src')))), 'data-src apunta a un archivo real');
  }
  const thief = findOne(view.element, (n) => classes(n).includes('level-thief'), 'el ladrón');
  assert.equal(thief.tag, 'img', 'el ladrón es decorado, no botón');
  assert.equal(thief.getAttribute('alt'), '', 'decorado puro sin texto alternativo');
  assert.equal(thief.getAttribute('aria-hidden'), 'true', 'fuera del lector');
  assert.equal(thief.getAttribute('data-action'), null, 'el ladrón no emite acciones');
  assert.ok(!findAll(view.element, (n) => n.tag === 'button').some((node) => findAll(node, (inner) => inner === thief).length > 0), 'ningún botón envuelve al ladrón');
  const papers = findOne(view.element, (n) => classes(n).includes('level-papers'), 'los papeles');
  assert.equal(papers.tag, 'ul');
  assert.deepEqual(
    byClass(papers, 'level-paper-name').map((n) => n.textContent),
    ['Contrato', 'Pista', 'Bitácora'],
  );
  const bell = findOne(view.element, (n) => classes(n).includes('level-bell'), 'la campana');
  assert.equal(findOne(bell, (n) => classes(n).includes('level-bell-name'), 'el pie').textContent, 'Campana de alarma');
});

test('decorado con alt explícito y sin texto colgado', () => {
  const view = setup();
  for (const img of findAll(view.element, (n) => n.tag === 'img')) {
    assert.ok(img.getAttribute('alt') !== null, `toda imagen declara alt: ${img.getAttribute('src')}`);
  }
  for (const img of findAll(view.element, (n) => n.tag === 'img' && n.getAttribute('aria-hidden') === 'true')) {
    assert.equal(img.getAttribute('alt'), '', 'el decorado puro lleva alt vacío');
  }
});

test('la escena no crea editor, cables, llaves ni lógica', () => {
  for (const banned of ['graphEditor', 'drumEditor', 'createElementNS', 'handleProbe', 'handleAssault', 'onConnect', 'toMachine']) {
    assert.ok(!source.includes(banned), `sin ${banned}: eso lo monta el parent`);
  }
  assert.ok(!source.includes('.innerHTML'), 'datos por textContent, sin innerHTML');
  const view = setup();
  const buttons = findAll(view.element, (n) => n.tag === 'button');
  assert.equal(buttons.length, 6, `los seis props diegéticos son botones, hay ${buttons.length}`);
  assert.deepEqual(
    buttons.map((node) => node.getAttribute('data-action')).sort(),
    ['assault', 'contract', 'cut', 'hint', 'log', 'probe'],
    'cada botón emite su intención con data-action',
  );
  for (const button of buttons) {
    assert.equal(button.type, 'button', 'botones reales');
    assert.ok(button.getAttribute('aria-label'), 'todo prop accionable tiene nombre accesible');
  }
  assert.equal(findAll(view.element, (n) => n.tag === 'svg' || n.tag === 'canvas').length, 0, 'sin dibujo propio');
  assert.equal(findAll(view.element, (n) => n.getAttribute('tabindex') !== null).length, 0, 'sin focos propios');
  assert.equal(findAll(view.element, (n) => n.listenerTypes().length > 0).length, 0, 'sin listeners: la escena no decide nada');
  assert.equal(view.statusSlot, null, 'el nivel 1 no usa pila: el parent usa el slot de estado del shell');
});

test('props diegéticos: contrato, pista, bitácora, campana, ensayo y tijera', () => {
  const view = setup();
  const byAction = {};
  for (const button of findAll(view.element, (n) => n.tag === 'button')) {
    byAction[button.getAttribute('data-action')] = button;
  }
  assert.equal(byAction.contract.getAttribute('aria-label'), 'Abrir contrato');
  assert.equal(byAction.hint.getAttribute('aria-label'), 'Pedir una pista');
  assert.equal(byAction.log.getAttribute('aria-label'), 'Abrir la bitácora');
  assert.equal(byAction.probe.getAttribute('aria-label'), 'Probar la llave en la cerradura');
  assert.equal(byAction.assault.getAttribute('aria-label'), 'Ejecutar el ensayo');
  assert.equal(byAction.cut.getAttribute('aria-label'), 'Cortar un cable');
  assert.ok(classes(byAction.contract).includes('level-paper'), 'el contrato es el papel de la mesa');
  assert.ok(classes(byAction.hint).includes('level-paper'), 'la pista es un papel de la mesa');
  assert.ok(classes(byAction.log).includes('level-paper'), 'la bitácora es un papel de la mesa');
  assert.ok(classes(byAction.probe).includes('level-bell'), 'la campana prueba');
  assert.ok(classes(byAction.assault).includes('level-trial'), 'el ensayo es su placa de latón');
  assert.ok(classes(byAction.cut).includes('level-scissors'), 'la tijera corta');
  assert.equal(
    findOne(byAction.assault, (n) => classes(n).includes('level-trial-name'), 'el rótulo').textContent,
    'Ensayo',
    'rótulo visible de taller',
  );
  for (const action of ['contract', 'hint', 'log', 'probe']) {
    const images = findAll(byAction[action], (n) => n.tag === 'img');
    assert.equal(images.length, 1, `el prop ${action} conserva su imagen`);
  }
  assert.deepEqual(
    findAll(byAction.contract, (n) => classes(n).includes('level-paper-name')).map((n) => n.textContent),
    ['Contrato'],
    'el papel conserva su rótulo visible',
  );
  const thiefImages = findAll(view.element, (n) => n.tag === 'img' && classes(n).includes('level-thief'));
  assert.equal(thiefImages.length, 1, 'el ladrón sigue en la escena como decorado');
  assert.ok(!classes(thiefImages[0].parent).includes('level-trial'), 'el ensayo no envuelve al ladrón');
  const scissorsImage = findAll(byAction.cut, (n) => n.tag === 'img')[0];
  assert.equal(scissorsImage.getAttribute('src'), 'assets/levels/01/props/scissors.webp');
  assert.equal(scissorsImage.getAttribute('data-asset'), 'levels.01.scissors');
  assert.equal(scissorsImage.getAttribute('data-status'), 'final');
  assert.ok(existsSync(join(ROOT, 'assets/levels/01/props/scissors.webp')), 'la tijera final existe en disco');
  assert.deepEqual(view.actions, ['contract', 'hint', 'log', 'probe', 'assault', 'cut']);
});

test('vocabulario de taller, sin jerga académica', () => {
  const view = setup();
  const copy = `${texts(view.element)} ${texts(setup({ phase: 'build' }).element)}`.toLowerCase();
  for (const word of ['afd', 'afnd', 'autómata', 'automata', 'estado', 'transición', 'transicion', 'lenguaje']) {
    assert.ok(!new RegExp(`\\b${word}\\b`).test(copy), `sin "${word}" en la escena`);
  }
  assert.ok(!/\bap\b/.test(copy), 'sin "ap" en la escena');
  assert.ok(!/\bmt\b/.test(copy), 'sin "mt" en la escena');
});

test('dispose saca la escena sin tocar el editor', () => {
  const view = setup();
  const parent = element('div');
  parent.append(view.element);
  const slot = view.editorSlot;
  view.dispose();
  assert.equal(view.element.removed, true);
  assert.equal(parent.children.length, 0);
  assert.equal(slot.children.length, 0, 'el dispose no vacía el slot: el parent desmonta el editor');
});

test('css diegético: props como botones, tijera de 64px y foco teal', () => {
  for (const selector of ['.level-paper', '.level-bell', '.level-trial', '.level-scissors']) {
    assert.ok(css.includes(selector), `el prop ${selector} tiene reglas propias`);
  }
  assert.ok(css.includes('width: 64px'), 'la tijera mide ~64 px junto a la libreta');
  assert.ok(css.includes('.level-scissors.is-active'), 'el modo corte se ve en la tijera');
  assert.ok(css.includes('background: transparent'), 'los props no tienen caja de botón');
  assert.ok(css.includes('min-height: 44px'), 'área táctil ≥44 px');
  assert.ok(css.includes('#38c6b8'), 'foco visible con contorno teal');
  assert.ok(!css.includes('.level-thief-button'), 'el ladrón ya no es botón');
  const thiefStart = css.indexOf('.level-scene[data-level="1"] .level-thief {');
  assert.ok(thiefStart > 0, 'el ladrón decorativo tiene regla propia');
  const thiefRule = css.slice(thiefStart, css.indexOf('}', thiefStart));
  assert.ok(thiefRule.includes('pointer-events: none'), 'el decorado no tapa clics');
  const paperStart = css.indexOf('.level-scene[data-level="1"] .level-paper {');
  const paperRule = css.slice(paperStart, css.indexOf('}', paperStart));
  assert.ok(!paperRule.includes('pointer-events: none'), 'el papel recibe eventos');
});

test('css con alcance, canvas integrado, foco y movimiento reducido', () => {
  assert.ok(css.includes('.level-scene[data-level="1"]'), 'alcance por nivel');
  assert.ok(!css.includes('.level-scene[data-level="2"]'), 'este archivo es solo del nivel 1');
  const canvasRule = css.slice(css.indexOf('.level-editor #canvas'));
  assert.ok(canvasRule.includes('background: transparent'), 'el #canvas real va sin fondo de panel');
  assert.ok(canvasRule.includes('border: 0'), 'el #canvas real va sin borde de panel');
  assert.ok(css.includes(':focus-visible'), 'foco visible para lo que monte el parent');
  assert.ok(css.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
  const sizes = [...css.matchAll(/font-size\s*:\s*([^;]+);/g)].map((match) => match[1].trim());
  assert.ok(sizes.length > 0, 'la escena fija sus tamaños de letra');
  const tooSmall = sizes.filter((value) => {
    const px = Number.parseFloat(value);
    return value.endsWith('px') && Number.isFinite(px) && px < 12;
  });
  assert.deepEqual(tooSmall, [], 'ningún texto baja de 12 px');
});

test('la escena ocupa toda la ventana, sin recuadro', () => {
  const rootAt = css.indexOf('.level-scene[data-level="1"] {');
  assert.ok(rootAt === 0 || rootAt > 0, 'la raíz tiene regla propia');
  const root = css.slice(rootAt, css.indexOf('}', rootAt));
  assert.ok(root.includes('position: absolute'), 'la escena sale del flujo');
  assert.ok(root.includes('inset: 0'), 'cubre todo el stage');
  assert.ok(root.includes('height: 100%'), 'alto completo');
  assert.ok(!root.includes('border-radius: 14px'), 'sin recuadro');
  assert.ok(!root.includes('aspect-ratio: 16 / 9'), 'sin formato fijo');
});

test('la placa es la máquina al centro, con banda de mesa libre', () => {
  const plateAt = css.indexOf('.level-scene[data-level="1"] .level-plate {');
  assert.ok(plateAt > 0, 'la placa tiene regla propia');
  const plate = css.slice(plateAt, css.indexOf('}', plateAt));
  assert.ok(plate.includes('left: 50%'), 'centrada');
  assert.ok(plate.includes('width: 62%'), 'máquina al centro, no fondo');
  assert.ok(!plate.includes('width: 78%'), 'ya no llena la pantalla');
});

test('banda de mesa sin solape: papeles, rack, campana, ensayo y línea', () => {
  const papersAt = css.indexOf('.level-scene[data-level="1"] .level-papers {');
  const papers = css.slice(papersAt, css.indexOf('}', papersAt));
  assert.ok(papers.includes('bottom: 48px'), 'papeles sobre la banda');
  const keysAt = css.indexOf('.level-scene[data-level="1"] .level-keys {');
  assert.ok(keysAt > 0, 'el rack tiene ranura propia');
  const keys = css.slice(keysAt, css.indexOf('}', keysAt));
  assert.ok(keys.includes('bottom: 48px'), 'rack en la misma banda');
  assert.ok(keys.includes('left: 39%'), 'rack al centro-derecha, sin tapar papeles');
  const bellAt = css.indexOf('.level-scene[data-level="1"] .level-bell {');
  const bell = css.slice(bellAt, css.indexOf('}', bellAt));
  assert.ok(bell.includes('right: 23%'), 'campana a la derecha, fuera de la placa');
  assert.ok(bell.includes('bottom: 48px'), 'campana en la banda');
  const trialAt = css.indexOf('.level-scene[data-level="1"] .level-trial {');
  assert.ok(trialAt > 0, 'el ensayo tiene placa propia');
  const trial = css.slice(trialAt, css.indexOf('}', trialAt));
  assert.ok(trial.includes('right: 13.5%'), 'ensayo a la derecha junto a la campana');
  assert.ok(trial.includes('min-width: 96px'), 'placa tocable');
  assert.ok(trial.includes('min-height: 56px'), 'placa tocable en alto');
  const hudAt = css.indexOf('.level-scene[data-level="1"] .level-hud {');
  assert.ok(hudAt > 0, 'la línea de estado tiene ranura propia');
  const hud = css.slice(hudAt, css.indexOf('}', hudAt));
  assert.ok(hud.includes('bottom: 6px'), 'último renglón de la mesa');
  assert.ok(hud.includes('translateX(-50%)'), 'línea centrada');
});

test('ambiente animado solo con movimiento permitido', () => {
  const motionAt = css.indexOf('prefers-reduced-motion: no-preference');
  assert.ok(motionAt > 0, 'las animaciones viven bajo no-preference');
  const motion = css.slice(motionAt);
  assert.ok(motion.includes('@keyframes level1-touch'), 'roce de papeles');
  assert.ok(motion.includes('.level-paper'), 'los papeles tienen roce');
  assert.ok(motion.includes('6s'), 'ritmo lento de ambiente');
  assert.ok(motion.includes('infinite'), 'en bucle');
  assert.ok(!motion.includes('sway'), 'la campana no tiene vaivén en loop');
  assert.ok(!motion.includes('breathe'), 'el ladrón decorativo está quieto');
  assert.ok(!motion.includes('scissors'), 'la tijera no se anima');
});

test('ranuras keys y hud expuestas para el parent', () => {
  const view = setup();
  assert.strictEqual(view.keysSlot.getAttribute('data-slot'), 'keys');
  assert.ok(classes(view.keysSlot).includes('level-keys'));
  assert.equal(view.keysSlot.children.length, 0, 'el parent monta palette y herramientas');
  assert.strictEqual(view.hudSlot.getAttribute('data-slot'), 'hud');
  assert.ok(classes(view.hudSlot).includes('level-hud'));
  assert.equal(view.hudSlot.children.length, 0, 'el parent muda la línea de estado');
});

test('keysSlot reserva el carrete completo sin recortes', () => {
  const at = css.indexOf('.level-scene[data-level="1"] .level-keys {');
  assert.ok(at > 0, 'la ranura de carretes tiene regla propia');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.ok(rule.includes('min-height: 104px'), 'alto de carrete + chapa del símbolo');
  assert.ok(!rule.includes('overflow: hidden'), 'sin recorte vertical');
  assert.ok(!rule.includes('overflow: clip'), 'sin recorte vertical');
});
