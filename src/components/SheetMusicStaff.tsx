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
}) => {
  // Calculate line spacing and step height based on the provided height
  // The staff will occupy a portion of the total height, maintaining proportions
  const staffDisplayHeight = height;
  const staffLineCount = 5; // Number of lines in a standard staff
  const totalSteps = 17; // From lowest to highest note position defined

  // Determine a base unit for scaling. We want the staff lines to fit within a reasonable portion of the height.
  // Let's assume the 4 spaces between the 5 lines take up a certain percentage of the height.
  // A standard staff has 4 spaces. If lineSpacing is the height of one space, then 4 * lineSpacing is the staff height.
  // We need to ensure that the total range of notes (from 48 to 77) fits within the staffDisplayHeight.

  // A reasonable approach is to define a fixed number of "steps" that cover the entire range of notes we want to display.
  // The current noteVerticalPositions covers 17 steps (from 0 to 17 * stepHeight).
  // Let's make the `stepHeight` dynamic based on the `height` prop.
  // We'll allocate a certain portion of the `height` for the note span.
  // For example, if we want the 17 steps to take up 80% of the height, then:
  // 17 * stepHeight = 0.8 * height
  // stepHeight = (0.8 * height) / 17

  // Let's refine this. The current `noteVerticalPositions` maps MIDI numbers to positions based on `stepHeight`.
  // The total span of these positions is `17 * stepHeight`.
  // We also have `verticalPadding` which is `2 * stepHeight`.
  // So, `staffContainerHeight` is `(17 + 2*2) * stepHeight = 21 * stepHeight`.
  // We want `21 * stepHeight` to be roughly equal to `height`.
  const calculatedStepHeight = height / (totalSteps + (2 * 2)); // totalSteps + 2 * verticalPadding in steps
  const lineSpacing = calculatedStepHeight * 2; // lineSpacing is 2 steps

  const staffHeight = 4 * lineSpacing; // 4 spaces between 5 lines

  const noteVerticalPositions: { [key: number]: number } = {
    77: 0 * calculatedStepHeight,
    76: 1 * calculatedStepHeight,
    74: 2 * calculatedStepHeight,
    72: 3 * calculatedStepHeight,
    71: 4 * calculatedStepHeight,
    69: 5 * calculatedStepHeight,
    67: 6 * calculatedStepHeight,
    65: 7 * calculatedStepHeight,
    64: 8 * calculatedStepHeight,
    62: 9 * calculatedStepHeight,
    60: 10 * calculatedStepHeight,
    59: 11 * calculatedStepHeight,
    57: 12 * calculatedStepHeight,
    55: 13 * calculatedStepHeight,
    53: 14 * calculatedStepHeight,
    52: 15 * calculatedStepHeight,
    50: 16 * calculatedStepHeight,
    48: 17 * calculatedStepHeight,
  };

  const notesWithLedgerLines = [
    62, 60, 59, 57, 55, 53, 52, 50, 48,
  ];

  const minNotePosition = 0;
  const maxNotePosition = 17 * calculatedStepHeight;
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
        {/* Treble Clef */}
        <div
          className={`absolute left-0 text-5xl font-serif ${clefColor}`}
          style={{
            top: `${staffHeight / 2 - 25}px`, // Adjust clef position based on new scaling
            lineHeight: '1',
            zIndex: 10,
          }}
        >
          &#x1D11E;
        </div>

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
