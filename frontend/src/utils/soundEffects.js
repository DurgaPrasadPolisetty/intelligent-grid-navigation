
let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

export async function playSound(
  type,
  { enabled = true, volume = 0.35 } = {}
) {
  if (!enabled || volume <= 0) return;

  try {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      await context.resume();
    }

    const sounds = {
      move: [
        { frequency: 620, duration: 0.065, offset: 0 },
      ],
      blocked: [
        { frequency: 190, duration: 0.12, offset: 0 },
      ],
      success: [
        { frequency: 523.25, duration: 0.14, offset: 0 },
        { frequency: 659.25, duration: 0.14, offset: 0.13 },
        { frequency: 783.99, duration: 0.24, offset: 0.26 },
      ],
      start: [
        { frequency: 420, duration: 0.08, offset: 0 },
        { frequency: 560, duration: 0.1, offset: 0.08 },
      ],
      complete: [
        { frequency: 660, duration: 0.12, offset: 0 },
        { frequency: 880, duration: 0.18, offset: 0.12 },
      ],
      error: [
        { frequency: 240, duration: 0.16, offset: 0 },
        { frequency: 180, duration: 0.2, offset: 0.15 },
      ],
    };

    const notes = sounds[type];
    if (!notes) return;

    const now = context.currentTime;

    for (const note of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = now + note.offset;
      const endAt = startAt + note.duration;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        note.frequency,
        startAt
      );

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, Math.min(volume, 1) * 0.12),
        startAt + 0.012
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        endAt
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(startAt);
      oscillator.stop(endAt + 0.02);
    }
  } catch {
    // Audio must never interrupt grid navigation.
  }
}
