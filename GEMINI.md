# GEMINI.md

This document outlines conventions and considerations for interacting with the `piano-learner` project using the Gemini CLI agent.

## Project Structure

The project follows a standard Next.js application structure:

- `src/app/`: Main application pages and routing.
- `src/components/`: Reusable React components, including `SheetMusicDisplay.tsx`, `MultiNoteSheetMusicDisplay.tsx`, `NoteSetDisplay.tsx`, `CustomKey.tsx`, and `CustomKeyboard.tsx`.
- `src/utils/`: Utility functions, such as `noteUtils.ts` for note name conversion and scale generation, and `noteSets.ts` for predefined musical note sets.
- `public/`: Static assets.

## Key Components and Logic

- **`PianoFlashcardLearner.tsx`**: The main component orchestrating the flashcard and drill mode logic. It manages state for the current note, feedback, active notes, and selected note sets.
- **`SheetMusicDisplay.tsx`**: Renders a single musical note on a staff. It now uses shared `Note` component logic for consistent rendering with `MultiNoteSheetMusicDisplay.tsx`.
- **`MultiNoteSheetMusicDisplay.tsx`**: A new component responsible for rendering multiple musical notes on a single staff, with horizontal spacing and parameterized sizing. It includes a `Note` sub-component for individual note rendering.
- **`NoteSetDisplay.tsx`**: Displays a visual representation of a selected note set, utilizing `MultiNoteSheetMusicDisplay.tsx` to show all notes in the set.
- **`noteUtils.ts`**: Provides utility functions like `getNoteName` (converts MIDI number to note name), `getMajorScaleNotes` (generates MIDI numbers for a major scale), and `isAccidental` (checks if a note is an accidental).
- **`noteSets.ts`**: Defines the `NoteSet` interface and `PREDEFINED_NOTE_SETS`, which are used to populate the drill mode options.
- **`CustomKey.tsx`**: Represents an individual piano key, used within `CustomKeyboard.tsx`.
- **`CustomKeyboard.tsx`**: A custom piano keyboard component that integrates with `react-piano` and allows for custom styling and behavior.

## Development Workflow with Gemini

When making changes or adding features, consider the following:

- **Component Reusability**: Prioritize creating reusable components (e.g., the `Note` component within `SheetMusicDisplay` and `MultiNoteSheetMusicDisplay`) to maintain a clean and modular codebase.
- **Styling**: Tailwind CSS is used for styling. Adhere to existing utility-first class conventions. Ensure that dynamically generated Tailwind classes are correctly processed by including relevant files in `tailwind.config.ts`'s `content` array.
- **State Management**: React's `useState`, `useEffect`, `useCallback`, and `useMemo` hooks are used for local component state and performance optimization.
- **Error Handling**: Be mindful of potential edge cases, especially when dealing with user input or data retrieval (e.g., handling empty note sets).
- **Testing**: While not explicitly set up with a testing framework yet, consider how changes can be verified manually or through future automated tests.

## Common Tasks for Gemini

- **Refactoring**: Identifying opportunities to refactor redundant code or improve component structure.
- **Feature Implementation**: Adding new modes, note sets, or display options.
- **Bug Fixing**: Addressing runtime errors or unexpected behavior.
- **UI/UX Enhancements**: Improving the visual appeal and user interaction.

## Important Notes

- **Absolute Paths**: When using file system tools, always provide absolute paths (e.g., `/home/a112/Documents/Code/me/piano-learner/src/components/SheetMusicDisplay.tsx`).
- **Context**: Always read relevant files and understand the existing code patterns before making modifications.

## Future TODOs

### TODO 1: Implement Treble Clef Perspective and Toggle (COMPLETED)

**Summary:** Implemented a clef toggle in `PianoFlashcardLearner.tsx` that allows users to switch between treble and bass clef perspectives. `SheetMusicStaff.tsx` was updated to dynamically render the appropriate clef and adjust note positioning based on the selected clef. The `NoteSet` interface in `src/utils/noteSets.ts` was extended with a `clef` property, and `PREDEFINED_NOTE_SETS` were updated to include clef-specific assignments. The available drill sets are now filtered based on the active clef mode.

### TODO 2: Re-arrange UI Elements (COMPLETED)

**Summary:** The "Find this Note" display, control buttons, and the piano keyboard were re-arranged in `PianoFlashcardLearner.tsx` to move the display and keyboard to the top of the page, with controls below them. Layout and styling were adjusted accordingly.

### TODO 3: Animate Feedback Messages (COMPLETED)

**Summary:** Implemented state-driven animation for feedback messages in `PianoFlashcardLearner.tsx`. Added a `showFeedback` state and `useEffect` to control the visibility and auto-hide the messages after a short duration. Applied Tailwind CSS classes for fade-in/fade-out effect and centering.
