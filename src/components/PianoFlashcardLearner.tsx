'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MidiNumbers } from 'react-piano';
import CustomKeyboard from './CustomKeyboard';
import 'react-piano/dist/styles.css';
import SheetMusicStaff from './SheetMusicStaff';
import NoteSetDisplay from './NoteSetDisplay';
import { PREDEFINED_NOTE_SETS } from '../utils/noteSets';
import { getKeySignatureAccidentals } from '../utils/noteUtils';



const PianoFlashcardLearner: React.FC = () => {
  
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [selectedNoteSetId, setSelectedNoteSetId] = useState<string>('c-major-scale'); // Added state for selected note set
  const [isDrillMode, setIsDrillMode] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [showScoreAndProgress, setShowScoreAndProgress] = useState<boolean>(false);
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);
  const [highlightKeyHint, setHighlightKeyHint] = useState<boolean>(false);
  const [labelNotesHint, setLabelNotesHint] = useState<boolean>(false);
  const [clefMode, setClefMode] = useState<'treble' | 'bass'>('treble');

  const availableNoteSets = useMemo(() => {
    return PREDEFINED_NOTE_SETS.filter(set => {
      if (clefMode === 'treble') {
        return set.clef === 'treble' || set.clef === 'both';
      } else {
        return set.clef === 'bass' || set.clef === 'both';
      }
    });
  }, [clefMode]);

  const noteRange = useMemo(() => ({
    first: MidiNumbers.fromNote('c3'),
    last: MidiNumbers.fromNote('f5'),
  }), []);

  

  const generateQuestion = useCallback(() => {
    setFeedback(null);
    const currentSet = availableNoteSets.find(set => set.id === selectedNoteSetId);

    if (!currentSet || currentSet.midiNumbers.length === 0) {
      console.warn('Selected note set not found or is empty. Falling back to "All Notes".');
      const allNotesSet = availableNoteSets.find(set => set.id === 'all-notes');
      if (allNotesSet) {
        const randomIndex = Math.floor(Math.random() * allNotesSet.midiNumbers.length);
        setCurrentNote(allNotesSet.midiNumbers[randomIndex]);
        setActiveNotes([allNotesSet.midiNumbers[randomIndex]]);
      } else {
        setCurrentNote(null);
        setActiveNotes([]);
      }
      return;
    }

    const randomIndex = Math.floor(Math.random() * currentSet.midiNumbers.length);
    setCurrentNote(currentSet.midiNumbers[randomIndex]);
    setActiveNotes(highlightKeyHint ? [currentSet.midiNumbers[randomIndex]] : []);
  }, [setCurrentNote, setActiveNotes, setFeedback, selectedNoteSetId, availableNoteSets, highlightKeyHint]);

  const startDrill = useCallback(() => {
    setIsDrillMode(true);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setShowScoreAndProgress(true);
    generateQuestion();
  }, [generateQuestion]);

  useEffect(() => {
    if (!isDrillMode) {
      generateQuestion();
    }
  }, [generateQuestion, selectedNoteSetId, isDrillMode]);

  useEffect(() => {
    // When clefMode changes, reset selectedNoteSetId to a valid default for the new clef
    if (availableNoteSets.length > 0 && !availableNoteSets.some(set => set.id === selectedNoteSetId)) {
      setSelectedNoteSetId(availableNoteSets[0].id);
    }
  }, [clefMode, availableNoteSets, selectedNoteSetId]);

  const onPlayNote = (midiNumber: number) => {
    if (currentNote === null) return;

    if (isDrillMode) {
      if (midiNumber === currentNote) {
        setFeedback('Correct!');
        setShowFeedback(true);
        setCorrectAnswers(prev => prev + 1);
      } else {
        setFeedback('Incorrect.');
        setShowFeedback(true);
      }
      setCurrentQuestionIndex(prev => prev + 1);

      if (currentQuestionIndex + 1 < 10) { // 10 questions per drill
        setTimeout(() => {
          generateQuestion();
        }, 1000);
      } else {
        // Drill finished
        setTimeout(() => {
          setFeedback(`Drill finished! You scored ${correctAnswers + (midiNumber === currentNote ? 1 : 0)} out of 10.`);
          setShowFeedback(true);
          setIsDrillMode(false);
          setCurrentNote(null);
          setActiveNotes([]);
        }, 1000);
      }
    } else {
      // Flashcard mode
      if (midiNumber === currentNote) {
        setFeedback('Correct!');
        setShowFeedback(true);
        setTimeout(() => {
          generateQuestion();
        }, 1000);
      } else {
        setFeedback('Try again!');
        setShowFeedback(true);
      }
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (feedback && showFeedback) {
      timer = setTimeout(() => {
        setFeedback(null);
        setShowFeedback(false);
      }, 1500); // Message visible for 1.5 seconds
    }
    return () => clearTimeout(timer);
  }, [feedback, showFeedback]);

  const onStopNote = () => {};

  const activeNoteSet = useMemo(() => {
    return availableNoteSets.find(set => set.id === selectedNoteSetId);
  }, [selectedNoteSetId, availableNoteSets]);

  const displayedNoteSet = useMemo(() => {
    return availableNoteSets.find(set => set.id === selectedNoteSetId);
  }, [selectedNoteSetId, availableNoteSets]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-8">Piano Flashcard Learner</h1>

      <div className="flex flex-row items-start w-full max-w-4xl mb-8"> {/* Container for FindThisNote and ControlPanel */}
        {currentNote !== null && (
          <div className="bg-gray-100 rounded-lg shadow-lg p-6 w-full max-w-sm mr-8"> {/* Find this note display */}
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Find this note</h2>
            <SheetMusicStaff 
              midiNumbers={[currentNote]} 
              noteHeadSize={30} 
              stemWidth={3} 
              stemLength={60} 
              ledgerLineLength={40} 
              clefColor="text-gray-800"
              sharpsAndFlats={getKeySignatureAccidentals(activeNoteSet ? activeNoteSet.name : '')}
              hideNoteLetter={isDrillMode}
              clefType={clefMode}
            />
          </div>
        )}
        <div className="flex flex-col items-start flex-grow"> {/* Control Panel */}
          {/* Clef Select */}
          <div className="flex flex-col items-start mb-4">
            <label htmlFor="clef-select" className="text-lg mr-2 text-gray-300">Select Clef:</label>
            <select
              id="clef-select"
              className="px-3 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={clefMode}
              onChange={(e) => setClefMode(e.target.value as 'treble' | 'bass')}
              disabled={isDrillMode}
            >
              <option value="treble">Treble Clef</option>
              <option value="bass">Bass Clef</option>
            </select>
          </div>

          {/* Drill Set Select */}
          <div className="flex flex-col items-start mb-4">
            <label htmlFor="drill-set-select" className="text-lg mr-2 text-gray-300">Select Drill Set:</label>
            <select
              id="drill-set-select"
              className="px-3 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedNoteSetId}
              onChange={(e) => setSelectedNoteSetId(e.target.value)}
              disabled={isDrillMode}
            >
              {availableNoteSets.map(set => (
                <option key={set.id} value={set.id}>{set.name}</option>
              ))}
            </select>
          </div>

          {/* Start Drill Button */}
          <button
            onClick={startDrill}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            disabled={isDrillMode}
          >
            Start Drill (10 Questions)
          </button>

          {/* Hint Toggles */}
          <div className="flex flex-col items-start mt-4">
			<h1> Hints</h1>
            <div className="flex flex-row-reverse items-start mb-2">
              <label htmlFor="highlight-key-toggle" className="text-lg mr-2 text-gray-300">Highlight Key</label>
              <label className="custom-switch">
                <input
                  type="checkbox"
                  id="highlight-key-toggle"
                  checked={highlightKeyHint}
                  onChange={() => setHighlightKeyHint(!highlightKeyHint)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="flex flex-row-reverse items-start">
              <label htmlFor="label-notes-toggle" className="text-lg mr-2 text-gray-300">Label Notes</label>
              <label className="custom-switch">
                <input
                  type="checkbox"
                  id="label-notes-toggle"
                  checked={labelNotesHint}
                  onChange={() => setLabelNotesHint(!labelNotesHint)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Right column for score and progress */}
        {showScoreAndProgress && (
          <div className="flex flex-col items-end ml-8 p-4 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Drill Progress</h2>
            <p className="text-xl text-white">Question: {currentQuestionIndex} / 10</p>
            <p className="text-xl text-white">Score: {correctAnswers} / {currentQuestionIndex}</p>
          </div>
        )}
      </div>

      {/* Piano */}
      <div className="w-full max-w-4xl mb-8 h-48">
        <CustomKeyboard
          noteRange={noteRange}
          onPlayNoteInput={onPlayNote}
          onStopNoteInput={onStopNote}
          activeNotes={(!isDrillMode && highlightKeyHint && currentNote !== null) ? [currentNote] : []}
          hoveredNote={highlightKeyHint ? currentNote : null}
          showNoteLabels={labelNotesHint}
          width={800}
          onMouseEnter={(midiNumber) => setHoveredNote(midiNumber)}
                    onMouseLeave={() => setHoveredNote(null)}
          highlightKeyHint={highlightKeyHint}
        />
      </div>

      {/* Note Set Display */}
      {displayedNoteSet && displayedNoteSet.id !== 'all-notes' && (
        <div className="w-full max-w-4xl mb-8">
          <NoteSetDisplay
            midiNumbers={displayedNoteSet.midiNumbers}
            name={displayedNoteSet.name}
            title={`Notes in ${displayedNoteSet.name}`}
          />
        </div>
      )}

      {feedback && showFeedback && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 text-4xl font-bold transition-opacity duration-500 ease-in-out ${feedback === 'Correct!' ? 'text-green-500' : 'text-red-500'} opacity-100 bg-gray-800 p-4 rounded-lg shadow-lg z-50`}>
          {feedback}
        </div>
      )}

      
    </div>
  );
};

export default PianoFlashcardLearner;
