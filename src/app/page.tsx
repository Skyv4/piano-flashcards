'use client';

import { Suspense } from 'react';
import PianoFlashcardLearner from '../components/PianoFlashcardLearner';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <PianoFlashcardLearner />
      </Suspense>
    </main>
  );
}