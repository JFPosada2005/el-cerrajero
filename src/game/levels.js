import { acceptsDFA } from '../core/dfa.js';
import { acceptsNFA } from '../core/nfa.js';
import { level1 } from './level1.js';
import { level2 } from './level2.js';
import { level3 } from './level3.js';
export const LEVELS = [level1, level2, level3];
const BANNED = ['autómata', 'automata', 'afnd', 'afd', 'transición', 'estado', 'lenguaje', 'formal'];
function checkTopLevel(level) {
  const required = ['id', 'contract', 'title', 'client', 'brief', 'machine', 'workspace', 'keys', 'parts', 'newPart', 'thief', 'phases'];
  for (const field of required) {
    if (level[field] === undefined) {
      throw new Error(`level is missing field "${field}"`);
    }
  }
  if (level.machine !== 'dfa' && level.machine !== 'nfa') {
    throw new Error(`level machine must be "dfa" or "nfa"`);
  }
  if (level.workspace !== 'graph') {
    throw new Error(`level workspace must be "graph"`);
  }
}
function checkKeys(level) {
  if (Array.isArray(level.keys) === false) {
    throw new Error('level keys must be an array');
  }
  const seen = new Set();
  for (const key of level.keys) {
    if (typeof key.symbol !== 'string') {
      throw new Error('key symbol must be a string');
    }
    if (key.symbol.length !== 1) {
      throw new Error(`key symbol "${key.symbol}" must be a single character`);
    }
    if (seen.has(key.symbol) === true) {
      throw new Error(`duplicate key symbol "${key.symbol}"`);
    }
    seen.add(key.symbol);
  }
}
function checkPuzzleCells(puzzle, name) {
  if (Array.isArray(puzzle.cells) === false) {
    throw new Error(`${name} puzzle cells must be an array`);
  }
  const seen = new Set();
  for (const cell of puzzle.cells) {
    if (seen.has(cell.id) === true) {
      throw new Error(`${name} puzzle has duplicate cell id "${cell.id}"`);
    }
    seen.add(cell.id);
  }
  const starts = puzzle.cells.filter((cell) => cell.start === true);
  if (starts.length !== 1) {
    throw new Error(`${name} puzzle must have exactly one start cell`);
  }
  const accepts = puzzle.cells.filter((cell) => cell.accept === true);
  if (accepts.length < 1) {
    throw new Error(`${name} puzzle must have at least one accept cell`);
  }
}
function checkWires(puzzle, level, name) {
  const ids = new Set(puzzle.cells.map((cell) => cell.id));
  const wires = puzzle.blueprint?.wires ?? [];
  const alphabet = level.keys.map((key) => key.symbol);
  for (const wire of wires) {
    if (ids.has(wire.from) === false) {
      throw new Error(`${name} puzzle wire references unknown cell "${wire.from}"`);
    }
    if (ids.has(wire.to) === false) {
      throw new Error(`${name} puzzle wire references unknown cell "${wire.to}"`);
    }
    if (wire.spring === true) {
      if (level.parts.includes('spring') === false) {
        throw new Error(`${name} puzzle spring wire requires the spring part`);
      }
      if (wire.from === wire.to) {
        throw new Error(`${name} puzzle spring wire cannot loop on its own cell`);
      }
      continue;
    }
    if (alphabet.includes(wire.key) === false) {
      throw new Error(`${name} puzzle wire key "${wire.key}" is not in the target alphabet`);
    }
    if (wire.from === wire.to) {
      if (level.parts.includes('gear') === false) {
        throw new Error(`${name} puzzle self-loop requires the gear part`);
      }
    }
  }
}
function checkTarget(puzzle, level, name) {
  const expected = level.keys.map((key) => key.symbol);
  const alphabet = puzzle.target?.machine?.alphabet ?? [];
  if (alphabet.length !== expected.length) {
    throw new Error(`${name} puzzle target alphabet must equal the key symbols in order`);
  }
  for (let index = 0; index < expected.length; index += 1) {
    if (alphabet[index] !== expected[index]) {
      throw new Error(`${name} puzzle target alphabet must equal the key symbols in order`);
    }
  }
}
function checkExamples(puzzle, name) {
  const machine = puzzle.target?.machine;
  if (machine === undefined) {
    throw new Error(`${name} puzzle is missing its target machine`);
  }
  const accepts = machine.type === 'nfa' ? acceptsNFA : acceptsDFA;
  for (const word of puzzle.examples?.open ?? []) {
    if (accepts(machine, word) !== true) {
      throw new Error(`${name} puzzle open example "${word}" is not accepted by the target`);
    }
  }
  for (const word of puzzle.examples?.closed ?? []) {
    if (accepts(machine, word) !== false) {
      throw new Error(`${name} puzzle closed example "${word}" is accepted by the target`);
    }
  }
}
function checkThief(level) {
  if (typeof level.thief?.giveUp !== 'string') {
    throw new Error('thief giveUp must be a non-empty string');
  }
  if (level.thief.giveUp.length === 0) {
    throw new Error('thief giveUp must be a non-empty string');
  }
  if (typeof level.thief?.lines?.intruder !== 'string') {
    throw new Error('thief lines intruder must be a non-empty string');
  }
  if (level.thief.lines.intruder.length === 0) {
    throw new Error('thief lines intruder must be a non-empty string');
  }
  if (typeof level.thief?.lines?.lockout !== 'string') {
    throw new Error('thief lines lockout must be a non-empty string');
  }
  if (level.thief.lines.lockout.length === 0) {
    throw new Error('thief lines lockout must be a non-empty string');
  }
}
function checkCopy(level) {
  const texts = [level.title, level.brief, level.thief.giveUp];
  for (const line of Object.values(level.thief.lines)) {
    texts.push(line);
  }
  for (const puzzle of Object.values(level.phases)) {
    texts.push(puzzle.goal);
    texts.push(puzzle.intro);
    for (const hint of puzzle.hints ?? []) {
      texts.push(hint);
    }
  }
  for (const text of texts) {
    const lower = String(text).toLowerCase();
    for (const word of BANNED) {
      if (lower.includes(word) === true) {
        throw new Error(`visible copy contains banned word "${word}"`);
      }
    }
  }
}
export function validateLevel(level) {
  checkTopLevel(level);
  checkKeys(level);
  if (level.phases?.repair === undefined) {
    throw new Error('level is missing phase "repair"');
  }
  if (level.phases?.build === undefined) {
    throw new Error('level is missing phase "build"');
  }
  checkPuzzleCells(level.phases.repair, 'repair');
  checkPuzzleCells(level.phases.build, 'build');
  checkWires(level.phases.repair, level, 'repair');
  checkWires(level.phases.build, level, 'build');
  checkTarget(level.phases.repair, level, 'repair');
  checkTarget(level.phases.build, level, 'build');
  checkExamples(level.phases.repair, 'repair');
  checkExamples(level.phases.build, 'build');
  checkThief(level);
  checkCopy(level);
  return true;
}
export function getLevel(id) {
  const found = LEVELS.find((level) => level.id === id);
  if (found === undefined) {
    throw new Error(`unknown level ${id}`);
  }
  return found;
}
