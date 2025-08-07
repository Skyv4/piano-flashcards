export interface Drill {
  id: string;
  name: string;
  noteSetId: string;
  clef: 'treble' | 'bass' | 'both';
  questions: number[]; // MIDI numbers for the questions in this drill
  totalQuestions: number;
  type: 'custom' | 'daily';
}

export interface DrillResult {
  drillId: string;
  timestamp: number;
  score: number; // Number of correct answers
  totalQuestions: number;
  noteSetId: string;
  clef: 'treble' | 'bass' | 'both';
}
