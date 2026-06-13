import { renderHook, act } from '@testing-library/react';
import { useSpeechAnalyzer } from './useSpeechAnalyzer';

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
