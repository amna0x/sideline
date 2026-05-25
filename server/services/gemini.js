// Service for interacting with Gemini API or Claude API to generate quizzes and player ratings dynamically.

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CLAUDE_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

export async function askAI(prompt, systemInstruction = '') {
  if (GEMINI_KEY) {
    return await askGemini(prompt, systemInstruction);
  } else if (CLAUDE_KEY) {
    return await askClaude(prompt, systemInstruction);
  } else {
    console.warn('[AI Service] No Gemini or Claude API key configured.');
    return null;
  }
}

async function askGemini(prompt, systemInstruction) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`Gemini HTTP Error ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(rawText || 'null');
  } catch (err) {
    console.error('[Gemini API] Failed to query:', err.message);
    return null;
  }
}

async function askClaude(prompt, systemInstruction) {
  const url = 'https://api.anthropic.com/v1/messages';
  const systemPrompt = systemInstruction ? systemInstruction + '\nReturn response in JSON format.' : 'Return response in JSON format.';
  const body = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`Claude HTTP Error ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const rawText = data.content?.[0]?.text;
    
    // Extract JSON if it is wrapped in markdown code blocks
    let jsonText = rawText || '';
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }
    
    return JSON.parse(jsonText || 'null');
  } catch (err) {
    console.error('[Claude API] Failed to query:', err.message);
    return null;
  }
}

export async function generateQuiz(matchId, homeTeam, awayTeam) {
  const prompt = `Generate a 5-question trivia quiz about the football match between ${homeTeam} and ${awayTeam} in the German Bundesliga. Return EXACTLY a JSON array of objects. Do NOT return markdown or wrap in backticks.`;
  const systemInstruction = `You are a Bundesliga trivia expert. Return only a JSON array of 5 questions.
Each question object MUST have exactly these fields:
- "id": string (unique question id, e.g. "q_1", "q_2"...)
- "match_id": "${matchId}"
- "question": string
- "options": array of exactly 4 strings
- "correct_answer": string (must match one of the options elements EXACTLY)
- "fun_fact": string
- "difficulty": "easy" | "medium" | "hard"`;

  return await askAI(prompt, systemInstruction);
}

export async function generatePlayerRatings(homeTeam, awayTeam, events = []) {
  const eventLogs = events.map(e => `${e.minute}' - ${e.type} by ${e.player_name || 'unknown'} (${e.team})`).join('\n');
  const prompt = `Generate realistic player ratings (out of 10) for 6 key players in the match between ${homeTeam} and ${awayTeam} based on the following match events:\n${eventLogs || 'No events recorded.'}\nReturn EXACTLY a JSON object with a "ratings" array containing objects.`;
  const systemInstruction = `You are a professional football analyst. Return only a JSON object of player ratings.
Format MUST be:
{
  "ratings": [
    {
      "name": string (player name),
      "rating": number (rating from 1.0 to 10.0, e.g. 7.8, 8.5),
      "position": "GK" | "DF" | "MF" | "FW",
      "summary": string (one-sentence summary of performance)
    }
  ]
}`;

  return await askAI(prompt, systemInstruction);
}
