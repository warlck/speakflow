import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useCurriculum } from '../hooks/useCurriculum';
import { ArrowLeft, CheckCircle2, Circle, Clock, ArrowRight, Play } from 'lucide-react';
import glassStyles from '../styles/glass.module.css';

const Lesson = ({ setCurrentView }) => {
  const { activeLessonId, setActiveLessonId, markLessonComplete, isLessonComplete, completedLessons, setActiveOutline } = useAppContext();
  const { lessons, getLessonById, loading, error } = useCurriculum();

  const lesson = React.useMemo(() => {
    return getLessonById(activeLessonId);
  }, [activeLessonId, getLessonById]);

  // Find the next lesson in the curriculum
  const nextLesson = React.useMemo(() => {
    if (!lesson || !lessons.length) return null;
    const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
    if (currentIndex !== -1 && currentIndex + 1 < lessons.length) {
      return lessons[currentIndex + 1];
    }
    return null;
  }, [lesson, lessons]);

  const handleNextLesson = () => {
    if (nextLesson) {
      setActiveLessonId(nextLesson.id);
    }
  };

  const handleToggleComplete = () => {
    if (lesson) {
      markLessonComplete(lesson.id);
    }
  };

  const handlePractice = () => {
    if (!lesson) return;

    if (lesson.relatedDrill) {
      // If it maps to a specific drill, open the drills view
      setCurrentView('drills');
    } else {
      // Otherwise, clear any active outlines so they can practice the free speech prompt
      setActiveOutline(null);
      // We will set the practice prompt in AppContext or localStorage so the Dashboard can pick it up
      if (lesson.practicePrompt) {
        localStorage.setItem('active_practice_prompt', lesson.practicePrompt);
      }
      setCurrentView('dashboard');
    }
  };

  if (loading) {
    return (
      <div className={glassStyles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Loading Lesson Details...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className={glassStyles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className={glassStyles.container} style={{ textAlign: 'center', maxWidth: '500px' }}>
          <h2 style={{ color: 'var(--accent-coral-light)', marginBottom: '1rem' }}>Lesson Error</h2>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>{error || 'Lesson not found in curriculum.'}</p>
          <button className={glassStyles.button} onClick={() => setCurrentView('learn')}>Back to Academy</button>
        </div>
      </div>
    );
  }

  const isComplete = isLessonComplete(lesson.id);

  return (
    <div className={glassStyles.page}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className={glassStyles.button} onClick={() => setCurrentView('learn')} style={{ marginRight: '1rem', padding: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lesson Material
            </span>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{lesson.title}</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <Clock size={16} />
          <span>{lesson.estimatedMinutes} mins read</span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Explanation Blocks */}
          <div className={glassStyles.container} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {lesson.body.blocks?.map((block, i) => (
              <div key={i} style={{ borderBottom: i < lesson.body.blocks.length - 1 ? '1px solid var(--glass-border)' : 'none', paddingBottom: i < lesson.body.blocks.length - 1 ? '1.5rem' : '0' }}>
                <h3 style={{ color: 'var(--accent-teal-light)', marginBottom: '0.75rem' }}>{block.heading}</h3>
                <p style={{ lineHeight: '1.6', fontSize: '1.05rem', color: 'var(--text-primary)', opacity: 0.9 }}>
                  {block.text}
                </p>
              </div>
            ))}
          </div>

          {/* Before/After Examples */}
          {lesson.body.examples && lesson.body.examples.length > 0 && (
            <div className={glassStyles.container}>
              <h3 style={{ marginBottom: '1.25rem' }}>Worked Examples</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {lesson.body.examples.map((ex, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ borderLeft: '3px solid var(--accent-coral)', paddingLeft: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-coral-light)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Weak Phrasing</span>
                        <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{ex.Before}"</p>
                      </div>
                      <div style={{ borderLeft: '3px solid var(--accent-teal-light)', paddingLeft: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-teal-light)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Executive Phrasing</span>
                        <p style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)' }}>"{ex.After}"</p>
                      </div>
                    </div>
                    {ex.Note && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.5rem' }}>
                        <strong>Coach Note:</strong> {ex.Note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
          {/* Key Takeaways */}
          {lesson.body.takeaways && lesson.body.takeaways.length > 0 && (
            <div className={glassStyles.container}>
              <h3 style={{ marginBottom: '1rem' }}>Key Takeaways</h3>
              <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                {lesson.body.takeaways.map((takeaway, i) => (
                  <li key={i}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Practice Card & Completion Actions */}
          <div className={glassStyles.container} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--accent-teal-light)' }}>Action Step</h3>
            
            {lesson.practicePrompt && (
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', textAlign: 'left', fontSize: '0.9rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Practice Prompt:</strong>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>"{lesson.practicePrompt}"</p>
              </div>
            )}

            <button
              className={glassStyles.button}
              onClick={handlePractice}
              style={{
                background: 'var(--accent-teal-light)',
                color: 'var(--bg-primary)',
                fontWeight: '600',
                border: 'none',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              <Play size={16} fill="currentColor" /> Practice Concept
            </button>

            <button
              className={glassStyles.button}
              onClick={handleToggleComplete}
              disabled={isComplete}
              style={{
                background: isComplete ? 'rgba(45, 212, 191, 0.1)' : 'transparent',
                borderColor: isComplete ? 'rgba(45, 212, 191, 0.3)' : 'var(--glass-border)',
                color: isComplete ? 'var(--accent-teal-light)' : 'var(--text-primary)',
                gap: '0.5rem',
              }}
            >
              {isComplete ? (
                <>
                  <CheckCircle2 size={16} /> Completed
                </>
              ) : (
                <>
                  <Circle size={16} /> Mark as Complete
                </>
              )}
            </button>

            {nextLesson && (
              <button
                className={glassStyles.button}
                onClick={handleNextLesson}
                style={{
                  background: 'transparent',
                  borderColor: 'var(--glass-border)',
                  gap: '0.5rem',
                }}
              >
                Next Lesson <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lesson;
