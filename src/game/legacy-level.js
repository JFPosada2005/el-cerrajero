import { level1 as schemaLevel1 } from './level1.js';
export function toLegacy(level) {
  const repair = level.phases.repair;
  const alphabet = level.keys.map((key) => key.symbol);
  const states = repair.cells;
  const initialTransitions = {};
  for (const cell of repair.cells) {
    initialTransitions[cell.id] = {};
  }
  for (const wire of repair.blueprint.wires) {
    if (wire.spring === true) {
      continue;
    }
    initialTransitions[wire.from][wire.key] = wire.to;
  }
  const target = repair.target.machine;
  const legitimateKey = repair.examples.open[0];
  const goal = repair.goal;
  return {
    id: level.id,
    contract: level.contract,
    title: level.title,
    client: level.client,
    goal,
    brief: level.brief,
    thief: level.thief,
    alphabet,
    states,
    initialTransitions,
    target,
    legitimateKey
  };
}
export const level1 = toLegacy(schemaLevel1);
