// src/utils/noteColors.ts

// Define a mapping of note names (without octave) to Tailwind CSS color classes.
// This allows consistent coloring across different octaves of the same note.
export const NOTE_COLORS: { [key: string]: string } = {
  'C': 'bg-red-500',
  'C#': 'bg-red-700',
  'D': 'bg-orange-500',
  'D#': 'bg-orange-700',
  'E': 'bg-yellow-500',
  'F': 'bg-green-500',
  'F#': 'bg-green-700',
  'G': 'bg-blue-500',
  'G#': 'bg-blue-700',
  'A': 'bg-indigo-500',
  'A#': 'bg-indigo-700',
  'B': 'bg-purple-500',
};

// Helper function to get the base note name (e.g., 'C', 'C#') from a MIDI number
export const getBaseNoteName = (midiNumber: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return noteNames[midiNumber % 12];
};
