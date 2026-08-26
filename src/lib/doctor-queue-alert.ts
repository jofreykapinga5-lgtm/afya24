"use client";

// Grabs a doctor's attention when a new patient joins the live queue while
// the dashboard tab is open somewhere in the background -- no vendor/asset
// needed: the beep is synthesized with the Web Audio API (no sound file to
// ship or license), and the title flash is plain document.title swapping.

let flashIntervalId: number | null = null;
let originalTitle: string | null = null;

// A fresh AudioContext per call rather than a shared long-lived one -- these
// alerts fire at most a few times a minute in real use, and a short-lived
// context sidesteps ever having to reason about a suspended/stale context
// across tab visibility changes.
export function playQueueAlertSound() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Two quick rising beeps read as "new arrival," not as a generic error
    // chime or a single-tone notification a doctor might tune out.
    [880, 1108].forEach((frequency, index) => {
      const startAt = ctx.currentTime + index * 0.16;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.14);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.15);
    });

    window.setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {
    // Browser autoplay restrictions or an unsupported API -- the title
    // flash below still gets the doctor's attention either way.
  }
}

export function startQueueTitleFlash(message: string) {
  if (flashIntervalId !== null) return;
  originalTitle = document.title;
  let showingAlert = false;
  flashIntervalId = window.setInterval(() => {
    document.title = showingAlert ? (originalTitle ?? document.title) : message;
    showingAlert = !showingAlert;
  }, 1000);
}

export function stopQueueTitleFlash() {
  if (flashIntervalId === null) return;
  window.clearInterval(flashIntervalId);
  flashIntervalId = null;
  if (originalTitle !== null) {
    document.title = originalTitle;
    originalTitle = null;
  }
}
