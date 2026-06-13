# Implementation Tracker

## Goal / Problem Statement
Migrate SpeakFlow from a Vanilla JS prototype to a decoupled architecture (Golang Backend + React Vite Frontend) and implement new executive public speaking features with a modern, sleek UI.

## Proposed Changes & Architecture

### Repository Restructuring
- [x] Create `frontend` directory.
- [x] Create `backend` directory.
- [x] Move existing Vanilla JS prototype to `legacy_prototype` directory.

### Phase 2: Golang Backend Implementation (`/backend`)
- [x] Initialize module `speakflow-api`.
- [x] Set up HTTP router (`net/http` or `gin-gonic`).
- [x] Configure CORS for frontend.
- [x] Implement `/api/evaluate` endpoint.
  - [x] Accept JSON payload (`transcript`, `outlineStructure`, `pacingMetrics`, `hedgingCount`).
  - [x] Integrate with Gemini API using Elite Executive Communications Coach system prompt.
  - [x] Return structured JSON (`overallAssessment`, `strengths`, `improvements`, `executiveScore`).
- [x] Write backend tests.

### Phase 3: React Frontend Implementation (`/frontend`)
- [x] Initialize Vite React frontend.
- [x] Set up State Management (React Context).
- [x] Port Core Engines to Hooks.
  - [x] `useSpeechRecognition.js`
  - [ ] `useAudioRecorder.js` (Not needed currently, using SpeechRecognition)
  - [x] `useSpeechAnalyzer.js` with Hedging Tracker.
- [x] Build UI Components (Modern, Sleek, Glassmorphism).
  - [x] `<Dashboard />`
  - [x] `<Settings />`
  - [x] `<FeedbackReport />`
- [ ] Write frontend tests.

### Phase 4: Executive Features Implementation
- [x] Executive Speech Outliner (`<Outliner />`).
  - [x] Templates.
  - [x] Segmented Practice UI.
  - [x] Segment timers.
  - [x] Navigation.
- [x] Executive Rhetoric Drills (`<Drills />`).
  - [x] BLUF Drill.
  - [x] De-Hedging Drill.
  - [x] Rule of Three Drill.

## Verification Plan (Automated and Manual)
- [ ] Frontend tests passing (`npm run test`).
- [ ] Backend tests passing (`go test ./...`).
- [ ] Verify frontend build (`npm run build`).
- [ ] Verify backend build (`go build ./...`).
- [ ] Manual full flow testing.
