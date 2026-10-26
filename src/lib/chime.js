 
let audioCtx = null;

export function primeAudio() {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

function playTone({ type = 'sine', freq, duration, volume = 0.05, delay = 0 }) {
  // Strict Gate: Do not play if context isn't ready/unlocked
  if (!audioCtx || audioCtx.state === 'suspended') return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const now = audioCtx.currentTime + delay;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

export function playPop() {
  playTone({ type: 'triangle', freq: 300, duration: 0.08, volume: 0.03 });
}

export function playSuccess() {
  playTone({ type: 'sine', freq: 440, duration: 0.15, volume: 0.04 });
  playTone({ type: 'sine', freq: 554.37, duration: 0.3, volume: 0.04, delay: 0.08 });
}

export function playError() {
  playTone({ type: 'sawtooth', freq: 150, duration: 0.15, volume: 0.03 });
}

export function playChime() {
  playTone({ type: 'sine', freq: 880, duration: 0.4, volume: 0.05 });
  playTone({ type: 'sine', freq: 1108.73, duration: 0.4, volume: 0.05, delay: 0.15 });
}
