const client = require('./api');
const config = require('../config');

class Poller {
  constructor(onUpdateCallback) {
    this.offset = null;
    this.onUpdate = onUpdateCallback;
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    console.log('[Poller] מפעיל האזנה להודעות...');

    while (this.isRunning) {
      try {
        let url = `/updates?limit=50&timeout=${config.pollTimeout}`;
        if (this.offset !== null && this.offset !== undefined) {
          url += `&offset=${this.offset}`;
        }

        const res = await client.sendRaw(url, 'GET');

        if (res && res.entry) {
          if (res.next_offset !== undefined) {
            this.offset = res.next_offset;
          }

          for (const entry of res.entry) {
            for (const change of (entry.changes || [])) {
              if (change.value && this.onUpdate) {
                await this.onUpdate(change.value);
              }
            }
          }
        }
      } catch (err) {
        if (err.response) {
          const status = err.response.status;
          if (status === 204) {
            continue; // פסק זמן ללא תוכן - ממשיכים עם אותו ה-offset
          } else if (status === 429 || status === 500) {
            console.warn(`[Poller ${status}] המתנה של 10 שניות עקב עומס...`);
            await new Promise(r => setTimeout(r, 10000));
          } else if (status === 409) {
            console.warn('[Poller 409] סקר חדש החליף את הנוכחי.');
            await new Promise(r => setTimeout(r, 5000));
          } else {
            // סטטוס לא צפוי (401/403/400 וכו') — המתנה לפני ניסיון חוזר כדי לא
            // להיכנס ללולאה צפופה שמפציצה את ה-API
            console.warn(`[Poller ${status}] שגיאה לא צפויה, המתנה של 10 שניות...`);
            await new Promise(r => setTimeout(r, 10000));
          }
        } else {
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }
  }

  stop() {
    this.isRunning = false;
  }
}

module.exports = Poller;
