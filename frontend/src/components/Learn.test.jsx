import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Learn from './Learn';
import { useAppContext } from '../context/AppContext';
import { useCurriculum } from '../hooks/useCurriculum';

vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

vi.mock('../hooks/useCurriculum', () => ({
  useCurriculum: vi.fn(),
}));

describe('Learn Component', () => {
  const mockSetCurrentView = vi.fn();
  const mockSetActiveLessonId = vi.fn();
  const mockIsLessonComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppContext.mockReturnValue({
      completedLessons: [],
      isLessonComplete: mockIsLessonComplete,
      setActiveLessonId: mockSetActiveLessonId,
    });
  });

  it('renders loading state', () => {
    useCurriculum.mockReturnValue({
      modules: [],
      loading: true,
      error: null,
    });

    render(<Learn setCurrentView={mockSetCurrentView} />);
    expect(screen.getByText(/loading executive curriculum/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    useCurriculum.mockReturnValue({
      modules: [],
      loading: false,
      error: 'Network failure',
    });

    render(<Learn setCurrentView={mockSetCurrentView} />);
    expect(screen.getByText(/curriculum error/i)).toBeInTheDocument();
    expect(screen.getByText('Network failure')).toBeInTheDocument();
  });

  it('renders modules and lessons lists', () => {
    const mockModules = [
      {
        id: 'm1',
        title: 'Module 1: Foundations',
        description: 'Learn the fundamentals of executive speech.',
        lessons: [
          { id: 'l1', title: 'Lesson 1: BLUF', summary: 'Bottom Line Up Front technique.', estimatedMinutes: 5 },
          { id: 'l2', title: 'Lesson 2: De-hedging', summary: 'Remove filler and weak hedges.', estimatedMinutes: 7 }
        ]
      }
    ];

    useCurriculum.mockReturnValue({
      modules: mockModules,
      loading: false,
      error: null,
    });
    mockIsLessonComplete.mockImplementation((id) => id === 'l1');

    render(<Learn setCurrentView={mockSetCurrentView} />);

    expect(screen.getByRole('heading', { name: 'Module 1: Foundations', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Learn the fundamentals of executive speech.')).toBeInTheDocument();
    expect(screen.getByText('Lesson 1: BLUF')).toBeInTheDocument();
    expect(screen.getByText('Lesson 2: De-hedging')).toBeInTheDocument();

    // Check stats (1 out of 2 completed)
    expect(screen.getByText(/completed 1 of 2 lessons/i)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('calls startLesson when clicking a lesson card', () => {
    const mockModules = [
      {
        id: 'm1',
        title: 'Module 1: Foundations',
        description: 'Description',
        lessons: [
          { id: 'l1', title: 'Lesson 1: BLUF', summary: 'BLUF summary', estimatedMinutes: 5 }
        ]
      }
    ];

    useCurriculum.mockReturnValue({
      modules: mockModules,
      loading: false,
      error: null,
    });
    mockIsLessonComplete.mockReturnValue(false);

    render(<Learn setCurrentView={mockSetCurrentView} />);

    const lessonCard = screen.getByText('Lesson 1: BLUF').closest('div');
    fireEvent.click(lessonCard);

    expect(mockSetActiveLessonId).toHaveBeenCalledWith('l1');
    expect(mockSetCurrentView).toHaveBeenCalledWith('lesson');
  });

  it('navigates to the first uncompleted lesson when clicking continue learning', () => {
    const mockModules = [
      {
        id: 'm1',
        title: 'Module 1: Foundations',
        description: 'Description',
        lessons: [
          { id: 'l1', title: 'Lesson 1: BLUF', summary: 'BLUF summary', estimatedMinutes: 5 },
          { id: 'l2', title: 'Lesson 2: De-hedging', summary: 'De-hedging summary', estimatedMinutes: 7 }
        ]
      }
    ];

    useCurriculum.mockReturnValue({
      modules: mockModules,
      loading: false,
      error: null,
    });
    mockIsLessonComplete.mockImplementation((id) => id === 'l1');

    render(<Learn setCurrentView={mockSetCurrentView} />);

    const continueBtn = screen.getByText('Continue Learning');
    fireEvent.click(continueBtn);

    expect(mockSetActiveLessonId).toHaveBeenCalledWith('l2');
    expect(mockSetCurrentView).toHaveBeenCalledWith('lesson');
  });

  it('navigates back to dashboard when clicking back button', () => {
    useCurriculum.mockReturnValue({
      modules: [],
      loading: false,
      error: null,
    });

    render(<Learn setCurrentView={mockSetCurrentView} />);

    // The header back button has setCurrentView('dashboard')
    const backBtn = screen.getByRole('button', { name: '' }); // ArrowLeft button inside header
    fireEvent.click(backBtn);
    expect(mockSetCurrentView).toHaveBeenCalledWith('dashboard');
  });

  it('handles AI lesson drafting and publishing lifecycle', async () => {
    const mockModules = [
      { id: 'm1', title: 'Module 1', description: 'Desc', lessons: [] }
    ];
    const mockRefresh = vi.fn();

    useCurriculum.mockReturnValue({
      modules: mockModules,
      loading: false,
      error: null,
      refresh: mockRefresh,
    });

    vi.stubGlobal('fetch', vi.fn());

    // Mock response for /api/lessons/generate
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        draft: {
          id: 'lesson-temp',
          moduleId: 'm1',
          title: 'Generated Lesson Title',
          summary: 'Generated summary',
          estimatedMinutes: 8,
          body: {
            blocks: [{ heading: 'Gen Heading', text: 'Gen Text' }],
            examples: [],
            takeaways: ['Takeaway 1'],
            links: [{ title: 'Resource Link', url: 'https://resource.com' }]
          },
          practicePrompt: 'Gen prompt',
          position: 1
        }
      })
    });

    render(<Learn setCurrentView={mockSetCurrentView} />);

    expect(screen.getByText('AI Lesson Architect')).toBeInTheDocument();
    
    const topicInput = screen.getByPlaceholderText(/e.g. Storytelling in Presentations/i);
    fireEvent.change(topicInput, { target: { value: 'Storytelling' } });

    const moduleSelect = screen.getByLabelText(/Target Module/i);
    fireEvent.change(moduleSelect, { target: { value: 'm1' } });

    const draftBtn = screen.getByRole('button', { name: /Draft with AI/i });
    fireEvent.click(draftBtn);

    // Wait for preview to render
    expect(await screen.findByText('Draft Preview: Generated Lesson Title')).toBeInTheDocument();
    expect(screen.getByText(/Gen Heading/i)).toBeInTheDocument();
    expect(screen.getByText('Resource Link')).toBeInTheDocument();

    // Now mock response for /api/lessons publish
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const publishBtn = screen.getByRole('button', { name: /Publish to Academy/i });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(mockRefresh).toHaveBeenCalled();
    });

    expect(screen.queryByText('Draft Preview: Generated Lesson Title')).not.toBeInTheDocument();
  });
});
