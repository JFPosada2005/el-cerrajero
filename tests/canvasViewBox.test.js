import test from 'node:test';
import assert from 'node:assert/strict';
import { viewBoxForCells } from '../src/ui/graphEditor.js';
import { level1 } from '../src/game/level1.js';
import { level3 } from '../src/game/level3.js';

function parse(viewBox) {
  const [x, y, width, height] = viewBox.split(' ').map(Number);
  assert.ok([x, y, width, height].every(Number.isFinite), `viewBox inválido: ${viewBox}`);
  return { x, y, width, height };
}

function containsAll(box, cells, padding) {
  for (const cell of cells) {
    assert.ok(box.x <= cell.x - padding, `celda ${cell.id} recortada a la izquierda`);
    assert.ok(box.y <= cell.y - padding, `celda ${cell.id} recortada arriba`);
    assert.ok(box.x + box.width >= cell.x + padding, `celda ${cell.id} recortada a la derecha`);
    assert.ok(box.y + box.height >= cell.y + padding, `celda ${cell.id} recortada abajo`);
  }
}

test('N1 encuadra sus celdas en menos de 820×520', () => {
  const cells = level1.phases.repair.cells;
  const box = parse(viewBoxForCells(cells));
  assert.ok(box.width < 820, `ancho ${box.width} no achica el mecanismo`);
  assert.ok(box.height < 520, `alto ${box.height} no achica el mecanismo`);
  containsAll(box, cells, 100);
});

test('el padding por defecto deja aire para nodos y etiquetas', () => {
  const cells = level1.phases.repair.cells;
  const box = parse(viewBoxForCells(cells));
  const xs = cells.map((cell) => cell.x);
  const ys = cells.map((cell) => cell.y);
  assert.ok(box.x <= Math.min(...xs) - 90, 'padding izquierdo insuficiente');
  assert.ok(box.y <= Math.min(...ys) - 90, 'padding superior insuficiente');
  assert.ok(box.x + box.width >= Math.max(...xs) + 90, 'padding derecho insuficiente');
  assert.ok(box.y + box.height >= Math.max(...ys) + 90, 'padding inferior insuficiente');
});

test('N3 (más celdas) también encuadra con padding', () => {
  const cells = level3.phases.repair.cells;
  const box = parse(viewBoxForCells(cells));
  containsAll(box, cells, 100);
});

test('el alto mínimo evita achatar escenas de una fila', () => {
  const box = parse(viewBoxForCells([{ id: 'a', x: 100, y: 200 }, { id: 'b', x: 300, y: 200 }]));
  assert.ok(box.height >= 300, `alto ${box.height} achata la escena`);
  containsAll(box, [{ id: 'a', x: 100, y: 200 }, { id: 'b', x: 300, y: 200 }], 100);
});

test('sin celdas cae al encuadre anterior sin romper', () => {
  assert.equal(viewBoxForCells([]), '0 0 820 520');
});
