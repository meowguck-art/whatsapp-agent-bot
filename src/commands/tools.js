const axios = require('axios');
const db = require('../services/database');
const { t, pick } = require('../i18n');

const weatherCodes = {
  0: 'שמיים בהירים ☀️',
  1: 'בעיקר בהיר 🌤️',
  2: 'מעונן חלקית ⛅',
  3: 'מעונן ☁️',
  45: 'ערפילי 🌫️',
  48: 'ערפל מקפיא 🌫️',
  51: 'טפטוף קל 🌦️',
  53: 'טפטוף 🌦️',
  55: 'טפטוף כבד 🌦️',
  56: 'טפטוף מקפיא 🌧️',
  57: 'טפטוף מקפיא 🌧️',
  61: 'גשם קל 🌧️',
  63: 'גשם בינוני 🌧️',
  65: 'גשם כבד ⛈️',
  66: 'גשם מקפיא 🌧️',
  67: 'גשם מקפיא כבד 🌧️',
  71: 'שלג קל 🌨️',
  73: 'שלג 🌨️',
  75: 'שלג כבד 🌨️',
  77: 'גרגירי שלג 🌨️',
  80: 'ממטרים קלים 🌧️',
  81: 'ממטרים 🌧️',
  82: 'ממטרים עזים ⛈️',
  85: 'ממטרי שלג 🌨️',
  86: 'ממטרי שלג כבדים 🌨️',
  95: 'סופת רעמים 🌩️',
  96: 'סופת רעמים עם ברד ⛈️',
  99: 'סופת רעמים עם ברד כבד ⛈️'
};

const weatherCodesEn = {
  0: 'Clear sky ☀️',
  1: 'Mostly clear 🌤️',
  2: 'Partly cloudy ⛅',
  3: 'Cloudy ☁️',
  45: 'Foggy 🌫️',
  48: 'Freezing fog 🌫️',
  51: 'Light drizzle 🌦️',
  53: 'Drizzle 🌦️',
  55: 'Heavy drizzle 🌦️',
  56: 'Freezing drizzle 🌧️',
  57: 'Freezing drizzle 🌧️',
  61: 'Light rain 🌧️',
  63: 'Moderate rain 🌧️',
  65: 'Heavy rain ⛈️',
  66: 'Freezing rain 🌧️',
  67: 'Heavy freezing rain 🌧️',
  71: 'Light snow 🌨️',
  73: 'Snow 🌨️',
  75: 'Heavy snow 🌨️',
  77: 'Snow grains 🌨️',
  80: 'Light showers 🌧️',
  81: 'Showers 🌧️',
  82: 'Violent showers ⛈️',
  85: 'Light snow showers 🌨️',
  86: 'Heavy snow showers 🌨️',
  95: 'Thunderstorm 🌩️',
  96: 'Thunderstorm with hail ⛈️',
  99: 'Thunderstorm with heavy hail ⛈️'
};

