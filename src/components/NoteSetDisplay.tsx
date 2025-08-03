// src/components/NoteSetDisplay.tsx

import React from 'react';
import { getNoteName } from '../utils/noteUtils'; // Import the centralized utility
import SheetMusicDisplay from './MultiNoteSheetMusicDisplay'; // Import MultiNoteSheetMusicDisplay

interface NoteSetDisplayProps {
  midiNumbers: number[];
  title: string;
}

const NoteSetDisplay: React.FC<NoteSetDisplayProps> = ({ midiNumbers, title }) => {
  if (!midiNumbers || midiNumbers.length === 0) {
    return null; // Don't render if no notes are provided
  }

  return (
    <div className="w-full p-4 bg-gray-800 rounded-lg shadow-lg mb-8">
      <h3 className="text-xl font-semibold text-white mb-4 text-center">{title}</h3>
      <div className="flex flex-wrap justify-center gap-4">
        {/* Display note names above the single SheetMusicDisplay */}
        <div className="flex justify-center w-full mb-4">
          {midiNumbers.map((midi, index) => (
            <span key={midi} className="text-sm text-gray-300 mx-2">{getNoteName(midi)}</span>
          ))}
        </div>
        <SheetMusicDisplay 
          midiNumbers={midiNumbers} 
          noteHeadSize={30} 
          stemWidth={3} 
          stemLength={60} 
          ledgerLineLength={40} 
        />
      </div>
    </div>
  );
};

export default NoteSetDisplay;
