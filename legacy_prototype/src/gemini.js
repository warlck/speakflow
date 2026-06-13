export async function getGeminiCoachingReport(apiKey, sessionData) {
  // gemini-1.5-flash has been retired; use the current stable flash model
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

  const systemPrompt = `You are SpeakFlow AI, an elite public speaking coach. You specialize in diagnosing speech patterns, particularly word retrieval struggles (tip-of-the-tongue phenomenon, blocking, and excessive pauses).
Analyze the user's transcript and provided stats, then construct a detailed feedback report.
Return ONLY a valid JSON object matching the schema below. Do not wrap in markdown \`\`\`json blocks.

JSON Response Schema:
{
  "overallAssessment": "String (Summary of performance and speaking profile)",
  "strengths": ["Array of 3 strings detailing specific strengths"],
  "improvements": ["Array of 3 strings detailing actionable improvements"],
  "wordRetrievalFeedback": "String (Analysis focusing on their word recall blockages and custom recovery strategies)",
  "nextExercise": "String (Recommended follow-up exercise name/instruction)"
}`;

  const prompt = `
Session Stats:
- Speaking Pace: ${sessionData.wpm} WPM
- Fluency Score: ${sessionData.fluencyScore}/100
- Total Filler Words: ${sessionData.totalFillers}
- Long Pauses Detected: ${sessionData.longPausesCount}
- Word Recall Difficulty Score: ${sessionData.totScore}/100

Speech Transcript:
"${sessionData.transcript}"
  `;

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Keep the key out of the URL so it doesn't leak into logs/history
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini API request failed (${response.status})`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Gemini returned an empty response');
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Gemini Coaching API Error:', error);
    throw error;
  }
}
