
let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// Call this on the VERY FIRST user touch/click
export function primeAudio() {
  const audio = getCtx();
  if (!audio) return;

  if (audio.state === 'suspended') {
    audio.resume().catch(() => {});
  }

  // iOS requires a silent sound to actually play to unlock the context
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  gain.gain.value = 0.001; // Almost silent, but not 0
  osc.connect(gain).connect(audio.destination);
  osc.start(0);
  osc.stop(0.1);
}

async function prepare() {
  const audio = getCtx();
  if (!audio) return null;
  if (audio.state === 'suspended') {
    try { await audio.resume(); } catch { return null; }
  }
  return audio;
}

function playNote(audio, freq, start, dur, gainPeak = 0.3, type = 'sine') {
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  
  gain.gain.setValueAtTime(0.0001, now + start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
  
  osc.connect(gain).connect(audio.destination);
  osc.start(now + start);
  osc.stop(now + start + dur + 0.05);
}

export async function playChime() {
  const audio = await prepare();
  if (!audio) return;
  playNote(audio, 659.25, 0.00, 0.20);
  playNote(audio, 880.00, 0.15, 0.42);
}

export async function playPop() {
  const audio = await prepare();
  if (!audio) return;
  playNote(audio, 880, 0, 0.06, 0.15, 'triangle');
  playNote(audio, 1320, 0.03, 0.09, 0.1, 'sine');
}

export async function playSuccess() {
  const audio = await prepare();
  if (!audio) return;
  playNote(audio, 523.25, 0.00, 0.14);
  playNote(audio, 659.25, 0.11, 0.14);
  playNote(audio, 783.99, 0.22, 0.30);
}

export async function playError() {
  const audio = await prepare();
  if (!audio) return;
  playNote(audio, 220, 0, 0.20, 0.2, 'sawtooth');
}
