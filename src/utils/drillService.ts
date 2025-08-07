import { Drill, DrillResult } from '../types/drillTypes';
import { NoteSet } from '../utils/noteSets';

const DRILL_STORAGE_KEY = 'pianoDrills';

interface DrillState {
  currentDrill: Drill | null;
  currentQuestionIndex: number;
  correctAnswers: number;
}

const loadDrillState = (): DrillState => {
  if (typeof window === 'undefined') return { currentDrill: null, currentQuestionIndex: 0, correctAnswers: 0 };
  const storedState = localStorage.getItem(DRILL_STORAGE_KEY);
  return storedState ? JSON.parse(storedState) : { currentDrill: null, currentQuestionIndex: 0, correctAnswers: 0 };
};

const saveDrillState = (state: DrillState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DRILL_STORAGE_KEY, JSON.stringify(state));
  }
};

export const DrillService = {
  generateDrill: (noteSet: NoteSet, clef: 'treble' | 'bass' | 'both', type: 'custom' | 'daily', numQuestions: number = 10): Drill => {
    const questions: number[] = [];
    for (let i = 0; i < numQuestions; i++) {
      const randomIndex = Math.floor(Math.random() * noteSet.midiNumbers.length);
      questions.push(noteSet.midiNumbers[randomIndex]);
    }

    const newDrill: Drill = {
      id: `drill-${Date.now()}`,
      name: `${noteSet.name} Drill`,
      noteSetId: noteSet.id,
      clef,
      questions,
      totalQuestions: numQuestions,
      type,
    };
    return newDrill;
  },

  startDrill: (drill: Drill) => {
    const initialState: DrillState = {
      currentDrill: drill,
      currentQuestionIndex: 0,
      correctAnswers: 0,
    };
    saveDrillState(initialState);
    return initialState;
  },

  loadCurrentDrillState: (): DrillState => {
    return loadDrillState();
  },

  submitAnswer: (isCorrect: boolean): DrillState => {
    const currentState = loadDrillState();
    if (!currentState.currentDrill) return currentState;

    const newCorrectAnswers = currentState.correctAnswers + (isCorrect ? 1 : 0);
    const newQuestionIndex = currentState.currentQuestionIndex + 1;

    const newState: DrillState = {
      ...currentState,
      correctAnswers: newCorrectAnswers,
      currentQuestionIndex: newQuestionIndex,
    };
    saveDrillState(newState);
    return newState;
  },

  endDrill: (): DrillResult | null => {
    const currentState = loadDrillState();
    if (!currentState.currentDrill) return null;

    const result: DrillResult = {
      drillId: currentState.currentDrill.id,
      timestamp: Date.now(),
      score: currentState.correctAnswers,
      totalQuestions: currentState.currentDrill.totalQuestions,
      noteSetId: currentState.currentDrill.noteSetId,
      clef: currentState.currentDrill.clef,
    };

    // Clear current drill state
    saveDrillState({ currentDrill: null, currentQuestionIndex: 0, correctAnswers: 0 });
    return result;
  },
};
