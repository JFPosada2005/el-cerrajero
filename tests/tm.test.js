import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTM, createTM, runTM, acceptsTM } from '../src/core/tm.js';

function incrementSpec() {
  return {
    states: ['seek', 'carry', 'done'],
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', '_'],
    blank: '_',
    start: 'seek',
    accept: ['done'],
    transitions: {
      seek: {
        '0': { write: '0', move: 'R', to: 'seek' },
        '1': { write: '1', move: 'R', to: 'seek' },
        '_': { write: '_', move: 'L', to: 'carry' }
      },
      carry: {
        '1': { write: '0', move: 'L', to: 'carry' },
        '0': { write: '1', move: 'R', to: 'done' },
        '_': { write: '1', move: 'R', to: 'done' }
      },
      done: {}
    }
  };
}

function alarmSpec() {
  return {
    states: ['a', 'done'],
    inputAlphabet: ['0'],
    tapeAlphabet: ['0', '_'],
    blank: '_',
    start: 'a',
    accept: ['done'],
    transitions: { a: {}, done: {} }
  };
}

test('the +1 machine increments binary inputs', () => {
  const machine = createTM(incrementSpec());
  const cases = [['0', '1'], ['1', '10'], ['10', '11'], ['11', '100'], ['1111', '10000']];
  for (const [input, expected] of cases) {
    const result = runTM(machine, input);
    assert.equal(result.output, expected, `input ${input}`);
    assert.equal(result.outcome, 'accept', `input ${input}`);
    assert.equal(result.accepted, true, `input ${input}`);
    assert.equal(acceptsTM(machine, input), true, `input ${input}`);
  }
});

test('runTM returns the full accept shape for 0', () => {
  const machine = createTM(incrementSpec());
  const result = runTM(machine, '0');
  assert.deepEqual(result, { accepted: true, outcome: 'accept', steps: 3, frames: [], output: '1' });
});

test('runTM reports invalid-symbol for 2', () => {
  const machine = createTM(incrementSpec());
  const result = runTM(machine, '2');
  assert.equal(result.accepted, false);
  assert.equal(result.outcome, 'invalid-symbol');
  assert.equal(acceptsTM(machine, '2'), false);
});

test('runTM reports alarm when no rule matches', () => {
  const machine = createTM(alarmSpec());
  const result = runTM(machine, '0');
  assert.equal(result.accepted, false);
  assert.equal(result.outcome, 'alarm');
  assert.equal(result.steps, 0);
});

test('runTM reports limit with a small maxSteps', () => {
  const machine = createTM(incrementSpec());
  const result = runTM(machine, '1111', { maxSteps: 2 });
  assert.equal(result.accepted, false);
  assert.equal(result.outcome, 'limit');
  assert.equal(result.steps, 2);
});

test('recorded frames start at step 0 with a 7-cell window', () => {
  const machine = createTM(incrementSpec());
  const result = runTM(machine, '1', { record: true });
  assert.equal(result.outcome, 'accept');
  assert.deepEqual(result.frames[0], {
    step: 0,
    state: 'seek',
    head: 0,
    read: '1',
    rule: { write: '1', move: 'R', to: 'seek' },
    window: { start: -3, symbols: ['_', '_', '_', '1', '_', '_', '_'] }
  });
});

test('the halted accept frame carries rule null', () => {
  const machine = createTM(incrementSpec());
  const result = runTM(machine, '1', { record: true });
  const last = result.frames[result.frames.length - 1];
  assert.equal(last.state, 'done');
  assert.equal(last.rule, null);
  assert.equal(last.step, result.steps);
});

test('frames stay empty without record', () => {
  const machine = createTM(incrementSpec());
  const result = runTM(machine, '11');
  assert.deepEqual(result.frames, []);
});

test('createTM sets type and deep-copies the spec', () => {
  const spec = incrementSpec();
  const machine = createTM(spec);
  assert.equal(machine.type, 'tm');
  spec.states.push('extra');
  spec.transitions.seek['0'].write = '1';
  assert.deepEqual(machine.states, ['seek', 'carry', 'done']);
  assert.equal(machine.transitions.seek['0'].write, '0');
});

test('validateTM accepts the +1 machine', () => {
  assert.equal(validateTM(incrementSpec()), true);
});

test('validateTM rejects a blank inside the input alphabet', () => {
  const spec = incrementSpec();
  spec.inputAlphabet = ['0', '1', '_'];
  assert.throws(() => validateTM(spec));
});

test('validateTM rejects a missing blank in the tape alphabet', () => {
  const spec = incrementSpec();
  spec.tapeAlphabet = ['0', '1'];
  assert.throws(() => validateTM(spec));
});

test('validateTM rejects a move other than L or R', () => {
  const spec = incrementSpec();
  spec.transitions.seek['0'].move = 'S';
  assert.throws(() => validateTM(spec));
});

test('validateTM rejects rules on an accept state', () => {
  const spec = incrementSpec();
  spec.transitions.done = { '0': { write: '0', move: 'R', to: 'done' } };
  assert.throws(() => validateTM(spec));
});

test('validateTM rejects an unknown target state', () => {
  const spec = incrementSpec();
  spec.transitions.seek['0'].to = 'nowhere';
  assert.throws(() => validateTM(spec));
});

test('validateTM rejects a write outside the tape alphabet', () => {
  const spec = incrementSpec();
  spec.transitions.seek['0'].write = '2';
  assert.throws(() => validateTM(spec));
});
