class NotesReference {
    constructor() {
        this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.currentNote = null;
        this.currentOctave = 4;

        this.audioContext = null;

        this.noteDisplay = document.getElementById('current-note');
        this.freqDisplay = document.getElementById('note-frequency');
        this.noteSelect = document.getElementById('note-select');
        this.octaveSelect = document.getElementById('octave-select');
        this.playButton = document.getElementById('play-note');
        this.noteInfo = document.getElementById('note-info-content');
        this.scalesContainer = document.getElementById('scales-container');
        this.chordsContainer = document.getElementById('chords-container');

        this.pianoKeys = document.querySelectorAll('.white-key, .black-key');

        this.noteFrequencies = this.generateNoteFrequencies();

        this.scales = {
            'major': [0, 2, 4, 5, 7, 9, 11],          
            'minor': [0, 2, 3, 5, 7, 8, 10],          
            'pentatonic': [0, 2, 4, 7, 9],            
            'blues': [0, 3, 5, 6, 7, 10],             
            'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]  
        };

        this.chords = {
            'major': [0, 4, 7],           
            'minor': [0, 3, 7],           
            'dominant7': [0, 4, 7, 10],   
            'major7': [0, 4, 7, 11],      
            'minor7': [0, 3, 7, 10],      
            'diminished': [0, 3, 6],      
            'augmented': [0, 4, 8]        
        };
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Web Audio API not supported:', e);
            alert('Your browser does not support Web Audio API. Audio playback may not work.');
        }

        this.populateNoteSelect();

        this.setupEventListeners();

