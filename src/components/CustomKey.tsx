

import React from 'react';
import classNames from 'classnames';

const STEPSIZE = 1.;

const unit = 0.638;
const NOTE_POSITIONS_IN_OCTAVE: number[] = [
	0 * STEPSIZE,   // C
	(0 + unit) * STEPSIZE, // C#
	1 * STEPSIZE,   // D
	(1 + unit) * STEPSIZE, // D#
	2 * STEPSIZE,   // E
	3 * STEPSIZE,   // F
	(3 + unit) * STEPSIZE, // F#
	4 * STEPSIZE,   // G
	(4 + unit) * STEPSIZE, // G#
	5 * STEPSIZE,   // A
	(5 + unit) * STEPSIZE, // A#
	6 * STEPSIZE    // B
];

interface CustomKeyProps {
  midiNumber: number;
  naturalKeyWidth: number; // Width as a ratio between 0 and 1
  gliss: boolean;
  useTouchEvents: boolean;
  accidental: boolean;
  active: boolean;
  disabled: boolean;
  onPlayNoteInput: (midiNumber: number) => void;
  onStopNoteInput: (midiNumber: number) => void;
  accidentalWidthRatio: number;
  children?: React.ReactNode;
  noteRange: { first: number; last: number }; // Added noteRange prop
  isHovered: boolean; // New prop for hover state
  onMouseEnter: (midiNumber: number) => void; // New prop for mouse enter event
  onMouseLeave: (midiNumber: number | null) => void; // New prop for mouse leave event
}

class CustomKey extends React.Component<CustomKeyProps> {
  static defaultProps = {
    accidentalWidthRatio: 0.65,
    disabled: false,
    gliss: false,
    useTouchEvents: false,
  };

  onPlayNoteInput = () => {
    this.props.onPlayNoteInput(this.props.midiNumber);
  };

  onStopNoteInput = () => {
    this.props.onStopNoteInput(this.props.midiNumber);
  };

  // Key position is represented by the number of natural key widths from the left
  getAbsoluteKeyPosition(midiNumber: number) {
    const OCTAVE_NATURAL_KEYS = 7;
    const OCTAVE_MIDI_OFFSET = 24; // C0 is MIDI 24

    const positionInOctave = NOTE_POSITIONS_IN_OCTAVE[midiNumber % 12];

    const octave = Math.floor((midiNumber - OCTAVE_MIDI_OFFSET) / 12);
    const octavePosition = OCTAVE_NATURAL_KEYS * octave;
    return positionInOctave + octavePosition;
  }

  getRelativeKeyPosition(midiNumber: number) {
    return (
      this.getAbsoluteKeyPosition(midiNumber) -
      this.getAbsoluteKeyPosition(this.props.noteRange.first)
    );
  }

  render() {
    const {
      naturalKeyWidth,
      accidentalWidthRatio,
      midiNumber,
      gliss,
      useTouchEvents,
      accidental,
      active,
      disabled,
      children,
      isHovered, // Destructure new prop
      onMouseEnter, // Destructure new prop
      onMouseLeave, // Destructure new prop
    } = this.props;

    // Need to conditionally include/exclude handlers based on useTouchEvents,
    // because otherwise mobile taps double fire events.
    return (
      <div
        className={classNames('ReactPiano__Key', {
          'ReactPiano__Key--accidental': accidental,
          'ReactPiano__Key--natural': !accidental,
          'ReactPiano__Key--disabled': disabled,
          'ReactPiano__Key--active': active,
          'hovered-key': isHovered, // Apply hovered-key class
        })}
        style={{
          left: ratioToPercentage(
            this.getRelativeKeyPosition(midiNumber) * naturalKeyWidth,
          ),
          width: ratioToPercentage(
            accidental ? accidentalWidthRatio * naturalKeyWidth : naturalKeyWidth,
          ),
        }}
        onMouseDown={useTouchEvents ? undefined : this.onPlayNoteInput}
        onMouseUp={useTouchEvents ? undefined : this.onStopNoteInput}
        onMouseEnter={gliss ? this.onPlayNoteInput : () => onMouseEnter(midiNumber)} // Use new onMouseEnter prop
        onMouseLeave={gliss ? this.onStopNoteInput : () => onMouseLeave(null)} // Use new onMouseLeave prop, conditionally clear hovered note
        onTouchStart={useTouchEvents ? this.onPlayNoteInput : undefined}
        onTouchCancel={useTouchEvents ? this.onStopNoteInput : undefined}
        onTouchEnd={useTouchEvents ? this.onStopNoteInput : undefined}
      >
        <div className="ReactPiano__NoteLabelContainer">{children}</div>
      </div>
    );
  }
}

function ratioToPercentage(ratio: number) {
  return `${ratio * 100}%`;
}

export default CustomKey;