import React from 'react';
import { getNoteName } from '../utils/noteUtils';
import { NOTE_COLORS, getBaseNoteName } from '../utils/noteColors';

interface NoteProps {
  midiNumber: number;
  xOffset: number; // Horizontal offset for the note
  verticalPadding: number;
  noteVerticalPositions: { [key: number]: number };
  notesWithLedgerLines: number[];
  noteHeadSize: number;
  stemWidth: number;
  stemLength: number;
  ledgerLineLength: number;
  keySignature?: { symbol: string; midiNumber: number }[];
  hideNoteLetter: boolean;
}

const Note: React.FC<NoteProps> = ({
  midiNumber,
  xOffset,
  verticalPadding,
  noteVerticalPositions,
  notesWithLedgerLines,
  noteHeadSize,
  stemWidth,
  stemLength,
  ledgerLineLength,
  keySignature,
  hideNoteLetter,
}) => {
  const notePosition = noteVerticalPositions[midiNumber];

  if (notePosition === undefined) {
    return null;
  }

  const noteName = getNoteName(midiNumber);
  const baseNoteColorClass = NOTE_COLORS[getBaseNoteName(midiNumber)] || 'bg-white';

  const isSharp = noteName.includes('#');
  const isFlat = noteName.includes('b');
  const accidentalSymbol = isSharp ? '♯' : (isFlat ? '♭' : '');

  // Check if the accidental is already covered by the key signature
  const isAccidentalInKeySignature = keySignature && keySignature.some(acc => {
    const baseNote = getBaseNoteName(midiNumber);
    const accidentalBaseNote = getBaseNoteName(acc.midiNumber);
    return baseNote === accidentalBaseNote && acc.symbol === accidentalSymbol;
  });

  const accidentalOffset = (accidentalSymbol && !isAccidentalInKeySignature) ? 15 : 0;

  return (
    <>
      {accidentalSymbol && !isAccidentalInKeySignature && (
        <div
          className="absolute text-xl font-serif"
          style={{
            top: `${notePosition + verticalPadding - (noteHeadSize / 2) - 5}px`,
            left: `${xOffset - noteHeadSize / 2 - accidentalOffset}px`,
            transform: 'translateX(-50%)',
            color: 'black',
            zIndex: 10,
          }}
        >
          {accidentalSymbol}
        </div>
      )}
      <div
        className={`absolute rounded-full ${baseNoteColorClass} flex items-center justify-center`}
        style={{
          width: `${noteHeadSize}px`,
          height: `${noteHeadSize}px`,
          top: `${notePosition + verticalPadding - (noteHeadSize / 2)}px`,
          left: `${xOffset + accidentalOffset}px`,
          transform: 'translateX(-50%)',
          fontSize: `${noteHeadSize * 0.6}px`,
          color: 'black',
          zIndex: 2, // Ensure note head is above ledger line
        }}
      >
        {!hideNoteLetter && noteName.charAt(0)}
      </div>
      {/* Stem */}
      <div
        className={`absolute ${baseNoteColorClass}`}
        style={{
          width: `${stemWidth}px`,
          height: `${stemLength}px`,
          top: `${notePosition + verticalPadding - (midiNumber >= 71 ? stemLength : 0)}px`,
          left: `${xOffset + accidentalOffset + (midiNumber >= 71 ? -(noteHeadSize / 2 - stemWidth / 2) : (noteHeadSize / 2 - stemWidth / 2))}px`,
        }}
      ></div>
      {/* Ledger Lines */}
      {notesWithLedgerLines.includes(midiNumber) && (
        <div
          className={`absolute ${baseNoteColorClass}`}
          style={{
            height: `${stemWidth}px`,
            width: `${ledgerLineLength}px`,
            top: `${notePosition + verticalPadding - (stemWidth / 2)}px`,
            left: `${xOffset - (ledgerLineLength / 2)}px`,
            zIndex: 1, // Ensure ledger line is below note head
          }}
        ></div>
      )}
    </>
  );
};

interface SheetMusicStaffProps {
  midiNumbers: number[];
  noteHeadSize?: number;
  stemWidth?: number;
  stemLength?: number;
  ledgerLineLength?: number;
  height?: number; // New prop for controlling the height of the staff display
  clefColor?: string;
  sharpsAndFlats?: { symbol: string; midiNumber: number }[];
  hideNoteLetter?: boolean; // New prop to hide the note letter
  clefType?: 'bass' | 'treble'; // New prop for clef type
}

