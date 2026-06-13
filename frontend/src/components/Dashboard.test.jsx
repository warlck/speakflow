import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Dashboard from './Dashboard';
import { useAppContext } from '../context/AppContext';
import { useSpeechAnalyzer } from '../hooks/useSpeechAnalyzer';

vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

vi.mock('../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => {
    const [isListening, setIsListening] = React.useState(false);
    const [transcript, setTranscript] = React.useState('I just think we should maybe wait.');
    return {
      isListening,
      transcript,
      startListening: () => {
        setIsListening(true);
        setTranscript('I just think we should maybe wait.');
      },
      stopListening: () => setIsListening(false),
      error: null,
      setTranscript,
    };
  }
}));

vi.mock('../hooks/useSpeechAnalyzer', () => ({
  useSpeechAnalyzer: vi.fn(),
}));

describe('Dashboard Component', () => {
  const mockSetCurrentView = vi.fn();
  const mockSetActiveLessonId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppContext.mockReturnValue({
      activeOutline: null,
      setActiveLessonId: mockSetActiveLessonId,
    });
  });

  it('renders dashboard correctly', () => {
    useSpeechAnalyzer.mockReturnValue({
      analyzeTranscript: vi.fn(),
      hedgingCount: 0,
      wpm: 0,
    });

    render(<Dashboard setCurrentView={mockSetCurrentView} />);

    expect(screen.getByText('SpeakFlow Executive')).toBeInTheDocument();
    expect(screen.getByText('Live Metrics')).toBeInTheDocument();
  });

  it('displays lesson recommendation banner when hedging count is high', async () => {
    useSpeechAnalyzer.mockReturnValue({
      analyzeTranscript: vi.fn().mockReturnValue({ wpm: 120, hedgingCount: 3 }),
      hedgingCount: 3, // High hedging
      wpm: 120,
    });

    // To show the report, we mock state/props if report is non-null
    // In our component, let's look at how report state is set. We can either simulate the evaluation response
    // or we can test that the banner is displayed when the report is rendered.
    // Let's mock the fetch API for /api/evaluate
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        executiveScore: 75,
        overallAssessment: 'Good pace, but too many hedges.',
        strengths: ['Pacing is stable'],
        improvements: ['Reduce hedging words']
      })
    }));

    render(<Dashboard setCurrentView={mockSetCurrentView} />);

    // Click Stop button to trigger evaluation
    // Since start is not clicked, we should trigger start and then stop, or mock state.
    // Actually, in Dashboard, report is rendered when `report` state is not null.
    // Let's trigger a flow where we start, speak, and stop.
    const startBtn = screen.getByRole('button', { name: /start/i });
    fireEvent.click(startBtn);

    const stopBtn = screen.getByRole('button', { name: /stop/i });
    fireEvent.click(stopBtn);

    // Wait for the report to render
    const assessment = await screen.findByText('Good pace, but too many hedges.');
    expect(assessment).toBeInTheDocument();

    // Check if the recommendation banner is visible
    expect(screen.getByText(/Recommended Practice: Speak with Conviction/i)).toBeInTheDocument();
    expect(screen.getByText(/We detected 3 hedging words/i)).toBeInTheDocument();

    // Click Start Lesson button
    const startLessonBtn = screen.getByRole('button', { name: /start lesson/i });
    fireEvent.click(startLessonBtn);

    expect(mockSetActiveLessonId).toHaveBeenCalledWith('lesson-dehedging-core');
    expect(mockSetCurrentView).toHaveBeenCalledWith('lesson');
  });
});
