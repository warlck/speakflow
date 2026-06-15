import { renderHook, act } from '@testing-library/react';
import { useSpeechAnalyzer } from './useSpeechAnalyzer';
import { describe, it, expect } from 'vitest';

describe('useSpeechAnalyzer', () => {
  it('should correctly count hedging words', () => {
    const { result } = renderHook(() => useSpeechAnalyzer());

    let analysis;
    act(() => {
      analysis = result.current.analyzeTranscript('I think we maybe sort of want to do this, actually.', 60);
    });

    expect(analysis.hedgingCount).toBe(4);
    expect(result.current.hedgingCount).toBe(4);
  });

  it('should count filler words and return them', () => {
    const { result } = renderHook(() => useSpeechAnalyzer());

    let analysis;
    act(() => {
      analysis = result.current.analyzeTranscript('Um, so you know, uh I mean we should, like, ship it.', 60);
    });

    // um, so, you know, uh, i mean, like = 6 fillers
    expect(analysis.fillerCount).toBe(6);
    expect(result.current.fillerCount).toBe(6);
  });

  it('returns zeroed metrics for empty transcript', () => {
    const { result } = renderHook(() => useSpeechAnalyzer());

    let analysis;
    act(() => {
      analysis = result.current.analyzeTranscript('', 60);
    });

    expect(analysis).toEqual({ hedgingCount: 0, fillerCount: 0, wpm: 0 });
  });

  it('should calculate WPM correctly', () => {
    const { result } = renderHook(() => useSpeechAnalyzer());

    let analysis;
    act(() => {
      // 10 words in 30 seconds should be 20 WPM
      analysis = result.current.analyzeTranscript('One two three four five six seven eight nine ten', 30);
    });

    expect(analysis.wpm).toBe(20);
    expect(result.current.wpm).toBe(20);
  });
});
