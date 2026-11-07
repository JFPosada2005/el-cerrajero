import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LIMITS, withLimits } from '../src/core/limits.js';
import { EPSILON } from '../src/core/symbols.js';

test('DEFAULT_LIMITS has the frozen values', () => {
  assert.deepEqual(DEFAULT_LIMITS, { maxSteps: 5000, maxConfigs: 20000, maxStack: 64, maxFrames: 2000 });
});

test('withLimits overrides only the given keys', () => {
  assert.deepEqual(withLimits({ maxSteps: 10 }), { maxSteps: 10, maxConfigs: 20000, maxStack: 64, maxFrames: 2000 });
});

test('withLimits with no arguments returns the defaults', () => {
  assert.deepEqual(withLimits(), { maxSteps: 5000, maxConfigs: 20000, maxStack: 64, maxFrames: 2000 });
});

test('EPSILON is the epsilon character', () => {
  assert.equal(EPSILON, 'ε');
});
