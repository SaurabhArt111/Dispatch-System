/**
 * Generates a short two-tone notification chime with the Web Audio API.
 * Avoids bundling a binary audio asset -- works offline as part of the PWA.
 */
let ctx;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
  }
  return ctx;
}

export function playNotificationChime() {
  try {
    const audioCtx = getCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const notes = [
      { freq: 880, start: 0, dur: 0.14 },
      { freq: 1175, start: 0.15, dur: 0.22 }
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.22, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    });
  } catch (e) {
    // Audio not available (e.g. autoplay restrictions before first user interaction) -- fail silently
  }
}
