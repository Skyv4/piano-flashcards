'use client';

import PianoFlashcardLearner from '../components/PianoFlashcardLearner';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <PianoFlashcardLearner />
    </main>
  );
}