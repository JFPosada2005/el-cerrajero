import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/ui/audio.js';

function cleanGlobals() {
  delete globalThis.window;
  delete globalThis.AudioContext;
  delete globalThis.webkitAudioContext;
  delete globalThis.Audio;
}

function paramNode() {
  return { setValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 };
}

function installAudioContextStub(record) {
  const stub = {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: {},
    resume() {
      record.resumes += 1;
      return Promise.resolve();
    },
    close() {
      record.closes += 1;
      return Promise.resolve();
    },
    createOscillator() {
      record.oscillators += 1;
      return { type: '', frequency: paramNode(), connect() {}, start() {}, stop() {} };
    },
    createGain() {
      record.gains += 1;
      return { gain: paramNode(), connect() {} };
    },
    createBuffer(_channels, frames) {
      record.buffers += 1;
      return { getChannelData() { return new Float32Array(frames); } };
    },
    createBufferSource() {
      return { buffer: null, connect() {}, start() {} };
    },
    createBiquadFilter() {
      return { type: '', frequency: { value: 0 }, Q: { value: 0 }, connect() {} };
    },
  };
  globalThis.AudioContext = function AudioContextStub() {
    record.constructions += 1;
    return stub;
  };
}

function freshRecord() {
  return { constructions: 0, oscillators: 0, gains: 0, buffers: 0, resumes: 0, closes: 0 };
}

test('sin AudioContext el objeto es inerte y no lanza', () => {
  cleanGlobals();
  const audio = createAudio({ manifest: null });
  assert.equal(audio.isEnabled(), false);
  assert.doesNotThrow(() => {
    audio.play('click');
    audio.playMusic('n1');
    audio.setEnabled(true);
    audio.play('click');
    audio.play('inexistente');
    audio.stopMusic();
    audio.dispose();
  });
  assert.equal(audio.isEnabled(), true);
  cleanGlobals();
});

test('setEnabled/isEnabled conmutan, apagado por defecto', () => {
  cleanGlobals();
  const audio = createAudio({ manifest: null });
  assert.equal(audio.isEnabled(), false);
  audio.setEnabled(true);
  assert.equal(audio.isEnabled(), true);
  audio.setEnabled(false);
  assert.equal(audio.isEnabled(), false);
  const on = createAudio({ manifest: null, enabled: true });
  assert.equal(on.isEnabled(), true);
  cleanGlobals();
});

test('no hay autoplay ni contexto perezoso hasta el primer play habilitado', () => {
  cleanGlobals();
  const record = freshRecord();
  installAudioContextStub(record);
  try {
    const audio = createAudio({ manifest: null });
    assert.equal(record.constructions, 0);
    audio.setEnabled(true);
    assert.equal(record.constructions, 0);
    audio.play('click');
    assert.equal(record.constructions, 1);
    assert.ok(record.oscillators + record.gains > 0);
  } finally {
    cleanGlobals();
  }
});

test('play con sonido apagado no crea contexto', () => {
  cleanGlobals();
  const record = freshRecord();
  installAudioContextStub(record);
  try {
    const audio = createAudio({ manifest: null });
    audio.play('click');
    assert.equal(record.constructions, 0);
  } finally {
    cleanGlobals();
  }
});

test('play con id desconocido no lanza y no sintetiza', () => {
  cleanGlobals();
  const record = freshRecord();
  installAudioContextStub(record);
  try {
    const audio = createAudio({ manifest: null, enabled: true });
    assert.doesNotThrow(() => audio.play('inexistente'));
    assert.equal(record.constructions, 0);
    assert.equal(record.oscillators, 0);
  } finally {
    cleanGlobals();
  }
});

test('los ocho SFX P0 tienen respaldo sintetizado', () => {
  cleanGlobals();
  const record = freshRecord();
  installAudioContextStub(record);
  try {
    const audio = createAudio({ manifest: null, enabled: true });
    for (const id of ['click', 'cable', 'cut', 'gear', 'lock', 'bell', 'paper', 'error']) {
      assert.doesNotThrow(() => audio.play(id), `play(${id}) no debe lanzar`);
    }
    assert.ok(record.oscillators > 0);
    assert.ok(record.buffers > 0);
  } finally {
    cleanGlobals();
  }
});

test('playMusic sin archivo available no hace nada y no lanza', () => {
  cleanGlobals();
  const record = freshRecord();
  installAudioContextStub(record);
  try {
    const audio = createAudio({ manifest: { music: { n1: { status: 'missing' } } }, enabled: true });
    assert.doesNotThrow(() => {
      audio.playMusic('n1');
      audio.playMusic('inexistente');
      audio.stopMusic();
    });
    assert.equal(record.constructions, 0);
  } finally {
    cleanGlobals();
  }
});

test('dispose cierra el contexto y deja el objeto inerte', () => {
  cleanGlobals();
  const record = freshRecord();
  installAudioContextStub(record);
  try {
    const audio = createAudio({ manifest: null, enabled: true });
    audio.play('click');
    assert.equal(record.constructions, 1);
    audio.dispose();
    assert.equal(record.closes, 1);
    assert.doesNotThrow(() => {
      audio.play('click');
      audio.playMusic('n1');
    });
    assert.equal(record.constructions, 1);
  } finally {
    cleanGlobals();
  }
});
