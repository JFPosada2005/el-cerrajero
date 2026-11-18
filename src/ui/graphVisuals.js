// Decoración visual del editor de grafos — El Cerrajero (ola 2, unidad A).
//
// Solo decora el `<svg id="canvas">` ya creado por el editor real:
// assets finales del N1 sobre las celdas y trenzas de color por llave en
// los cables. No crea editor, cables, llaves, juicio ni lógica; no toca
// el editor, `main.js`, `styles.css`, `src/core`, `src/game`,
// tests existentes, `mockups/` ni git.
//
// El editor re-renderiza el SVG en cada interacción (`svg.replaceChildren`),
// así que la decoración se reaplica con `MutationObserver` (solo `childList`
// del svg: los retoques viven dentro de cada grupo y no re-disparan).
// Sin observador disponible (tests con DOM falso) la decoración simple
// de una pasada sigue intacta.

const SVG_NS = 'http://www.w3.org/2000/svg';
const PERNO = 'mockups/nivel-1-taller/assets/sprites/perno.svg';
const N1 = 'assets/levels/01/props';
const TONES = ['gold', 'teal', 'coral', 'violet'];

const N1_ASSETS = {
  entry: [`${N1}/entry.webp`],
  lock: [PERNO, `${N1}/lock.webp`],
  gear: [`${N1}/gear.webp`],
};

// Fallback genérico para N2–N4 con los assets finales del N1 (bocallave
// de entrada y engranaje) hasta que esos niveles tengan assets propios.
// El perno del cerrojo sigue en `mockups/` porque no tiene slot final.
const FALLBACK_ASSETS = {
  entry: [`${N1}/entry.webp`],
  lock: [`${N1}/gear.webp`],
  gear: [`${N1}/gear.webp`],
};

const SPRITE_CLASS = {
  entry: 'gv-sprite-entry',
  bolt: 'gv-sprite-lock-bolt',
  body: 'gv-sprite-lock-body',
  gear: 'gv-sprite-gear',
};

const SPRITE_SIZE = {
  entry: 104,
  bolt: 120,
  body: 112,
  gear: 124,
};

function tagOf(node) {
  return String(node.tagName ?? node.tag ?? '').toLowerCase();
}

function classTokens(node) {
  const raw = typeof node.getAttribute === 'function' ? node.getAttribute('class') : node.attributes?.class;
  return String(raw ?? '')
    .split(/\s+/)
    .filter(Boolean);
}

function setClassTokens(node, list) {
  node.setAttribute('class', list.join(' '));
}

function addToken(node, token) {
  const tokens = classTokens(node);
  if (tokens.includes(token) === false) {
    setClassTokens(node, [...tokens, token]);
  }
}

function dropTokens(node, predicate) {
  setClassTokens(
    node,
    classTokens(node).filter((token) => predicate(token) === false),
  );
}

function kids(node) {
  return Array.from(node.children ?? []);
}

function isStateGroup(node) {
  return tagOf(node) === 'g' && classTokens(node).includes('state');
}

function isWireGroup(node) {
  return tagOf(node) === 'g' && classTokens(node).includes('wire');
}

function roleOf(group) {
  const tokens = classTokens(group);
  if (tokens.includes('is-start')) {
    return 'entry';
  }
  if (tokens.includes('is-accept')) {
    return 'lock';
  }
  return 'gear';
}

function levelIdOf(level) {
  const id = Number(level?.id ?? 1);
  return Number.isFinite(id) ? id : 1;
}

function keySymbols(level) {
  const keys = level?.keys;
  if (Array.isArray(keys) === false) {
    return [];
  }
  return keys.map((entry) => String(typeof entry === 'string' ? entry : entry.symbol));
}

function hashSymbol(symbol) {
  let hash = 0;
  for (const char of String(symbol)) {
    hash = (hash + char.charCodeAt(0)) % 997;
  }
  return hash;
}

function toneFor(firstKey, symbols) {
  const index = symbols.indexOf(firstKey);
  const rank = index >= 0 ? index : hashSymbol(firstKey);
  return TONES[rank % TONES.length];
}

