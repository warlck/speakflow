# AI Agent Guidelines (AGENTS.md)

Welcome! This document defines the standard operating procedures, guidelines, and defaults for AI coding agents working on the **SpeakFlow** repository. All agents must adhere strictly to these principles to maintain code quality, ease of review, and stability.

---

## 1. Branching Strategy
- **Feature Isolation:** Every new feature, bug fix, refactoring, or documentation change **MUST** be developed on its own dedicated Git branch.
- **Naming Convention:** Use clear prefixing:
  - `feature/short-description` for new features or enhancements.
  - `bugfix/short-description` for bug fixes.
  - `refactor/short-description` for refactoring.
  - `docs/short-description` for documentation updates.
- **Workflow:**
  1. Before making any changes, check the current branch status.
  2. Create and switch to a new branch: `git checkout -b feature/your-feature-name`.
  3. Never commit directly to `main` or the default development branch.

---

## 2. Commit Sizing and Frequency (Small Commits Only)
- **NO HUGE COMMITS:** We do NOT allow large, monolithic commits. They are impossible to review.
- **Commit Granularity:** Make small, logical, atomic commits. A single commit should cover one specific, self-contained change (e.g., adding a single test, implementing a helper function, updating a config file).
- **Conventional Commits:** Write clean, descriptive commit messages following the Conventional Commits specification. Use appropriate scopes to distinguish frontend and backend changes:
  - `feat(frontend): add speech rate analyzer React component`
  - `feat(backend): add audio processing Go endpoint`
  - `test(backend): add tests for speech rate calculation in Go`
  - `fix(frontend): handle audio permission denial in React UI`
- **Frequency:** Commit frequently. Once a test is written and failing: commit. Once the test passes: commit.

---

## 3. Test-Driven Development (TDD) & Self-Verification
All code changes must be self-verifiable. Agents must write tests *before* writing the functional code.
- **Write Tests First:** Do not write functional implementation before writing corresponding test cases. Define the expectations through tests first.
- **Failing Phase:** Run the tests to confirm they fail (or fail to compile/run) as expected for the right reasons.
- **Passing Phase:** Implement the minimal code necessary to make the tests pass.
- **Refactoring Phase:** Clean up the implementation while keeping tests green.

### Recommended Test Stack
- **Frontend (React):** The recommended testing framework is **Vitest** (for Vite-based setups) or **Jest**. If tests are not configured in `package.json`, the first task should be to set up Vitest.
- **Backend (Go):** Use the standard library `testing` package (along with testify/assert if needed). Set up tests using standard Go patterns.

---

## 4. Testing & Regression Prevention
- **Run All Tests:** Before submitting any change or finalizing work, execute the full test suites for both frontend and backend to verify that existing functionality is not broken:
  - **Frontend tests:** `npm run test` or equivalent.
  - **Backend tests:** `go test ./...`
- **Zero Failures:** Code must not be proposed if there is a single failing test.
- **Validation:** Check the application builds locally to ensure correctness:
  - **Frontend build:** `npm run build`
  - **Backend build:** `go build ./...`

---

## 5. Design, Planning & Progress Documentation
All changes must be thoroughly documented, and progress must be tracked in real-time.
- **Implementation & Design Docs:** Before writing code, document planned changes in an implementation plan or design document (e.g., `docs/design/feature-name.md` or a root-level `implementation_plan.md` / `task.md` if using planning mode).
- **Track Progress:** Document the step-by-step progress of your work in the exact same design/implementation document. Mark completed tasks, in-progress tasks, and blockers explicitly.
- **Structure of Design/Implementation Document:**
  - **Goal / Problem Statement**
  - **Proposed Changes & Architecture** (demarcate frontend React changes vs. backend Go changes)
  - **Verification Plan (Automated and Manual)**
  - **Task List / Progress Tracker** (e.g., checkboxes `- [x]` for completed and `- [ ]` for pending tasks).

---

## 6. Development & Quality Guidelines
- **Maintain Comments:** Preserve existing comments and docstrings unless they are directly contradicted by your new implementation. Do not delete explanatory context.
- **SEO & Accessibility:**
  - Follow proper semantic HTML structures (one `<h1>` per page, interactive elements have unique and descriptive `id` attributes).
  - Use modern styling, avoiding raw placeholders.
- **Local Dev Servers:**
  - **Frontend:** Run `npm run dev` to start the React development server.
  - **Backend:** Run the Go server using `go run main.go` or the repository's specified run script.
