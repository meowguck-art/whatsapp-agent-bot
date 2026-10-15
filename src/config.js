require('dotenv').config();

module.exports = {
  baseUrl: process.env.WA_BASE_URL || 'https://api.whatsapp.com/agent/v1',
  apiToken: process.env.WA_API_TOKEN,
  geminiApiKey: process.env.GEMINI_API_KEY,
  ownerId: process.env.BOT_OWNER_ID,
  defaultMode: process.env.BOT_MODE || 'public',
  pollTimeout: parseInt(process.env.POLL_TIMEOUT || '15', 10),
  startTime: Date.now()
};
