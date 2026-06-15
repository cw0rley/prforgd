/**
 * Generates the timer sound assets used by the workout timer (lead-in beeps,
 * GO tone, and AMRAP time-up buzzer). Synthesizes 16-bit mono PCM WAV files so
 * there are no binary assets to source/track. Run once:
 *   node scripts/generate-timer-sounds.js
 * Outputs to assets/sounds/{beep,go,buzzer}.wav
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

// Build a 16-bit PCM mono WAV buffer from an array of float samples [-1, 1].
function encodeWav(samples) {
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);          // fmt chunk size
  buffer.writeUInt16LE(1, 20);           // PCM
  buffer.writeUInt16LE(1, 22);           // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32);           // block align
  buffer.writeUInt16LE(16, 34);          // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buffer;
}

// Tone generator. `harmonics` lets us thicken the buzzer into a square-ish tone.
function tone({ freq, durationSec, amplitude = 0.6, harmonics = [1], fade = 0.01 }) {
  const n = Math.floor(SAMPLE_RATE * durationSec);
  const fadeSamples = Math.floor(SAMPLE_RATE * fade);
  const samples = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let v = 0;
    for (let h = 0; h < harmonics.length; h++) {
      const mult = harmonics[h];
      v += (1 / (h + 1)) * Math.sin(2 * Math.PI * freq * mult * t);
    }
    // envelope: short linear fade in/out to avoid clicks
    let env = 1;
    if (i < fadeSamples) env = i / fadeSamples;
    else if (i > n - fadeSamples) env = (n - i) / fadeSamples;
    samples[i] = v * amplitude * env;
  }
  return samples;
}

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });

// Countdown tick (3, 2, 1)
fs.writeFileSync(
  path.join(outDir, 'beep.wav'),
  encodeWav(tone({ freq: 880, durationSec: 0.13, amplitude: 0.6 }))
);

// GO tone (higher + a touch longer)
fs.writeFileSync(
  path.join(outDir, 'go.wav'),
  encodeWav(tone({ freq: 1175, durationSec: 0.45, amplitude: 0.65 }))
);

// AMRAP time-up buzzer (low, thick, ~1s)
fs.writeFileSync(
  path.join(outDir, 'buzzer.wav'),
  encodeWav(tone({ freq: 220, durationSec: 0.95, amplitude: 0.6, harmonics: [1, 3, 5], fade: 0.02 }))
);

console.log('Wrote beep.wav, go.wav, buzzer.wav to', outDir);
