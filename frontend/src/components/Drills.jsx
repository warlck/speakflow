import React, { useState, useCallback } from 'react';
import { ArrowLeft, Play, Square, CheckCircle } from 'lucide-react';
import glassStyles from '../styles/glass.module.css';
import { useAppContext } from '../context/AppContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const DRILLS = [
  {
    id: 'bluf',
    title: 'BLUF (Bottom Line Up Front)',
    scenario: 'Explain why we missed Q3 targets. Start with the core conclusion.',
    durationSecs: 30,
    explanation: 'Bottom Line Up Front keeps executives engaged by presenting recommendations first.',
    lessonId: 'lesson-bluf-core'
  },
  {
    id: 'dehedging',
    title: 'De-Hedging',
    scenario: 'Restate this with high conviction: "I think we might want to consider pivoting our strategy sort of soon..."',
    durationSecs: 20,
    explanation: 'Hedging language weakens your authority. Speak directly and confidently.',
    lessonId: 'lesson-dehedging-core'
  },
  {
    id: 'rule3',
    title: 'Rule of Three',
    scenario: 'Describe the core trait "Resilience" using three parallel, punchy phrases.',
    durationSecs: 45,
    explanation: 'Triads are highly memorable. Structure ideas in groups of three.',
    lessonId: 'lesson-rule-of-three'
  }
];

