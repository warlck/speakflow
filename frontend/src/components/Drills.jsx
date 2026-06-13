import React, { useState } from 'react';
import { ArrowLeft, Play, Square, CheckCircle } from 'lucide-react';
import glassStyles from '../styles/glass.module.css';

const DRILLS = [
  {
    id: 'bluf',
    title: 'BLUF (Bottom Line Up Front)',
    scenario: 'Explain why we missed Q3 targets. Start with the core conclusion.',
    durationSecs: 30
  },
  {
    id: 'dehedging',
    title: 'De-Hedging',
    scenario: 'Restate this with high conviction: "I think we might want to consider pivoting our strategy sort of soon..."',
    durationSecs: 20
  },
  {
    id: 'rule3',
    title: 'Rule of Three',
    scenario: 'Describe the core trait "Resilience" using three parallel, punchy phrases.',
    durationSecs: 45
  }
];

const Drills = ({ setCurrentView }) => {
  const [activeDrill, setActiveDrill] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Simplified timer logic for prototype
  React.useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startDrill = (drill) => {
    setActiveDrill(drill);
    setTimeLeft(drill.durationSecs);
    setIsActive(true);
  };

  const stopDrill = () => {
    setIsActive(false);
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
                <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.9rem' }}>{drill.scenario}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>{drill.durationSecs} seconds</span>
                  <button
                    className={glassStyles.button}
                    onClick={() => startDrill(drill)}
                    disabled={isActive && activeDrill?.id !== drill.id}
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    Start Drill
                  </button>
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
                <button className={glassStyles.button} onClick={stopDrill} style={{ backgroundColor: 'var(--accent-coral-glow)', borderColor: 'var(--accent-coral-light)', color: 'var(--accent-coral-light)', width: '200px' }}>
                  <Square size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Finish
                </button>
              ) : timeLeft === 0 && !isActive ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: 'var(--accent-teal-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={20} /> Drill Complete
                  </span>
                  <button className={glassStyles.button} onClick={() => startDrill(activeDrill)}>Retry Drill</button>
                </div>
              ) : null}
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
