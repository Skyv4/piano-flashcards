import React from 'react';
import { getNoteName } from '../utils/noteUtils';

interface SheetMusicDisplayProps {
  midiNumber: number;
  noteColor?: string; // Optional: color for the note head
}

const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ midiNumber, noteColor }) => {
	const lineSpacing = 10; // Distance between two adjacent staff lines
	const staffHeight = 4 * lineSpacing;
  const stepHeight = lineSpacing / 2; // Half a line spacing, for notes in spaces

  // Mapping MIDI number to a vertical offset from the TOP of the staff container
  // F5 (MIDI 77) is on the top line (Line 5). Its position is 0 relative to the top of the staff.
  const noteVerticalPositions: { [key: number]: number } = {
    // Notes on the staff (Treble Clef)
    77: 0 * stepHeight, // F5 (Line 5)
    76: 1 * stepHeight, // E5 (Space 4)
    74: 2 * stepHeight, // D5 (Line 4)
    72: 3 * stepHeight, // C5 (Space 3)
    71: 4 * stepHeight, // B4 (Line 3)
    69: 5 * stepHeight, // A4 (Space 2)
    67: 6 * stepHeight, // G4 (Line 2)
    65: 7 * stepHeight, // F4 (Space 1)
    64: 8 * stepHeight, // E4 (Line 1)

    // Notes below the staff (with ledger lines, simplified positioning)
    62: 9 * stepHeight,  // D4 (below E4, needs ledger line)
    60: 10 * stepHeight, // C4 (Middle C, needs ledger line)
    59: 11 * stepHeight, // B3 (below C4, needs ledger line)
    57: 12 * stepHeight, // A3 (below B3, needs ledger line)
    55: 13 * stepHeight, // G3 (below A3, needs ledger line)
    53: 14 * stepHeight, // F3 (below G3, needs ledger line)
    52: 15 * stepHeight, // E3 (below F3, needs ledger line)
    50: 16 * stepHeight, // D3 (below E3, needs ledger line)
    48: 17 * stepHeight, // C3 (below D3, needs ledger line)
  };

  // Notes that require a ledger line to be drawn through them
  const notesWithLedgerLines = [
    62, // D4
    60, // C4
    59, // B3
    57, // A3
    55, // G3
    53, // F3
    52, // E3
    50, // D3
    48, // C3
  ];

  // Calculate the total height needed for the staff and notes
  const minNotePosition = 0; // F5
  const maxNotePosition = 17 * stepHeight; // C3
  const totalNoteSpanHeight = maxNotePosition - minNotePosition;

  // Add padding above the highest note and below the lowest note
  const verticalPadding = 2 * stepHeight; // 2 steps of padding
  const staffContainerHeight = totalNoteSpanHeight + (2 * verticalPadding);

  // Center the staff container vertically within the SheetMusicDisplay component
  const sheetMusicDisplayHeight = 256; // h-64 in px
  const staffContainerTopOffset = (sheetMusicDisplayHeight - staffContainerHeight) / 2;

  // Default sizing for the single note
  const noteHeadSize = 20;
  const stemWidth = 2;
  const stemLength = 40;
  const ledgerLineLength = 30;

  const Note: React.FC<{
    midiNumber: number;
    noteColor?: string;
    xOffset: number; // Horizontal offset for the note
    verticalPadding: number;
    stepHeight: number;
    noteVerticalPositions: { [key: number]: number };
    notesWithLedgerLines: number[];
    noteHeadSize: number; // New: size of the note head (width and height)
    stemWidth: number; // New: width of the stem
    stemLength: number; // New: length of the stem
    ledgerLineLength: number; // New: length of the ledger line
  }> = ({
    midiNumber,
    noteColor,
    xOffset,
    verticalPadding,
    stepHeight,
    noteVerticalPositions,
    notesWithLedgerLines,
    noteHeadSize,
    stemWidth,
    stemLength,
    ledgerLineLength,
  }) => {
    const notePosition = noteVerticalPositions[midiNumber];

    if (notePosition === undefined) {
      return null; // Don't render if MIDI number is not mapped
    }

    const noteName = getNoteName(midiNumber);

    return (
      <>
        <div
          className={`absolute rounded-full ${noteColor || 'bg-white'} flex items-center justify-center`}
          style={{
            width: `${noteHeadSize}px`,
            height: `${noteHeadSize}px`,
            top: `${notePosition + verticalPadding - (noteHeadSize / 2)}px`,
            left: `${xOffset}px`,
            transform: 'translateX(-50%)',
            fontSize: `${noteHeadSize * 0.6}px`, // Adjust font size based on note head size
            color: 'black', // Text color for the note name
          }}
        >
          {noteName.charAt(0)} {/* Display first letter of note name */}
        </div>
        {/* Stem */}
        <div
          className={`absolute ${noteColor || 'bg-white'}`}
          style={{
            width: `${stemWidth}px`,
            height: `${stemLength}px`,
            top: `${notePosition + verticalPadding - (midiNumber >= 71 ? stemLength : 0)}px`,
            left: `${xOffset + (midiNumber >= 71 ? -(noteHeadSize / 2 - stemWidth / 2) : (noteHeadSize / 2 - stemWidth / 2))}px`,
          }}
        ></div>
        {/* Ledger Lines */}
        {notesWithLedgerLines.includes(midiNumber) && (
          <div
            className="absolute bg-white"
            style={{
              height: `${stemWidth}px`,
              width: `${ledgerLineLength}px`,
              top: `${notePosition + verticalPadding - (stemWidth / 2)}px`,
              left: `${xOffset - (ledgerLineLength / 2)}px`,
            }}
          ></div>
        )}
      </>
    );
  };

  return (
    <div className="relative w-64 h-64 flex flex-col justify-center items-center overflow-hidden">
      {/* Staff container to center the staff lines and notes */}
      <div
        className="relative w-full"
        style={{
          height: `${staffContainerHeight}px`,
          top: `${staffContainerTopOffset}px`,
        }}
      >
        {/* Treble Clef */}
        <div
          className="absolute left-0 text-5xl font-serif"
          style={{
            top: `${staffHeight / 2 - 25}px`, // Adjust clef position relative to the staff lines
            lineHeight: '1',
            zIndex: 10, // Ensure it renders above the lines
          }}
        >
          &#x1D11E; {/* Unicode for G Clef (Treble Clef) */}
        </div>

        {/* Staff Lines */}
        {[0, 1, 2, 3, 4].map((lineIndex) => (
          <div
            key={lineIndex}
            className="absolute w-full h-0.5 bg-gray-700"
            style={{ top: `${lineIndex * lineSpacing + verticalPadding}px` }}
          ></div>
        ))}

        {/* Note */}
        {midiNumber !== undefined && (
          <Note
            midiNumber={midiNumber}
            noteColor={noteColor}
            xOffset={128} // Centered for single note display
            verticalPadding={verticalPadding}
            stepHeight={stepHeight}
            noteVerticalPositions={noteVerticalPositions}
            notesWithLedgerLines={notesWithLedgerLines}
            noteHeadSize={noteHeadSize}
            stemWidth={stemWidth}
            stemLength={stemLength}
            ledgerLineLength={ledgerLineLength}
          />
        )}
      </div>
    </div>
  );
};

export default SheetMusicDisplay;