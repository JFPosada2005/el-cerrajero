import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLevelScene } from '../src/ui/levels/level2Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const source = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level2Scene.js'), 'utf8');
const css = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level2.css'), 'utf8');

// --- DOM falso mínimo (createElement) ---
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
  assert.equal(slot.getAttribute('role'), 'group');
  assert.match(slot.getAttribute('aria-label') ?? '', /tablero de cables/i);
});

test('ranuras de carretes y marcha en la banda de mesa', () => {
  const scene = setup();
  const keys = findOne(scene.element, (n) => n.attributes['data-slot'] === 'keys', 'keysSlot');
  assert.strictEqual(scene.keysSlot, keys);
  assert.equal(keys.children.length, 0, 'la paleta y las herramientas las monta el parent');
  assert.equal(keys.getAttribute('role'), 'group');
  assert.match(keys.getAttribute('aria-label') ?? '', /carretes/i);
  const hud = findOne(scene.element, (n) => n.attributes['data-slot'] === 'hud', 'hudSlot');
  assert.strictEqual(scene.hudSlot, hud);
  assert.equal(hud.children.length, 0, 'la línea de marcha la mueve el parent');
  assert.equal(hud.getAttribute('aria-live'), 'polite');
  assert.match(hud.getAttribute('aria-label') ?? '', /marcha/i);
  assert.strictEqual(scene.statusSlot, null, 'sin franja propia: la marcha vive en hudSlot');
  const kids = scene.element.children;
  assert.strictEqual(kids[kids.length - 1], hud, 'hudSlot cierra la banda como último renglón');
  const band = findOne(scene.element, (n) => classes(n).includes('l2-band'), 'banda');
  const order = band.children.map(
    (child) => child.attributes['data-slot'] ?? child.attributes['data-action'] ?? (classes(child).includes('l2-papers') ? 'papers' : '?'),
  );
  assert.deepEqual(
    order,
    ['papers', 'keys', 'cut', 'probe', 'assault'],
    'la banda ordena papeles, carretes, tijera, prueba y ensayo',
  );
  const papers = findOne(scene.element, (n) => classes(n).includes('l2-papers'), 'papeles');
  assert.strictEqual(papers.parentNode, band, 'los papeles viven en la banda');
  assert.strictEqual(keys.parentNode, band, 'los carretes viven en la banda');
});

test('la fase se lee en la placa', () => {
  const repair = setup({ phase: 'repair' });
  const build = setup({ phase: 'build' });
  const repairTexts = findAll(repair.element, () => true).map((n) => n.textContent.toLowerCase());
  const buildTexts = findAll(build.element, () => true).map((n) => n.textContent.toLowerCase());
  assert.ok(repairTexts.some((text) => text.includes('reparación')));
  assert.ok(!repairTexts.some((text) => text.includes('construcción')));
  assert.ok(buildTexts.some((text) => text.includes('construcción')));
});

test('el sello de la placa marca la fase', () => {
  const scene = setup({ phase: 'build' });
  const seal = findOne(scene.element, (n) => classes(n).includes('l2-plate-seal'), 'sello');
  assert.match(seal.textContent, /construcción/i);
  assert.match(seal.getAttribute('aria-label') ?? '', /construcción/i);
});

test('mesa de nogal y luz cálida como decorado', () => {
  const scene = setup();
  const bench = findOne(scene.element, (n) => classes(n).includes('l2-bench'), 'mesa');
  const light = findOne(scene.element, (n) => classes(n).includes('l2-light'), 'luz');
  assert.equal(bench.getAttribute('aria-hidden'), 'true');
  assert.equal(light.getAttribute('aria-hidden'), 'true');
  assert.equal(bench.getAttribute('data-slot'), null, 'la mesa no es un slot');
});

