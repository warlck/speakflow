import { useState, useCallback } from 'react';

const HEDGING_WORDS = [
  'i think', 'maybe', 'just', 'sort of', 'kind of', 'probably', 'might',
  'perhaps', 'basically', 'actually', 'literally'
];

export const useSpeechAnalyzer = () => {
  const [hedgingCount, setHedgingCount] = useState(0);
  const [wpm, setWpm] = useState(0);

  const analyzeTranscript = useCallback((transcript, durationSeconds) => {
    if (!transcript) {
      setHedgingCount(0);
      setWpm(0);
      return;
    }

    const lowerTranscript = transcript.toLowerCase();
    let hedges = 0;

    HEDGING_WORDS.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerTranscript.match(regex);
      if (matches) {
        hedges += matches.length;
      }
    });

    setHedgingCount(hedges);

    const words = transcript.trim().split(/\s+/).length;
    const minutes = durationSeconds / 60;
    const calculatedWpm = minutes > 0 ? Math.round(words / minutes) : 0;
    setWpm(calculatedWpm);

    return { hedgingCount: hedges, wpm: calculatedWpm };
  }, []);

  return { analyzeTranscript, hedgingCount, wpm };
};
