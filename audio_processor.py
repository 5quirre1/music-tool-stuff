import numpy as np
import pyaudio
import scipy.signal
from scipy.fftpack import fft

class AudioProcessor:
    NOTE_FREQUENCIES = {
        'C': 261.63,
        'C#/Db': 277.18,
        'D': 293.66,
        'D#/Eb': 311.13,
        'E': 329.63,
        'F': 349.23,
        'F#/Gb': 369.99,
        'G': 392.00,
        'G#/Ab': 415.30,
        'A': 440.00,
        'A#/Bb': 466.16,
        'B': 493.88
    }
    
    def __init__(self):
        self.CHUNK = 1024 * 4
        self.RATE = 44100
        self.p = pyaudio.PyAudio()
        self.stream = None
    
    def start_stream(self):
        if self.stream is None:
            self.stream = self.p.open(
                format=pyaudio.paFloat32,
                channels=1,
                rate=self.RATE,
                input=True,
                frames_per_buffer=self.CHUNK
            )
        return self.stream
    
    def stop_stream(self):
        if self.stream is not None:
            self.stream.stop_stream()
            self.stream.close()
            self.stream = None
    
    def detect_pitch(self):
        if self.stream is None:
            self.start_stream()
            
        data = self.stream.read(self.CHUNK, exception_on_overflow=False)
        audio_data = np.frombuffer(data, dtype=np.float32)
        
        window = np.hanning(len(audio_data))
        audio_data = audio_data * window

        fft_data = fft(audio_data)
        fft_data = np.abs(fft_data[:len(fft_data)//2])

        freq_resolution = self.RATE / self.CHUNK
        frequencies = np.arange(len(fft_data)) * freq_resolution
        start_idx = 5
        peak_idx = np.argmax(fft_data[start_idx:]) + start_idx
        pitch = frequencies[peak_idx]
        

        if 80 <= pitch <= 1000 and fft_data[peak_idx] > 1.0:
            note, cents = self.get_closest_note(pitch)
            return {
                'frequency': round(pitch, 2),
                'note': note,
                'cents': cents,
                'in_tune': abs(cents) < 10
            }
        else:
            return None
    
    def get_closest_note(self, frequency):
        midi_note = 69 + 12 * np.log2(frequency / 440.0)
        closest_midi = round(midi_note)
        
        cents = 100 * (midi_note - closest_midi)
        
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        octave = (closest_midi // 12) - 1
        note_name = note_names[closest_midi % 12] + str(octave)
        
        return note_name, cents
    
    def cleanup(self):
        self.stop_stream()
        self.p.terminate()
