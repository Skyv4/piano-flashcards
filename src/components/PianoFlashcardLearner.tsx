'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Keyboard, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import SheetMusicDisplay from './SheetMusicDisplay';
import { PREDEFINED_NOTE_SETS, NoteSet } from '../utils/noteSets';
import NoteSetDisplay from './NoteSetDisplay';
import { getNoteName, getMajorScaleNotes } from '../utils/noteUtils';

const PianoFlashcardLearner: React.FC = () => {
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [mode, setMode] = useState<'note' | 'scale'>('note');
  const [selectedNoteSetId, setSelectedNoteSetId] = useState<string>('all-notes'); // Default to 'All Notes'
  const [availableNoteSets, setAvailableNoteSets] = useState<NoteSet[]>(PREDEFINED_NOTE_SETS);

  const noteRange = useMemo(() => ({
    first: MidiNumbers.fromNote('c3'),
    last: MidiNumbers.fromNote('f5'),
  }), []);

  

  const generateQuestion = useCallback(() => {
    setFeedback(null);
    if (mode === 'note') {
      const currentSet = availableNoteSets.find(set => set.id === selectedNoteSetId);

      if (!currentSet || currentSet.midiNumbers.length === 0) {
        // Fallback: If selected set is not found or empty, use 'all-notes'
        console.warn('Selected note set not found or is empty. Falling back to "All Notes".');
        const allNotesSet = availableNoteSets.find(set => set.id === 'all-notes');
        if (allNotesSet) {
          const randomIndex = Math.floor(Math.random() * allNotesSet.midiNumbers.length);
          setCurrentNote(allNotesSet.midiNumbers[randomIndex]);
          setActiveNotes([allNotesSet.midiNumbers[randomIndex]]);
        } else {
          // Should not happen if 'all-notes' is always present
          setCurrentNote(null);
          setActiveNotes([]);
        }
        return;
      }

      const randomIndex = Math.floor(Math.random() * currentSet.midiNumbers.length);
      setCurrentNote(currentSet.midiNumbers[randomIndex]);
      setActiveNotes([currentSet.midiNumbers[randomIndex]]);

    } else if (mode === 'scale') {
      // Existing scale generation logic remains unchanged for this iteration.
      // It will continue to generate random major scales within its defined range.
      const rootNotes = [];
      for (let i = MidiNumbers.fromNote('c3'); i <= MidiNumbers.fromNote('b4'); i++) {
        rootNotes.push(i);
      }
      const randomRootIndex = Math.floor(Math.random() * rootNotes.length);
      const randomRootNote = rootNotes[randomRootIndex];
      const scaleNotes = getMajorScaleNotes(randomRootNote); // This getMajorScaleNotes is from the component, not the new util
      setCurrentNote(randomRootNote);
      setActiveNotes(scaleNotes);
    }
  }, [mode, noteRange, setCurrentNote, setActiveNotes, setFeedback, selectedNoteSetId, availableNoteSets]);

  useEffect(() => {
    generateQuestion();
  }, [mode, generateQuestion, selectedNoteSetId]); // Added selectedNoteSetId

  const [playedNotesInScale, setPlayedNotesInScale] = useState<number[]>([]);

  const onPlayNote = (midiNumber: number) => {
    if (mode === 'note') {
      if (currentNote === null) return;

      if (midiNumber === currentNote) {
        setFeedback('Correct!');
        setTimeout(() => {
          generateQuestion();
        }, 1000);
      } else {
        setFeedback('Try again!');
      }
    } else if (mode === 'scale') {
      const newPlayedNotes = [...playedNotesInScale, midiNumber];
      setPlayedNotesInScale(newPlayedNotes);

      // Check if all notes of the scale have been played and no extra notes
      const sortedActiveNotes = [...activeNotes].sort((a, b) => a - b);
      const sortedPlayedNotes = [...newPlayedNotes].sort((a, b) => a - b);

      const isCorrect = sortedActiveNotes.length === sortedPlayedNotes.length &&
                        sortedActiveNotes.every((note, index) => note === sortedPlayedNotes[index]);

      if (isCorrect) {
        setFeedback('Correct Scale!');
        setTimeout(() => {
          setPlayedNotesInScale([]);
          generateQuestion();
        }, 1000);
      } else if (sortedPlayedNotes.length > sortedActiveNotes.length) {
        setFeedback('Too many notes! Try again.');
      } else {
        setFeedback('Keep playing the scale...');
      }
    }
  };

  const resetScaleAttempt = () => {
    setPlayedNotesInScale([]);
    setFeedback(null);
  };

  const onStopNote = () => {};

  const displayedNoteSet = useMemo(() => {
    return availableNoteSets.find(set => set.id === selectedNoteSetId);
  }, [selectedNoteSetId, availableNoteSets]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-8">Piano Flashcard Learner</h1>

      <div className="mb-4">
        <button
          className={`px-4 py-2 rounded-md ${mode === 'note' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('note')}
        >
          Note Identification
        </button>
        <button
          className={`ml-4 px-4 py-2 rounded-md ${mode === 'scale' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('scale')}
        >
          Major Scale Identification
        </button>
      </div>

      {/* New Drill Mode Selection */}
      <div className="mb-8">
        <label htmlFor="drill-set-select" className="text-lg mr-2 text-gray-300">Select Drill Set:</label>
        <select
          id="drill-set-select"
          className="px-3 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedNoteSetId}
          onChange={(e) => setSelectedNoteSetId(e.target.value)}
        >
          {availableNoteSets.map(set => (
            <option key={set.id} value={set.id}>{set.name}</option>
          ))}
        </select>
      </div>

      {/* Display selected note set notes - "Everglade of possibilities" */}
      {displayedNoteSet && displayedNoteSet.id !== 'all-notes' && (
        <NoteSetDisplay
          midiNumbers={displayedNoteSet.midiNumbers}
          title={`Notes in ${displayedNoteSet.name}`}
          
        />
      )}

      {mode === 'note' && currentNote !== null && (
        <div className="mb-8">
          <SheetMusicDisplay 
            midiNumber={currentNote} 
            noteColor="bg-white" 
            noteHeadSize={30} 
            stemWidth={3} 
            stemLength={60} 
            ledgerLineLength={40} 
          />
        </div>
      )}

      {mode === 'scale' && currentNote !== null && (
        <div className="mb-8 text-2xl">
          Play the <span className="font-semibold">{getNoteName(currentNote)} Major Scale</span>
          <button
            className="ml-4 px-3 py-1 rounded-md bg-gray-300 text-gray-800 text-base"
            onClick={resetScaleAttempt}
          >
            Reset
          </button>
        </div>
      )}

      {feedback && (
        <div className={`mb-8 text-xl ${feedback === 'Correct!' || feedback === 'Correct Scale!' ? 'text-green-500' : 'text-red-500'}`}>
          {feedback}
        </div>
      )}

      <div className="w-full max-w-4xl">
        <Keyboard
          noteRange={noteRange}
          onPlayNoteInput={onPlayNote}
          onStopNoteInput={onStopNote}
          width={800}
          keyWidthToHeight={0.3}
          keyboardShortcuts={KeyboardShortcuts.create({
            firstNote: noteRange.first,
            lastNote: noteRange.last,
            keyboardConfig: KeyboardShortcuts.HOME_ROW,
          })}
          activeNotes={activeNotes}
        />
      </div>
    </div>
  );
};

export default PianoFlashcardLearner;
