# SpeakFlow

SpeakFlow is a decoupled web application designed to help you practice public speaking fluency, track speech metrics, and receive AI-driven coaching feedback. It features a modern, sleek glassmorphism dashboard built with React (Vite) and a secure, performant Go backend integrated with the Gemini API.

---

## Prerequisites
- **Node.js** 18+ (Node.js 20+ recommended) and **npm**
- **Go** 1.21+
- A modern web browser with microphone access (Chrome, Edge, or Safari recommended)

---

## Repository Structure
- `/frontend`: React SPA built with Vite, utilizing React Context state and custom Glassmorphic CSS modules.
- `/backend`: Go API server built with the Gin HTTP framework and the official Google Generative AI SDK.
- `/legacy_prototype`: The original Vanilla JS static prototype.

---

## Quick Start (via Makefile)
Exposes simple commands to setup, build, test, and run the frontend and backend concurrently.

1. **Setup dependencies:**
   ```bash
   make setup
   ```

2. **Configure Gemini API Key:**
   Configure your key as an environment variable in your terminal:
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key"
   ```

3. **Run the full application:**
   ```bash
   make run
   ```
   This command starts both the Go API (`http://localhost:8080`) and Vite web application (`http://localhost:5173`) concurrently.

4. **Stop the application cleanly:**
   ```bash
   make stop
   ```
   This command terminates any active frontend and backend server processes and frees the ports.

5. **Run both test suites:**
   ```bash
   make test
   ```

6. **Build for production:**
   ```bash
   make build
   ```

For help and other commands, run `make help`.

---

## Backend Setup & Run

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Configure your Gemini API key:
   Set the key as an environment variable in your terminal:
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key"
   ```

3. Run the Go backend server:
   ```bash
   go run main.go
   ```
   The backend server will run on `http://localhost:8080`.

4. Run backend tests:
   ```bash
   go test ./...
   ```

---

## Frontend Setup & Run

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will run on `http://localhost:5173`.

4. Run frontend tests:
   ```bash
   npm run test
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## Full Application Execution
To run and test the complete decoupled application:
1. Start the Go backend in one terminal session with your `GEMINI_API_KEY` configured.
2. Start the Vite frontend in a second terminal session.
3. Open `http://localhost:5173` in your browser.
