Problem
SpeakFlow currently measures and drills public speaking but never teaches. There is no curriculum, no concept explanations, no worked examples, and no guided progression, so the product feels like a barebones evaluator instead of a public speaking training platform.
Current State
Frontend: React 18 + Vite, manual view switching through currentView in frontend/src/App.jsx:10, styling via frontend/src/styles/glass.module.css and CSS variables in frontend/src/index.css, and tests via Vitest + Testing Library.
Shared state: frontend/src/context/AppContext.jsx holds activeOutline and sessionHistory, but does not track learning progress.
Existing views: frontend/src/components/Dashboard.jsx records a speech and requests AI evaluation, frontend/src/components/Outliner.jsx offers two speech templates, and frontend/src/components/Drills.jsx offers three timed drills without recording or coaching.
Backend: Go + Gin with one AI route, POST /api/evaluate, implemented in backend/handlers/evaluate.go and registered from backend/main.go. There is no database or persistence layer today, so any content would otherwise have to ship inside the frontend bundle.
Confirmed Product Direction
Build both a Learn hub and contextual teaching inside existing practice flows.
Serve lessons dynamically from a backend database so curated content can be continuously improved, expanded, and re-sourced without a frontend redeploy; AI-powered, concept-specific coaching layers on top.
Do not design premium gating or paid-tier restrictions in this iteration.
Proposed Changes
1. Lesson data store (backend)
Add a persistence layer to the Go backend using SQLite via the CGO-free modernc.org/sqlite driver with database/sql, so local development needs no external services. Create modules and lessons tables (lesson fields include id, module_id, title, summary, estimated_minutes, a body JSON column for teaching blocks/examples/takeaways, related_drill, practice_prompt, position, and updated_at). Run schema migration on startup and put data access behind a thin repository in backend/store so the datastore can later be swapped for PostgreSQL.
2. Seed and content pipeline
Keep a version-controlled seed at backend/data/lessons_seed.json as the source of truth for curated lessons and upsert it into the database on startup (idempotent by lesson id), so lessons can be continuously revised in-repo and shipped without a frontend rebuild. Seed the first three modules mapped to existing capabilities: Lead with Impact (BLUF), Speak with Conviction (de-hedging), and Structure & Rhetoric (Rule of Three plus outline templates).
3. Lesson API endpoints
Add read endpoints in backend/handlers/lessons.go and register them in backend/main.go: GET /api/modules, GET /api/lessons (optionally filtered by moduleId), and GET /api/lessons/:id. Include an admin upsert POST /api/lessons behind a clearly marked auth-later TODO so new and improved lessons can be added at runtime.
4. AI-assisted lesson generation
Add POST /api/lessons/generate in backend/handlers/lesson_generate.go that accepts a topic (plus optional moduleId, audience, and difficulty) and uses Gemini with a curriculum-designer system prompt to draft a lesson in the exact lessons.body schema (teaching blocks, before/after examples, key takeaways, practice prompt). The endpoint returns the draft for review rather than auto-publishing; saving a draft reuses the section 3 upsert so AI output flows through the same validation and store. Reuse the existing genai client pattern from backend/handlers/evaluate.go.
5. Frontend curriculum data layer
Replace the static-file approach with a frontend/src/hooks/useCurriculum.js hook that fetches modules and lessons from the backend using VITE_API_URL and exposes loading, error, and empty states. Components read curriculum data from this hook rather than a bundled file.
6. Learning progress state
Extend frontend/src/context/AppContext.jsx with activeLessonId, setActiveLessonId, completedLessons, markLessonComplete(id), and isLessonComplete(id). Persist completed lessons and session history to localStorage so progress survives reloads without introducing user accounts yet; lesson ids referenced here come from the API.
7. Learn Hub and Lesson UI
Add frontend/src/components/Learn.jsx as the academy home with module cards, lesson lists, completion indicators, a progress summary, loading/error handling, and a continue-learning call to action. Add frontend/src/components/Lesson.jsx to render concept explanations, before/after examples, key takeaways, and navigation actions such as mark complete, next lesson, and practice this now. Wire both views into frontend/src/App.jsx and add a Learn navigation button to frontend/src/components/Dashboard.jsx.
8. Contextual teaching tie-ins
Update frontend/src/components/Drills.jsx so each drill includes a short why-this-matters explanation and a Learn the concept action that opens the matching lesson. Update frontend/src/components/Outliner.jsx so each outline template links to the lesson explaining that structure. Update frontend/src/components/Dashboard.jsx so an evaluation can recommend a relevant lesson from weak signals, such as high hedging count recommending the de-hedging lesson.
9. Targeted AI coaching endpoint
Add POST /api/coach in backend/handlers/coach.go and register it from backend/main.go. The request should include conceptKey, scenario, and transcript; the response should include feedback, appliedConcept, suggestedRewrite, and tips. Use a concept-specific system prompt so the feedback teaches the user how to apply the concept, rather than only returning a generic score.
10. Drill coaching integration
Upgrade drills from timer-only exercises to recorded practice attempts using the existing speech recognition hook. When a user finishes a drill, submit the transcript to /api/coach and show targeted coaching, a suggested rewrite, and specific tips.
Verification Plan
Follow TDD (write tests before implementation). Backend: add Go tests for the lesson repository and lesson endpoints using a temporary SQLite database (seed upsert is idempotent, GET /api/lessons/:id returns 404 for unknown ids), plus /api/coach and /api/lessons/generate tests (invalid JSON returns 400, missing API key returns 500). Frontend: add Vitest tests for the useCurriculum fetch hook (loading/error/success via mocked fetch), learning progress persistence, and Learn/Lesson rendering.
Run npm run test, npm run build, go test ./..., and go build ./... before finishing.
Use a dedicated branch such as feature/learning-platform; if committing is requested later, use small conventional commits with the required co-author line.
Out of Scope
Authentication/authorization (including securing the admin lesson-upsert and lesson-generation endpoints), server-side per-user progress, payments and premium gating, and a full content-authoring/review CMS are intentionally deferred. AI lesson generation returns drafts for manual review rather than auto-publishing. Progress remains in localStorage, and PostgreSQL is the documented future migration target from the initial SQLite store.