const axios = require('axios');
const { t, pick } = require('../i18n');

const cityMap = {
  'ירושלים': 'IL-Jerusalem',
  'תל אביב': 'IL-Tel Aviv',
  'תלאביב': 'IL-Tel Aviv',
  'חיפה': 'IL-Haifa',
  'באר שבע': 'IL-Beer Sheva',
  'פתח תקווה': 'IL-Petah Tikva'
};

const back = t('menu.back');
const pages = {
  // עמוד ראשי / main page
  main: t('menu.main'),

  // 1. בינה מלאכותית / AI
  '1': t('menu.p1', { back }),

  // 2. מדיה והורדות / media
  '2': t('menu.p2', { back }),

  // 3. כלים ומידע יומי / tools
  '3': t('menu.p3', { back }),

  // 4. משחקים וקהילה / games
  '4': t('menu.p4', { back }),

  // 5. מערכת ומנהל / admin
  '5': t('menu.p5', { back })
};

module.exports = {
  async menu(client, msg, args) {
    const pageNum = args[0]?.trim();
    const content = pages[pageNum] || pages.main;
    await client.sendMessage(msg.from, content, msg.id);
  },

  // הדגמת כפתורים אינטראקטיביים (ללא תבנית) + כפתור שיחת קול.
  // אם הפלטפורמה עדיין לא תומכת בסוג ההודעה — מסבירים במקום להיכשל בשקט.
  async buttonsDemo(client, msg) {
    try {
      await client.sendInteractiveButtons(
        msg.from,
        t('general.buttons.title'),
        [
          { id: '1', title: t('general.buttons.ai') },
          { id: 'ping', title: t('general.buttons.ping') },
          { id: 'בדיחה', title: t('general.buttons.joke') }
        ],
        { footer: t('general.buttons.footer') }
      );
      await client.sendVoiceCallButton(
        msg.from,
        t('general.buttons.callBody'),
        { displayText: t('general.buttons.callNow') }
      );
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 131009) {
        await client.sendMessage(msg.from, t('general.buttons.unsupported'));
        return;
      }
      throw err;
    }
  },

  async menu1(client, msg) { await client.sendMessage(msg.from, pages['1'], msg.id); },
  async menu2(client, msg) { await client.sendMessage(msg.from, pages['2'], msg.id); },
  async menu3(client, msg) { await client.sendMessage(msg.from, pages['3'], msg.id); },
  async menu4(client, msg) { await client.sendMessage(msg.from, pages['4'], msg.id); },
  async menu5(client, msg) { await client.sendMessage(msg.from, pages['5'], msg.id); },

  async shabbat(client, msg, args) {
    const rawCity = args.join(' ').trim() || pick('ירושלים', 'Jerusalem');
    const knownCity = cityMap[rawCity];
    const cityCode = knownCity || 'IL-Jerusalem';
    try {
      const res = await axios.get(`https://www.hebcal.com/shabbat?cfg=json&city=${cityCode}&M=on`);
      const items = res.data.items || [];
      let candle = '', havdalah = '', parasha = '';
      items.forEach(item => {
        if (item.category === 'candles') candle = item.title;
        if (item.category === 'havdalah') havdalah = item.title;
        if (item.category === 'parashat') parasha = pick(item.hebrew || item.title, item.title || item.hebrew);
      });
      const note = knownCity ? '' : t('general.shabbat.fallback');
      await client.sendMessage(msg.from, t('general.shabbat.result', {
        city: rawCity,
        parasha,
        candle: candle.replace('Candle lighting: ', ''),
        havdalah: havdalah.replace('Havdalah: ', ''),
        note
      }));
    } catch {
      await client.sendMessage(msg.from, t('general.shabbat.error'));
    }
  },

  async ping(client, msg) {
    const delay = Math.abs(Date.now() - parseInt(msg.timestamp, 10) * 1000);
    await client.sendMessage(msg.from, t('general.ping', { delay }), msg.id);
  },
  async me(client, msg, args, rawMsg) {
    await client.sendMessage(msg.from,
      t('general.me', { id: msg.from, name: rawMsg.contact?.profile?.name || t('general.unknown') }), msg.id);
  },
  async wiki(client, msg, args) {
    const q = args.join(' ');
    if (!q) return client.sendMessage(msg.from, t('general.wiki.usage'));
    const wikiLang = pick('he', 'en');
    try {
      const res = await axios.get(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      if (res.data.extract) return client.sendMessage(msg.from, t('general.wiki.result', { title: res.data.title, extract: res.data.extract }));
    } catch {}
    await client.sendMessage(msg.from, `📖 https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(q)}`);
  },
  async time(client, msg) {
    await client.sendMessage(msg.from, t('general.time', {
      time: new Date().toLocaleTimeString(pick('he-IL', 'en-US'), { timeZone: 'Asia/Jerusalem' })
    }));
  },
  async date(client, msg) {
    await client.sendMessage(msg.from, t('general.date', {
      date: new Date().toLocaleDateString(pick('he-IL', 'en-US'), { timeZone: 'Asia/Jerusalem' })
    }));
  },
  async deleteMsg(client, msg) {
    await client.sendMessage(msg.from, t('general.deleteMsg'));
  }
};
