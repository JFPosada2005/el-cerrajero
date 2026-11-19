import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLevelScene } from '../src/ui/levels/level3Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const sceneSource = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level3Scene.js'), 'utf8');
const sceneCss = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level3.css'), 'utf8');
const manifest = JSON.parse(
  readFileSync(join(here, '..', 'assets', 'manifest.json'), 'utf8'),
);

function manifestFinal(slot) {
  const [area, ...rest] = slot.split('.');
  if (area === 'levels') {
    const [group, ...keyParts] = rest;
    return manifest[area][group][keyParts.join('.')].final;
  }
  return manifest[area][rest.join('.')].final;
}

// --- DOM falso mínimo (createElement + createElementNS + árbol) ---
function fakeElement(tag, ns = null) {
  return {
    tag,
    ns,
    children: [],
    parentNode: null,
    className: '',
    textContent: '',
    attributes: {},
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
    removeChild(child) {
      this.children = this.children.filter((entry) => entry !== child);
      child.parentNode = null;
      return child;
    },
    remove() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    },
  };
}

globalThis.document = {
  createElement: (tag) => fakeElement(tag),
  createElementNS: (ns, tag) => fakeElement(tag, ns),
};

function* walk(node) {
  yield node;
  for (const child of node.children) {
    yield* walk(child);
  }
}

function all(scene) {
  return [...walk(scene.element)];
}

function classes(node) {
  return (node.className || '').split(' ').filter(Boolean);
}

function texts(scene) {
  return all(scene)
    .map((node) => node.textContent)
    .filter((text) => typeof text === 'string' && text.length > 0);
}

const FORBIDDEN = ['afd', 'afnd', 'autómata', 'automata', 'estado', 'transición', 'transicion', 'lenguaje'];

test('raíz con data-level 3 y editorSlot reservado para el editor real', () => {
  const scene = createLevelScene({ level: { contract: '03' }, puzzle: {}, phase: 'repair' });
  assert.equal(scene.element.tag, 'section');
  assert.ok(classes(scene.element).includes('level-scene'));
  assert.equal(scene.element.getAttribute('data-level'), '3');
  assert.ok(scene.editorSlot);
  assert.notEqual(scene.editorSlot, scene.element);
  assert.equal(scene.editorSlot.parentNode !== null, true);
  assert.equal(scene.editorSlot.getAttribute('data-slot'), 'editor');
  // La placa aloja de 5 a 8 casillas.
  assert.equal(scene.editorSlot.getAttribute('data-cells'), '5-8');
  assert.match(scene.editorSlot.getAttribute('aria-label') ?? '', /5 a 8 casillas/);
});

test('fase repair/build en placa y raíz', () => {
  const repair = createLevelScene({ phase: 'repair' });
  const build = createLevelScene({ phase: 'build' });
  assert.equal(repair.element.getAttribute('data-phase'), 'repair');
  assert.equal(build.element.getAttribute('data-phase'), 'build');
  assert.ok(texts(repair).some((text) => text.includes('Reparación')));
  assert.ok(texts(build).some((text) => text.includes('Construcción')));
});

test('no crea editor, cables, llaves, juicio ni lógica', () => {
  const scene = createLevelScene({});
  const nodes = all(scene);
  assert.equal(nodes.filter((node) => node.tag === 'svg').length, 3, 'glifos SVG propios (2 lámparas y el interruptor; la tijera, el bifurcador y el resorte usan la foto final)');
  const imgs = nodes.filter((node) => node.tag === 'img');
  assert.equal(imgs.length, 6, 'fotos finales: tijera del N1, bifurcador, resorte y papeles del conservador');
  const paperSrcs = [
    'assets/levels/01/props/contract.webp',
    'assets/levels/01/props/hint.webp',
    'assets/levels/01/props/log.webp',
  ];
  const SCISSORS_SRC = 'assets/levels/01/props/scissors.webp';
  for (const img of imgs) {
    assert.ok(
      [
        'assets/shared/props/fork.svg',
        'assets/shared/props/spring.svg',
        SCISSORS_SRC,
        ...paperSrcs,
      ].includes(img.getAttribute('src')),
      `img con asset final: ${img.getAttribute('src')}`,
    );
    assert.equal(img.getAttribute('aria-hidden'), 'true', 'las fotos siguen decorativas');
    assert.equal(img.getAttribute('alt'), '', 'las fotos no duplican el nombre del prop');
  }
  for (const src of paperSrcs) {
    assert.ok(existsSync(join(repoRoot, src)), `el papel existe en disco: ${src}`);
  }
  const cutImg = imgs.find((img) => img.getAttribute('src') === SCISSORS_SRC);
  assert.ok(cutImg, 'la tijera usa el asset final del N1');
  assert.equal(cutImg.getAttribute('data-asset'), 'levels.01.scissors', 'slot del manifiesto');
  assert.equal(cutImg.getAttribute('data-status'), 'final', 'asset final, no pendiente');
  assert.equal(cutImg.getAttribute('data-src'), SCISSORS_SRC, 'data-src con la ruta usada');
  assert.ok(existsSync(join(repoRoot, SCISSORS_SRC)), 'la tijera final existe en disco');
  assert.equal(nodes.filter((node) => node.tag === 'canvas').length, 0);
  const classed = nodes.flatMap((node) => classes(node));
  for (const banned of ['wire', 'edge', 'state', 'key', 'inventory', 'graph']) {
    assert.ok(!classed.includes(banned), `la escena no dibuja ${banned}`);
  }
  for (const banned of [
    'createGraphEditor',
    'createDrumEditor',
    'createTapePanel',
    'toMachine',
    'judge',
    'runNFA',
    'applyEdit',
    'innerHTML',
  ]) {
    assert.ok(!sceneSource.includes(banned), `level3Scene.js no usa ${banned}`);
  }
  assert.ok(sceneSource.includes('createElementNS'), 'los glifos usan createElementNS');
});

