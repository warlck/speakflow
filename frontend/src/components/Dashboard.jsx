import React, { useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechAnalyzer } from '../hooks/useSpeechAnalyzer';
import { useAppContext } from '../context/AppContext';
import { Mic, Square, Layout, Presentation, Play, BookOpen } from 'lucide-react';
import glassStyles from '../styles/glass.module.css';
import { useCurriculum } from '../hooks/useCurriculum';

const Dashboard = ({ setCurrentView }) => {
  const { isListening, transcript, startListening, stopListening, error, setTranscript } = useSpeechRecognition();
  const { analyzeTranscript, hedgingCount, fillerCount, wpm } = useSpeechAnalyzer();
  const { activeOutline, setActiveLessonId, isLessonComplete, completedLessons, addSession, sessionHistory, diagnosticResult, setDiagnosticResult } = useAppContext();
  const { modules, loading: currLoading } = useCurriculum();

  const [diagnosticStep, setDiagnosticStep] = useState('intro'); // 'intro', 'recording', 'analyzing', 'result'
  const [diagnosticGoal, setDiagnosticGoal] = useState('');
  const [diagnosticTimer, setDiagnosticTimer] = useState(60);

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
      await evaluateSpeech(transcript, analysis.wpm, analysis.hedgingCount, analysis.fillerCount);
    }
  };

  const evaluateSpeech = async (text, wpmVal, hedgesVal, fillersVal) => {
    setIsEvaluating(true);
    try {
      const outline = activeOutline ? activeOutline.segments.map(s => s.title) : [];

      const payload = {
        transcript: text,
        outlineStructure: outline,
        pacingMetrics: wpmVal,
        hedgingCount: hedgesVal,
        fillerCount: fillersVal
      };

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReport(data);

      // Persist the session so progress can be tracked over time.
      if (typeof addSession === 'function') {
        addSession({
          date: new Date().toISOString(),
          executiveScore: data.executiveScore,
          wpm: wpmVal,
          hedgingCount: hedgesVal,
          fillerCount: fillersVal
        });
      }
    } catch (e) {
      console.error("Evaluation failed:", e);
      setReport({
        error: "Failed to evaluate speech. Please check your backend connection and API key."
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleStartDiagnostic = () => {
    setDiagnosticStep('recording');
    setDiagnosticTimer(60);
    setTranscript('');
    startListening();
    
    // Auto stop after 60s
    const interval = setInterval(() => {
      setDiagnosticTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleStopDiagnostic();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopDiagnostic = () => {
    stopListening();
    setDiagnosticStep('analyzing');
    
    setTimeout(() => {
      // Analyze the locally generated transcript
      const analysis = analyzeTranscript(transcript, 60 - diagnosticTimer);
      
      let recommendedLessonId = 'lesson-bluf';
      let reason = 'Based on your goal, we recommend starting with executive clarity.';

      if (diagnosticGoal === 'anxiety') {
        recommendedLessonId = 'lesson-speaking-anxiety';
        reason = "Let's start by tackling presentation anxiety and building your confidence.";
      } else if (analysis.fillerCount > 4) {
        recommendedLessonId = 'lesson-filler-words';
        reason = `We detected ${analysis.fillerCount} filler words. Let's clean up your delivery.`;
      } else if (analysis.hedgingCount > 2) {
        recommendedLessonId = 'lesson-dehedging';
        reason = `We detected ${analysis.hedgingCount} hedges. Let's build more commanding conviction.`;
      } else if (analysis.wpm > 165) {
        recommendedLessonId = 'lesson-the-dials';
        reason = `Your pacing was fast (${Math.round(analysis.wpm)} WPM). Let's learn to control the delivery dials.`;
      }

      setDiagnosticResult({
        goal: diagnosticGoal,
        metrics: analysis,
        recommendation: {
          lessonId: recommendedLessonId,
          reason: reason
        }
      });
      setDiagnosticStep('intro'); // reset for future if needed, though it will unmount
    }, 1500);
  };

  if (!diagnosticResult) {
    return (
      <div className={glassStyles.page}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Presentation /> SpeakFlow Executive
          </h1>
        </header>
        
        <div className={glassStyles.container} style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '2rem' }}>
          {diagnosticStep === 'intro' && (
            <>
              <h2 style={{ marginBottom: '1rem', color: 'var(--accent-teal-light)' }}>Welcome to SpeakFlow</h2>
              <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Before we begin, let's establish a baseline. What is your primary communication goal?
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {[{id: 'anxiety', label: 'Overcome speaking anxiety'}, 
                  {id: 'clarity', label: 'Structure my thoughts clearly'}, 
                  {id: 'presence', label: 'Project executive presence'}].map(goal => (
                  <button 
                    key={goal.id}
                    onClick={() => setDiagnosticGoal(goal.id)}
                    className={glassStyles.button}
                    style={{
                      background: diagnosticGoal === goal.id ? 'var(--accent-teal-glow)' : 'transparent',
                      borderColor: diagnosticGoal === goal.id ? 'var(--accent-teal-light)' : 'var(--glass-border)'
                    }}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
              
              <button 
                className={glassStyles.button} 
                disabled={!diagnosticGoal}
                onClick={handleStartDiagnostic}
                style={{ background: 'var(--accent-teal-light)', color: 'var(--bg-primary)', fontWeight: 'bold', width: '100%' }}
              >
                Continue to Baseline Recording
              </button>
            </>
          )}

          {diagnosticStep === 'recording' && (
            <>
              <h2 style={{ marginBottom: '1rem', color: 'var(--accent-teal-light)' }}>Baseline Recording</h2>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Speak for up to 60 seconds. Tell us about a recent project you worked on, or what you did this weekend.
              </p>
              
              <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '2rem 0', color: diagnosticTimer < 10 ? 'var(--accent-coral-light)' : 'var(--text-primary)' }}>
                0:{diagnosticTimer.toString().padStart(2, '0')}
              </div>

              <div style={{ minHeight: '100px', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '2rem', textAlign: 'left', fontStyle: 'italic', opacity: 0.8 }}>
                {transcript || "Listening..."}
              </div>
              
              <button 
                className={glassStyles.button} 
                onClick={handleStopDiagnostic}
                style={{ background: 'var(--accent-coral-light)', color: 'var(--bg-primary)', fontWeight: 'bold', width: '100%' }}
              >
                Finish Early
              </button>
            </>
          )}

          {diagnosticStep === 'analyzing' && (
            <>
              <h2 style={{ marginBottom: '1rem', color: 'var(--accent-teal-light)' }}>Analyzing Baseline...</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Evaluating your pacing, filler words, and hedging...
              </p>
              <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: '50%', background: 'var(--accent-teal-light)', animation: 'pulse 1s infinite alternate' }} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={glassStyles.page}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Presentation /> SpeakFlow Executive
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={glassStyles.button} onClick={() => setCurrentView('learn')}>
            <BookOpen size={18} style={{ marginRight: '0.5rem' }} /> Learn
          </button>
          <button className={glassStyles.button} onClick={() => setCurrentView('outliner')}>
            <Layout size={18} style={{ marginRight: '0.5rem' }} /> Outliner
          </button>
          <button className={glassStyles.button} onClick={() => setCurrentView('drills')}>
            <Play size={18} style={{ marginRight: '0.5rem' }} /> Drills
          </button>
        </div>
      </header>

      {error && (
        <div className={glassStyles.container} style={{ marginBottom: '2rem', backgroundColor: 'rgba(255, 100, 100, 0.2)' }}>
          <p>Speech Recognition Error: {error}</p>
        </div>
      )}

      {!currLoading && modules.length > 0 && (
        <div className={glassStyles.container} style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.05), rgba(45, 212, 191, 0.02))', border: '1px solid rgba(45, 212, 191, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ color: 'var(--accent-teal-light)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} /> Your Coaching Journey
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                {completedLessons.length === 0
                  ? diagnosticResult?.recommendation?.reason || 'Start your executive communication training with Module 1.'
                  : `${completedLessons.length} lessons completed. Keep building your skills.`
                }
              </p>
            </div>
            <button
              className={glassStyles.button}
              onClick={() => {
                if (completedLessons.length === 0 && diagnosticResult?.recommendation?.lessonId) {
                  setActiveLessonId(diagnosticResult.recommendation.lessonId);
                }
                setCurrentView('learn');
              }}
              style={{
                background: 'var(--accent-teal-light)',
                color: 'var(--bg-primary)',
                fontWeight: '600',
                border: 'none',
                gap: '0.5rem',
              }}
            >
              <Play size={16} fill="currentColor" />
              {completedLessons.length === 0 ? 'Start Recommended Lesson' : 'Continue Training'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className={glassStyles.container}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Practice Session</h2>
            {isListening ? (
              <button className={glassStyles.button} onClick={handleStop} style={{ backgroundColor: 'var(--accent-coral-glow)', borderColor: 'var(--accent-coral-light)', color: 'var(--accent-coral-light)' }}>
                <Square size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Stop
              </button>
            ) : (
              <button className={glassStyles.button} onClick={handleStart} style={{ backgroundColor: 'var(--accent-teal-glow)', borderColor: 'var(--accent-teal-light)', color: 'var(--accent-teal-light)' }}>
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
                <span style={{ color: 'var(--text-secondary)' }}>Hedging Words:</span>
                <span style={{ fontWeight: 'bold', color: hedgingCount > 2 ? 'var(--accent-coral-light)' : 'var(--accent-teal-light)' }}>{hedgingCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Filler Words:</span>
                <span style={{ fontWeight: 'bold', color: fillerCount > 3 ? 'var(--accent-coral-light)' : 'var(--accent-teal-light)' }}>{fillerCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pacing (WPM):</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-platinum-light)' }}>{wpm}</span>
              </div>
            </div>
          </div>

          {sessionHistory && sessionHistory.length > 0 && (
            <div className={glassStyles.container}>
              <h3>Recent Sessions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                {sessionHistory.slice(-5).reverse().map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {s.date ? new Date(s.date).toLocaleDateString() : 'Session'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {s.wpm} wpm · {s.hedgingCount ?? 0} hedge · {s.fillerCount ?? 0} filler
                    </span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-teal-light)' }}>{s.executiveScore ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Executive Score:</span>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: report.executiveScore > 80 ? 'var(--accent-teal-light)' : 'var(--accent-amber-light)' }}>{report.executiveScore}/100</span>
              </div>
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Overall Assessment</h4>
                <p style={{ opacity: 0.9 }}>{report.overallAssessment}</p>
              </div>
              {hedgingCount > 2 && (
                <div style={{ background: 'rgba(251, 113, 133, 0.05)', border: '1px solid rgba(251, 113, 133, 0.2)', padding: '1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--accent-coral-light)', margin: 0 }}>Recommended Practice: Speak with Conviction</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>We detected {hedgingCount} hedging words in your speech. Take our lesson on de-hedging to improve conviction.</p>
                  </div>
                  <button
                    className={glassStyles.button}
                    onClick={() => {
                      setActiveLessonId('lesson-dehedging');
                      setCurrentView('lesson');
                    }}
                    style={{ background: 'var(--accent-coral-light)', color: 'var(--bg-primary)', fontWeight: 'bold', border: 'none' }}
                  >
                    Start Lesson
                  </button>
                </div>
              )}
              {fillerCount > 3 && (
                <div style={{ background: 'rgba(251, 113, 133, 0.05)', border: '1px solid rgba(251, 113, 133, 0.2)', padding: '1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--accent-coral-light)', margin: 0 }}>Recommended Practice: Eliminate Filler Words</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>We detected {fillerCount} filler words (um, uh, like, you know). Learn to replace them with confident pauses.</p>
                  </div>
                  <button
                    className={glassStyles.button}
                    onClick={() => {
                      setActiveLessonId('lesson-filler-words');
                      setCurrentView('lesson');
                    }}
                    style={{ background: 'var(--accent-coral-light)', color: 'var(--bg-primary)', fontWeight: 'bold', border: 'none' }}
                  >
                    Start Lesson
                  </button>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(45, 212, 191, 0.02)', border: '1px solid rgba(45, 212, 191, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--accent-teal-light)', marginBottom: '0.5rem' }}>Strengths</h4>
                  <ul style={{ paddingLeft: '1.2rem', opacity: 0.9, color: 'var(--text-primary)' }}>
                    {report.strengths?.map((s, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>)}
                  </ul>
                </div>
                <div style={{ background: 'rgba(251, 113, 133, 0.02)', border: '1px solid rgba(251, 113, 133, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--accent-coral-light)', marginBottom: '0.5rem' }}>Areas for Improvement</h4>
                  <ul style={{ paddingLeft: '1.2rem', opacity: 0.9, color: 'var(--text-primary)' }}>
                    {report.improvements?.map((s, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>)}
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
