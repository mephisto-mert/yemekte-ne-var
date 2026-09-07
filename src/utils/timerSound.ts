/**
 * Synthesizes a pleasant dual-tone kitchen timer alarm chime using Web Audio API
 */
export function playTimerAlarm(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    
    // Play 3 successive melodic chimes
    const chimeTimes = [0, 0.25, 0.5];
    const freqs = [587.33, 880, 1174.66]; // D5, A5, D6

    chimeTimes.forEach((delay, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[idx % freqs.length], now + delay);

      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.6);
    });

    // Clean up AudioContext to prevent memory/resource leaks across repeated alarms
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch (err) {
    console.warn('Audio chime failed:', err);
  }
}
