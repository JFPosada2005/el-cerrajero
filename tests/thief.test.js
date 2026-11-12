import test from 'node:test';
import assert from 'node:assert/strict';
import { level1 } from '../src/game/level1.js';
import { level5 } from '../src/game/level5.js';
import { formatLine, thiefReport } from '../src/game/thief.js';
test('formatLine replaces every known placeholder', () => {
  const line = 'Llave {key} en {cell}';
  assert.equal(formatLine(line, { key: '121', cell: 'q0' }), 'Llave 121 en q0');
});
test('formatLine keeps unknown placeholders untouched', () => {
  assert.equal(formatLine('Llave {key}', {}), 'Llave {key}');
});
test('a correct verdict reports that the thief gave up', () => {
  const report = thiefReport({ correct: true, counterexample: null, reason: null }, level1);
  assert.equal(report.text, level1.thief.giveUp);
  assert.equal(report.tone, 'good');
});
test('an intruder verdict names the key that opened the vault', () => {
  const report = thiefReport({ correct: false, counterexample: '121', reason: 'intruder' }, level1);
  assert.match(report.text, /121/);
  assert.equal(report.tone, 'bad');
});
test('a lockout verdict names the client key that failed', () => {
  const report = thiefReport({ correct: false, counterexample: '123', reason: 'lockout' }, level1);
  assert.match(report.text, /123/);
  assert.equal(report.tone, 'bad');
});
test('a wrong-output verdict names the deposit and both counts', () => {
  const report = thiefReport({ correct: false, counterexample: '1', reason: 'wrong-output', expected: '10', actual: '11' }, level5);
  assert.equal(report.text, 'El ladrón depositó 1 y el contador marcó 11 en vez de 10.');
  assert.equal(report.tone, 'bad');
});
