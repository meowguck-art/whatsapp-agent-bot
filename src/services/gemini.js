const axios = require('axios');
const config = require('../config');

async function askGemini(prompt) {
  if (!config.geminiApiKey) {
    return "שגיאה: לא הוגדר GEMINI_API_KEY בקובץ .env";
  }
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return res.data.candidates[0].content.parts[0].text;
  } catch (e) {
    return "שגיאה בתקשורת עם הבינה המלאכותית: " + (e.response?.data?.error?.message || e.message);
  }
}

module.exports = { askGemini };