test('los seis props diegéticos son botones reales con data-action', () => {
  const scene = setup();
  const buttons = findAll(scene.element, (n) => n.tag === 'button');
  assert.equal(buttons.length, 6, `seis props accionables, hay ${buttons.length}`);
  assert.deepEqual(
    buttons.map((node) => node.getAttribute('data-action')).sort(),
    ['assault', 'contract', 'cut', 'hint', 'log', 'probe'],
    'cada botón emite su intención con data-action',
  );
  for (const button of buttons) {
    assert.equal(button.type, 'button', 'botones reales');
    assert.ok(button.getAttribute('aria-label'), 'todo prop accionable tiene nombre accesible');
  }
  assert.deepEqual(scene.actions, ['contract', 'hint', 'log', 'probe', 'assault', 'cut']);
});

test('props diegéticos: contrato, pista, bitácora, indicador, palanca y tijera', () => {
  const scene = setup();
  const byAction = {};
  for (const button of findAll(scene.element, (n) => n.tag === 'button')) {
    byAction[button.getAttribute('data-action')] = button;
  }
  assert.equal(byAction.contract.getAttribute('aria-label'), 'Abrir contrato');
  assert.equal(byAction.hint.getAttribute('aria-label'), 'Pedir una pista');
  assert.equal(byAction.log.getAttribute('aria-label'), 'Abrir la bitácora');
  assert.match(byAction.probe.getAttribute('aria-label'), /pisos/i);
  assert.match(byAction.probe.getAttribute('aria-label'), /probar/i);
  assert.equal(byAction.cut.getAttribute('aria-label'), 'Cortar un cable');
  assert.equal(byAction.assault.getAttribute('aria-label'), 'Pedir el ensayo');
  const buildAssault = setup({ phase: 'build' });
  const buildByAction = {};
  for (const button of findAll(buildAssault.element, (n) => n.tag === 'button')) {
    buildByAction[button.getAttribute('data-action')] = button;
  }
  assert.equal(buildByAction.assault.getAttribute('aria-label'), 'Lanzar el asalto');
  assert.ok(classes(byAction.contract).includes('l2-paper'), 'el contrato es un papel de la mesa');
  assert.ok(classes(byAction.hint).includes('l2-paper'), 'la pista es un papel de la mesa');
  assert.ok(classes(byAction.log).includes('l2-paper'), 'la bitácora es un papel de la mesa');
  assert.ok(classes(byAction.probe).includes('l2-probe'), 'el indicador prueba');
  assert.ok(classes(byAction.assault).includes('l2-lever'), 'la palanca es el ensayo');
  assert.ok(classes(byAction.cut).includes('l2-scissors'), 'la tijera corta');
  const names = findAll(byAction.contract, (n) => classes(n).includes('l2-prop-name'))
    .map((n) => n.textContent);
  assert.deepEqual(names, ['Contrato'], 'el papel conserva su rótulo visible');
});

test('el indicador envuelve la imagen final y la palanca pide el ensayo', () => {
  const scene = setup();
  const probe = findOne(
    scene.element,
    (n) => n.getAttribute('data-action') === 'probe',
    'indicador',
  );
  const gaugeImg = findOne(probe, (n) => classes(n).includes('l2-gauge-img'), 'imagen del indicador');
  assert.equal(gaugeImg.tag, 'img');
  assert.equal(gaugeImg.getAttribute('src'), 'assets/levels/02/floor-indicator.svg');
  assert.equal(gaugeImg.getAttribute('alt'), '');
  const lever = findOne(
    scene.element,
    (n) => n.getAttribute('data-action') === 'assault',
    'palanca',
  );
  const leverName = findOne(lever, (n) => classes(n).includes('l2-prop-name'), 'nombre');
  assert.equal(leverName.textContent, 'Ensayo');
});

