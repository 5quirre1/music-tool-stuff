class Metronome {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.bpm = 120;
        this.beatsPerBar = 4;
        this.currentBeat = 0;
        this.nextNoteTime = 0.0;
        this.timerID = null;
        this.lookahead = 25.0; 
        this.scheduleAheadTime = 0.1; 
        this.beatCallback = null;
        this.clickSound = new ClickSound();
    }

    init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.clickSound.init(this.audioContext);
    }

    start() {
        if (this.isPlaying) return;

        if (!this.audioContext) {
            this.init();
        } else if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.currentBeat = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler(); 
    }

    stop() {
        this.isPlaying = false;
        if (this.timerID) {
            window.clearTimeout(this.timerID);
        }
    }

    setBpm(bpm) {
        this.bpm = bpm;
    }

    setBeatsPerBar(beats) {
        this.beatsPerBar = beats;
    }

    onBeat(callback) {
        this.beatCallback = callback;
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeat, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat;
        this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
    }

    scheduleNote(beatNumber, time) {
        const isAccent = beatNumber === 0;
        this.clickSound.play(time, isAccent);

        if (this.beatCallback) {
            const currentTime = this.audioContext.currentTime;
            const timeUntilNote = (time - currentTime) * 1000;
            setTimeout(() => {
                this.beatCallback(beatNumber);
            }, timeUntilNote > 0 ? timeUntilNote : 0);
        }
    }
}

class ClickSound {
    constructor() {
        this.audioContext = null;
    }

    init(audioContext) {
        this.audioContext = audioContext;
    }

    play(time, isAccent) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = isAccent ? 'sine' : 'sine';
        oscillator.frequency.value = isAccent ? 1000 : 800;

        gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(isAccent ? 0.5 : 0.3, time + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(time);
        oscillator.stop(time + 0.1);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const metronome = new Metronome();

    const startStopBtn = document.getElementById('startStop');
    const bpmInput = document.getElementById('bpm');
    const bpmValue = document.getElementById('bpmValue');
    const tempoMarkings = document.getElementById('tempoMarkings');
    const beatsPerBarSelect = document.getElementById('beatsPerBar');
    const visualMetronome = document.getElementById('visualMetronome');

    function createBeatIndicators(numBeats) {
        visualMetronome.innerHTML = '';
        for (let i = 0; i < numBeats; i++) {
            const beat = document.createElement('div');
            beat.classList.add('beat');
            beat.dataset.beat = i;
            visualMetronome.appendChild(beat);
        }
    }

    function updateBpmDisplay(bpm) {
        bpmValue.textContent = bpm;

        let tempoText = '';
        if (bpm < 40) tempoText = 'Grave';
        else if (bpm < 60) tempoText = 'Largo';
        else if (bpm < 66) tempoText = 'Larghetto';
        else if (bpm < 76) tempoText = 'Adagio';
        else if (bpm < 108) tempoText = 'Andante';
        else if (bpm < 120) tempoText = 'Moderato';
        else if (bpm < 168) tempoText = 'Allegro';
        else if (bpm < 200) tempoText = 'Vivace';
        else tempoText = 'Presto';

        tempoMarkings.textContent = tempoText;
    }

    updateBpmDisplay(bpmInput.value);
    createBeatIndicators(parseInt(beatsPerBarSelect.value));

    metronome.onBeat(function(beatNumber) {
        document.querySelectorAll('.beat').forEach(beat => {
            beat.classList.remove('active');
        });

        const currentBeat = document.querySelector(`.beat[data-beat="${beatNumber}"]`);
        if (currentBeat) {
            currentBeat.classList.add('active');
        }
    });

    startStopBtn.addEventListener('click', function() {
        if (metronome.isPlaying) {
            metronome.stop();
            startStopBtn.textContent = 'Start';
            startStopBtn.classList.remove('btn-danger');
            startStopBtn.classList.add('btn-success');
            document.querySelectorAll('.beat').forEach(beat => {
                beat.classList.remove('active');
            });
        } else {
            metronome.start();
            startStopBtn.textContent = 'Stop';
            startStopBtn.classList.remove('btn-success');
            startStopBtn.classList.add('btn-danger');
        }
    });

    bpmInput.addEventListener('input', function() {
        const bpm = parseInt(this.value);
        metronome.setBpm(bpm);
        updateBpmDisplay(bpm);
    });

    beatsPerBarSelect.addEventListener('change', function() {
        const beats = parseInt(this.value);
        metronome.setBeatsPerBar(beats);
        createBeatIndicators(beats);
    });

    const tapTempoBtn = document.getElementById('tapTempo');
    let tapTimes = [];
    let lastTapTime = 0;

    tapTempoBtn.addEventListener('click', function() {
        const currentTime = Date.now();

        if (lastTapTime > 0) {
            const interval = currentTime - lastTapTime;

            if (interval > 200 && interval < 2000) {
                tapTimes.push(interval);

                if (tapTimes.length > 4) {
                    tapTimes.shift();
                }

                const avgInterval = tapTimes.reduce((sum, val) => sum + val, 0) / tapTimes.length;
                const bpm = Math.round(60000 / avgInterval);

                bpmInput.value = bpm;
                metronome.setBpm(bpm);
                updateBpmDisplay(bpm);
            }
        }

        lastTapTime = currentTime;

        setTimeout(() => {
            if (Date.now() - lastTapTime >= 2000) {
                tapTimes = [];
                lastTapTime = 0;
            }
        }, 2000);
    });
});