import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Drills from './Drills';
import { useAppContext } from '../context/AppContext';

vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

vi.mock('../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => {
    const [isListening, setIsListening] = React.useState(false);
    const [transcript, setTranscript] = React.useState('');
    return {
      isListening,
      transcript,
      startListening: () => {
        setIsListening(true);
        setTranscript('I just think BLUF is important.');
      },
      stopListening: () => setIsListening(false),
      error: null,
      setTranscript,
    };
  }
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders drills with scenarios and explanations', () => {
    render(<Drills setCurrentView={mockSetCurrentView} />);

    expect(screen.getByText('BLUF (Bottom Line Up Front)')).toBeInTheDocument();
    expect(screen.getByText(/Bottom Line Up Front keeps executives engaged/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Learn the concept/i).length).toBeGreaterThan(0);
  });

  it('navigates to lesson when clicking "Learn the concept"', () => {
    render(<Drills setCurrentView={mockSetCurrentView} />);

    const learnButtons = screen.getAllByText(/Learn the concept/i);
    fireEvent.click(learnButtons[0]);

    expect(mockSetActiveLessonId).toHaveBeenCalledWith('lesson-bluf-core');
    expect(mockSetCurrentView).toHaveBeenCalledWith('lesson');
  });

  it('allows starting a drill and shows the active drill and explanation', () => {
    render(<Drills setCurrentView={mockSetCurrentView} />);

    const startButtons = screen.getAllByRole('button', { name: /start drill/i });
    fireEvent.click(startButtons[0]);

    expect(screen.getAllByText(/Explain why we missed Q3 targets/i).length).toBe(2);
  });

  it('submits transcript and displays coach response when clicking finish', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        feedback: 'Good attempt, but you started with a hedge.',
        appliedConcept: 'bluf',
        suggestedRewrite: 'We missed Q3 targets because retention fell 5%.',
        tips: ['Avoid starting with "I think".', 'State the core issue immediately.']
      })
    }));

    render(<Drills setCurrentView={mockSetCurrentView} />);

    // Select and start BLUF drill
    const startButtons = screen.getAllByRole('button', { name: /start drill/i });
    fireEvent.click(startButtons[0]);

    // Finish drill
    const finishBtn = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishBtn);

    // Assert fetch call is made to /api/coach
    expect(fetch).toHaveBeenCalled();

    // Verify transcript is rendered
    expect(await screen.findByText(/"I just think BLUF is important."/)).toBeInTheDocument();

    // Verify coaching report elements
    expect(await screen.findByText('Good attempt, but you started with a hedge.')).toBeInTheDocument();
    expect(screen.getByText('"We missed Q3 targets because retention fell 5%."')).toBeInTheDocument();
    expect(screen.getByText('Avoid starting with "I think".')).toBeInTheDocument();
  });
});
