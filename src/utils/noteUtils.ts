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
  if (scaleName === 'E-flat Major') {
    // E-flat Major has 3 flats: B♭, E♭, A♭
    // Using MIDI numbers for a common octave (e.g., around C4/Middle C)
    return [
      { symbol: '♭', midiNumber: 70 }, // B♭4
      { symbol: '♭', midiNumber: 63 }, // E♭4
      { symbol: '♭', midiNumber: 68 }, // A♭4
    ];
  }
  return [];
};