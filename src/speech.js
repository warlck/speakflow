export class SpeechEngine {
  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  constructor(onResultCallback, onPauseDetectedCallback) {
    this.recognition = null;
    this.isListening = false;
    this.onResultCallback = onResultCallback;
    this.onPauseDetectedCallback = onPauseDetectedCallback;
    this.lastSpeechTime = Date.now();
    this.pauseThreshold = 1500; // 1.5 seconds threshold
    this.timerId = null;

    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const now = Date.now();
      const delay = now - this.lastSpeechTime;
      
      // If there was a substantial pause before final speech was emitted, notify
      if (finalTranscript.trim().length > 0 && this.lastSpeechTime > 0 && delay > this.pauseThreshold) {
        this.onPauseDetectedCallback({
          duration: delay / 1000,
          timestamp: now
        });
      }

      this.lastSpeechTime = now;
      this.onResultCallback(finalTranscript, interimTranscript);
    };

    this.recognition.onerror = (event) => {
      // Permission errors are fatal; stop trying to restart
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.isListening = false;
      }
      console.error('Speech recognition error:', event.error);
    };

    this.recognition.onend = () => {
      // Auto-restart if we intended to keep listening
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          // Recognition was already restarted; ignore
        }
      }
    };
  }

  start() {
    if (!this.recognition) return;
    this.isListening = true;
    this.lastSpeechTime = Date.now();
    try {
      this.recognition.start();
    } catch (e) {
      console.error(e);
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
