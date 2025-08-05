// src/components/NoteSetDisplay.tsx

import React from 'react';
import { getNoteName, getKeySignatureAccidentals } from '../utils/noteUtils'; // Import the centralized utility
import SheetMusicStaff from './SheetMusicStaff'; // Import MultiNoteSheetMusicDisplay

interface NoteSetDisplayProps {
  midiNumbers: number[];
  title: string;
  name: string;
}

const NoteSetDisplay: React.FC<NoteSetDisplayProps> = ({ midiNumbers, title, name }) => {
  if (!midiNumbers || midiNumbers.length === 0) {
    return null; // Don't render if no notes are provided
  }

  const keySignature = getKeySignatureAccidentals(title);

  return (
    <div className="w-full p-4 bg-gray-800 rounded-lg shadow-lg mb-8">
      <h3 className="text-xl font-semibold text-white mb-4 text-center">{title}</h3>
      <div className="flex flex-wrap justify-center gap-4">
        {/* Display note names above the single SheetMusicDisplay */}
        <div className="flex justify-center w-full mb-4">
          {midiNumbers.map((midi) => (
            <span key={midi} className="text-sm text-gray-300 mx-2">{getNoteName(midi)}</span>
          ))}
        </div>
        <SheetMusicStaff 
          midiNumbers={midiNumbers} 
          noteHeadSize={30} 
          stemWidth={3} 
          stemLength={60} 
          ledgerLineLength={40} 
          clefColor="text-white"
          sharpsAndFlats={getKeySignatureAccidentals(name)}
        />
      </div>
    </div>
  );
};

export default NoteSetDisplay;
