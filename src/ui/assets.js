// El Cerrajero — resolución de assets contra assets/manifest.json.
//
// Regla del contrato (docs/REMASTER-INTERFACES.md):
// - status === 'available' → final.
// - Si no, placeholder cuando allowPlaceholder y existe.
// - Si no hay ninguno → null; el consumidor usa CSS/silencio.
// Nunca lanza: un manifest inválido o ausente resuelve a null.

const DEFAULT_URL = 'assets/manifest.json';
const manifestCache = new Map();

function isRecord(value) {
  return typeof value === 'object' && value !== null && Array.isArray(value) === false;
}

function text(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function getPath(root, parts) {
  let node = root;
  for (const part of parts) {
    if (isRecord(node) === false || Object.hasOwn(node, part) === false) {
      return undefined;
    }
    node = node[part];
  }
  return node;
}

function levelKey(raw) {
  const match = /^n?0*(\d+)$/i.exec(raw);
  if (match === null) {
    return null;
  }
  return match[1].padStart(2, '0');
}

function findLevelEntry(manifest, id) {
  // Formas aceptadas: "n1.background", "01.background",
  // "levels.01.background", "levels.n1.background".
  let rest = id;
  if (rest.startsWith('levels.')) {
    rest = rest.slice('levels.'.length);
  }
  const dot = rest.indexOf('.');
  if (dot === -1) {
    return null;
  }
  const key = levelKey(rest.slice(0, dot));
  if (key === null) {
    return null;
  }
  const table = isRecord(manifest.levels) ? manifest.levels[key] : undefined;
  if (isRecord(table) === false) {
    return null;
  }
  const entry = table[rest.slice(dot + 1)];
  return isRecord(entry) ? entry : null;
}

function findEntry(manifest, id) {
  if (isRecord(manifest) === false || typeof id !== 'string' || id.length === 0) {
    return null;
  }
  const direct = getPath(manifest, id.split('.'));
  if (isRecord(direct)) {
    return direct;
  }
  if (isRecord(manifest.shared)) {
    const key = id.startsWith('shared.') ? id.slice('shared.'.length) : id;
    if (isRecord(manifest.shared[key])) {
      return manifest.shared[key];
    }
  }
  const fontKey = id.startsWith('fonts.')
    ? id.slice('fonts.'.length)
    : id.startsWith('font.')
      ? id.slice('font.'.length)
      : null;
  if (fontKey !== null && isRecord(manifest.fonts) && isRecord(manifest.fonts[fontKey])) {
    return manifest.fonts[fontKey];
  }
  const sfxKey = id.startsWith('sfx.') ? id.slice('sfx.'.length) : id;
  if (isRecord(manifest.sfx) && isRecord(manifest.sfx[sfxKey])) {
    return manifest.sfx[sfxKey];
  }
  const musicKey = id.startsWith('music.') ? id.slice('music.'.length) : id;
  if (isRecord(manifest.music) && isRecord(manifest.music[musicKey])) {
    return manifest.music[musicKey];
  }
  return findLevelEntry(manifest, id);
}

function resolveEntry(entry, allowPlaceholder) {
  if (isRecord(entry) === false) {
    return null;
  }
  const finalUrl = text(entry.final);
  const placeholderUrl = text(entry.placeholder);
  if (entry.status === 'available') {
    if (finalUrl !== null) {
      return finalUrl;
    }
    return allowPlaceholder ? placeholderUrl : null;
  }
  return allowPlaceholder ? placeholderUrl : null;
}

// Carga y cachea el manifest. Si falla (sin fetch, 404, JSON roto,
// forma inválida), devuelve null sin lanzar.
export async function loadManifest(url = DEFAULT_URL) {
  if (manifestCache.has(url)) {
    return manifestCache.get(url);
  }
  try {
    const fetchFn = globalThis.fetch;
    if (typeof fetchFn !== 'function') {
      return null;
    }
    const response = await fetchFn(url);
    if (!response || response.ok === false) {
      return null;
    }
    const data = await response.json();
    if (isRecord(data) === false) {
      return null;
    }
    manifestCache.set(url, data);
    return data;
  } catch {
    return null;
  }
}

export function assetUrl(manifest, id, options = {}) {
  const allowPlaceholder = options?.allowPlaceholder ?? true;
  return resolveEntry(findEntry(manifest, id), allowPlaceholder === true);
}

function sectionUrl(manifest, section, id) {
  if (isRecord(manifest) === false || typeof id !== 'string' || id.length === 0) {
    return null;
  }
  const table = manifest[section];
  if (isRecord(table) === false) {
    return null;
  }
  const key = id.startsWith(`${section}.`) ? id.slice(section.length + 1) : id;
  const entry = table[key];
  return resolveEntry(isRecord(entry) ? entry : null, true);
}

export function sfxUrl(manifest, id) {
  return sectionUrl(manifest, 'sfx', id);
}

export function musicUrl(manifest, id) {
  return sectionUrl(manifest, 'music', id);
}
