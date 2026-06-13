import React from 'react';
import { render, act, screen } from '@testing-library/react';
import { AppProvider, useAppContext } from './AppContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const TestComponent = () => {
  const {
    sessionHistory,
    addSession,
    activeLessonId,
    setActiveLessonId,
    completedLessons,
    markLessonComplete,
    isLessonComplete,
  } = useAppContext();

  return (
    <div>
      <div data-testid="active-lesson">{activeLessonId || 'none'}</div>
      <div data-testid="completed-count">{completedLessons.length}</div>
      <div data-testid="is-l1-complete">{isLessonComplete('l1') ? 'yes' : 'no'}</div>
      <div data-testid="sessions-count">{sessionHistory.length}</div>
      <button onClick={() => setActiveLessonId('l1')}>Set Active</button>
      <button onClick={() => markLessonComplete('l1')}>Complete L1</button>
      <button onClick={() => addSession({ id: 's1', text: 'test' })}>Add Session</button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default empty/null values', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('active-lesson').textContent).toBe('none');
    expect(screen.getByTestId('completed-count').textContent).toBe('0');
    expect(screen.getByTestId('is-l1-complete').textContent).toBe('no');
    expect(screen.getByTestId('sessions-count').textContent).toBe('0');
  });

  it('should set active lesson and persist to localStorage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Set Active').click();
    });

    expect(screen.getByTestId('active-lesson').textContent).toBe('l1');
    expect(localStorage.getItem('active_lesson_id')).toBe('l1');
  });

  it('should mark lesson complete and persist to localStorage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Complete L1').click();
    });

    expect(screen.getByTestId('completed-count').textContent).toBe('1');
    expect(screen.getByTestId('is-l1-complete').textContent).toBe('yes');
    expect(JSON.parse(localStorage.getItem('completed_lessons'))).toEqual(['l1']);
  });

  it('should add session and persist to localStorage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Add Session').click();
    });

    expect(screen.getByTestId('sessions-count').textContent).toBe('1');
    expect(JSON.parse(localStorage.getItem('session_history'))).toEqual([{ id: 's1', text: 'test' }]);
  });
});
