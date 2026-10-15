const { askGemini } = require('../services/gemini');
const db = require('../services/database');
const { t } = require('../i18n');

module.exports = {
  async ask(client, msg, args) {
    const query = args.join(' ');
    if (!query) return client.sendMessage(msg.from, t('ai.ask.usage'));
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
      return client.sendMessage(msg.from, t('ai.summarize.usage'));
    }

    const reply = await askGemini(`${t('ai.summarize.prompt')}\n\n${textToSummarize}`);
    await client.sendMessage(msg.from, t('ai.summarize.title', { reply }), msg.id);
  },

  async imagine(client, msg, args) {
    const desc = args.join(' ');
    if (!desc) return client.sendMessage(msg.from, t('ai.imagine.usage'));
    const reply = await askGemini(`Create a detailed, high-resolution realistic image generation prompt in English for: "${desc}"`);
    await client.sendMessage(msg.from, t('ai.imagine.title', { reply }), msg.id);
  },

  async translate(client, msg, args) {
    if (args.length < 2) return client.sendMessage(msg.from, t('ai.translate.usage'));
    const target = args[0];
    const text = args.slice(1).join(' ');
    const reply = await askGemini(`Translate the following text accurately into ${target}:\n\n${text}`);
    await client.sendMessage(msg.from, reply, msg.id);
  }
};
