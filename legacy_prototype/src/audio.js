// Simple IndexedDB database wrapper to save voice recordings locally
const DB_NAME = 'SpeakFlowAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioRecordings';

let dbInstance = null;

function getDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

export const AudioDB = {
  async saveAudio(sessionId, blob) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAudio(sessionId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(sessionId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteAudio(sessionId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }

  async start() {
    this.audioChunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
    this.mediaRecorder.start();
  }

  stop() {
    return new Promise((resolve) => {
      // Calling stop() on an inactive recorder throws InvalidStateError
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        resolve(null);
        return;
      }
      this.mediaRecorder.onstop = () => {
        // Use the recorder's actual mime type (e.g. audio/mp4 on Safari)
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        // Release mic stream
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        resolve(audioBlob);
      };
      this.mediaRecorder.stop();
    });
  }
}
