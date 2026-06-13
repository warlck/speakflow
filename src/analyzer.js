export const FILLER_WORDS = [
  'um', 'uh', 'ah', 'er', 'like', 'you know', 'i mean', 'basically', 'actually', 'literally', 'sort of', 'kind of'
];

// Escape HTML special chars before inserting transcript text via innerHTML
export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function analyzeSpeech(transcript, durationSeconds, pausesList) {
  const cleanText = transcript.trim();
  if (!cleanText) {
    return {
      wordCount: 0,
      wpm: 0,
      fillers: {},
      totalFillers: 0,
      vocabularyDiversity: 0,
      fluencyScore: 100,
      totScore: 0,
      longPausesCount: 0
    };
  }

  const words = cleanText.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  
  // 1. Calculate Speaking Pace (WPM)
  const durationMinutes = durationSeconds / 60 || 0.01;
  const wpm = Math.round(wordCount / durationMinutes);

  // 2. Count Filler Words
  const fillersMap = {};
  let totalFillers = 0;
  
  FILLER_WORDS.forEach(filler => {
    // Regex matching filler words with boundaries
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = transcript.match(regex);
    if (matches) {
      fillersMap[filler] = matches.length;
      totalFillers += matches.length;
    }
  });

  // 3. Compute Vocabulary Diversity (Type-Token Ratio)
  const uniqueWords = new Set(words);
  const vocabularyDiversity = Math.round((uniqueWords.size / wordCount) * 100);

  // 4. Highlight Filler & Pauses into Tip-of-Tongue Metrics
  // Long pauses and sentences cut short correlate to word retrieval blockades.
  const longPausesCount = pausesList.filter(p => p.duration >= 2.0).length;
  
  // Heuristic-based Fluency score (starts at 100, drops per pause/filler)
  const fillerPenalty = totalFillers * 2.5;
  const pausePenalty = longPausesCount * 5;
  const fluencyScore = Math.max(10, Math.round(100 - fillerPenalty - pausePenalty));

  // Compute a Tip-of-the-Tongue score indicator (0 - 100 scale)
  // Weighted heavily by long silence pauses & fillers
  const totScore = Math.min(100, Math.round((longPausesCount * 25) + (totalFillers * 3)));

  return {
    wordCount,
    wpm,
    fillers: fillersMap,
    totalFillers,
    vocabularyDiversity,
    fluencyScore,
    totScore,
    longPausesCount
  };
}

// Function to highlight fillers and suspected retrieval pauses inline for rendering
export function highlightTranscript(transcript) {
  let html = escapeHtml(transcript);
  
  // Highlight filler words
  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`\\b(${filler})\\b`, 'gi');
    html = html.replace(regex, '<span class="filler-highlight">$1</span>');
  });

  return html;
}
