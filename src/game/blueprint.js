function sameStack(a, b) {
  if (a === undefined && b === undefined) {
    return true
  }
  if (a === undefined || b === undefined) {
    return false
  }
  if (a.top !== b.top) {
    return false
  }
  return a.action === b.action
}

function sameWire(a, b) {
  if (a.from !== b.from) {
    return false
  }
  if (a.to !== b.to) {
    return false
  }
  if ((a.spring === true) !== (b.spring === true)) {
    return false
  }
  if (a.spring !== true && a.key !== b.key) {
    return false
  }
  return sameStack(a.stack, b.stack)
}

function sameKeyFromCell(wire, from, key) {
  if (wire.spring === true) {
    return false
  }
  if (wire.from !== from) {
    return false
  }
  return wire.key === key
}

function cloneWire(wire) {
  const copy = { from: wire.from, to: wire.to }
  if (wire.spring === true) {
    copy.spring = true
  }
  if (wire.spring !== true) {
    copy.key = wire.key
  }
  if (wire.stack !== undefined) {
    copy.stack = { top: wire.stack.top, action: wire.stack.action }
  }
  return copy
}

function cloneBlueprint(blueprint) {
  return { wires: blueprint.wires.map(cloneWire) }
}

function applyCut(blueprint, edit) {
  const wires = blueprint.wires.filter((wire) => wire.from !== edit.from || wire.to !== edit.to).map(cloneWire)
  if (wires.length === blueprint.wires.length) {
    return { blueprint: { wires }, effect: 'kept', reason: null }
  }
  return { blueprint: { wires }, effect: 'removed', reason: null }
}

function applySpringConnect(blueprint, edit) {
  if (edit.from === edit.to) {
    return { blueprint: cloneBlueprint(blueprint), effect: 'blocked', reason: 'spring-loop' }
  }
  const candidate = { from: edit.from, to: edit.to, spring: true }
  const found = blueprint.wires.some((wire) => sameWire(wire, candidate))
  if (found) {
    return { blueprint: cloneBlueprint(blueprint), effect: 'kept', reason: null }
  }
  const wires = cloneBlueprint(blueprint).wires
  wires.push(candidate)
  return { blueprint: { wires }, effect: 'added', reason: null }
}

function applyKeyConnect(parts, blueprint, edit) {
  const candidate = { from: edit.from, to: edit.to, key: edit.tool.key }
  const identical = blueprint.wires.some((wire) => sameWire(wire, candidate))
  if (identical) {
    return { blueprint: cloneBlueprint(blueprint), effect: 'kept', reason: null }
  }
  if (edit.from === edit.to && !parts.includes('gear')) {
    return { blueprint: cloneBlueprint(blueprint), effect: 'blocked', reason: 'needs-gear' }
  }
  const index = blueprint.wires.findIndex((wire) => sameKeyFromCell(wire, edit.from, edit.tool.key))
  if (index === -1) {
    const fresh = cloneBlueprint(blueprint).wires
    fresh.push(candidate)
    return { blueprint: { wires: fresh }, effect: 'added', reason: null }
  }
  if (parts.includes('fork')) {
    const forked = cloneBlueprint(blueprint).wires
    forked.push(candidate)
    return { blueprint: { wires: forked }, effect: 'added', reason: null }
  }
  const moved = cloneBlueprint(blueprint).wires
  moved[index] = { ...moved[index], to: edit.to }
  return { blueprint: { wires: moved }, effect: 'moved', reason: null }
}

function applyConnect(parts, blueprint, edit) {
  if (edit.tool.kind === 'spring') {
    return applySpringConnect(blueprint, edit)
  }
  return applyKeyConnect(parts, blueprint, edit)
}

export function applyEdit(puzzle, parts, blueprint, edit) {
  if (edit.type === 'cut-wire') {
    return applyCut(blueprint, edit)
  }
  if (edit.type === 'connect-wire') {
    return applyConnect(parts, blueprint, edit)
  }
  throw new Error('unknown edit type: ' + edit.type)
}
