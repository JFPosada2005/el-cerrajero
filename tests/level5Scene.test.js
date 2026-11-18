import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLevelScene } from '../src/ui/levels/level5Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level5Scene.js'), 'utf8');
const css = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level5.css'), 'utf8');

function element(tag) {
  const listeners = new Map();
  const node = {
    tag,
    children: [],
    textContent: '',
    className: '',
    removed: false,
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

const level = { id: 5, contract: '05', title: 'El banco central', client: 'Banco Central' };
const puzzle = {
  goal: 'Abre solo si el contador suma 1 al número de la cinta.',
  intro: 'El tambor de control quedó con una púa mal escrita.',
  sections: [
    { id: 'seek', label: 'Buscar el final', start: true },
    { id: 'carry', label: 'Llevar' },
    { id: 'done', label: 'Listo', accept: true },
  ],
  examples: { runs: [{ input: '1', output: '10' }] },
};

function setup(overrides = {}) {
  return createLevelScene({ level, puzzle, phase: 'repair', ...overrides });
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

function classes(node) {
  return (node.className || '').split(' ').filter(Boolean);
}

function textOf(root) {
  return findAll(root, () => true)
    .map((node) => node.textContent)
    .join(' ');
}

function textsWithNames(root) {
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

function blocksFor(fragment) {
  return css.split('}').filter((chunk) => chunk.includes(fragment));
}

test('raíz con data-level 5 y marco de sala de recuento', () => {
  const scene = setup();
  assert.equal(scene.element.tag, 'section');
  assert.ok(classes(scene.element).includes('level-scene'));
  assert.equal(scene.element.getAttribute('data-level'), '5');
  assert.equal(scene.element.getAttribute('aria-label'), 'Sala de recuento del Banco Central');
});

test('contrato element, editorSlot, statusSlot, keysSlot, hudSlot y dispose', () => {
  const scene = setup();
  assert.strictEqual(scene.editorSlot.getAttribute('data-slot'), 'editor');
  assert.equal(scene.editorSlot.getAttribute('aria-label'), 'Tambor y cinta del taller');
  assert.equal(scene.editorSlot.children.length, 0);
  assert.ok(findAll(scene.element, (node) => node === scene.editorSlot).length === 1);
  assert.strictEqual(scene.statusSlot.getAttribute('data-slot'), 'status');
  assert.equal(scene.statusSlot.getAttribute('aria-label'), 'Contador del mecanismo');
  assert.ok(findAll(scene.element, (node) => node === scene.statusSlot).length === 1);
  const slip = findAll(scene.element, (node) => classes(node).includes('counting-slip'))[0];
  assert.ok(findAll(slip, (node) => node === scene.statusSlot).length === 1, 'el contador vive en la boleta');
  assert.strictEqual(scene.keysSlot.getAttribute('data-slot'), 'keys');
  assert.equal(scene.keysSlot.children.length, 0, 'N5 no usa carretes: la ranura queda vacía');
  assert.notEqual(scene.keysSlot.getAttribute('hidden'), null, 'oculta hasta que el parent la necesite');
  assert.ok(findAll(scene.element, (node) => node === scene.keysSlot).length === 1);
  assert.strictEqual(scene.hudSlot.getAttribute('data-slot'), 'hud');
  assert.equal(scene.hudSlot.getAttribute('aria-label'), 'Lectura del mecanismo');
  assert.ok(findAll(scene.element, (node) => node === scene.hudSlot).length === 1);
  assert.deepEqual(scene.actions, ['contract', 'hint', 'log', 'probe', 'assault']);
  scene.dispose();
  assert.equal(scene.element.removed, true);
});

test('la escena no crea el editor real ni toca sus secciones', () => {
  assert.ok(!source.includes('drumEditor'), 'sin importar el editor de tambor');
  assert.ok(!source.includes('tapePanel'), 'sin importar el panel de cinta');
  assert.ok(!source.includes('handleProbe'), 'sin lógica de probar');
  assert.ok(!source.includes('handleAssault'), 'sin lógica de ensayo');
  assert.ok(!source.includes('toMachine'), 'sin construir máquinas');
  assert.ok(!source.includes('sections'), 'sin leer secciones: la protección de "Listo" queda en el editor');
  assert.ok(!source.includes('.innerHTML'), 'sin innerHTML');
  const scene = setup();
  for (const banned of ['drum-pin', 'drum-section', 'pin-editor', 'tape-cell', 'tape-marker']) {
    assert.equal(
      findAll(scene.element, (node) => classes(node).includes(banned)).length,
      0,
      `sin nodos .${banned}`,
    );
  }
  assert.equal(
    findAll(scene.element, (node) => node.listenerTypes().length > 0).length,
    0,
    'sin listeners: la escena no decide nada',
  );
});

test('un solo taller: sin cinta ni tambor decorativos duplicados', () => {
  const scene = setup();
  for (const mock of ['tape-mock', 'tape-mock-cell', 'tape-mock-hole', 'tape-mock-head', 'drum-mock', 'drum-mock-ring', 'drum-mock-pin']) {
    assert.equal(
      findAll(scene.element, (node) => classes(node).includes(mock)).length,
      0,
      `sin nodos .${mock}`,
    );
  }
  for (const frame of ['counting-tape-frame', 'counting-drum-frame', 'counting-cabinet']) {
    assert.equal(
      findAll(scene.element, (node) => classes(node).includes(frame)).length,
      0,
      `sin marco duplicado .${frame}`,
    );
  }
});

test('la placa enmarca el editor real y conserva los slots del mecanismo', () => {
  const scene = setup();
  const plate = findAll(scene.element, (node) => classes(node).includes('counting-bench-plate'))[0];
  assert.ok(plate, 'hay una sola placa de taller');
  assert.ok(findAll(plate, (node) => node === scene.editorSlot).length === 1, 'el editor real vive dentro de la placa');
  for (const slot of ['n5.tape', 'n5.head', 'n5.drum', 'n5.pin']) {
    assert.ok(String(plate.getAttribute('data-asset')).includes(slot), `la placa cubre ${slot}`);
  }
  const rail = findAll(scene.element, (node) => classes(node).includes('plate-rail'))[0];
  assert.ok(rail, 'el riel del cabezal es atmósfera');
  assert.equal(rail.getAttribute('aria-hidden'), 'true', 'el riel queda fuera del lector');
  assert.equal(
    findAll(rail, (node) => ['tape-mock-cell', 'drum-mock-pin', 'drum-pin', 'tape-cell'].some((banned) => classes(node).includes(banned))).length,
    0,
    'el riel no trae casillas ni púas',
  );
});

test('slots finales con data-src y archivo en disco', () => {
  const scene = setup();
  const final = findAll(scene.element, (node) => node.getAttribute('data-status') === 'final');
  assert.ok(final.length >= 2, 'fondo y placa del mecanismo marcados como final');
  const assets = final.map((node) => node.getAttribute('data-asset')).join(' ');
  const srcs = final.map((node) => node.getAttribute('data-src')).join(' ');
  const expected = {
    'n5.background': 'assets/levels/05/background.webp',
    'n5.tape': 'assets/levels/05/tape.svg',
    'n5.head': 'assets/levels/05/head.webp',
    'n5.drum': 'assets/levels/05/drum.webp',
    'n5.pin': 'assets/levels/05/pin.svg',
    'levels.01.contract': 'assets/levels/01/props/contract.webp',
    'levels.01.hint': 'assets/levels/01/props/hint.webp',
    'levels.01.log': 'assets/levels/01/props/log.webp',
    'levels.05.depositSlip': 'assets/levels/05/deposit-slip.webp',
  };
  for (const [slot, src] of Object.entries(expected)) {
    assert.ok(assets.includes(slot), `slot final ${slot}`);
    assert.ok(srcs.includes(src), `data-src con ${src}`);
    assert.ok(existsSync(join(here, '..', src)), `${src} existe en disco`);
  }
  assert.ok(textOf(scene.element).includes('final') === false, 'el aviso vive en atributos, no en texto visible');
});

test('la boleta es final con su asset en disco', () => {
  const scene = setup();
  const pending = findAll(scene.element, (node) => node.getAttribute('data-status') === 'a producir');
  assert.equal(pending.length, 0, 'nada sigue a producir');
  const slip = findAll(scene.element, (node) => classes(node).includes('counting-slip'))[0];
  assert.ok(slip, 'hay boleta de depósito');
  assert.equal(slip.getAttribute('data-asset'), 'levels.05.depositSlip', 'la boleta cubre levels.05.depositSlip');
  assert.equal(slip.getAttribute('data-status'), 'final', 'la boleta es asset final');
  assert.equal(slip.getAttribute('data-src'), 'assets/levels/05/deposit-slip.webp');
  assert.ok(existsSync(join(here, '..', 'assets/levels/05/deposit-slip.webp')), 'la boleta existe en disco');
});

test('sin sello duplicado: el papel trae la casilla vacía', () => {
  const scene = setup();
  const slip = findAll(scene.element, (node) => classes(node).includes('counting-slip'))[0];
  assert.equal(
    findAll(slip, (node) => classes(node).includes('slip-seal')).length,
    1,
    'un solo lacre: el asset no trae sello dibujado',
  );
  const stamps = findAll(slip, (node) => classes(node).includes('slip-stamp'));
  assert.equal(stamps.length, 1, 'un solo cuño en texto');
  assert.ok(stamps[0].textContent.includes('reparaci'), 'el cuño marca la fase');
});

test('props diegéticos con data-action: papeles, manivela y volante', () => {
  const scene = setup();
  const buttons = findAll(scene.element, (node) => node.tag === 'button');
  assert.equal(buttons.length, 5, `los cinco props diegéticos son botones, hay ${buttons.length}`);
  const byAction = {};
  for (const button of buttons) {
    byAction[button.getAttribute('data-action')] = button;
  }
  assert.deepEqual(
    Object.keys(byAction).sort(),
    ['assault', 'contract', 'hint', 'log', 'probe'],
    'cada botón emite su intención con data-action',
  );
  for (const button of buttons) {
    assert.equal(button.type, 'button', 'botones reales');
    assert.ok(button.getAttribute('aria-label'), 'todo prop accionable tiene nombre accesible');
    assert.ok(Number.isInteger(button.children.length), 'el prop conserva su contenido');
  }
  assert.equal(byAction.contract.getAttribute('aria-label'), 'Abrir el contrato');
  assert.equal(byAction.hint.getAttribute('aria-label'), 'Pedir una pista');
  assert.equal(byAction.log.getAttribute('aria-label'), 'Abrir la bitácora');
  assert.equal(byAction.probe.getAttribute('aria-label'), 'Probar la cinta en el tambor');
  assert.equal(byAction.assault.getAttribute('aria-label'), 'Pedir el ensayo de la bóveda');
  assert.ok(classes(byAction.contract).includes('counting-paper'), 'el contrato es un papel sobre la mesa');
  assert.ok(classes(byAction.hint).includes('counting-paper'), 'la pista es un papel sobre la mesa');
  assert.ok(classes(byAction.log).includes('counting-paper'), 'la bitácora es un papel sobre la mesa');
  assert.ok(classes(byAction.probe).includes('counting-crank'), 'la manivela del tambor prueba');
  assert.ok(classes(byAction.assault).includes('counting-wheel'), 'el volante de la bóveda ensaya');
  assert.deepEqual(
    findAll(byAction.contract, (node) => classes(node).includes('counting-paper-name')).map((node) => node.textContent),
    ['Contrato'],
    'el papel conserva su rótulo visible',
  );
});

test('papeles con los assets finales de contrato, pista y bitácora', () => {
  const scene = setup();
  const buttons = findAll(scene.element, (node) => node.tag === 'button');
  const byAction = {};
  for (const button of buttons) {
    byAction[button.getAttribute('data-action')] = button;
  }
  const papers = [
    ['contract', 'assets/levels/01/props/contract.webp', 'levels.01.contract', 'Contrato'],
    ['hint', 'assets/levels/01/props/hint.webp', 'levels.01.hint', 'Pista'],
    ['log', 'assets/levels/01/props/log.webp', 'levels.01.log', 'Bitácora'],
  ];
  for (const [action, src, asset, name] of papers) {
    const button = byAction[action];
    assert.ok(button, `hay prop ${action}`);
    const images = findAll(button, (node) => node.tag === 'img');
    assert.equal(images.length, 1, `el prop ${action} trae su imagen final`);
    const image = images[0];
    assert.equal(image.getAttribute('src'), src, `el prop ${action} usa ${src}`);
    assert.equal(image.getAttribute('alt'), '', 'el alt queda vacío: el nombre lo da el aria-label');
    assert.equal(image.getAttribute('data-asset'), asset, `el prop ${action} declara ${asset}`);
    assert.equal(image.getAttribute('data-status'), 'final', 'el papel es asset final');
    assert.equal(image.getAttribute('data-src'), src, 'data-src apunta al archivo real');
    assert.ok(existsSync(join(here, '..', src)), `${src} existe en disco`);
    assert.strictEqual(button.children[0], image, 'la imagen va arriba');
    const names = findAll(button, (node) => classes(node).includes('counting-paper-name'));
    assert.deepEqual(
      names.map((node) => node.textContent),
      [name],
      'el rótulo va debajo de la imagen',
    );
  }
});

test('sin textos de producción visibles', () => {
  const scene = setup();
  const visible = textOf(scene.element);
  for (const banned of ['a producir', 'PROBAR LA CINTA', 'ENSAYO', 'Decorado', 'tramoya', 'aloja el editor', 'AQUÍ EL TALLER']) {
    assert.ok(!visible.includes(banned), `sin "${banned}" en la escena`);
  }
  for (const banned of ['PROBAR LA CINTA', 'handleProbe', 'AQUÍ EL TALLER', 'a producir la boleta']) {
    assert.ok(!source.includes(banned), `sin "${banned}" en el código`);
  }
});

test('decoración fuera del lector y vocabulario de taller', () => {
  const scene = setup();
  const hidden = findAll(scene.element, (node) => node.getAttribute('aria-hidden') === 'true');
  assert.ok(hidden.length >= 2, 'fondo y maquetas decorativas ocultas al lector');
  const banned = ['autómata', 'estado', 'transición', 'lenguaje', 'AFD', 'AFND'];
  const haystack = `${source} ${textsWithNames(scene.element)}`;
  for (const word of banned) {
    assert.ok(!haystack.includes(word), `sin "${word}" en la escena`);
  }
  assert.ok(!source.includes('createElementNS'), 'placeholders con CSS/DOM, sin SVG propio');
});

test('la escena ocupa toda la ventana, sin recuadro', () => {
  const rootAt = css.indexOf('.level-scene[data-level="5"] {');
  assert.ok(rootAt >= 0, 'la raíz tiene regla propia');
  const root = css.slice(rootAt, css.indexOf('}', rootAt));
  assert.ok(root.includes('position: absolute'), 'la escena sale del flujo');
  assert.ok(root.includes('inset: 0'), 'cubre todo el stage');
  assert.ok(root.includes('height: 100%'), 'alto completo');
  assert.ok(root.includes('margin: 0'), 'sin margen que deje aire muerto');
  assert.ok(root.includes('padding: 0'), 'sin relleno que deje aire muerto');
  assert.ok(root.includes('border: 0'), 'sin borde de recuadro');
  assert.ok(root.includes('border-radius: 0'), 'sin marco redondeado');
  const backdrop = blocksFor('.counting-backdrop {').join('\n');
  assert.ok(backdrop.includes('background-size: cover'), 'la bóveda cubre con cover');
  assert.ok(css.includes('.wb-scene.is-immersive'), 'el css convive con el shell inmersivo');
});

test('la placa es el centro, más grande sobre la mesa', () => {
  const plateAt = css.indexOf('\n.level-scene[data-level="5"] .counting-bench-plate {');
  assert.ok(plateAt > 0, 'la placa tiene regla propia');
  const plate = css.slice(plateAt, css.indexOf('}', plateAt));
  assert.ok(plate.includes('left: 50%'), 'centrada');
  assert.ok(plate.includes('translateX(-50%)'), 'centrada con translate');
  assert.ok(plate.includes('width: min('), 'más grande con el alto liberado');
});

test('sin encabezado interno que tape el header del shell', () => {
  const scene = setup();
  assert.equal(
    findAll(scene.element, (node) => classes(node).includes('counting-head')).length,
    0,
    'sin encabezado interno en la escena',
  );
  assert.equal(
    findAll(scene.element, (node) =>
      ['counting-kicker', 'counting-title', 'counting-phase'].some((banned) => classes(node).includes(banned)),
    ).length,
    0,
    'sin título duplicado del shell',
  );
  const top = findAll(scene.element, (node) => classes(node).includes('plate-top'))[0];
  assert.ok(!textOf(top).includes('Banco Central'), 'la placa no repite el título del shell');
  const headAt = css.indexOf('.wb-scene.is-immersive .level-scene[data-level="5"] .counting-head');
  assert.ok(headAt > 0, 'regla defensiva en inmersivo');
  const headRule = css.slice(headAt, css.indexOf('}', headAt));
  assert.ok(headRule.includes('display: none'), 'el encabezado interno queda oculto en inmersivo');
});

test('la placa vive entre el header y la mesa', () => {
  const plateAt = css.indexOf('\n.level-scene[data-level="5"] .counting-bench-plate {');
  const plate = css.slice(plateAt, css.indexOf('}', plateAt));
  const top = plate.match(/top\s*:\s*(\d+)px/);
  assert.ok(top !== null && Number(top[1]) <= 16, 'la placa arranca arriba del stage, sin aire muerto');
  const bottom = plate.match(/bottom\s*:\s*(\d+)px/);
  assert.ok(bottom !== null && Number(bottom[1]) <= 160, 'la placa baja hasta la banda de mesa');
  const immersiveAt = css.indexOf('.wb-scene.is-immersive .level-scene[data-level="5"] .counting-bench-plate');
  assert.ok(immersiveAt > 0, 'regla para el header flotante');
  const immersive = css.slice(immersiveAt, css.indexOf('}', immersiveAt));
  const immersiveTop = immersive.match(/top\s*:\s*(\d+)px/);
  assert.ok(immersiveTop !== null && Number(immersiveTop[1]) >= 84, 'en inmersivo empieza debajo del header');
  assert.ok(css.includes('overflow: hidden'), 'nada pinta fuera del stage');
  const mobile = css.slice(css.indexOf('@media (max-width: 900px)'));
  assert.ok(mobile.includes('left: 8px'), 'móvil sin salientes: anclaje a 8 px');
  assert.ok(mobile.includes('top: 120px'), 'móvil: la placa empieza debajo del header de 113 px');
});

test('estado sin franja: boleta, hud y línea grabada a 14 px', () => {
  const scene = setup();
  const line = findAll(scene.element, (node) => classes(node).includes('plate-state'))[0];
  assert.ok(line, 'hay línea grabada en la placa');
  assert.ok(line.textContent.includes('En reparación'), 'la línea lee la fase');
  const lineCss = blocksFor('.plate-state').join('\n');
  assert.ok(lineCss.includes('font-size: 14px'), 'la línea grabada va a 14 px');
  const statusCss = blocksFor('.counting-status').join('\n');
  assert.ok(statusCss.includes('font-size: 14px'), 'el contador de la boleta va a 14 px');
  const hudCss = blocksFor('.counting-hud').join('\n');
  assert.ok(hudCss.includes('font-size: 14px'), 'la línea del shell va a 14 px');
  assert.ok(hudCss.includes('transparent'), 'el hud no trae franja de panel');
  assert.ok(hudCss.includes('border: 0'), 'el hud no trae borde de franja');
  scene.setPhase('build');
  assert.ok(line.textContent.includes('construcci'), 'la línea sigue a la fase');
});

test('ranuras del shell: keys y hud sobre la mesa, sin solapes', () => {
  const keysCss = blocksFor('.counting-keys').join('\n');
  assert.ok(keysCss.includes('position: absolute'), 'keys vive sobre la mesa');
  assert.ok(css.includes('.counting-keys[hidden]'), 'keys oculta en N5 sin carretes');
  const hudCss = blocksFor('.counting-hud').join('\n');
  assert.ok(hudCss.includes('position: absolute'), 'hud vive sobre la mesa');
  assert.ok(hudCss.includes('left: 50%'), 'hud centrado en la mesa');
  assert.ok(hudCss.includes('max-width'), 'hud acotado: no tapa la boleta ni los papeles');
  assert.ok(hudCss.includes('bottom:'), 'hud como última línea de la mesa');
  const mobileAt = css.indexOf('@media (max-width: 900px)');
  assert.ok(mobileAt > 0, 'hay reglas móviles');
  const mobile = css.slice(mobileAt);
  assert.ok(mobile.includes('.counting-hud'), 'el hud tiene regla móvil');
  assert.ok(mobile.includes('right: 8px'), 'el hud no abre scroll horizontal en 390');
});

test('css diegético: props como botones, foco teal y 44 px', () => {
  for (const selector of ['.counting-paper', '.counting-crank', '.counting-wheel']) {
    assert.ok(css.includes(selector), `el prop ${selector} tiene reglas propias`);
  }
  assert.ok(css.includes('min-height: 44px'), 'área táctil ≥44 px');
  assert.ok(css.includes(':focus-visible'), 'foco visible');
  assert.ok(css.includes('#38c6b8'), 'foco visible con contorno teal');
  const paper = blocksFor('.counting-paper {').join('\n');
  assert.ok(paper.includes('background: transparent'), 'los papeles son imagen final, sin caja');
  assert.ok(paper.includes('border: 0'), 'los papeles no traen borde de botón');
  const paperImg = blocksFor('.counting-paper img').join('\n');
  assert.ok(paperImg.includes('width:'), 'la imagen del papel tiene tamaño propio');
  assert.ok(paperImg.includes('pointer-events: none'), 'la imagen no intercepta el botón');
  for (const prop of ['.counting-crank {', '.counting-wheel {']) {
    const block = blocksFor(prop).join('\n');
    assert.ok(block.includes('background: transparent'), `${prop} sin caja de botón`);
    assert.ok(block.includes('border: 0'), `${prop} sin borde de botón`);
  }
});

test('ambiente animado solo con movimiento permitido', () => {
  const motionAt = css.indexOf('prefers-reduced-motion: no-preference');
  assert.ok(motionAt > 0, 'las animaciones viven bajo no-preference');
  const motion = css.slice(motionAt);
  for (const name of ['counting-wheel-spin', 'counting-head-blink', 'counting-seal-glow']) {
    assert.ok(motion.includes(`@keyframes ${name}`), `existe ${name}`);
  }
  assert.ok(motion.includes('.wheel-ring'), 'el volante gira lento');
  assert.ok(motion.includes('.plate-rail-notch'), 'el cabezal parpadea');
  assert.ok(motion.includes('.slip-seal'), 'el lacre brilla');
  assert.ok(motion.includes('infinite'), 'en bucle');
  assert.ok(motion.includes('24s') || motion.includes('20s'), 'giro lento del volante');
  assert.ok(css.includes('prefers-reduced-motion: reduce'), 'respeta movimiento reducido');
});

test('el tambor y la cinta reales no se animan', () => {
  const motionAt = css.indexOf('prefers-reduced-motion: no-preference');
  const motion = css.slice(motionAt);
  for (const selector of ['.tape-cell', '.drum-pin', '#drum', '#tape-panel']) {
    assert.ok(!motion.includes(selector), `sin animar ${selector}: el editor real manda`);
  }
});

test('tambor legible: púas y casillas a 44 px, icono aparte del texto', () => {
  const pinCss = blocksFor('.drum-pin').join('\n');
  assert.ok(pinCss.includes('min-height: 44px'), 'púas con target de 44 px');
  assert.ok(pinCss.includes('display: flex'), 'la púa es fila: icono y texto lado a lado');
  assert.ok(pinCss.includes('gap: 8px'), 'gap entre icono y texto');
  const iconCss = blocksFor('.drum-pin::before').join('\n');
  assert.ok(iconCss.includes('assets/levels/05/pin.svg'), 'el icono vive a la izquierda');
  assert.ok(iconCss.includes('width: 28px'), 'icono reservado de 28 px');
  const pinsCss = blocksFor('.drum-pins').join('\n');
  assert.ok(pinsCss.includes('display: flex'), 'las tres púas comparten una fila');
  const readCss = blocksFor('.drum-read').join('\n');
  assert.ok(readCss.includes('display: block'), 'el texto va en bloque a la derecha');
  assert.ok(readCss.includes('font-size: 12px'), 'palabras de púa a 12 px');
  assert.ok(readCss.includes('white-space: normal'), 'palabras completas, sin recorte');
  assert.ok(!readCss.includes('text-overflow: ellipsis'), 'sin puntos suspensivos');
  assert.ok(!readCss.includes('overflow: hidden'), 'sin recorte');
  const cellCss = blocksFor('.tape-cell').join('\n');
  assert.ok(cellCss.includes('min-height: 44px'), 'casillas con target de 44 px');
  assert.ok(cellCss.includes('font-size: 15px'), 'símbolos de cinta legibles');
  const titleCss = blocksFor('.drum-title').join('\n');
  assert.ok(titleCss.includes('font-size: 12px'), 'etiquetas de sección a 12 px');
  const markerCss = blocksFor('.tape-marker').join('\n');
  assert.ok(markerCss.includes('display: block'), 'la marca no mueve el símbolo');
});

test('a 1440 las tres secciones entran sin scroll: presupuesto declarado', () => {
  const plateAt = css.indexOf('\n.level-scene[data-level="5"] .counting-bench-plate {');
  const plate = css.slice(plateAt, css.indexOf('}', plateAt));
  const top = plate.match(/top\s*:\s*(\d+)px/);
  const bottom = plate.match(/bottom\s*:\s*(\d+)px/);
  assert.ok(top !== null && bottom !== null, 'placa anclada arriba y abajo');
  const offsets = Number(top[1]) + Number(bottom[1]);
  // Cromo de la placa: paddings 12 + rótulo 14 + riel 34 + leyenda 18 + línea 23 + editor 10.
  const chrome = 12 + 14 + 34 + 18 + 23 + 10;
  // Contenido: cinta compacta 67 + tres secciones (74 cada una + gaps 4).
  const content = 67 + (74 * 3 + 4);
  // Con stage drum-room de 605 px (1440×900) sobran píxeles: LISTO visible.
  assert.ok(605 - offsets >= chrome + content, `placa útil ${605 - offsets} px para ${chrome + content} px`);
  // Cuando el shell corrija el stage a 816, el sobrante lo absorben las
  // secciones (reparto flex), no queda aire muerto bajo el tambor.
  assert.ok(816 - offsets >= chrome + content, 'también entra con stage a 816');
  const immersiveAt = css.indexOf('.wb-scene.is-immersive .level-scene[data-level="5"] .counting-bench-plate {');
  const immersive = css.slice(immersiveAt, css.indexOf('}', immersiveAt));
  const immersiveTop = immersive.match(/top\s*:\s*(\d+)px/);
  const immersiveBottom = immersive.match(/bottom\s*:\s*(\d+)px/);
  assert.ok(immersiveTop !== null && immersiveBottom !== null, 'anclaje inmersivo declarado');
  assert.ok(816 - Number(immersiveTop[1]) - Number(immersiveBottom[1]) >= chrome + content, 'también entra en inmersivo a 816');
  const editorCss = blocksFor('.counting-editor').join('\n');
  assert.ok(editorCss.includes('padding: 4px'), 'marco del editor compacto');
  assert.ok(editorCss.includes('overflow: auto'), 'el scroll queda solo como red');
  assert.ok(editorCss.includes('display: flex'), 'el editor reparte el alto');
  assert.ok(editorCss.includes('flex-direction: column'), 'cinta arriba, tambor con el resto');
  const tapePanelCss = blocksFor('#tape-panel {').join('\n');
  assert.ok(tapePanelCss.includes('flex: none'), 'la cinta no se comprime');
  const drumColCss = blocksFor('#drum .drum {').join('\n');
  assert.ok(drumColCss.includes('flex-direction: column'), 'secciones apiladas en orden');
  assert.ok(drumColCss.includes('flex: 1'), 'el tambor toma el alto libre');
  const drumRootCss = blocksFor('#drum {').join('\n');
  assert.ok(drumRootCss.includes('flex: 1'), 'la raíz del tambor crece con el editor');
  const sectionCss = blocksFor('.drum-section').join('\n');
  assert.ok(sectionCss.includes('padding: 6px'), 'secciones compactas');
  assert.ok(sectionCss.includes('margin: 0'), 'sin margen que empuje LISTO afuera');
  assert.ok(sectionCss.includes('flex: 1'), 'las secciones se reparten el alto libre');
  const pinsCss = blocksFor('.drum-pins').join('\n');
  assert.ok(pinsCss.includes('align-items: flex-start'), 'las púas quedan arriba con 44 px');
  const drumCss = blocksFor('#drum .drum {').join('\n');
  assert.ok(drumCss.includes('flex-direction: column'), 'secciones apiladas en orden');
  const tapeCss = blocksFor('#tape-panel {').join('\n');
  assert.ok(tapeCss.includes('margin-bottom: 2px'), 'cinta compacta sobre el tambor');
});

test('el panel de púa vive dentro del marco y lo cierra el editor', () => {
  const pinEditorCss = blocksFor('.pin-editor').join('\n');
  assert.ok(!pinEditorCss.includes('display'), 'la escena no fuerza la visibilidad del panel');
  const sized = pinEditorCss.replace(/min-height|max-height|line-height/g, '');
  assert.ok(!sized.includes('height:'), 'sin altura fija: el editor decide cuándo se ve');
  const editorCss = blocksFor('.counting-editor').join('\n');
  assert.ok(editorCss.includes('overflow: auto'), 'el marco contiene el panel con scroll interno');
});

test('setPhase mueve la línea grabada y el cuño', () => {
  const scene = setup();
  const stamp = findAll(scene.element, (node) => classes(node).includes('slip-stamp'))[0];
  assert.ok(stamp.textContent.includes('reparaci'), 'el cuño marca la reparación');
  scene.setPhase('build');
  assert.ok(stamp.textContent.includes('construcci'), 'el cuño sigue a la fase');
});

test('la boleta muestra los datos por textContent, sin parsear marcas', () => {
  const evil = '<img src=x onerror=alert(1)> & <b>negrita</b>';
  const scene = createLevelScene({
    level,
    puzzle: { ...puzzle, goal: evil },
    phase: 'repair',
  });
  const texts = findAll(scene.element, (node) => node.textContent === evil);
  assert.ok(texts.length >= 1, 'la regla conserva el texto literal');
  for (const node of texts) {
    assert.equal(node.children.length, 0, 'el texto con marcas no se parsea como nodos');
  }
});

test('la boleta es papel ivory con sello, cuño y pie', () => {
  const scene = setup();
  const slip = findAll(scene.element, (node) => classes(node).includes('counting-slip'))[0];
  assert.ok(slip, 'hay boleta de depósito');
  const seal = findAll(slip, (node) => classes(node).includes('slip-seal'))[0];
  assert.ok(seal, 'la boleta trae lacre');
  assert.equal(seal.getAttribute('aria-hidden'), 'true', 'el lacre queda fuera del lector');
  const stamp = findAll(slip, (node) => classes(node).includes('slip-stamp'))[0];
  assert.ok(stamp, 'la boleta trae cuño de fase');
  const foot = findAll(slip, (node) => classes(node).includes('slip-foot'))[0];
  assert.ok(foot, 'la boleta trae pie de caja');
  assert.ok(textOf(scene.element).includes('Banco Central'), 'la boleta nombra al cliente');
  const slipCss = blocksFor('.counting-slip {').join('\n');
  assert.ok(slipCss.includes('max-width: 100%'), 'la boleta no supera su marco');
  const stampBlocks = blocksFor('.slip-stamp {').join('\n');
  assert.ok(!stampBlocks.includes('position: absolute'), 'el cuño no flota sobre el texto');
});

test('css cálido de sala de recuento, sin texto bajo 12 px', () => {
  for (const selector of ['.counting-light', '.plate-rivet', '.rail-hole', '.slip-seal', '.slip-stamp', '.slip-foot']) {
    assert.ok(css.includes(selector), `la atmósfera pinta ${selector}`);
  }
  const sizes = [...css.matchAll(/font-size\s*:\s*([^;]+);/g)].map((match) => match[1].trim());
  const tooSmall = sizes.filter((value) => {
    const match = value.match(/^(\d+(?:\.\d+)?)px$/);
    return match !== null && Number(match[1]) < 12;
  });
  assert.deepEqual(tooSmall, []);
});

test('css con alcance, 44px, foco y movimiento reducido, con imágenes finales y fallback', () => {
  assert.ok(css.includes('.level-scene[data-level="5"]'), 'alcance a la escena del nivel 5');
  assert.ok(css.includes('min-height: 44px'), 'toques de 44 px');
  assert.ok(css.includes(':focus-visible'), 'foco visible');
  assert.ok(css.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
  for (const asset of [
    'assets/levels/05/background.webp',
    'assets/levels/05/tape.svg',
    'assets/levels/05/pin.svg',
    'assets/levels/05/drum.webp',
    'assets/levels/05/head.webp',
    'assets/levels/05/deposit-slip.webp',
  ]) {
    assert.ok(css.includes(asset), `el css usa ${asset}`);
    assert.ok(existsSync(join(here, '..', asset)), `${asset} existe en disco`);
  }
  assert.ok(css.includes('linear-gradient'), 'los gradientes siguen como fallback');
  assert.ok(css.includes('background-size: cover'), 'el fondo cubre la sala');
  assert.ok(css.includes('background-size: contain'), 'cinta y púa conservan su dibujo');
});

test('cinta y púa visten al editor real sin romper sus estados', () => {
  const tapeBlocks = blocksFor('.tape-cell').join('\n');
  assert.ok(tapeBlocks.includes('assets/levels/05/tape.svg'), 'la casilla usa tape.svg');
  const pinBlocks = blocksFor('.drum-pin').join('\n');
  assert.ok(pinBlocks.includes('assets/levels/05/pin.svg'), 'la púa usa pin.svg');
  for (const state of ['.tape-cell.is-head', '.drum-pin.is-lit', '.drum-pin.is-final', ':focus-visible']) {
    assert.ok(css.includes(state), `el estado ${state} sigue pintado`);
  }
});

test('tambor y cabezal solo como cromo tenue de la placa y el riel', () => {
  const plateBlocks = blocksFor('.counting-bench-plate::before').join('\n');
  assert.ok(plateBlocks.includes('assets/levels/05/drum.webp'), 'el tambor decora la placa');
  const railBlocks = blocksFor('.plate-rail::after').join('\n');
  assert.ok(railBlocks.includes('assets/levels/05/head.webp'), 'el cabezal decora el riel');
  for (const block of [plateBlocks, railBlocks]) {
    const opacity = block.match(/opacity\s*:\s*([\d.]+)/);
    assert.ok(opacity !== null && Number(opacity[1]) <= 0.35, 'cromo tenue que no compite con el mecanismo');
    assert.ok(/pointer-events\s*:\s*none/.test(block), 'el cromo no intercepta el editor');
  }
});

test('css integra el editor real en la placa y limita el alto al marco', () => {
  for (const selector of ['#tape-panel', '#drum', '.drum-section', '.drum-pin', '.tape-cell']) {
    assert.ok(css.includes(selector), `la placa integra ${selector}`);
  }
  assert.ok(css.includes('.counting-editor'), 'el editor real tiene marco propio');
  assert.ok(css.includes('overflow'), 'el desborde queda contenido');
  assert.ok(css.includes('max-height: 100%'), 'la escena no supera el marco del taller');
});

test('atmósfera de sala: luz cálida y herrajes sin duplicar el mecanismo', () => {
  const scene = setup();
  const light = findAll(scene.element, (node) => classes(node).includes('counting-light'))[0];
  assert.ok(light, 'hay una capa de luz cálida');
  assert.equal(light.getAttribute('aria-hidden'), 'true', 'la luz queda fuera del lector');
  const plate = findAll(scene.element, (node) => classes(node).includes('counting-bench-plate'))[0];
  const top = findAll(plate, (node) => classes(node).includes('plate-top'))[0];
  assert.ok(top, 'la placa trae rótulo de taller');
  assert.ok(textOf(top).includes('Caja 05'), 'el rótulo nombra la caja');
  const rivets = findAll(plate, (node) => classes(node).includes('plate-rivet'));
  assert.ok(rivets.length >= 4, 'la placa trae remaches de latón');
  const rail = findAll(scene.element, (node) => classes(node).includes('plate-rail'))[0];
  const holes = findAll(rail, (node) => classes(node).includes('rail-hole'));
  assert.ok(holes.length >= 8, 'el riel trae cinta perforada de atmósfera');
  for (const banned of ['drum-pin', 'drum-section', 'pin-editor', 'tape-cell', 'tape-mock-cell']) {
    assert.equal(
      findAll(rail, (node) => classes(node).includes(banned)).length,
      0,
      `el riel no trae .${banned}`,
    );
  }
});

test('la leyenda de la placa habla en personaje', () => {
  const scene = setup();
  const caption = findAll(scene.element, (node) => classes(node).includes('plate-caption'))[0];
  assert.ok(caption, 'hay leyenda sobre la placa');
  assert.ok(caption.textContent.includes('cinta'), 'la leyenda habla de la cinta');
  assert.ok(!caption.textContent.includes('trabajan sobre esta placa'), 'fuera la nota de producción');
});