// El tono sale de la primera llave del rótulo ("1,2" → "1",
// "1 · da igual · +ficha" → "1"). Los resortes se detectan por la
// clase `is-spring` del trazo, no por el texto.
function wireTone(wire, symbols) {
  const edge = kids(wire).find(
    (child) => tagOf(child) === 'path' && classTokens(child).includes('edge'),
  );
  if (edge !== undefined && classTokens(edge).includes('is-spring')) {
    return 'spring';
  }
  const label = kids(wire).find((child) => classTokens(child).includes('edge-label'));
  const caption = String(label?.textContent ?? '').trim();
  if (caption === '') {
    return 'spring';
  }
  const firstKey = caption.split(/[·,]/)[0].trim();
  if (firstKey === '') {
    return 'spring';
  }
  return toneFor(firstKey, symbols);
}

function spriteImages(group) {
  return kids(group).filter(
    (child) => tagOf(child) === 'image' && classTokens(child).includes('gv-sprite'),
  );
}

function makeSprite(href, size, extraClass) {
  const image = document.createElementNS(SVG_NS, 'image');
  image.setAttribute('href', href);
  image.setAttribute('x', String(-size / 2));
  image.setAttribute('y', String(-size / 2));
  image.setAttribute('width', String(size));
  image.setAttribute('height', String(size));
  image.setAttribute('class', `gv-sprite ${extraClass}`);
  image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  image.setAttribute('aria-hidden', 'true');
  image.setAttribute('focusable', 'false');
  return image;
}

function decorateCell(group, assets) {
  for (const stale of spriteImages(group)) {
    stale.remove();
  }
  const role = roleOf(group);
  if (role === 'lock' && assets.lock.length > 1) {
    group.append(makeSprite(assets.lock[0], SPRITE_SIZE.bolt, SPRITE_CLASS.bolt));
    group.append(makeSprite(assets.lock[1], SPRITE_SIZE.body, SPRITE_CLASS.body));
  } else if (role === 'lock') {
    group.append(makeSprite(assets.lock[0], SPRITE_SIZE.body, SPRITE_CLASS.body));
  } else if (role === 'entry') {
    group.append(makeSprite(assets.entry[0], SPRITE_SIZE.entry, SPRITE_CLASS.entry));
  } else {
    group.append(makeSprite(assets.gear[0], SPRITE_SIZE.gear, SPRITE_CLASS.gear));
  }
  group.setAttribute('data-gv', role);
}

function decorateWire(wire, symbols) {
  dropTokens(wire, (token) => token === 'gv-spring' || token.startsWith('gv-key-'));
  const tone = wireTone(wire, symbols);
  addToken(wire, tone === 'spring' ? 'gv-spring' : `gv-key-${tone}`);
}

export function decorateGraph(svg, { level = {}, cells = [] } = {}) {
  void cells;
  if (svg === null || svg === undefined) {
    return { dispose() {} };
  }
  const id = levelIdOf(level);
  const assets = id === 1 ? N1_ASSETS : FALLBACK_ASSETS;
  const symbols = keySymbols(level);

  function apply() {
    addToken(svg, 'gv-decorated');
    addToken(svg, `gv-level-${id}`);
    for (const child of kids(svg)) {
      if (isStateGroup(child)) {
        decorateCell(child, assets);
      } else if (isWireGroup(child)) {
        decorateWire(child, symbols);
      }
    }
  }

  let observer = null;
  if (typeof MutationObserver !== 'undefined') {
    let scheduled = false;
    observer = new MutationObserver(() => {
      if (scheduled) {
        return;
      }
      scheduled = true;
      try {
        apply();
      } finally {
        scheduled = false;
      }
    });
    observer.observe(svg, { childList: true });
  }

  apply();

  function dispose() {
    if (observer !== null) {
      observer.disconnect();
      observer = null;
    }
    dropTokens(svg, (token) => token === 'gv-decorated' || token.startsWith('gv-level-'));
    for (const child of kids(svg)) {
      if (isStateGroup(child)) {
        for (const stale of spriteImages(child)) {
          stale.remove();
        }
        if (typeof child.removeAttribute === 'function') {
          child.removeAttribute('data-gv');
        }
      } else if (isWireGroup(child)) {
        dropTokens(child, (token) => token === 'gv-spring' || token.startsWith('gv-key-'));
      }
    }
  }

  return { dispose };
}
