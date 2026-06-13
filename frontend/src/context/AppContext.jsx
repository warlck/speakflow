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

  return (
    <AppContext.Provider
      value={{
        sessionHistory,
        addSession,
        activeOutline,
        setActiveOutline,
        activeLessonId,
        setActiveLessonId,
        completedLessons,
        markLessonComplete,
        isLessonComplete,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
