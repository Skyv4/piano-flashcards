import React, { useEffect, useState } from 'react';
import { UserProfileService } from '../utils/userService';
import { UserProfile } from '../types/userTypes';

const StatsDisplay: React.FC = () => {
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
    return null; // Or a loading spinner
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-white text-center mb-4">
      <p className="text-xl">Total Points: <span className="font-bold text-yellow-400">{userProfile.totalPoints}</span></p>
    </div>
  );
};

export default StatsDisplay;