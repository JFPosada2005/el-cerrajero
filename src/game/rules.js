import { createDFA, simulateDFA, areEquivalentDFA } from '../core/dfa.js';

export function buildPlayerDFA(level, transitions) {
  return createDFA({
    states: level.states.map(state => state.id),
    alphabet: level.alphabet,
    start: level.states.find(state => state.start).id,
    accept: level.states.filter(state => state.accept).map(state => state.id),
    transitions,
  });
}

export function testKey(player, key) {
  return simulateDFA(player, key);
}

export function runHeist(player, target) {
  const result = areEquivalentDFA(player, target);
  if (result.equivalent) {
    return { escaped: false, counterexample: null, reason: null };
  }
  const acceptedByTarget = simulateDFA(target, result.counterexample).accepted;
  const reason = acceptedByTarget ? 'lockout' : 'intruder';
  return { escaped: true, counterexample: result.counterexample, reason };
}
