const { askGemini } = require('../services/gemini');
const db = require('../services/database');

module.exports = {
  async ask(client, msg, args) {
    const query = args.join(' ');
    if (!query) return client.sendMessage(msg.from, 'אנא ספק שאלה לאחר הפקודה.');
    const reply = await askGemini(query);
    await client.sendMessage(msg.from, reply, msg.id);
  },

  async summarize(client, msg, args, rawMsg) {
    let textToSummarize = args.join(' ');

    if (rawMsg.context?.id) {
      const quoted = db.get().recentMessages[rawMsg.context.id];
      if (quoted && quoted.text) {
        textToSummarize = quoted.text;
      }
    }

    if (!textToSummarize) {
      return client.sendMessage(msg.from, '❌ הגב (Reply) על הודעה שברצונך לסכם, או כתוב את הטקסט לאחר הפקודה !סכם.');
    }

    const reply = await askGemini(`סכם את הטקסט הבא בצורה תמציתית, ברורה ומסודרת בנקודות:\n\n${textToSummarize}`);
    await client.sendMessage(msg.from, `📝 *סיכום:*\n\n${reply}`, msg.id);
  },

  async imagine(client, msg, args) {
    const desc = args.join(' ');
    if (!desc) return client.sendMessage(msg.from, 'אנא הזן תיאור לתמונה.');
    const reply = await askGemini(`Create a detailed, high-resolution realistic image generation prompt in English for: "${desc}"`);
    await client.sendMessage(msg.from, `🎨 *Image Prompt:*\n\n${reply}`, msg.id);
  },

  async translate(client, msg, args) {
    if (args.length < 2) return client.sendMessage(msg.from, 'שימוש: !תרגם [שפה] [טקסט]');
    const target = args[0];
    const text = args.slice(1).join(' ');
    const reply = await askGemini(`Translate the following text accurately into ${target}:\n\n${text}`);
    await client.sendMessage(msg.from, reply, msg.id);
  }
};