const Drills = ({ setCurrentView }) => {
  const { setActiveLessonId } = useAppContext();
  const { isListening, transcript, startListening, stopListening, error: speechError, setTranscript } = useSpeechRecognition();

  const [activeDrill, setActiveDrill] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [coachingReport, setCoachingReport] = useState(null);
  const [isCoachingLoading, setIsCoachingLoading] = useState(false);
  const [coachingError, setCoachingError] = useState(null);

  const getCoaching = useCallback(async (text) => {
    if (!text || text.trim().length === 0) return;
    setIsCoachingLoading(true);
    setCoachingError(null);
    setCoachingReport(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const payload = {
        conceptKey: activeDrill?.id || '',
        scenario: activeDrill?.scenario || '',
        transcript: text
      };
      const response = await fetch(`${apiUrl}/api/coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Coaching request failed with status: ${response.status}`);
      }
      const data = await response.json();
      setCoachingReport(data);
    } catch (err) {
      console.error(err);
      setCoachingError(err.message || 'Failed to fetch coaching feedback.');
    } finally {
      setIsCoachingLoading(false);
    }
  }, [activeDrill]);

  // Simplified timer logic for prototype
  React.useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsFinished(true);
      stopListening();
      getCoaching(transcript);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, stopListening, transcript, getCoaching]);

  const startDrill = (drill) => {
    setActiveDrill(drill);
    setTimeLeft(drill.durationSecs);
    setTranscript('');
    setCoachingReport(null);
    setCoachingError(null);
    setIsActive(true);
    setIsFinished(false);
    startListening();
  };

  const stopDrill = async () => {
    setIsActive(false);
    setIsFinished(true);
    stopListening();
    await getCoaching(transcript);
  };

  return (
    <div className={glassStyles.page}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button className={glassStyles.button} onClick={() => setCurrentView('dashboard')} style={{ marginRight: '1rem', padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1>Executive Rhetoric Drills</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className={glassStyles.container}>
          <h2 style={{ marginBottom: '1.5rem' }}>Select a Drill</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {DRILLS.map(drill => (
              <div
                key={drill.id}
                className={glassStyles.container}
                style={{
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  border: activeDrill?.id === drill.id ? '1px solid var(--accent-teal-light)' : '1px solid var(--glass-border)',
                  boxShadow: activeDrill?.id === drill.id ? '0 0 15px var(--accent-teal-glow)' : 'none',
                  background: activeDrill?.id === drill.id ? 'rgba(45, 212, 191, 0.04)' : 'transparent'
                }}
              >
                <h3 style={{ marginBottom: '0.5rem' }}>{drill.title}</h3>
                <p style={{ opacity: 0.8, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{drill.scenario}</p>
                <p style={{ opacity: 0.6, fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '1rem' }}>
                  <strong>Why it matters:</strong> {drill.explanation}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>{drill.durationSecs} seconds</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className={glassStyles.button}
                      onClick={() => {
                        setActiveLessonId(drill.lessonId);
                        setCurrentView('lesson');
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Learn the concept
                    </button>
                    <button
                      className={glassStyles.button}
                      onClick={() => startDrill(drill)}
                      disabled={isActive && activeDrill?.id !== drill.id}
                      style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Start Drill
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={glassStyles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '400px' }}>
          {activeDrill ? (
            <>
              <h2 style={{ marginBottom: '1rem', color: 'var(--accent-teal-light)' }}>{activeDrill.title}</h2>
              <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '2rem', width: '100%' }}>
                <p style={{ fontSize: '1.2rem', lineHeight: 1.5 }}>"{activeDrill.scenario}"</p>
              </div>

              <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '2rem', color: timeLeft <= 5 && timeLeft > 0 ? 'var(--accent-coral-light)' : 'var(--text-primary)' }}>
                00:{timeLeft.toString().padStart(2, '0')}
              </div>

              {isActive ? (
                <>
                  {transcript && (
                    <div style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', marginBottom: '1.5rem', minHeight: '80px', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live Transcript:</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic', fontSize: '0.95rem' }}>{transcript}</p>
                    </div>
                  )}
                  <button className={glassStyles.button} onClick={stopDrill} style={{ backgroundColor: 'var(--accent-coral-glow)', borderColor: 'var(--accent-coral-light)', color: 'var(--accent-coral-light)', width: '200px' }}>
                    <Square size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Finish
                  </button>
                </>
              ) : isFinished ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
                  <span style={{ color: 'var(--accent-teal-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                    <CheckCircle size={20} /> Drill Complete
                  </span>
                  
                  {isCoachingLoading && <p style={{ opacity: 0.8 }}>Generating targeted coaching feedback...</p>}
                  {coachingError && <p style={{ color: 'var(--accent-coral-light)' }}>Coaching error: {coachingError}</p>}
                  
                  {coachingReport && (
                    <div style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your Transcript:</strong>
                        <p style={{ fontStyle: 'italic', margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                          "{transcript || 'No speech recorded.'}"
                        </p>
                      </div>
                      
                      <div style={{ background: 'rgba(45, 212, 191, 0.05)', border: '1px solid rgba(45, 212, 191, 0.2)', padding: '1.25rem', borderRadius: '12px' }}>
                        <h4 style={{ color: 'var(--accent-teal-light)', margin: '0 0 0.5rem 0' }}>Coach's Feedback</h4>
                        <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>{coachingReport.feedback}</p>
                      </div>

                      {coachingReport.suggestedRewrite && (
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderLeft: '4px solid var(--accent-teal-light)', padding: '1.25rem', borderRadius: '12px' }}>
                          <h4 style={{ color: 'var(--accent-platinum-light)', margin: '0 0 0.5rem 0' }}>Suggested Rewrite</h4>
                          <p style={{ margin: 0, fontStyle: 'italic', fontWeight: '500', fontSize: '0.95rem' }}>"{coachingReport.suggestedRewrite}"</p>
                        </div>
                      )}

                      {coachingReport.tips && coachingReport.tips.length > 0 && (
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Specific Tips</h4>
                          <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.95rem' }}>
                            {coachingReport.tips.map((tip, i) => (
                              <li key={i} style={{ color: 'var(--text-secondary)' }}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <button className={glassStyles.button} onClick={() => startDrill(activeDrill)}>Retry Drill</button>
                </div>
              ) : (
                <button className={glassStyles.button} onClick={() => startDrill(activeDrill)} style={{ width: '200px' }}>
                  Start Drill
                </button>
              )}
            </>
          ) : (
            <div style={{ opacity: 0.5 }}>
              <Play size={48} style={{ marginBottom: '1rem' }} />
              <p>Select a drill to begin practice.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Drills;
