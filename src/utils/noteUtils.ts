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