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
        setTranscript('I ate a ham sandwich today.');
      },
      stopListening: () => setIsListening(false),
      error: null,
      setTranscript,
    };
  }
}));

vi.mock('../hooks/useCurriculum', () => ({
  useCurriculum: () => ({
    modules: [
      {
        id: 'mod-1',
        lessons: [
          {
            id: 'lesson-the-dials',
            body: {
              drills: [
                {
                  id: 'ham-sandwich',
                  title: 'The "Ham Sandwich" Tone Drill',
                  situation: 'You are an actor preparing for an audition.',
                  explanation: 'Tone carries meaning more than words.',
                  durationSecs: 60,
                  task: 'Deliver this exact line FOUR times...',
                  starterPhrase: 'I ate a ham sandwich today.',
                  successCriteria: ['Each delivery sounds emotionally distinct', 'You varied pace, volume, and pitch across all four', 'A listener could guess the emotion without seeing your face'],
                  modelAnswer: 'Tragic: (slow, breaking voice) "I... ate a ham sandwich... today."'
                }
              ]
            }
          }
        ]
      }
    ],
    loading: false
  })
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

    expect(screen.getByText('The "Ham Sandwich" Tone Drill')).toBeInTheDocument();
    expect(screen.getByText(/Tone carries meaning more than words/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Learn the concept/i).length).toBeGreaterThan(0);
  });

  it('navigates to lesson when clicking "Learn the concept"', () => {
    render(<Drills setCurrentView={mockSetCurrentView} />);

    const learnButtons = screen.getAllByText(/Learn the concept/i);
    fireEvent.click(learnButtons[0]);

    expect(mockSetActiveLessonId).toHaveBeenCalledWith('lesson-the-dials');
    expect(mockSetCurrentView).toHaveBeenCalledWith('lesson');
  });

  it('allows selecting a drill to show the briefing, and then starting it', () => {
    render(<Drills setCurrentView={mockSetCurrentView} />);

    const startButtons = screen.getAllByRole('button', { name: /start drill/i });
    fireEvent.click(startButtons[0]); // Selects the "Ham Sandwich" drill

    // Briefing check:
    expect(screen.getByText('THE SITUATION')).toBeInTheDocument();
    expect(screen.getByText('BACKGROUND')).toBeInTheDocument();
    expect(screen.getByText('YOUR TASK')).toBeInTheDocument();
    expect(screen.getAllByText(/You are an actor preparing for an audition/i).length).toBe(2);

    // Start speaking check:
    const startSpeakingBtn = screen.getByRole('button', { name: /start speaking/i });
    fireEvent.click(startSpeakingBtn);

    // It should now be in the active state (with finish button)
    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
  });

  it('submits transcript and displays coach response when clicking finish', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        feedback: 'Excellent vocal variation and emotional distinction.',
        appliedConcept: 'ham-sandwich',
        suggestedRewrite: 'Tragic: "I... ate a ham sandwich..." Furious: "I ATE it!"',
        tips: ['Vary your pitch further.', 'Project your voice.']
      })
    }));

    render(<Drills setCurrentView={mockSetCurrentView} />);

    // Select drill
    const startButtons = screen.getAllByRole('button', { name: /start drill/i });
    fireEvent.click(startButtons[0]);

    // Start speaking
    const startSpeakingBtn = screen.getByRole('button', { name: /start speaking/i });
    fireEvent.click(startSpeakingBtn);

    // Finish drill
    const finishBtn = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishBtn);

    // Assert fetch call is made to /api/coach
    expect(fetch).toHaveBeenCalled();

    // Verify transcript is rendered
    expect(await screen.findByText(/I ate a ham sandwich today\./)).toBeInTheDocument();

    // Verify coaching report elements
    expect(await screen.findByText('Excellent vocal variation and emotional distinction.')).toBeInTheDocument();
    expect(screen.getByText(/Tragic: "I\.\.\. ate a ham sandwich\.\.\." Furious: "I ATE it!"/)).toBeInTheDocument();
    expect(screen.getByText('Vary your pitch further.')).toBeInTheDocument();
  });
});
