const SVG_NS = 'http://www.w3.org/2000/svg';
const NODE_RADIUS = 44;
const LOOP_LABEL_OFFSET = 118;
function svgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}
function nodeMap(cells) {
  return new Map(cells.map((cell) => [cell.id, cell]));
}
function edgeGeometry(from, to) {
  if (from.id === to.id) {
    return { path: `M ${from.x - 26} ${from.y - 38} C ${from.x - 86} ${from.y - 130}, ${from.x + 86} ${from.y - 130}, ${from.x + 26} ${from.y - 38}`, labelX: from.x, labelY: from.y - LOOP_LABEL_OFFSET };
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const startX = from.x + ux * NODE_RADIUS;
  const startY = from.y + uy * NODE_RADIUS;
  const endX = to.x - ux * NODE_RADIUS;
  const endY = to.y - uy * NODE_RADIUS;
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const curve = 30;
  const controlX = midX - uy * curve;
  const controlY = midY + ux * curve;
  return { path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`, labelX: 0.25 * startX + 0.5 * controlX + 0.25 * endX, labelY: 0.25 * startY + 0.5 * controlY + 0.25 * endY };
}
export function createGraphEditor({ svg, cells, alphabet, blueprint, stack = null, onConnect, onCut }) {
  const states = nodeMap(cells);
  let current = blueprint;
  let tool = { kind: 'key', key: alphabet[0] };
  let pendingSource = null;
  let highlighted = [];
  function isCutting() {
    return tool.kind === 'cut';
  }
  function stackOf(wire) {
    if (wire.stack !== undefined) {
      return wire.stack;
    }
    return { top: 'any', action: 'keep' };
  }
  function topLabel(top) {
    if (top === 'any') {
      return 'da igual';
    }
    return stack.labels[top];
  }
  function actionLabel(action) {
    if (action === 'push') {
      return '+ficha';
    }
    if (action === 'pop') {
      return '-ficha';
    }
    return '=';
  }
  function groupLabel(group) {
    const top = topLabel(group.top);
    const action = actionLabel(group.action);
    if (group.spring) {
      return `${top} · ${action}`;
    }
    return `${group.symbols.join(',')} · ${top} · ${action}`;
  }
  function wireGroups() {
    const groups = new Map();
    for (const wire of current.wires) {
      const spring = wire.spring === true;
      const condition = stack === null ? null : stackOf(wire);
      const key = stack === null ? `${wire.from}\u0000${wire.to}\u0000${spring}` : `${wire.from}\u0000${wire.to}\u0000${spring}\u0000${condition.top}\u0000${condition.action}`;
      if (groups.has(key) === false) {
        groups.set(key, { source: wire.from, target: wire.to, spring, symbols: [], top: condition === null ? null : condition.top, action: condition === null ? null : condition.action });
      }
      if (spring === false) {
        groups.get(key).symbols.push(wire.key);
      }
    }
    for (const group of groups.values()) {
      group.symbols.sort((a, b) => alphabet.indexOf(a) - alphabet.indexOf(b));
    }
    return [...groups.values()];
  }
  function litEdges() {
    const keys = new Set();
    for (let index = 0; index < highlighted.length - 1; index += 1) {
      keys.add(`${highlighted[index]}\u0000${highlighted[index + 1]}`);
    }
    return keys;
  }
  function renderDefs() {
    const defs = svgElement('defs');
    for (const [id, color] of [['arrow', '#77818f'], ['arrow-lit', '#38c6b8']]) {
      const marker = svgElement('marker', { id, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
      marker.append(svgElement('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: color }));
      defs.append(marker);
    }
    const filter = svgElement('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
    filter.append(svgElement('feGaussianBlur', { stdDeviation: '3', result: 'blur' }));
    const merge = svgElement('feMerge');
    merge.append(svgElement('feMergeNode', { in: 'blur' }));
    merge.append(svgElement('feMergeNode', { in: 'SourceGraphic' }));
    filter.append(merge);
    defs.append(filter);
    svg.append(defs);
  }
  function renderStartArrow() {
    const start = cells.find((cell) => cell.start);
    if (start === undefined) {
      return;
    }
    svg.append(svgElement('path', { d: `M ${start.x - 92} ${start.y} L ${start.x - 48} ${start.y}`, class: 'start-arrow', 'marker-end': 'url(#arrow)' }));
    const label = svgElement('text', { x: start.x - 98, y: start.y + 4, class: 'start-label', 'text-anchor': 'end' });
    label.textContent = 'inicio';
    svg.append(label);
  }
  function renderEdges() {
    const lit = litEdges();
    const cutting = isCutting();
    for (const group of wireGroups()) {
      const from = states.get(group.source);
      const to = states.get(group.target);
      if (from === undefined || to === undefined) {
        continue;
      }
      const geometry = edgeGeometry(from, to);
      const isLit = lit.has(`${group.source}\u0000${group.target}`);
      const classes = ['wire', cutting ? 'is-cutting' : '', isLit ? 'is-lit' : ''].filter(Boolean).join(' ');
      const attributes = { class: classes };
      if (cutting) {
        attributes.role = 'button';
        attributes.tabindex = '0';
      }
      const caption = stack === null ? group.symbols.join(',') : groupLabel(group);
      if (cutting && group.spring) {
        attributes['aria-label'] = stack === null ? `Cortar resorte: ${from.label} a ${to.label}` : `Cortar resorte ${caption}: ${from.label} a ${to.label}`;
      }
      if (cutting && group.spring === false) {
        attributes['aria-label'] = `Cortar cable ${caption}: ${from.label} a ${to.label}`;
      }
      const wire = svgElement('g', attributes);
      wire.append(svgElement('path', { d: geometry.path, class: 'edge-hit' }));
      let edgeClass = `edge${isLit ? ' is-lit' : ''}`;
      if (group.spring) {
        edgeClass = `edge is-spring${isLit ? ' is-lit' : ''}`;
      }
      wire.append(svgElement('path', { d: geometry.path, class: edgeClass, 'marker-end': isLit ? 'url(#arrow-lit)' : 'url(#arrow)' }));
      if (group.spring === false || stack !== null) {
        const text = svgElement('text', { x: geometry.labelX, y: geometry.labelY, class: 'edge-label' });
        text.textContent = caption;
        wire.append(text);
      }
      if (cutting) {
        wire.addEventListener('click', () => handleWireClick(group.source, group.target));
        wire.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleWireClick(group.source, group.target);
          }
        });
      }
      svg.append(wire);
    }
  }
  function renderStates() {
    const cutting = isCutting();
    for (const cell of cells) {
      const classes = ['state', cell.start ? 'is-start' : '', cell.accept ? 'is-accept' : '', cutting ? 'is-muted' : '', pendingSource === cell.id ? 'is-pending' : '', highlighted.includes(cell.id) ? 'is-lit' : ''].filter(Boolean).join(' ');
      const attributes = { class: classes, transform: `translate(${cell.x} ${cell.y})`, 'aria-label': cell.label };
      if (cutting === false) {
        attributes.role = 'button';
        attributes.tabindex = '0';
      }
      const group = svgElement('g', attributes);
      group.append(svgElement('circle', { r: '44', class: 'state-body' }));
      if (cell.accept) {
        group.append(svgElement('circle', { r: '36', class: 'accept-ring' }));
      }
      const label = svgElement('text', { class: 'state-label', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      label.textContent = cell.label;
      group.append(label);
      group.addEventListener('click', () => handleNodeClick(cell.id));
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleNodeClick(cell.id);
        }
      });
      svg.append(group);
    }
  }
  function handleNodeClick(cellId) {
    if (isCutting()) {
      return;
    }
    if (pendingSource === null) {
      pendingSource = cellId;
      render();
      return;
    }
    const source = pendingSource;
    pendingSource = null;
    if (tool.kind === 'spring') {
      onConnect(source, cellId, { kind: 'spring' });
    } else {
      onConnect(source, cellId, { kind: 'key', key: tool.key });
    }
    render();
  }
  function handleWireClick(source, target) {
    onCut(source, target);
    render();
  }
  function render() {
    svg.replaceChildren();
    renderDefs();
    renderStartArrow();
    renderEdges();
    renderStates();
  }
  function setSelectedKey(key) {
    tool = { kind: 'key', key };
    pendingSource = null;
    render();
  }
  function setCutting() {
    tool = { kind: 'cut' };
    pendingSource = null;
    render();
  }
  function setSpring() {
    tool = { kind: 'spring' };
    pendingSource = null;
    render();
  }
  function setBlueprint(next) {
    current = next;
    pendingSource = null;
    render();
  }
  function highlight(trace) {
    highlighted = [...trace];
    render();
  }
  function clearHighlight() {
    highlighted = [];
    render();
  }
  svg.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && pendingSource !== null) {
      pendingSource = null;
      render();
    }
  });
  render();
  return { setSelectedKey, setSpring, setCutting, setBlueprint, highlight, clearHighlight, render };
}
