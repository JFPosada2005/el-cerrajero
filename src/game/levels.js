import { acceptsDFA } from '../core/dfa.js';
import { acceptsNFA } from '../core/nfa.js';
import { ORACLES, oracleAccepts } from './oracles.js';
import { functionFor } from './functions.js';
import { level1 } from './level1.js';
import { level2 } from './level2.js';
import { level3 } from './level3.js';
import { level4 } from './level4.js';
import { level5 } from './level5.js';
export const LEVELS = [level1, level2, level3, level4, level5];
const BANNED = ['autómata', 'automata', 'afnd', 'afd', 'transición', 'estado', 'lenguaje', 'formal'];
function checkTopLevel(level) {
  const required = ['id', 'contract', 'title', 'client', 'brief', 'machine', 'workspace', 'keys', 'parts', 'newPart', 'thief', 'phases'];
  for (const field of required) {
    if (level[field] === undefined) {
      throw new Error(`level is missing field "${field}"`);
    }
  }
  if (level.machine !== 'dfa' && level.machine !== 'nfa' && level.machine !== 'pda' && level.machine !== 'tm') {
    throw new Error(`level machine must be "dfa", "nfa", "pda" or "tm"`);
  }
  if (level.workspace !== 'graph' && level.workspace !== 'drum') {
    throw new Error(`level workspace must be "graph" or "drum"`);
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
function checkDrumPuzzle(puzzle, name) {
  if (Array.isArray(puzzle.sections) === false) {
    throw new Error(`${name} puzzle sections must be an array`);
  }
  const seen = new Set();
  for (const section of puzzle.sections) {
    if (seen.has(section.id) === true) {
      throw new Error(`${name} puzzle has duplicate section id "${section.id}"`);
    }
    seen.add(section.id);
  }
  const starts = puzzle.sections.filter((section) => section.start === true);
  if (starts.length !== 1) {
    throw new Error(`${name} puzzle must have exactly one start section`);
  }
  const accepts = puzzle.sections.filter((section) => section.accept === true);
  if (accepts.length < 1) {
    throw new Error(`${name} puzzle must have at least one accept section`);
  }
  if (puzzle.tape === undefined || Array.isArray(puzzle.tape.symbols) === false) {
    throw new Error(`${name} puzzle is missing its tape symbols`);
  }
  const symbols = new Set();
  for (const symbol of puzzle.tape.symbols) {
    if (symbols.has(symbol) === true) {
      throw new Error(`${name} puzzle has duplicate tape symbol "${symbol}"`);
    }
    symbols.add(symbol);
  }
  if (symbols.has(puzzle.tape.blank) === false) {
    throw new Error(`${name} puzzle tape must include its blank`);
  }
}
function checkDrumBlueprint(puzzle, name) {
  const ids = new Set(puzzle.sections.map((section) => section.id));
  const tape = new Set(puzzle.tape.symbols);
  const rules = puzzle.blueprint?.rules ?? {};
  for (const [section, row] of Object.entries(rules)) {
    if (ids.has(section) === false) {
      throw new Error(`${name} puzzle rule references unknown section "${section}"`);
    }
    if (row === null || row === undefined) {
      continue;
    }
    for (const [read, rule] of Object.entries(row)) {
      if (rule === null || rule === undefined) {
        continue;
      }
      if (tape.has(read) === false) {
        throw new Error(`${name} puzzle rule reads symbol "${read}" outside the tape alphabet`);
      }
      if (tape.has(rule.write) === false) {
        throw new Error(`${name} puzzle rule writes symbol "${rule.write}" outside the tape alphabet`);
      }
      if (rule.move !== 'L' && rule.move !== 'R') {
        throw new Error(`${name} puzzle rule move "${rule.move}" must be L or R`);
      }
      if (ids.has(rule.to) === false) {
        throw new Error(`${name} puzzle rule goes to unknown section "${rule.to}"`);
      }
    }
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
    if (wire.stack !== undefined) {
      if (level.parts.includes('stack') === false) {
        throw new Error(`${name} puzzle stack wire requires the stack part`);
      }
      if (wire.stack.top !== 'base' && wire.stack.top !== 'chip' && wire.stack.top !== 'any') {
        throw new Error(`${name} puzzle stack top "${wire.stack.top}" must be base, chip or any`);
      }
      if (wire.stack.action !== 'push' && wire.stack.action !== 'pop' && wire.stack.action !== 'keep') {
        throw new Error(`${name} puzzle stack action "${wire.stack.action}" must be push, pop or keep`);
      }
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
  if (puzzle.target?.kind === 'function') {
    functionFor(puzzle.target.id);
    return;
  }
  if (puzzle.target?.kind === 'language') {
    if (ORACLES[puzzle.target.id] === undefined) {
      throw new Error(`${name} puzzle has unknown language "${puzzle.target.id}"`);
    }
    return;
  }
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
  if (puzzle.target?.kind === 'function') {
    const fn = functionFor(puzzle.target.id);
    for (const run of puzzle.examples?.runs ?? []) {
      if (fn.compute(run.input) !== run.output) {
        throw new Error(`${name} puzzle run "${run.input}" should output "${fn.compute(run.input)}"`);
      }
    }
    return;
  }
  if (puzzle.target?.kind === 'language') {
    for (const word of puzzle.examples?.open ?? []) {
      if (oracleAccepts(puzzle.target.id, word) !== true) {
        throw new Error(`${name} puzzle open example "${word}" is not accepted by the target`);
      }
    }
    for (const word of puzzle.examples?.closed ?? []) {
      if (oracleAccepts(puzzle.target.id, word) !== false) {
        throw new Error(`${name} puzzle closed example "${word}" is accepted by the target`);
      }
    }
    return;
  }
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
  const phases = Object.values(level.phases);
  const hasFunction = phases.some((puzzle) => puzzle.target?.kind === 'function');
  const hasOther = phases.some((puzzle) => puzzle.target?.kind !== 'function');
  if (typeof level.thief?.giveUp !== 'string') {
    throw new Error('thief giveUp must be a non-empty string');
  }
  if (level.thief.giveUp.length === 0) {
    throw new Error('thief giveUp must be a non-empty string');
  }
  if (hasFunction === true) {
    for (const reason of ['jam', 'alarm', 'wrong-output']) {
      if (typeof level.thief?.lines?.[reason] !== 'string') {
        throw new Error(`thief lines ${reason} must be a non-empty string`);
      }
      if (level.thief.lines[reason].length === 0) {
        throw new Error(`thief lines ${reason} must be a non-empty string`);
      }
    }
  }
  if (hasOther === false) {
    return;
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
    for (const section of puzzle.sections ?? []) {
      texts.push(section.label);
    }
    for (const label of Object.values(puzzle.tape?.labels ?? {})) {
      texts.push(label);
    }
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
function checkStack(level) {
  if (level.machine !== 'pda') {
    return;
  }
  if (level.stack === undefined) {
    throw new Error('pda level is missing its stack');
  }
  for (const symbol of [level.stack.base, level.stack.chip]) {
    if (typeof symbol !== 'string' || symbol.length !== 1) {
      throw new Error('pda level stack symbols must be single characters');
    }
  }
  if (level.stack.base === level.stack.chip) {
    throw new Error('pda level stack base and chip must be different');
  }
}
function checkPuzzleShape(puzzle, level, name) {
  if (puzzle.sections !== undefined) {
    checkDrumPuzzle(puzzle, name);
    checkDrumBlueprint(puzzle, name);
    return;
  }
  checkPuzzleCells(puzzle, name);
  checkWires(puzzle, level, name);
}
export function validateLevel(level) {
  checkTopLevel(level);
  checkKeys(level);
  checkStack(level);
  if (level.phases?.repair === undefined) {
    throw new Error('level is missing phase "repair"');
  }
  if (level.phases?.build === undefined) {
    throw new Error('level is missing phase "build"');
  }
  checkPuzzleShape(level.phases.repair, level, 'repair');
  checkPuzzleShape(level.phases.build, level, 'build');
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
