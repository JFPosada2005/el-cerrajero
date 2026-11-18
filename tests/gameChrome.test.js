import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = join(here, '..', 'src', 'ui', 'gameChrome.css');
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

test('gameChrome.css existe y no está vacío', () => {
  assert.ok(existsSync(cssPath), 'falta src/ui/gameChrome.css');
  assert.ok(css.trim().length > 0, 'gameChrome.css está vacío');
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

test('todas las imágenes son las llaves finales y existen en disco', () => {
  const found = urls(css);
  assert.ok(found.length >= 4, 'se esperaban al menos las 4 llaves como imágenes');
  for (const reference of found) {
    assert.ok(
      reference.includes('assets/levels/01/props/key-'),
      `imagen fuera del slot final n1.keys: ${reference}`,
    );
    assert.ok(!reference.includes('mockups/'), `la llave ya no usa el mockup: ${reference}`);
    assert.ok(!/^https?:\/\//.test(reference), `imagen externa prohibida: ${reference}`);
    assert.ok(!reference.startsWith('data:'), `data URI prohibido: ${reference}`);
    const disk = normalize(join(here, '..', 'src', 'ui', reference));
    assert.ok(existsSync(disk), `sprite inexistente: ${reference}`);
  }
});

test('las cuatro llaves finales tienen su imagen (key-1…4.webp)', () => {
  for (const number of ['1', '2', '3', '4']) {
    assert.ok(
      css.includes(`assets/levels/01/props/key-${number}.webp`),
      `falta la imagen final de la llave ${number}`,
    );
    const keyed = rulesFor(css, `.key[data-key="${number}"]`).length > 0
      || rulesFor(css, `.key.key-${number}`).length > 0;
    assert.ok(keyed, `falta la regla por llave para la llave ${number}`);
  }
});

test('llaves, herramientas y botones cumplen el target mínimo de 44 px', () => {
  const families = ['#palette .key', '.tools > .tool', '.wb-actions .wb-btn'];
  for (const family of families) {
    const blocks = rulesFor(css, family);
    assert.ok(blocks.length > 0, `sin reglas para ${family}`);
    const joined = blocks.join('\n');
    const sizes = [...joined.matchAll(/min-(?:width|height)\s*:\s*(\d+)px/g)].map((match) => Number(match[1]));
    assert.ok(sizes.length > 0, `sin min-width/min-height en ${family}`);
    assert.ok(sizes.every((size) => size >= 44), `target menor a 44 px en ${family}: ${sizes}`);
  }
});

test('botones de acción con placas, remaches y estados del mockup', () => {
  for (const fragment of ['[data-action="probe"]', '[data-action="assault"]', '.wb-btn-primary']) {
    assert.ok(css.includes(fragment), `falta el selector ${fragment}`);
  }
  assert.ok(css.includes('.wb-actions .wb-btn::before'), 'faltan los remaches (::before)');
  assert.ok(css.includes('.wb-actions .wb-btn::after'), 'faltan los remaches (::after)');
  for (const state of [':hover', ':active', ':focus-visible', ':disabled']) {
    const withState = selectorGroups(css).filter((selector) => selector.includes('.wb-actions') && selector.includes(state));
    assert.ok(withState.length > 0, `falta el estado ${state} en los botones de acción`);
  }
  assert.ok(css.includes('[aria-disabled="true"]'), 'falta el estado deshabilitado por aria');
});

test('llavero con estados activo, foco y deshabilitado', () => {
  assert.ok(css.includes('.key.is-active'), 'falta el estado activo de la llave');
  assert.ok(css.includes('#palette .key:hover'), 'falta el hover de la llave');
  assert.ok(css.includes('#palette .key:focus-visible'), 'falta el foco visible de la llave');
  assert.ok(css.includes('#scissors'), 'falta el estilo de la tijera');
  assert.ok(css.includes('#spring-tool'), 'falta el estilo del resorte');
  assert.ok(css.includes('.tool.is-active'), 'falta el estado activo de las herramientas');
});

test('foco visible con contraste y movimiento reducido', () => {
  assert.ok(css.includes('prefers-reduced-motion'), 'falta prefers-reduced-motion');
  assert.ok(css.includes('outline'), 'falta el outline de foco visible');
  const reduced = css.slice(css.indexOf('prefers-reduced-motion'));
  assert.ok(reduced.includes('transition: none'), 'reduced motion debe anular transiciones');
  assert.ok(reduced.includes('transform: none'), 'reduced motion debe anular transformaciones');
});

test('el número de la llave sigue visible (sin ocultar el texto del botón)', () => {
  const keyBlocks = rulesFor(css, '#palette .key')
    .join('\n')
    .replace(/background-color\s*:[^;]+;/g, '');
  assert.ok(!/text-indent\s*:\s*-/.test(keyBlocks), 'el texto de la llave no debe ocultarse');
  assert.ok(!/font-size\s*:\s*0/.test(keyBlocks), 'el número de la llave debe seguir visible');
  assert.ok(!/(?<![-\w])color\s*:\s*transparent/.test(keyBlocks), 'el número de la llave debe seguir legible');
});
