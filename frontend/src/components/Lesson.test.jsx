import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Lesson from './Lesson';
import { useAppContext } from '../context/AppContext';
import { useCurriculum } from '../hooks/useCurriculum';

vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

vi.mock('../hooks/useCurriculum', () => ({
  useCurriculum: vi.fn(),
}));

describe('Lesson Component', () => {
  const mockSetCurrentView = vi.fn();
  const mockSetActiveLessonId = vi.fn();
  const mockMarkLessonComplete = vi.fn();
  const mockIsLessonComplete = vi.fn();
  const mockSetActiveOutline = vi.fn();

  const mockLessonData = {
    id: 'l2',
    moduleId: 'm1',
    title: 'Lesson 2: De-hedging',
    summary: 'Remove hedges.',
    estimatedMinutes: 5,
    body: {
      blocks: [
        { heading: 'De-hedging Explained', text: 'Avoid hedging words like "just" and "probably".' }
      ],
      examples: [
        { Before: 'I just think we should probably wait.', After: 'We should wait.', Note: 'Clear and assertive.' }
      ],
      takeaways: ['Hedges reduce authority.', 'State facts clearly.'],
      links: [
        { title: 'TED Talk on Confidence', url: 'https://ted.com/confidence' }
      ]
    },
    practicePrompt: 'Tell us about your next project without using hedges.',
    relatedDrill: null
  };

  const mockLessonsList = [
    { id: 'l1', title: 'Lesson 1' },
    mockLessonData,
    { id: 'l3', title: 'Lesson 3' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    useAppContext.mockReturnValue({
      activeLessonId: 'l2',
      setActiveLessonId: mockSetActiveLessonId,
      markLessonComplete: mockMarkLessonComplete,
      isLessonComplete: mockIsLessonComplete,
      completedLessons: [],
      setActiveOutline: mockSetActiveOutline,
    });

    useCurriculum.mockReturnValue({
      lessons: mockLessonsList,
      getLessonById: vi.fn().mockReturnValue(mockLessonData),
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state', () => {
    useCurriculum.mockReturnValue({
      lessons: [],
      getLessonById: vi.fn(),
      loading: true,
      error: null,
    });

    render(<Lesson setCurrentView={mockSetCurrentView} />);
    expect(screen.getByText(/loading lesson details/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    useCurriculum.mockReturnValue({
      lessons: [],
      getLessonById: vi.fn(),
      loading: false,
      error: 'Failed to fetch',
    });

    render(<Lesson setCurrentView={mockSetCurrentView} />);
    expect(screen.getByText(/lesson error/i)).toBeInTheDocument();
  });

  it('renders lesson details correctly', () => {
    render(<Lesson setCurrentView={mockSetCurrentView} />);

    expect(screen.getByText('Lesson 2: De-hedging')).toBeInTheDocument();
    expect(screen.getByText('De-hedging Explained')).toBeInTheDocument();
    expect(screen.getByText('Avoid hedging words like "just" and "probably".')).toBeInTheDocument();
    expect(screen.getByText('"I just think we should probably wait."')).toBeInTheDocument();
    expect(screen.getByText('"We should wait."')).toBeInTheDocument();
    expect(screen.getByText('Hedges reduce authority.')).toBeInTheDocument();
    expect(screen.getByText('State facts clearly.')).toBeInTheDocument();
  });

  it('marks lesson as complete', () => {
    mockIsLessonComplete.mockReturnValue(false);

    render(<Lesson setCurrentView={mockSetCurrentView} />);

    const completeBtn = screen.getByText('Mark as Complete');
    fireEvent.click(completeBtn);

    expect(mockMarkLessonComplete).toHaveBeenCalledWith('l2');
  });

  it('displays completed state', () => {
    mockIsLessonComplete.mockReturnValue(true);

    render(<Lesson setCurrentView={mockSetCurrentView} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('redirects to drills when practicing a lesson with a related drill', () => {
    const drillLesson = { ...mockLessonData, relatedDrill: 'de-hedging-drill' };
    useCurriculum.mockReturnValue({
      lessons: [drillLesson],
      getLessonById: vi.fn().mockReturnValue(drillLesson),
      loading: false,
      error: null,
    });

    render(<Lesson setCurrentView={mockSetCurrentView} />);

    const practiceBtn = screen.getByText('Practice Concept');
    fireEvent.click(practiceBtn);

    expect(mockSetCurrentView).toHaveBeenCalledWith('drills');
  });

  it('redirects to dashboard and saves prompt when practicing a generic lesson', () => {
    render(<Lesson setCurrentView={mockSetCurrentView} />);

    const practiceBtn = screen.getByText('Practice Concept');
    fireEvent.click(practiceBtn);

    expect(mockSetActiveOutline).toHaveBeenCalledWith(null);
    expect(localStorage.getItem('active_practice_prompt')).toBe(mockLessonData.practicePrompt);
    expect(mockSetCurrentView).toHaveBeenCalledWith('dashboard');
  });

  it('navigates to the next lesson', () => {
    render(<Lesson setCurrentView={mockSetCurrentView} />);

    const nextBtn = screen.getByText('Next Lesson');
    fireEvent.click(nextBtn);

    expect(mockSetActiveLessonId).toHaveBeenCalledWith('l3');
  });

  it('navigates back to learn hub when clicking back button', () => {
    render(<Lesson setCurrentView={mockSetCurrentView} />);

    const backBtn = screen.getByRole('button', { name: '' }); // ArrowLeft button inside header
    fireEvent.click(backBtn);
    expect(mockSetCurrentView).toHaveBeenCalledWith('learn');
  });

  it('renders lesson links correctly when present', () => {
    render(<Lesson setCurrentView={mockSetCurrentView} />);
    expect(screen.getByText('Further Resources')).toBeInTheDocument();
    const linkEl = screen.getByText('TED Talk on Confidence');
    expect(linkEl).toBeInTheDocument();
    expect(linkEl).toHaveAttribute('href', 'https://ted.com/confidence');
    expect(linkEl).toHaveAttribute('target', '_blank');
  });
});
