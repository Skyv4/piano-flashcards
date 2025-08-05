'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Keyboard, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import SheetMusicStaff from './SheetMusicStaff';
import NoteSetDisplay from './NoteSetDisplay';
import { PREDEFINED_NOTE_SETS, NoteSet } from '../utils/noteSets';
import { getKeySignatureAccidentals } from '../utils/noteUtils';

const PianoFlashcardLearner: React.FC = () => {
  
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [selectedNoteSetId, setSelectedNoteSetId] = useState<string>('c-major-scale'); // Added state for selected note set
  
     // Default to 'All Notes'
  const [availableNoteSets] = useState<NoteSet[]>(PREDEFINED_NOTE_SETS);

  const noteRange = useMemo(() => ({
    first: MidiNumbers.fromNote('c3'),
    last: MidiNumbers.fromNote('f5'),
  }), []);

  

  const generateQuestion = useCallback(() => {
    setFeedback(null);
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

    
  }, [setCurrentNote, setActiveNotes, setFeedback, selectedNoteSetId, availableNoteSets]);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion, selectedNoteSetId]); // Added selectedNoteSetId

  

  const onPlayNote = (midiNumber: number) => {
    if (currentNote === null) return;

      if (midiNumber === currentNote) {
        setFeedback('Correct!');
        setTimeout(() => {
          generateQuestion();
        }, 1000);
      } else {
        setFeedback('Try again!');
      }
    }

  const onStopNote = () => {};

  const activeNoteSet = useMemo(() => {
    return availableNoteSets.find(set => set.id === selectedNoteSetId);
  }, [selectedNoteSetId, availableNoteSets]);

  const displayedNoteSet = useMemo(() => {
    return availableNoteSets.find(set => set.id === selectedNoteSetId);
  }, [selectedNoteSetId, availableNoteSets]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-8">Piano Flashcard Learner</h1>

      <div className="flex flex-row items-start mb-8"> {/* New parent div for flex column */}
        {/* New Drill Mode Selection */}
        <div className="flex flex-row items-center mb-4"> {/* Added flex-row and mb-4 for spacing */}
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
            name={displayedNoteSet.name}
            title={`Notes in ${displayedNoteSet.name}`}
            
          />
        )}
      </div>

      {currentNote !== null && (
        <div className="bg-gray-100 rounded-lg shadow-lg p-6 mb-8 w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Find this note</h2>
          <SheetMusicStaff 
            midiNumbers={[currentNote]} 
            noteHeadSize={30} 
            stemWidth={3} 
            stemLength={60} 
            ledgerLineLength={40} 
            clefColor="text-gray-800"
            sharpsAndFlats={getKeySignatureAccidentals(activeNoteSet ? activeNoteSet.name : '')}
          />
        </div>
      )}

      

      {feedback && (
        <div className={`mb-8 text-xl ${feedback === 'Correct!' ? 'text-green-500' : 'text-red-500'}`}>
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