test('sin texto de producción visible', () => {
  const scene = setup();
  const copy = texts(scene.element);
  for (const banned of ['a producir', 'Fondo, indicador', 'AQUÍ EL TALLER', 'aqui el taller']) {
    assert.ok(!copy.toLowerCase().includes(banned.toLowerCase()), `sin «${banned}» en la escena`);
  }
  assert.ok(!source.includes('Fondo, indicador, piñón'), 'fuera el aviso de producción del JS');
  assert.ok(!css.includes('a producir'), 'fuera el aviso de producción del CSS');
});

test('slots finales con imágenes locales y sin pendientes visibles', () => {
  assert.ok(!source.includes('https://'), 'sin URLs externas');
  for (const src of [
    'assets/levels/02/floor-indicator.svg',
    'assets/levels/02/pinion.webp',
    'assets/shared/props/relay.webp',
    'assets/levels/01/props/contract.webp',
    'assets/levels/01/props/hint.webp',
    'assets/levels/01/props/log.webp',
  ]) {
    assert.ok(source.includes(src), `ruta ${src} en el JS`);
  }
  assert.ok(!source.includes('createElementNS'), 'sin SVG inline');
  const scene = setup();
  const finals = byAttr(scene.element, 'data-status', 'final');
  const byAsset = new Map(finals.map((node) => [node.getAttribute('data-asset'), node]));
  for (const [asset, src] of [
    ['levels.02.background', 'assets/levels/02/background.webp'],
    ['levels.02.floorIndicator', 'assets/levels/02/floor-indicator.svg'],
    ['levels.02.pinion', 'assets/levels/02/pinion.webp'],
    ['shared.prop.relay', 'assets/shared/props/relay.webp'],
    ['levels.01.contract', 'assets/levels/01/props/contract.webp'],
    ['levels.01.hint', 'assets/levels/01/props/hint.webp'],
    ['levels.01.log', 'assets/levels/01/props/log.webp'],
  ]) {
    assert.ok(byAsset.has(asset), `slot ${asset} declarado`);
    assert.equal(byAsset.get(asset).getAttribute('data-src'), src);
  }
  const relayFinals = finals.filter(
    (node) => node.getAttribute('data-asset') === 'shared.prop.relay',
  );
  assert.ok(relayFinals.length >= 1, 'relés en final');
  const placeholders = byAttr(scene.element, 'data-status', 'placeholder');
  assert.ok(placeholders.length >= 2, 'palanca y tijera declaran su pendiente en data-status');
  const pendingTexts = placeholders.map((n) => n.textContent);
  assert.ok(pendingTexts.every((text) => text === ''), 'lo pendiente no lleva texto visible');
});

test('papeles con assets finales e imagen visible', () => {
  const scene = setup();
  const byAction = {};
  for (const button of findAll(scene.element, (n) => n.tag === 'button')) {
    byAction[button.getAttribute('data-action')] = button;
  }
  for (const [action, src, asset, name] of [
    ['contract', 'assets/levels/01/props/contract.webp', 'levels.01.contract', 'Contrato'],
    ['hint', 'assets/levels/01/props/hint.webp', 'levels.01.hint', 'Pista'],
    ['log', 'assets/levels/01/props/log.webp', 'levels.01.log', 'Bitácora'],
  ]) {
    const button = byAction[action];
    const imgs = findAll(button, (n) => n.tag === 'img');
    assert.equal(imgs.length, 1, `el papel ${action} trae una imagen`);
    assert.equal(imgs[0].getAttribute('src'), src);
    assert.equal(imgs[0].getAttribute('alt'), '');
    assert.equal(imgs[0].getAttribute('data-asset'), asset);
    assert.equal(imgs[0].getAttribute('data-status'), 'final');
    assert.equal(imgs[0].getAttribute('data-src'), src);
    assert.ok(existsSync(join(ROOT, src)), `${src} existe en disco`);
    assert.deepEqual(
      findAll(button, (n) => classes(n).includes('l2-prop-name')).map((n) => n.textContent),
      [name],
      'el rótulo va debajo de la imagen',
    );
  }
  assert.ok(css.includes('.l2-paper-img'), 'la imagen del papel tiene regla propia');
  assert.ok(!css.includes('.l2-paper-visual'), 'fuera el papel dibujado con CSS');
});

