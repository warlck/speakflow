import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, Play, Square, CheckCircle, ChevronDown, ChevronUp, Mic } from 'lucide-react';
import glassStyles from '../styles/glass.module.css';
import { useAppContext } from '../context/AppContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useCurriculum } from '../hooks/useCurriculum';

const sectionLabelStyle = {
  textTransform: 'uppercase',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  letterSpacing: '0.05em',
  marginBottom: '0.5rem',
  color: 'var(--text-secondary)'
};

const Drills = ({ setCurrentView }) => {
  const { setActiveLessonId } = useAppContext();
  const { isListening, transcript, startListening, stopListening, error: speechError, setTranscript } = useSpeechRecognition();
  const { modules, loading: currLoading } = useCurriculum();

  const flattenedDrills = useMemo(() => {
    if (!modules) return [];
    return modules.flatMap(mod => 
      mod.lessons.flatMap(lesson => 
        (lesson.body?.drills || []).map(drill => ({
          ...drill,
          lessonId: lesson.id
        }))
      )
    );
  }, [modules]);

  const [activeDrill, setActiveDrill] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

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
        scenario: activeDrill?.task || '',
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

  const selectDrill = (drill) => {
    setActiveDrill(drill);
    setTimeLeft(drill.durationSecs);
    setTranscript('');
    setCoachingReport(null);
    setCoachingError(null);
    setIsActive(false);
    setIsFinished(false);
    setShowModelAnswer(false);
  };

  const beginSpeaking = () => {
    if (!activeDrill) return;
    setTimeLeft(activeDrill.durationSecs);
    setTranscript('');
    setCoachingReport(null);
    setCoachingError(null);
    setIsActive(true);
    setIsFinished(false);
    setShowModelAnswer(false);
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
        {/* ============ LEFT COLUMN: DRILL SELECTOR ============ */}
        <div className={glassStyles.container}>
          <h2 style={{ marginBottom: '1.5rem' }}>Select a Drill</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {flattenedDrills.map(drill => (
              <div
                key={drill.id}
                className={glassStyles.container}
                style={{
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  border: activeDrill?.id === drill.id ? '1px solid var(--accent-teal-light)' : '1px solid var(--glass-border)',
                  boxShadow: activeDrill?.id === drill.id ? '0 0 15px var(--accent-teal-glow)' : 'none',
                  background: activeDrill?.id === drill.id ? 'rgba(45, 212, 191, 0.04)' : 'transparent'
                }}
                onClick={() => selectDrill(drill)}
              >
                <h3 style={{ marginBottom: '0.5rem' }}>{drill.title}</h3>
                <p style={{ opacity: 0.8, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{drill.situation}</p>
                <p style={{ opacity: 0.6, fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '1rem' }}>
                  <strong>Why it matters:</strong> {drill.explanation}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>{drill.durationSecs} seconds</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className={glassStyles.button}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveLessonId(drill.lessonId);
                        setCurrentView('lesson');
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Learn the concept
                    </button>
                    <button
                      className={glassStyles.button}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectDrill(drill);
                      }}
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

        {/* ============ RIGHT COLUMN: ACTIVE DRILL PANEL ============ */}
        <div className={glassStyles.container} style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          {activeDrill ? (
            <>
              {/* ---- STATE: BRIEFING (selected but not started) ---- */}
              {!isActive && !isFinished && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h2 style={{ color: 'var(--accent-teal-light)', marginBottom: '0.25rem' }}>{activeDrill.title}</h2>

                  {/* THE SITUATION */}
                  <div>
                    <div style={sectionLabelStyle}>THE SITUATION</div>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>{activeDrill.situation}</p>
                  </div>

                  {/* BACKGROUND */}
                  <div>
                    <div style={sectionLabelStyle}>BACKGROUND</div>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {activeDrill.background}
                    </div>
                  </div>

                  {/* YOUR TASK */}
                  <div>
                    <div style={sectionLabelStyle}>YOUR TASK</div>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>{activeDrill.task}</p>
                  </div>

                  {/* STARTER PHRASE */}
                  {activeDrill.starterPhrase && (
                    <div style={{ color: 'var(--accent-teal-light)', fontSize: '0.95rem' }}>
                      Start with: &ldquo;{activeDrill.starterPhrase}&rdquo;
                    </div>
                  )}

                  {/* COLLAPSIBLE MODEL ANSWER */}
                  <div>
                    <button
                      onClick={() => setShowModelAnswer(prev => !prev)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: 0,
                        fontSize: '0.85rem'
                      }}
                    >
                      💡 Peek at Model Answer {showModelAnswer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showModelAnswer && (
                      <div style={{
                        marginTop: '0.5rem',
                        borderLeft: '3px solid var(--accent-teal-light)',
                        fontStyle: 'italic',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        background: 'rgba(0,0,0,0.1)',
                        padding: '1rem',
                        paddingLeft: '1.25rem',
                        borderRadius: '0 8px 8px 0',
                        color: 'var(--text-secondary)'
                      }}>
                        {activeDrill.modelAnswer}
                      </div>
                    )}
                  </div>

                  {/* SUCCESS CRITERIA */}
                  <div>
                    <div style={sectionLabelStyle}>SUCCESS CRITERIA</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {activeDrill.successCriteria.map((criterion, i) => (
                        <li key={i} style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                          ✅ {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* START SPEAKING BUTTON */}
                  <button
                    className={glassStyles.button}
                    onClick={beginSpeaking}
                    style={{
                      alignSelf: 'center',
                      marginTop: '0.5rem',
                      padding: '12px 28px',
                      fontSize: '1rem',
                      background: 'rgba(45, 212, 191, 0.12)',
                      borderColor: 'var(--accent-teal-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Mic size={18} /> Start Speaking
                  </button>
                </div>
              )}

              {/* ---- STATE: ACTIVE (timer running) ---- */}
              {isActive && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
                  <h2 style={{ color: 'var(--accent-teal-light)', marginBottom: 0 }}>{activeDrill.title}</h2>

                  {/* Task + starter reminder */}
                  <div style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    <div style={sectionLabelStyle}>YOUR TASK</div>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{activeDrill.task}</p>
                    {activeDrill.starterPhrase && (
                      <p style={{ margin: 0, color: 'var(--accent-teal-light)', fontSize: '0.85rem' }}>
                        Start with: &ldquo;{activeDrill.starterPhrase}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Timer */}
                  <div style={{ fontSize: '4rem', fontWeight: 'bold', color: timeLeft <= 5 && timeLeft > 0 ? 'var(--accent-coral-light)' : 'var(--text-primary)' }}>
                    00:{timeLeft.toString().padStart(2, '0')}
                  </div>

                  {/* Live transcript */}
                  {transcript && (
                    <div style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', minHeight: '80px', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live Transcript:</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic', fontSize: '0.95rem' }}>{transcript}</p>
                    </div>
                  )}

                  {/* Stop button */}
                  <button className={glassStyles.button} onClick={stopDrill} style={{ backgroundColor: 'var(--accent-coral-glow)', borderColor: 'var(--accent-coral-light)', color: 'var(--accent-coral-light)', width: '200px' }}>
                    <Square size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Finish
                  </button>
                </div>
              )}

              {/* ---- STATE: FINISHED (coaching feedback) ---- */}
              {isFinished && (
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
                          &ldquo;{transcript || 'No speech recorded.'}&rdquo;
                        </p>
                      </div>

                      <div style={{ background: 'rgba(45, 212, 191, 0.05)', border: '1px solid rgba(45, 212, 191, 0.2)', padding: '1.25rem', borderRadius: '12px' }}>
                        <h4 style={{ color: 'var(--accent-teal-light)', margin: '0 0 0.5rem 0' }}>Coach&apos;s Feedback</h4>
                        <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>{coachingReport.feedback}</p>
                      </div>

                      {coachingReport.suggestedRewrite && (
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderLeft: '4px solid var(--accent-teal-light)', padding: '1.25rem', borderRadius: '12px' }}>
                          <h4 style={{ color: 'var(--accent-platinum-light)', margin: '0 0 0.5rem 0' }}>Suggested Rewrite</h4>
                          <p style={{ margin: 0, fontStyle: 'italic', fontWeight: '500', fontSize: '0.95rem' }}>&ldquo;{coachingReport.suggestedRewrite}&rdquo;</p>
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

                  {/* SUCCESS CRITERIA REFERENCE CHECKLIST */}
                  <div style={{ width: '100%', textAlign: 'left' }}>
                    <div style={sectionLabelStyle}>SUCCESS CRITERIA REFERENCE</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {activeDrill.successCriteria.map((criterion, i) => (
                        <li key={i} style={{ fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.8 }}>
                          ✅ {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button className={glassStyles.button} onClick={beginSpeaking}>Retry Drill</button>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', flex: 1, opacity: 0.5 }}>
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
