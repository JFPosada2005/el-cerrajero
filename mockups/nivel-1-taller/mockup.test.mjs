import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const css = read('./styles.css').replace(/\/\*[\s\S]*?\*\//g, '');
const js = read('./app.js');
const readme = read('./README.md');

const section = (start, end) => css.slice(css.indexOf(start), end ? css.indexOf(end) : undefined);
const rules = (text, selector) => [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter((match) => match[1].split(',').map((item) => item.trim()).includes(selector))
  .map((match) => match[2]);
const prop = (body, name) => body.match(new RegExp(`(?:^|[;\\s])${name}\\s*:\\s*([^;]+);`))?.[1].trim();
const minPx = (value) => Number((value.match(/clamp\(\s*(-?[\d.]+)px/) ?? value.match(/^(-?[\d.]+)px$/))?.[1]);
const fnBody = (name) => js.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`))?.[0] ?? '';

test('S-B1 inventory keys keep a 44px minimum width at every breakpoint', () => {
  const widths = rules(css, '.inventory-key').map((body) => prop(body, 'width')).filter(Boolean);
  assert.ok(widths.length > 0);
  for (const width of widths) {
    assert.ok(minPx(width) >= 44, `.inventory-key width ${width}`);
  }
});

test('S-B2 renderHint does not stack a click listener on every render', () => {
  assert.doesNotMatch(fnBody('renderHint'), /addEventListener/);
});

test('S-B3 the Ensayo lean is not overridden by the infinite idle animation', () => {
  const idle = css.match(/@keyframes thief-idle\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const lean = rules(css, '.thief.is-leaning').join(';');
  if (/transform\s*:/.test(idle) && /(?:^|[;\s])transform\s*:/.test(lean)) {
    assert.match(lean, /animation(?:-name)?\s*:\s*none/);
  }
});

test('S-B4 README does not claim file:// blocks the fonts', () => {
  assert.doesNotMatch(readme, /bloquean las fuentes/);
});

test('S-B5 an open dossier makes the background inert and Escape closes from any focus', () => {
  assert.match(js, /showModal\(|\.inert\s*=\s*true|setAttribute\(\s*'inert'/);
  assert.match(js, /showModal\(|document\.addEventListener\(\s*'keydown'/);
});

test('S-B6 cables can be targeted with the keyboard', () => {
  const cable = fnBody('createCable') + fnBody('registerCable');
  assert.match(cable, /tabindex|tabIndex/);
  assert.match(cable, /keydown/);
});

test('S-B7 the dossier close button stays inside a 320px viewport', () => {
  const small = section('@media (max-width: 600px)', '@media (prefers-reduced-motion');
  const viewport = 320;
  const padding = minPx(prop(rules(css, '.overlay')[0], 'padding'));
  const dossierWidth = prop(rules(small, '.dossier')[0] ?? '', 'width') ?? prop(rules(css, '.dossier')[0], 'width');
  const match = dossierWidth.match(/min\(\s*([\d.]+)px\s*,\s*([\d.]+)vw\s*\)/);
  const width = match ? Math.min(Number(match[1]), (Number(match[2]) * viewport) / 100) : minPx(dossierWidth);
  const right = minPx(prop(rules(small, '.overlay-close')[0], 'right'));
  const closeRight = padding + width - right;
  assert.ok(closeRight <= viewport, `close button right edge ${closeRight}px > ${viewport}px`);
});

test('S-B8 an inventory drag is reset when the browser cancels the pointer', () => {
  assert.match(js, /'pointercancel'/);
});

test('S-B9 README does not promise a cursor change for the locked gear', () => {
  assert.doesNotMatch(readme, /las tijeras o el engranaje\. El cursor cambia/);
});
