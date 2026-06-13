import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Drills from './Drills';
import { useAppContext } from '../context/AppContext';

vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

describe('Drills Component', () => {
  const mockSetCurrentView = vi.fn();
  const mockSetActiveLessonId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppContext.mockReturnValue({
      setActiveLessonId: mockSetActiveLessonId,
    });
  });

  it('renders drills with scenarios and explanations', () => {
    render(<Drills setCurrentView={mockSetCurrentView} />);

    expect(screen.getByText('BLUF (Bottom Line Up Front)')).toBeInTheDocument();
    expect(screen.getByText(/Bottom Line Up Front keeps executives engaged/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Learn the concept/i).length).toBeGreaterThan(0);
  });

  it('navigates to lesson when clicking "Learn the concept"', () => {
    render(<Drills setCurrentView={mockSetCurrentView} />);

    // Click "Learn the concept" for BLUF
    const learnButtons = screen.getAllByText(/Learn the concept/i);
    fireEvent.click(learnButtons[0]);

    expect(mockSetActiveLessonId).toHaveBeenCalledWith('lesson-bluf-core');
    expect(mockSetCurrentView).toHaveBeenCalledWith('lesson');
  });

  it('allows starting a drill and shows the active drill and explanation', () => {
    render(<Drills setCurrentView={mockSetCurrentView} />);

    const startButtons = screen.getAllByRole('button', { name: /start drill/i });
    fireEvent.click(startButtons[0]);

    // Active drill panel should show scenario (it will now exist in both selector card and active panel)
    expect(screen.getAllByText(/Explain why we missed Q3 targets/i).length).toBe(2);
  });
});