const SheetMusicStaff: React.FC<SheetMusicStaffProps> = ({
  midiNumbers,
  noteHeadSize = 20,
  stemWidth = 2,
  stemLength = 40,
  ledgerLineLength = 30,
  height = 256, // Default height
  clefColor = 'text-gray-800', // Default to dark color
  sharpsAndFlats = [],
  hideNoteLetter = false,
  clefType = 'treble', // Default to treble clef
}) => {
  const getClefSpecificData = (clef: 'bass' | 'treble', stepHeight: number) => {
    let noteVerticalPositions: { [key: number]: number };
    let notesWithLedgerLines: number[];
    let clefSymbol: string;
    let clefTopOffset: string;
    let clefLeftOffset: string;
    let totalSteps: number;

    if (clef === 'treble') {
      totalSteps = 17;
      noteVerticalPositions = {
        77: 0 * stepHeight, // F5
        76: 1 * stepHeight, // E5#
        74: 2 * stepHeight, // D5
        72: 3 * stepHeight, // C5#
        71: 4 * stepHeight, // B4
        69: 5 * stepHeight, // A4
        67: 6 * stepHeight, // G4
        65: 7 * stepHeight, // F4
        64: 8 * stepHeight, // E4
        62: 9 * stepHeight, // D4
        60: 10 * stepHeight, // C4 (Middle C)
        59: 11 * stepHeight, // B3
        57: 12 * stepHeight, // A3
        55: 13 * stepHeight, // G3
        53: 14 * stepHeight, // F3
        52: 15 * stepHeight, // E3
        50: 16 * stepHeight, // D3
        48: 17 * stepHeight, // C3
      };
      notesWithLedgerLines = [62, 60, 59, 57, 55, 53, 52, 50, 48];
      clefSymbol = '&#x1D11E;'; // Treble clef symbol
      clefTopOffset = `${(4 * stepHeight) - 25}px`; // Position for treble clef
      clefLeftOffset = '0';
    } else { // bass clef
      totalSteps = 17; // This might need adjustment based on the actual range of notes for bass clef
      noteVerticalPositions = {
        60: 0 * stepHeight, // C4 (Middle C)
        59: 1 * stepHeight, // B3
        57: 2 * stepHeight, // A3
        55: 3 * stepHeight, // G3
        53: 4 * stepHeight, // F3
        52: 5 * stepHeight, // E3
        50: 6 * stepHeight, // D3
        48: 7 * stepHeight, // C3
        47: 8 * stepHeight, // B2
        45: 9 * stepHeight, // A2
        43: 10 * stepHeight, // G2
        41: 11 * stepHeight, // F2
        40: 12 * stepHeight, // E2
        38: 13 * stepHeight, // D2
        36: 14 * stepHeight, // C2
        35: 15 * stepHeight, // B1
        33: 16 * stepHeight, // A1
      };
      notesWithLedgerLines = [60, 59, 57, 55, 53, 52, 50, 48, 47, 45, 43, 41, 40, 38, 36, 35, 33];
      clefSymbol = '&#x1D122;'; // Bass clef symbol
      clefTopOffset = `${(2 * stepHeight) - 25}px`; // Position for bass clef
      clefLeftOffset = '0';
    }
    return { noteVerticalPositions, notesWithLedgerLines, clefSymbol, clefTopOffset, clefLeftOffset, totalSteps };
  };

  const staffDisplayHeight = height;
  const staffLineCount = 5;
  
  const calculatedStepHeight = height / (17 + (2 * 2)); // totalSteps + 2 * verticalPadding in steps
  const lineSpacing = calculatedStepHeight * 2;

  const staffHeight = 4 * lineSpacing;

  const { noteVerticalPositions, notesWithLedgerLines, clefSymbol, clefTopOffset, clefLeftOffset, totalSteps } = getClefSpecificData(clefType, calculatedStepHeight);

  const minNotePosition = 0;
  const maxNotePosition = totalSteps * calculatedStepHeight;
  const totalNoteSpanHeight = maxNotePosition - minNotePosition;

  const verticalPadding = 2 * calculatedStepHeight;
  const staffContainerHeight = totalNoteSpanHeight + (2 * verticalPadding);

  const staffContainerTopOffset = (staffDisplayHeight - staffContainerHeight) / 2;

  return (
    <div className="relative w-full flex flex-col justify-center items-center overflow-hidden" style={{ height: `${staffDisplayHeight}px` }}>
      <div
        className="relative w-full"
        style={{
          height: `${staffContainerHeight}px`,
          top: `${staffContainerTopOffset}px`,
        }}
      >
        {/* Clef */}
        <div
          className={`absolute left-0 text-5xl font-serif ${clefColor}`}
          style={{
            top: clefTopOffset,
            left: clefLeftOffset,
            lineHeight: '1',
            zIndex: 10,
          }}
          dangerouslySetInnerHTML={{ __html: clefSymbol }}
        ></div>

        {/* Key Signature */}
        <div className="absolute left-12 flex items-center" style={{ zIndex: 10 }}>
          {sharpsAndFlats.map((accidental, index) => {
            const notePosition = noteVerticalPositions[accidental.midiNumber];
            if (notePosition === undefined) return null;
            // Center the symbol vertically on the note's position.
            // A 4xl text is approx 36px high, so we offset by 18px.
            return (
              <div
                key={index}
                className={`absolute text-4xl ${clefColor}`}
                style={{
                  left: `${index * 20}px`,
                  top: `${notePosition + verticalPadding - 18}px`,
                }}>
                {accidental.symbol}
              </div>
            );
          })}
        </div>

        

        {/* Staff Lines */}
        {[0, 1, 2, 3, 4].map((lineIndex) => (
          <div
            key={lineIndex}
            className="absolute w-full h-0.5 bg-gray-700"
            style={{ top: `${lineIndex * lineSpacing + verticalPadding}px` }}
          ></div>
        ))}

        {/* Notes */}
        {midiNumbers.map((midi, index) => (
          <Note
            key={midi}
            midiNumber={midi}
            xOffset={midiNumbers.length === 1 ? (staffContainerHeight / 2) : (50 + (sharpsAndFlats ? sharpsAndFlats.length * 15 : 0) + index * (noteHeadSize + 10))} // Adjust xOffset for single note to be centered
            verticalPadding={verticalPadding}
            noteVerticalPositions={noteVerticalPositions}
            notesWithLedgerLines={notesWithLedgerLines}
            noteHeadSize={noteHeadSize}
            stemWidth={stemWidth}
            stemLength={stemLength}
            ledgerLineLength={ledgerLineLength}
            keySignature={sharpsAndFlats}
            hideNoteLetter={hideNoteLetter}
          />
        ))}
      </div>
    </div>
  );
};

export default SheetMusicStaff;
