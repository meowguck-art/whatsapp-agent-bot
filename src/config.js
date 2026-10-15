require('dotenv').config();

module.exports = {
  baseUrl: process.env.WA_BASE_URL || 'https://api.whatsapp.com/agent/v1',
  apiToken: process.env.WA_API_TOKEN,
  geminiApiKey: process.env.GEMINI_API_KEY,
  ownerId: process.env.BOT_OWNER_ID,
  defaultMode: process.env.BOT_MODE || 'public',
  pollTimeout: parseInt(process.env.POLL_TIMEOUT || '15', 10),
  // Bot language: 'he' (Hebrew, default) or 'en' (English). Controlled by BOT_LANG.
  lang: (process.env.BOT_LANG || 'he').toLowerCase().startsWith('en') ? 'en' : 'he',
  startTime: Date.now()
};
