export const playCorrectSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const master = ctx.createGain();
        master.gain.setValueAtTime(0.5, ctx.currentTime);
        master.connect(ctx.destination);

        const harmonics = [
            { ratio: 1, gain: 1.0 },
            { ratio: 2.756, gain: 0.5 },
            { ratio: 5.404, gain: 0.25 },
        ];

        harmonics.forEach(({ ratio, gain: gainAmt }, i) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1250 * ratio * 1.04, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1250 * ratio, ctx.currentTime + 0.03);

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(gainAmt, ctx.currentTime + 0.004);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);

            osc.connect(gainNode);
            gainNode.connect(master);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.95);

            if (i === 0) {
                osc.onended = () => {
                    ctx.close();
                };
            }
        });
    } catch (error) {
        console.warn('Correct sound playback failed', error);
    }
};