        this.setNote('A', 4);
    }

    populateNoteSelect() {
        this.noteSelect.innerHTML = '<option value="">Choose a note...</option>';

        this.notes.forEach(note => {
            const option = document.createElement('option');
            option.value = note;
            option.textContent = note;
            this.noteSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        if (this.noteSelect) {
            this.noteSelect.addEventListener('change', () => {
                const selectedNote = this.noteSelect.value;
                if (selectedNote) {
                    this.setNote(selectedNote, this.currentOctave);
                }
            });
        }

        if (this.octaveSelect) {
            this.octaveSelect.addEventListener('change', () => {
                this.currentOctave = parseInt(this.octaveSelect.value);
                if (this.currentNote) {
                    this.setNote(this.currentNote, this.currentOctave);
                }
            });
        }

        if (this.playButton) {
            this.playButton.addEventListener('click', () => {
                if (this.currentNote) {
                    this.playNote();
                } else {
                    alert('Please select a note first');
                }
            });
        }

        this.pianoKeys.forEach(key => {
            key.addEventListener('click', () => {
                const noteData = key.getAttribute('data-note');
                if (noteData) {
                    const note = noteData.slice(0, -1);
                    const octave = parseInt(noteData.slice(-1));

                    this.setNote(note, octave);

                    this.noteSelect.value = note;
                    this.octaveSelect.value = octave;

                    this.playNote();
                }
            });
        });
    }

    setNote(note, octave) {
        this.currentNote = note;
        this.currentOctave = octave;

        const fullNoteName = `${note}${octave}`;

        const frequency = this.getNoteFrequency(note, octave);

        this.updateDisplay(fullNoteName, frequency);

        this.updateNoteInformation(note, octave, frequency);

        this.updateScalesAndChords(note);

        this.updateActivePianoKey(fullNoteName);
    }

    updateDisplay(noteName, frequency) {
        if (this.noteDisplay) {
            this.noteDisplay.textContent = noteName;
        }

        if (this.freqDisplay) {
            this.freqDisplay.textContent = `${frequency.toFixed(2)} Hz`;
        }
    }

    updateNoteInformation(note, octave, frequency) {
        if (!this.noteInfo) return;

        const infoHTML = `
            <h5>About ${note}${octave}</h5>
            <p><strong>Frequency:</strong> ${frequency.toFixed(2)} Hz</p>
            <p><strong>Octave:</strong> ${octave} ${this.getOctaveDescription(octave)}</p>
            <p><strong>Musical Context:</strong> ${this.getMusicalContext(note, octave)}</p>
            <p><strong>Common Uses:</strong> ${this.getCommonUses(note, octave)}</p>
        `;

        this.noteInfo.innerHTML = infoHTML;
    }

    updateScalesAndChords(rootNote) {
        if (this.scalesContainer) {
            const scalesHTML = this.generateScalesHTML(rootNote);
            this.scalesContainer.innerHTML = scalesHTML;

            document.querySelectorAll('.scale-item').forEach(item => {
                item.addEventListener('click', () => {
                    const scaleType = item.getAttribute('data-scale');
                    this.playScale(rootNote, this.currentOctave, scaleType);
                });
            });
        }

        if (this.chordsContainer) {
            const chordsHTML = this.generateChordsHTML(rootNote);
            this.chordsContainer.innerHTML = chordsHTML;

            document.querySelectorAll('.chord-item').forEach(item => {
                item.addEventListener('click', () => {
                    const chordType = item.getAttribute('data-chord');
                    this.playChord(rootNote, this.currentOctave, chordType);
                });
            });
        }
    }

    updateActivePianoKey(noteName) {
        this.pianoKeys.forEach(key => key.classList.remove('active'));

        const activeKey = Array.from(this.pianoKeys).find(
            key => key.getAttribute('data-note') === noteName
        );

        if (activeKey) {
            activeKey.classList.add('active');

            const shownOctave = document.querySelector('.octave');
            if (shownOctave && shownOctave.id !== `octave-${this.currentOctave}`) {
            }
        }
    }

    async playNote() {
        if (!this.audioContext) return;

        const frequency = this.getNoteFrequency(this.currentNote, this.currentOctave);

        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.7, this.audioContext.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.5);

        this.noteDisplay.classList.add('playing');
        setTimeout(() => {
            this.noteDisplay.classList.remove('playing');
        }, 500);
    }

    async playScale(rootNote, octave, scaleType) {
        if (!this.audioContext || !this.scales[scaleType]) return;

        const rootIndex = this.notes.indexOf(rootNote);
        if (rootIndex === -1) return;

        const intervals = this.scales[scaleType];

        let time = this.audioContext.currentTime;
        const noteDuration = 0.3; 

        intervals.forEach(interval => {
            let noteIndex = (rootIndex + interval) % 12;
            let octaveAdjust = Math.floor((rootIndex + interval) / 12);
            let noteOctave = octave + octaveAdjust;

            let noteName = this.notes[noteIndex];
            let noteFreq = this.getNoteFrequency(noteName, noteOctave);

            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(noteFreq, time);

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.7, time + 0.05);
            gain.gain.linearRampToValueAtTime(0.001, time + noteDuration - 0.05);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(time);
            osc.stop(time + noteDuration);

            time += noteDuration;
        });

        const scaleElement = document.querySelector(`[data-scale="${scaleType}"]`);
        if (scaleElement) {
            scaleElement.classList.add('playing');
            setTimeout(() => {
                scaleElement.classList.remove('playing');
            }, intervals.length * noteDuration * 1000);
        }
    }

    async playChord(rootNote, octave, chordType) {
        if (!this.audioContext || !this.chords[chordType]) return;

        const rootIndex = this.notes.indexOf(rootNote);
        if (rootIndex === -1) return;

        const intervals = this.chords[chordType];

        const now = this.audioContext.currentTime;
        const duration = 1.5; 

        intervals.forEach(interval => {
            let noteIndex = (rootIndex + interval) % 12;
            let octaveAdjust = Math.floor((rootIndex + interval) / 12);
            let noteOctave = octave + octaveAdjust;

            let noteName = this.notes[noteIndex];
            let noteFreq = this.getNoteFrequency(noteName, noteOctave);

            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(noteFreq, now);

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.6 / intervals.length, now + 0.05);
            gain.gain.setValueAtTime(0.6 / intervals.length, now + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(now);
            osc.stop(now + duration);
        });

        const chordElement = document.querySelector(`[data-chord="${chordType}"]`);
        if (chordElement) {
            chordElement.classList.add('playing');
            setTimeout(() => {
                chordElement.classList.remove('playing');
            }, 1000);
        }
    }

    getNoteFrequency(note, octave) {
        const noteKey = `${note}${octave}`;
        return this.noteFrequencies[noteKey] || 440; 
    }

    generateNoteFrequencies() {
        const frequencies = {};
        const A4 = 440;

        for (let octave = 0; octave <= 8; octave++) {
            for (let i = 0; i < this.notes.length; i++) {
                const note = this.notes[i];

                const semitones = (octave - 4) * 12 + (i - this.notes.indexOf('A'));

                const frequency = A4 * Math.pow(2, semitones / 12);

                frequencies[`${note}${octave}`] = frequency;
            }
        }

        return frequencies;
    }

    generateScalesHTML(rootNote) {
        let html = '<div class="scale-container">';

        Object.keys(this.scales).forEach(scaleType => {
            const intervals = this.scales[scaleType];
            const scaleNotes = this.getScaleNotes(rootNote, intervals);

            html += `
                <div class="scale-item" data-scale="${scaleType}">
                    <div class="scale-name">${this.formatScaleName(scaleType)} Scale</div>
                    <div class="scale-notes">
                        ${scaleNotes.map(n => `<span class="note-badge">${n}</span>`).join('')}
                    </div>
                    <small class="text-muted d-block mt-1">Click to play</small>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    generateChordsHTML(rootNote) {
        let html = '<div class="chord-container">';

        Object.keys(this.chords).forEach(chordType => {
            const intervals = this.chords[chordType];
            const chordNotes = this.getScaleNotes(rootNote, intervals);

            html += `
                <div class="chord-item" data-chord="${chordType}">
                    <div class="chord-name">${rootNote} ${this.formatChordName(chordType)}</div>
                    <div class="chord-notes">
                        ${chordNotes.map(n => `<span class="note-badge">${n}</span>`).join('')}
                    </div>
                    <small class="text-muted d-block mt-1">Click to play</small>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    getScaleNotes(rootNote, intervals) {
        const rootIndex = this.notes.indexOf(rootNote);
        if (rootIndex === -1) return [];

        return intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            return this.notes[noteIndex];
        });
    }

    formatScaleName(scaleType) {
        switch (scaleType) {
            case 'major': return 'Major';
            case 'minor': return 'Minor';
            case 'pentatonic': return 'Pentatonic';
            case 'blues': return 'Blues';
            case 'chromatic': return 'Chromatic';
            default: return scaleType.charAt(0).toUpperCase() + scaleType.slice(1);
        }
    }

    formatChordName(chordType) {
        switch (chordType) {
            case 'major': return 'Major';
            case 'minor': return 'Minor';
            case 'dominant7': return '7th';
            case 'major7': return 'Maj7';
            case 'minor7': return 'Min7';
            case 'diminished': return 'Dim';
            case 'augmented': return 'Aug';
            default: return chordType.charAt(0).toUpperCase() + chordType.slice(1);
        }
    }

    getOctaveDescription(octave) {
        if (octave === 0) return '(Extremely low)';
        if (octave === 1) return '(Very low)';
        if (octave === 2) return '(Low)';
        if (octave === 3) return '(Low middle)';
        if (octave === 4) return '(Middle)';
        if (octave === 5) return '(High middle)';
        if (octave === 6) return '(High)';
        if (octave === 7) return '(Very high)';
        if (octave === 8) return '(Extremely high)';
        return '';
    }

    getMusicalContext(note, octave) {
        if (note === 'A' && octave === 4) return 'Standard tuning reference (A440)';
        if (note === 'C' && octave === 4) return 'Middle C on piano';

        const contextMap = {
            'C': 'Often used as the tonic (home note) in many compositions',
            'C#': 'Used in many jazz and modern compositions',
            'D': 'Common in rock, folk, and classical music',
            'D#': 'Less common as a key center, but used in jazz and classical',
            'E': 'Common in guitar-based music (lowest string in standard tuning)',
            'F': 'Fourth degree of C major scale, common in classical',
            'F#': 'Used extensively in jazz and modern music',
            'G': 'Popular key for folk and rock music',
            'G#': 'Less commonly used as a tonic, but frequent in jazz',
            'A': 'Reference pitch in orchestras (A440), common in many genres',
            'A#': 'Less common as a key center',
            'B': 'Leading tone in C major, important in many compositions'
        };

        return contextMap[note] || 'Used in various musical contexts';
    }

    getCommonUses(note, octave) {
        const noteOctave = `${note}${octave}`;

        const specialNotes = {
            'E2': 'Lowest string on standard guitar, common in bass lines',
            'A2': '5th string on guitar, 2nd string on bass guitar',
            'D3': '4th string on guitar, 3rd string on bass',
            'G3': '3rd string on guitar, highest string on bass',
            'B3': '2nd string on guitar',
            'E4': 'Highest string on guitar',
            'A4': 'Reference tuning note (440 Hz), violin string',
            'C4': 'Middle C on piano, central reference point',
            'G4': 'Highest string on ukulele',
            'E5': 'Highest string on violin'
        };

        if (specialNotes[noteOctave]) {
            return specialNotes[noteOctave];
        }

        if (octave <= 2) {
            return 'Common in bass lines and lower register instruments';
        } else if (octave === 3) {
            return 'Middle register, common in guitar, piano left hand, and vocals';
        } else if (octave === 4) {
            return 'Central register for many instruments and vocals';
        } else if (octave === 5) {
            return 'Higher register used in melodies and treble instruments';
        } else {
            return 'Very high register used by piccolo, flute, and soprano vocals';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const notesReference = new NotesReference();
    notesReference.init();
});
