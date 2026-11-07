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

function nodeMap(level) {
  return new Map(level.states.map(state => [state.id, state]));
}

function edgeGeometry(from, to) {
  if (from.id === to.id) {
    return {
      path: `M ${from.x - 26} ${from.y - 38} C ${from.x - 86} ${from.y - 130}, ${from.x + 86} ${from.y - 130}, ${from.x + 26} ${from.y - 38}`,
      labelX: from.x,
      labelY: from.y - LOOP_LABEL_OFFSET,
    };
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
  return {
    path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
    labelX: 0.25 * startX + 0.5 * controlX + 0.25 * endX,
    labelY: 0.25 * startY + 0.5 * controlY + 0.25 * endY,
  };
}

export function createGraphEditor({ svg, level, transitions, onConnect, onCut }) {
  const states = nodeMap(level);
  let tool = { kind: 'key', key: level.alphabet[0] };
  let pendingSource = null;
  let highlighted = [];

  function isCutting() {
    return tool.kind === 'cut';
  }

  function wireGroups() {
    const groups = new Map();
    for (const [source, row] of Object.entries(transitions)) {
      for (const [symbol, target] of Object.entries(row)) {
        const key = `${source}\u0000${target}`;
        if (!groups.has(key)) {
          groups.set(key, { source, target, symbols: [] });
        }
        groups.get(key).symbols.push(symbol);
      }
    }
    for (const group of groups.values()) {
      group.symbols.sort((a, b) => level.alphabet.indexOf(a) - level.alphabet.indexOf(b));
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
    for (const [id, color] of [
      ['arrow', '#77818f'],
      ['arrow-lit', '#38c6b8'],
    ]) {
      const marker = svgElement('marker', {
        id,
        viewBox: '0 0 10 10',
        refX: '9',
        refY: '5',
        markerWidth: '7',
        markerHeight: '7',
        orient: 'auto-start-reverse',
      });
      marker.append(svgElement('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: color }));
      defs.append(marker);
    }
    const filter = svgElement('filter', {
      id: 'glow',
      x: '-50%',
      y: '-50%',
      width: '200%',
      height: '200%',
    });
    filter.append(svgElement('feGaussianBlur', { stdDeviation: '3', result: 'blur' }));
    const merge = svgElement('feMerge');
    merge.append(svgElement('feMergeNode', { in: 'blur' }));
    merge.append(svgElement('feMergeNode', { in: 'SourceGraphic' }));
    filter.append(merge);
    defs.append(filter);
    svg.append(defs);
  }

  function renderStartArrow() {
    const start = level.states.find(state => state.start);
    if (!start) {
      return;
    }
    svg.append(
      svgElement('path', {
        d: `M ${start.x - 92} ${start.y} L ${start.x - 48} ${start.y}`,
        class: 'start-arrow',
        'marker-end': 'url(#arrow)',
      }),
    );
    const label = svgElement('text', {
      x: start.x - 98,
      y: start.y + 4,
      class: 'start-label',
      'text-anchor': 'end',
    });
    label.textContent = 'inicio';
    svg.append(label);
  }

  function renderEdges() {
    const lit = litEdges();
    const cutting = isCutting();
    for (const group of wireGroups()) {
      const from = states.get(group.source);
      const to = states.get(group.target);
      if (!from || !to) {
        continue;
      }
      const geometry = edgeGeometry(from, to);
      const isLit = lit.has(`${group.source}\u0000${group.target}`);
      const classes = ['wire', cutting ? 'is-cutting' : '', isLit ? 'is-lit' : ''].filter(Boolean).join(' ');
      const attributes = { class: classes };
      if (cutting) {
        attributes.role = 'button';
        attributes.tabindex = '0';
        attributes['aria-label'] = `Cortar cable ${group.symbols.join(',')}: ${from.label} a ${to.label}`;
      }
      const wire = svgElement('g', attributes);
      wire.append(svgElement('path', { d: geometry.path, class: 'edge-hit' }));
      wire.append(
        svgElement('path', {
          d: geometry.path,
          class: `edge${isLit ? ' is-lit' : ''}`,
          'marker-end': isLit ? 'url(#arrow-lit)' : 'url(#arrow)',
        }),
      );
      const label = svgElement('text', {
        x: geometry.labelX,
        y: geometry.labelY,
        class: 'edge-label',
      });
      label.textContent = group.symbols.join(',');
      wire.append(label);
      if (cutting) {
        wire.addEventListener('click', () => handleWireClick(group.source, group.target));
        wire.addEventListener('keydown', event => {
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
    for (const state of level.states) {
      const classes = [
        'state',
        state.start ? 'is-start' : '',
        state.accept ? 'is-accept' : '',
        cutting ? 'is-muted' : '',
        pendingSource === state.id ? 'is-pending' : '',
        highlighted.includes(state.id) ? 'is-lit' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const attributes = {
        class: classes,
        transform: `translate(${state.x} ${state.y})`,
        'aria-label': state.label,
      };
      if (!cutting) {
        attributes.role = 'button';
        attributes.tabindex = '0';
      }
      const group = svgElement('g', attributes);
      group.append(svgElement('circle', { r: '44', class: 'state-body' }));
      if (state.accept) {
        group.append(svgElement('circle', { r: '36', class: 'accept-ring' }));
      }
      const label = svgElement('text', {
        class: 'state-label',
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
      });
      label.textContent = state.label;
      group.append(label);
      group.addEventListener('click', () => handleNodeClick(state.id));
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleNodeClick(state.id);
        }
      });
      svg.append(group);
    }
  }

  function handleNodeClick(stateId) {
    if (isCutting()) {
      return;
    }
    if (pendingSource === null) {
      pendingSource = stateId;
      render();
      return;
    }
    const source = pendingSource;
    pendingSource = null;
    onConnect(source, stateId, tool.key);
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

  function highlight(trace) {
    highlighted = [...trace];
    render();
  }

  function clearHighlight() {
    highlighted = [];
    render();
  }

  svg.addEventListener('keydown', event => {
    if (event.key === 'Escape' && pendingSource !== null) {
      pendingSource = null;
      render();
    }
  });

  render();

  return { setSelectedKey, setCutting, highlight, clearHighlight, render };
}
