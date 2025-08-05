// src/utils/noteUtils.ts

export const getNoteName = (midiNumber: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  return `${noteNames[noteIndex]}${octave}`;
};

export const getMajorScaleNotes = (rootMidiNumber: number): number[] => {
  const intervals = [0, 2, 4, 5, 7, 9, 11, 12]; // Major scale intervals in semitones
  return intervals.map(interval => rootMidiNumber + interval);
};

// This is a simplified function for demonstration. A full implementation would cover all keys.
export const getKeySignatureAccidentals = (scaleName: string): { symbol: string; midiNumber: number }[] => {
  switch (scaleName) {
    case 'G Major Scale':
      return [{ symbol: '♯', midiNumber: 77 }]; // F#5 on F5 line
    case 'D Major Scale':
      return [
        { symbol: '♯', midiNumber: 77 }, // F#5
        { symbol: '♯', midiNumber: 72 }, // C#5
      ];
    case 'F Major Scale':
      return [{ symbol: '♭', midiNumber: 71 }]; // Bb4 on B4 line
    case 'Bb Major Scale':
      return [
        { symbol: '♭', midiNumber: 71 }, // Bb4
        { symbol: '♭', midiNumber: 64 }, // Eb4
      ];
    case 'E-flat Major':
    case 'Eb Major Scale':
      return [
        { symbol: '♭', midiNumber: 71 }, // Bb4 on B4 line
        { symbol: '♭', midiNumber: 64 }, // Eb4 on E4 space
        { symbol: '♭', midiNumber: 69 }, // Ab4 on A4 space
      ];
    default:
      return [];
  }
};