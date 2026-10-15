const axios = require('axios');
const config = require('../config');
const { t } = require('../i18n');

async function askGemini(prompt) {
  if (!config.geminiApiKey) {
    return t('gemini.noKey');
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
    return t('gemini.commError', { err: e.response?.data?.error?.message || e.message });
  }
}

module.exports = { askGemini };
