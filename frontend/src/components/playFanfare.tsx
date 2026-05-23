export const playFanfare = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.4, ctx.currentTime);
    master.connect(ctx.destination);

    // A classic "ta-da" fanfare: two quick grace notes then a held chord
    // Notes: G4 → C5 → E5+G5 (the "ta-da" shape)
    const schedule = [
      { freq: 392.0, start: 0.0,  duration: 0.12 },  // G4 - first "ta"
      { freq: 523.25, start: 0.11, duration: 0.12 },  // C5 - second "ta"
      { freq: 659.25, start: 0.22, duration: 0.55 },  // E5 - "da" root \
      { freq: 783.99, start: 0.22, duration: 0.55 },  // G5 - "da" fifth  } chord
      { freq: 523.25, start: 0.22, duration: 0.55 },  // C5 - "da" octave/
    ];

    schedule.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Sawtooth + lowpass filter = brassy trumpet-like tone
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime + start);
      filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + start + duration);
      filter.Q.setValueAtTime(2, ctx.currentTime);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      // Slight pitch scoop up at the start of each note — very trumpet-like
      osc.frequency.setValueAtTime(freq * 0.97, ctx.currentTime + start);
      osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + start + 0.04);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
      gainNode.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.02); // sharp attack
      gainNode.gain.setValueAtTime(0.6, ctx.currentTime + start + duration - 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(master);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    });

    // Close context after fanfare finishes (~1 second total)
    setTimeout(() => ctx.close(), 1200);
  } catch (error) {
    console.warn('Fanfare playback failed', error);
  }
};