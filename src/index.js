const Poller = require('./client/poller');
const client = require('./client/api');
const db = require('./services/database');
const { processIncomingUpdate } = require('./handlers/messageHandler');
const config = require('./config');

console.log('====================================');
console.log('🤖 WhatsApp Agent Bot Platform v1');
console.log('====================================');

if (!config.apiToken || config.apiToken === 'your_token_here') {
  console.error('❌ חובה להגדיר את WA_API_TOKEN בקובץ .env!');
  process.exit(1);
}

// לולאת רקע לתזכורות - רצה כל 5 שניות
setInterval(async () => {
  const now = Date.now();
  const data = db.get();
  const due = (data.reminders || []).filter(r => r.dueTime <= now);

  if (due.length > 0) {
    db.update(d => {
      d.reminders = d.reminders.filter(r => r.dueTime > now);
    });

    for (const rem of due) {
      try {
        await client.sendMessage(rem.to, `⏰ *תזכורת:* ${rem.text}`);
      } catch (e) {
        console.error('שגיאה בשליחת תזכורת:', e);
      }
    }
  }
}, 5000);

const poller = new Poller(processIncomingUpdate);
poller.start();

process.on('SIGINT', () => {
  console.log('\nסוגר בוט...');
  poller.stop();
  process.exit(0);
});

// SIGTERM (למשל kill או כיבוי/אתחול של המכונה) — לרשום שורת כיבוי כדי שמוות
// חיצוני לא ייראה כמו קריסה מסתורית בלוג
process.on('SIGTERM', () => {
  console.log('[Shutdown] התקבל SIGTERM — סוגר בצורה מסודרת');
  poller.stop();
  process.exit(0);
});
