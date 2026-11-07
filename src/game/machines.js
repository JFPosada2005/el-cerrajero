import { createDFA } from '../core/dfa.js';
import { createNFA } from '../core/nfa.js';
import { EPSILON } from '../core/symbols.js';

function appendTarget(transitions, from, symbol, to) {
  const row = transitions[from];
  if (row[symbol] === undefined) {
    row[symbol] = [];
  }
  row[symbol].push(to);
}

function toNFA(alphabet, puzzle, blueprint) {
  const states = puzzle.cells.map((cell) => cell.id);
  const startCell = puzzle.cells.find((cell) => cell.start === true);
  if (startCell === undefined) {
    throw new Error('toMachine: puzzle has no start cell');
  }
  const accept = puzzle.cells.filter((cell) => cell.accept === true).map((cell) => cell.id);
  const transitions = {};
  for (const state of states) {
    transitions[state] = {};
  }
  for (const wire of blueprint.wires) {
    if (transitions[wire.from] === undefined) {
      throw new Error(`toMachine: wire from unknown cell "${wire.from}"`);
    }
    if (wire.spring === true) {
      appendTarget(transitions, wire.from, EPSILON, wire.to);
      continue;
    }
    appendTarget(transitions, wire.from, wire.key, wire.to);
  }
  return createNFA({ states, alphabet: [...alphabet], start: startCell.id, accept, transitions });
}

function toDFA(alphabet, puzzle, blueprint) {
  const states = puzzle.cells.map((cell) => cell.id);
  const startCell = puzzle.cells.find((cell) => cell.start === true);
  if (startCell === undefined) {
    throw new Error('toMachine: puzzle has no start cell');
  }
  const accept = puzzle.cells.filter((cell) => cell.accept === true).map((cell) => cell.id);
  const transitions = {};
  for (const state of states) {
    transitions[state] = {};
  }
  for (const wire of blueprint.wires) {
    if (wire.spring === true) {
      continue;
    }
    if (transitions[wire.from] === undefined) {
      throw new Error(`toMachine: wire from unknown cell "${wire.from}"`);
    }
    if (transitions[wire.from][wire.key] !== undefined) {
      throw new Error(`toMachine: duplicate wire for "${wire.from}" with key "${wire.key}"`);
    }
    transitions[wire.from][wire.key] = wire.to;
  }
  return createDFA({ states, alphabet: [...alphabet], start: startCell.id, accept, transitions });
}

export function toMachine(alphabet, puzzle, blueprint) {
  if (puzzle.target?.machine?.type === 'nfa') {
    return toNFA(alphabet, puzzle, blueprint);
  }
  return toDFA(alphabet, puzzle, blueprint);
}
