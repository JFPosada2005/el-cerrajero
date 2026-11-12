import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptsDFA } from '../src/core/dfa.js';
import { acceptsNFA } from '../src/core/nfa.js';
import { level1 } from '../src/game/level1.js';
import { level2 } from '../src/game/level2.js';
import { level3 } from '../src/game/level3.js';
import { level4 } from '../src/game/level4.js';
import { level5 } from '../src/game/level5.js';
import { LEVELS, getLevel, validateLevel } from '../src/game/levels.js';
function mutated(base, visit) {
  const copy = structuredClone(base);
  visit(copy);
  return copy;
}
test('getLevel returns each frozen level', () => {
  assert.equal(getLevel(1).id, 1);
  assert.equal(getLevel(2).id, 2);
  assert.equal(getLevel(3).id, 3);
  assert.equal(getLevel(4).id, 4);
  assert.equal(getLevel(5).id, 5);
});
test('getLevel throws on an unknown id', () => {
  assert.throws(() => getLevel(99), /unknown level 99/);
});
test('validateLevel accepts the frozen levels', () => {
  assert.equal(validateLevel(level1), true);
  assert.equal(validateLevel(level2), true);
  assert.equal(validateLevel(level3), true);
  assert.equal(validateLevel(level4), true);
  assert.equal(validateLevel(level5), true);
});
test('LEVELS holds the frozen levels in order', () => {
  assert.equal(LEVELS.length, 5);
  assert.equal(LEVELS[0].id, 1);
  assert.equal(LEVELS[1].id, 2);
  assert.equal(LEVELS[2].id, 3);
  assert.equal(LEVELS[3].id, 4);
  assert.equal(LEVELS[4].id, 5);
});
test('validation rejects a duplicate cell id', () => {
  const bad = mutated(level1, (copy) => {
    copy.phases.repair.cells[1].id = 'q0';
  });
  assert.throws(() => validateLevel(bad), /duplicate cell id/);
});
test('validation rejects a missing start cell', () => {
  const bad = mutated(level1, (copy) => {
    delete copy.phases.repair.cells[0].start;
  });
  assert.throws(() => validateLevel(bad), /start/);
});
test('validation rejects a wire to an unknown cell', () => {
  const bad = mutated(level1, (copy) => {
    copy.phases.repair.blueprint.wires[0].to = 'qx';
  });
  assert.throws(() => validateLevel(bad), /unknown cell/);
});
test('validation rejects a key outside the target alphabet', () => {
  const bad = mutated(level1, (copy) => {
    copy.phases.repair.blueprint.wires[0].key = '9';
  });
  assert.throws(() => validateLevel(bad), /alphabet/);
});
test('validation rejects a self-loop without gear', () => {
  const bad = mutated(level1, (copy) => {
    copy.phases.repair.blueprint.wires[0].from = 'q0';
    copy.phases.repair.blueprint.wires[0].to = 'q0';
  });
  assert.throws(() => validateLevel(bad), /gear/);
});
test('validation rejects a bad open example', () => {
  const bad = mutated(level1, (copy) => {
    copy.phases.repair.examples.open = ['12'];
  });
  assert.throws(() => validateLevel(bad), /open example/);
});
test('validation rejects a bad closed example', () => {
  const bad = mutated(level1, (copy) => {
    copy.phases.repair.examples.closed = ['123'];
  });
  assert.throws(() => validateLevel(bad), /closed example/);
});
test('validation rejects a missing thief line', () => {
  const bad = mutated(level1, (copy) => {
    copy.thief.lines.lockout = '';
  });
  assert.throws(() => validateLevel(bad), /lockout/);
});
test('validation rejects a banned word in goal', () => {
  const bad = mutated(level1, (copy) => {
    copy.phases.repair.goal = 'Abre solo con el estado 1.';
  });
  assert.throws(() => validateLevel(bad), /banned word/);
});
test('level 1 repair opens only with 123', () => {
  const machine = level1.phases.repair.target.machine;
  assert.equal(acceptsDFA(machine, '123'), true);
  assert.equal(acceptsDFA(machine, '12'), false);
});
test('level 2 repair opens with 1 and 122', () => {
  const machine = level2.phases.repair.target.machine;
  assert.equal(acceptsDFA(machine, '1'), true);
  assert.equal(acceptsDFA(machine, '122'), true);
  assert.equal(acceptsDFA(machine, '2'), false);
});
test('level 2 build opens with 21 and 1221', () => {
  const machine = level2.phases.build.target.machine;
  assert.equal(acceptsDFA(machine, '21'), true);
  assert.equal(acceptsDFA(machine, '1221'), true);
  assert.equal(acceptsDFA(machine, '12'), false);
});
test('level 3 repair examples hold on the day target', () => {
  const machine = level3.phases.repair.target.machine;
  assert.equal(machine.type, 'nfa');
  for (const word of ['122', '1122', '1221']) {
    assert.equal(acceptsNFA(machine, word), true);
  }
  for (const word of ['', '12', '22', '1211']) {
    assert.equal(acceptsNFA(machine, word), false);
  }
});
test('level 3 build examples hold on the museum target', () => {
  const machine = level3.phases.build.target.machine;
  assert.equal(machine.type, 'nfa');
  for (const word of ['122', '211', '1122', '2211']) {
    assert.equal(acceptsNFA(machine, word), true);
  }
  for (const word of ['', '12', '21', '112', '221']) {
    assert.equal(acceptsNFA(machine, word), false);
  }
});
test('validation rejects a spring wire without the spring part', () => {
  const bad = mutated(level3, (copy) => {
    copy.parts = ['wire', 'gear', 'fork'];
  });
  assert.throws(() => validateLevel(bad), /spring/);
});
test('validation rejects a spring wire looping on its own cell', () => {
  const bad = mutated(level3, (copy) => {
    copy.phases.repair.blueprint.wires.push({ from: 'w', to: 'w', spring: true });
  });
  assert.throws(() => validateLevel(bad), /spring/);
});
test('validation rejects a stack wire without the stack part', () => {
  const bad = mutated(level4, (copy) => {
    copy.parts = ['wire', 'gear', 'fork', 'spring'];
  });
  assert.throws(() => validateLevel(bad), /stack/);
});
test('validation rejects an invalid stack top', () => {
  const bad = mutated(level4, (copy) => {
    copy.phases.repair.blueprint.wires[0].stack.top = 'bogus';
  });
  assert.throws(() => validateLevel(bad), /stack/);
});
test('validation rejects an invalid stack action', () => {
  const bad = mutated(level4, (copy) => {
    copy.phases.repair.blueprint.wires[0].stack.action = 'bogus';
  });
  assert.throws(() => validateLevel(bad), /stack/);
});
test('validateLevel accepts level 5 with its drum puzzles', () => {
  assert.equal(validateLevel(level5), true);
});
test('validation rejects a drum tape missing its blank', () => {
  const bad = mutated(level5, (copy) => {
    copy.phases.repair.tape.symbols = ['0', '1'];
  });
  assert.throws(() => validateLevel(bad), /blank/);
});
test('validation rejects a function target with an unknown id', () => {
  const bad = mutated(level5, (copy) => {
    copy.phases.repair.target.id = 'binary-triple';
  });
  assert.throws(() => validateLevel(bad), /unknown function/);
});
