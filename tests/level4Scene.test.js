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

function spokenText(root) {
  return findAll(
    root,
    (n) => typeof n.textContent === 'string' && n.textContent !== '' && n.children.length === 0,
  )
    .map((n) => n.textContent)
    .join(' · ');
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
    // Solo reglas propias: la línea no trae otro selector delante
    // (así `.wb-scene.is-immersive .level-scene…` no cuenta como raíz base).
    const lineStart = cssSource.lastIndexOf('\n', start - 1) + 1;
    from = start + 1;
    if (cssSource.slice(lineStart, start).trim() !== '') {
      continue;
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
  assert.strictEqual(
    findOne(scene.element, (n) => n.attributes['data-slot'] === 'keys'),
    scene.keysSlot,
  );
  assert.strictEqual(
    findOne(scene.element, (n) => n.attributes['data-slot'] === 'hud'),
    scene.hudSlot,
  );
});

test('keysSlot y hudSlot para lo que monta el parent en la banda de mesa', () => {
  const scene = setup();
  assert.equal(scene.keysSlot.getAttribute('aria-label'), 'Carretes y herramientas');
  assert.equal(scene.hudSlot.getAttribute('aria-label'), 'Estado del taller');
  assert.equal(scene.hudSlot.getAttribute('aria-live'), 'polite');
  const dock = findOne(scene.element, (n) => classes(n).includes('l4-dock'));
  const row = findOne(dock, (n) => classes(n).includes('l4-dock-row'));
  assert.ok(row.children.includes(scene.keysSlot), 'los carretes van al centro-derecha de la banda');
  assert.ok(dock.children.includes(scene.hudSlot), 'el estado es el último renglón');
  assert.equal(dock.children.indexOf(scene.hudSlot), dock.children.length - 1, 'nada debajo del estado');
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
  const buttons = findAll(scene.element, (n) => n.tag === 'button');
  const diegetic = buttons.filter((n) => n.getAttribute('data-action') !== null);
  const dials = buttons.filter((n) => n.getAttribute('data-action') === null);
  assert.equal(diegetic.length, 6, `los seis props diegéticos son botones, hay ${diegetic.length}`);
  assert.deepEqual(
    diegetic.map((node) => node.getAttribute('data-action')).sort(),
    ['assault', 'contract', 'cut', 'hint', 'log', 'probe'],
    'cada botón emite su intención con data-action',
  );
  assert.equal(dials.length, 6, `los seis diales de la pila son botones, hay ${dials.length}`);
  for (const button of buttons) {
    assert.equal(button.type, 'button', 'botones reales');
    assert.ok(button.getAttribute('aria-label'), 'todo prop accionable tiene nombre accesible');
  }
  assert.equal(findAll(scene.element, (n) => n.listenerTypes().length > 0).length, 0, 'sin listeners: la escena no decide nada');
  assert.deepEqual(scene.actions, ['contract', 'hint', 'log', 'probe', 'assault', 'cut']);
});

