import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = join(here, '..', 'src', 'ui', 'spoolPalette.css');
const css = readFileSync(cssPath, 'utf8');

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

test('todas las imágenes viven en mockups/nivel-1-taller/assets/ y existen', () => {
  const found = urls(css);
  assert.ok(found.length >= 1, 'se esperaba al menos el carrete como imagen');
  for (const reference of found) {
    assert.ok(
      reference.includes('mockups/nivel-1-taller/assets/'),
      `imagen fuera del mockup: ${reference}`,
    );
    assert.ok(!/^https?:\/\//.test(reference), `imagen externa prohibida: ${reference}`);
    assert.ok(!reference.startsWith('data:'), `data URI prohibido: ${reference}`);
    const disk = normalize(join(here, '..', 'src', 'ui', reference));
    assert.ok(existsSync(disk), `sprite inexistente: ${reference}`);
  }
});

test('el héroe es el carrete de cobre, no las llaves', () => {
  const clean = stripComments(css);
  assert.ok(clean.includes('carrete-cobre.png'), 'falta el carrete de cobre como imagen');
  assert.ok(!clean.includes('llave-'), 'las imágenes de llave deben quedar anuladas');
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
    assert.ok(blocks.includes('carrete-cobre.png'), `el carrete ${number} debe usar el carrete de cobre`);
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
