import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = join(here, '..', 'src', 'ui', 'spoolPalette.css');
const css = readFileSync(cssPath, 'utf8');
const mainSource = readFileSync(join(here, '..', 'src', 'main.js'), 'utf8');

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function selectorGroups(source) {
  const clean = stripComments(source);
  const groups = [];
  for (const match of clean.matchAll(/([^{}]+)\{/g)) {
    const head = match[1].trim();
    if (head.startsWith('@')) {
      continue;
    }
    for (const part of head.split(',')) {
      const selector = part.trim();
      if (selector) {
        groups.push(selector);
      }
    }
  }
  return groups;
}

function urls(source) {
  const clean = stripComments(source);
  return [...clean.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((match) => match[1]);
}

function rulesFor(source, fragment) {
  const clean = stripComments(source);
  const blocks = [];
  for (const match of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const head = match[1].trim();
    if (head.startsWith('@')) {
      continue;
    }
    const selectors = head.split(',').map((part) => part.trim());
    if (selectors.some((selector) => selector.includes(fragment))) {
      blocks.push(match[2]);
    }
  }
  return blocks;
}

test('spoolPalette.css existe y no está vacío', () => {
  assert.ok(existsSync(cssPath), 'falta src/ui/spoolPalette.css');
  assert.ok(css.trim().length > 0, 'spoolPalette.css está vacío');
});

test('todos los selectores viven bajo .wb-scene (sin resets globales)', () => {
  const selectors = selectorGroups(css);
  assert.ok(selectors.length > 0, 'no se encontró ningún selector');
  for (const selector of selectors) {
    assert.ok(
      selector === '.wb-scene' || selector.startsWith('.wb-scene '),
      `selector fuera de alcance: ${selector}`,
    );
  }
});

test('sin selectores globales body / html / :root / *', () => {
  const selectors = selectorGroups(css);
  for (const selector of selectors) {
    const first = selector.split(/[\s>+~]/)[0];
    assert.ok(
      !['body', 'html', ':root', '*'].includes(first),
      `selector global prohibido: ${selector}`,
    );
  }
  assert.ok(!/(^|[}\s])\*(?=[\s{.,:[])/.test(stripComments(css)), 'hay selector universal *');
});

test('todas las imágenes son el carrete final y existen en disco', () => {
  const found = urls(css);
  assert.ok(found.length >= 1, 'se esperaba al menos el carrete como imagen');
  for (const reference of found) {
    assert.ok(
      reference.includes('assets/levels/01/props/spool.webp'),
      `imagen fuera del slot final n1.spool: ${reference}`,
    );
    assert.ok(!reference.includes('mockups/'), `el carrete ya no usa el mockup: ${reference}`);
    assert.ok(!/^https?:\/\//.test(reference), `imagen externa prohibida: ${reference}`);
    assert.ok(!reference.startsWith('data:'), `data URI prohibido: ${reference}`);
    const disk = normalize(join(here, '..', 'src', 'ui', reference));
    assert.ok(existsSync(disk), `sprite inexistente: ${reference}`);
  }
});

test('el héroe es el carrete final, no las llaves ni el mockup', () => {
  const clean = stripComments(css);
  assert.ok(clean.includes('assets/levels/01/props/spool.webp'), 'falta el carrete final como imagen');
  assert.ok(!clean.includes('llave-'), 'las imágenes de llave deben quedar anuladas');
  assert.ok(!clean.includes('carrete-cobre.png'), 'el placeholder del mockup ya no se usa');
  assert.ok(!clean.includes('mockups/'), 'ninguna imagen del mockup en el carrete');
});

test('las cuatro variantes existen con su color (dorado 1, teal 2, coral 3, violeta 4)', () => {
  const expected = { 1: '#d4a72c', 2: '#38c6b8', 3: '#f06a4a', 4: '#a18be0' };
  for (const [number, color] of Object.entries(expected)) {
    const keyed = rulesFor(css, `.key[data-key="${number}"]`).length > 0
      || rulesFor(css, `.key.key-${number}`).length > 0;
    assert.ok(keyed, `falta la regla por carrete para el símbolo ${number}`);
    const blocks = [
      ...rulesFor(css, `.key[data-key="${number}"]`),
      ...rulesFor(css, `.key.key-${number}`),
    ].join('\n');
    assert.ok(blocks.includes('assets/levels/01/props/spool.webp'), `el carrete ${number} debe usar el carrete final`);
    assert.ok(blocks.includes(color), `el carrete ${number} debe llevar su color ${color}`);
  }
});

test('los carretes cumplen el target mínimo de 44 px', () => {
  const blocks = rulesFor(css, '#palette .key');
  assert.ok(blocks.length > 0, 'sin reglas para #palette .key');
  const joined = blocks.join('\n');
  const sizes = [...joined.matchAll(/min-(?:width|height)\s*:\s*(\d+)px/g)].map((match) => Number(match[1]));
  assert.ok(sizes.length > 0, 'sin min-width/min-height en #palette .key');
  assert.ok(sizes.every((size) => size >= 44), `target menor a 44 px: ${sizes}`);
});

test('carretes con chapa de color y estados activo, hover, foco y deshabilitado', () => {
  assert.ok(css.includes('linear-gradient'), 'falta la chapa/banda de color del número');
  assert.ok(css.includes('.key.is-active'), 'falta el estado activo del carrete');
  assert.ok(css.includes('#palette .key:hover'), 'falta el hover del carrete');
  assert.ok(css.includes('#palette .key:focus-visible'), 'falta el foco visible del carrete');
  assert.ok(css.includes('outline'), 'falta el outline de foco visible');
  assert.ok(css.includes('.key:disabled'), 'falta el estado deshabilitado');
  assert.ok(css.includes('[aria-disabled="true"]'), 'falta el estado deshabilitado por aria');
});

test('foco visible y movimiento reducido', () => {
  assert.ok(css.includes('prefers-reduced-motion'), 'falta prefers-reduced-motion');
  const reduced = css.slice(css.indexOf('prefers-reduced-motion'));
  assert.ok(reduced.includes('transition: none'), 'reduced motion debe anular transiciones');
  assert.ok(reduced.includes('transform: none'), 'reduced motion debe anular transformaciones');
});

test('el número del carrete sigue visible (sin ocultar el texto del botón)', () => {
  const keyBlocks = rulesFor(css, '#palette .key')
    .join('\n')
    .replace(/background-color\s*:[^;]+;/g, '');
  assert.ok(!/text-indent\s*:\s*-/.test(keyBlocks), 'el texto del carrete no debe ocultarse');
  assert.ok(!/font-size\s*:\s*0/.test(keyBlocks), 'el número del carrete debe seguir visible');
  assert.ok(!/(?<![-\w])color\s*:\s*transparent/.test(keyBlocks), 'el número del carrete debe seguir legible');
});

test('no toca herramientas ni botones de acción (solo #palette)', () => {
  const selectors = selectorGroups(css);
  for (const selector of selectors) {
    assert.ok(!selector.includes('.wb-actions'), `fuga a acciones: ${selector}`);
    assert.ok(!selector.includes('.tools > .tool'), `fuga a herramientas: ${selector}`);
    assert.ok(!selector.includes('#scissors'), `fuga a la tijera: ${selector}`);
    assert.ok(!selector.includes('#spring-tool'), `fuga al resorte: ${selector}`);
  }
});

test('el carrete viste #palette fuera del inventario (keysSlot)', () => {
  const clean = stripComments(css);
  assert.ok(!clean.includes('.wb-inventory'), 'el carrete ya no exige el inventario del shell');
  const blocks = rulesFor(css, '#palette .key');
  assert.ok(blocks.length > 0, 'sin reglas para #palette .key');
  const joined = blocks.join('\n');
  assert.ok(joined.includes('assets/levels/01/props/spool.webp'), 'el cobre viste también sobre la mesa');
  assert.ok(joined.includes('linear-gradient'), 'la chapa tiñe también sobre la mesa');
});

test('el símbolo queda por encima del arte y del velo, ≥16 px', () => {
  const clean = stripComments(css);
  assert.ok(!clean.includes('mix-blend-mode'), 'sin mezclas que tapen el símbolo');
  const joined = rulesFor(css, '#palette .key').join('\n');
  const sizes = [...joined.matchAll(/font-size\s*:\s*(\d+)px/g)].map((match) => Number(match[1]));
  assert.ok(sizes.length > 0, 'el símbolo fija su tamaño');
  assert.ok(sizes.every((size) => size >= 16), `símbolo menor a 16 px: ${sizes}`);
  const weights = [...joined.matchAll(/font-weight\s*:\s*(\d+)/g)].map((match) => Number(match[1]));
  assert.ok(weights.some((weight) => weight >= 600), 'el símbolo va en ≥600');
  assert.ok(joined.includes('overflow: visible'), 'sin recorte del botón');
  assert.ok(!/overflow\s*:\s*(hidden|clip)/.test(joined), 'nada oculta el símbolo por desborde');
  const veil = rulesFor(css, '#palette .key::before').join('\n');
  assert.ok(/z-index\s*:\s*-\d+/.test(veil), 'el velo de teñido pinta detrás del símbolo');
});

test('el botón conserva textContent con el símbolo del alfabeto', () => {
  assert.ok(mainSource.includes('button.textContent = entry.symbol'), 'el símbolo viaja en el texto del botón');
  assert.ok(mainSource.includes("button.setAttribute('data-tone', entry.tone)"), 'el tono viaja en data-tone');
});
