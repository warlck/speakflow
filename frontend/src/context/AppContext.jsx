import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sessionHistory, setSessionHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('session_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeOutline, setActiveOutline] = useState(null);

  // activeDrillId lets a lesson deep-link into the Drills view with a specific
  // drill preselected. It is ephemeral (not persisted) since it is only used
  // for a single navigation handoff.
  const [activeDrillId, setActiveDrillId] = useState(null);

  const [activeLessonId, setActiveLessonIdState] = useState(() => {
    return localStorage.getItem('active_lesson_id') || null;
  });

  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      const stored = localStorage.getItem('completed_lessons');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [diagnosticResult, setDiagnosticResultState] = useState(() => {
    try {
      const stored = localStorage.getItem('diagnostic_result');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const addSession = (session) => {
    const updated = [...sessionHistory, session];
    setSessionHistory(updated);
    localStorage.setItem('session_history', JSON.stringify(updated));
  };

  const setActiveLessonId = (id) => {
    setActiveLessonIdState(id);
    if (id) {
      localStorage.setItem('active_lesson_id', id);
    } else {
      localStorage.removeItem('active_lesson_id');
    }
  };

  const markLessonComplete = (id) => {
    if (!id) return;
    setCompletedLessons((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('completed_lessons', JSON.stringify(updated));
      return updated;
    });
  };

  const isLessonComplete = (id) => {
    return completedLessons.includes(id);
  };

  const setDiagnosticResult = (result) => {
    setDiagnosticResultState(result);
    if (result) {
      localStorage.setItem('diagnostic_result', JSON.stringify(result));
    } else {
      localStorage.removeItem('diagnostic_result');
    }
  };

  return (
    <AppContext.Provider
      value={{
        sessionHistory,
        addSession,
        activeOutline,
        setActiveOutline,
        activeDrillId,
        setActiveDrillId,
        activeLessonId,
        setActiveLessonId,
        completedLessons,
        markLessonComplete,
        isLessonComplete,
        diagnosticResult,
        setDiagnosticResult,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
