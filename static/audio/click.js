class ClickGenerator {
    constructor() {
        this.audioContext = null;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    play(time, isAccent = false) {
        const ctx = this.init();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = isAccent ? 'sine' : 'sine';
        oscillator.frequency.value = isAccent ? 1000 : 800;

        gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(isAccent ? 0.5 : 0.3, ctx.currentTime + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    }
}

window.ClickGenerator = ClickGenerator;
