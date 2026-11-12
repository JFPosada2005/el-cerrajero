import { areEquivalentDFA, createDFA, simulateDFA } from '../core/dfa.js';
import { nfaToDFA } from '../core/nfa.js';
import { runPDA } from '../core/pda.js';
import { runTM } from '../core/tm.js';
import { functionFor } from './functions.js';
import { enumerateWords, randomWords, shortlexCompare } from '../core/order.js';
import { ORACLES } from './oracles.js';

function withAlphabet(machine, alphabet) {
  return createDFA({ states: machine.states, alphabet, start: machine.start, accept: machine.accept, transitions: machine.transitions });
}

function normalized(machine, alphabet) {
  if (machine.type === 'nfa') {
    return nfaToDFA(machine, alphabet);
  }
  return withAlphabet(machine, alphabet);
}

function languageCoverage(puzzle, tested, maxSteps) {
  return { exhaustiveLength: puzzle.judge.exhaustiveLength, tested, families: ['A^nB^n', 'A^(n-1)B^n', 'A^nB^(n-1)'], maxSteps };
}
function judgeLanguage(puzzle, machine) {
  if (machine.type !== 'pda') {
    throw new Error('judge: language targets need a PDA machine');
  }
  const alphabet = [...machine.alphabet];
  const oracle = ORACLES[puzzle.target.id];
  const up = alphabet[0];
  const down = alphabet[1];
  const candidates = enumerateWords(alphabet, puzzle.judge.exhaustiveLength);
  for (let n = 1; n <= puzzle.judge.maxN; n += 1) {
    candidates.push(up.repeat(n) + down.repeat(n));
    if (n >= 2) {
      candidates.push(up.repeat(n - 1) + down.repeat(n));
      candidates.push(up.repeat(n) + down.repeat(n - 1));
    }
  }
  const sampled = randomWords(alphabet, { seed: puzzle.judge.random.seed, count: puzzle.judge.random.count, minLength: 11, maxLength: puzzle.judge.random.maxLength });
  for (const word of sampled) {
    candidates.push(word);
  }
  const seen = new Set();
  const words = [];
  for (const word of candidates) {
    if (seen.has(word) === true) {
      continue;
    }
    seen.add(word);
    words.push(word);
  }
  words.sort(shortlexCompare(alphabet));
  const limits = { maxConfigs: puzzle.judge.limits.maxConfigs, maxStack: puzzle.judge.limits.maxStack };
  let maxSteps = 0;
  for (const word of words) {
    const expected = oracle(word);
    const run = runPDA(machine, word, limits);
    if (run.steps > maxSteps) {
      maxSteps = run.steps;
    }
    if (run.outcome === 'limit') {
      if (expected === true) {
        return { correct: false, counterexample: word, reason: 'jam', expected: true, actual: null, method: 'bounded', coverage: languageCoverage(puzzle, words.length, maxSteps) };
      }
      continue;
    }
    if (run.accepted !== expected) {
      const reason = expected === true ? 'lockout' : 'intruder';
      return { correct: false, counterexample: word, reason, expected, actual: run.accepted, method: 'bounded', coverage: languageCoverage(puzzle, words.length, maxSteps) };
    }
  }
  return { correct: true, counterexample: null, reason: null, expected: null, actual: null, method: 'bounded', coverage: languageCoverage(puzzle, words.length, maxSteps) };
}
function functionFamilies(id) {
  if (id === 'binary-sum') {
    return ['pairs', 'carry-chains'];
  }
  return ['ones'];
}
function functionCoverage(puzzle, tested, maxSteps) {
  return { exhaustiveLength: 0, tested, families: functionFamilies(puzzle.target.id), maxSteps };
}
function judgeFunction(puzzle, machine) {
  if (machine.type !== 'tm') {
    throw new Error('judge: function targets need a TM machine');
  }
  const fn = functionFor(puzzle.target.id);
  const seen = new Set();
  const inputs = [];
  for (const word of fn.inputs(puzzle.judge.inputs)) {
    if (seen.has(word) === true) {
      continue;
    }
    seen.add(word);
    inputs.push(word);
  }
  inputs.sort(shortlexCompare(['0', '1', '+']));
  const maxSteps = puzzle.judge.limits.maxSteps;
  let observed = 0;
  for (const input of inputs) {
    const expected = fn.compute(input);
    const run = runTM(machine, input, { maxSteps });
    if (run.steps > observed) {
      observed = run.steps;
    }
    if (run.outcome === 'limit') {
      return { correct: false, counterexample: input, reason: 'jam', expected, actual: null, method: 'bounded', coverage: functionCoverage(puzzle, inputs.length, observed) };
    }
    if (run.outcome === 'alarm' || run.outcome === 'invalid-symbol') {
      return { correct: false, counterexample: input, reason: 'alarm', expected, actual: null, method: 'bounded', coverage: functionCoverage(puzzle, inputs.length, observed) };
    }
    if (fn.matches(run.output, expected) === false) {
      return { correct: false, counterexample: input, reason: 'wrong-output', expected, actual: run.output, method: 'bounded', coverage: functionCoverage(puzzle, inputs.length, observed) };
    }
  }
  return { correct: true, counterexample: null, reason: null, expected: null, actual: null, method: 'bounded', coverage: functionCoverage(puzzle, inputs.length, observed) };
}
export function judge(puzzle, machine) {
  const kind = puzzle.target.kind;
  if (kind === 'function') {
    return judgeFunction(puzzle, machine);
  }
  if (kind === 'language') {
    return judgeLanguage(puzzle, machine);
  }
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
