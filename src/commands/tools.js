const axios = require('axios');
const db = require('../services/database');

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

module.exports = {
  // מזג אוויר חי לפי עיר
  async weather(client, msg, args) {
    const city = args.join(' ').trim() || 'תל אביב';
    try {
      const geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=he&format=json`);
      if (!geo.data.results || geo.data.results.length === 0) {
        return client.sendMessage(msg.from, `❌ העיר "${city}" לא נמצאה.`);
      }
      const loc = geo.data.results[0];
      const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`);
      const cur = res.data.current_weather;
      const desc = weatherCodes[cur.weathercode] || 'מצב לא ידוע';

      const text = 
`🌤️ *מזג אוויר ב-${loc.name}* 🌤️
━━━━━━━━━━━━━━━━━━━
🌡️ *טמפרטורה:* ${cur.temperature}°C
🌪️ *מהירות רוח:* ${cur.windspeed} קמ"ש
☁️ *מצב השמיים:* ${desc}
━━━━━━━━━━━━━━━━━━━`;

      await client.sendMessage(msg.from, text);
    } catch (e) {
      await client.sendMessage(msg.from, '❌ שגיאה בקבלת נתוני מזג אוויר.');
    }
  },

  // חדשות Ynet בזמן אמת ללא ספריות נוספות
  async news(client, msg) {
    try {
      const xmlRes = await axios.get('https://www.ynet.co.il/Integration/StoryRss2.xml');
      const xml = xmlRes.data;
      const regex = /<item>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g;
      const items = [];
      let match;
      while ((match = regex.exec(xml)) !== null && items.length < 5) {
        items.push({ title: match[1].trim(), link: match[2].trim() });
      }

      if (items.length === 0) return client.sendMessage(msg.from, 'לא נמצאו מבזקים כרגע.');

      let text = '📰 *מבזקי החדשות האחרונים (Ynet):*\n━━━━━━━━━━━━━━━━━━━\n\n';
      items.forEach((item, idx) => {
        text += `${idx + 1}. *${item.title}*\n🔗 ${item.link}\n\n`;
      });
      await client.sendMessage(msg.from, text.trim());
    } catch (e) {
      await client.sendMessage(msg.from, '❌ שגיאה בקבלת כותרות החדשות.');
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
      fiatText =
`💵 *דולר:* ₪${usdToIls.toFixed(2)}
💶 *אירו:* ₪${eurToIls}
💷 *פאונד:* ₪${gbpToIls}`;
    } catch (e) {
      fiatText = '❌ שגיאה בקבלת שערי מטבעות.';
    }

    let cryptoText = '';
    try {
      const crypto = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=ils,usd');
      const btcIls = crypto.data.bitcoin.ils.toLocaleString();
      const btcUsd = crypto.data.bitcoin.usd.toLocaleString();
      const ethIls = crypto.data.ethereum.ils.toLocaleString();
      cryptoText =
`
🪙 *ביטקוין (BTC):*
₪${btcIls} ($${btcUsd})

💎 *את'ריום (ETH):*
₪${ethIls}`;
    } catch (e) {
      cryptoText = '\n⚠️ שערי הקריפטו זמנית לא זמינים.';
    }

    const text =
`💰 *שערי מטבעות וקריפטו* 💰
━━━━━━━━━━━━━━━━━━━
${fiatText}
${cryptoText}
━━━━━━━━━━━━━━━━━━━`;
    await client.sendMessage(msg.from, text);
  },

  // רשימת קניות ומשימות
  async todo(client, msg, args) {
    const userId = msg.from;
    const sub = args[0]?.toLowerCase();
    const rest = args.slice(1).join(' ').trim();

    if (sub === 'הוסף') {
      if (!rest) return client.sendMessage(userId, 'שימוש: !רשימה הוסף [פריט]');
      db.update(d => {
        if (!Array.isArray(d.todos[userId])) d.todos[userId] = [];
        d.todos[userId].push(rest);
      });
      return client.sendMessage(userId, `✅ נוסף לרשימה: "${rest}"`);
    }

    if (sub === 'מחק') {
      const idx = parseInt(rest, 10) - 1;
      const list = db.get().todos[userId] || [];
      if (isNaN(idx) || idx < 0 || idx >= list.length) {
        return client.sendMessage(userId, 'מספר פריט לא תקין.');
      }
      let removed = '';
      db.update(d => {
        removed = d.todos[userId].splice(idx, 1)[0];
      });
      return client.sendMessage(userId, `🗑️ הפריט "${removed}" נמחק.`);
    }

    if (sub === 'נקה') {
      db.update(d => { d.todos[userId] = []; });
      return client.sendMessage(userId, '🧹 הרשימה שלך נוקתה לחלוטין.');
    }

    // ברירת מחדל: הצגת הרשימה
    const list = db.get().todos[userId] || [];
    if (list.length === 0) {
      return client.sendMessage(userId, '📝 הרשימה שלך ריקה. הוסף פריטים בעזרת:\n`!רשימה הוסף [פריט]`');
    }

    let text = '📝 *הרשימה האישית שלך:*\n━━━━━━━━━━━━━━━━━━━\n';
    list.forEach((item, idx) => {
      text += `${idx + 1}. ${item}\n`;
    });
    text += '\n_למחיקת פריט: !רשימה מחק [מספר]_';
    await client.sendMessage(userId, text);
  },

  // גלגל מזל / קבלת החלטות
  async choose(client, msg, args) {
    const input = args.join(' ');
    const parts = input.split(/[,|\n]/).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) {
      return client.sendMessage(msg.from, 'שימוש: !בחר [אפשרות 1], [אפשרות 2], [אפשרות 3]...\nדוגמה: !בחר פיצה, המבורגר, שווארמה');
    }
    const chosen = parts[Math.floor(Math.random() * parts.length)];
    await client.sendMessage(msg.from, `🎯 הבוט בחר: *${chosen}*!`);
  }
};
