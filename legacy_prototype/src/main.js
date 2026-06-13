import { SpeechEngine } from './speech.js';
import { AudioRecorder, AudioDB } from './audio.js';
import { analyzeSpeech, highlightTranscript, escapeHtml } from './analyzer.js';
import { getGeminiCoachingReport } from './gemini.js';
import { renderExerciseList, drawWaveform, renderCustomAudioPlayer } from './ui.js';
import { EXERCISES } from './exercises.js';

// State Management
const STATE = {
  currentView: 'dashboard',
  apiKey: localStorage.getItem('gemini_api_key') || '',
  sessions: JSON.parse(localStorage.getItem('sf_sessions') || '[]'),
  currentSession: {
    transcript: '',
    pauses: [],
    startTime: null,
    duration: 0,
    audioBlob: null
  },
  activeExercise: null,
  activeExerciseIndex: 0,
  exerciseTimer: null
};

// Engines Initializers
let speechEngine = null;
let audioRecorder = null;
let visualizerCleanup = null;
let visualizerAudioCtx = null;
let currentAudioUrl = null;

// DOM Selectors
const views = document.querySelectorAll('.view-section');
const navItems = document.querySelectorAll('.nav-item');
const apiStatusBadge = document.getElementById('api-status-badge');

// Router / View switching
function navigateTo(viewId) {
  STATE.currentView = viewId;
  views.forEach(view => {
    view.classList.toggle('active', view.id === viewId);
  });
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });

  if (viewId === 'dashboard') {
    renderDashboard();
  } else if (viewId === 'exercises') {
    renderExerciseList(document.getElementById('exercise-list-grid'), startExerciseWorkflow);
  }
}

// Handle sidebar active link highlighting and routing from hash change
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  if (['dashboard', 'practice', 'exercises', 'settings', 'feedback'].includes(hash)) {
    navigateTo(hash);
  }
});

// Setup Settings Page
const inputKey = document.getElementById('gemini-key');
const btnSaveSettings = document.getElementById('btn-save-settings');

function updateAPIKeyUI() {
  if (STATE.apiKey) {
    apiStatusBadge.className = 'api-badge connected';
    apiStatusBadge.innerText = 'Gemini Configured';
    inputKey.value = STATE.apiKey;
  } else {
    apiStatusBadge.className = 'api-badge missing';
    apiStatusBadge.innerText = 'Key Missing';
    inputKey.value = '';
  }
}

btnSaveSettings.addEventListener('click', () => {
  const newKey = inputKey.value.trim();
  STATE.apiKey = newKey;
  localStorage.setItem('gemini_api_key', newKey);
  updateAPIKeyUI();
  alert('Settings Saved Successfully!');
  navigateTo('dashboard');
});

// Setup Free Practice Screen actions
const btnStartPractice = document.getElementById('btn-start-practice');
const btnStopPractice = document.getElementById('btn-stop-practice');
const transcriptBox = document.getElementById('transcript-box');
const liveWpmVal = document.getElementById('live-wpm');
const liveFillersVal = document.getElementById('live-fillers');
const livePausesVal = document.getElementById('live-pauses');

btnStartPractice.addEventListener('click', async () => {
  if (!SpeechEngine.isSupported()) {
    alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    return;
  }

  STATE.currentSession = {
    transcript: '',
    pauses: [],
    startTime: Date.now(),
    duration: 0,
    audioBlob: null
  };

  transcriptBox.innerHTML = '<span class="interim-transcript">Listening... start speaking now</span>';
  liveWpmVal.innerText = '0';
  liveFillersVal.innerText = '0';
  livePausesVal.innerText = '0';

  btnStartPractice.disabled = true;
  btnStopPractice.disabled = false;

  // Initialize Audio Recorder first — mic permission may be denied
  try {
    audioRecorder = new AudioRecorder();
    await audioRecorder.start();
  } catch (err) {
    alert('Microphone access is required to record practice sessions: ' + err.message);
    btnStartPractice.disabled = false;
    btnStopPractice.disabled = true;
    return;
  }

  // Initialize Speech recognition
  speechEngine = new SpeechEngine(
    (final, interim) => {
      if (final) STATE.currentSession.transcript += ' ' + final;
      transcriptBox.innerHTML = highlightTranscript(STATE.currentSession.transcript) + 
        ` <span class="interim-transcript">${escapeHtml(interim)}</span>`;
      
      // Calculate live stats
      const seconds = (Date.now() - STATE.currentSession.startTime) / 1000;
      const stats = analyzeSpeech(STATE.currentSession.transcript, seconds, STATE.currentSession.pauses);
      liveWpmVal.innerText = stats.wpm;
      liveFillersVal.innerText = stats.totalFillers;
    },
    (pauseEvent) => {
      STATE.currentSession.pauses.push(pauseEvent);
      livePausesVal.innerText = STATE.currentSession.pauses.length;
    }
  );

  speechEngine.start();

  // Draw simple waveform visualizer
  const canvas = document.getElementById('visualizer');
  visualizerAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = visualizerAudioCtx.createMediaStreamSource(audioRecorder.stream);
  const analyser = visualizerAudioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  visualizerCleanup = drawWaveform(canvas, visualizerAudioCtx, analyser);
});

