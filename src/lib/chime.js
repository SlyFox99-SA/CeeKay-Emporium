/* Sound effects generated via Web Audio API.
   No audio files, no licensing, works everywhere. */

let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function primeAudio() {
  const audio = getCtx();
  if (audio && audio.state === 'suspended') {
    audio.resume().catch(() => {});
  }
}

function note(audio, freq, start, dur, gainPeak = 0.25, type = 'sine') {
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, now + start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(now + start);
  osc.stop(now + start + dur + 0.05);
}

async function prepare() {
  const audio = getCtx();
  if (!audio) return null;
  if (audio.state === 'suspended') {
    try { await audio.resume(); } catch { return null; }
  }
  return audio;
}

/* Kitchen alert — two-note doorbell */
export async function playChime() {
  const audio = await prepare();
  if (!audio) return;
  note(audio, 659.25, 0.00, 0.20, 0.30);
  note(audio, 880.00, 0.15, 0.42, 0.30);
}

/* Add-to-cart pop — short, satisfying */
export async function playPop() {
  const audio = await prepare();
  if (!audio) return;
  note(audio, 880, 0, 0.06, 0.18, 'triangle');
  note(audio, 1320, 0.03, 0.09, 0.14, 'sine');
}

/* Order-placed success — happy three-note rise */
export async function playSuccess() {
  const audio = await prepare();
  if (!audio) return;
  note(audio, 523.25, 0.00, 0.14, 0.22);  /* C5 */
  note(audio, 659.25, 0.11, 0.14, 0.22);  /* E5 */
  note(audio, 783.99, 0.22, 0.30, 0.26);  /* G5 */
}

/* Soft error */
export async function playError() {
  const audio = await prepare();
  if (!audio) return;
  note(audio, 220, 0, 0.20, 0.20, 'sawtooth');
}
