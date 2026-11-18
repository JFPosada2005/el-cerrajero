import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { level3 } from '../../src/game/level3.js';
import { applyEdit } from '../../src/game/blueprint.js';
import { toMachine } from '../../src/game/machines.js';
import { judge } from '../../src/game/judge.js';
import { createLevelScene } from '../../src/ui/levels/level3Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const alphabet = level3.keys.map((entry) => entry.symbol);

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function bootServer() {
  const port = await freePort();
  const child = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/index.html`);
      if (response.status === 200) {
        return { child, port };
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  child.kill();
  throw new Error('el servidor del e2e no levanto a tiempo');
}

test('e2e N3: el servidor sirve la app del taller', async (t) => {
  const { child, port } = await bootServer();
  t.after(() => child.kill());
  const response = await fetch(`http://127.0.0.1:${port}/index.html`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('src/main.js'), 'la pagina monta el taller real');
  for (const css of ['src/ui/levels/level3.css', 'src/ui/graphVisuals.css', 'src/ui/paperModal.css']) {
    const found = await fetch(`http://127.0.0.1:${port}/${css}`);
    assert.equal(found.status, 200, `el servidor sirve ${css}`);
  }
});

test('e2e N3: la reparacion documentada abre la puerta a la construccion', () => {
  const repair = level3.phases.repair;
  let blueprint = structuredClone(repair.blueprint);
  const solved = applyEdit(repair, level3.parts, blueprint, {
    type: 'connect-wire',
    from: 'w',
    to: 'w',
    tool: { kind: 'key', key: '1' },
  });
  assert.equal(solved.effect, 'added', 'Espera -1-> Espera agrega el bifurcador');
  const verdict = judge(repair, toMachine(alphabet, repair, solved.blueprint, level3.machine));
  assert.equal(verdict.correct, true, 'el ensayo de reparacion pasa');
  assert.equal(verdict.counterexample, null);
  assert.ok(level3.phases.build, 'hay fase de construccion a la que pasar');
});

test('e2e N3: la construccion documentada asegura la boveda', () => {
  const build = level3.phases.build;
  let blueprint = structuredClone(build.blueprint);
  const wires = [
    ['e', 'nw', { kind: 'spring' }],
    ['nw', 'nw', { kind: 'key', key: '1' }],
    ['nw', 'nw', { kind: 'key', key: '2' }],
    ['nw', 'n1', { kind: 'key', key: '2' }],
    ['n1', 'n2', { kind: 'key', key: '1' }],
    ['n2', 'lock', { kind: 'key', key: '1' }],
  ];
  for (const [from, to, tool] of wires) {
    const next = applyEdit(build, level3.parts, blueprint, { type: 'connect-wire', from, to, tool });
    assert.notEqual(next.effect, 'blocked', `${from} -> ${to} no se bloquea`);
    blueprint = next.blueprint;
  }
  const verdict = judge(build, toMachine(alphabet, build, blueprint, level3.machine));
  assert.equal(verdict.correct, true, 'el asalto de construccion pasa');
});

function fakeElement(tag, ns = null) {
  return {
    tag,
    ns,
    children: [],
    parentNode: null,
    className: '',
    textContent: '',
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    append(...nodes) {
      for (const child of nodes) {
        child.parentNode = this;
        this.children.push(child);
      }
    },
    remove() {
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter((entry) => entry !== this);
        this.parentNode = null;
      }
    },
  };
}

function* walk(node) {
  yield node;
  for (const child of node.children) {
    yield* walk(child);
  }
}

test('e2e N3: la escena expone el camino reparacion -> construccion', () => {
  const stash = globalThis.document;
  globalThis.document = {
    createElement: (tag) => fakeElement(tag),
    createElementNS: (ns, tag) => fakeElement(tag, ns),
  };
  try {
    for (const phase of ['repair', 'build']) {
      const scene = createLevelScene({ level: { contract: '03' }, puzzle: {}, phase });
      const actions = [...walk(scene.element)]
        .map((node) => node.getAttribute('data-action'))
        .filter(Boolean);
      for (const action of ['contract', 'hint', 'log', 'probe', 'assault', 'cut']) {
        assert.ok(actions.includes(action), `fase ${phase}: hay ${action}`);
      }
      const assault = [...walk(scene.element)].find(
        (node) => node.getAttribute('data-action') === 'assault',
      );
      const name = [...walk(assault)]
        .map((node) => node.textContent)
        .find((text) => text === 'Ensayo' || text === 'Asalto');
      assert.equal(name, phase === 'build' ? 'Asalto' : 'Ensayo', `fase ${phase}: el control nombra su momento`);
      assert.equal(scene.element.getAttribute('data-phase'), phase);
    }
  } finally {
    globalThis.document = stash;
  }
});

test('e2e N3: el mecanismo se agranda solo en el nivel 3', () => {
  const css = readFileSync(join(repoRoot, 'src', 'ui', 'graphVisuals.css'), 'utf8');
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = clean
    .split('}')
    .map((chunk) => chunk.split('{'))
    .filter((parts) => parts.length === 2)
    .map(([selector, body]) => ({ selector: selector.trim(), body }));
  const scoped = rules.filter((rule) => rule.selector.includes('gv-level-3'));
  assert.ok(scoped.length > 0, 'hay reglas con alcance N3 en graphVisuals.css');
  const bodies = scoped.map((rule) => rule.body).join('\n');
  assert.ok(/scale\(/.test(bodies), 'las piezas crecen en el tablero');
  assert.ok(/stroke-width\s*:\s*[6-9]/.test(bodies), 'los cables engordan');
  assert.ok(/font-size\s*:\s*1[4-9]px/.test(bodies), 'las etiquetas crecen');
  for (const rule of scoped) {
    for (const selector of rule.selector.split(',')) {
      const trimmed = selector.trim();
      if (/^(\d+%|from|to)$/.test(trimmed)) {
        continue;
      }
      assert.ok(
        trimmed.includes('gv-level-3') || trimmed.includes('[data-level="3"]'),
        `la regla ampliada no se escapa del N3: ${trimmed}`,
      );
    }
  }
  assert.ok(
    !/\.museum-editor-slot|#canvas\s*\{[^}]*width|wb-stage/.test(bodies),
    'el area de trabajo no cambia de tamano',
  );
});
