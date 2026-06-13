# SpeakFlow
SpeakFlow is a browser-based speech training app that helps you practice fluency, track speaking metrics, and get AI coaching feedback.

## Prerequisites
- Node.js 18+ (Node.js 20+ recommended)
- npm
- A modern browser with microphone access (Chrome, Edge, or Safari recommended)

## Setup
Install project dependencies:

```bash
npm install
```

## Run the app (development)
Start the Vite dev server:

```bash
npm run dev
```

The app runs on `http://localhost:3000` and should open automatically.

## Configure Gemini AI feedback (optional)
1. Open the app.
2. Go to **Settings**.
3. Paste your Gemini API key.
4. Click **Save Settings**.

If no API key is configured, the app still runs with a built-in fallback coaching report.

## Build for production
Create a production build:

```bash
npm run build
```

Build output is generated in the `dist/` folder.

## Preview production build
Run the production preview server:

```bash
npm run preview
```

## Troubleshooting
- If recording does not start, verify microphone permissions in your browser settings.
- If speech recognition is unavailable, switch to a supported browser (Chrome, Edge, or Safari).
