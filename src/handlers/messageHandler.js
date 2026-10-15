const client = require('../client/api');
const db = require('../services/database');
const { handleCommand } = require('./commandHandler');

async function processIncomingUpdate(data) {
  const contact = (data.contacts && data.contacts[0]) || null;
  const messages = data.messages || [];

  for (const msg of messages) {
    // לחיצה על כפתור תשובה אינטראקטיבי — להפוך לפקודה רגילה לפי ה-id של הכפתור
    const buttonReply = msg.type === 'interactive' ? msg.interactive?.button_reply : null;
    if (buttonReply?.id) {
      msg.text = { body: `!${buttonReply.id}` };
      msg.buttonReply = buttonReply;
    }

    // שמירת כל סוגי המדיה - כולל שמע (audio), סרטון (video), תמונה ומסמך
    const mediaId = msg.audio?.id || msg.video?.id || msg.image?.id || msg.document?.id || null;

    db.update(d => {
      d.recentMessages[msg.id] = {
        from: msg.from,
        text: msg.text?.body || msg.image?.caption || msg.video?.caption || buttonReply?.title || `[${msg.type}]`,
        timestamp: msg.timestamp,
        type: msg.type,
        mediaId: mediaId
      };

      // הגבלת הגודל: שמירת 300 ההודעות האחרונות בלבד (מניעת התנפחות data.json)
      const ids = Object.keys(d.recentMessages);
      if (ids.length > 300) {
        ids
          .sort((a, b) => (d.recentMessages[a].timestamp || 0) - (d.recentMessages[b].timestamp || 0))
          .slice(0, ids.length - 300)
          .forEach(id => delete d.recentMessages[id]);
      }
    });

    await handleCommand(client, msg, { ...msg, contact });
  }
}

module.exports = { processIncomingUpdate };
