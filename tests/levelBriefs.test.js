import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_BRIEFS } from '../src/ui/levelBriefs.js';

const BANNED = ['afd', 'afnd', 'autómata', 'automata', 'estado', 'transición', 'transicion', 'lenguaje'];

test('cada nivel tiene contexto y tutorial no vacíos', () => {
  for (const id of [1, 2, 3, 4, 5]) {
    const brief = LEVEL_BRIEFS[id];
    assert.ok(brief, `falta el brief del nivel ${id}`);
    assert.ok(typeof brief.context === 'string' && brief.context.trim().length > 0, `contexto vacío en N${id}`);
    assert.ok(typeof brief.tutorial === 'string' && brief.tutorial.trim().length > 0, `tutorial vacío en N${id}`);
  }
});

test('vocabulario de taller, sin jerga académica', () => {
  const copy = Object.values(LEVEL_BRIEFS).map((brief) => `${brief.context} ${brief.tutorial}`).join(' · ').toLowerCase();
  for (const word of BANNED) {
    assert.ok(!new RegExp(`\\b${word}\\b`).test(copy), `sin "${word}" en los briefs`);
  }
  assert.ok(!/\bap\b/.test(copy), 'sin "ap" en los briefs');
  assert.ok(!/\bmt\b/.test(copy), 'sin "mt" en los briefs');
});

test('N1 enseña lo básico: carrete, tijera, campana y ensayo', () => {
  const tutorial = LEVEL_BRIEFS[1].tutorial.toLowerCase();
  for (const word of ['carrete', 'tijera', 'campana', 'ensayo']) {
    assert.ok(tutorial.includes(word), `el tutorial de N1 nombra ${word}`);
  }
});

test('N2+ cuentan solo lo nuevo, sin repetir conectar', () => {
  const keywords = {
    2: ['bucle', 'pisos'],
    3: ['bifurcador', 'resorte'],
    4: ['pila', 'arriba de la pila', 'acción'],
    5: ['cinta', 'cabezal', 'púa', 'guardar'],
  };
  for (const [id, words] of Object.entries(keywords)) {
    const tutorial = LEVEL_BRIEFS[Number(id)].tutorial.toLowerCase();
    for (const word of words) {
      assert.ok(tutorial.includes(word), `el tutorial de N${id} nombra ${word}`);
    }
    assert.ok(!tutorial.includes('conectar'), `N${id} no repite cómo conectar`);
  }
});
