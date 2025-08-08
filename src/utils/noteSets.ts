// src/utils/noteSets.ts

import { noteToMidi } from './noteUtils';

export interface NoteSet {
  id: string;
  name: string;
  midiNumbers: number[];
  clef: 'treble' | 'bass' | 'both';
}


// Helper to generate a range of MIDI numbers
const generateMidiRange = (startNote: string, endNote: string): number[] => {
  const startMidi = noteToMidi(startNote);
  const endMidi = noteToMidi(endNote);
  const range: number[] = [];
  for (let i = startMidi; i <= endMidi; i++) {
    range.push(i);
  }
  return range;
};

// Helper to generate major scale MIDI numbers from a root
const getMajorScaleNotes = (rootMidiNumber: number): number[] => {
  const scaleIntervals = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
  const scale: number[] = [];
  for (let i = 0; i < 8; i++) { // 8 notes in a scale (including octave)
    scale.push(rootMidiNumber + scaleIntervals[i % scaleIntervals.length] + (Math.floor(i / scaleIntervals.length) * 12));
  }
  return scale;
};

export const PREDEFINED_NOTE_SETS: NoteSet[] = [
  {
    id: 'all-notes',
    name: 'All Notes (C3-F5)',
    midiNumbers: generateMidiRange('c3', 'f5'),
    clef: 'both',
  },
  {
    id: 'c-major-scale',
    name: 'C Major Scale',
    midiNumbers: getMajorScaleNotes(noteToMidi('c4')), // C4 to C5
    clef: 'treble',
  },
  {
    id: 'lines-and-spaces',
    name: 'Lines and Spaces (GBDFA & ACEG)',
    midiNumbers: [
      noteToMidi('g2'), // Bass Clef Lines
      noteToMidi('b2'),
      noteToMidi('d3'),
      noteToMidi('f3'),
      noteToMidi('a3'),
      noteToMidi('a2'), // Bass Clef Spaces
      noteToMidi('c3'),
      noteToMidi('e3'),
      noteToMidi('g3'),
    ],
    clef: 'both',
  },
  {
    id: 'g-major-scale',
    name: 'G Major Scale',
    midiNumbers: getMajorScaleNotes(noteToMidi('g4')), // G4 to G5
    clef: 'treble',
  },
  {
    id: 'd-major-scale',
    name: 'D Major Scale',
    midiNumbers: getMajorScaleNotes(noteToMidi('d4')), // D4 to D5
    clef: 'treble',
  },
  {
    id: 'a-major-scale',
    name: 'A Major Scale',
    midiNumbers: getMajorScaleNotes(noteToMidi('a4')), // A4 to A5
    clef: 'treble',
  },
  {
    id: 'e-major-scale',
    name: 'E Major Scale',
    midiNumbers: getMajorScaleNotes(noteToMidi('e4')), // E4 to E5
    clef: 'treble',
  },
  {
    id: 'f-major-scale',
    name: 'F Major Scale',
    midiNumbers: getMajorScaleNotes(noteToMidi('f4')), // F4 to F5
    clef: 'treble',
  },
  {
    id: 'bb-major-scale',
    name: 'Bb Major Scale',
    midiNumbers: getMajorScaleNotes(noteToMidi('bb3')), // Bb3 to Bb4
    clef: 'treble',
  },
  {
    id: 'eb-major-scale',
    name: 'Eb Major Scale',
    midiNumbers: getMajorScaleNotes(noteToMidi('eb4')), // Eb4 to Eb5
    clef: 'treble',
  },
  {
    id: 'e-flat-major-scale',
    name: 'E-flat Major',
    midiNumbers: getMajorScaleNotes(noteToMidi('eb4')),
    clef: 'treble',
  },
  {
    id: 'chromatic-scale',
    name: 'Chromatic Scale (C4-C5)',
    midiNumbers: generateMidiRange('c4', 'c5'),
    clef: 'treble',
  },
  {
    id: 'middle-c-to-g',
    name: 'Middle C to G (C4-G4)',
    midiNumbers: generateMidiRange('c4', 'g4'),
    clef: 'treble',
  },
  {
    id: 'treble-clef-lines',
    name: 'Treble Clef Lines (EGBDF)',
    midiNumbers: [
      noteToMidi('e4'),
      noteToMidi('g4'),
      noteToMidi('b4'),
      noteToMidi('d5'),
      noteToMidi('f5'),
    ],
    clef: 'treble',
  },
  {
    id: 'treble-clef-spaces',
    name: 'Treble Clef Spaces (FACE)',
    midiNumbers: [
      noteToMidi('f4'),
      noteToMidi('a4'),
      noteToMidi('c5'),
      noteToMidi('e5'),
    ],
    clef: 'treble',
  },
  {
    id: 'bass-clef-lines',
    name: 'Bass Clef Lines (GBDFA)',
    midiNumbers: [
      noteToMidi('g2'),
      noteToMidi('b2'),
      noteToMidi('d3'),
      noteToMidi('f3'),
      noteToMidi('a3'),
    ],
    clef: 'bass',
  },
  {
    id: 'bass-clef-spaces',
    name: 'Bass Clef Spaces (ACEG)',
    midiNumbers: [
      noteToMidi('a2'),
      noteToMidi('c3'),
      noteToMidi('e3'),
      noteToMidi('g3'),
    ],
    clef: 'bass',
  },
  {
    id: 'c-major-scale-bass',
    name: 'C Major Scale (Bass Clef)',
    midiNumbers: getMajorScaleNotes(noteToMidi('c3')), // C3 to C4
    clef: 'bass',
  },
  {
    id: 'g-major-scale-bass',
    name: 'G Major Scale (Bass Clef)',
    midiNumbers: getMajorScaleNotes(noteToMidi('g2')), // G2 to G3
    clef: 'bass',
  },
  {
    id: 'f-major-scale-bass',
    name: 'F Major Scale (Bass Clef)',
    midiNumbers: getMajorScaleNotes(noteToMidi('f2')), // F2 to F3
    clef: 'bass',
  },
  ];