import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLevelScene } from '../src/ui/levels/level2Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level2Scene.js'), 'utf8');
const css = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level2.css'), 'utf8');

// --- DOM falso mínimo (createElement + createElementNS) ---
function element(tag) {
  const node = {
    tag,
    children: [],
    textContent: '',
    className: '',
    attributes: {},
    parentNode: null,
    removed: false,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    append(...nodes) {
      for (const child of nodes) {
        child.parentNode = this;
        this.children.push(child);
      }
    },
    replaceChildren(...nodes) {
      for (const child of this.children) {
        child.parentNode = null;
      }
      this.children = [];
      this.append(...nodes);
    },
    remove() {
      this.removed = true;
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
        this.parentNode = null;
      }
    },
  };
  return node;
}

globalThis.document = {
  createElement: (tag) => element(tag),
  createElementNS: (_namespace, tag) => element(tag),
};

function classes(node) {
  const fromProp = (node.className || '').split(' ').filter(Boolean);
  const fromAttr = (node.attributes.class || '').split(' ').filter(Boolean);
  return [...new Set([...fromProp, ...fromAttr])];
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

function findOne(root, predicate, label) {
  const found = findAll(root, predicate);
  assert.equal(found.length, 1, `${label}: se esperaba un nodo, hay ${found.length}`);
  return found[0];
}

function byAttr(root, name, value) {
  return findAll(root, (node) => node.attributes[name] === value);
}

function setup(options = {}) {
  return createLevelScene({ phase: 'repair', ...options });
}

test('raíz de la escena con clase y data-level 2', () => {
  const scene = setup();
  assert.equal(scene.element.tag, 'section');
  assert.ok(classes(scene.element).includes('level-scene'));
  assert.equal(scene.element.getAttribute('data-level'), '2');
  assert.match(scene.element.getAttribute('aria-label') ?? '', /ascensor/i);
});

test('editorSlot reservado para el tablero real, vacío', () => {
  const scene = setup();
  assert.strictEqual(byAttr(scene.element, 'data-slot', 'editor').length, 1);
  const slot = findOne(scene.element, (n) => n.attributes['data-slot'] === 'editor', 'editorSlot');
  assert.strictEqual(scene.editorSlot, slot);
  assert.equal(slot.children.length, 0, 'el editor lo monta el parent');
  assert.match(slot.getAttribute('aria-label') ?? '', /tablero de cables/i);
});

test('statusSlot con aria-live para la marcha de la sala', () => {
  const scene = setup();
  const slot = findOne(scene.element, (n) => n.attributes['data-slot'] === 'status', 'statusSlot');
  assert.strictEqual(scene.statusSlot, slot);
  assert.equal(slot.getAttribute('aria-live'), 'polite');
});

test('la fase se lee en la placa y en la marcha', () => {
  const repair = setup({ phase: 'repair' });
  const build = setup({ phase: 'build' });
  const repairTexts = findAll(repair.element, () => true).map((n) => n.textContent);
  const buildTexts = findAll(build.element, () => true).map((n) => n.textContent);
  assert.ok(repairTexts.some((text) => text.includes('Reparación')));
  assert.ok(!repairTexts.some((text) => text.includes('Construcción')));
  assert.ok(buildTexts.some((text) => text.includes('Construcción')));
});

test('el sello de la placa marca la fase', () => {
  const scene = setup({ phase: 'build' });
  const seal = findOne(scene.element, (n) => classes(n).includes('l2-plate-seal'), 'sello');
  assert.match(seal.textContent, /construcción/i);
  assert.match(seal.getAttribute('aria-label') ?? '', /construcción/i);
});

test('el encabezado usa los datos del nivel', () => {
  const scene = setup({ level: { contract: '02', client: 'Hotel Mirador' } });
  const kicker = findOne(scene.element, (n) => classes(n).includes('l2-kicker'), 'kicker');
  assert.match(kicker.textContent, /Contrato 02/);
  assert.match(kicker.textContent, /Hotel Mirador/);
  const fallback = setup({ level: {} });
  const fallbackKicker = findOne(fallback.element, (n) => classes(n).includes('l2-kicker'), 'kicker');
  assert.match(fallbackKicker.textContent, /Hotel Mirador/);
});

test('mesa de nogal y luz cálida como decorado', () => {
  const scene = setup();
  const bench = findOne(scene.element, (n) => classes(n).includes('l2-bench'), 'mesa');
  const light = findOne(scene.element, (n) => classes(n).includes('l2-light'), 'luz');
  assert.equal(bench.getAttribute('aria-hidden'), 'true');
  assert.equal(light.getAttribute('aria-hidden'), 'true');
  assert.equal(bench.getAttribute('data-slot'), null, 'la mesa no es un slot');
});

test('la escena no crea editor, cables, llaves ni juicio', () => {
  assert.ok(!source.includes('graphEditor'), 'sin importar el editor de grafos');
  assert.ok(!source.includes('drumEditor'), 'sin importar el editor de tambor');
  assert.ok(!source.includes('handleProbe'), 'sin lógica de probar');
  assert.ok(!source.includes('handleAssault'), 'sin lógica de ensayo');
  assert.ok(!source.includes('toMachine'), 'sin construir máquinas');
  const scene = setup();
  const tags = new Set(findAll(scene.element, () => true).map((node) => node.tag));
  assert.ok(!tags.has('canvas'), 'sin canvas propio');
  for (const banned of ['wire', 'edge', 'state', 'drum', 'tape', 'key', 'palette']) {
    assert.equal(
      findAll(scene.element, (node) => classes(node).includes(banned)).length,
      0,
      `sin nodos .${banned}`,
    );
  }
});

test('slots finales con imágenes locales y con aria', () => {
  assert.ok(!source.includes('https://'), 'sin URLs externas');
  for (const src of [
    'assets/levels/02/floor-indicator.svg',
    'assets/levels/02/pinion.webp',
    'assets/shared/props/relay.webp',
  ]) {
    assert.ok(source.includes(src), `ruta ${src} en el JS`);
  }
  assert.ok(!source.includes('createElementNS'), 'sin SVG inline');
  const scene = setup();
  const gauge = findOne(scene.element, (n) => classes(n).includes('l2-gauge'), 'indicador');
  assert.match(gauge.getAttribute('aria-label') ?? '', /pisos/i);
  const gaugeImg = findOne(
    scene.element,
    (n) => classes(n).includes('l2-gauge-img'),
    'imagen del indicador',
  );
  assert.equal(gaugeImg.tag, 'img');
  assert.equal(gaugeImg.getAttribute('src'), 'assets/levels/02/floor-indicator.svg');
  assert.equal(gaugeImg.getAttribute('alt'), '');
  const gaugeCaption = findOne(
    scene.element,
    (n) => classes(n).includes('l2-gauge-caption'),
    'leyenda',
  );
  assert.equal(gaugeCaption.tag, 'figcaption');
  assert.match(gaugeCaption.textContent, /pisos/i);
  const props = findOne(scene.element, (n) => classes(n).includes('l2-props'), 'props');
  assert.equal(props.attributes['aria-hidden'], 'true');
  const pinionImg = findOne(
    scene.element,
    (n) => classes(n).includes('l2-pinion-img'),
    'piñón',
  );
  assert.equal(pinionImg.tag, 'img');
  assert.equal(pinionImg.getAttribute('src'), 'assets/levels/02/pinion.webp');
  assert.equal(pinionImg.getAttribute('alt'), '');
  assert.equal(pinionImg.getAttribute('aria-hidden'), 'true');
  const relays = findAll(scene.element, (n) => classes(n).includes('l2-relay'));
  assert.ok(relays.length >= 1, 'relés presentes');
  for (const relay of relays) {
    const img = findOne(relay, (n) => classes(n).includes('l2-relay-img'), 'imagen del relé');
    assert.equal(img.tag, 'img');
    assert.equal(img.getAttribute('src'), 'assets/shared/props/relay.webp');
  }
  const captions = findAll(scene.element, () => true).map((n) => n.textContent);
  assert.ok(!captions.some((text) => /a producir/i.test(text)), 'nada pendiente por producir');
});

test('cada slot final declara su manifiesto con data-src', () => {
  const scene = setup();
  const finals = byAttr(scene.element, 'data-status', 'final');
  const byAsset = new Map(finals.map((node) => [node.getAttribute('data-asset'), node]));
  for (const [asset, src] of [
    ['levels.02.background', 'assets/levels/02/background.webp'],
    ['levels.02.floorIndicator', 'assets/levels/02/floor-indicator.svg'],
    ['levels.02.pinion', 'assets/levels/02/pinion.webp'],
    ['shared.prop.relay', 'assets/shared/props/relay.webp'],
  ]) {
    assert.ok(byAsset.has(asset), `slot ${asset} declarado`);
    assert.equal(byAsset.get(asset).getAttribute('data-src'), src);
  }
  const relayFinals = finals.filter(
    (node) => node.getAttribute('data-asset') === 'shared.prop.relay',
  );
  assert.ok(relayFinals.length >= 1, 'relés en final');
  const pending = byAttr(scene.element, 'data-status', 'a producir');
  assert.equal(pending.length, 0, 'sin slots pendientes en el N2');
});

test('los assets finales existen en disco', () => {
  for (const file of [
    'assets/levels/02/background.webp',
    'assets/levels/02/floor-indicator.svg',
    'assets/levels/02/pinion.webp',
    'assets/shared/props/relay.webp',
  ]) {
    assert.ok(existsSync(join(here, '..', file)), `${file} existe en disco`);
  }
  assert.ok(
    css.includes('../../../assets/levels/02/background.webp'),
    'el CSS apunta al fondo final',
  );
  assert.match(css, /background-size:\s*cover/, 'el fondo cubre la sala');
  assert.match(css, /background-position:\s*center/, 'el fondo va centrado');
});

test('defectos de navegador: fondo visible e indicador y piñón legibles', () => {
  assert.ok(!css.includes('mask-image'), 'la foto no se recorta con máscara');
  assert.ok(
    css.includes('rgba(10, 13, 17, 0.35)'),
    'velo tenue para que el lobby se reconozca',
  );
  assert.ok(!css.includes('rgba(10, 13, 17, 0.62)'), 'sin el velo oscuro anterior');
  assert.ok(!css.includes('padding: 6px 8px 4px'), 'el indicador no va recortado');
  assert.ok(
    !css.includes('border-radius: 56px 56px 8px 8px'),
    'sin arco que recorte el indicador',
  );
  assert.match(css, /\.l2-gauge-img[\s\S]*?width:\s*150px/, 'indicador a ~150 px en desktop');
  assert.match(
    css,
    /@media \(max-width: 700px\)[\s\S]*?\.l2-pinion[\s\S]*?width:\s*56px/,
    'piñón a 56 px en celular',
  );
});

test('los datos viajan por textContent, sin innerHTML', () => {
  assert.ok(!source.includes('.innerHTML'), 'sin asignar innerHTML');
  assert.ok(!source.includes('insertAdjacentHTML'), 'sin insertAdjacentHTML');
  const evil = '<img src=x onerror=alert(1)>';
  const scene = setup();
  scene.editorSlot.textContent = evil;
  assert.equal(scene.editorSlot.children.length, 0);
  assert.equal(scene.editorSlot.textContent, evil);
});

test('vocabulario de taller, sin términos académicos', () => {
  const haystack = `${source}\n${css}`.toLowerCase();
  for (const banned of ['autómata', 'automata', 'transición', 'transicion', 'lenguaje', 'estado']) {
    assert.ok(!haystack.includes(banned), `sin «${banned}» en la escena`);
  }
  assert.ok(!/\bafd\b/.test(haystack), 'sin «AFD» en la escena');
});

test('el CSS vive bajo .level-scene[data-level="2"], con foco y movimiento reducido', () => {
  assert.ok(css.includes('.level-scene[data-level="2"]'), 'alcance del nivel 2');
  assert.ok(css.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
  assert.ok(css.includes(':focus-visible'), 'foco visible');
  assert.ok(css.includes('44px'), 'blancos táctiles de 44 px');
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [];
  const chunks = clean.split('}');
  for (const chunk of chunks) {
    const brace = chunk.indexOf('{');
    if (brace === -1) {
      continue;
    }
    const head = chunk.slice(0, brace).trim();
    if (head.startsWith('@media')) {
      continue;
    }
    for (const part of head.split(',')) {
      selectors.push(part.trim());
    }
  }
  assert.ok(selectors.length > 0, 'hay reglas propias');
  for (const selector of selectors) {
    assert.ok(selector.includes('.level-scene'), `regla con alcance: ${selector}`);
  }
});

test('el CSS usa las tipografías del mockup', () => {
  for (const font of ['Cinzel', 'Oswald', 'Special Elite']) {
    assert.ok(css.includes(font), `fuente ${font} declarada`);
  }
});

test('la raíz vive dentro del stage sin desplazar la página', () => {
  assert.match(
    css,
    /\.level-scene\[data-level="2"\]\s*\{[^}]*display:\s*grid[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)/,
    'raíz en grid de una fila flexible',
  );
  assert.match(css, /\.level-scene\[data-level="2"\]\s*\{[^}]*height:\s*100%/, 'raíz con height 100%');
  assert.match(
    css,
    /\.level-scene\[data-level="2"\]\s*\{[^}]*max-height:\s*100%/,
    'raíz con max-height 100%',
  );
  assert.match(css, /\.level-scene\[data-level="2"\]\s*\{[^}]*min-height:\s*0/, 'raíz con min-height 0');
  assert.match(
    css,
    /\.level-scene\[data-level="2"\]\s*\{[^}]*overflow:\s*hidden/,
    'raíz con overflow hidden',
  );
  assert.match(
    css,
    /\.level-scene\[data-level="2"\]\s*\{[^}]*box-sizing:\s*border-box/,
    'raíz con border-box',
  );
});

test('la placa crece con el stage y el desplazamiento vive en el slot', () => {
  assert.match(
    css,
    /\.l2-room[\s\S]*?display:\s*flex[\s\S]*?flex-direction:\s*column/,
    'sala en columna flexible',
  );
  assert.match(css, /\.l2-room[\s\S]*?min-height:\s*0/, 'sala con min-height 0');
  assert.match(css, /\.l2-plate[\s\S]*?flex:\s*1 1 auto/, 'la placa recibe el alto libre');
  assert.match(css, /\.l2-plate[\s\S]*?min-height:\s*0/, 'la placa no pelea con el flex');
  assert.match(css, /\.l2-editor-slot[\s\S]*?flex:\s*1 1 auto/, 'el slot crece con la placa');
  assert.match(css, /\.l2-editor-slot[\s\S]*?overflow:\s*auto/, 'el desborde vive dentro del slot');
  assert.ok(!css.includes('min-height: 280px'), 'sin mínimo fijo de escritorio que pelee');
  assert.ok(!css.includes('min-height: 320px'), 'sin mínimo fijo grande que pelee');
});

test('el tablero real escala por alto, centrado y sin estirarse', () => {
  assert.match(css, /\.l2-editor-slot #canvas[\s\S]*?height:\s*100%/, '#canvas a lo alto del hueco');
  assert.match(css, /\.l2-editor-slot #canvas[\s\S]*?width:\s*auto/, '#canvas sin estirarse a lo ancho');
  assert.match(
    css,
    /\.l2-editor-slot #canvas[\s\S]*?max-width:\s*100%/,
    '#canvas sin pasarse del hueco',
  );
  assert.match(
    css,
    /\.l2-editor-slot #canvas[\s\S]*?margin-inline:\s*auto/,
    '#canvas centrado',
  );
  assert.match(
    css,
    /\.l2-editor-slot #canvas[\s\S]*?max-height:\s*100%/,
    '#canvas sin pasarse del hueco',
  );
  assert.match(
    css,
    /\.l2-editor-slot #canvas[\s\S]*?background:\s*transparent/,
    '#canvas con fondo transparente',
  );
  assert.match(css, /\.l2-editor-slot #canvas[\s\S]*?border:\s*0/, '#canvas sin borde');
  assert.ok(css.includes('.l2-editor-slot:empty::after'), 'guía visible cuando está vacío');
});

test('solo el tablero vive en el flujo de la placa', () => {
  const scene = setup();
  const plate = findOne(scene.element, (n) => classes(n).includes('l2-plate'), 'placa');
  const flow = plate.children.map((child) => (child.attributes.class ?? '').split(' ')[0]);
  assert.ok(!flow.includes('l2-props'), 'los relés salen del flujo de la placa');
  const props = findOne(scene.element, (n) => classes(n).includes('l2-props'), 'props');
  assert.strictEqual(
    props.parentNode,
    scene.statusSlot,
    'los relés acompañan la fila de marcha',
  );
  const pinion = findOne(scene.element, (n) => classes(n).includes('l2-pinion'), 'piñón');
  assert.strictEqual(pinion.parentNode, plate, 'el piñón decora la placa');
  assert.match(css, /\.l2-pinion[\s\S]*?position:\s*absolute/, 'piñón fuera del flujo');
  assert.ok(css.includes('@media (max-height:'), 'la nota se esconde en ventanas bajas');
});

test('la placa abraza el tablero en vez de estirar un marco vacío', () => {
  assert.match(css, /\.l2-plate[\s\S]*?width:\s*min\(100%, 640px\)/, 'placa acotada al contenido');
  assert.match(css, /\.l2-plate[\s\S]*?margin-inline:\s*auto/, 'placa centrada en la sala');
});

test('el encabezado compacto deja la placa con aire en desktop', () => {
  assert.match(css, /\.l2-gauge-img[\s\S]*?width:\s*150px/, 'indicador legible en desktop');
  assert.match(css, /\.l2-title[\s\S]*?font-size:\s*20px/, 'título compacto en desktop');
  assert.match(
    css,
    /@media \(min-width: 701px\)[\s\S]*?\.l2-title[\s\S]*?white-space:\s*nowrap/,
    'título en una línea en desktop',
  );
  assert.match(css, /\.l2-pinion[\s\S]*?width:\s*72px/, 'piñón legible en desktop');
});

test('en celular la escena no supera al stage ni genera scroll horizontal', () => {
  assert.ok(css.includes('@media (max-width: 700px)'), 'quiebre de celular');
  assert.ok(
    !/@media \(max-width: 700px\)[\s\S]*?#canvas[\s\S]*?height:\s*auto/.test(css),
    'el tablero no vuelve a alto automático en celular',
  );
  assert.match(
    css,
    /@media \(max-width: 700px\)[\s\S]*?\.l2-room[\s\S]*?padding:\s*8px/,
    'sala con padding recortado en celular',
  );
  assert.match(
    css,
    /@media \(max-width: 700px\)[\s\S]*?\.l2-editor-slot[\s\S]*?overflow-x:\s*hidden/,
    'slot sin desborde horizontal en celular',
  );
});

test('dispose suelta la escena y vacía los slots', () => {
  const scene = setup();
  const parent = element('div');
  parent.append(scene.element);
  scene.editorSlot.textContent = 'tablero del parent';
  scene.dispose();
  assert.ok(scene.element.removed, 'la escena se suelta del taller');
  assert.equal(parent.children.length, 0);
  assert.equal(scene.editorSlot.children.length, 0);
  assert.equal(scene.statusSlot.children.length, 0);
});
