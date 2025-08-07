export interface UserProfile {
  totalPoints: number;
  drillMastery: { [noteSetId: string]: { correct: number; total: number; }; }; // Tracks correct/total answers per note set
  drillHistory: DrillResult[];
}
