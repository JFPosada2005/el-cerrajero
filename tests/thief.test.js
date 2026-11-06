import test from 'node:test';
import assert from 'node:assert/strict';
import { level1 } from '../src/game/level1.js';
import { formatLine, thiefReport } from '../src/game/thief.js';

test('formatLine replaces every known placeholder', () => {
  const line = 'Llave {key} en {cell}';
  assert.equal(formatLine(line, { key: '121', cell: 'q0' }), 'Llave 121 en q0');
});

test('formatLine keeps unknown placeholders untouched', () => {
  assert.equal(formatLine('Llave {key}', {}), 'Llave {key}');
});

test('a clean heist reports that the thief gave up', () => {
  const report = thiefReport({ escaped: false, counterexample: null, reason: null }, level1);
  assert.equal(report.text, level1.thief.giveUp);
  assert.equal(report.tone, 'good');
});

test('an intruder report names the key that opened the vault', () => {
  const report = thiefReport({ escaped: true, counterexample: '121', reason: 'intruder' }, level1);
  assert.match(report.text, /121/);
  assert.equal(report.tone, 'bad');
});

test('a lockout report names the client key that failed', () => {
  const report = thiefReport({ escaped: true, counterexample: '123', reason: 'lockout' }, level1);
  assert.match(report.text, /123/);
  assert.equal(report.tone, 'bad');
});
