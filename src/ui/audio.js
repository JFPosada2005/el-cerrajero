// El Cerrajero — audio del remaster: SFX por archivo con synth de respaldo
// y música en loop. Adaptado del bloque sintetizado del mockup
// (mockups/nivel-1-taller/app.js: audio/tone/noise/sounds).
//
// Contrato (docs/REMASTER-INTERFACES.md):
// - Sin autoplay: enabled = false por defecto.
// - Sin window/AudioContext: objeto inerte, sin lanzar.
// - AudioContext perezoso: no se crea hasta el primer play/playMusic
//   con el sonido habilitado.
// - SFX P0 con respaldo sintetizado: click, cable, cut, gear, lock,
//   bell, paper, error. Sin archivo ni synth → silencio.
// - Música solo si el manifest la marca available; loop, volumen bajo.

import { musicUrl, sfxUrl } from './assets.js';

const SYNTH_IDS = new Set(['click', 'cable', 'cut', 'gear', 'lock', 'bell', 'paper', 'error']);
const MUSIC_VOLUME = 0.2;

function audioCtor() {
  const win = globalThis.window;
  if (win && (win.AudioContext || win.webkitAudioContext)) {
    return win.AudioContext || win.webkitAudioContext;
  }
  return globalThis.AudioContext || globalThis.webkitAudioContext || null;
}

function tone(context, { frequency = 220, duration = 0.06, type = 'sine', volume = 0.04, slide = 0, delay = 0 } = {}) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slide !== 0) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), start + duration);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noise(context, { duration = 0.08, volume = 0.03, frequency = 1800, delay = 0 } = {}) {
  const frames = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frames; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 1.2;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(start);
}

// Recetas del mockup: click, plug→cable, snip→cut, gear, lock, bell,
// paper, error. (approach/verdict son demo del mockup, fuera del P0.)
const PRESETS = {
  click(context) {
    noise(context, { duration: 0.012, volume: 0.012, frequency: 2600 });
    tone(context, { frequency: 620, duration: 0.025, type: 'triangle', volume: 0.012, slide: -140 });
  },
  cable(context) {
    tone(context, { frequency: 150, duration: 0.1, type: 'triangle', volume: 0.05, slide: -55 });
    tone(context, { frequency: 1100, duration: 0.035, type: 'square', volume: 0.01, slide: -350 });
    noise(context, { duration: 0.03, volume: 0.014, frequency: 1700 });
  },
  cut(context) {
    noise(context, { duration: 0.035, volume: 0.04, frequency: 5200 });
    tone(context, { frequency: 2600, duration: 0.045, type: 'triangle', volume: 0.014, slide: -900 });
    noise(context, { duration: 0.02, volume: 0.018, frequency: 3000, delay: 0.055 });
  },
  gear(context) {
    for (let index = 0; index < 5; index += 1) {
      noise(context, { duration: 0.03, volume: 0.012, frequency: 1500 + index * 160, delay: index * 0.045 });
      tone(context, { frequency: 86 + index * 4, duration: 0.04, type: 'triangle', volume: 0.012, delay: index * 0.045 });
    }
    tone(context, { frequency: 64, duration: 0.18, type: 'sine', volume: 0.025, slide: -8 });
  },
  lock(context) {
    noise(context, { duration: 0.05, volume: 0.025, frequency: 520 });
    tone(context, { frequency: 74, duration: 0.24, type: 'sine', volume: 0.06, slide: -12 });
    tone(context, { frequency: 300, duration: 0.08, type: 'triangle', volume: 0.018, slide: -90 });
  },
  bell(context) {
    const partials = [
      [523, 0.032, 1.5],
      [1248, 0.016, 1.05],
      [1560, 0.012, 0.85],
      [2184, 0.008, 0.65],
      [2808, 0.005, 0.45],
    ];
    for (const [frequency, volume, duration] of partials) {
      tone(context, { frequency, duration, type: 'sine', volume, slide: -10 });
    }
    tone(context, { frequency: 261, duration: 1.2, type: 'sine', volume: 0.015, slide: -3 });
    noise(context, { duration: 0.025, volume: 0.016, frequency: 3200 });
  },
  paper(context) {
    noise(context, { duration: 0.1, volume: 0.018, frequency: 1100 });
    noise(context, { duration: 0.06, volume: 0.01, frequency: 2400, delay: 0.05 });
  },
  error(context) {
    tone(context, { frequency: 140, duration: 0.14, type: 'sawtooth', volume: 0.018, slide: -20 });
    noise(context, { duration: 0.05, volume: 0.012, frequency: 420 });
  },
};

export function createAudio({ manifest = null, enabled = false } = {}) {
  let on = enabled === true;
  let context = null;
  let musicElement = null;
  let disposed = false;

  function ensureContext() {
    if (disposed || context) {
      return context;
    }
    const Ctor = audioCtor();
    if (Ctor === null || typeof Ctor !== 'function') {
      return null;
    }
    try {
      context = new Ctor();
    } catch {
      context = null;
    }
    if (context && context.state === 'suspended' && typeof context.resume === 'function') {
      try {
        const resumed = context.resume();
        if (resumed && typeof resumed.catch === 'function') {
          resumed.catch(() => {});
        }
      } catch {
        // El contexto queda en suspenso; el próximo play reintenta.
      }
    }
    return context;
  }

  function playFile(url) {
    const AudioCtor = globalThis.Audio;
    if (typeof AudioCtor !== 'function') {
      return false;
    }
    try {
      const element = new AudioCtor(url);
      const played = element.play();
      if (played && typeof played.catch === 'function') {
        played.catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  }

  function play(id) {
    if (on === false || disposed || typeof id !== 'string' || id.length === 0) {
      return;
    }
    let url = null;
    try {
      url = sfxUrl(manifest, id);
    } catch {
      url = null;
    }
    if (url !== null && playFile(url)) {
      return;
    }
    if (SYNTH_IDS.has(id) === false) {
      return;
    }
    const ready = ensureContext();
    if (ready === null) {
      return;
    }
    try {
      PRESETS[id](ready);
    } catch {
      // El audio nunca rompe el juego.
    }
  }

  function stopMusic() {
    if (musicElement !== null) {
      try {
        musicElement.pause();
      } catch {
        // Ignorar: detener música es best-effort.
      }
      musicElement = null;
    }
  }

  function playMusic(id) {
    stopMusic();
    if (on === false || disposed || typeof id !== 'string' || id.length === 0) {
      return;
    }
    let url = null;
    try {
      url = musicUrl(manifest, id);
    } catch {
      url = null;
    }
    // Solo suena si el manifest la marca available (musicUrl → null si no).
    if (url === null) {
      return;
    }
    const AudioCtor = globalThis.Audio;
    if (typeof AudioCtor !== 'function') {
      return;
    }
    try {
      const element = new AudioCtor(url);
      element.loop = true;
      element.volume = MUSIC_VOLUME;
      const played = element.play();
      if (played && typeof played.catch === 'function') {
        played.catch(() => {});
      }
      musicElement = element;
    } catch {
      musicElement = null;
    }
  }

  function setEnabled(value) {
    on = value === true;
    if (on === false) {
      stopMusic();
    }
  }

  function isEnabled() {
    return on;
  }

  function dispose() {
    stopMusic();
    disposed = true;
    if (context !== null) {
      try {
        const closed = context.close();
        if (closed && typeof closed.catch === 'function') {
          closed.catch(() => {});
        }
      } catch {
        // Cierre best-effort.
      }
      context = null;
    }
  }

  return { play, setEnabled, isEnabled, playMusic, stopMusic, dispose };
}