test('la ranura deja ver el carrete completo y su chapa', () => {
  const at = css.indexOf('.level-scene[data-level="2"] .l2-keys {');
  assert.ok(at > 0, 'keysSlot tiene regla propia');
  const keys = css.slice(at, css.indexOf('}', at));
  const minHeight = keys.match(/min-height:\s*(\d+)px/);
  assert.ok(minHeight !== null, 'la ranura reserva alto');
  assert.ok(Number.parseInt(minHeight[1], 10) >= 100, 'alto para el carrete y su chapa');
  assert.ok(!keys.includes('overflow: hidden'), 'sin recorte vertical en la ranura');
  assert.ok(!keys.includes('overflow-y'), 'sin recorte vertical en la ranura');
  const paletteAt = css.indexOf('.level-scene[data-level="2"] .l2-keys #palette {');
  assert.ok(paletteAt > 0, 'la paleta del parent tiene regla de integración');
  const paletteRule = css.slice(paletteAt, css.indexOf('}', paletteAt));
  assert.ok(!paletteRule.includes('overflow'), 'la paleta no recorta los carretes');
  assert.ok(!paletteRule.includes('height:'), 'la paleta no fija alto');
  assert.ok(!/\.key\b/.test(css), 'el nivel no toca el carrete: el tamaño y la chapa los viste el taller');
});

test('los assets finales existen en disco y el fondo cubre la sala', () => {
  for (const file of [
    'assets/levels/02/background.webp',
    'assets/levels/02/floor-indicator.svg',
    'assets/levels/02/pinion.webp',
    'assets/shared/props/relay.webp',
    'assets/levels/01/props/contract.webp',
    'assets/levels/01/props/hint.webp',
    'assets/levels/01/props/log.webp',
  ]) {
    assert.ok(existsSync(join(ROOT, file)), `${file} existe en disco`);
  }
  assert.ok(
    css.includes('../../../assets/levels/02/background.webp'),
    'el CSS apunta al fondo final',
  );
  assert.match(css, /background-size:\s*cover/, 'el fondo cubre la sala');
  assert.match(css, /background-position:\s*center/, 'el fondo va centrado');
});

test('la escena ocupa toda la pantalla, sin recuadro', () => {
  const rootAt = css.indexOf('.level-scene[data-level="2"] {');
  assert.ok(rootAt >= 0, 'la raíz tiene regla propia');
  const root = css.slice(rootAt, css.indexOf('}', rootAt));
  assert.ok(root.includes('position: absolute'), 'la escena sale del flujo');
  assert.ok(root.includes('inset: 0'), 'cubre todo el stage');
  assert.ok(root.includes('height: 100%'), 'alto completo');
  assert.ok(!root.includes('border-radius: 12px'), 'sin recuadro de marco');
  assert.ok(!root.includes('border-radius: 14px'), 'sin recuadro');
  assert.ok(
    css.includes('.wb-scene.is-immersive .level-scene[data-level="2"]'),
    'refuerzo cuando el shell aplica is-immersive',
  );
});

test('placa de trabajo más grande y proporcional', () => {
  const plateAt = css.indexOf('.level-scene[data-level="2"] .l2-plate {');
  assert.ok(plateAt > 0, 'la placa tiene regla propia');
  const plate = css.slice(plateAt, css.indexOf('}', plateAt));
  assert.ok(plate.includes('left: 50%'), 'centrada');
  assert.ok(plate.includes('translate(-50%, -50%)'), 'centrada en los dos ejes');
  assert.ok(plate.includes('aspect-ratio: 760 / 620'), 'misma proporción');
  assert.ok(plate.includes('min(64%, 700px)'), 'crece con la ventana');
  assert.ok(plate.includes('max-width: 65%'), 'sin tapar la banda');
});

