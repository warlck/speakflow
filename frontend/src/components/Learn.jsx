import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useCurriculum } from '../hooks/useCurriculum';
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Clock, Play } from 'lucide-react';
import glassStyles from '../styles/glass.module.css';

const Learn = ({ setCurrentView }) => {
  const { completedLessons, isLessonComplete, setActiveLessonId } = useAppContext();
  const { modules, loading, error } = useCurriculum();

  // Calculate overall progress stats
  const stats = React.useMemo(() => {
    let total = 0;
    let completed = 0;
    let nextLesson = null;

    modules.forEach((mod) => {
      if (mod.lessons) {
        mod.lessons.forEach((lesson) => {
          total += 1;
          const done = isLessonComplete(lesson.id);
          if (done) {
            completed += 1;
          } else if (!nextLesson) {
            nextLesson = lesson;
          }
        });
      }
    });

    // Fallback next lesson if all are completed
    if (total > 0 && completed === total && modules.length > 0 && modules[0].lessons?.length > 0) {
      nextLesson = modules[0].lessons[0];
    }

    return { total, completed, nextLesson };
  }, [modules, isLessonComplete]);

  const handleStartLesson = (lessonId) => {
    setActiveLessonId(lessonId);
    setCurrentView('lesson');
  };

  if (loading) {
    return (
      <div className={glassStyles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Loading Executive Curriculum...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={glassStyles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className={glassStyles.container} style={{ textAlign: 'center', maxWidth: '500px' }}>
          <h2 style={{ color: 'var(--accent-coral-light)', marginBottom: '1rem' }}>Curriculum Error</h2>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>{error}</p>
          <button className={glassStyles.button} onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className={glassStyles.page}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className={glassStyles.button} onClick={() => setCurrentView('dashboard')} style={{ marginRight: '1rem', padding: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1>Executive Rhetoric Academy</h1>
        </div>
        {stats.nextLesson && (
          <button
            className={glassStyles.button}
            onClick={() => handleStartLesson(stats.nextLesson.id)}
            style={{
              background: 'var(--accent-teal-light)',
              color: 'var(--bg-primary)',
              fontWeight: '600',
              borderColor: 'transparent',
              gap: '0.5rem',
            }}
          >
            <Play size={16} fill="currentColor" />
            {stats.completed === 0 ? 'Start Learning' : 'Continue Learning'}
          </button>
        )}
      </header>

      {/* Progress Summary Card */}
      <div className={glassStyles.container} style={{ marginBottom: '2.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <h3>Your Progress</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Completed {stats.completed} of {stats.total} lessons
          </p>
        </div>
        <div style={{ flex: '2 1 300px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flexGrow: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <div
              style={{
                width: `${completionPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-teal), var(--accent-teal-light))',
                boxShadow: '0 0 10px var(--accent-teal-light)',
                borderRadius: '4px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-teal-light)' }}>{completionPercentage}%</span>
        </div>
      </div>

      {/* Modules List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {modules.map((mod) => (
          <div key={mod.id} className={glassStyles.container} style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-teal-light)' }}>{mod.title}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
              {mod.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {mod.lessons?.map((lesson) => {
                const done = isLessonComplete(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    className={glassStyles.container}
                    onClick={() => handleStartLesson(lesson.id)}
                    style={{
                      background: 'rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                      border: done ? '1px solid rgba(45, 212, 191, 0.2)' : '1px solid var(--glass-border)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '180px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = done ? 'var(--accent-teal-light)' : 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = done ? 'rgba(45, 212, 191, 0.2)' : 'var(--glass-border)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>{lesson.title}</h4>
                        {done ? (
                          <CheckCircle2 size={18} style={{ color: 'var(--accent-teal-light)', flexShrink: 0, marginLeft: '0.5rem' }} />
                        ) : (
                          <Circle size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: '0.5rem' }} />
                        )}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0, opacity: 0.85 }}>
                        {lesson.summary}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <Clock size={12} />
                      <span>{lesson.estimatedMinutes} mins</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Learn;
