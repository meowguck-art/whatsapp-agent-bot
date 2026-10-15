const client = require('./api');
const config = require('../config');
const { t } = require('../i18n');

class Poller {
  constructor(onUpdateCallback) {
    this.offset = null;
    this.onUpdate = onUpdateCallback;
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    console.log(t('poller.start'));

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
            console.warn(t('poller.rateLimit', { status }));
            await new Promise(r => setTimeout(r, 10000));
          } else if (status === 409) {
            console.warn(t('poller.replaced'));
            await new Promise(r => setTimeout(r, 5000));
          } else {
            // סטטוס לא צפוי (401/403/400 וכו') — המתנה לפני ניסיון חוזר כדי לא
            // להיכנס ללולאה צפופה שמפציצה את ה-API
            console.warn(t('poller.unexpected', { status }));
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
