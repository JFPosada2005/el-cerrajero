import { areEquivalentDFA, createDFA, simulateDFA } from '../core/dfa.js';
import { nfaToDFA } from '../core/nfa.js';

function withAlphabet(machine, alphabet) {
  return createDFA({ states: machine.states, alphabet, start: machine.start, accept: machine.accept, transitions: machine.transitions });
}

function normalized(machine, alphabet) {
  if (machine.type === 'nfa') {
    return nfaToDFA(machine, alphabet);
  }
  return withAlphabet(machine, alphabet);
}

export function judge(puzzle, machine) {
  const kind = puzzle.target.kind;
  if (kind !== 'machine') {
    throw new Error(`judge: unsupported target kind: ${kind}`);
  }
  const alphabet = [...puzzle.target.machine.alphabet];
  const target = normalized(puzzle.target.machine, [...alphabet]);
  const player = normalized(machine, [...alphabet]);
  const result = areEquivalentDFA(target, player);
  if (result.equivalent === true) {
    return { correct: true, counterexample: null, reason: null, expected: null, actual: null, method: 'exact', coverage: null };
  }
  const expected = simulateDFA(target, result.counterexample).accepted;
  const actual = simulateDFA(player, result.counterexample).accepted;
  const reason = expected === true ? 'lockout' : 'intruder';
  return { correct: false, counterexample: result.counterexample, reason, expected, actual, method: 'exact', coverage: null };
}
