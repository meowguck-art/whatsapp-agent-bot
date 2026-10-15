const axios = require('axios');

const cityMap = {
  'ירושלים': 'IL-Jerusalem',
  'תל אביב': 'IL-Tel Aviv',
  'תלאביב': 'IL-Tel Aviv',
  'חיפה': 'IL-Haifa',
  'באר שבע': 'IL-Beer Sheva',
  'פתח תקווה': 'IL-Petah Tikva'
};

const pages = {
  // עמוד ראשי
  main: 
`━━━━━━━━━━━━━━━━━━━━━━
   🤖 *תפריט הקטגוריות* 🤖
━━━━━━━━━━━━━━━━━━━━━━
שלום! בחר קטגוריה להצגת הפקודות:

1️⃣ 🧠 *בינה מלאכותית (AI)*
2️⃣ 🎬 *מדיה, שירים והורדות*
3️⃣ 🛠️ *כלים, מידע ויומיום*
4️⃣ 🎮 *משחקים, פנאי ומוניטין*
5️⃣ 👑 *מערכת ומנהל*

━━━━━━━━━━━━━━━━━━━━━━
💬 *שלח \`!1\` עד \`!5\` (או \`!תפריט [מספר]\`) לצפייה בעמוד.*`,

  // 1. בינה מלאכותית
  '1': 
`━━━━━━━━━━━━━━━━━━━━━━
   🧠 *בינה מלאכותית (AI)* 🧠
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!שאל [שאלה]\` • שיחה חופשית עם Gemini
▫️ \`!סכם\` • סיכום טקסטים (בתגובה להודעה)
▫️ \`!דמיין [תיאור]\` • יצירת תיאור מפורט לתמונה
▫️ \`!תרגם [שפה] [טקסט]\` • תרגום מהיר לכל שפה

_חזרה לתפריט הראשי: שלח \`!תפריט\`_`,

  // 2. מדיה והורדות
  '2': 
`━━━━━━━━━━━━━━━━━━━━━━
   🎬 *מדיה, שירים והורדות* 🎬
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!טיקטוק [קישור]\` • הורדת סרטון בלי סימן מים
▫️ \`!אינסטה [קישור]\` • הורדת סרטוני Reels
▫️ \`!יוטיוב [שיר]\` • חיפוש ביוטיוב: 10 תוצאות לבחירה, ואז MP3 / הודעה קולית / קליפ
▫️ \`!חתוך [התחלה] [סיום]\` • חיתוך שיר/סרטון בתגובה
▫️ \`!פילטר [שחורלבן/נגטיב/טשטוש]\` • עיבוד תמונה
▫️ \`!qr [טקסט/קישור]\` • יצירת קוד QR איכותי
▫️ \`!סטיקר\` / \`!s\` • הפיכת תמונה/סרטון לסטיקר
▫️ \`!למי\` / \`!tofile\` • שליחת מדיה כמסמך ללא דחיסה

_חזרה לתפריט הראשי: שלח \`!תפריט\`_`,

  // 3. כלים ומידע יומי
  '3': 
`━━━━━━━━━━━━━━━━━━━━━━
   🛠️ *כלים, מידע ויומיום* 🛠️
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!מזגאוויר [עיר]\` • תחזית מזג אוויר חיה
▫️ \`!חדשות\` • 5 מבזקים אחרונים מ-Ynet
▫️ \`!שער\` • שערי דולר, אירו, ביטקוין ואת'ריום
▫️ \`!שבת [עיר]\` • כניסת/יציאת שבת ופרשה
▫️ \`!רשימה [הוסף/מחק/נקה]\` • רשימת קניות/משימות
▫️ \`!תזכורת [זמן] [דק/שע/ימ] [הודעה]\` • קביעת תזכורת
▫️ \`!בחר [אפשרות 1, 2...]\` • גלגל מזל והחלטות
▫️ \`!קיצור [קישור]\` • קיצור כתובת דרך TinyURL
▫️ \`!לינק [מספר]\` • קישור ישיר לצ'אט בוואטסאפ
▫️ \`!מחשבון [תרגיל]\` • פתרון ביטוי מתמטי
▫️ \`!חיפוש [ערך]\` • קישור ישיר לחיפוש בגוגל

_חזרה לתפריט הראשי: שלח \`!תפריט\`_`,

  // 4. משחקים וקהילה
  '4': 
`━━━━━━━━━━━━━━━━━━━━━━
   🎮 *משחקים, פנאי וקהילה* 🎮
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!בלקג'ק\` • משחק 21 מול הבוט (\`!קלף\` / \`!עמוד\`)
▫️ \`!קרב\` • קרב RPG תורות מול הבוט (\`!קרב התקפה\`)
▫️ \`!תלוי [אות]\` • איש תלוי בעברית
▫️ \`!חידון\` • חידון אימוג'ים (\`!ניחוש [שם]\`)
▫️ \`!איקסעיגול [1-9]\` • איקס-עיגול מול הבוט
▫️ \`!מרוץ\` • מרוץ סולמות ונחשים ל-100 (\`!זרוק\` לזריקה)
▫️ \`!טריוויה\` • שאלת טריוויה אמריקאית (\`!תשובה\`)
▫️ \`!קובייה\` / \`!מטבע\` • הטלת קובייה או מטבע
▫️ \`!בדיחה\` / \`!ציטוט\` / \`!הפוך\` • בידור מהיר
▫️ \`!תודה\` • הענקת נקודת מוניטין (בתגובה להודעה)
▫️ \`!מוניטין\` / \`!טופ5\` • טבלאות ניקוד מובילים

_חזרה לתפריט הראשי: שלח \`!תפריט\`_`,

  // 5. מערכת ומנהל
  '5': 
`━━━━━━━━━━━━━━━━━━━━━━
   👑 *מערכת וניהול הבוט* 👑
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!פינג\` • בדיקת מהירות תגובת הבוט
▫️ \`!אני\` • פרטי החשבון והמזהה שלך
▫️ \`!ויקיפדיה [ערך]\` • תקציר ערך מויקיפדיה
▫️ \`!שעה\` / \`!תאריך\` • שעון ותאריך בישראל
▫️ \`!סטטוס\` • הצגת זמן פעילות ומצב הבוט (בעלים)
▫️ \`!גרסה\` • מידע על גרסת המערכת
▫️ \`!בעלים\` • הצגת מזהה בעל הבוט
▫️ \`!שנהמצב [self/authorized/public]\` • רמת גישה
▫️ \`!הוסףמורשהגלובלי\` / \`!הסרמורשהגלובלי\`
▫️ \`!רשימהגלובלית\` • צפייה ברשימת ה-VIP

_חזרה לתפריט הראשי: שלח \`!תפריט\`_`
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
        '🤖 *הדגמת כפתורים אינטראקטיביים*\nלחץ על כפתור — כל כפתור מפעיל פקודה אמיתית של הבוט:',
        [
          { id: '1', title: '🧠 בינה מלאכותית' },
          { id: 'ping', title: '🏓 בדיקת פינג' },
          { id: 'בדיחה', title: '😂 ספר בדיחה' }
        ],
        { footer: 'נשלח ישירות, בלי תבנית מאושרת ✨' }
      );
      await client.sendVoiceCallButton(
        msg.from,
        '📞 *צריך עזרה אנושית?*\nלחץ על הכפתור כדי להתחיל שיחת קול בוואטסאפ:',
        { displayText: 'התקשר עכשיו' }
      );
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 131009) {
        await client.sendMessage(msg.from,
          '⚠️ *כפתורים לחיצים עדיין לא נתמכים*\n' +
          'פלטפורמת ה-Agent של וואטסאפ (שעליה הבוט פועל) מאפשרת כרגע רק טקסט ומדיה — לא כפתורים ולא כפתור שיחה.\n' +
          'הקוד כבר מוכן, וברגע שוואטסאפ תפתח את האפשרות זה יעבוד אוטומטית.\n\n' +
          'בינתיים: שלח `!תפריט` ובחר מספר מהתפריט 👆');
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
    const rawCity = args.join(' ').trim() || 'ירושלים';
    const knownCity = cityMap[rawCity];
    const cityCode = knownCity || 'IL-Jerusalem';
    try {
      const res = await axios.get(`https://www.hebcal.com/shabbat?cfg=json&city=${cityCode}&M=on`);
      const items = res.data.items || [];
      let candle = '', havdalah = '', parasha = '';
      items.forEach(item => {
        if (item.category === 'candles') candle = item.title;
        if (item.category === 'havdalah') havdalah = item.title;
        if (item.category === 'parashat') parasha = item.hebrew || item.title;
      });
      const fallbackNote = knownCity ? '' : '\n⚠️ _לעיר זו אין מיפוי מדויק - מוצגים זמני ירושלים._';
      await client.sendMessage(msg.from, `🕯️ *זמני שבת קודש - ${rawCity}* 🕯️\n━━━━━━━━━━━━━━━━━━━\n📖 *פרשה:* ${parasha}\n🕯️ *כניסה:* ${candle.replace('Candle lighting: ', '')}\n✨ *יציאה:* ${havdalah.replace('Havdalah: ', '')}\n━━━━━━━━━━━━━━━━━━━${fallbackNote}\nשבת שלום!`);
    } catch {
      await client.sendMessage(msg.from, '❌ שגיאה בקבלת זמני שבת.');
    }
  },

  async ping(client, msg) {
    const delay = Math.abs(Date.now() - parseInt(msg.timestamp, 10) * 1000);
    await client.sendMessage(msg.from, `🏓 פונג! זמן תגובה: *${delay}ms*`, msg.id);
  },
  async me(client, msg, args, rawMsg) {
    await client.sendMessage(msg.from, `👤 מזהה: ${msg.from}\nשם: ${rawMsg.contact?.profile?.name || 'לא ידוע'}`, msg.id);
  },
  async wiki(client, msg, args) {
    const q = args.join(' ');
    if (!q) return client.sendMessage(msg.from, 'שימוש: !ויקיפדיה [מונח]');
    try {
      const res = await axios.get(`https://he.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      if (res.data.extract) return client.sendMessage(msg.from, `📖 *${res.data.title}*\n\n${res.data.extract}`);
    } catch {}
    await client.sendMessage(msg.from, `📖 https://he.wikipedia.org/wiki/${encodeURIComponent(q)}`);
  },
  async time(client, msg) {
    await client.sendMessage(msg.from, `🕒 השעה: *${new Date().toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem' })}*`);
  },
  async date(client, msg) {
    await client.sendMessage(msg.from, `📅 התאריך: *${new Date().toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' })}*`);
  },
  async deleteMsg(client, msg) {
    await client.sendMessage(msg.from, 'ℹ️ מחיקת הודעת בוט אצל כולם מבוצעת ישירות באפליקציה.');
  }
};