test('props diegéticos: papeles, cuerda, palanca y tijera', () => {
  const scene = setup();
  const byAction = {};
  for (const button of findAll(scene.element, (n) => n.tag === 'button')) {
    byAction[button.getAttribute('data-action')] = button;
  }
  assert.equal(byAction.contract.getAttribute('aria-label'), 'Abrir contrato');
  assert.equal(byAction.hint.getAttribute('aria-label'), 'Pedir una pista');
  assert.equal(byAction.log.getAttribute('aria-label'), 'Abrir la bitácora');
  assert.equal(byAction.probe.getAttribute('aria-label'), 'Probar la llave');
  assert.equal(byAction.assault.getAttribute('aria-label'), 'Ejecutar el ensayo');
  assert.equal(byAction.cut.getAttribute('aria-label'), 'Cortar un cable');
  for (const action of ['contract', 'hint', 'log']) {
    assert.ok(classes(byAction[action]).includes('l4-paper'), `el prop ${action} es un papel de la mesa`);
  }
  assert.deepEqual(
    findAll(byAction.contract, (n) => classes(n).includes('l4-paper-name')).map((n) => n.textContent),
    ['Contrato'],
    'el papel conserva su rótulo visible',
  );
  assert.ok(classes(byAction.probe).includes('l4-probe'), 'la cuerda prueba');
  assert.deepEqual(
    findAll(byAction.probe, (n) => classes(n).includes('l4-probe-tag')).map((n) => n.textContent),
    ['Probar'],
    'la cuerda dice qué hace',
  );
  assert.ok(classes(byAction.assault).includes('l4-assault'), 'la palanca grande es el ensayo');
  assert.deepEqual(
    findAll(byAction.assault, (n) => classes(n).includes('l4-assault-tag')).map((n) => n.textContent),
    ['Ensayo'],
    'la palanca lleva el nombre de la fase',
  );
  assert.ok(classes(byAction.cut).includes('l4-cut'), 'la tijera corta');
  assert.deepEqual(
    findAll(byAction.cut, (n) => classes(n).includes('l4-cut-name')).map((n) => n.textContent),
    ['Tijera'],
    'la tijera lleva su nombre',
  );
  const build = setup({ phase: 'Construcción' });
  const buildAssault = findOne(build.element, (n) => n.tag === 'button' && n.getAttribute('data-action') === 'assault');
  assert.equal(
    findOne(buildAssault, (n) => classes(n).includes('l4-assault-tag')).textContent,
    'Asalto',
    'en construcción la palanca dice asalto',
  );
});

test('la palanca del ensayo usa las láminas finales de subir y bajar', () => {
  const scene = setup();
  const assault = findOne(scene.element, (n) => classes(n).includes('l4-assault'));
  assert.equal(assault.attributes['data-asset'], 'n4.levers');
  assert.equal(assault.attributes['data-status'], 'final', 'la palanca ya usa asset final');
  assert.ok(
    String(assault.attributes['data-src']).includes('assets/levels/04/lever-up.svg'),
    'data-src con la palanca de subir',
  );
  assert.ok(
    String(assault.attributes['data-src']).includes('assets/levels/04/lever-down.svg'),
    'data-src con la palanca de bajar',
  );
  const icons = findAll(assault, (n) => n.tag === 'img');
  assert.equal(icons.length, 2, 'una lámina por posición');
  assert.deepEqual(
    icons.map((icon) => icon.getAttribute('src')),
    ['assets/levels/04/lever-up.svg', 'assets/levels/04/lever-down.svg'],
  );
  for (const icon of icons) {
    assert.equal(icon.getAttribute('alt'), '', 'imagen decorativa sin texto alternativo');
    assert.ok(
      existsSync(join(here, '..', String(icon.getAttribute('src')))),
      `${icon.getAttribute('src')} existe en disco`,
    );
  }
});

test('sello de fase siempre en español', () => {
  assert.equal(findOne(setup().element, (n) => classes(n).includes('l4-seal')).textContent, 'Reparación');
  assert.equal(findOne(setup({ phase: 'repair' }).element, (n) => classes(n).includes('l4-seal')).textContent, 'Reparación');
  assert.equal(findOne(setup({ phase: 'Construcción' }).element, (n) => classes(n).includes('l4-seal')).textContent, 'Construcción');
  assert.equal(findOne(setup({ phase: 'build' }).element, (n) => classes(n).includes('l4-seal')).textContent, 'Construcción');
});

