# SpeakFlow — Implementation Handoff for Jules

**Context:** SpeakFlow is evolving into a commercial-grade **Executive Public Speaking Training Suite**. The application trains users to structure their thoughts with clarity, elegance, persuasion, and conviction (CEO-style communication).
**Architecture Pivot:** We are migrating from a Vanilla JS prototype to a decoupled architecture: **Golang Backend** + **React (Vite) Frontend**.

Jules, please follow this step-by-step implementation plan to execute the migration and build the new executive features.

---

## Phase 1: Repository Restructuring

The current repository (`~/Documents/projects/speakflow`) contains a Vanilla JS prototype in the root directory.
1. Create a `frontend` folder and a `backend` folder in the root directory.
2. Move the existing Vanilla JS files (currently in `/src`, `index.html`, `package.json`, etc.) into a temporary `legacy_prototype` folder for reference. You will extract logic (like the Web Speech API code and CSS) from there.

---

## Phase 2: Golang Backend Implementation (`/backend`)

The backend is responsible for secure AI processing and future-proofing for database integration.

1. **Initialize Module:** `go mod init speakflow-api`
2. **HTTP Router:** Set up a lightweight router (e.g., standard `net/http` with Go 1.22 routing, or `gin-gonic`).
3. **CORS:** Configure CORS to accept requests from the Vite frontend (`localhost:5173`).
4. **The `/api/evaluate` Endpoint:**
   - **Method:** `POST`
   - **Payload:** Accepts JSON containing the user's `transcript`, `outlineStructure`, `pacingMetrics` (WPM), and `hedgingCount`.
   - **Gemini Integration:** Use the official `google/generative-ai-go` SDK (or standard HTTP client) to securely call the Gemini API.
   - **System Prompt Requirements:** The AI MUST act as an **Elite Executive Communications Coach**. Instruct it to evaluate the transcript specifically for:
     - *Executive Presence*: Decisiveness, lack of fluff.
     - *Brevity & Conviction*: Penalty for hedging words.
     - *Structural Elegance*: Did they follow the outline? Did they use the Rule of Three?
   - **Response:** Return a structured JSON response to the frontend containing `overallAssessment`, `strengths`, `improvements`, and an `executiveScore`.

---

## Phase 3: React Frontend Implementation (`/frontend`)

The frontend is a modern SPA utilizing React for component-driven UI and Vanilla CSS (CSS Modules) to maintain the premium glassmorphism styling.

1. **Initialize Vite:** `npm create vite@latest frontend -- --template react`
2. **State Management:** Use React Context to manage `ApiKey`, `SessionHistory`, and `ActiveOutline`.
3. **Port Core Engines to Hooks:**
   - Review the legacy `src/speech.js` and `src/audio.js`.
   - Create `useSpeechRecognition.js` (wraps the browser's `SpeechRecognition` API).
   - Create `useAudioRecorder.js` (wraps `MediaRecorder` and saves to `IndexedDB`).
   - Create `useSpeechAnalyzer.js`. **CRITICAL ADDITION:** Add a "Hedging Tracker" that counts weak phrases ("I think", "maybe", "just", "sort of").
4. **Build UI Components:**
   - Use CSS Modules (e.g., `Dashboard.module.css`) to port the existing glassmorphism styles from the legacy `style.css`.
   - Build `<Dashboard />`, `<Settings />`, and `<FeedbackReport />` views.

---

## Phase 4: Executive Features Implementation

### 1. Executive Speech Outliner (`<Outliner />`)
Build a dedicated view for planning and practicing structured talks.
- **Templates:** Provide pre-filled structure templates:
  - *Vision-Strategy-Execution*
  - *Problem-Solution-Benefit*
- **Segmented Practice UI:** When the user clicks "Start Practice", show a clean interface displaying only the *current* outline segment's bullet points.
- Include a segment timer that flashes red if they exceed the allocated time for that specific point (CEOs respect time).
- Add "Next" / "Prev" buttons to transition between outline segments while the overarching speech recognition continues running.

### 2. Executive Rhetoric Drills (`<Drills />`)
Build interactive drill cards for the following exercises:
- **BLUF (Bottom Line Up Front):** 30s timer. Scenario: "Explain why we missed Q3 targets." The user must start their first sentence with the core conclusion.
- **De-Hedging:** Provide a weak prompt ("I think we might want to consider..."). The user must restate it with high conviction.
- **Rule of Three:** Provide a word ("Resilience"). The user has 45s to describe it using three parallel phrases.

---

## Deployment & Verification
- Ensure the React frontend correctly proxies or fetches from the Go backend port (e.g., `8080`).
- Test the full flow: Select an Executive Outline -> Add notes -> Start Practice -> Speak -> End Practice -> Frontend sends data to Go Backend -> Go Backend queries Gemini -> React displays the Executive Coaching Report.
