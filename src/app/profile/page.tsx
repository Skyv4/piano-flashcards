'use client';

import React, { useEffect, useState } from 'react';
import { UserProfileService } from '../../utils/userService';
import { UserProfile } from '../../types/userTypes';
import { DrillResult } from '../../types/drillTypes';
import { PREDEFINED_NOTE_SETS } from '../../utils/noteSets';
import Link from 'next/link';

const ProfilePage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const profile = UserProfileService.getProfile();
    setUserProfile(profile);

    const handleStorageChange = () => {
      setUserProfile(UserProfileService.getProfile());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Loading profile...</p>
      </div>
    );
  }

  const getHighestScore = (noteSetId: string): string => {
    const relevantDrills = userProfile.drillHistory.filter(drill => drill.noteSetId === noteSetId);
    if (relevantDrills.length === 0) return 'N/A';
    const maxScore = Math.max(...relevantDrills.map(drill => (drill.score / drill.totalQuestions) * 100));
    return `${maxScore.toFixed(0)}%`;
  };

  const getLastScore = (noteSetId: string): string => {
    const relevantDrills = userProfile.drillHistory.filter(drill => drill.noteSetId === noteSetId);
    if (relevantDrills.length === 0) return 'N/A';
    const lastDrill = relevantDrills.sort((a, b) => b.timestamp - a.timestamp)[0];
    return `${((lastDrill.score / lastDrill.totalQuestions) * 100).toFixed(0)}%`;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Your Profile</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-4xl mb-8">
        <h2 className="text-2xl font-semibold mb-4">Overall Stats</h2>
        <p className="text-xl mb-2">Total Points: <span className="font-bold text-yellow-400">{userProfile.totalPoints}</span></p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4">Drill Mastery</h2>
        {
          Object.keys(PREDEFINED_NOTE_SETS).length > 0 ? (
            <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-left text-lg font-semibold text-white">Drill Set</th>
                  <th className="py-3 px-4 text-left text-lg font-semibold text-white">Mastery</th>
                  <th className="py-3 px-4 text-left text-lg font-semibold text-white">Highest Score</th>
                  <th className="py-3 px-4 text-left text-lg font-semibold text-white">Last Score</th>
                  <th className="py-3 px-4 text-left text-lg font-semibold text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {PREDEFINED_NOTE_SETS.map(set => {
                  const mastery = userProfile.drillMastery[set.id];
                  const masteryPercentage = mastery ? ((mastery.correct / mastery.total) * 100).toFixed(0) : '0';
                  return (
                    <tr key={set.id} className="border-t border-gray-600">
                      <td className="py-3 px-4 text-lg">{set.name}</td>
                      <td className="py-3 px-4 text-lg">{masteryPercentage}%</td>
                      <td className="py-3 px-4 text-lg">{getHighestScore(set.id)}</td>
                      <td className="py-3 px-4 text-lg">{getLastScore(set.id)}</td>
                      <td className="py-3 px-4">
                        <Link href={`/?drillSetId=${set.id}`}>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-base">
                            Drill Now!
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-lg">No drill sets available.</p>
          )
        }
      </div>
    </div>
  );
};

export default ProfilePage;
