// src/components/NoteSetDisplay.tsx

import React from 'react';
import { getNoteName, getKeySignatureAccidentals } from '../utils/noteUtils'; // Import the centralized utility
import { NOTE_COLORS, getBaseNoteName } from '../utils/noteColors'; // Import note coloring utilities
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
          {midiNumbers.map((midi) => {
            const baseNoteName = getBaseNoteName(midi);
            const noteColorClass = NOTE_COLORS[baseNoteName] ? NOTE_COLORS[baseNoteName].replace('bg-', 'text-') : 'text-gray-300'; // Fallback to gray if no color defined
            const fullNoteName = getNoteName(midi);
            const noteLiteral = fullNoteName.match(/^[A-G](#|b)?/)?.[0] || '';
            const octaveNumber = fullNoteName.replace(noteLiteral, '');
            return (
                            <span key={midi} className="text-lg font-bold mx-2">
                <span className={`${noteColorClass}`}>{noteLiteral}</span>
                <span className="text-white">{octaveNumber}</span>
              </span>
            );
          })}
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
