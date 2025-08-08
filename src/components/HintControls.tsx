import React from 'react';

interface HintControlsProps {
  highlightKeyHint: boolean;
  setHighlightKeyHint: (value: boolean) => void;
  labelNotesHint: boolean;
  setLabelNotesHint: (value: boolean) => void;
  isDrillMode: boolean;
}

const HintControls: React.FC<HintControlsProps> = ({
  highlightKeyHint,
  setHighlightKeyHint,
  labelNotesHint,
  setLabelNotesHint,
  isDrillMode,
}) => {
  return (
    <div className="bg-gray-700 p-2 rounded-md shadow-md w-full">
      <h1 className="text-white text-lg font-semibold mb-1">Hints</h1>
      <div className="flex flex-row justify-around items-center w-full">
        <div className="flex items-center">
          <label className="custom-switch mr-2">
            <input
              type="checkbox"
              id="highlight-key-toggle"
              checked={highlightKeyHint}
              onChange={() => setHighlightKeyHint(!highlightKeyHint)}
              disabled={isDrillMode}
            />
            <span className="slider"></span>
          </label>
          <label htmlFor="highlight-key-toggle" className="text-base text-white">Highlight Key</label>
        </div>
        <div className="flex items-center">
          <label className="custom-switch mr-2">
            <input
              type="checkbox"
              id="label-notes-toggle"
              checked={labelNotesHint}
              onChange={() => setLabelNotesHint(!labelNotesHint)}
              disabled={isDrillMode}
            />
            <span className="slider"></span>
          </label>
          <label htmlFor="label-notes-toggle" className="text-base text-white">Label Notes</label>
        </div>
      </div>
    </div>
  );
};

export default HintControls;
