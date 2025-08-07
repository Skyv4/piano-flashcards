import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SheetMusicStaff from './SheetMusicStaff';
import { getKeySignatureAccidentals } from '../utils/noteUtils';
import { NoteSet, PREDEFINED_NOTE_SETS } from '../utils/noteSets';
import { Drill, DrillResult } from '../types/drillTypes';
import { DrillService } from '../utils/drillService';
import { UserProfileService } from '../utils/userService';

interface DrillModeProps {
  currentNote: number | null;
  setCurrentNote: (note: number | null) => void;
  setActiveNotes: (notes: number[]) => void;
  setFeedback: (feedback: string | null) => void;
  setShowFeedback: (show: boolean) => void;
  highlightKeyHint: boolean;
  isDrillMode: boolean;
  setIsDrillMode: (isDrill: boolean) => void;
  clefMode: 'treble' | 'bass';
  availableNoteSets: NoteSet[];
  selectedNoteSetId: string;
  setSelectedNoteSetId: (id: string) => void;
  drillModeHandleAnswerRef: React.MutableRefObject<((midiNumber: number) => void) | null>;
}

const DrillMode: React.FC<DrillModeProps> = ({
  currentNote,
  setCurrentNote,
  setActiveNotes,
  setFeedback,
  setShowFeedback,
  highlightKeyHint,
  isDrillMode,
  setIsDrillMode,
  clefMode,
  availableNoteSets,
  selectedNoteSetId,
  setSelectedNoteSetId,
  drillModeHandleAnswerRef,
}) => {
  const [currentDrill, setCurrentDrill] = useState<Drill | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [showScoreAndProgress, setShowScoreAndProgress] = useState<boolean>(false);

  useEffect(() => {
    const storedState = DrillService.loadCurrentDrillState();
    if (storedState.currentDrill) {
      setCurrentDrill(storedState.currentDrill);
      setCurrentQuestionIndex(storedState.currentQuestionIndex);
      setCorrectAnswers(storedState.correctAnswers);
      setIsDrillMode(true);
      setShowScoreAndProgress(true);
      setCurrentNote(storedState.currentDrill.questions[storedState.currentQuestionIndex]);
      setActiveNotes(highlightKeyHint ? [storedState.currentDrill.questions[storedState.currentQuestionIndex]] : []);
    }
  }, [setCurrentNote, setActiveNotes, highlightKeyHint, setIsDrillMode]);

  const generateQuestion = useCallback(() => {
    if (!currentDrill) return;

    const nextNote = currentDrill.questions[currentQuestionIndex];
    setCurrentNote(nextNote);
    setActiveNotes(highlightKeyHint ? [nextNote] : []);
  }, [currentDrill, currentQuestionIndex, setCurrentNote, setActiveNotes, highlightKeyHint, setFeedback]);

  const startDrill = useCallback(() => {
    const selectedSet = availableNoteSets.find(set => set.id === selectedNoteSetId);
    if (!selectedSet) return;

    const newDrill = DrillService.generateDrill(selectedSet, clefMode, 'custom', 10);
    const initialState = DrillService.startDrill(newDrill);
    setCurrentDrill(initialState.currentDrill);
    setCurrentQuestionIndex(initialState.currentQuestionIndex);
    setCorrectAnswers(initialState.correctAnswers);
    setIsDrillMode(true);
    setShowScoreAndProgress(true);
    generateQuestion();
  }, [availableNoteSets, selectedNoteSetId, clefMode, setIsDrillMode, generateQuestion]);

  const handleAnswer = useCallback((midiNumber: number) => {
    if (currentNote === null || !currentDrill) return;

    const isCorrect = midiNumber === currentNote;
    const newState = DrillService.submitAnswer(isCorrect);

    setCorrectAnswers(newState.correctAnswers);
    setCurrentQuestionIndex(newState.currentQuestionIndex);

    if (isCorrect) {
      setFeedback('Correct!');
      setShowFeedback(true);
    } else {
      setFeedback('Incorrect.');
      setShowFeedback(true);
    }

    if (newState.currentQuestionIndex < currentDrill.totalQuestions) {
      setTimeout(() => {
        setCurrentQuestionIndex(newState.currentQuestionIndex);
      }, 1000); // Delay before moving to next question
    } else {
      // Drill finished
      const result = DrillService.endDrill();
      if (result) {
        UserProfileService.updateProfileWithDrillResult(result);
        setFeedback(`Drill finished! You scored ${result.score} out of ${result.totalQuestions}.`);
        setShowFeedback(true);
      }
      // Delay state resets to allow feedback to display
      setTimeout(() => {
        setIsDrillMode(false);
        setCurrentNote(null);
        setActiveNotes([]);
        setCurrentDrill(null);
        setShowScoreAndProgress(false);
      }, 1500); // Match feedback display duration
    }
  }, [currentNote, currentDrill, generateQuestion, setFeedback, setShowFeedback, setIsDrillMode, setCurrentNote, setActiveNotes]);

  const cancelDrill = useCallback(() => {
    DrillService.endDrill(); // Clear drill state from local storage
    setIsDrillMode(false);
    setCurrentNote(null);
    setActiveNotes([]);
    setCurrentDrill(null);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setShowScoreAndProgress(false);
    setFeedback('Drill cancelled.');
    setShowFeedback(true);
  }, [setIsDrillMode, setCurrentNote, setActiveNotes, setFeedback, setShowFeedback]);

  // Assign handleAnswer to the ref so parent can call it
  useEffect(() => {
    drillModeHandleAnswerRef.current = handleAnswer;
  }, [handleAnswer, drillModeHandleAnswerRef]);

  useEffect(() => {
    if (isDrillMode && currentDrill && currentQuestionIndex < currentDrill.totalQuestions) {
      generateQuestion();
    }
  }, [isDrillMode, currentDrill, currentQuestionIndex, generateQuestion]);

  const activeNoteSet = useMemo(() => {
    return availableNoteSets.find(set => set.id === selectedNoteSetId);
  }, [selectedNoteSetId, availableNoteSets]);

  return (
    <div className="flex flex-col items-start flex-grow bg-gray-800 p-6 rounded-lg shadow-lg"> {/* Control Panel */}
      <div className="bg-gray-700 p-4 rounded-lg shadow-md mb-4 w-full flex flex-row space-x-4">
        {/* Clef Select */}
        <div className="flex-1">
          <label htmlFor="clef-select" className="text-lg font-bold mb-2 block text-white">Select Clef:</label>
          <select
            id="clef-select"
            className="px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors duration-200 w-full text-base"
            value={clefMode}
            onChange={(e) => { /* Clef change handled in parent */ }}
            disabled={isDrillMode}
          >
            <option value="treble" className="font-medium">Treble Clef</option>
            <option value="bass" className="font-medium">Bass Clef</option>
          </select>
        </div>

        {/* Drill Set Select */}
        <div className="flex-1">
          <label htmlFor="drill-set-select" className="text-lg font-bold mb-2 block text-white">Select Drill Set:</label>
          <select
            id="drill-set-select"
            className="px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors duration-200 w-full text-base"
            value={selectedNoteSetId}
            onChange={(e) => setSelectedNoteSetId(e.target.value)}
            disabled={isDrillMode}
          >
            {availableNoteSets.map(set => (
              <option key={set.id} value={set.id} className="font-medium">{set.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Start/Cancel Drill Button */}
      <div className="bg-gray-700 p-2 rounded-md shadow-md mb-2 w-full flex items-center justify-between">
        <button
          onClick={startDrill}
          className={`px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow text-white ${isDrillMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          disabled={isDrillMode}
        >
          {isDrillMode ? 'Drill Activated' : 'Start Drill (10 Questions)'}
        </button>
        {isDrillMode && (
          <button
            onClick={cancelDrill}
            className="ml-2 px-3 py-1 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            X
          </button>
        )}
      </div>

      {/* Right column for score and progress */}
      {showScoreAndProgress && currentDrill && (
        <div className="flex flex-col items-end ml-8 p-4 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-white mb-4">Drill Progress</h2>
          <p className="text-xl text-white">Question: {currentQuestionIndex} / {currentDrill.totalQuestions}</p>
          <p className="text-xl text-white">Score: {correctAnswers} / {currentQuestionIndex}</p>
        </div>
      )}
    </div>
  );
};

export default DrillMode;
