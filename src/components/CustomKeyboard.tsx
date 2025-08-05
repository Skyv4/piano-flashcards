import React from 'react';
import range from 'just-range';
import classNames from 'classnames';

import CustomKey from './CustomKey';
import { getNoteName, isAccidental as checkIsAccidental } from '../utils/noteUtils';

interface NoteRange {
  first: number;
  last: number;
}

interface CustomKeyboardProps {
  noteRange: NoteRange;
  activeNotes: number[];
  onPlayNoteInput: (midiNumber: number) => void;
  onStopNoteInput: (midiNumber: number) => void;
  keyWidthToHeight: number;
  className?: string;
  disabled?: boolean;
  gliss?: boolean;
  useTouchEvents?: boolean;
  width?: number;
  hoveredNote: number | null; // New prop for hovered note
  onMouseEnter: (midiNumber: number) => void; // New prop for mouse enter event
  onMouseLeave: (midiNumber: number | null) => void; // New prop for mouse leave event
  showNoteLabels?: boolean; // New prop to control note label visibility
}

class CustomKeyboard extends React.Component<CustomKeyboardProps> {
  static defaultProps = {
    disabled: false,
    gliss: false,
    useTouchEvents: false,
    keyWidthToHeight: 0.33,
  };

  // Range of midi numbers on keyboard
  getMidiNumbers() {
    return range(this.props.noteRange.first, this.props.noteRange.last + 1);
  }

  getNaturalKeyCount() {
    return this.getMidiNumbers().filter((midiNumber) => {
      return !checkIsAccidental(midiNumber);
    }).length;
  }

  // Returns a ratio between 0 and 1
  getNaturalKeyWidth() {
    return 1 / this.getNaturalKeyCount();
  }

  getWidth() {
    return this.props.width ? this.props.width : '100%';
  }

  getHeight() {
    if (!this.props.width) {
      return '100%';
    }
    const keyWidth = this.props.width * this.getNaturalKeyWidth();
    return `${keyWidth / this.props.keyWidthToHeight}px`;
  }

  render() {
    const naturalKeyWidth = this.getNaturalKeyWidth();
    return (
      <div
        className={classNames('ReactPiano__Keyboard', this.props.className)}
        style={{ width: this.getWidth(), height: this.getHeight() }}
        onMouseLeave={() => this.props.onMouseLeave(null)}
      >
        {this.getMidiNumbers().map((midiNumber) => {
          const isAccidental = checkIsAccidental(midiNumber);
          const isActive = !this.props.disabled && this.props.activeNotes.includes(midiNumber);
          const isHovered = this.props.hoveredNote === midiNumber; // Determine hover state

          return (
            <CustomKey
              naturalKeyWidth={naturalKeyWidth}
              midiNumber={midiNumber}
              noteRange={this.props.noteRange}
              active={isActive}
              accidental={isAccidental}
              disabled={this.props.disabled || false}
              onPlayNoteInput={this.props.onPlayNoteInput}
              onStopNoteInput={this.props.onStopNoteInput}
              gliss={this.props.gliss || false}
              useTouchEvents={this.props.useTouchEvents || false}
              key={midiNumber}
              isHovered={isHovered} // Pass isHovered prop
              onMouseEnter={() => this.props.onMouseEnter(midiNumber)} // Pass onMouseEnter handler
              onMouseLeave={() => this.props.onMouseLeave(midiNumber)} // Pass onMouseLeave handler
            >
              {this.props.disabled || !this.props.showNoteLabels
                ? null
                : (
                    <div className="ReactPiano__NoteLabelContainer">
                      <div className="ReactPiano__NoteLabel">
                        {/* Note label content, similar to what was in renderNoteLabel */}
                        {/* You might want to add keyboard shortcuts here if needed */}
                        <div className="ReactPiano__NoteLabel__NoteName">{getNoteName(midiNumber)}</div>
                      </div>
                    </div>
                  )}
            </CustomKey>
          );
        })}
      </div>
    );
  }
}

export default CustomKeyboard;
