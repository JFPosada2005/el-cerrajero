export function createDrumEditor({ root, sections, symbols, labels, rules, onEdit }) {
  const table = labels ?? {};
  const byId = new Map(sections.map((section) => [section.id, section]));
  let current = rules;
  let open = null;
  let lit = null;
  function display(symbol) {
    const label = table[symbol];
    if (label === undefined) {
      return symbol;
    }
    if (label === '') {
      return 'vacío';
    }
    return label;
  }
  function moveArrow(move) {
    if (move === 'L') {
      return '←';
    }
    return '→';
  }
  function targetLabel(id) {
    const found = byId.get(id);
    if (found === undefined) {
      return id;
    }
    return found.label;
  }
  function pinRule(section, read) {
    const row = current[section];
    if (row === undefined) {
      return null;
    }
    const rule = row[read];
    if (rule === undefined || rule === null) {
      return null;
    }
    return rule;
  }
  function pinButton(section, read) {
    const final = section.accept === true;
    const rule = pinRule(section.id, read);
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    let kind = 'drum-pin';
    if (final === true) {
      kind = 'drum-pin is-final';
    } else if (rule === null) {
      kind = 'drum-pin is-empty';
    }
    if (lit !== null && lit.section === section.id && lit.read === read) {
      kind = `${kind} is-lit`;
    }
    button.setAttribute('class', kind);
    if (final === true) {
      button.setAttribute('aria-label', `Sección ${section.label} (final), símbolo ${display(read)}`);
    } else {
      button.setAttribute('aria-label', `Sección ${section.label}, símbolo ${display(read)}`);
    }
    const badge = document.createElement('span');
    badge.setAttribute('class', 'drum-read');
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = display(read);
    button.append(badge);
    const body = document.createElement('span');
    body.setAttribute('class', 'drum-rule');
    if (final === true) {
      body.textContent = 'final';
    } else if (rule === null) {
      body.textContent = 'alarma';
    } else {
      body.textContent = `${display(rule.write)} ${moveArrow(rule.move)} ${targetLabel(rule.to)}`;
    }
    button.append(body);
    if (final === true) {
      button.disabled = true;
      return button;
    }
    button.addEventListener('click', () => openEditor(section.id, read));
    return button;
  }
  function sectionElement(section) {
    const wrap = document.createElement('div');
    if (lit !== null && lit.section === section.id) {
      wrap.setAttribute('class', 'drum-section is-lit');
    } else {
      wrap.setAttribute('class', 'drum-section');
    }
    wrap.setAttribute('role', 'listitem');
    const head = document.createElement('div');
    head.setAttribute('class', 'drum-head');
    const title = document.createElement('h3');
    title.setAttribute('class', 'drum-title');
    title.textContent = section.label;
    head.append(title);
    if (section.start === true) {
      const badge = document.createElement('span');
      badge.setAttribute('class', 'drum-badge');
      badge.textContent = 'inicio';
      head.append(badge);
    }
    if (section.accept === true) {
      const badge = document.createElement('span');
      badge.setAttribute('class', 'drum-badge');
      badge.textContent = 'cerrojo';
      head.append(badge);
    }
    const pins = document.createElement('div');
    pins.setAttribute('class', 'drum-pins');
    for (const symbol of symbols) {
      pins.append(pinButton(section, symbol));
    }
    wrap.append(head);
    wrap.append(pins);
    return wrap;
  }
  function choiceButton(text, label, selected, onPick) {
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    if (selected === true) {
      button.setAttribute('class', 'pin-choice is-selected');
    } else {
      button.setAttribute('class', 'pin-choice');
    }
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(selected));
    button.textContent = text;
    button.addEventListener('click', onPick);
    return button;
  }
  function pickGroup(name, options) {
    const group = document.createElement('fieldset');
    group.setAttribute('class', 'pin-group');
    const legend = document.createElement('legend');
    legend.textContent = name;
    group.append(legend);
    for (const option of options) {
      group.append(choiceButton(option.text, option.label, option.selected, option.onPick));
    }
    return group;
  }
  function actionButton(text, kind, onPress) {
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('class', kind);
    button.setAttribute('aria-label', text);
    button.textContent = text;
    button.addEventListener('click', onPress);
    return button;
  }
  function emitPin() {
    onEdit({ type: 'set-pin', section: open.section, read: open.read, pin: { write: open.write, move: open.move, to: open.to } });
    open = null;
    render();
  }
  function emitEmpty() {
    onEdit({ type: 'set-pin', section: open.section, read: open.read, pin: null });
    open = null;
    render();
  }
  function closeEditor() {
    open = null;
    render();
  }
  function editorElement() {
    if (open === null) {
      return null;
    }
    const section = byId.get(open.section);
    const panel = document.createElement('div');
    panel.setAttribute('class', 'pin-editor');
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `Púa de ${section.label}`);
    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeEditor();
      }
    });
    const title = document.createElement('h3');
    title.setAttribute('class', 'pin-title');
    title.textContent = `Sección ${section.label} · símbolo ${display(open.read)}`;
    panel.append(title);
    const writes = [];
    for (const symbol of symbols) {
      writes.push({ text: display(symbol), label: `Escribe ${display(symbol)}`, selected: open.write === symbol, onPick: pickWrite(symbol) });
    }
    panel.append(pickGroup('Escribe', writes));
    const moves = [{ text: '←', label: 'Mueve a la izquierda', selected: open.move === 'L', onPick: pickMove('L') }, { text: '→', label: 'Mueve a la derecha', selected: open.move === 'R', onPick: pickMove('R') }];
    panel.append(pickGroup('Mueve', moves));
    const targets = [];
    for (const target of sections) {
      targets.push({ text: target.label, label: `Siguiente: ${target.label}`, selected: open.to === target.id, onPick: pickTarget(target.id) });
    }
    panel.append(pickGroup('Siguiente', targets));
    const actions = document.createElement('div');
    actions.setAttribute('class', 'pin-actions');
    actions.append(actionButton('Guardar', 'primary pin-choice', emitPin));
    actions.append(actionButton('Vaciar', 'secondary pin-choice', emitEmpty));
    actions.append(actionButton('Cancelar', 'ghost pin-choice', closeEditor));
    panel.append(actions);
    return panel;
  }
  function pickWrite(symbol) {
    return () => {
      open.write = symbol;
      render();
    };
  }
  function pickMove(move) {
    return () => {
      open.move = move;
      render();
    };
  }
  function pickTarget(id) {
    return () => {
      open.to = id;
      render();
    };
  }
  function openEditor(section, read) {
    const target = byId.get(section);
    if (target !== undefined && target.accept === true) {
      return;
    }
    const rule = pinRule(section, read);
    if (rule === null) {
      open = { section, read, write: read, move: 'R', to: section };
    } else {
      open = { section, read, write: rule.write, move: rule.move, to: rule.to };
    }
    render();
  }
  function render() {
    root.replaceChildren();
    const drum = document.createElement('div');
    drum.setAttribute('class', 'drum');
    drum.setAttribute('role', 'list');
    drum.setAttribute('aria-label', 'Tambor de control');
    for (const section of sections) {
      drum.append(sectionElement(section));
    }
    root.append(drum);
    const panel = editorElement();
    if (panel !== null) {
      root.append(panel);
    }
  }
  function setRules(next) {
    current = next;
    render();
  }
  function light(section, read) {
    lit = { section, read };
    render();
  }
  function clearLight() {
    lit = null;
    render();
  }
  render();
  return { setRules, light, clearLight };
}
