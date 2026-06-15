import { useState, useCallback } from 'react';

const HEDGING_WORDS = [
  'i think', 'maybe', 'just', 'sort of', 'kind of', 'probably', 'might',
  'perhaps', 'basically', 'actually', 'literally'
];

// Conservative discourse-filler list. These add no meaning and signal
// thinking-aloud; the de-fillering lesson teaches replacing them with a pause.
const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'hmm', 'you know', 'i mean', 'like', 'so', 'well'
];

const countMatches = (haystack, phrases) => {
  let total = 0;
  phrases.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = haystack.match(regex);
    if (matches) {
      total += matches.length;
    }
  });
  return total;
};

export const useSpeechAnalyzer = () => {
  const [hedgingCount, setHedgingCount] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [wpm, setWpm] = useState(0);

  const analyzeTranscript = useCallback((transcript, durationSeconds) => {
    if (!transcript) {
      setHedgingCount(0);
      setFillerCount(0);
      setWpm(0);
      return { hedgingCount: 0, fillerCount: 0, wpm: 0 };
    }

    const lowerTranscript = transcript.toLowerCase();
    const hedges = countMatches(lowerTranscript, HEDGING_WORDS);
    const fillers = countMatches(lowerTranscript, FILLER_WORDS);

    setHedgingCount(hedges);
    setFillerCount(fillers);

    const words = transcript.trim().split(/\s+/).length;
    const minutes = durationSeconds / 60;
    const calculatedWpm = minutes > 0 ? Math.round(words / minutes) : 0;
    setWpm(calculatedWpm);

    return { hedgingCount: hedges, fillerCount: fillers, wpm: calculatedWpm };
  }, []);

  return { analyzeTranscript, hedgingCount, fillerCount, wpm };
};