test('slots finales con asset del manifiesto y lámpara a producir', () => {
  const scene = createLevelScene({});
  const nodes = all(scene);
  const finals = nodes.filter((node) => node.getAttribute('data-status') === 'final');
  assert.ok(finals.length >= 4, `hay ${finals.length} slots finales`);
  const expected = {
    'levels.03.backgroundDay': 'assets/levels/03/day.webp',
    'levels.03.backgroundNight': 'assets/levels/03/night.webp',
    'shared.prop.fork': 'assets/shared/props/fork.svg',
    'shared.prop.spring': 'assets/shared/props/spring.svg',
    'levels.01.contract': 'assets/levels/01/props/contract.webp',
    'levels.01.hint': 'assets/levels/01/props/hint.webp',
    'levels.01.log': 'assets/levels/01/props/log.webp',
  };
  for (const [slot, src] of Object.entries(expected)) {
    const found = finals.find((node) => node.getAttribute('data-asset') === slot);
    assert.ok(found, `slot final: ${slot}`);
    assert.equal(found.getAttribute('data-src'), src, `data-src de ${slot}`);
    assert.equal(found.getAttribute('data-src'), manifestFinal(slot), `data-src igual al manifiesto en ${slot}`);
    assert.ok(existsSync(join(repoRoot, src)), `el asset existe en disco: ${src}`);
  }
  const placeholders = nodes.filter((node) => node.getAttribute('data-status') === 'a producir');
  for (const node of placeholders) {
    assert.equal(node.getAttribute('data-todo'), 'a producir');
    assert.ok(node.getAttribute('data-asset'), 'cada placeholder nombra su slot de asset');
  }
  const assets = placeholders.map((node) => node.getAttribute('data-asset')).join(' ');
  assert.ok(assets.includes('levels.03.lamp'), 'la lámpara sigue a producir');
  assert.ok(!assets.includes('levels.03.backgroundDay'), 'el día ya es final');
  assert.ok(!assets.includes('shared.prop.fork'), 'el bifurcador ya es final');
  assert.ok(!assets.includes('shared.prop.spring'), 'el resorte ya es final');
  assert.ok(!sceneSource.includes('url('), 'la escena no carga recursos por URL');
  assert.ok(!/url\(\s*['"]?https?:/i.test(sceneCss), 'el CSS no carga imágenes externas');
});

test('las alas usan la foto final visible: respaldo, velo y luz translúcidos', () => {
  function rulesOf(css) {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    return clean
      .split('}')
      .map((chunk) => chunk.split('{'))
      .filter((parts) => parts.length === 2)
      .map(([selector, body]) => ({ selector: selector.trim(), body }));
  }
  function wingBody(modifier) {
    const exact = `.level-scene[data-level="3"] ${modifier}`;
    const found = rulesOf(sceneCss).find((rule) =>
      rule.selector.split(',').map((part) => part.trim()).includes(exact),
    );
    assert.ok(found, `hay regla para ${exact}`);
    return found.body;
  }
  const day = wingBody('.museum-wing--day');
  const night = wingBody('.museum-wing--night');
  assert.ok(day.includes('url("../../../assets/levels/03/day.webp")'), 'el ala de día usa day.webp');
  assert.ok(night.includes('url("../../../assets/levels/03/night.webp")'), 'el ala de noche usa night.webp');
  assert.ok(
    existsSync(join(repoRoot, 'assets', 'levels', '03', 'day.webp')),
    'day.webp existe en disco',
  );
  assert.ok(
    existsSync(join(repoRoot, 'assets', 'levels', '03', 'night.webp')),
    'night.webp existe en disco',
  );
  for (const [name, body] of [['day', day], ['night', night]]) {
    assert.ok(/background-color\s*:\s*#[0-9a-f]{6}/i.test(body), `el ala ${name} conserva color de respaldo`);
    assert.ok(/background-size\s*:\s*cover/.test(body), `el ala ${name} cubre con cover`);
    assert.ok(/background-position\s*:\s*center/.test(body), `el ala ${name} centra la foto`);
    assert.ok(!/gradient\([^;]*?#[0-9a-f]{3,8}/i.test(body), `ninguna capa opaca tapa la foto del ala ${name}`);
  }
  assert.ok(/rgba\(5,\s*8,\s*12,\s*0\.45\)/.test(sceneCss), 'velo de oscurecimiento sobre la foto');
  assert.ok(/text-shadow/.test(sceneCss), 'la etiqueta de sala se lee sobre la foto');
});

test('bifurcador y resorte: placas grabadas con la foto final, sin duplicar símbolo', () => {
  const scene = createLevelScene({});
  const nodes = all(scene);
  for (const [slot, label] of [['shared.prop.fork', 'Bifurcador'], ['shared.prop.spring', 'Resorte']]) {
    const holder = nodes.find((node) => node.getAttribute('data-asset') === slot);
    assert.ok(holder, `contenedor de ${slot}`);
    assert.equal(holder.getAttribute('aria-label'), label, `el contenedor nombra: ${label}`);
    assert.ok(holder.getAttribute('title'), `${slot} explica en title, sin párrafo visible`);
    const tags = holder.children.map((child) => child.tag);
    assert.ok(tags.includes('img'), `${slot} usa <img> final`);
    assert.ok(!tags.includes('svg'), `${slot} muestra un solo símbolo: sin glifo inline duplicado`);
    assert.deepEqual(tags, ['img', 'span'], `${slot} es foto + placa, nada más`);
    const img = holder.children.find((child) => child.tag === 'img');
    assert.ok(classes(img).includes('museum-glyph-art'), `${slot} conserva el tamaño del glifo`);
    const plate = holder.children.find(
      (child) => child.tag === 'span' && classes(child).includes('museum-glyph-plate'),
    );
    assert.ok(plate, `${slot} rotula la placa grabada`);
    assert.equal(plate.textContent, label, `${slot} nombra sin explicar`);
    assert.ok(!tags.includes('p'), `${slot} ya no usa párrafo explicativo`);
    assert.ok(!holder.children.some((child) => classes(child).includes('museum-glyph-caption')), `${slot} sin leyenda de producción`);
    assert.ok(/\.museum-glyph img\.museum-glyph-art/.test(sceneCss), 'el CSS fija el tamaño de la foto del glifo');
  }
});

test('alas de día y noche, lámparas y glifos con vocabulario de taller', () => {
  const scene = createLevelScene({});
  const text = texts(scene).join(' · ');
  const aria = all(scene)
    .map((node) => node.getAttribute('aria-label') ?? '')
    .join(' · ');
  const voice = `${text} · ${aria}`.toLowerCase();
  for (const word of ['Sala de día', 'Sala de noche', 'Bifurcador', 'Resorte', 'placa', 'taller']) {
    assert.ok(voice.includes(word.toLowerCase()), `la escena nombra: ${word}`);
  }
  for (const node of all(scene)) {
    const hay = `${node.textContent ?? ''} ${node.getAttribute('aria-label') ?? ''}`.toLowerCase();
    for (const bad of FORBIDDEN) {
      assert.ok(!hay.includes(bad), `sin vocabulario académico: ${bad}`);
    }
  }
});

test('aria: editor, glifos decorativos y estado con live region', () => {
  const scene = createLevelScene({});
  assert.equal(scene.editorSlot.getAttribute('role'), 'group');
  assert.ok(scene.editorSlot.getAttribute('aria-label'));
  assert.ok(scene.statusSlot);
  assert.equal(scene.statusSlot.getAttribute('data-slot'), 'status');
  assert.equal(scene.statusSlot.getAttribute('aria-live'), 'polite');
  assert.ok(scene.statusSlot.getAttribute('aria-label'));
  const svgs = all(scene).filter((node) => node.tag === 'svg');
  assert.ok(svgs.length > 0);
  for (const svg of svgs) {
    assert.equal(svg.getAttribute('aria-hidden'), 'true');
  }
});

test('dispose suelta la escena sin romper el resto', () => {
  const scene = createLevelScene({});
  const shell = fakeElement('div');
  shell.append(scene.element);
  scene.dispose();
  assert.equal(scene.element.parentNode, null);
  assert.equal(shell.children.length, 0);
  assert.doesNotThrow(() => scene.dispose());
});

test('sala de seguridad: serie de placa y aviso de alarma con vocabulario de taller', () => {
  const scene = createLevelScene({});
  const text = texts(scene).join(' · ');
  assert.ok(text.includes('N.º'), 'la placa lleva su serie como la del mockup');
  assert.ok(text.includes('Alarma'), 'la placa rotula la línea de alarma');
});

test('el editor real cabe: #canvas dentro del slot para 5–8 casillas a 1440 y 390', () => {
  function rulesOf(css) {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    return clean
      .split('}')
      .map((chunk) => chunk.split('{'))
      .filter((parts) => parts.length === 2)
      .map(([selector, body]) => ({ selector: selector.trim(), body }));
  }
  function bodyFor(exact) {
    const found = rulesOf(sceneCss).find((rule) =>
      rule.selector.split(',').map((part) => part.trim()).includes(exact),
    );
    assert.ok(found, `hay regla para ${exact}`);
    return found.body;
  }
  const root = bodyFor('.level-scene[data-level="3"]');
  assert.ok(/display\s*:\s*grid/.test(root), 'la raíz es grilla del stage');
  assert.ok(/grid-template-rows\s*:\s*minmax\(0,\s*1fr\)\s+auto/.test(root), 'la raíz reserva fila flexible a la sala y fila natural a la banda');
  assert.ok(/height\s*:\s*100%/.test(root), 'la raíz ocupa el alto del stage');
  assert.ok(/max-height\s*:\s*100%/.test(root), 'la raíz no supera el alto del stage');
  assert.ok(/min-height\s*:\s*0/.test(root), 'la raíz puede encogerse');
  assert.ok(/overflow\s*:\s*hidden/.test(root), 'la escena no empuja la página');
  assert.ok(/box-sizing\s*:\s*border-box/.test(root), 'la raíz mide borde incluido');

  const room = bodyFor('.level-scene[data-level="3"] .museum-room');
  assert.ok(/display\s*:\s*flex/.test(room), 'la sala es columna flexible');
  assert.ok(/flex-direction\s*:\s*column/.test(room), 'la sala apila placa y marcha');
  assert.ok(/min-height\s*:\s*0/.test(room), 'la sala puede encogerse');

  const plate = bodyFor('.level-scene[data-level="3"] .museum-plate');
  assert.ok(/flex\s*:\s*1/.test(plate), 'la placa toma el alto libre');
  assert.ok(/min-height\s*:\s*0/.test(plate), 'la placa puede encogerse');

  const slot = bodyFor('.level-scene[data-level="3"] .museum-editor-slot');
  assert.ok(/flex\s*:\s*1/.test(slot), 'el slot toma el alto libre de la placa');
  assert.ok(/min-height\s*:\s*0/.test(slot), 'el slot puede encogerse');
  assert.ok(/overflow\s*:\s*auto/.test(slot), 'el desborde vive dentro del slot');
  assert.ok(!/min-height\s*:\s*\d+px/.test(slot), 'el slot no fija un mínimo que pelee con el flex');

  const canvas = bodyFor('.level-scene[data-level="3"] .museum-editor-slot #canvas');
  assert.ok(/width\s*:\s*100%/.test(canvas), 'el #canvas llena el ancho del slot');
  assert.ok(/height\s*:\s*100%/.test(canvas), 'el #canvas llena el alto del slot');

  assert.ok(/@media[^{]*max-width\s*:\s*700px/.test(sceneCss), 'hay ajuste para 390×844');
  assert.ok(
    /@media[^{]*max-width\s*:\s*700px[\s\S]*?\.museum-editor-slot\s+#canvas[\s\S]*?min-width\s*:\s*560px/.test(sceneCss),
    'el mínimo de 560px queda confinado al slot en angosto',
  );
  assert.ok(/@media[^{]*max-height\s*:\s*\d+px/.test(sceneCss), 'la ayuda se compacta en ventanas bajas');
  assert.ok(
    /@media[^{]*max-height\s*:\s*900px[\s\S]*?\.museum-glyphs[\s\S]*?display\s*:\s*none/.test(sceneCss),
    'los glifos salen del flujo a 900 px o menos para darle el alto al editor',
  );
  assert.ok(
    !/\.museum-editor-note/.test(sceneCss),
    'la nota de producción ya no existe en el CSS',
  );
});

test('materia del mockup: latón, bronce, papel y las tres familias', () => {
  const lower = sceneCss.toLowerCase();
  assert.ok(lower.includes('cinzel'), 'títulos en Cinzel');
  assert.ok(lower.includes('oswald'), 'interfaz en Oswald');
  assert.ok(lower.includes('special elite'), 'papel en Special Elite');
  assert.ok(sceneCss.includes('#d4a72c') || lower.includes('brass'), 'latón del mockup');
  assert.ok(sceneCss.includes('#38c6b8') || lower.includes('teal'), 'teal del ala de noche');
  assert.ok(sceneCss.includes('#f2ede3') || lower.includes('paper'), 'papel ivory del taller');
});

test('CSS con alcance, foco, 44 px y movimiento reducido', () => {
  const clean = sceneCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = clean.split('{');
  for (let index = 0; index < blocks.length - 1; index += 1) {
    const selectorPart = blocks[index].split('}').pop().trim();
    if (selectorPart === '' || selectorPart.startsWith('@')) {
      continue;
    }
    for (const selector of selectorPart.split(',')) {
      const trimmed = selector.trim();
      if (/^(\d+%|from|to)$/.test(trimmed)) {
        continue;
      }
      assert.ok(
        trimmed.includes('.level-scene'),
        `selector con alcance de escena: ${trimmed}`,
      );
    }
  }
  assert.ok(sceneCss.includes(':focus-visible'), 'foco visible');
  assert.ok(sceneCss.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
  assert.ok(sceneCss.includes('44px'), 'blancos táctiles de 44 px');
  assert.ok(!/url\(\s*['"]?https?:/i.test(sceneCss), 'sin imágenes externas en CSS');
});

test('props diegéticos: papeles, lámpara, interruptor y tijera como botones reales', () => {
  const scene = createLevelScene({});
  const nodes = all(scene);
  const byAction = {};
  for (const node of nodes) {
    const action = node.getAttribute('data-action');
    if (action) {
      byAction[action] = node;
    }
  }
  for (const action of ['contract', 'hint', 'log', 'probe', 'assault', 'cut']) {
    const prop = byAction[action];
    assert.ok(prop, `prop con data-action="${action}"`);
    assert.equal(prop.tag, 'button', `${action} es un botón real`);
    assert.equal(prop.type, 'button', `${action} no envía formularios`);
    assert.ok(prop.getAttribute('aria-label'), `${action} tiene nombre accesible`);
  }
  function propText(prop) {
    return [...walk(prop)]
      .map((node) => node.textContent)
      .filter((text) => typeof text === 'string' && text.length > 0)
      .join(' ');
  }
  assert.equal(propText(byAction.contract).includes('Contrato'), true, 'el contrato se lee en marfil');
  assert.equal(propText(byAction.hint).includes('Pista'), true, 'la pista se lee en marfil');
  assert.equal(propText(byAction.log).includes('Bitácora'), true, 'la bitácora se lee en marfil');
  assert.ok(classes(byAction.probe).includes('museum-lamp-btn'), 'probar vive en la lámpara');
  assert.ok(classes(byAction.assault).includes('museum-assault'), 'el ensayo vive en el interruptor');
  assert.ok(classes(byAction.cut).includes('museum-cut'), 'cortar vive en la tijera');
  for (const action of ['contract', 'hint', 'log', 'probe', 'assault', 'cut']) {
    const svgInside = [...walk(byAction[action])].some((node) => node.tag === 'svg' || node.tag === 'span');
    assert.ok(svgInside, `${action} muestra su objeto, no una caja`);
  }
  assert.ok(
    /\.museum-paper\s*\{[^}]*background\s*:\s*transparent/.test(sceneCss),
    'los papeles no usan caja de botón',
  );
  assert.ok(
    /\.museum-cut\s*\{[^}]*background\s*:\s*transparent/.test(sceneCss),
    'la tijera no usa caja de botón',
  );
  assert.ok(
    sceneCss.includes('.museum-paper:focus-visible') && sceneCss.includes('.museum-cut:focus-visible'),
    'los props mantienen foco visible',
  );
});

test('fuera los textos de producción: nada de "a producir" visible', () => {
  const scene = createLevelScene({});
  const text = texts(scene).join(' · ');
  assert.ok(
    !text.includes('La placa aloja el editor real de 5 a 8 casillas.'),
    'fuera la nota del editor',
  );
  assert.ok(
    !text.toLowerCase().includes('aquí el taller muestra la marcha de la prueba.'),
    'fuera la nota de la marcha',
  );
  assert.ok(!text.includes('a producir'), 'ningún aviso visible dice a producir');
  assert.ok(
    !sceneSource.includes('La placa aloja el editor real de 5 a 8 casillas.'),
    'la fuente ya no trae la nota del editor',
  );
  assert.ok(
    !sceneSource.toLowerCase().includes('aquí el taller muestra la marcha de la prueba.'),
    'la fuente ya no trae la nota de la marcha',
  );
  const placeholders = all(scene).filter((node) => node.getAttribute('data-status') === 'a producir');
  assert.ok(placeholders.length > 0, 'la lámpara sigue pendiente en data-status');
  for (const node of placeholders) {
    assert.ok(node.getAttribute('data-asset'), 'cada pendiente nombra su slot de asset');
  }
});

test('escena inmersiva: pantalla completa, alas con cover y placa protagonista', () => {
  function bodyFor(exact) {
    const clean = sceneCss.replace(/\/\*[\s\S]*?\*\//g, '');
    const found = clean
      .split('}')
      .map((chunk) => chunk.split('{'))
      .filter((parts) => parts.length === 2)
      .map(([selector, body]) => ({ selector: selector.trim(), body }))
      .find((rule) => rule.selector.split(',').map((part) => part.trim()).includes(exact));
    assert.ok(found, `hay regla para ${exact}`);
    return found.body;
  }
  const root = bodyFor('.level-scene[data-level="3"]');
  assert.ok(/position\s*:\s*absolute/.test(root), 'la escena flota sobre todo el stage');
  assert.ok(/inset\s*:\s*0/.test(root), 'la escena cubre todo el stage');
  assert.ok(/height\s*:\s*100%/.test(root), 'la escena ocupa el alto del stage');
  assert.ok(/border\s*:\s*0/.test(root), 'sin marcos: fuera el borde');
  assert.ok(/border-radius\s*:\s*0/.test(root), 'sin marcos: fuera el recuadro');
  assert.ok(
    /\.wb-scene\.is-immersive\s+\.level-scene\[data-level="3"\]/.test(sceneCss),
    'el CSS acompaña al shell inmersivo sin romperse solo',
  );
  for (const wing of ['.museum-wing--day', '.museum-wing--night']) {
    const body = bodyFor(`.level-scene[data-level="3"] ${wing}`);
    assert.ok(/background-size\s*:\s*cover/.test(body), `${wing} cubre con cover`);
  }
  const title = bodyFor('.level-scene[data-level="3"] .museum-plate-title');
  assert.ok(/font-size\s*:\s*2[24]px/.test(title), 'la placa queda centrada y más grande');
});

test('estado sin franja: hud vacío que el parent llena, 14 px y colapso', () => {
  const scene = createLevelScene({});
  assert.ok(scene.hudSlot, 'el slot hud existe para el parent');
  assert.equal(scene.hudSlot.getAttribute('data-slot'), 'hud');
  assert.equal(scene.hudSlot.children.length, 0, 'la ranura viaja vacía: el parent la llena con append y nada se duplica');
  // El parent muda su nodo de estado: cae al último renglón de la banda.
  const moved = { tag: 'div', className: 'wb-status', children: [], parentNode: null, attributes: {}, textContent: 'Carrete 3' };
  scene.hudSlot.children.push(moved);
  assert.equal(scene.hudSlot.children.at(-1), moved, 'lo mudado queda último en la banda');
  assert.equal(scene.statusSlot.children.length, 0, 'el statusSlot clásico queda vacío en inmersivo');
  const clean = sceneCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = clean
    .split('}')
    .map((chunk) => chunk.split('{'))
    .filter((parts) => parts.length === 2)
    .map(([selector, body]) => ({ selector: selector.trim(), body }))
    .find((rule) =>
      rule.selector.split(',').map((part) => part.trim()).includes('.level-scene[data-level="3"] .museum-hud'),
    );
  assert.ok(found, 'hay regla para la ranura hud');
  assert.ok(/font-size\s*:\s*14px/.test(found.body), 'el estado mudado se lee a 14 px');
  assert.ok(/text-shadow/.test(found.body), 'la línea mudada se lee sobre la foto');
  assert.ok(
    /\.level-scene\[data-level="3"\] \.museum-hud:empty[\s\S]*?display\s*:\s*none/.test(clean),
    'el hud vacío colapsa: sin renglón fantasma antes de la muda',
  );
  assert.ok(
    /\.level-scene\[data-level="3"\] \.museum-status:empty[\s\S]*?display\s*:\s*none/.test(clean),
    'el slot clásico colapsa cuando queda vacío',
  );
});

test('animaciones de ambiente bajo movimiento permitido', () => {
  assert.ok(
    /@media[^{]*prefers-reduced-motion\s*:\s*no-preference/.test(sceneCss),
    'las animaciones solo corren con movimiento permitido',
  );
  assert.ok(/museum-lamp-flicker/.test(sceneCss), 'la lámpara parpadea');
  assert.ok(/museum-vitrine-glow/.test(sceneCss), 'las vitrinas respiran con brillo tenue');
  assert.ok(/museum-spring-sway/.test(sceneCss), 'el glifo del resorte tiene vaivén');
});

test('ranuras keys y hud en la banda de mesa para el parent', () => {
  const scene = createLevelScene({});
  assert.ok(scene.keysSlot, 'el slot de carretes existe para el parent');
  assert.equal(scene.keysSlot.getAttribute('data-slot'), 'keys');
  assert.equal(scene.keysSlot.getAttribute('role'), 'group');
  assert.ok(scene.keysSlot.getAttribute('aria-label'), 'los carretes se nombran');
  assert.equal(scene.keysSlot.children.length, 0, 'el parent monta #palette y herramientas');
  assert.ok(scene.hudSlot, 'el slot hud existe para el parent');
  assert.equal(scene.hudSlot.getAttribute('data-slot'), 'hud');
  assert.equal(scene.hudSlot.getAttribute('aria-live'), 'polite');
  assert.ok(scene.hudSlot.getAttribute('aria-label'), 'la marcha del taller en mesa se nombra');
  const dock = all(scene).find((node) => classes(node).includes('museum-dock'));
  assert.ok(dock, 'hay banda de mesa');
  assert.equal(scene.keysSlot.parentNode, dock, 'keysSlot vive en la banda');
  assert.equal(scene.hudSlot.parentNode, dock, 'hudSlot vive en la banda');
  const order = dock.children.map((child) => child.className);
  assert.deepEqual(
    order.map((name) => name.includes('museum-cut') ? 'museum-cut' : name),
    ['museum-papers', 'museum-keys', 'museum-cut', 'museum-hud'],
    'la banda ordena papeles, carretes, tijera y estado último (ENSAYO va con PROBAR)',
  );
  assert.ok(order[2].includes('scissors-prop'), 'la tijera es el prop compartido del N1');
});

test('banda inferior ordenada sin solapes declarados', () => {
  function rulesOf(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .map((chunk) => chunk.split('{'))
      .filter((parts) => parts.length === 2)
      .map(([selector, body]) => ({ selector: selector.trim(), body }));
  }
  function bodyFor(exact) {
    const found = rulesOf(sceneCss).find((rule) =>
      rule.selector.split(',').map((part) => part.trim()).includes(exact),
    );
    assert.ok(found, `hay regla para ${exact}`);
    return found.body;
  }
  const dock = bodyFor('.level-scene[data-level="3"] .museum-dock');
  assert.ok(/position\s*:\s*static/.test(dock), 'la banda va en flujo: la placa termina donde la banda empieza');
  assert.ok(!/position\s*:\s*absolute/.test(dock), 'la banda nunca flota sobre la placa ni el tablero');
  assert.ok(/display\s*:\s*grid/.test(dock), 'la banda es grilla, no pila absoluta');
  assert.ok(
    /grid-template-areas\s*:[^;]*"papers cut keys"[^;]*"hud hud hud"/s.test(dock),
    'papeles a la izquierda, tijera al lado de la bitácora, keys al centro-derecha, estado último por encima del borde',
  );
  for (const prop of ['.museum-papers', '.museum-cut']) {
    const body = bodyFor(`.level-scene[data-level="3"] ${prop}`);
    assert.ok(!/position\s*:\s*absolute/.test(body), `${prop} ya no flota: lo ordena la grilla`);
  }
  const assaultBody = bodyFor('.level-scene[data-level="3"] .museum-assault');
  assert.ok(!/grid-area/.test(assaultBody), 'ENSAYO sale de la banda: vive en el grupo de alarma');
  assert.ok(!/position\s*:\s*absolute/.test(assaultBody), 'ENSAYO no flota solo: lo posiciona el grupo');
  const keys = bodyFor('.level-scene[data-level="3"] .museum-keys');
  assert.ok(/justify-self\s*:\s*stretch/.test(keys), 'keysSlot ocupa el lugar libre al centro (criterio N2), con la tijera al lado');
  assert.ok(/justify-content\s*:\s*center/.test(keys), 'los carretes van centrados horizontalmente');
  assert.ok(/min-width\s*:\s*0/.test(keys), 'keysSlot puede encogerse sin empujar');
  assert.ok(
    /\.museum-keys button\s*\{[^}]*min-width\s*:\s*44px[^}]*min-height\s*:\s*44px/.test(sceneCss),
    'lo que monte el parent en keys mantiene 44 px',
  );
  assert.ok(
    /\.museum-keys\s*>\s*\*\s*\{[^}]*flex\s*:\s*0\s+0\s+auto/.test(sceneCss),
    'los hijos de keys no se encogen: el rack desplaza en horizontal en vez de aplastar carretes',
  );
  const keysMin = keys.match(/min-height\s*:\s*(\d+)px/);
  assert.ok(keysMin && Number(keysMin[1]) >= 104, 'keysSlot reserva el alto del carrete + chapa (≈104 px)');
  const keysPadTop = keys.match(/padding-top\s*:\s*(\d+)px/);
  assert.ok(keysPadTop && Number(keysPadTop[1]) >= 10, 'keysSlot deja aire superior para la elevación del carrete activo');
  assert.ok(/overflow\s*:\s*visible/.test(keys), 'keysSlot nunca recorta: ni el símbolo ni el brillo del activo');
  assert.ok(!/overflow\s*:\s*hidden/.test(keys), 'sin recorte vertical en keysSlot');
  assert.ok(!/overflow-y\s*:\s*hidden/.test(keys), 'la chapa del símbolo nunca se corta');
  assert.ok(!/overflow\s*:\s*hidden/.test(dock), 'ningún contenedor intermedio corta la chapa');
  const hud = bodyFor('.level-scene[data-level="3"] .museum-hud');
  assert.ok(/grid-area\s*:\s*hud/.test(hud), 'hudSlot cierra la banda como último renglón');
  assert.ok(
    /@media[^{]*max-width\s*:\s*700px[\s\S]*?\.museum-dock[\s\S]*?"hud hud"/.test(sceneCss),
    'en 390 la banda reordena a dos columnas con el estado último y sin scroll horizontal',
  );
});

test('inmersivo: sin encabezado duplicado y placa entre header y banda', () => {
  function rulesOf(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .map((chunk) => chunk.split('{'))
      .filter((parts) => parts.length === 2)
      .map(([selector, body]) => ({ selector: selector.trim(), body }));
  }
  function immersiveBodies(exact) {
    return rulesOf(sceneCss)
      .filter((rule) =>
        rule.selector.split(',').map((part) => part.trim()).includes(exact),
      )
      .map((rule) => rule.body);
  }
  const head = '.wb-scene.is-immersive .level-scene[data-level="3"] .museum-plate-head';
  const tags = '.wb-scene.is-immersive .level-scene[data-level="3"] .museum-wing-tags';
  for (const [exact, what] of [[head, 'encabezado interno'], [tags, 'badges de ala']]) {
    const bodies = immersiveBodies(exact);
    assert.ok(bodies.length > 0, `hay regla inmersiva para ${what}`);
    assert.ok(bodies.some((body) => /display\s*:\s*none/.test(body)), `${what} se oculta: el título ya lo da el shell`);
  }
  const roomBodies = immersiveBodies('.wb-scene.is-immersive .level-scene[data-level="3"] .museum-room');
  assert.ok(roomBodies.length > 0, 'la sala reserva el alto del header flotante en inmersivo');
  const top = roomBodies.join(' ').match(/padding-top\s*:\s*(\d+)px/);
  assert.ok(top && Number(top[1]) >= 96, 'la placa empieza debajo del header con aire');
});

test('ENSAYO junto a PROBAR: mismo grupo sobre el borde derecho', () => {
  const scene = createLevelScene({});
  const nodes = all(scene);
  const byAction = {};
  for (const node of nodes) {
    const action = node.getAttribute('data-action');
    if (action) {
      byAction[action] = node;
    }
  }
  const group = all(scene).find((node) => classes(node).includes('museum-alarm-group'));
  assert.ok(group, 'hay grupo de alarma');
  assert.equal(byAction.assault.parentNode, group, 'ENSAYO vive en el grupo');
  assert.equal(byAction.probe.parentNode, group, 'PROBAR vive en el grupo');
  const order = group.children.map((child) => child.getAttribute('data-action'));
  assert.deepEqual(order, ['probe', 'assault'], 'PROBAR a la izquierda de ENSAYO');
  const clean = sceneCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = clean
    .split('}')
    .map((chunk) => chunk.split('{'))
    .filter((parts) => parts.length === 2)
    .map(([selector, body]) => ({ selector: selector.trim(), body }))
    .find((rule) =>
      rule.selector.split(',').map((part) => part.trim()).includes('.level-scene[data-level="3"] .museum-alarm-group'),
    );
  assert.ok(found, 'hay regla para el grupo de alarma');
  assert.ok(/position\s*:\s*absolute/.test(found.body), 'el grupo flota junto sobre el borde derecho');
  assert.ok(/right\s*:/.test(found.body), 'el grupo va a la derecha');
  assert.ok(/display\s*:\s*flex/.test(found.body), 'ENSAYO y PROBAR comparten fila sin pisarse');
});

test('ENSAYO refleja la fase: Ensayo en reparación, Asalto en construcción', () => {
  function assaultOf(scene) {
    const found = all(scene).find((node) => node.getAttribute('data-action') === 'assault');
    assert.ok(found, 'hay control de ensayo/asalto');
    return found;
  }
  function propName(prop) {
    const name = [...walk(prop)].find((node) => classes(node).includes('museum-prop-name'));
    assert.ok(name, 'el control rotula su nombre en la mesa');
    return name.textContent;
  }
  const repair = createLevelScene({ phase: 'repair' });
  assert.equal(propName(assaultOf(repair)), 'Ensayo', 'en reparación el interruptor pide el ensayo');
  assert.ok(
    (assaultOf(repair).getAttribute('aria-label') ?? '').includes('Ensayar'),
    'en reparación el nombre accesible pide el ensayo',
  );
  const build = createLevelScene({ phase: 'build' });
  assert.equal(propName(assaultOf(build)), 'Asalto', 'en construcción el interruptor lanza el asalto');
  assert.ok(
    (assaultOf(build).getAttribute('aria-label') ?? '').includes('asalto'),
    'en construcción el nombre accesible lanza el asalto',
  );
  for (const scene of [repair, build]) {
    const probe = all(scene).find((node) => node.getAttribute('data-action') === 'probe');
    assert.ok(probe, 'PROBAR sigue en su grupo en ambas fases');
  }
});

test('fondo y lámpara cambian con la fase: día en reparación, noche en construcción', () => {
  const repair = createLevelScene({ phase: 'repair' });
  const build = createLevelScene({ phase: 'build' });
  const probeOf = (scene) => all(scene).find((node) => node.getAttribute('data-action') === 'probe');
  assert.ok(classes(probeOf(repair)).includes('museum-lamp-btn--day'), 'en reparación PROBAR es la lámpara amarilla');
  assert.ok(classes(probeOf(build)).includes('museum-lamp-btn--night'), 'en construcción PROBAR es la lámpara teal');
  const clean = sceneCss.replace(/\/\*[\s\S]*?\*\//g, '');
  function bodiesFor(exact) {
    return clean
      .split('}')
      .map((chunk) => chunk.split('{'))
      .filter((parts) => parts.length === 2)
      .map(([selector, body]) => ({ selector: selector.trim(), body }))
      .filter((rule) => rule.selector.split(',').map((part) => part.trim()).includes(exact))
      .map((rule) => rule.body);
  }
  const hiddenNight = bodiesFor('.level-scene[data-level="3"][data-phase="repair"] .museum-wing--night');
  assert.ok(hiddenNight.some((body) => /display\s*:\s*none/.test(body)), 'en reparación el ala de noche no se pinta');
  const hiddenDay = bodiesFor('.level-scene[data-level="3"][data-phase="build"] .museum-wing--day');
  assert.ok(hiddenDay.some((body) => /display\s*:\s*none/.test(body)), 'en construcción el ala de día no se pinta');
  const dayLamp = bodiesFor('.level-scene[data-level="3"] .museum-lamp-btn--day');
  assert.ok(dayLamp.some((body) => /color\s*:\s*var\(--museum-brass-2\)/.test(body)), 'la lámpara de día es amarilla (latón)');
  const nightLamp = bodiesFor('.level-scene[data-level="3"] .museum-lamp-btn--night');
  assert.ok(nightLamp.some((body) => /color\s*:\s*var\(--museum-teal\)/.test(body)), 'la lámpara de noche es teal');
});

test('keysSlot: alto para la chapa del carrete y sin recorte vertical', () => {
  const scene = createLevelScene({});
  assert.ok(scene.keysSlot, 'la ranura existe para el parent');
  const clean = sceneCss.replace(/\/\*[\s\S]*?\*\//g, '');
  function bodyFor(exact) {
    const found = clean
      .split('}')
      .map((chunk) => chunk.split('{'))
      .filter((parts) => parts.length === 2)
      .map(([selector, body]) => ({ selector: selector.trim(), body }))
      .find((rule) => rule.selector.split(',').map((part) => part.trim()).includes(exact));
    assert.ok(found, `hay regla para ${exact}`);
    return found.body;
  }
  const keys = bodyFor('.level-scene[data-level="3"] .museum-keys');
  const min = keys.match(/min-height\s*:\s*(\d+)px/);
  assert.ok(min && Number(min[1]) >= 104, 'la ranura contiene el carrete completo + chapa (≈104 px)');
  const padTop = keys.match(/padding-top\s*:\s*(\d+)px/);
  assert.ok(padTop && Number(padTop[1]) >= 10, 'aire superior para la elevación y el brillo del activo');
  assert.ok(/overflow\s*:\s*visible/.test(keys), 'la ranura nunca recorta el símbolo ni el brillo');
  assert.ok(!/overflow\s*:\s*hidden/.test(keys), 'la ranura no recorta');
  assert.ok(!/overflow-y\s*:\s*hidden/.test(keys), 'el eje vertical no corta el símbolo');
  const dock = bodyFor('.level-scene[data-level="3"] .museum-dock');
  assert.ok(!/overflow\s*:\s*hidden/.test(dock), 'la banda no corta la chapa camino a la mesa');
  assert.ok(
    /@media[^{]*max-width\s*:\s*700px[\s\S]*?\.museum-keys[\s\S]*?min-height\s*:\s*104px/.test(clean),
    'en 390 la ranura conserva el alto del símbolo',
  );
});
