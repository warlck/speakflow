import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Outliner from './Outliner';
import { useAppContext } from '../context/AppContext';

vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

describe('Outliner Component', () => {
  const mockSetCurrentView = vi.fn();
  const mockSetActiveLessonId = vi.fn();
  const mockSetActiveOutline = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppContext.mockReturnValue({
      activeOutline: null,
      setActiveOutline: mockSetActiveOutline,
      setActiveLessonId: mockSetActiveLessonId,
    });
  });

  it('renders outline templates with learning links', () => {
    render(<Outliner setCurrentView={mockSetCurrentView} />);

    expect(screen.getByText('Vision-Strategy-Execution')).toBeInTheDocument();
    expect(screen.getByText('Problem-Solution-Benefit')).toBeInTheDocument();
    expect(screen.getAllByText(/Learn about this structure/i).length).toBe(2);
  });

  it('navigates to the structure lesson when clicking the learning link', () => {
    render(<Outliner setCurrentView={mockSetCurrentView} />);

    const learnLinks = screen.getAllByText(/Learn about this structure/i);
    fireEvent.click(learnLinks[1]); // Problem-Solution-Benefit template link

    expect(mockSetActiveLessonId).toHaveBeenCalledWith('lesson-problem-solution-benefit');
    expect(mockSetCurrentView).toHaveBeenCalledWith('lesson');
  });

  it('selects a template when clicking on its card', () => {
    render(<Outliner setCurrentView={mockSetCurrentView} />);

    const templateCard = screen.getByText('Problem-Solution-Benefit').closest('div');
    fireEvent.click(templateCard);

    expect(mockSetActiveOutline).toHaveBeenCalledWith(expect.objectContaining({
      id: 'psb',
      title: 'Problem-Solution-Benefit',
    }));
  });
});
