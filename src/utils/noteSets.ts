// src/utils/noteSets.ts

import { MidiNumbers } from 'react-piano';

export interface NoteSet {
  id: string;
  name: string;
  midiNumbers: number[];
}

// Helper to generate a range of MIDI numbers
const generateMidiRange = (startNote: string, endNote: string): number[] => {
  const startMidi = MidiNumbers.fromNote(startNote);
  const endMidi = MidiNumbers.fromNote(endNote);
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
  },
  {
    id: 'c-major-scale',
    name: 'C Major Scale',
    midiNumbers: getMajorScaleNotes(MidiNumbers.fromNote('c4')), // C4 to C5
  },
  {
    id: 'g-major-scale',
    name: 'G Major Scale',
    midiNumbers: getMajorScaleNotes(MidiNumbers.fromNote('g4')), // G4 to G5
  },
  {
    id: 'd-major-scale',
    name: 'D Major Scale',
    midiNumbers: getMajorScaleNotes(MidiNumbers.fromNote('d4')), // D4 to D5
  },
  {
    id: 'a-major-scale',
    name: 'A Major Scale',
    midiNumbers: getMajorScaleNotes(MidiNumbers.fromNote('a4')), // A4 to A5
  },
  {
    id: 'e-major-scale',
    name: 'E Major Scale',
    midiNumbers: getMajorScaleNotes(MidiNumbers.fromNote('e4')), // E4 to E5
  },
  {
    id: 'f-major-scale',
    name: 'F Major Scale',
    midiNumbers: getMajorScaleNotes(MidiNumbers.fromNote('f4')), // F4 to F5
  },
  {
    id: 'bb-major-scale',
    name: 'Bb Major Scale',
    midiNumbers: getMajorScaleNotes(MidiNumbers.fromNote('bb3')), // Bb3 to Bb4
  },
  {
    id: 'eb-major-scale',
    name: 'Eb Major Scale',
    midiNumbers: getMajorScaleNotes(MidiNumbers.fromNote('eb4')), // Eb4 to Eb5
  },
  {
    id: 'middle-c-to-g',
    name: 'Middle C to G (C4-G4)',
    midiNumbers: generateMidiRange('c4', 'g4'),
  },
  {
    id: 'treble-clef-lines',
    name: 'Treble Clef Lines (EGBDF)',
    midiNumbers: [
      MidiNumbers.fromNote('e4'),
      MidiNumbers.fromNote('g4'),
      MidiNumbers.fromNote('b4'),
      MidiNumbers.fromNote('d5'),
      MidiNumbers.fromNote('f5'),
    ],
  },
  {
    id: 'treble-clef-spaces',
    name: 'Treble Clef Spaces (FACE)',
    midiNumbers: [
      MidiNumbers.fromNote('f4'),
      MidiNumbers.fromNote('a4'),
      MidiNumbers.fromNote('c5'),
      MidiNumbers.fromNote('e5'),
    ],
  },
  {
    id: 'bass-clef-lines',
    name: 'Bass Clef Lines (GBDFA)',
    midiNumbers: [
      MidiNumbers.fromNote('g2'),
      MidiNumbers.fromNote('b2'),
      MidiNumbers.fromNote('d3'),
      MidiNumbers.fromNote('f3'),
      MidiNumbers.fromNote('a3'),
    ],
  },
  {
    id: 'bass-clef-spaces',
    name: 'Bass Clef Spaces (ACEG)',
    midiNumbers: [
      MidiNumbers.fromNote('a2'),
      MidiNumbers.fromNote('c3'),
      MidiNumbers.fromNote('e3'),
      MidiNumbers.fromNote('g3'),
    ],
  },
];