module.exports = {
  // מזג אוויר חי לפי עיר / live weather by city
  async weather(client, msg, args) {
    const city = args.join(' ').trim() || pick('תל אביב', 'Tel Aviv');
    const codes = pick(weatherCodes, weatherCodesEn);
    try {
      const geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=${pick('he', 'en')}&format=json`);
      if (!geo.data.results || geo.data.results.length === 0) {
        return client.sendMessage(msg.from, t('tools.weather.notFound', { city }));
      }
      const loc = geo.data.results[0];
      const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`);
      const cur = res.data.current_weather;
      const desc = codes[cur.weathercode] || t('tools.weather.unknown');

      const text = t('tools.weather.result', {
        city: loc.name, temp: cur.temperature, wind: cur.windspeed, desc
      });

      await client.sendMessage(msg.from, text);
    } catch (e) {
      await client.sendMessage(msg.from, t('tools.weather.error'));
    }
  },

  // חדשות Ynet בזמן אמת ללא ספריות נוספות
  async news(client, msg) {
    try {
      const feedUrl = pick(
        'https://www.ynet.co.il/Integration/StoryRss2.xml',
        'https://www.jpost.com/rss/rssfeedsfrontpage.aspx'
      );
      const xmlRes = await axios.get(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const xml = xmlRes.data;
      const regex = /<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g;
      const items = [];
      let match;
      while ((match = regex.exec(xml)) !== null && items.length < 5) {
        items.push({ title: match[1].trim(), link: match[2].trim() });
      }

      if (items.length === 0) return client.sendMessage(msg.from, t('tools.news.empty'));

      let text = t('tools.news.header');
      items.forEach((item, idx) => {
        text += `${idx + 1}. *${item.title}*\n🔗 ${item.link}\n\n`;
      });
      await client.sendMessage(msg.from, text.trim());
    } catch (e) {
      await client.sendMessage(msg.from, t('tools.news.error'));
    }
  },

  // שער מטבעות וקריפטו
  async rates(client, msg, args) {
    let fiatText = '';
    try {
      const fiat = await axios.get('https://open.er-api.com/v6/latest/USD');
      const usdToIls = fiat.data.rates.ILS;
      const eurToIls = (usdToIls / fiat.data.rates.EUR).toFixed(2);
      const gbpToIls = (usdToIls / fiat.data.rates.GBP).toFixed(2);
      fiatText = t('tools.rates.fiat', { usd: usdToIls.toFixed(2), eur: eurToIls, gbp: gbpToIls });
    } catch (e) {
      fiatText = t('tools.rates.fiatError');
    }

    let cryptoText = '';
    try {
      const crypto = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=ils,usd');
      const btcIls = crypto.data.bitcoin.ils.toLocaleString();
      const btcUsd = crypto.data.bitcoin.usd.toLocaleString();
      const ethIls = crypto.data.ethereum.ils.toLocaleString();
      cryptoText = t('tools.rates.crypto', { btcIls, btcUsd, ethIls });
    } catch (e) {
      cryptoText = t('tools.rates.cryptoError');
    }

    const text = t('tools.rates.title', { fiat: fiatText, crypto: cryptoText });
    await client.sendMessage(msg.from, text);
  },

  // רשימת קניות ומשימות
  async todo(client, msg, args) {
    const userId = msg.from;
    const sub = args[0]?.toLowerCase();
    const rest = args.slice(1).join(' ').trim();

    if (sub === 'הוסף' || sub === 'add') {
      if (!rest) return client.sendMessage(userId, t('tools.todo.addUsage'));
      db.update(d => {
        if (!Array.isArray(d.todos[userId])) d.todos[userId] = [];
        d.todos[userId].push(rest);
      });
      return client.sendMessage(userId, t('tools.todo.added', { item: rest }));
    }

    if (sub === 'מחק' || sub === 'del' || sub === 'delete') {
      const idx = parseInt(rest, 10) - 1;
      const list = db.get().todos[userId] || [];
      if (isNaN(idx) || idx < 0 || idx >= list.length) {
        return client.sendMessage(userId, t('tools.todo.badIndex'));
      }
      let removed = '';
      db.update(d => {
        removed = d.todos[userId].splice(idx, 1)[0];
      });
      return client.sendMessage(userId, t('tools.todo.removed', { item: removed }));
    }

    if (sub === 'נקה' || sub === 'clear') {
      db.update(d => { d.todos[userId] = []; });
      return client.sendMessage(userId, t('tools.todo.cleared'));
    }

    // ברירת מחדל: הצגת הרשימה
    const list = db.get().todos[userId] || [];
    if (list.length === 0) {
      return client.sendMessage(userId, t('tools.todo.empty'));
    }

    let text = t('tools.todo.title');
    list.forEach((item, idx) => {
      text += `${idx + 1}. ${item}\n`;
    });
    text += t('tools.todo.footer');
    await client.sendMessage(userId, text);
  },

  // גלגל מזל / קבלת החלטות / decision wheel
  async choose(client, msg, args) {
    const input = args.join(' ');
    const parts = input.split(/[,|\n]/).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) {
      return client.sendMessage(msg.from, t('tools.choose.usage'));
    }
    const chosen = parts[Math.floor(Math.random() * parts.length)];
    await client.sendMessage(msg.from, t('tools.choose.result', { choice: chosen }));
  }
};