test('banda de mesa sin solapes: fila flex real, nada absoluto que se cruce', () => {
  const rule = (selector) => {
    const at = css.indexOf(`.level-scene[data-level="2"] ${selector} {`);
    assert.ok(at > 0, `${selector} tiene regla propia`);
    return css.slice(at, css.indexOf('}', at));
  };
  const band = rule('.l2-band');
  assert.ok(band.includes('display: flex'), 'la banda es una fila real');
  assert.ok(band.includes('flex-wrap: wrap'), 'si no entra, envuelve en vez de pisarse');
  assert.ok(band.includes('width: 100%'), 'banda a lo ancho');
  assert.ok(band.includes('max-width: 100%'), 'banda sin desborde');
  assert.ok(band.includes('margin-top: auto'), 'banda al fondo, en flujo');
  assert.ok(band.includes('align-items: flex-end'), 'carretes con la misma posición vertical');
  for (const item of ['.l2-papers', '.l2-probe', '.l2-keys', '.l2-scissors', '.l2-lever']) {
    assert.ok(!rule(item).includes('position: absolute'), `${item} fluye en la banda`);
  }
  const keys = rule('.l2-keys');
  assert.ok(keys.includes('flex: 1 1 auto'), 'carretes con lugar sin empujar la banda');
  assert.ok(keys.includes('justify-content: center'), 'carretes centrados en la mesa');
  assert.ok(keys.includes('min-width: 0'), 'carretes que ceden antes de desbordar');
  assert.ok(keys.includes('flex-wrap: wrap'), 'el rack envuelve dentro de su ranura');
  assert.ok(keys.includes('max-width: 100%'), 'carretes sin desborde');
  assert.ok(keys.includes('background: transparent'), 'los carretes del parent se integran');
  assert.ok(keys.includes('min-height: 104px'), 'la ranura reserva alto para el carrete y su chapa');
  assert.ok(!keys.includes('overflow: hidden'), 'la ranura no recorta en vertical');
  assert.ok(!keys.includes('overflow-y'), 'la ranura no recorta en vertical');
  const lever = rule('.l2-lever');
  assert.ok(lever.includes('max-width: 100%'), 'ensayo contenido en la banda');
  assert.ok(band.includes('max(16px, 2%)'), 'margen derecho reservado para la palanca');
  const hud = rule('.l2-hud');
  assert.ok(!hud.includes('position: absolute'), 'hudSlot en flujo como último renglón');
  assert.ok(hud.includes('width: 100%'), 'marcha a lo ancho');
  assert.ok(hud.includes('max-width: 100%'), 'marcha sin desborde');
  assert.ok(hud.includes('font-size: 14px'), 'marcha a 14 px');
  assert.ok(hud.includes('overflow: hidden'), 'la línea larga no empuja la ventana');
  assert.ok(css.includes('box-sizing: border-box'), 'caja contenida en toda la escena');
  assert.ok(
    /\.level-scene\[data-level="2"\]\s*\{[^}]*max-width:\s*100%/.test(css),
    'la raíz no supera la ventana',
  );
});

test('probar junto a ensayo a la derecha, en el mismo grupo', () => {
  const scene = setup();
  const band = findOne(scene.element, (n) => classes(n).includes('l2-band'), 'banda');
  const actions = band.children.map((child) => child.getAttribute('data-action'));
  const probeAt = actions.indexOf('probe');
  const assaultAt = actions.indexOf('assault');
  assert.ok(probeAt >= 0 && assaultAt === probeAt + 1, 'probar y ensayo van juntos a la derecha');
  assert.ok(probeAt > actions.indexOf('cut'), 'después de papeles, carretes y tijera');
  assert.ok(!css.includes('min(32.5%, 310px)'), 'fuera el ancla lateral del indicador');
  assert.ok(!css.includes('translate(-100%'), 'el indicador fluye en la banda en todo ancho');
});

