import React, { useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechAnalyzer } from '../hooks/useSpeechAnalyzer';
import { useAppContext } from '../context/AppContext';
import { Mic, Square, Settings, Layout, Presentation, Play } from 'lucide-react';
import glassStyles from '../styles/glass.module.css';

const Dashboard = ({ setCurrentView }) => {
  const { isListening, transcript, startListening, stopListening, error, setTranscript } = useSpeechRecognition();
  const { analyzeTranscript, hedgingCount, wpm } = useSpeechAnalyzer();
  const { apiKey, activeOutline } = useAppContext();

  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [report, setReport] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleStart = () => {
    setTranscript('');
    setReport(null);
    setStartTime(Date.now());
    startListening();
  };

  const handleStop = async () => {
    stopListening();
    const currentDuration = (Date.now() - startTime) / 1000;
    setDuration(currentDuration);

    const analysis = analyzeTranscript(transcript, currentDuration);

    if (transcript.trim().length > 0) {
      await evaluateSpeech(transcript, analysis.wpm, analysis.hedgingCount);
    }
  };

  const evaluateSpeech = async (text, wpmVal, hedgesVal) => {
    setIsEvaluating(true);
    try {
      const outline = activeOutline ? activeOutline.segments.map(s => s.title) : [];

      const payload = {
        transcript: text,
        outlineStructure: outline,
        pacingMetrics: wpmVal,
        hedgingCount: hedgesVal
      };

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReport(data);
    } catch (e) {
      console.error("Evaluation failed:", e);
      setReport({
        error: "Failed to evaluate speech. Please check your backend connection and API key."
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className={glassStyles.page}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Presentation /> SpeakFlow Executive
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={glassStyles.button} onClick={() => setCurrentView('outliner')}>
            <Layout size={18} style={{ marginRight: '0.5rem' }} /> Outliner
          </button>
          <button className={glassStyles.button} onClick={() => setCurrentView('drills')}>
            <Play size={18} style={{ marginRight: '0.5rem' }} /> Drills
          </button>
          <button className={glassStyles.button} onClick={() => setCurrentView('settings')}>
            <Settings size={18} style={{ marginRight: '0.5rem' }} /> Settings
          </button>
        </div>
      </header>

      {!apiKey && (
        <div className={glassStyles.container} style={{ marginBottom: '2rem', backgroundColor: 'rgba(255, 100, 100, 0.2)' }}>
          <p>Please configure your Gemini API Key in Settings to enable AI evaluation.</p>
        </div>
      )}

      {error && (
        <div className={glassStyles.container} style={{ marginBottom: '2rem', backgroundColor: 'rgba(255, 100, 100, 0.2)' }}>
          <p>Speech Recognition Error: {error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className={glassStyles.container}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Practice Session</h2>
            {isListening ? (
              <button className={glassStyles.button} onClick={handleStop} style={{ backgroundColor: 'rgba(255, 50, 50, 0.3)' }}>
                <Square size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Stop
              </button>
            ) : (
              <button className={glassStyles.button} onClick={handleStart} style={{ backgroundColor: 'rgba(50, 255, 50, 0.3)' }}>
                <Mic size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Start
              </button>
            )}
          </div>

          <div style={{ minHeight: '200px', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1rem' }}>
            {transcript || <span style={{ opacity: 0.5 }}>Start speaking...</span>}
          </div>

          {isEvaluating && <p>Evaluating executive presence...</p>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={glassStyles.container}>
            <h3>Live Metrics</h3>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Hedging Words:</span>
                <span style={{ fontWeight: 'bold', color: hedgingCount > 2 ? '#ff6b6b' : '#4ecdc4' }}>{hedgingCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pacing (WPM):</span>
                <span style={{ fontWeight: 'bold' }}>{wpm}</span>
              </div>
            </div>
          </div>

          {activeOutline && (
            <div className={glassStyles.container}>
              <h3>Active Outline</h3>
              <p style={{ fontWeight: 'bold', margin: '0.5rem 0' }}>{activeOutline.title}</p>
              <ul style={{ paddingLeft: '1.5rem', opacity: 0.8 }}>
                {activeOutline.segments.map((s, i) => (
                  <li key={i}>{s.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {report && (
        <div className={glassStyles.container} style={{ marginTop: '2rem' }}>
          <h2>Executive Evaluation Report</h2>
          {report.error ? (
            <p style={{ color: '#ff6b6b', marginTop: '1rem' }}>{report.error}</p>
          ) : (
            <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>Executive Score:</span>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: report.executiveScore > 80 ? '#4ecdc4' : '#ffce56' }}>{report.executiveScore}/100</span>
              </div>
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Overall Assessment</h4>
                <p style={{ opacity: 0.9 }}>{report.overallAssessment}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>Strengths</h4>
                  <ul style={{ paddingLeft: '1.5rem', opacity: 0.9 }}>
                    {report.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 style={{ color: '#ff6b6b', marginBottom: '0.5rem' }}>Areas for Improvement</h4>
                  <ul style={{ paddingLeft: '1.5rem', opacity: 0.9 }}>
                    {report.improvements?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
