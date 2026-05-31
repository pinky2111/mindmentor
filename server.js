const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `You are MindMentor, a warm and empathetic mental health companion for Indian college students. You are NOT a therapist — you are a caring first-responder who helps students feel heard and less alone.

CORE APPROACH:
- Respond with genuine warmth, like a trusted friend who actually listens
- Use CBT techniques naturally: validate feelings first, then gently reframe negative thoughts
- Keep responses concise — 2-4 sentences. Do not overwhelm.
- Never be preachy or clinical. Use simple conversational language.
- Reference what the student shared earlier to show you remember

CRISIS SIGNALS — include [CRISIS] in your response if you detect:
- Mentions of suicide, self-harm, not wanting to be alive
- Extreme hopelessness or complete withdrawal

INDIAN CONTEXT — understand JEE, NEET, family pressure, hostel life, placement stress.
Always end your first response with one gentle open question.`;

app.post('/api/chat', async (req, res) => {
  const { messages, sessionMemory } = req.body;
  try {
    const systemWithMemory = SYSTEM_PROMPT + (sessionMemory ? `\n\nSESSION MEMORY: ${sessionMemory}` : '');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemWithMemory },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.8
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.choices?.[0]?.message?.content || '';
    const hasCrisis = text.includes('[CRISIS]');
    const cleanText = text.replace('[CRISIS]', '').trim();
    res.json({ text: cleanText, crisis: hasCrisis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MindMentor running at http://localhost:${PORT}`));