test('la marcha la mueve el parent al último renglón, sin franja', () => {
  const scene = setup();
  assert.equal(scene.hudSlot.children.length, 0, 'el parent mueve su línea; la escena no pinta otra');
  assert.ok(!source.includes('l2-status'), 'fuera la franja propia de la placa');
  assert.ok(!css.includes('.l2-status'), 'fuera la franja propia del CSS');
  const seal = findOne(setup({ phase: 'repair' }).element, (n) => classes(n).includes('l2-plate-seal'), 'sello');
  assert.match(seal.textContent, /reparación/i);
});

test('la escena no crea editor, cables, llaves ni juicio', () => {
  assert.ok(!source.includes('graphEditor'), 'sin importar el editor de grafos');
  assert.ok(!source.includes('drumEditor'), 'sin importar el editor de tambor');
  assert.ok(!source.includes('handleProbe'), 'sin lógica de probar');
  assert.ok(!source.includes('handleAssault'), 'sin lógica de ensayo');
  assert.ok(!source.includes('toMachine'), 'sin construir máquinas');
  assert.ok(!source.includes('addEventListener'), 'sin listeners: la escena no decide nada');
  const scene = setup();
  const tags = new Set(findAll(scene.element, () => true).map((node) => node.tag));
  assert.ok(!tags.has('canvas'), 'sin canvas propio');
  assert.ok(!tags.has('svg'), 'sin dibujo propio');
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
  assert.ok(css.includes('#38c6b8'), 'foco visible con contorno teal');
  assert.ok(css.includes('background: transparent'), 'los props no tienen caja de botón');
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [];
  const chunks = clean.split('}');
  for (const chunk of chunks) {
    const brace = chunk.indexOf('{');
    if (brace === -1) {
      continue;
    }
    const head = chunk.slice(0, brace).trim();
    if (head.startsWith('@')) {
      continue;
    }
    const parts = head.split(',').map((part) => part.trim());
    if (parts.length > 0 && parts.every((part) => /^(\d+%|from|to)$/.test(part))) {
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

test('el tablero real llena el hueco, centrado y sin estirarse', () => {
  assert.match(css, /\.l2-editor-slot #canvas[\s\S]*?width:\s*100%/, '#canvas a lo ancho del hueco');
  assert.match(css, /\.l2-editor-slot #canvas[\s\S]*?height:\s*100%/, '#canvas a lo alto del hueco');
  assert.match(
    css,
    /\.l2-editor-slot #canvas[\s\S]*?background:\s*transparent/,
    '#canvas con fondo transparente',
  );
  assert.match(css, /\.l2-editor-slot #canvas[\s\S]*?border:\s*0/, '#canvas sin borde');
});

test('ambiente animado solo con movimiento permitido', () => {
  const motionAt = css.indexOf('prefers-reduced-motion: no-preference');
  assert.ok(motionAt > 0, 'las animaciones viven bajo no-preference');
  const motion = css.slice(motionAt);
  for (const name of ['l2-visor-blink', 'l2-gauge-sway', 'l2-pinion-glow', 'l2-light-drift']) {
    assert.ok(motion.includes(`@keyframes ${name}`), `existe ${name}`);
  }
  assert.ok(motion.includes('.l2-relay-visor'), 'el visor del relé parpadea');
  assert.ok(motion.includes('.l2-gauge'), 'el indicador tiene vaivén mínimo');
  assert.ok(motion.includes('.l2-pinion-img'), 'el piñón brilla');
  assert.ok(motion.includes('.l2-light'), 'la luz deriva tenue');
  assert.ok(motion.includes('infinite'), 'en bucle');
  assert.ok(!motion.includes('scissors'), 'la tijera no se anima');
});

test('rótulos debajo del asset, nunca tapados', () => {
  const scene = setup();
  for (const button of findAll(scene.element, (n) => n.tag === 'button' && n.getAttribute('data-action'))) {
    const action = button.getAttribute('data-action');
    const last = button.children[button.children.length - 1];
    assert.ok(classes(last).includes('l2-prop-name'), `${action}: el rótulo cierra el botón`);
  }
  const rule = (selector) => {
    const full = `.level-scene[data-level="2"] ${selector} {`;
    let from = 0;
    for (;;) {
      const at = css.indexOf(full, from);
      assert.ok(at > 0, `${selector} tiene regla propia`);
      const lineStart = css.lastIndexOf('\n', at) + 1;
      const lineEnd = css.indexOf('\n', at);
      const line = css.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim();
      const prevEnd = lineStart - 1;
      const prevStart = css.lastIndexOf('\n', Math.max(prevEnd - 1, 0)) + 1;
      const prevLine = css.slice(prevStart, Math.max(prevEnd, 0)).trim();
      if (line === full && !prevLine.endsWith(',')) {
        return css.slice(at, css.indexOf('}', at));
      }
      from = at + 1;
    }
  };
  for (const item of ['.l2-probe', '.l2-paper', '.l2-scissors', '.l2-lever']) {
    const itemRule = rule(item);
    assert.ok(itemRule.includes('display: flex'), `${item} es columna`);
    assert.ok(itemRule.includes('flex-direction: column'), `${item} apila imagen y rótulo`);
  }
  const nameRule = rule('.l2-prop-name');
  assert.ok(!nameRule.includes('position: absolute'), 'el rótulo fluye en la columna');
  const size = nameRule.match(/font-size:\s*(\d+)px/);
  assert.ok(size !== null && Number.parseInt(size[1], 10) >= 12, 'rótulo de al menos 12 px');
  const lever = rule('.l2-lever');
  assert.ok(lever.includes('gap:'), 'la palanca separa imagen y palabra con gap');
  const visual = rule('.l2-lever-visual');
  assert.ok(visual.includes('height: 88px'), 'el visual contiene la palanca completa');
  assert.ok(visual.includes('position: relative'), 'el pomo se ancla al visual');
  const knob = rule('.l2-lever-knob');
  assert.ok(knob.includes('position: absolute'), 'el pomo vive dentro del visual, no sobre el rótulo');
});

test('en celular la escena no genera scroll y los rótulos quedan en el aria', () => {
  assert.ok(css.includes('@media (max-width: 700px)'), 'quiebre de celular');
  assert.match(
    css,
    /@media \(max-width: 700px\)[\s\S]*?\.l2-prop-name[\s\S]*?display:\s*none/,
    'rótulos compactos en celular',
  );
  assert.match(
    css,
    /@media \(max-width: 700px\)[\s\S]*?\.l2-plate[\s\S]*?width:\s*94%/,
    'placa contenida en celular',
  );
  assert.match(
    css,
    /@media \(max-width: 700px\)[\s\S]*?\.l2-keys[\s\S]*?flex-basis:\s*100%/,
    'carretes en su propia fila en celular',
  );
  assert.match(
    css,
    /@media \(max-width: 700px\)[\s\S]*?\.l2-keys[\s\S]*?order:\s*6/,
    'carretes después de tijera y ensayo en celular',
  );
  assert.match(
    css,
    /@media \(max-width: 700px\)[\s\S]*?\.l2-band[\s\S]*?flex-wrap:\s*wrap/,
    'la banda envuelve en celular',
  );
});

test('dispose suelta la escena sin tocar el editor', () => {
  const scene = setup();
  const parent = element('div');
  parent.append(scene.element);
  const slot = scene.editorSlot;
  scene.dispose();
  assert.ok(scene.element.removed, 'la escena se suelta del taller');
  assert.equal(parent.children.length, 0);
  assert.equal(slot.children.length, 0, 'el dispose no vacía el slot: el parent desmonta el editor');
});