test('fuera los textos de producción y el duplicado de fichas', () => {
  const scene = setup();
  const copy = spokenText(scene.element);
  for (const banned of ['a producir', 'Decorado de tramoya', 'repair', 'AQUÍ EL TALLER', 'Aquí va']) {
    assert.ok(!copy.includes(banned), `ningún aviso visible de ${banned}`);
  }
  for (const banned of ['a-producir', 'a producir', 'l4-note', 'l4-counterweights', 'l4-chip', 'l4-base']) {
    assert.ok(!sceneSource.includes(banned), `la escena no debe mencionar ${banned}`);
  }
  assert.ok(!cssSource.includes('Aquí va'), 'el css no deja huecos con texto de producción');
  assert.equal(
    findAll(scene.element, (n) => n.attributes['data-status'] === 'a producir').length,
    0,
    'nada pendiente: solo queda la pila real del parent',
  );
  for (const gone of ['l4-note', 'l4-counterweights', 'l4-chip', 'l4-base', 'l4-cord']) {
    assert.equal(findAll(scene.element, (n) => classes(n).includes(gone)).length, 0, `sin ${gone}`);
  }
});

test('slots finales con data-src y archivo en disco', () => {
  const scene = setup();
  const final = findAll(scene.element, (n) => n.attributes['data-status'] === 'final');
  assert.ok(final.length >= 6, 'fondo, selectores, palancas y los tres papeles marcados como final');
  const assets = final.map((n) => n.attributes['data-asset']).join(' ');
  const srcs = final.map((n) => n.attributes['data-src']).join(' ');
  const expected = {
    'n4.background': ['assets/levels/04/background.webp'],
    'n4.selectors': ['assets/levels/04/selectors.svg'],
    'n4.levers': ['assets/levels/04/lever-up.svg', 'assets/levels/04/lever-down.svg'],
    'levels.01.contract': ['assets/levels/01/props/contract.webp'],
    'levels.01.hint': ['assets/levels/01/props/hint.webp'],
    'levels.01.log': ['assets/levels/01/props/log.webp'],
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
  assert.ok(!spokenText(scene.element).includes('final'), 'el aviso vive en atributos, no en texto visible');
});

test('papeles con los assets finales del taller, rótulo debajo', () => {
  const scene = setup();
  const defs = {
    contract: ['assets/levels/01/props/contract.webp', 'levels.01.contract', 'Contrato'],
    hint: ['assets/levels/01/props/hint.webp', 'levels.01.hint', 'Pista'],
    log: ['assets/levels/01/props/log.webp', 'levels.01.log', 'Bitácora'],
  };
  for (const [action, [src, asset, name]] of Object.entries(defs)) {
    const paper = findOne(scene.element, (n) => n.tag === 'button' && n.getAttribute('data-action') === action);
    const image = findOne(paper, (n) => n.tag === 'img' && classes(n).includes('l4-paper-sheet'));
    assert.equal(image.getAttribute('src'), src, `el papel ${action} viste su asset`);
    assert.equal(image.getAttribute('alt'), '', 'imagen de papel sin texto alternativo');
    assert.equal(image.getAttribute('data-asset'), asset, 'slot del manifiesto');
    assert.equal(image.getAttribute('data-status'), 'final', 'asset final, no pendiente');
    assert.ok(existsSync(join(here, '..', src)), `${src} existe en disco`);
    assert.deepEqual(
      findAll(paper, (n) => classes(n).includes('l4-paper-name')).map((n) => n.textContent),
      [name],
      `el rótulo ${name} va debajo del papel`,
    );
  }
});

test('mesa de trabajo, luz y polvo como decorado estructural', () => {
  const scene = setup();
  for (const name of ['l4-bench', 'l4-light', 'l4-dust']) {
    const node = findOne(scene.element, (n) => classes(n).includes(name));
    assert.equal(node.getAttribute('aria-hidden'), 'true');
    assert.equal(node.getAttribute('data-placeholder'), null, `${name} es CSS, no un asset pendiente`);
  }
});

test('selectores de la pila: placa final con seis posiciones diegéticas', () => {
  const scene = setup();
  const selectors = findOne(scene.element, (n) => classes(n).includes('l4-selectors'));
  assert.equal(selectors.getAttribute('aria-hidden'), null, 'los selectores se tocan: nada de aria-hidden');
  assert.equal(selectors.attributes['data-asset'], 'n4.selectors');
  assert.equal(selectors.attributes['data-status'], 'final');
  assert.equal(selectors.attributes['data-src'], 'assets/levels/04/selectors.svg');
  assert.ok(
    existsSync(join(here, '..', 'assets/levels/04/selectors.svg')),
    'la placa existe en disco',
  );
  assert.ok(
    cssSource.includes('url("../../../assets/levels/04/selectors.svg")'),
    'la placa viste los diales por css',
  );
  const dialPlate = findOne(selectors, (n) => classes(n).includes('l4-dial-plate'));
  assert.equal(dialPlate.getAttribute('aria-hidden'), 'true', 'la placa es decorado');
  const groups = findAll(selectors, (n) => classes(n).includes('l4-dial-group'));
  assert.equal(groups.length, 2, 'arriba y acción');
  assert.equal(groups[0].getAttribute('role'), 'group');
  assert.equal(groups[0].getAttribute('aria-label'), 'Arriba de la pila');
  assert.equal(groups[1].getAttribute('aria-label'), 'Acción de la pila');
  for (const group of groups) {
    const title = findOne(group, (n) => classes(n).includes('l4-dial-title'));
    assert.equal(title.textContent, group.getAttribute('aria-label'), 'rótulo visible igual al nombre del grupo');
    assert.ok(findOne(group, (n) => classes(n).includes('l4-dial-row')), 'las posiciones comparten renglón');
  }
  const tops = findAll(scene.element, (n) => n.attributes['data-stack-top'] !== undefined);
  assert.deepEqual(
    tops.map((n) => n.attributes['data-stack-top']),
    ['any', 'base', 'chip'],
    'arriba: da igual, base, ficha',
  );
  const actions = findAll(scene.element, (n) => n.attributes['data-stack-action'] !== undefined);
  assert.deepEqual(
    actions.map((n) => n.attributes['data-stack-action']),
    ['keep', 'push', 'pop'],
    'acción: no tocar, cargar, soltar',
  );
  const dials = [...tops, ...actions];
  assert.equal(findAll(scene.element, (n) => classes(n).includes('l4-dial')).length, 6);
  for (const dial of dials) {
    assert.equal(dial.tag, 'button', 'posiciones clicables reales');
    assert.equal(dial.type, 'button');
    assert.ok(dial.getAttribute('aria-label'), 'cada posición dice qué hace');
    assert.equal(dial.getAttribute('data-action'), null, 'los diales no pisan data-action');
    assert.equal(findAll(dial, (n) => classes(n).includes('l4-dial-light')).length, 1, 'luz de latón por dial');
  }
  assert.deepEqual(
    dials.map((d) => findOne(d, (n) => classes(n).includes('l4-dial-name')).textContent),
    ['Da igual', 'Base', 'Ficha', 'No tocar', 'Cargar', 'Soltar'],
  );
  assert.equal(findAll(scene.element, (n) => n.listenerTypes().length > 0).length, 0, 'los diales no deciden: el parent los engancha');
});

test('diales como controles: borde, hover, luz y seleccionado inconfundible', () => {
  const [dial] = cssBlocks('.level-scene[data-level="4"] .l4-dial');
  assert.ok(dial, 'existe la regla del dial');
  assert.ok(cssHas(dial, 'min-width: 44px'), 'posición tocable');
  assert.ok(cssHas(dial, 'min-height: 44px'), 'posición tocable en alto');
  assert.ok(cssHas(dial, 'cursor: pointer'), 'se ve accionable');
  assert.ok(cssHas(dial, 'border: 1px solid var(--l4-brass)'), 'borde de latón');
  const [hover] = cssBlocks('.level-scene[data-level="4"] .l4-dial:hover');
  assert.ok(hover, 'el hover da brillo');
  const [title] = cssBlocks('.level-scene[data-level="4"] .l4-dial-title');
  assert.ok(title && cssHas(title, 'font-size: 12px'), 'rótulo de grupo a 12 px');
  assert.ok(cssHas(title, 'var(--l4-brass-2)'), 'rótulo con contraste sobre el fondo');
  const [name] = cssBlocks('.level-scene[data-level="4"] .l4-dial-name');
  assert.ok(name && cssHas(name, 'font-size: 14px'), 'la posición se lee a 14 px');
  const [light] = cssBlocks('.level-scene[data-level="4"] .l4-dial-light');
  assert.ok(light, 'existe la luz apagada');
  const [active] = cssBlocks('.level-scene[data-level="4"] .l4-dial.is-active');
  assert.ok(active, 'el parent puede marcar la posición activa');
  assert.ok(cssHas(active, 'inset'), 'placa hundida al seleccionar');
  assert.ok(cssHas(active, 'var(--l4-brass-2)'), 'borde dorado al seleccionar');
  const [lit] = cssBlocks('.level-scene[data-level="4"] .l4-dial.is-active .l4-dial-light');
  assert.ok(lit && cssHas(lit, 'box-shadow'), 'luz de latón encendida al seleccionar');
  assert.ok(cssSource.includes('.level-scene[data-level="4"] .l4-dial:focus-visible'), 'foco teal en el dial');
});

test('en inmersivo el título es del shell: sin encabezado interno y debajo del header', () => {
  const [head] = cssBlocks('.wb-scene.is-immersive .level-scene[data-level="4"] .l4-head');
  assert.ok(head, 'el shell retira el encabezado en inmersivo');
  assert.ok(cssHas(head, 'display: none'), 'sin título duplicado ni botones tapados');
  const immersive = cssBlocks('.wb-scene.is-immersive .level-scene[data-level="4"]');
  assert.equal(immersive.length, 2, 'reserva en desktop y en celular');
  assert.ok(immersive.some((block) => cssHas(block, 'padding-top: 84px')), 'la placa empieza debajo del header');
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
  const [rule] = cssBlocks('.level-scene[data-level="4"] .l4-legend');
  assert.ok(rule && cssHas(rule, 'margin:'), 'la franja respira: no queda pegada a la placa');
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
  for (const banned of ['autómata', 'AFD', 'AFND', 'transición', 'lenguaje']) {
    assert.ok(!spokenText(scene.element).includes(banned), `vocabulario de taller, sin ${banned}`);
  }
});

test('rig contenido con cabecera compacta y slots en su lugar', () => {
  const scene = setup();
  const rig = findOne(scene.element, (n) => classes(n).includes('l4-rig'));
  assert.ok(findOne(rig, (n) => classes(n).includes('l4-body')), 'el cuerpo vive en el rig');
  const head = findOne(scene.element, (n) => classes(n).includes('l4-head'));
  assert.ok(findOne(head, (n) => classes(n).includes('l4-titles')), 'títulos en la cabecera');
  assert.ok(
    findOne(scene.element, (n) => classes(n).includes('l4-plate')).children.includes(scene.editorSlot),
    'el editor vive en la placa',
  );
  const column = findOne(scene.element, (n) => classes(n).includes('l4-column'));
  assert.ok(column.children.includes(scene.statusSlot), 'la pila vive en la tramoya lateral');
  const leverRow = findOne(column, (n) => classes(n).includes('l4-lever-row'));
  assert.equal(leverRow.children.length, 2, 'PROBAR y ENSAYO comparten botonera');
  assert.ok(
    findOne(leverRow, (n) => n.tag === 'button' && n.getAttribute('data-action') === 'probe'),
    'la cuerda va en la fila',
  );
  assert.ok(
    findOne(leverRow, (n) => n.tag === 'button' && n.getAttribute('data-action') === 'assault'),
    'la palanca va en la fila',
  );
  const dock = findOne(scene.element, (n) => classes(n).includes('l4-dock'));
  const row = findOne(dock, (n) => classes(n).includes('l4-dock-row'));
  for (const action of ['contract', 'hint', 'log']) {
    assert.ok(
      findOne(row, (n) => n.tag === 'button' && n.getAttribute('data-action') === action),
      `el papel ${action} vive en la banda`,
    );
  }
  assert.ok(
    findOne(row, (n) => n.tag === 'button' && n.getAttribute('data-action') === 'cut'),
    'la tijera vive en la banda',
  );
  const panel = findOne(column, (n) => classes(n).includes('l4-selectors'));
  assert.ok(findOne(panel, (n) => classes(n).includes('l4-dial-groups')), 'los diales viven en la columna');
  assert.equal(
    findAll(row, (n) => classes(n).includes('l4-selectors')).length,
    0,
    'la banda queda sin diales',
  );
});

test('columna sin scroll y botonera en fila horizontal', () => {
  const [column] = cssBlocks('.level-scene[data-level="4"] .l4-column');
  assert.ok(column, 'existe la regla de la columna');
  assert.ok(cssHas(column, 'overflow: visible'), 'la columna no recorta: sin barra');
  assert.ok(!cssHas(column, 'overflow: auto'), 'nada de scroll interno en la columna');
  const [leverRow] = cssBlocks('.level-scene[data-level="4"] .l4-lever-row');
  assert.ok(leverRow, 'existe la botonera PROBAR/ENSAYO');
  assert.ok(cssHas(leverRow, 'display: flex'), 'los dos controles comparten fila');
  assert.ok(!cssHas(leverRow, 'flex-direction: column'), 'lado a lado, no apilados');
  const [twins] = cssBlocks('.level-scene[data-level="4"] .l4-lever-row .l4-probe,\n.level-scene[data-level="4"] .l4-lever-row .l4-assault');
  assert.ok(twins && cssHas(twins, 'flex: 1 1 0'), 'PROBAR y ENSAYO simétricos: mismo ancho y márgenes');
});

test('sello de fase como línea grabada y dispose', () => {
  const scene = setup({ phase: 'Construcción' });
  assert.equal(findOne(scene.element, (n) => classes(n).includes('l4-seal')).textContent, 'Construcción');
  const [seal] = cssBlocks('.level-scene[data-level="4"] .l4-seal');
  assert.ok(seal, 'existe la regla del sello');
  assert.ok(cssHas(seal, 'font-size: 14px'), 'el estado se lee a 14 px');
  scene.dispose();
  assert.equal(scene.element.removed, true);
});

test('css con alcance del nivel, foco y movimiento reducido', () => {
  const allowed = new Set(['@media', '@keyframes', '0%,', '100%', '50%', '0%', 'from', 'to']);
  for (const line of cssSource.split('\n')) {
    const brace = line.indexOf('{');
    if (brace === -1) {
      continue;
    }
    const selector = line.slice(0, brace).trim();
    if (selector === '' || [...allowed].some((prefix) => selector.startsWith(prefix))) {
      continue;
    }
    if (selector.startsWith('.wb-scene.is-immersive .level-scene[data-level="4"]')) {
      continue;
    }
    assert.ok(
      selector.startsWith('.level-scene[data-level="4"]'),
      `regla fuera del alcance del nivel 4: ${selector}`,
    );
  }
  assert.ok(cssSource.includes(':focus-visible'), 'foco visible para los props y lo que monte el parent');
  assert.ok(cssSource.includes('#38c6b8'), 'foco teal');
  assert.ok(cssSource.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
});

test('css usa las tipografías del mockup', () => {
  for (const family of ['"Cinzel"', '"Oswald"', '"Special Elite"']) {
    assert.ok(cssSource.includes(family), `falta la familia ${family}`);
  }
});

test('la escena ocupa toda la pantalla, sin recuadro', () => {
  const roots = cssBlocks('.level-scene[data-level="4"]');
  assert.equal(roots.length, 2, 'regla de raíz en desktop y en celular');
  for (const prop of ['position: absolute', 'inset: 0', 'height: 100%', 'grid-template-rows: minmax(0, 1fr) auto', 'max-height: 100%', 'min-height: 0', 'overflow: hidden', 'border-radius: 0']) {
    assert.ok(cssHas(roots[0], prop), `la raíz fija ${prop}`);
  }
  assert.ok(!cssHas(roots[0], 'border-radius: 12px'), 'la raíz no es una tarjeta');
  assert.ok(cssHas(roots[0], 'border: 0'), 'sin marcos en la raíz');
});

test('banda de mesa ordenada sin solapes: papeles, carretes centrados, tijera al lado, estado al final', () => {
  const [dock] = cssBlocks('.level-scene[data-level="4"] .l4-dock');
  assert.ok(dock, 'existe la regla de la banda');
  assert.ok(cssHas(dock, 'flex-direction: column'), 'la banda apila renglones');
  assert.ok(!cssHas(dock, 'absolute'), 'la banda va en flujo, no superpuesta');
  const [row] = cssBlocks('.level-scene[data-level="4"] .l4-dock-row');
  assert.ok(row, 'existe el renglón de la banda');
  assert.ok(cssHas(row, 'display: flex'), 'papeles, tijera y carretes comparten renglón');
  const [keys] = cssBlocks('.level-scene[data-level="4"] .l4-keys-slot');
  assert.ok(keys, 'existe la ranura de carretes');
  assert.ok(cssHas(keys, 'justify-content: center'), 'los carretes van centrados');
  assert.ok(cssHas(keys, 'min-height: 104px'), 'la ranura reserva alto de carrete + chapa');
  const [hud] = cssBlocks('.level-scene[data-level="4"] .l4-hud-slot');
  assert.ok(hud, 'existe la ranura del estado');
  assert.ok(cssHas(hud, 'font-size: 14px'), 'el estado se lee a 14 px');
  assert.ok(cssHas(hud, 'text-align: center'), 'el estado cierra la banda centrado');
  for (const sel of ['.level-scene[data-level="4"] .l4-papers', '.level-scene[data-level="4"] .l4-cut']) {
    const [block] = cssBlocks(sel);
    assert.ok(block, `existe ${sel}`);
    assert.ok(!cssHas(block, 'absolute'), `${sel} va en flujo, sin superponerse`);
  }
  const scene = setup();
  const bandRow = findOne(findOne(scene.element, (n) => classes(n).includes('l4-dock')), (n) => classes(n).includes('l4-dock-row'));
  const order = bandRow.children.map((n) => classes(n).join('.'));
  assert.deepEqual(
    order,
    ['l4-papers', 'l4-keys-slot', 'l4-cut'],
    'banda: papeles, carretes centrados y tijera al lado',
  );
});

test('la placa no pasa del 65% del ancho', () => {
  const [body] = cssBlocks('.level-scene[data-level="4"] .l4-body');
  assert.ok(body, 'existe la regla del cuerpo');
  assert.ok(cssHas(body, '65%'), 'la placa queda en el 65% y la tramoya lateral respira');
});

test('la placa es el centro, más grande sobre la mesa', () => {
  const [plate] = cssBlocks('.level-scene[data-level="4"] .l4-plate');
  assert.ok(plate, 'existe la regla de la placa');
  const [kicker] = cssBlocks('.level-scene[data-level="4"] .l4-kicker');
  assert.ok(cssHas(kicker, 'font-size: 24px'), 'título de placa más grande');
  const [head] = cssBlocks('.level-scene[data-level="4"] .l4-head');
  assert.ok(cssHas(head, 'justify-content: center'), 'cabecera centrada');
});

test('props sin caja, con foco teal y área de 44 px', () => {
  for (const selector of ['.l4-paper', '.l4-cut', '.l4-probe', '.l4-assault']) {
    assert.ok(cssSource.includes(`.level-scene[data-level="4"] ${selector}`), `el prop ${selector} tiene reglas propias`);
  }
  assert.ok(cssSource.includes('background: transparent'), 'los props no tienen caja de botón');
  assert.ok(cssSource.includes('min-height: 44px'), 'área táctil ≥44 px');
  assert.ok(cssSource.includes('.l4-cut.is-active'), 'el modo corte se ve en la tijera');
  assert.ok(cssSource.includes('.l4-paper-sheet'), 'los papeles visten su asset final');
});

test('la ranura de carretes no recorta: símbolo A/B siempre visible', () => {
  const [keys] = cssBlocks('.level-scene[data-level="4"] .l4-keys-slot');
  assert.ok(keys, 'existe la ranura de carretes');
  assert.ok(cssHas(keys, 'min-height: 104px'), 'alto de carrete + chapa con letra');
  for (const sel of ['.level-scene[data-level="4"] .l4-keys-slot', '.level-scene[data-level="4"] .l4-dock-row', '.level-scene[data-level="4"] .l4-dock']) {
    const [block] = cssBlocks(sel);
    assert.ok(block, `existe ${sel}`);
    assert.ok(!cssHas(block, 'overflow'), `${sel} sin recorte vertical`);
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

test('placa de selectores: la pila manda y el editor queda libre', () => {
  const [plate] = cssBlocks('.level-scene[data-level="4"] .l4-dial-plate');
  assert.ok(plate, 'existe la regla de la placa de diales');
  assert.ok(cssHas(plate, 'selectors.svg'), 'la placa viste los diales');
  const [group] = cssBlocks('.level-scene[data-level="4"] .l4-dial-group');
  assert.ok(group && cssHas(group, 'display: flex'), 'las posiciones comparten renglón');
  const [groups] = cssBlocks('.level-scene[data-level="4"] .l4-dial-groups');
  assert.ok(groups && cssHas(groups, 'display: flex'), 'los dos grupos van lado a lado en la banda');
});

test('ambiente animado solo con movimiento permitido', () => {
  const motionAt = cssSource.indexOf('prefers-reduced-motion: no-preference');
  assert.ok(motionAt > 0, 'las animaciones viven bajo no-preference');
  const motion = cssSource.slice(motionAt);
  for (const name of ['l4-drift', 'l4-sway', 'l4-glow', 'l4-touch', 'l4-rise']) {
    assert.ok(motion.includes(`@keyframes ${name}`), `existe ${name}`);
  }
  assert.ok(motion.includes('.l4-curtain'), 'el terciopelo tiene vaivén mínimo');
  assert.ok(motion.includes('.l4-assault'), 'la palanca tiene brillo');
  assert.ok(motion.includes('.l4-dust'), 'hay polvo de escenario');
  assert.ok(motion.includes('.l4-paper'), 'los papeles tienen roce');
  assert.ok(motion.includes('.l4-probe'), 'la cuerda se mece');
  assert.ok(motion.includes('infinite'), 'en bucle lento sin distraer');
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
  assert.ok(mobile.includes('.l4-dial-groups'), 'los grupos se apilan en móvil');
  assert.ok(mobile.includes('.l4-lever-row'), 'la botonera también envuelve en móvil');
  assert.ok(mobile.includes('.wb-scene.is-immersive'), 'el header flotante también reserva en móvil');
  assert.ok(mobile.includes('display: none'), 'la leyenda se esconde en móvil');
  assert.ok(mobile.includes('min-height: 240px'), 'el editor móvil reserva alto');
  const canvases = cssBlocks('.level-scene[data-level="4"] .l4-editor-slot #canvas');
  assert.equal(canvases.length, 2, 'regla de canvas en desktop y en celular');
  assert.ok(cssHas(canvases[1], 'width: 100%'), 'en celular el canvas escala por ancho');
  assert.ok(cssHas(canvases[1], 'height: auto'), 'en celular el canvas conserva proporción');
});
