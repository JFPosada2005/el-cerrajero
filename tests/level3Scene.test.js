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
  assert.equal(nodes.filter((node) => node.tag === 'svg').length, 4, 'solo glifos SVG propios (Y, resorte, 2 lámparas)');
  const imgs = nodes.filter((node) => node.tag === 'img');
  assert.equal(imgs.length, 2, 'solo las fotos finales de bifurcador y resorte');
  for (const img of imgs) {
    assert.ok(
      ['assets/shared/props/fork.svg', 'assets/shared/props/spring.svg'].includes(
        img.getAttribute('src'),
      ),
      `img con asset final: ${img.getAttribute('src')}`,
    );
    assert.equal(img.getAttribute('aria-hidden'), 'true', 'los glifos con foto siguen decorativos');
  }
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

test('bifurcador y resorte conservan glifo, tamaño y nombre con foto final', () => {
  const scene = createLevelScene({});
  const nodes = all(scene);
  for (const [slot, label] of [['shared.prop.fork', 'Bifurcador'], ['shared.prop.spring', 'Resorte']]) {
    const holder = nodes.find((node) => node.getAttribute('data-asset') === slot);
    assert.ok(holder, `contenedor de ${slot}`);
    assert.equal(holder.getAttribute('aria-label'), label, `el contenedor nombra: ${label}`);
    const tags = holder.children.map((child) => child.tag);
    assert.ok(tags.includes('img'), `${slot} usa <img> final`);
    assert.ok(tags.includes('svg'), `${slot} conserva el glifo con topes/bocas`);
    const img = holder.children.find((child) => child.tag === 'img');
    assert.ok(classes(img).includes('museum-glyph-art'), `${slot} conserva el tamaño del glifo`);
    assert.ok(/\.museum-glyph img\.museum-glyph-art/.test(sceneCss), 'el CSS fija el tamaño de la foto del glifo');
  }
});

test('alas de día y noche, lámparas y glifos con vocabulario de taller', () => {
  const scene = createLevelScene({});
  const text = texts(scene).join(' · ');
  for (const word of ['Sala de día', 'Sala de noche', 'Bifurcador', 'Resorte', 'placa', 'taller']) {
    assert.ok(text.includes(word), `la escena nombra: ${word}`);
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
  assert.ok(/grid-template-rows\s*:\s*minmax\(0,\s*1fr\)/.test(root), 'la raíz limita su fila al alto del stage');
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
  assert.ok(/height\s*:\s*100%/.test(canvas), 'el #canvas escala por alto');
  assert.ok(/width\s*:\s*auto/.test(canvas), 'el #canvas no se estira en ancho');
  assert.ok(!/(?:^|[^-])width\s*:\s*100%/.test(canvas), 'el #canvas no estira el mecanismo');
  assert.ok(/max-width\s*:\s*100%/.test(canvas), 'el #canvas nunca supera el ancho del slot');
  assert.ok(/max-height\s*:\s*100%/.test(canvas), 'el #canvas nunca supera el alto del slot');
  assert.ok(/margin-inline\s*:\s*auto/.test(canvas), 'el #canvas queda centrado');
  assert.ok(/aspect-ratio/.test(canvas), 'el #canvas conserva la proporción 820×520');

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
    /@media[^{]*max-height\s*:\s*900px[\s\S]*?\.museum-editor-note[\s\S]*?display\s*:\s*none/.test(sceneCss),
    'la nota de ayuda sale del flujo a 900 px o menos',
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
      assert.ok(
        selector.trim().includes('.level-scene'),
        `selector con alcance de escena: ${selector.trim()}`,
      );
    }
  }
  assert.ok(sceneCss.includes(':focus-visible'), 'foco visible');
  assert.ok(sceneCss.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
  assert.ok(sceneCss.includes('44px'), 'blancos táctiles de 44 px');
  assert.ok(!/url\(\s*['"]?https?:/i.test(sceneCss), 'sin imágenes externas en CSS');
});
