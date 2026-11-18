import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLevelScene } from '../src/ui/levels/level4Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const sceneSource = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level4Scene.js'), 'utf8');
const cssSource = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level4.css'), 'utf8');

// --- DOM falso mínimo (solo document.createElement + textContent) ---
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
    },
    replaceChildren(...nodes) {
      this.children = [...nodes];
    },
    remove() {
      this.removed = true;
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

const LEVEL = {
  id: 4,
  contract: '04',
  title: 'El teatro',
  client: 'Teatro Municipal',
  keys: [
    { symbol: 'A', label: '▲ Subir', tone: 'gold' },
    { symbol: 'B', label: '▼ Bajar', tone: 'teal' },
  ],
};

function setup(overrides = {}) {
  return createLevelScene({ level: LEVEL, puzzle: {}, phase: 'Reparación', ...overrides });
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

function findOne(root, predicate) {
  const found = findAll(root, predicate);
  assert.equal(found.length, 1, `se esperaba un nodo, hay ${found.length}`);
  return found[0];
}

function cssBlocks(selector) {
  const out = [];
  const needle = `${selector} {`;
  let from = 0;
  while (true) {
    const start = cssSource.indexOf(needle, from);
    if (start === -1) {
      return out;
    }
    const end = cssSource.indexOf('}', start);
    assert.ok(end !== -1, `bloque sin cerrar para ${selector}`);
    out.push(cssSource.slice(start, end));
    from = end + 1;
  }
}

function cssHas(block, prop) {
  return block.includes(prop);
}

test('raíz con data-level="4" y slots expuestos', () => {
  const scene = setup();
  assert.equal(scene.element.tag, 'section');
  assert.ok(classes(scene.element).includes('level-scene'));
  assert.equal(scene.element.getAttribute('data-level'), '4');
  assert.equal(scene.element.getAttribute('aria-label'), 'Tramoya del Teatro Municipal');
  assert.strictEqual(
    findOne(scene.element, (n) => n.attributes['data-slot'] === 'editor'),
    scene.editorSlot,
  );
  assert.strictEqual(
    findOne(scene.element, (n) => n.attributes['data-slot'] === 'status'),
    scene.statusSlot,
  );
});

test('editorSlot reserva la placa y statusSlot la pila', () => {
  const scene = setup();
  assert.equal(scene.editorSlot.getAttribute('aria-label'), 'Placa del montacargas: aquí se monta el mecanismo real');
  assert.equal(scene.statusSlot.getAttribute('aria-label'), 'Pila del montacargas');
  assert.equal(scene.statusSlot.getAttribute('aria-live'), 'polite');
});

test('la escena no crea editor, cables, llaves ni lógica', () => {
  for (const banned of ['graphEditor', 'drumEditor', 'handleProbe', 'handleAssault', 'onConnect', 'onCut', '.innerHTML', 'insertAdjacentHTML', 'createElementNS']) {
    assert.ok(!sceneSource.includes(banned), `la escena no debe mencionar ${banned}`);
  }
  const scene = setup();
  const tags = new Set(findAll(scene.element, () => true).map((node) => node.tag));
  assert.ok(!tags.has('svg'), 'sin nodos svg');
  assert.ok(!tags.has('canvas'), 'sin canvas');
  assert.equal(findAll(scene.element, (n) => n.tag === 'button').length, 0, 'sin botones: no hay controles reales');
  assert.equal(findAll(scene.element, (n) => n.listenerTypes().length > 0).length, 0, 'sin listeners: decorado puro');
});

test('slots finales con data-src y archivo en disco', () => {
  const scene = setup();
  const final = findAll(scene.element, (n) => n.attributes['data-status'] === 'final');
  assert.ok(final.length >= 3, 'fondo, selectores y palancas marcados como final');
  const assets = final.map((n) => n.attributes['data-asset']).join(' ');
  const srcs = final.map((n) => n.attributes['data-src']).join(' ');
  const expected = {
    'n4.background': ['assets/levels/04/background.webp'],
    'n4.selectors': ['assets/levels/04/selectors.svg'],
    'n4.levers': ['assets/levels/04/lever-up.svg', 'assets/levels/04/lever-down.svg'],
  };
  for (const [slot, files] of Object.entries(expected)) {
    assert.ok(assets.includes(slot), `slot final ${slot}`);
    for (const src of files) {
      assert.ok(srcs.includes(src), `data-src con ${src}`);
      assert.ok(existsSync(join(here, '..', src)), `${src} existe en disco`);
    }
  }
  assert.ok(
    !final.some((n) => n.attributes['data-placeholder'] === 'a-producir'),
    'lo final ya no lleva marca a-producir',
  );
  const spoken = findAll(
    scene.element,
    (n) => typeof n.textContent === 'string' && n.textContent !== '' && n.children.length === 0,
  )
    .map((n) => n.textContent)
    .join(' ');
  assert.ok(!spoken.includes('final'), 'el aviso vive en atributos, no en texto visible');
});

test('fichas y base de muestra siguen a producir', () => {
  const scene = setup();
  const pending = findAll(scene.element, (n) => n.attributes['data-status'] === 'a producir');
  assert.equal(pending.length, 4, 'solo las 3 fichas y la base de muestra siguen sin asset');
  const assets = pending.map((n) => n.attributes['data-asset']);
  assert.equal(assets.filter((a) => a === 'n4.chip').length, 3, 'la columna trae fichas de muestra');
  assert.ok(assets.includes('n4.stackBase'), 'la base de muestra sigue pendiente');
  for (const node of pending) {
    assert.equal(node.attributes['data-placeholder'], 'a-producir', 'cada pendiente avisa su estado');
  }
  const decor = findAll(scene.element, (n) => n.attributes['aria-hidden'] === 'true');
  assert.ok(decor.length > 0, 'el decorado visual queda fuera de lectores');
});

test('mesa de trabajo y luz cálida como decorado estructural', () => {
  const scene = setup();
  const bench = findOne(scene.element, (n) => classes(n).includes('l4-bench'));
  const light = findOne(scene.element, (n) => classes(n).includes('l4-light'));
  assert.equal(bench.getAttribute('aria-hidden'), 'true');
  assert.equal(light.getAttribute('aria-hidden'), 'true');
  assert.equal(bench.getAttribute('data-placeholder'), null, 'la mesa es CSS, no un asset pendiente');
});

test('palancas decorativas con las etiquetas de las llaves y svg finales', () => {
  const scene = setup();
  const levers = findOne(scene.element, (n) => classes(n).includes('l4-levers'));
  assert.equal(levers.attributes['data-asset'], 'n4.levers');
  assert.equal(levers.attributes['data-status'], 'final', 'las palancas ya usan asset final');
  assert.equal(levers.attributes['aria-hidden'], 'true', 'las palancas quedan fuera de lectores');
  assert.ok(
    String(levers.attributes['data-src']).includes('assets/levels/04/lever-up.svg'),
    'data-src con la palanca de subir',
  );
  assert.ok(
    String(levers.attributes['data-src']).includes('assets/levels/04/lever-down.svg'),
    'data-src con la palanca de bajar',
  );
  const tags = findAll(levers, (n) => classes(n).includes('l4-lever-tag'));
  assert.deepEqual(tags.map((n) => n.textContent), ['▲ Subir', '▼ Bajar']);
  const icons = findAll(levers, (n) => classes(n).includes('l4-lever-icon'));
  assert.equal(icons.length, 2, 'una palanca por llave');
  assert.deepEqual(
    icons.map((icon) => icon.getAttribute('src')),
    ['assets/levels/04/lever-up.svg', 'assets/levels/04/lever-down.svg'],
  );
  for (const icon of icons) {
    assert.equal(icon.tag, 'img', 'las palancas usan imagen, no botones');
    assert.equal(icon.getAttribute('alt'), '', 'imagen decorativa sin texto alternativo');
    assert.ok(
      existsSync(join(here, '..', String(icon.getAttribute('src')))),
      `${icon.getAttribute('src')} existe en disco`,
    );
  }
  const fallback = setup({ level: {} });
  const fallbackTags = findAll(fallback.element, (n) => classes(n).includes('l4-lever-tag'));
  assert.deepEqual(fallbackTags.map((n) => n.textContent), ['▲ Subir', '▼ Bajar']);
  const fallbackIcons = findAll(fallback.element, (n) => classes(n).includes('l4-lever-icon'));
  assert.deepEqual(
    fallbackIcons.map((icon) => icon.getAttribute('src')),
    ['assets/levels/04/lever-up.svg', 'assets/levels/04/lever-down.svg'],
  );
});

test('selectores en lámina final fuera del lector', () => {
  const scene = setup();
  const selectors = findOne(scene.element, (n) => classes(n).includes('l4-selectors'));
  assert.equal(selectors.attributes['aria-hidden'], 'true', 'los selectores quedan fuera de lectores');
  assert.equal(selectors.attributes['data-asset'], 'n4.selectors');
  assert.equal(selectors.attributes['data-status'], 'final');
  assert.equal(selectors.attributes['data-src'], 'assets/levels/04/selectors.svg');
  assert.ok(
    existsSync(join(here, '..', 'assets/levels/04/selectors.svg')),
    'la lámina existe en disco',
  );
  const image = findOne(selectors, (n) => classes(n).includes('l4-selectors-img'));
  assert.equal(image.tag, 'img');
  assert.equal(image.getAttribute('src'), 'assets/levels/04/selectors.svg');
  assert.equal(image.getAttribute('alt'), '', 'lámina decorativa sin texto alternativo');
  assert.equal(
    findAll(selectors, (n) => classes(n).includes('l4-dial')).length,
    0,
    'los diales decorativos ya no se dibujan',
  );
});

test('fondo final con cover, oscurecimiento y terciopelo de fallback', () => {
  const scene = setup();
  const backdrop = findOne(scene.element, (n) => classes(n).includes('l4-backdrop'));
  assert.equal(backdrop.attributes['data-asset'], 'n4.background');
  assert.equal(backdrop.attributes['data-status'], 'final');
  assert.equal(backdrop.attributes['data-src'], 'assets/levels/04/background.webp');
  assert.ok(
    existsSync(join(here, '..', 'assets/levels/04/background.webp')),
    'el fondo existe en disco',
  );
  assert.ok(
    cssSource.includes('url("../../../assets/levels/04/background.webp")'),
    'el css viste la tramoya con el fondo',
  );
  const [block] = cssBlocks('.level-scene[data-level="4"] .l4-backdrop');
  assert.ok(block, 'existe la regla del backdrop');
  assert.ok(cssHas(block, 'cover'), 'el fondo cubre la tramoya');
  assert.ok(cssHas(block, 'repeating-linear-gradient'), 'los pliegues quedan como fallback');
  assert.ok(cssSource.includes('--l4-velvet'), 'el terciopelo de la raíz sigue como fallback');
});

test('leyenda de una línea con el texto completo en el title', () => {
  const scene = setup();
  const legend = findOne(scene.element, (n) => classes(n).includes('l4-legend'));
  assert.equal(legend.children.length, 2, 'solo título y una línea, fuera del camino del editor');
  assert.equal(findOne(legend, (n) => classes(n).includes('l4-legend-title')).textContent, 'Cómo se lee un cable');
  assert.equal(findOne(legend, (n) => classes(n).includes('l4-legend-keys')).textContent, '▲ Subir · ▼ Bajar');
  const full = legend.getAttribute('title');
  assert.ok(full.includes('Se lee: llave'), 'el title explica la lectura');
  assert.ok(full.includes('Cargar apila una ficha'), 'el title explica la pila');
  assert.ok(full.includes('Cualquier otra combinación'), 'el title avisa la alarma');
  const evil = '<img src=x onerror=alert(1)> ▲ Subir';
  const injected = setup({ level: { keys: [{ label: evil }] } });
  const keysNode = findOne(injected.element, (n) => classes(n).includes('l4-legend-keys'));
  assert.equal(keysNode.textContent, evil);
  assert.equal(keysNode.children.length, 0, 'la etiqueta con marcas no se parsea como nodos');
  const spoken = findAll(scene.element, (n) => typeof n.textContent === 'string' && n.textContent !== '' && n.children.length === 0)
    .map((n) => n.textContent)
    .join(' · ');
  for (const banned of ['autómata', 'AFD', 'AFND', 'transición', 'lenguaje']) {
    assert.ok(!spoken.includes(banned), `vocabulario de taller, sin ${banned}`);
  }
});

test('rig contenido con cabecera compacta y slots en su lugar', () => {
  const scene = setup();
  const rig = findOne(scene.element, (n) => classes(n).includes('l4-rig'));
  assert.ok(findOne(rig, (n) => classes(n).includes('l4-body')), 'el cuerpo vive en el rig');
  assert.ok(findOne(rig, (n) => classes(n).includes('l4-note')), 'la nota vive en el rig');
  const head = findOne(scene.element, (n) => classes(n).includes('l4-head'));
  assert.ok(findOne(head, (n) => classes(n).includes('l4-titles')), 'títulos en la cabecera');
  assert.ok(findOne(head, (n) => classes(n).includes('l4-levers')), 'palancas en la cabecera');
  assert.ok(
    findOne(scene.element, (n) => classes(n).includes('l4-plate')).children.includes(scene.editorSlot),
    'el editor vive en la placa',
  );
});

test('sello de fase y dispose', () => {
  const scene = setup({ phase: 'Construcción' });
  assert.equal(findOne(scene.element, (n) => classes(n).includes('l4-seal')).textContent, 'Construcción');
  scene.dispose();
  assert.equal(scene.element.removed, true);
});

test('css con alcance del nivel, foco y movimiento reducido', () => {
  for (const line of cssSource.split('\n')) {
    const brace = line.indexOf('{');
    if (brace === -1) {
      continue;
    }
    const selector = line.slice(0, brace).trim();
    if (selector === '' || selector.startsWith('@media')) {
      continue;
    }
    assert.ok(
      selector.startsWith('.level-scene[data-level="4"]'),
      `regla fuera del alcance del nivel 4: ${selector}`,
    );
  }
  assert.ok(cssSource.includes(':focus-visible'), 'foco visible para lo que monte el parent');
  assert.ok(cssSource.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
});

test('css usa las tipografías del mockup', () => {
  for (const family of ['"Cinzel"', '"Oswald"', '"Special Elite"']) {
    assert.ok(cssSource.includes(family), `falta la familia ${family}`);
  }
});

test('raíz contenida al alto del stage, sin empujar la página ni el dock', () => {
  const roots = cssBlocks('.level-scene[data-level="4"]');
  assert.equal(roots.length, 2, 'regla de raíz en desktop y en celular');
  for (const prop of ['display: grid', 'grid-template-rows: minmax(0, 1fr)', 'height: 100%', 'max-height: 100%', 'min-height: 0', 'overflow: hidden', 'box-sizing: border-box']) {
    assert.ok(cssHas(roots[0], prop), `la raíz fija ${prop}`);
  }
});

test('editor flexible y canvas confinado sin estirar', () => {
  const [slot] = cssBlocks('.level-scene[data-level="4"] .l4-editor-slot');
  assert.ok(slot, 'existe el slot del editor');
  for (const prop of ['flex: 1 1 auto', 'min-height: 0', 'overflow: auto']) {
    assert.ok(cssHas(slot, prop), `el slot fija ${prop}`);
  }
  const [canvas] = cssBlocks('.level-scene[data-level="4"] .l4-editor-slot #canvas');
  assert.ok(canvas, 'existe la regla del canvas real');
  for (const prop of ['height: 100%', 'width: auto', 'max-width: 100%', 'margin-inline: auto']) {
    assert.ok(cssHas(canvas, prop), `el canvas escala por alto con ${prop}`);
  }
  assert.ok(!cssSource.includes('min-height: 280px'), 'sin alto mínimo que empuje el stage');
  assert.ok(!cssSource.includes('min-height: 320px'), 'sin hueco mínimo heredado');
});

test('pila con techo y scroll interno, targets de 44 px y sprites finales', () => {
  const [status] = cssBlocks('.level-scene[data-level="4"] .l4-status-slot');
  assert.ok(cssHas(status, 'flex: 0 0 auto'), 'el status no crece');
  for (const sel of ['.level-scene[data-level="4"] .l4-status-slot #stack-panel', '.level-scene[data-level="4"] .l4-status-slot .stack-panel']) {
    const [block] = cssBlocks(sel);
    assert.ok(block, `existe ${sel}`);
    assert.ok(cssHas(block, 'max-height'), `${sel} con techo`);
    assert.ok(cssHas(block, 'overflow: auto'), `${sel} con scroll interno`);
  }
  const [chip] = cssBlocks('.level-scene[data-level="4"] .l4-status-slot .stack-chip');
  assert.ok(cssHas(chip, 'min-height: 44px'), 'fichas tocables de 44 px');
  assert.ok(cssHas(chip, 'chip.webp'), 'la ficha viste la pila real');
  const [base] = cssBlocks('.level-scene[data-level="4"] .l4-status-slot .stack-chip.is-base');
  assert.ok(cssHas(base, 'stack-base.webp'), 'la base viste la pila real');
  assert.ok(
    cssSource.includes('url("../../../assets/levels/04/chip.webp")'),
    'la ficha viste la pila real por css',
  );
  assert.ok(
    cssSource.includes('url("../../../assets/levels/04/stack-base.webp")'),
    'la base viste la pila real por css',
  );
  for (const src of ['assets/levels/04/chip.webp', 'assets/levels/04/stack-base.webp']) {
    assert.ok(existsSync(join(here, '..', src)), `${src} existe en disco`);
  }
});

test('cabecera compacta y lámina de selectores: el editor manda', () => {
  const [head] = cssBlocks('.level-scene[data-level="4"] .l4-head');
  assert.ok(cssHas(head, 'flex: 0 0 auto'), 'la cabecera no crece');
  const [image] = cssBlocks('.level-scene[data-level="4"] .l4-selectors-img');
  assert.ok(image, 'existe la regla de la lámina de selectores');
  assert.ok(cssHas(image, 'width: 100%'), 'la lámina llena la columna');
});

test('en celular la escena queda contenida al stage, sin scroll horizontal', () => {
  const roots = cssBlocks('.level-scene[data-level="4"]');
  assert.equal(roots.length, 2, 'regla de raíz en desktop y en celular');
  for (const prop of ['height: 100%', 'max-height: 100%', 'min-height: 0', 'overflow: hidden']) {
    assert.ok(cssHas(roots[1], prop), `la raíz móvil fija ${prop}`);
  }
  const mobile = cssSource.slice(
    cssSource.indexOf('@media (max-width: 700px)'),
    cssSource.indexOf('@media (prefers-reduced-motion)'),
  );
  assert.ok(mobile.includes('.l4-legend'), 'la media móvil toca la leyenda');
  assert.ok(mobile.includes('display: none'), 'la leyenda se esconde en móvil');
  assert.ok(mobile.includes('min-height: 240px'), 'el editor móvil reserva alto');
  const canvases = cssBlocks('.level-scene[data-level="4"] .l4-editor-slot #canvas');
  assert.equal(canvases.length, 2, 'regla de canvas en desktop y en celular');
  assert.ok(cssHas(canvases[1], 'width: 100%'), 'en celular el canvas escala por ancho');
  assert.ok(cssHas(canvases[1], 'height: auto'), 'en celular el canvas conserva proporción');
});
