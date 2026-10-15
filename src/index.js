const Poller = require('./client/poller');
const client = require('./client/api');
const db = require('./services/database');
const { processIncomingUpdate } = require('./handlers/messageHandler');
const config = require('./config');
const { t } = require('./i18n');

console.log('====================================');
console.log('🤖 WhatsApp Agent Bot Platform v1');
console.log('====================================');

if (!config.apiToken || config.apiToken === 'your_token_here') {
  console.error(t('index.noToken'));
  process.exit(1);
}

// לולאת רקע לתזכורות - רצה כל 5 שניות / background reminder loop, every 5s
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
        await client.sendMessage(rem.to, t('index.reminder', { text: rem.text }));
      } catch (e) {
        console.error(t('index.reminderError'), e);
      }
    }
  }
}, 5000);

const poller = new Poller(processIncomingUpdate);
poller.start();

process.on('SIGINT', () => {
  console.log(t('index.closing'));
  poller.stop();
  process.exit(0);
});

// SIGTERM (למשל kill או כיבוי/אתחול של המכונה) — לרשום שורת כיבוי כדי שמוות
// חיצוני לא ייראה כמו קריסה מסתורית בלוג
process.on('SIGTERM', () => {
  console.log(t('index.sigterm'));
  poller.stop();
  process.exit(0);
});
