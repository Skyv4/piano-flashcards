'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MidiNumbers } from 'react-piano';
import CustomKeyboard from './CustomKeyboard';
import 'react-piano/dist/styles.css';
import SheetMusicStaff from './SheetMusicStaff';
import NoteSetDisplay from './NoteSetDisplay';
import { PREDEFINED_NOTE_SETS } from '../utils/noteSets';
import { getKeySignatureAccidentals } from '../utils/noteUtils';
import DrillMode from './DrillMode';
import HintControls from './HintControls';
import StatsDisplay from './StatsDisplay';
import { DrillService } from '../utils/drillService';
import { useSearchParams } from 'next/navigation';
import { SplendidGrandPiano } from 'smplr';


const PianoFlashcardLearner: React.FC = () => {
  const searchParams = useSearchParams();
  const initialDrillSetId = searchParams.get('drillSetId') || 'c-major-scale';

  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [selectedNoteSetId, setSelectedNoteSetId] = useState<string>(initialDrillSetId);
  const [isDrillMode, setIsDrillMode] = useState<boolean>(false);
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);
  const [highlightKeyHint, setHighlightKeyHint] = useState<boolean>(false);
  const [labelNotesHint, setLabelNotesHint] = useState<boolean>(false);
  const [clefMode, setClefMode] = useState<'treble' | 'bass'>('treble');

  // Refs for audio playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const pianoRef = useRef<SplendidGrandPiano | null>(null);

  // Ref to hold the DrillMode's handleAnswer function
  const drillModeHandleAnswerRef = useRef<((midiNumber: number) => void) | null>(null);

  const availableNoteSets = useMemo(() => {
    return PREDEFINED_NOTE_SETS.filter(set => {
      if (clefMode === 'treble') {
        return set.clef === 'treble' || set.clef === 'both';
      } else {
        return set.clef === 'bass' || set.clef === 'both';
      }
    });
  }, [clefMode]);

  const noteRange = useMemo(() => ({
    first: MidiNumbers.fromNote('c2'),
    last: MidiNumbers.fromNote('f5'),
  }), []);

  const generateFlashcardQuestion = useCallback(() => {
    setFeedback(null);
    const currentSet = availableNoteSets.find(set => set.id === selectedNoteSetId);

    if (!currentSet || currentSet.midiNumbers.length === 0) {
      console.warn('Selected note set not found or is empty. Falling back to "All Notes".');
      const allNotesSet = PREDEFINED_NOTE_SETS.find(set => set.id === 'all-notes');
      if (allNotesSet) {
        const randomIndex = Math.floor(Math.random() * allNotesSet.midiNumbers.length);
        setCurrentNote(allNotesSet.midiNumbers[randomIndex]);
        setActiveNotes([allNotesSet.midiNumbers[randomIndex]]);
      } else {
        setCurrentNote(null);
        setActiveNotes([]);
      }
      return;
    }

    const randomIndex = Math.floor(Math.random() * currentSet.midiNumbers.length);
    setCurrentNote(currentSet.midiNumbers[randomIndex]);
    setActiveNotes(highlightKeyHint ? [currentSet.midiNumbers[randomIndex]] : []);
  }, [setCurrentNote, setActiveNotes, setFeedback, selectedNoteSetId, availableNoteSets, highlightKeyHint]);

  useEffect(() => {
    // When clefMode changes, reset selectedNoteSetId to a valid default for the new clef
    if (availableNoteSets.length > 0) {
      const currentSelectedSetExists = availableNoteSets.some(set => set.id === selectedNoteSetId);
      if (!currentSelectedSetExists) {
        // Try to find a clef-specific set first
        const clefSpecificSet = availableNoteSets.find(set => set.clef === clefMode);
        if (clefSpecificSet) {
          setSelectedNoteSetId(clefSpecificSet.id);
        } else {
          // Fallback to the first available set if no clef-specific set is found
          setSelectedNoteSetId(availableNoteSets[0].id);
        }
      }
    }
  }, [clefMode, availableNoteSets, selectedNoteSetId]);

  // Initialize flashcard mode if not in drill mode
  useEffect(() => {
    // Initialize AudioContext and SplendidGrandPiano
    if (typeof window !== 'undefined') {
      audioContextRef.current = new window.AudioContext();
      pianoRef.current = new SplendidGrandPiano(audioContextRef.current);
      pianoRef.current.load.then(() => {
        console.log('Piano samples loaded.');
      });
    }

    // Initialize flashcard mode if not in drill mode
    if (!isDrillMode) {
      generateFlashcardQuestion();
    }

    return () => {
      // Clean up audio context on unmount
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isDrillMode, generateFlashcardQuestion]);

  const onPlayNote = (midiNumber: number) => {
    if (audioContextRef.current && pianoRef.current) {
      audioContextRef.current.resume().then(() => {
        pianoRef.current?.start({ note: midiNumber, velocity: 100 });
      });
    }

    if (currentNote === null) return;

    if (isDrillMode) {
      // Delegate to DrillMode's internal answer handling
      if (drillModeHandleAnswerRef.current) {
        drillModeHandleAnswerRef.current(midiNumber);
      }
    } else {
      // Flashcard mode
      if (midiNumber === currentNote) {
        setFeedback('Correct!');
        setShowFeedback(true);
        setTimeout(() => {
          generateFlashcardQuestion();
        }, 1000);
      } else {
        setFeedback('Try again!');
        setShowFeedback(true);
      }
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (feedback && showFeedback) {
      timer = setTimeout(() => {
        setFeedback(null);
        setShowFeedback(false);
      }, 1500); // Message visible for 1.5 seconds
    }
    return () => clearTimeout(timer);
  }, [feedback, showFeedback]);

  const onStopNote = (midiNumber: number) => {
    if (pianoRef.current) {
      pianoRef.current.stop(midiNumber);
    }
  };

  const displayedNoteSet = useMemo(() => {
    return availableNoteSets.find(set => set.id === selectedNoteSetId);
  }, [selectedNoteSetId, availableNoteSets]);

  const activeNoteSetForAccidentals = useMemo(() => {
    return PREDEFINED_NOTE_SETS.find(set => set.id === selectedNoteSetId);
  }, [selectedNoteSetId]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">Piano Flashcard Study</h1>
      <StatsDisplay />

      <div className="flex flex-row items-start w-full max-w-4xl mb-8"> {/* Container for FindThisNote and ControlPanel */}
        {currentNote !== null && (
          <div className="bg-gray-100 rounded-lg shadow-lg p-6 w-full max-w-sm mr-8"> {/* Find this note display */}
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Find this note</h2>
            <SheetMusicStaff 
              midiNumbers={[currentNote]} 
              noteHeadSize={30} 
              stemWidth={3} 
              stemLength={60} 
              ledgerLineLength={40} 
              clefColor="text-gray-800"
              sharpsAndFlats={getKeySignatureAccidentals(activeNoteSetForAccidentals ? activeNoteSetForAccidentals.name : '')}
              hideNoteLetter={isDrillMode}
              clefType={clefMode}
            />
          </div>
        )}
        
		<div className="flex-col">
			<DrillMode
			currentNote={currentNote}
			setCurrentNote={setCurrentNote}
			setActiveNotes={setActiveNotes}
			setFeedback={setFeedback}
			setShowFeedback={setShowFeedback}
			highlightKeyHint={highlightKeyHint}
			isDrillMode={isDrillMode}
			setIsDrillMode={setIsDrillMode}
			clefMode={clefMode}
			availableNoteSets={availableNoteSets}
			selectedNoteSetId={selectedNoteSetId}
			setSelectedNoteSetId={setSelectedNoteSetId}
			drillModeHandleAnswerRef={drillModeHandleAnswerRef}
			onClefModeChange={setClefMode}
			/>

			<div className="flex flex-col items-start">
			<HintControls
				highlightKeyHint={highlightKeyHint}
				setHighlightKeyHint={setHighlightKeyHint}
				labelNotesHint={labelNotesHint}
				setLabelNotesHint={setLabelNotesHint}
				isDrillMode={isDrillMode}
			/>
			</div>
		</div>

      </div>

      {/* Piano */}
      <div className="w-full max-w-4xl mb-8">
        <CustomKeyboard
          noteRange={noteRange}
          onPlayNoteInput={onPlayNote}
          onStopNoteInput={onStopNote}
          activeNotes={(!isDrillMode && highlightKeyHint && currentNote !== null) ? [currentNote] : []}
          hoveredNote={highlightKeyHint ? currentNote : null}
          showNoteLabels={labelNotesHint}
          width={800}
          onMouseEnter={(midiNumber) => setHoveredNote(midiNumber)}
          onMouseLeave={() => setHoveredNote(null)}
          highlightKeyHint={highlightKeyHint}
        />
      </div>

      {/* Note Set Display */}
      {displayedNoteSet && displayedNoteSet.id !== 'all-notes' && !isDrillMode && (
        <div className="w-full max-w-4xl mb-8">
          <NoteSetDisplay
            midiNumbers={displayedNoteSet.midiNumbers}
            name={displayedNoteSet.name}
            title={`Notes in ${displayedNoteSet.name}`}
            clefType={clefMode}
          />
        </div>
      )}

      {feedback && showFeedback && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 text-4xl font-bold transition-opacity duration-500 ease-in-out ${feedback === 'Correct!' ? 'text-green-500' : 'text-red-500'} opacity-100 bg-gray-800 p-4 rounded-lg shadow-lg z-50`}>
          {feedback}
        </div>
      )}
    </div>
  );
};

export default PianoFlashcardLearner;
