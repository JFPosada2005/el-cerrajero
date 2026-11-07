import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEdit } from '../src/game/blueprint.js';

const puzzle = {};

test('cut removes all wires between the pair', () => {
  const blueprint = { wires: [{ from: 'q0', to: 'q1', key: '1' }, { from: 'q0', to: 'q1', key: '2' }, { from: 'q1', to: 'q2', key: '1' }] };
  const result = applyEdit(puzzle, ['wire'], blueprint, { type: 'cut-wire', from: 'q0', to: 'q1' });
  assert.equal(result.effect, 'removed');
  assert.equal(result.reason, null);
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q1', to: 'q2', key: '1' }] });
});

test('cut of a nonexistent pair is kept', () => {
  const blueprint = { wires: [{ from: 'q0', to: 'q1', key: '1' }] };
  const result = applyEdit(puzzle, ['wire'], blueprint, { type: 'cut-wire', from: 'q1', to: 'q2' });
  assert.equal(result.effect, 'kept');
  assert.equal(result.reason, null);
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q0', to: 'q1', key: '1' }] });
});

test('connect a new key adds it', () => {
  const blueprint = { wires: [] };
  const result = applyEdit(puzzle, ['wire'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q1', tool: { kind: 'key', key: '1' } });
  assert.equal(result.effect, 'added');
  assert.equal(result.reason, null);
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q0', to: 'q1', key: '1' }] });
});

test('connecting an identical wire is kept and does not duplicate', () => {
  const blueprint = { wires: [{ from: 'q0', to: 'q1', key: '1' }] };
  const result = applyEdit(puzzle, ['wire'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q1', tool: { kind: 'key', key: '1' } });
  assert.equal(result.effect, 'kept');
  assert.equal(result.reason, null);
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q0', to: 'q1', key: '1' }] });
});

test('same key from the same cell without fork is moved', () => {
  const blueprint = { wires: [{ from: 'q0', to: 'q1', key: '1' }] };
  const result = applyEdit(puzzle, ['wire'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q2', tool: { kind: 'key', key: '1' } });
  assert.equal(result.effect, 'moved');
  assert.equal(result.reason, null);
  assert.equal(result.blueprint.wires.length, 1);
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q0', to: 'q2', key: '1' }] });
});

test('moved keeps the existing stack', () => {
  const stack = { top: 'chip', action: 'push' };
  const blueprint = { wires: [{ from: 'q0', to: 'q1', key: 'A', stack }] };
  const result = applyEdit(puzzle, ['wire', 'stack'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q2', tool: { kind: 'key', key: 'A' } });
  assert.equal(result.effect, 'moved');
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q0', to: 'q2', key: 'A', stack: { top: 'chip', action: 'push' } }] });
});

test('same key from the same cell with fork is added', () => {
  const blueprint = { wires: [{ from: 'q0', to: 'q1', key: '1' }] };
  const result = applyEdit(puzzle, ['wire', 'fork'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q2', tool: { kind: 'key', key: '1' } });
  assert.equal(result.effect, 'added');
  assert.equal(result.reason, null);
  assert.equal(result.blueprint.wires.length, 2);
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q0', to: 'q1', key: '1' }, { from: 'q0', to: 'q2', key: '1' }] });
});

test('self-loop without gear is blocked with needs-gear', () => {
  const blueprint = { wires: [{ from: 'q0', to: 'q1', key: '1' }] };
  const result = applyEdit(puzzle, ['wire'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q0', tool: { kind: 'key', key: '1' } });
  assert.equal(result.effect, 'blocked');
  assert.equal(result.reason, 'needs-gear');
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q0', to: 'q1', key: '1' }] });
});

test('self-loop with gear is added', () => {
  const blueprint = { wires: [] };
  const result = applyEdit(puzzle, ['wire', 'gear'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q0', tool: { kind: 'key', key: '1' } });
  assert.equal(result.effect, 'added');
  assert.equal(result.reason, null);
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q0', to: 'q0', key: '1' }] });
});

test('spring self-loop is blocked with spring-loop', () => {
  const blueprint = { wires: [] };
  const result = applyEdit(puzzle, ['wire', 'spring'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q0', tool: { kind: 'spring' } });
  assert.equal(result.effect, 'blocked');
  assert.equal(result.reason, 'spring-loop');
  assert.deepEqual(result.blueprint, { wires: [] });
});

test('a normal spring is added', () => {
  const blueprint = { wires: [] };
  const result = applyEdit(puzzle, ['wire', 'spring'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q1', tool: { kind: 'spring' } });
  assert.equal(result.effect, 'added');
  assert.equal(result.reason, null);
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q0', to: 'q1', spring: true }] });
});

test('an identical spring is kept', () => {
  const blueprint = { wires: [{ from: 'q0', to: 'q1', spring: true }] };
  const result = applyEdit(puzzle, ['wire', 'spring'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q1', tool: { kind: 'spring' } });
  assert.equal(result.effect, 'kept');
  assert.equal(result.reason, null);
  assert.deepEqual(result.blueprint, { wires: [{ from: 'q0', to: 'q1', spring: true }] });
});

test('applyEdit never mutates the input blueprint', () => {
  const blueprint = { wires: [{ from: 'q0', to: 'q1', key: '1' }] };
  const snapshot = structuredClone(blueprint);
  const added = applyEdit(puzzle, ['wire'], blueprint, { type: 'connect-wire', from: 'q1', to: 'q2', tool: { kind: 'key', key: '2' } });
  assert.deepEqual(blueprint, snapshot);
  assert.notEqual(added.blueprint, blueprint);
  const moved = applyEdit(puzzle, ['wire'], blueprint, { type: 'connect-wire', from: 'q0', to: 'q2', tool: { kind: 'key', key: '1' } });
  assert.deepEqual(blueprint, snapshot);
  assert.notEqual(moved.blueprint, blueprint);
  const cut = applyEdit(puzzle, ['wire'], blueprint, { type: 'cut-wire', from: 'q0', to: 'q1' });
  assert.deepEqual(blueprint, snapshot);
  assert.notEqual(cut.blueprint, blueprint);
});

test('unknown edit type throws', () => {
  const blueprint = { wires: [] };
  assert.throws(() => applyEdit(puzzle, ['wire'], blueprint, { type: 'set-pin' }), Error);
});
