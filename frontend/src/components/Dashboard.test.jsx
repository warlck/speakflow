import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Dashboard from './Dashboard';
import { useAppContext } from '../context/AppContext';
import { useSpeechAnalyzer } from '../hooks/useSpeechAnalyzer';

vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

vi.mock('../hooks/useCurriculum', () => ({
  useCurriculum: () => ({
    modules: [{ id: 'm1', title: 'Module 1' }],
    loading: false,
    error: null,
  })
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
      completedLessons: [],
      isLessonComplete: () => false,
      diagnosticResult: {
        goal: 'presence',
        metrics: {},
        recommendation: { reason: 'Test reason', lessonId: 'lesson-1' }
      },
      setDiagnosticResult: vi.fn(),
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

    const startBtn = screen.getByRole('button', { name: /^start$/i });
    fireEvent.click(startBtn);

    const stopBtn = screen.getByRole('button', { name: /^stop$/i });
    fireEvent.click(stopBtn);

    const assessment = await screen.findByText('Good pace, but too many hedges.');
    expect(assessment).toBeInTheDocument();

    expect(screen.getByText(/Recommended Practice: Speak with Conviction/i)).toBeInTheDocument();
    expect(screen.getByText(/We detected 3 hedging words/i)).toBeInTheDocument();

    const startLessonBtn = screen.getByRole('button', { name: /start lesson/i });
    fireEvent.click(startLessonBtn);

    expect(mockSetActiveLessonId).toHaveBeenCalledWith('lesson-dehedging');
    expect(mockSetCurrentView).toHaveBeenCalledWith('lesson');
  });

  it('renders diagnostic flow if diagnosticResult is not set', async () => {
    useAppContext.mockReturnValue({
      activeOutline: null,
      setActiveLessonId: mockSetActiveLessonId,
      completedLessons: [],
      isLessonComplete: () => false,
      diagnosticResult: null, // Force diagnostic view
      setDiagnosticResult: vi.fn(),
    });

    useSpeechAnalyzer.mockReturnValue({
      analyzeTranscript: vi.fn().mockReturnValue({ wpm: 120, hedgingCount: 0, fillerCount: 0 }),
      hedgingCount: 0,
      wpm: 0,
    });

    render(<Dashboard setCurrentView={mockSetCurrentView} />);

    expect(screen.getByText('Welcome to SpeakFlow')).toBeInTheDocument();
    
    // Select goal
    const anxietyBtn = screen.getByText('Overcome speaking anxiety');
    fireEvent.click(anxietyBtn);
    
    const continueBtn = screen.getByRole('button', { name: /Continue to Baseline Recording/i });
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);

    expect(screen.getByText('Baseline Recording')).toBeInTheDocument();
  });
});
