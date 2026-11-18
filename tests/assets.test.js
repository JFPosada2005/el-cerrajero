import test from 'node:test';
import assert from 'node:assert/strict';
import { assetUrl, loadManifest, musicUrl, sfxUrl } from '../src/ui/assets.js';

const manifest = {
  fonts: {
    display: { final: 'assets/fonts/Cinzel-Variable.woff2', kind: 'font', priority: 'P0', status: 'available' },
  },
  shared: {
    'ui.sound': { final: 'assets/shared/ui/sound.svg', kind: 'icon', priority: 'P0', status: 'missing' },
  },
  levels: {
    '01': {
      background: {
        final: 'assets/levels/01/background.webp',
        placeholder: 'mockups/nivel-1-taller/assets/sprites/fondo-banco.jpg',
        kind: 'image',
        priority: 'P0',
        status: 'placeholder',
      },
      drum: { final: 'assets/levels/05/drum.webp', kind: 'image', priority: 'P0', status: 'missing' },
      ghost: { placeholder: 'fallback/ghost.png', kind: 'image', priority: 'P0', status: 'available' },
      vapor: { kind: 'image', priority: 'P0', status: 'available' },
    },
  },
  sfx: {
    click: { final: 'assets/audio/sfx/click.ogg', kind: 'audio', priority: 'P0', status: 'synthetic' },
  },
  music: {
    n1: { final: 'assets/audio/music/n1.ogg', kind: 'audio', priority: 'P2', status: 'available' },
    n2: { final: 'assets/audio/music/n2.ogg', kind: 'audio', priority: 'P2', status: 'missing' },
  },
};

test('available usa final', () => {
  assert.equal(assetUrl(manifest, 'font.display'), 'assets/fonts/Cinzel-Variable.woff2');
  assert.equal(assetUrl(manifest, 'fonts.display'), 'assets/fonts/Cinzel-Variable.woff2');
  assert.equal(musicUrl(manifest, 'n1'), 'assets/audio/music/n1.ogg');
  assert.equal(musicUrl(manifest, 'music.n1'), 'assets/audio/music/n1.ogg');
});

test('placeholder cuando no está available y existe', () => {
  assert.equal(
    assetUrl(manifest, 'n1.background'),
    'mockups/nivel-1-taller/assets/sprites/fondo-banco.jpg',
  );
  assert.equal(assetUrl(manifest, '01.background'), assetUrl(manifest, 'n1.background'));
  assert.equal(assetUrl(manifest, 'levels.01.background'), assetUrl(manifest, 'n1.background'));
});

test('missing sin placeholder devuelve null', () => {
  assert.equal(assetUrl(manifest, 'n1.drum'), null);
  assert.equal(assetUrl(manifest, 'ui.sound'), null);
  assert.equal(assetUrl(manifest, 'shared.ui.sound'), null);
  assert.equal(assetUrl(manifest, 'no.existe'), null);
  assert.equal(sfxUrl(manifest, 'click'), null);
  assert.equal(musicUrl(manifest, 'n2'), null);
});

test('allowPlaceholder false solo deja pasar final available', () => {
  assert.equal(assetUrl(manifest, 'n1.background', { allowPlaceholder: false }), null);
  assert.equal(
    assetUrl(manifest, 'font.display', { allowPlaceholder: false }),
    'assets/fonts/Cinzel-Variable.woff2',
  );
});

test('available sin final cae a placeholder, y sin nada a null', () => {
  assert.equal(assetUrl(manifest, 'n1.ghost'), 'fallback/ghost.png');
  assert.equal(assetUrl(manifest, 'n1.ghost', { allowPlaceholder: false }), null);
  assert.equal(assetUrl(manifest, 'n1.vapor'), null);
});

test('manifest o id inválidos devuelven null sin lanzar', () => {
  for (const bad of [null, undefined, 42, 'x', [], true]) {
    assert.equal(assetUrl(bad, 'n1.background'), null);
    assert.equal(sfxUrl(bad, 'click'), null);
    assert.equal(musicUrl(bad, 'n1'), null);
  }
  assert.equal(assetUrl(manifest, ''), null);
  assert.equal(assetUrl(manifest, null), null);
  assert.equal(assetUrl({}, 'n1.background'), null);
});

test('loadManifest cachea y devuelve el mismo objeto', async () => {
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return { ok: true, json: async () => manifest };
  };
  try {
    const first = await loadManifest('test-cache-manifest.json');
    const second = await loadManifest('test-cache-manifest.json');
    assert.equal(first, manifest);
    assert.equal(second, first);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('loadManifest devuelve null si falla, sin lanzar', async () => {
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new Error('red caída');
    };
    assert.equal(await loadManifest('test-fail-throw.json'), null);

    globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
    assert.equal(await loadManifest('test-fail-status.json'), null);

    globalThis.fetch = async () => ({
      ok: true,
      json: async () => {
        throw new Error('json roto');
      },
    });
    assert.equal(await loadManifest('test-fail-json.json'), null);

    globalThis.fetch = async () => ({ ok: true, json: async () => ['no', 'es', 'manifest'] });
    assert.equal(await loadManifest('test-fail-shape.json'), null);
  } finally {
    globalThis.fetch = realFetch;
  }
});
