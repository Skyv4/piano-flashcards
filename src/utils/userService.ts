import { UserProfile } from '../types/userTypes';
import { DrillResult } from '../types/drillTypes';

const USER_PROFILE_STORAGE_KEY = 'pianoUserProfile';
const POINTS_PER_CORRECT_ANSWER = 10;

const loadUserProfile = (): UserProfile => {
  if (typeof window === 'undefined') return { totalPoints: 0, drillMastery: {}, drillHistory: [] };
  const storedProfile = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
  return storedProfile ? JSON.parse(storedProfile) : { totalPoints: 0, drillMastery: {}, drillHistory: [] };
};

const saveUserProfile = (profile: UserProfile) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }
};

export const UserProfileService = {
  getProfile: (): UserProfile => {
    return loadUserProfile();
  },

  updateProfileWithDrillResult: (result: DrillResult) => {
    const profile = loadUserProfile();

    // Update total points
    profile.totalPoints += result.score * POINTS_PER_CORRECT_ANSWER;

    // Update drill mastery for the specific note set
    if (!profile.drillMastery[result.noteSetId]) {
      profile.drillMastery[result.noteSetId] = { correct: 0, total: 0 };
    }
    profile.drillMastery[result.noteSetId].correct += result.score;
    profile.drillMastery[result.noteSetId].total += result.totalQuestions;

    // Add to drill history
    profile.drillHistory.push(result);

    saveUserProfile(profile);
  },

  // Potentially add more methods for daily drills, resetting stats, etc.
};
