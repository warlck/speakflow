import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Play, LayoutList, Clock } from 'lucide-react';
import glassStyles from '../styles/glass.module.css';

const TEMPLATES = [
  {
    id: 'vision',
    title: 'Vision-Strategy-Execution',
    segments: [
      { title: 'The Vision (Where we are going)', durationMinutes: 2 },
      { title: 'The Strategy (How we will get there)', durationMinutes: 3 },
      { title: 'The Execution (What we need from you)', durationMinutes: 2 }
    ]
  },
  {
    id: 'psb',
    title: 'Problem-Solution-Benefit',
    segments: [
      { title: 'The Problem (The pain point)', durationMinutes: 1 },
      { title: 'The Solution (Our approach)', durationMinutes: 2 },
      { title: 'The Benefit (The ROI)', durationMinutes: 1 }
    ]
  }
];

const Outliner = ({ setCurrentView }) => {
  const { activeOutline, setActiveOutline } = useAppContext();
  const [selectedTemplateId, setSelectedTemplateId] = useState(activeOutline ? activeOutline.id : null);

  const handleSelectTemplate = (template) => {
    setActiveOutline(template);
    setSelectedTemplateId(template.id);
  };

  return (
    <div className={glassStyles.page}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button className={glassStyles.button} onClick={() => setCurrentView('dashboard')} style={{ marginRight: '1rem', padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1>Executive Speech Outliner</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className={glassStyles.container}>
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutList size={20} /> Templates
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {TEMPLATES.map(template => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: selectedTemplateId === template.id ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${selectedTemplateId === template.id ? '#4ecdc4' : 'rgba(255,255,255,0.1)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <h3 style={{ marginBottom: '0.5rem' }}>{template.title}</h3>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{template.segments.length} segments • ~{template.segments.reduce((acc, s) => acc + s.durationMinutes, 0)} mins</p>
              </div>
            ))}
          </div>
        </div>

        <div className={glassStyles.container}>
          {activeOutline ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ marginBottom: '0.5rem' }}>{activeOutline.title}</h2>
                  <p style={{ opacity: 0.7 }}>Customize your outline before practicing.</p>
                </div>
                <button
                  className={glassStyles.button}
                  onClick={() => setCurrentView('dashboard')}
                  style={{ background: '#4ecdc4', color: '#1a1a2e', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Play size={16} /> Start Practice
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeOutline.segments.map((segment, index) => (
                  <div key={index} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #4ecdc4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>Step {index + 1}: {segment.title}</h4>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.7, fontSize: '0.9rem' }}>
                        <Clock size={14} /> {segment.durationMinutes} min
                      </span>
                    </div>
                    <input
                      type="text"
                      className={glassStyles.input}
                      placeholder="Add key talking points here..."
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', marginTop: '0.5rem' }}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', opacity: 0.5, flexDirection: 'column', gap: '1rem' }}>
              <LayoutList size={48} />
              <p>Select a template from the left to start outlining your speech.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Outliner;
