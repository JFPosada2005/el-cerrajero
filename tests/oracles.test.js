import test from 'node:test';
import assert from 'node:assert/strict';
import { ORACLES, oracleAccepts } from '../src/game/oracles.js';
test('balanced-turns opens with balanced pairs', () => {
  assert.equal(oracleAccepts('balanced-turns', 'AB'), true);
  assert.equal(oracleAccepts('balanced-turns', 'AABB'), true);
});
test('balanced-turns stays shut with the repair examples', () => {
  assert.equal(oracleAccepts('balanced-turns', ''), false);
  assert.equal(oracleAccepts('balanced-turns', 'A'), false);
  assert.equal(oracleAccepts('balanced-turns', 'B'), false);
  assert.equal(oracleAccepts('balanced-turns', 'AAB'), false);
  assert.equal(oracleAccepts('balanced-turns', 'ABB'), false);
});
test('a-n-b-n opens with stacked ups then downs', () => {
  assert.equal(oracleAccepts('a-n-b-n', 'AB'), true);
  assert.equal(oracleAccepts('a-n-b-n', 'AABB'), true);
  assert.equal(oracleAccepts('a-n-b-n', 'AAABBB'), true);
});
test('a-n-b-n stays shut with the build examples', () => {
  assert.equal(oracleAccepts('a-n-b-n', ''), false);
  assert.equal(oracleAccepts('a-n-b-n', 'A'), false);
  assert.equal(oracleAccepts('a-n-b-n', 'B'), false);
  assert.equal(oracleAccepts('a-n-b-n', 'AAB'), false);
  assert.equal(oracleAccepts('a-n-b-n', 'ABB'), false);
  assert.equal(oracleAccepts('a-n-b-n', 'BA'), false);
});
test('an unknown oracle id throws', () => {
  assert.throws(() => oracleAccepts('no-such-language', 'AB'), /unknown oracle/);
  assert.equal(typeof ORACLES['balanced-turns'], 'function');
  assert.equal(typeof ORACLES['a-n-b-n'], 'function');
});
