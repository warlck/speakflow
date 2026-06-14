import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useCurriculum } from '../hooks/useCurriculum';
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Clock, Play } from 'lucide-react';
import glassStyles from '../styles/glass.module.css';

const Learn = ({ setCurrentView }) => {
  const { completedLessons, isLessonComplete, setActiveLessonId } = useAppContext();
  const { modules, loading, error, refresh } = useCurriculum();

  const [topic, setTopic] = React.useState('');
  const [targetModuleId, setTargetModuleId] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [difficulty, setDifficulty] = React.useState('');
  const [draftLesson, setDraftLesson] = React.useState(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [architectError, setArchitectError] = React.useState(null);

  // Set default target module once modules load
  React.useEffect(() => {
    if (modules && modules.length > 0 && !targetModuleId) {
      setTargetModuleId(modules[0].id);
    }
  }, [modules, targetModuleId]);

  const handleGenerateDraft = async (e) => {
    e.preventDefault();
    if (!topic || !targetModuleId) return;

    setIsGenerating(true);
    setArchitectError(null);
    setDraftLesson(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/lessons/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          moduleId: targetModuleId,
          audience,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error(`Drafting failed with status: ${response.status}`);
      }

      const data = await response.json();
      setDraftLesson(data.draft);
    } catch (err) {
      console.error(err);
      setArchitectError(err.message || 'Failed to draft lesson. Check your backend connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishDraft = async () => {
    if (!draftLesson) return;

    setIsPublishing(true);
    setArchitectError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftLesson),
      });

      if (!response.ok) {
        throw new Error(`Publishing failed with status: ${response.status}`);
      }

      // Success! Refresh curriculum, clear inputs and draft
      if (refresh) {
        await refresh();
      }
      setDraftLesson(null);
      setTopic('');
      setAudience('');
      setDifficulty('');
    } catch (err) {
      console.error(err);
      setArchitectError(err.message || 'Failed to publish lesson.');
    } finally {
      setIsPublishing(false);
    }
  };

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

      {/* AI Lesson Architect Section */}
      <div className={glassStyles.container} style={{ marginTop: '3rem', padding: '2rem' }}>
        <h2 style={{ color: 'var(--accent-teal-light)', marginBottom: '0.5rem' }}>AI Lesson Architect</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Dynamically generate a new interactive lesson using Gemini AI, review the draft, and publish it to the Academy curriculum.
        </p>

        <form onSubmit={handleGenerateDraft} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '600px' }}>
          <div>
            <label htmlFor="topic-input" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Lesson Topic
            </label>
            <input
              id="topic-input"
              type="text"
              className={glassStyles.input}
              placeholder="e.g. Storytelling in Presentations"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="moduleId-select" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Target Module
              </label>
              <select
                id="moduleId-select"
                className={glassStyles.input}
                value={targetModuleId}
                onChange={(e) => setTargetModuleId(e.target.value)}
                required
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', color: 'var(--text-primary)' }}
              >
                <option value="" disabled>Select a module</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="difficulty-input" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Difficulty Level
              </label>
              <input
                id="difficulty-input"
                type="text"
                className={glassStyles.input}
                placeholder="e.g. Advanced, Intermediate"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="audience-input" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Target Audience
            </label>
            <input
              id="audience-input"
              type="text"
              className={glassStyles.input}
              placeholder="e.g. Senior Leaders, Technical Teams"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {architectError && (
            <p style={{ color: 'var(--accent-coral-light)', fontSize: '0.9rem', margin: 0 }}>
              {architectError}
            </p>
          )}

          <button
            type="submit"
            className={glassStyles.button}
            disabled={isGenerating || !topic || !targetModuleId}
            style={{
              alignSelf: 'flex-start',
              background: 'var(--accent-teal-light)',
              color: 'var(--bg-primary)',
              fontWeight: '600',
              borderColor: 'transparent',
              marginTop: '0.5rem',
            }}
          >
            {isGenerating ? 'Drafting with AI...' : 'Draft with AI'}
          </button>
        </form>

        {/* Draft Preview Panel */}
        {draftLesson && (
          <div className={glassStyles.container} style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(45, 212, 191, 0.3)' }}>
            <h3 style={{ color: 'var(--accent-teal-light)', marginBottom: '1rem' }}>Draft Preview: {draftLesson.title}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <p><strong>Summary:</strong> {draftLesson.summary}</p>
              <p><strong>Estimated Reading Time:</strong> {draftLesson.estimatedMinutes} minutes</p>
              
              <div>
                <strong>Teachable Content:</strong>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                  {draftLesson.body.blocks?.map((b, i) => (
                    <li key={i} style={{ marginBottom: '0.5rem' }}>
                      <strong>{b.heading}:</strong> {b.text}
                    </li>
                  ))}
                </ul>
              </div>

              {draftLesson.body.examples && draftLesson.body.examples.length > 0 && (
                <div>
                  <strong>Worked Examples:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {draftLesson.body.examples.map((ex, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem' }}>
                        <div><span style={{ color: 'var(--accent-coral-light)' }}>Before:</span> "{ex.before || ex.Before}"</div>
                        <div style={{ marginTop: '0.25rem' }}><span style={{ color: 'var(--accent-teal-light)' }}>After:</span> "{ex.after || ex.After}"</div>
                        {(ex.note || ex.Note) && <div style={{ opacity: 0.7, marginTop: '0.25rem' }}>Note: {ex.note || ex.Note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {draftLesson.body.links && draftLesson.body.links.length > 0 && (
                <div>
                  <strong>Further Resources:</strong>
                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                    {draftLesson.body.links.map((link, i) => (
                      <li key={i}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-teal-light)' }}>
                          {link.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className={glassStyles.button}
                onClick={handlePublishDraft}
                disabled={isPublishing}
                style={{
                  background: 'var(--accent-teal-light)',
                  color: 'var(--bg-primary)',
                  fontWeight: '600',
                  borderColor: 'transparent',
                }}
              >
                {isPublishing ? 'Publishing...' : 'Publish to Academy'}
              </button>
              <button
                className={glassStyles.button}
                onClick={() => setDraftLesson(null)}
                style={{ background: 'transparent', borderColor: 'var(--glass-border)' }}
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Learn;