btnStopPractice.addEventListener('click', async () => {
  btnStopPractice.disabled = true;
  btnStartPractice.disabled = false;

  if (speechEngine) speechEngine.stop();
  if (visualizerCleanup) {
    visualizerCleanup();
    visualizerCleanup = null;
  }
  if (visualizerAudioCtx) {
    visualizerAudioCtx.close();
    visualizerAudioCtx = null;
  }

  const blob = audioRecorder ? await audioRecorder.stop() : null;
  STATE.currentSession.audioBlob = blob;
  STATE.currentSession.duration = Math.round((Date.now() - STATE.currentSession.startTime) / 1000);

  // Trigger feedback report construction
  analyzeAndFetchCoachingReport();
});

// Shared renderer for the feedback report view
function renderReport(report, audioBlob) {
  const loadingEl = document.getElementById('feedback-report-loading');
  const contentEl = document.getElementById('feedback-report-content');
  loadingEl.style.display = 'none';
  contentEl.style.display = 'block';

  document.getElementById('rep-assessment').innerText = report.overallAssessment || '';
  document.getElementById('rep-tot-insights').innerText = report.wordRetrievalFeedback || '';

  document.getElementById('rep-strengths').innerHTML =
    (report.strengths || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
  document.getElementById('rep-improvements').innerHTML =
    (report.improvements || []).map(i => `<li>${escapeHtml(i)}</li>`).join('');

  // Setup Custom Audio playback controls
  const playerWrapper = document.getElementById('history-player-wrapper');
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
  if (audioBlob) {
    currentAudioUrl = URL.createObjectURL(audioBlob);
    renderCustomAudioPlayer(playerWrapper, currentAudioUrl);
  } else {
    playerWrapper.innerHTML = '';
  }
}

// Setup Coaching Report triggers
async function analyzeAndFetchCoachingReport() {
  navigateTo('feedback');
  const loadingEl = document.getElementById('feedback-report-loading');
  const contentEl = document.getElementById('feedback-report-content');

  loadingEl.style.display = 'block';
  contentEl.style.display = 'none';

  const stats = analyzeSpeech(
    STATE.currentSession.transcript,
    STATE.currentSession.duration,
    STATE.currentSession.pauses
  );

  const sessionId = 'session_' + Date.now();

  try {
    let report = null;
    if (STATE.apiKey) {
      report = await getGeminiCoachingReport(STATE.apiKey, {
        ...stats,
        transcript: STATE.currentSession.transcript
      });
    } else {
      // Offline fallback mock assessment when API key is missing
      report = {
        overallAssessment: "Great job completing your practice run. (Configure Gemini API Key in Settings to enable tailored AI coaching feedbacks!)",
        strengths: ["Clean audio captured", "Paced speech structure", "Good intent"],
        improvements: ["Um / Uh usage can be optimized", "Set up your Gemini Token for deep analysis", "Try Guided Exercises"],
        wordRetrievalFeedback: "We noticed some verbal pauses. SpeakFlow exercises will help stimulate rapid synaptic word association.",
        nextExercise: "Word Rescue"
      };
    }

    // Save audio recording in IndexedDB
    if (STATE.currentSession.audioBlob) {
      await AudioDB.saveAudio(sessionId, STATE.currentSession.audioBlob);
    }

    // Save metadata session logs to history
    const sessionRecord = {
      id: sessionId,
      timestamp: Date.now(),
      duration: STATE.currentSession.duration,
      transcript: STATE.currentSession.transcript,
      wpm: stats.wpm,
      fluencyScore: stats.fluencyScore,
      totScore: stats.totScore,
      totalFillers: stats.totalFillers,
      longPausesCount: stats.longPausesCount,
      report
    };

    STATE.sessions.unshift(sessionRecord);
    localStorage.setItem('sf_sessions', JSON.stringify(STATE.sessions));

    // Render findings
    renderReport(report, STATE.currentSession.audioBlob);

  } catch (err) {
    alert('Failed to analyze session: ' + err.message);
    navigateTo('dashboard');
  }
}

// Back to Dashboard button hook
document.getElementById('btn-back-dashboard').addEventListener('click', () => {
  navigateTo('dashboard');
});

// Setup Dashboard history viewer
function renderDashboard() {
  const histContainer = document.getElementById('history-container');
  const avgFluencyEl = document.getElementById('metric-avg-fluency');
  const avgRecallEl = document.getElementById('metric-avg-recall');
  const avgWpmEl = document.getElementById('metric-avg-wpm');

  if (STATE.sessions.length === 0) {
    histContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">No sessions recorded yet. Start a Practice session or Exercise!</p>`;
    avgFluencyEl.innerText = '0%';
    avgRecallEl.innerText = '0%';
    avgWpmEl.innerText = '0';
    return;
  }

  // Calculate Averages
  const totalF = STATE.sessions.reduce((a, b) => a + b.fluencyScore, 0);
  const totalR = STATE.sessions.reduce((a, b) => a + (100 - b.totScore), 0);
  const totalW = STATE.sessions.reduce((a, b) => a + b.wpm, 0);
  const len = STATE.sessions.length;

  avgFluencyEl.innerText = `${Math.round(totalF / len)}%`;
  avgRecallEl.innerText = `${Math.round(totalR / len)}%`;
  avgWpmEl.innerText = Math.round(totalW / len);

  histContainer.innerHTML = '';
  STATE.sessions.forEach(session => {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const date = new Date(session.timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    item.innerHTML = `
      <div>
        <div style="font-weight: 600;">Practice Session (${session.duration}s)</div>
        <div style="color: var(--text-muted); font-size: 0.8rem;">${date}</div>
      </div>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <span class="api-badge connected" style="background: rgba(139, 92, 246, 0.1); color: var(--accent-purple); border-color: rgba(139, 92, 246, 0.2)">
          ${session.wpm} WPM
        </span>
        <span class="api-badge connected">
          ${session.fluencyScore}% Fluency
        </span>
        <button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">Review</button>
      </div>
    `;

    // Hook click to load detailed history review
    item.querySelector('button').addEventListener('click', async () => {
      // Attempt to load corresponding audio recording from IndexedDB
      const blob = await AudioDB.getAudio(session.id);

      navigateTo('feedback');
      renderReport(session.report || {}, blob || null);
    });

    histContainer.appendChild(item);
  });
}

// Guided Exercise Workflow Manager
const activeContainer = document.getElementById('exercise-active-container');
const exerciseTitle = document.getElementById('active-ex-title');
const exerciseDesc = document.getElementById('active-ex-desc');
const exercisePrompt = document.getElementById('active-ex-prompt');
const exerciseTimer = document.getElementById('active-ex-timer');
const exerciseTranscriptBox = document.getElementById('ex-transcript-box');
const btnExNext = document.getElementById('btn-ex-next');
const btnExStop = document.getElementById('btn-ex-stop');

async function startExerciseWorkflow(exercise) {
  if (!SpeechEngine.isSupported()) {
    alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    return;
  }

  STATE.activeExercise = exercise;
  STATE.activeExerciseIndex = 0;
  
  document.getElementById('exercise-list-grid').style.display = 'none';
  activeContainer.style.display = 'block';

  exerciseTitle.innerText = `${exercise.icon} ${exercise.title}`;
  exerciseDesc.innerText = exercise.description;
  exerciseTranscriptBox.innerHTML = '<span class="interim-transcript">Ready... start speaking</span>';

  // One continuous session (recording + transcript) for the whole exercise
  STATE.currentSession = {
    transcript: '',
    pauses: [],
    startTime: Date.now(),
    duration: 0,
    audioBlob: null
  };

  try {
    audioRecorder = new AudioRecorder();
    await audioRecorder.start();
  } catch (err) {
    alert('Microphone access is required to run exercises: ' + err.message);
    exitExerciseView();
    return;
  }

  speechEngine = new SpeechEngine(
    (final, interim) => {
      if (final) STATE.currentSession.transcript += ' ' + final;
      exerciseTranscriptBox.innerHTML = highlightTranscript(STATE.currentSession.transcript) + 
        ` <span class="interim-transcript">${escapeHtml(interim)}</span>`;
    },
    (pauseEvent) => {
      STATE.currentSession.pauses.push(pauseEvent);
    }
  );
  speechEngine.start();

  showExercisePrompt();
}

function showExercisePrompt() {
  clearInterval(STATE.exerciseTimer);

  const ex = STATE.activeExercise;
  
  // If we reached the end of prompt list, complete the drill
  if (STATE.activeExerciseIndex >= ex.prompts.length) {
    completeExercise();
    return;
  }

  const promptObj = ex.prompts[STATE.activeExerciseIndex];
  
  if (ex.id === 'word-rescue') {
    exercisePrompt.innerText = `Clue: ${promptObj.clue}`;
    btnExNext.innerText = 'Show Answer 🔍';
  } else if (ex.id === 'synonym-sprint') {
    exercisePrompt.innerText = `List synonyms for: ${promptObj.word}`;
    btnExNext.innerText = 'Next Word ➡️';
  } else if (ex.id === 'story-chain') {
    exercisePrompt.innerText = `Use these words: ${promptObj.words.join(', ')}`;
    btnExNext.innerText = 'Complete Story ➡️';
  } else {
    exercisePrompt.innerText = promptObj.text;
    btnExNext.innerText = 'Next Topic ➡️';
  }

  // Set up exercise timer countdown
  let timeLeft = ex.duration;
  exerciseTimer.innerText = formatTime(timeLeft);
  STATE.exerciseTimer = setInterval(() => {
    timeLeft--;
    exerciseTimer.innerText = formatTime(Math.max(0, timeLeft));
    if (timeLeft <= 0) {
      clearInterval(STATE.exerciseTimer);
      STATE.activeExerciseIndex++;
      showExercisePrompt();
    }
  }, 1000);
}

async function completeExercise() {
  clearInterval(STATE.exerciseTimer);
  if (speechEngine) speechEngine.stop();

  STATE.currentSession.duration = Math.round((Date.now() - STATE.currentSession.startTime) / 1000);
  if (audioRecorder) {
    STATE.currentSession.audioBlob = await audioRecorder.stop();
  }

  exitExerciseView();
  analyzeAndFetchCoachingReport();
}

function exitExerciseView() {
  activeContainer.style.display = 'none';
  document.getElementById('exercise-list-grid').style.display = 'grid';
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

btnExNext.addEventListener('click', () => {
  const ex = STATE.activeExercise;
  const promptObj = ex.prompts[STATE.activeExerciseIndex];

  if (ex.id === 'word-rescue' && btnExNext.innerText.includes('Show Answer')) {
    exercisePrompt.innerText = `Clue: ${promptObj.clue}\n\nAnswer: ${promptObj.answer}`;
    btnExNext.innerText = 'Next Clue ➡️';
  } else {
    STATE.activeExerciseIndex++;
    showExercisePrompt();
  }
});

btnExStop.addEventListener('click', async () => {
  clearInterval(STATE.exerciseTimer);
  if (speechEngine) speechEngine.stop();
  if (audioRecorder) await audioRecorder.stop();
  
  exitExerciseView();
  navigateTo('exercises');
});

// App Initialization entry
function initApp() {
  updateAPIKeyUI();
  
  // Default routing
  const initHash = window.location.hash.replace('#', '') || 'dashboard';
  navigateTo(initHash);
}

initApp();
