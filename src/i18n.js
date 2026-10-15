// Bilingual string tables (Hebrew default, English via BOT_LANG=en).
// Keys are stable and namespaced. t(key, vars) interpolates {var} placeholders.
// Command NAMES (e.g. '!שאל') are intentionally never translated — only what
// the bot says, never what it listens to.
const config = require('./config');

const STR = {
  he: {
    // ---- menu pages (general.js) ----
    'menu.main':
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
    'menu.p1':
`━━━━━━━━━━━━━━━━━━━━━━
   🧠 *בינה מלאכותית (AI)* 🧠
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!שאל [שאלה]\` • שיחה חופשית עם Gemini
▫️ \`!סכם\` • סיכום טקסטים (בתגובה להודעה)
▫️ \`!דמיין [תיאור]\` • יצירת תיאור מפורט לתמונה
▫️ \`!תרגם [שפה] [טקסט]\` • תרגום מהיר לכל שפה

{back}`,
    'menu.p2':
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

{back}`,
    'menu.p3':
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

{back}`,
    'menu.p4':
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

{back}`,
    'menu.p5':
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

{back}`,
    'menu.back': '_חזרה לתפריט הראשי: שלח `!תפריט`_',

    // ---- interactive buttons demo ----
    'general.buttons.title': '🤖 *הדגמת כפתורים אינטראקטיביים*\nלחץ על כפתור — כל כפתור מפעיל פקודה אמיתית של הבוט:',
    'general.buttons.ai': '🧠 בינה מלאכותית',
    'general.buttons.ping': '🏓 בדיקת פינג',
    'general.buttons.joke': '😂 ספר בדיחה',
    'general.buttons.footer': 'נשלח ישירות, בלי תבנית מאושרת ✨',
    'general.buttons.callBody': '📞 *צריך עזרה אנושית?*\nלחץ על הכפתור כדי להתחיל שיחת קול בוואטסאפ:',
    'general.buttons.callNow': 'התקשר עכשיו',
    'general.buttons.unsupported': '⚠️ *כפתורים לחיצים עדיין לא נתמכים*\nפלטפורמת ה-Agent של וואטסאפ (שעליה הבוט פועל) מאפשרת כרגע רק טקסט ומדיה — לא כפתורים ולא כפתור שיחה.\nהקוד כבר מוכן, וברגע שוואטסאפ תפתח את האפשרות זה יעבוד אוטומטית.\n\nבינתיים: שלח `!תפריט` ובחר מספר מהתפריט 👆',

    // ---- shabbat ----
    'general.shabbat.result': '🕯️ *זמני שבת קודש - {city}* 🕯️\n━━━━━━━━━━━━━━━━━━━\n📖 *פרשה:* {parasha}\n🕯️ *כניסה:* {candle}\n✨ *יציאה:* {havdalah}\n━━━━━━━━━━━━━━━━━━━{note}\nשבת שלום!',
    'general.shabbat.fallback': '\n⚠️ _לעיר זו אין מיפוי מדויק - מוצגים זמני ירושלים._',
    'general.shabbat.error': '❌ שגיאה בקבלת זמני שבת.',

    // ---- general one-liners ----
    'general.ping': '🏓 פונג! זמן תגובה: *{delay}ms*',
    'general.me': '👤 מזהה: {id}\nשם: {name}',
    'general.unknown': 'לא ידוע',
    'general.wiki.usage': 'שימוש: !ויקיפדיה [מונח]',
    'general.wiki.result': '📖 *{title}*\n\n{extract}',
    'general.time': '🕒 השעה: *{time}*',
    'general.date': '📅 התאריך: *{date}*',
    'general.deleteMsg': 'ℹ️ מחיקת הודעת בוט אצל כולם מבוצעת ישירות באפליקציה.',

    // ---- ai ----
    'ai.ask.usage': 'אנא ספק שאלה לאחר הפקודה.',
    'ai.summarize.usage': '❌ הגב (Reply) על הודעה שברצונך לסכם, או כתוב את הטקסט לאחר הפקודה !סכם.',
    'ai.summarize.prompt': 'סכם את הטקסט הבא בצורה תמציתית, ברורה ומסודרת בנקודות:',
    'ai.summarize.title': '📝 *סיכום:*\n\n{reply}',
    'ai.imagine.usage': 'אנא הזן תיאור לתמונה.',
    'ai.imagine.title': '🎨 *פרומפט לתמונה:*\n\n{reply}',
    'ai.translate.usage': 'שימוש: !תרגם [שפה] [טקסט]',

    // ---- games: shared ----
    'games.handTotal': '(סך הכל: *{total}*)',

    // ---- tic-tac-toe ----
    'games.tictactoe.win': '🎉 *ניצחת את הבוט!* (+{points} נקודות מוניטין)',
    'games.tictactoe.lose': '🤖 *הבוט ניצח!* נסה שוב עם `!איקסעיגול התחל`',
    'games.tictactoe.draw': '🤝 *תיקו!* כל הכבוד.',
    'games.tictactoe.cancel': '🛑 משחק האיקס-עיגול בוטל.',
    'games.tictactoe.start': '🎮 *משחק איקס-עיגול החל!* אתה ❌ והבוט ⭕\n{board}\nבחר משבצת 1-9 עם `!איקסעיגול [מספר]`',
    'games.tictactoe.invalid': 'בחר משבצת פנויה (1-9):\n{board}',
    'games.tictactoe.taken': '❌ המשבצת {pos} תפוסה. בחר אחרת:\n{board}',
    'games.tictactoe.turn': '{board}\nתורך! שלח `!איקסעיגול [1-9]`',

    // ---- blackjack ----
    'games.blackjack.cancel': '🛑 משחק הבלקג\'ק בוטל.',
    'games.blackjack.natural': '🃏 *BLACKJACK! בלקג\'ק טבעי!* 🎉\n\nהיד שלך: {player}\nיד הבוט: {bot}\n\nניצחת וזכית ב-{points} נקודות מוניטין!',
    'games.blackjack.start': '🃏 *משחק בלקג\'ק (21)* 🃏\n━━━━━━━━━━━━━━━━━━━\n👤 *היד שלך:* {player}\n🤖 *היד של הבוט:* {bot}\n━━━━━━━━━━━━━━━━━━━\nבחר את הצעד הבא:\n▫️ `!קלף` - לקחת קלף נוסף (Hit)\n▫️ `!עמוד` - לעצור ולבדוק תוצאה (Stand)\n▫️ `!בלקג\'ק בטל` - לביטול המשחק',
    'games.blackjack.noGame': 'לא פעיל כרגע משחק בלקג\'ק. שלח !בלקג\'ק כדי להתחיל.',
    'games.blackjack.bust': '💥 *נפסלת! (Bust)*\nהיד שלך: {hand}\nעברת את 21. הבוט ניצח הפעם!',
    'games.blackjack.hit': '🃏 לקחת קלף:\n{hand}\n\nשלח `!קלף` לקלף נוסף, או `!עמוד` לעצירה.',
    'games.blackjack.dealerBust': '🎉 *הבוט נפסל (Bust)! ניצחת!* (+{points} נקודות)',
    'games.blackjack.win': '🏆 *ניצחת את הבוט!* (+{points} נקודות)',
    'games.blackjack.lose': '🤖 *הבוט ניצח!* נסה שוב בפעם הבאה.',
    'games.blackjack.push': '🤝 *תיקו (Push)!*',
    'games.blackjack.result': '🃏 *תוצאת בלקג\'ק* 🃏\n━━━━━━━━━━━━━━━━━━━\n👤 *היד שלך:* {player}\n🤖 *היד של הבוט:* {bot}\n━━━━━━━━━━━━━━━━━━━\n{result}',

    // ---- trivia / dice / coin ----
    'games.trivia.question': '❓ *{q}*\n{opts}\n_ענה: !תשובה [מספר]_',
    'games.trivia.noActive': 'אין שאלת טריוויה פעילה. שלח !טריוויה כדי להתחיל.',
    'games.trivia.correct': '🎉 *נכון מאוד!* (+{points} נקודות מוניטין)',
    'games.trivia.wrong': '❌ לא נכון, נסה שוב!',
    'games.dice': '🎲 תוצאה: *{n}*',
    'games.coin.result': '🪙 תוצאה: *{side}*',
    'games.coin.heads': 'עץ',
    'games.coin.tails': 'פלי',
    'games.joke.format': '😄 {text}',
    'games.quote.format': '📜 {text}',

    // ---- reputation ----
    'games.thanks.usage': '⭐ הגב (Reply) על הודעה של מישהו עם !תודה כדי להעניק לו נקודת מוניטין.',
    'games.thanks.self': '😉 אי אפשר להעניק מוניטין לעצמך!',
    'games.thanks.ok': '⭐ תודה רבה! הוענקה נקודת מוניטין.',
    'games.reputation': '📊 המוניטין שלך: *{score}*',
    'games.top5.empty': '🏆 עדיין אין ניקוד מוניטין. שחקו כדי לצבור נקודות!',
    'games.top5.title': '🏆 *טופ 5 מוניטין* 🏆\n━━━━━━━━━━━━━━━━━━━\n',
    'games.top5.row': '{medal} {score} נקודות{you}\n',
    'games.top5.you': ' (אתה)',

    // ---- hangman ----
    'games.hangman.cancel': '🛑 משחק האיש התלוי בוטל.',
    'games.hangman.start': '🪢 *משחק איש תלוי החל!*\n\nהמילה: {mask}\nפסילות שנותרו: ❤️ x 6\n\nשלח: `!תלוי [אות]` כדי לנחש.',
    'games.hangman.status': '🪢 המילה: {mask}\nפסילות: {lives}\nאותיות: {letters}\n\nנחש אות: `!תלוי [אות]`',
    'games.hangman.oneLetter': 'שלח אות אחת בלבד.',
    'games.hangman.already': 'כבר ניחשת את האות "{letter}".',
    'games.hangman.win': '🎉 *כל הכבוד! ניחשת את המילה:* *{word}*!\nזכית ב-+{points} נקודות מוניטין!',
    'games.hangman.lose': '💀 *נפסלת!* המילה הייתה: *{word}*.\nשלח !תלוי להתחלת משחק חדש.',
    'games.hangman.noLetters': 'עדיין לא נוחשו',

    // ---- emoji quiz ----
    'games.emoji.prompt': '🎬 *חידון אימוג\'ים! איזה סרט זה?*\n\n{emojis}\n\n_ענה באמצעות: !ניחוש [שם הסרט]_',
    'games.emoji.noActive': 'אין חידון פעיל. שלח !חידון כדי להתחיל.',
    'games.emoji.noGuess': 'נחש שם של סרט: !ניחוש [שם הסרט]',
    'games.emoji.correct': '🎉 *בול! התשובה היא אכן "{ans}"!* (+{points} נקודות מוניטין)',
    'games.emoji.wrong': '❌ לא נכון, נסה שוב!',

    // ---- battle ----
    'games.battle.cancel': '🛑 הקרב הופסק.',
    'games.battle.start': '⚔️ *קרב מול הבוט התחיל!*\n\n👤 אתה: 100/100 HP\n🤖 בוט: 100/100 HP\n\nבחר מהלך:\n▫️ `!קרב התקפה` (נזק בטוח)\n▫️ `!קרב מיוחד` (נזק גבוה או החטאה)\n▫️ `!קרב ריפוי` (+25 חיים)',
    'games.battle.attackLog': '🗡️ תקפת את הבוט והורדת לו *{dmg}* חיים!\n',
    'games.battle.specialHit': '💥 התקפה מיוחדת פגעה! הורדת לבוט *{dmg}* חיים!\n',
    'games.battle.specialMiss': '💨 ההתקפה המיוחדת החטיאה!\n',
    'games.battle.heal': '🧪 שתית שיקוי ונרפאת ב-*{amount}* חיים!\n',
    'games.battle.invalid': 'בחר: !קרב [התקפה / מיוחד / ריפוי / בטל]',
    'games.battle.win': '🏆 *ניצחת את הבוט בקרב!* זכית ב-+{points} נקודות מוניטין!\n\n{log}',
    'games.battle.counter': '🤖 הבוט החזיר מכה והוריד לך *{dmg}* חיים!',
    'games.battle.lose': '💀 *הובסת בקרב!* נסה שוב עם !קרב.\n\n{log}',
    'games.battle.status': '\n\n👤 אתה: {php}/100 HP\n🤖 בוט: {bhp}/100 HP\n\nבחר מהלך: `!קרב התקפה` | `!קרב מיוחד` | `!קרב ריפוי`',

    // ---- race ----
    'games.race.cancel': '🛑 המרוץ בוטל.',
    'games.race.start': '🏁 *מרוץ סולמות ונחשים החל!* 🐍🪜\n━━━━━━━━━━━━━━\n🟢 אתה נגד 🔴 הבוט — מי שמגיע *בדיוק* ל-100 ראשון מנצח!\nסולמות מעלים 🪜 נחשים מורידים 🐍\n\nשלח `!זרוק` כדי לזרוק את הקובייה.',
    'games.race.noRace': 'אין מרוץ פעיל. שלח `!מרוץ` כדי להתחיל.',
    'games.race.overshoot': '⏸️ עברת את 100 — נשארת במקום (צריך בדיוק 100!)',
    'games.race.ladder': '🪜 *סולם!* {from} ← {to}',
    'games.race.snake': '🐍 *נחש!* {from} ← {to}',
    'games.race.roll': '🎲 זרקת: {face} (*{roll}*) → משבצת *{pos}*',
    'games.race.win': '🏆 *ניצחת את המרוץ!* 🎉 (+{points} נקודות מוניטין)\n\n{log}',
    'games.race.botRoll': '🤖 הבוט זרק: {face} (*{roll}*) → משבצת *{pos}*',
    'games.race.botWin': '🤖 *הבוט ניצח במרוץ!* נסה שוב עם `!מרוץ`\n\n{log}',
    'games.race.board': '🏁 *מרוץ סולמות ונחשים* 🐍\n━━━━━━━━━━━━━━\n{log}\n━━━━━━━━━━━━━━\n{bar}\n🟢 אתה: *{player}* | 🔴 בוט: *{bot}*\n\nשלח `!זרוק` לתור הבא',

    // ---- media: youtube ----
    'media.yt.formatAudio': '🎵 קובץ שמע (MP3)',
    'media.yt.formatVoice': '🎤 הודעה קולית',
    'media.yt.formatVideo': '🎬 קליפ וידאו (MP4)',
    'media.yt.downloading': '⏳ מוריד {format}{title}\nאנא המתן...',
    'media.done': '🎬 הורד בהצלחה!',
    'media.yt.rateLimit': '⏳ יוטיוב חוסם זמנית (יותר מדי בקשות). חכה כמה דקות ונסה שוב.',
    'media.yt.error': '❌ שגיאה בהורדה מיוטיוב.',
    'media.yt.noFile': '❌ ההורדה לא יצרה קובץ (כנראה גדול מדי — מעל 15MB). נסה שיר קצר יותר.',
    'media.yt.formatMenu': '🎵 *{title}*\n\nבחר פורמט — שלח:\n`!יוטיוב שמע` — קובץ MP3\n`!יוטיוב קולי` — הודעה קולית 🎤\n`!יוטיוב וידאו` — קליפ MP4',
    'media.yt.usage': 'שימוש: !יוטיוב [שם שיר או קישור]\nדוגמה: !יוטיוב עומר אדם',
    'media.yt.range': 'בחר מספר בין 1 ל-{max}.',
    'media.yt.searching': '🔎 מחפש "{q}"...',
    'media.yt.searchError': '❌ שגיאה בחיפוש ביוטיוב.',
    'media.yt.noResults': 'לא נמצאו תוצאות, נסה ניסוח אחר.',
    'media.yt.results': '🎵 *תוצאות חיפוש:*\n\n{list}\n\nשלח `!יוטיוב [מספר]` לבחירה\nדוגמה: `!יוטיוב 3` או ישירות `!יוטיוב 3 קולי`',

    // ---- media: trim ----
    'media.trim.usage': 'שימוש: הגב על שיר או סרטון וכתוב:\n!חתוך [התחלה] [סיום]\nדוגמה: !חתוך 00:10 00:30 או !חתוך 10 30',
    'media.trim.invalidTime': '❌ פורמט זמן לא תקין. דוגמה: !חתוך 00:10 00:30',
    'media.trim.noMedia': '❌ עליך להגיב (Reply) ישירות על קובץ שמע או סרטון שברצונך לחתוך.',
    'media.trim.working': '⏳ חותך את הקובץ מ-{start} עד {end}, אנא המתן...',
    'media.trim.done': '✂️ נחתך בהצלחה ({start} - {end})',
    'media.trim.error': '❌ שגיאה בחיתוך הקובץ. ודא שציינת זמנים תקינים (למשל: !חתוך 00:10 00:30).',

    // ---- media: sticker / tofile / video / qr ----
    'media.sticker.noMedia': '❌ שלח תמונה עם הכיתוב *!סטיקר*, או הגב על תמונה.',
    'media.sticker.working': '⏳ מעבד את הסטיקר...',
    'media.sticker.error': '❌ שגיאה בהמרת הסטיקר.',
    'media.tofile.noMedia': '❌ הגב עם *!למי* על תמונה או קובץ.',
    'media.tofile.working': '⏳ מכין את הקובץ כמסמך...',
    'media.tofile.error': '❌ שגיאה בהמרת הקובץ למסמך.',
    'media.video.usage': 'שימוש: !טיקטוק [קישור]',
    'media.video.working': '⏳ מוריד את הסרטון, רק רגע...',
    'media.video.error': '❌ שגיאה בהורדת הסרטון.',
    'media.qr.usage': 'שימוש: !qr [טקסט או קישור]',
    'media.qr.caption': '📱 QR: "{text}"',
    'media.qr.error': '❌ שגיאה ביצירת קוד QR.',

    // ---- media: reminder / shorten / link / calc / search / filter ----
    'media.reminder.usage': 'שימוש: !תזכורת [זמן] [דק/שע/ימ] [הודעה]',
    'media.reminder.badAmount': '❌ הזמן חייב להיות מספר חיובי. דוגמה: !תזכורת 10 דק לקנות חלב',
    'media.reminder.badUnit': '❌ יחידת זמן לא תקינה. השתמש ב: דק / שע / ימ',
    'media.reminder.set': '✅ נקבעה תזכורת לעוד {amount} {unit}.',
    'media.shorten.usage': 'נא להזין קישור.',
    'media.shorten.ok': '🔗 קישור מקוצר: {url}',
    'media.shorten.error': 'שגיאה בקיצור.',
    'media.link.usage': 'נא להזין מספר.',
    'media.calc.invalid': 'ביטוי לא חוקי.',
    'media.calc.result': '🔢 תוצאה: *{result}*',
    'media.calc.error': 'שגיאה בחישוב.',
    'media.search.usage': 'הזן ערך.',
    'media.filter.usage': 'שימוש: הגב על תמונה עם:\n!פילטר [שחורלבן / נגטיב / טשטוש]',
    'media.filter.noMedia': '❌ עליך להגיב (Reply) על תמונה.',
    'media.filter.working': '⏳ מפעיל פילטר על התמונה...',
    'media.filter.done': '✨ פילטר {type} הופעל בהצלחה!',
    'media.filter.error': '❌ שגיאה בהפעלת הפילטר.',

    // ---- tools: weather ----
    'tools.weather.notFound': '❌ העיר "{city}" לא נמצאה.',
    'tools.weather.unknown': 'מצב לא ידוע',
    'tools.weather.result': '🌤️ *מזג אוויר ב-{city}* 🌤️\n━━━━━━━━━━━━━━━━━━━\n🌡️ *טמפרטורה:* {temp}°C\n🌪️ *מהירות רוח:* {wind} קמ"ש\n☁️ *מצב השמיים:* {desc}\n━━━━━━━━━━━━━━━━━━━',
    'tools.weather.error': '❌ שגיאה בקבלת נתוני מזג אוויר.',

    // ---- tools: news ----
    'tools.news.empty': 'לא נמצאו מבזקים כרגע.',
    'tools.news.header': '📰 *מבזקי החדשות האחרונים (Ynet):*\n━━━━━━━━━━━━━━━━━━━\n\n',
    'tools.news.error': '❌ שגיאה בקבלת כותרות החדשות.',

    // ---- tools: rates ----
    'tools.rates.fiat': '💵 *דולר:* ₪{usd}\n💶 *אירו:* ₪{eur}\n💷 *פאונד:* ₪{gbp}',
    'tools.rates.fiatError': '❌ שגיאה בקבלת שערי מטבעות.',
    'tools.rates.crypto': '🪙 *ביטקוין (BTC):*\n₪{btcIls} (${btcUsd})\n\n💎 *את\'ריום (ETH):*\n₪{ethIls}',
    'tools.rates.cryptoError': '\n⚠️ שערי הקריפטו זמנית לא זמינים.',
    'tools.rates.title': '💰 *שערי מטבעות וקריפטו* 💰\n━━━━━━━━━━━━━━━━━━━\n{fiat}\n{crypto}\n━━━━━━━━━━━━━━━━━━━',

    // ---- tools: todo ----
    'tools.todo.addUsage': 'שימוש: !רשימה הוסף [פריט]',
    'tools.todo.added': '✅ נוסף לרשימה: "{item}"',
    'tools.todo.badIndex': 'מספר פריט לא תקין.',
    'tools.todo.removed': '🗑️ הפריט "{item}" נמחק.',
    'tools.todo.cleared': '🧹 הרשימה שלך נוקתה לחלוטין.',
    'tools.todo.empty': '📝 הרשימה שלך ריקה. הוסף פריטים בעזרת:\n`!רשימה הוסף [פריט]`',
    'tools.todo.title': '📝 *הרשימה האישית שלך:*\n━━━━━━━━━━━━━━━━━━━\n',
    'tools.todo.footer': '\n_למחיקת פריט: !רשימה מחק [מספר]_',

    // ---- tools: choose ----
    'tools.choose.usage': 'שימוש: !בחר [אפשרות 1], [אפשרות 2], [אפשרות 3]...\nדוגמה: !בחר פיצה, המבורגר, שווארמה',
    'tools.choose.result': '🎯 הבוט בחר: *{choice}*!',

    // ---- owner ----
    'owner.uptimeDays': '{n} ימים',
    'owner.uptimeHours': '{n} שעות',
    'owner.uptimeMinutes': '{n} דקות',
    'owner.uptimeSeconds': '{n} שניות',
    'owner.status': '🤖 *סטטוס:*\nזמן ריצה: {uptime}\nמצב: {mode}\nבעלים: {owner}',
    'owner.notSet': 'לא הוגדר',
    'owner.version': '⚙️ גרסה 1.0.0 (WhatsApp Agent Platform v1 - 2026)',
    'owner.owner': '👑 בעלים: {id}',
    'owner.setMode.usage': 'שימוש: !שנהמצב [self/authorized/public]',
    'owner.setMode.ok': '🔒 מצב הבוט שונה ל: *{mode}*',
    'owner.addAuth.usage': 'שימוש: !הוסףמורשהגלובלי user:<id>',
    'owner.addAuth.ok': '✅ {user} נוסף למורשים.',
    'owner.removeAuth.ok': '❌ {user} הוסר מהמורשים.',
    'owner.listAuth': '📋 מורשים:\n{list}',
    'owner.listAuth.none': 'אין מורשים',

    // ---- command handler / middlewares ----
    'handler.cooldown': '⏳ המתן 5 שניות בין פקודות (Anti-Spam).',
    'handler.ownerOnly': '⛔ פקודה לבעלים בלבד.',
    'handler.cmdError': 'חלה שגיאה בביצוע הפקודה.',
    'handler.cmdLog': 'שגיאה בביצוע !{cmd}:',
    'auth.selfOnly': 'הבוט במצב שימוש עצמי בלבד.',
    'auth.authorizedOnly': 'הבוט פתוח למשתמשים מורשים בלבד.',

    // ---- gemini service ----
    'gemini.noKey': 'שגיאה: לא הוגדר GEMINI_API_KEY בקובץ .env',
    'gemini.commError': 'שגיאה בתקשורת עם הבינה המלאכותית: {err}',

    // ---- index.js ----
    'index.noToken': '❌ חובה להגדיר את WA_API_TOKEN בקובץ .env!',
    'index.reminder': '⏰ *תזכורת:* {text}',
    'index.reminderError': 'שגיאה בשליחת תזכורת:',
    'index.closing': '\nסוגר בוט...',
    'index.sigterm': '[Shutdown] התקבל SIGTERM — סוגר בצורה מסודרת'
  },

  en: {
    // ---- menu pages (general.js) ----
    'menu.main':
`━━━━━━━━━━━━━━━━━━━━━━
   🤖 *Category Menu* 🤖
━━━━━━━━━━━━━━━━━━━━━━
Hello! Choose a category to see its commands:

1️⃣ 🧠 *Artificial Intelligence (AI)*
2️⃣ 🎬 *Media, Songs & Downloads*
3️⃣ 🛠️ *Tools, Info & Daily*
4️⃣ 🎮 *Games, Fun & Reputation*
5️⃣ 👑 *System & Admin*

━━━━━━━━━━━━━━━━━━━━━━
💬 *Send \`!1\` to \`!5\` (or \`!menu [number]\`) to view a page.*`,
    'menu.p1':
`━━━━━━━━━━━━━━━━━━━━━━
   🧠 *Artificial Intelligence (AI)* 🧠
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!ask [question]\` • Free chat with Gemini
▫️ \`!summarize\` • Summarize texts (as a reply)
▫️ \`!imagine [description]\` • Generate a detailed image description
▫️ \`!translate [language] [text]\` • Quick translation to any language

{back}`,
    'menu.p2':
`━━━━━━━━━━━━━━━━━━━━━━
   🎬 *Media, Songs & Downloads* 🎬
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!tiktok [link]\` • Download video without watermark
▫️ \`!insta [link]\` • Download Reels
▫️ \`!youtube [song]\` • YouTube search: 10 results to pick, then MP3 / voice note / clip
▫️ \`!cut [start] [end]\` • Trim song/video as a reply
▫️ \`!filter [bw/negative/blur]\` • Image processing
▫️ \`!qr [text/link]\` • High-quality QR code
▫️ \`!sticker\` / \`!s\` • Turn photo/video into a sticker
▫️ \`!tofile\` / \`!tofile\` • Send media as an uncompressed document

{back}`,
    'menu.p3':
`━━━━━━━━━━━━━━━━━━━━━━
   🛠️ *Tools, Info & Daily* 🛠️
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!weather [city]\` • Live weather forecast
▫️ \`!news\` • 5 latest flashes from Ynet
▫️ \`!rates\` • Dollar, euro, bitcoin and ethereum rates
▫️ \`!shabbat [city]\` • Shabbat times and parasha
▫️ \`!todo [add/del/clear]\` • Shopping/task list
▫️ \`!reminder [time] [m/h/d] [message]\` • Set a reminder
▫️ \`!choose [option 1, 2...]\` • Decision wheel
▫️ \`!shorten [link]\` • Shorten a URL via TinyURL
▫️ \`!link [number]\` • Direct WhatsApp chat link
▫️ \`!calc [expression]\` • Solve a math expression
▫️ \`!search [query]\` • Direct Google search link

{back}`,
    'menu.p4':
`━━━━━━━━━━━━━━━━━━━━━━
   🎮 *Games, Fun & Community* 🎮
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!blackjack\` • 21 against the bot (\`!hit\` / \`!stand\`)
▫️ \`!battle\` • Turn-based RPG battle (\`!battle attack\`)
▫️ \`!hangman [letter]\` • Hebrew hangman
▫️ \`!quiz\` • Emoji quiz (\`!guess [name]\`)
▫️ \`!tictactoe [1-9]\` • Tic-tac-toe vs the bot
▫️ \`!race\` • Snakes & ladders race to 100 (\`!roll\` to roll)
▫️ \`!trivia\` • American trivia question (\`!answer\`)
▫️ \`!dice\` / \`!coin\` • Roll a dice or a coin
▫️ \`!joke\` / \`!quote\` / \`!reverse\` • Quick fun
▫️ \`!thanks\` • Give a reputation point (as a reply)
▫️ \`!rep\` / \`!top\` • Top score tables

{back}`,
    'menu.p5':
`━━━━━━━━━━━━━━━━━━━━━━
   👑 *System & Bot Admin* 👑
━━━━━━━━━━━━━━━━━━━━━━
▫️ \`!ping\` • Bot response time check
▫️ \`!me\` • Your account details and ID
▫️ \`!wiki [term]\` • Wikipedia summary
▫️ \`!time\` / \`!date\` • Israel clock and date
▫️ \`!status\` • Uptime and bot status (owner)
▫️ \`!version\` • System version info
▫️ \`!owner\` • Bot owner ID
▫️ \`!setmode [self/authorized/public]\` • Access level
▫️ \`!addauth\` / \`!removeauth\`
▫️ \`!listauth\` • View the VIP list

{back}`,
    'menu.back': '_Back to the main menu: send `!menu`_',

    // ---- interactive buttons demo ----
    'general.buttons.title': '🤖 *Interactive Buttons Demo*\nTap a button — each one runs a real bot command:',
    'general.buttons.ai': '🧠 AI',
    'general.buttons.ping': '🏓 Ping test',
    'general.buttons.joke': '😂 Tell a joke',
    'general.buttons.footer': 'Sent directly, no approved template ✨',
    'general.buttons.callBody': '📞 *Need human help?*\nTap the button to start a WhatsApp voice call:',
    'general.buttons.callNow': 'Call now',
    'general.buttons.unsupported': '⚠️ *Clickable buttons are not supported yet*\nWhatsApp\'s Agent platform (which this bot runs on) currently allows only text and media — no buttons and no call button.\nThe code is ready, and once WhatsApp enables it this will work automatically.\n\nMeanwhile: send `!menu` and pick a number from the menu 👆',

    // ---- shabbat ----
    'general.shabbat.result': '🕯️ *Shabbat Times - {city}* 🕯️\n━━━━━━━━━━━━━━━━━━━\n📖 *Parasha:* {parasha}\n🕯️ *Candle lighting:* {candle}\n✨ *Havdalah:* {havdalah}\n━━━━━━━━━━━━━━━━━━━{note}\nShabbat Shalom!',
    'general.shabbat.fallback': '\n⚠️ _No exact mapping for this city - showing Jerusalem times._',
    'general.shabbat.error': '❌ Error fetching Shabbat times.',

    // ---- general one-liners ----
    'general.ping': '🏓 Pong! Response time: *{delay}ms*',
    'general.me': '👤 ID: {id}\nName: {name}',
    'general.unknown': 'Unknown',
    'general.wiki.usage': 'Usage: !wiki [term]',
    'general.wiki.result': '📖 *{title}*\n\n{extract}',
    'general.time': '🕒 Time: *{time}*',
    'general.date': '📅 Date: *{date}*',
    'general.deleteMsg': 'ℹ️ Deleting a bot message for everyone is done directly in the app.',

    // ---- ai ----
    'ai.ask.usage': 'Please provide a question after the command.',
    'ai.summarize.usage': '❌ Reply to the message you want to summarize, or write the text after the !summarize command.',
    'ai.summarize.prompt': 'Summarize the following text concisely, clearly and organized in bullet points:',
    'ai.summarize.title': '📝 *Summary:*\n\n{reply}',
    'ai.imagine.usage': 'Please enter a description for the image.',
    'ai.imagine.title': '🎨 *Image Prompt:*\n\n{reply}',
    'ai.translate.usage': 'Usage: !translate [language] [text]',

    // ---- games: shared ----
    'games.handTotal': '(total: *{total}*)',

    // ---- tic-tac-toe ----
    'games.tictactoe.win': '🎉 *You beat the bot!* (+{points} reputation points)',
    'games.tictactoe.lose': '🤖 *The bot won!* Try again with `!tictactoe start`',
    'games.tictactoe.draw': '🤝 *Draw!* Well played.',
    'games.tictactoe.cancel': '🛑 Tic-tac-toe game cancelled.',
    'games.tictactoe.start': '🎮 *Tic-tac-toe started!* You are ❌, the bot is ⭕\n{board}\nPick a cell 1-9 with `!tictactoe [number]`',
    'games.tictactoe.invalid': 'Choose a free cell (1-9):\n{board}',
    'games.tictactoe.taken': '❌ Cell {pos} is taken. Choose another:\n{board}',
    'games.tictactoe.turn': '{board}\nYour turn! Send `!tictactoe [1-9]`',

    // ---- blackjack ----
    'games.blackjack.cancel': '🛑 Blackjack game cancelled.',
    'games.blackjack.natural': '🃏 *BLACKJACK! Natural blackjack!* 🎉\n\nYour hand: {player}\nBot hand: {bot}\n\nYou won and earned {points} reputation points!',
    'games.blackjack.start': '🃏 *Blackjack game (21)* 🃏\n━━━━━━━━━━━━━━━━━━━\n👤 *Your hand:* {player}\n🤖 *Bot hand:* {bot}\n━━━━━━━━━━━━━━━━━━━\nChoose your next move:\n▫️ `!hit` - take another card (Hit)\n▫️ `!stand` - stop and check the result (Stand)\n▫️ `!blackjack cancel` - cancel the game',
    'games.blackjack.noGame': 'No active blackjack game right now. Send !blackjack to start.',
    'games.blackjack.bust': '💥 *Bust!*\nYour hand: {hand}\nYou went over 21. The bot wins this time!',
    'games.blackjack.hit': '🃏 You drew a card:\n{hand}\n\nSend `!hit` for another card, or `!stand` to stand.',
    'games.blackjack.dealerBust': '🎉 *Dealer bust! You win!* (+{points} points)',
    'games.blackjack.win': '🏆 *You beat the bot!* (+{points} points)',
    'games.blackjack.lose': '🤖 *The bot wins!* Better luck next time.',
    'games.blackjack.push': '🤝 *Push (tie)!*',
    'games.blackjack.result': '🃏 *Blackjack result* 🃏\n━━━━━━━━━━━━━━━━━━━\n👤 *Your hand:* {player}\n🤖 *Bot hand:* {bot}\n━━━━━━━━━━━━━━━━━━━\n{result}',

    // ---- trivia / dice / coin ----
    'games.trivia.question': '❓ *{q}*\n{opts}\n_Answer: !answer [number]_',
    'games.trivia.noActive': 'No active trivia question. Send !trivia to start.',
    'games.trivia.correct': '🎉 *Correct!* (+{points} reputation points)',
    'games.trivia.wrong': '❌ Wrong, try again!',
    'games.dice': '🎲 Result: *{n}*',
    'games.coin.result': '🪙 Result: *{side}*',
    'games.coin.heads': 'Heads',
    'games.coin.tails': 'Tails',
    'games.joke.format': '😄 {text}',
    'games.quote.format': '📜 {text}',

    // ---- reputation ----
    'games.thanks.usage': '⭐ Reply to someone\'s message with !thanks to give them a reputation point.',
    'games.thanks.self': '😉 You can\'t give reputation to yourself!',
    'games.thanks.ok': '⭐ Thank you! A reputation point was awarded.',
    'games.reputation': '📊 Your reputation: *{score}*',
    'games.top5.empty': '🏆 No reputation scores yet. Play to earn points!',
    'games.top5.title': '🏆 *Top 5 Reputation* 🏆\n━━━━━━━━━━━━━━━━━━━\n',
    'games.top5.row': '{medal} {score} points{you}\n',
    'games.top5.you': ' (you)',

    // ---- hangman ----
    'games.hangman.cancel': '🛑 Hangman game cancelled.',
    'games.hangman.start': '🪢 *Hangman started!*\n\nWord: {mask}\nStrikes left: ❤️ x 6\n\nSend: `!hangman [letter]` to guess.',
    'games.hangman.status': '🪢 Word: {mask}\nStrikes: {lives}\nLetters: {letters}\n\nGuess a letter: `!hangman [letter]`',
    'games.hangman.oneLetter': 'Send only one letter.',
    'games.hangman.already': 'You already guessed "{letter}".',
    'games.hangman.win': '🎉 *Well done! You guessed the word:* *{word}*!\nYou earned +{points} reputation points!',
    'games.hangman.lose': '💀 *Game over!* The word was: *{word}*.\nSend !hangman to start a new game.',
    'games.hangman.noLetters': 'none guessed yet',

    // ---- emoji quiz ----
    'games.emoji.prompt': '🎬 *Emoji quiz! Which movie is this?*\n\n{emojis}\n\n_Answer with: !guess [movie name]_',
    'games.emoji.noActive': 'No active quiz. Send !quiz to start.',
    'games.emoji.noGuess': 'Guess a movie name: !guess [movie name]',
    'games.emoji.correct': '🎉 *Bullseye! The answer is indeed "{ans}"!* (+{points} reputation points)',
    'games.emoji.wrong': '❌ Wrong, try again!',

    // ---- battle ----
    'games.battle.cancel': '🛑 Battle stopped.',
    'games.battle.start': '⚔️ *Battle against the bot has begun!*\n\n👤 You: 100/100 HP\n🤖 Bot: 100/100 HP\n\nChoose a move:\n▫️ `!battle attack` (safe damage)\n▫️ `!battle special` (high damage or miss)\n▫️ `!battle heal` (+25 HP)',
    'games.battle.attackLog': '🗡️ You attacked the bot and dealt *{dmg}* damage!\n',
    'games.battle.specialHit': '💥 Special attack hit! You dealt *{dmg}* damage to the bot!\n',
    'games.battle.specialMiss': '💨 The special attack missed!\n',
    'games.battle.heal': '🧪 You drank a potion and healed *{amount}* HP!\n',
    'games.battle.invalid': 'Choose: !battle [attack / special / heal / cancel]',
    'games.battle.win': '🏆 *You defeated the bot in battle!* You earned +{points} reputation points!\n\n{log}',
    'games.battle.counter': '🤖 The bot struck back and dealt you *{dmg}* damage!',
    'games.battle.lose': '💀 *You were defeated in battle!* Try again with !battle.\n\n{log}',
    'games.battle.status': '\n\n👤 You: {php}/100 HP\n🤖 Bot: {bhp}/100 HP\n\nChoose a move: `!battle attack` | `!battle special` | `!battle heal`',

    // ---- race ----
    'games.race.cancel': '🛑 Race cancelled.',
    'games.race.start': '🏁 *Snakes & ladders race started!* 🐍🪜\n━━━━━━━━━━━━━━\n🟢 You vs 🔴 the bot — first to reach *exactly* 100 wins!\nLadders go up 🪜, snakes go down 🐍\n\nSend `!roll` to roll the dice.',
    'games.race.noRace': 'No active race. Send `!race` to start.',
    'games.race.overshoot': '⏸️ You passed 100 — staying put (need exactly 100!)',
    'games.race.ladder': '🪜 *Ladder!* {from} ← {to}',
    'games.race.snake': '🐍 *Snake!* {from} ← {to}',
    'games.race.roll': '🎲 You rolled: {face} (*{roll}*) → square *{pos}*',
    'games.race.win': '🏆 *You won the race!* 🎉 (+{points} reputation points)\n\n{log}',
    'games.race.botRoll': '🤖 The bot rolled: {face} (*{roll}*) → square *{pos}*',
    'games.race.botWin': '🤖 *The bot won the race!* Try again with `!race`\n\n{log}',
    'games.race.board': '🏁 *Snakes & ladders race* 🐍\n━━━━━━━━━━━━━━\n{log}\n━━━━━━━━━━━━━━\n{bar}\n🟢 You: *{player}* | 🔴 Bot: *{bot}*\n\nSend `!roll` for the next turn',

    // ---- media: youtube ----
    'media.yt.formatAudio': '🎵 Audio file (MP3)',
    'media.yt.formatVoice': '🎤 Voice message',
    'media.yt.formatVideo': '🎬 Video clip (MP4)',
    'media.yt.downloading': '⏳ Downloading {format}{title}\nPlease wait...',
    'media.done': '🎬 Downloaded successfully!',
    'media.yt.rateLimit': '⏳ YouTube is temporarily blocking (too many requests). Wait a few minutes and try again.',
    'media.yt.error': '❌ Error downloading from YouTube.',
    'media.yt.noFile': '❌ The download produced no file (probably too large — over 15MB). Try a shorter song.',
    'media.yt.formatMenu': '🎵 *{title}*\n\nChoose a format — send:\n`!youtube audio` — MP3 file\n`!youtube voice` — voice message 🎤\n`!youtube video` — MP4 clip',
    'media.yt.usage': 'Usage: !youtube [song name or link]\nExample: !youtube imagine dragons',
    'media.yt.range': 'Choose a number between 1 and {max}.',
    'media.yt.searching': '🔎 Searching for "{q}"...',
    'media.yt.searchError': '❌ Error searching YouTube.',
    'media.yt.noResults': 'No results found, try a different query.',
    'media.yt.results': '🎵 *Search results:*\n\n{list}\n\nSend `!youtube [number]` to choose\nExample: `!youtube 3` or directly `!youtube 3 voice`',

    // ---- media: trim ----
    'media.trim.usage': 'Usage: reply to a song or video and write:\n!cut [start] [end]\nExample: !cut 00:10 00:30 or !cut 10 30',
    'media.trim.invalidTime': '❌ Invalid time format. Example: !cut 00:10 00:30',
    'media.trim.noMedia': '❌ You must reply directly to the audio or video file you want to trim.',
    'media.trim.working': '⏳ Trimming the file from {start} to {end}, please wait...',
    'media.trim.done': '✂️ Trimmed successfully ({start} - {end})',
    'media.trim.error': '❌ Error trimming the file. Make sure you specified valid times (e.g. !cut 00:10 00:30).',

    // ---- media: sticker / tofile / video / qr ----
    'media.sticker.noMedia': '❌ Send a photo with the caption *!sticker*, or reply to a photo.',
    'media.sticker.working': '⏳ Processing the sticker...',
    'media.sticker.error': '❌ Error converting the sticker.',
    'media.tofile.noMedia': '❌ Reply with *!tofile* to a photo or file.',
    'media.tofile.working': '⏳ Preparing the file as a document...',
    'media.tofile.error': '❌ Error converting the file to a document.',
    'media.video.usage': 'Usage: !tiktok [link]',
    'media.video.working': '⏳ Downloading the video, one moment...',
    'media.video.error': '❌ Error downloading the video.',
    'media.qr.usage': 'Usage: !qr [text or link]',
    'media.qr.caption': '📱 QR: "{text}"',
    'media.qr.error': '❌ Error creating the QR code.',

    // ---- media: reminder / shorten / link / calc / search / filter ----
    'media.reminder.usage': 'Usage: !reminder [time] [m/h/d] [message]',
    'media.reminder.badAmount': '❌ Time must be a positive number. Example: !reminder 10 m buy milk',
    'media.reminder.badUnit': '❌ Invalid time unit. Use: m / h / d',
    'media.reminder.set': '✅ Reminder set for {amount} {unit} from now.',
    'media.shorten.usage': 'Please provide a link.',
    'media.shorten.ok': '🔗 Shortened link: {url}',
    'media.shorten.error': 'Error shortening.',
    'media.link.usage': 'Please provide a number.',
    'media.calc.invalid': 'Invalid expression.',
    'media.calc.result': '🔢 Result: *{result}*',
    'media.calc.error': 'Calculation error.',
    'media.search.usage': 'Enter a query.',
    'media.filter.usage': 'Usage: reply to a photo with:\n!filter [bw / negative / blur]',
    'media.filter.noMedia': '❌ You must reply to a photo.',
    'media.filter.working': '⏳ Applying filter to the photo...',
    'media.filter.done': '✨ Filter {type} applied successfully!',
    'media.filter.error': '❌ Error applying the filter.',

    // ---- tools: weather ----
    'tools.weather.notFound': '❌ City "{city}" not found.',
    'tools.weather.unknown': 'Unknown condition',
    'tools.weather.result': '🌤️ *Weather in {city}* 🌤️\n━━━━━━━━━━━━━━━━━━━\n🌡️ *Temperature:* {temp}°C\n🌪️ *Wind speed:* {wind} km/h\n☁️ *Sky:* {desc}\n━━━━━━━━━━━━━━━━━━━',
    'tools.weather.error': '❌ Error fetching weather data.',

    // ---- tools: news ----
    'tools.news.empty': 'No flashes found right now.',
    'tools.news.header': '📰 *Latest news flashes (Ynet):*\n━━━━━━━━━━━━━━━━━━━\n\n',
    'tools.news.error': '❌ Error fetching news headlines.',

    // ---- tools: rates ----
    'tools.rates.fiat': '💵 *Dollar:* ₪{usd}\n💶 *Euro:* ₪{eur}\n💷 *Pound:* ₪{gbp}',
    'tools.rates.fiatError': '❌ Error fetching currency rates.',
    'tools.rates.crypto': '🪙 *Bitcoin (BTC):*\n₪{btcIls} (${btcUsd})\n\n💎 *Ethereum (ETH):*\n₪{ethIls}',
    'tools.rates.cryptoError': '\n⚠️ Crypto rates temporarily unavailable.',
    'tools.rates.title': '💰 *Currency & Crypto Rates* 💰\n━━━━━━━━━━━━━━━━━━━\n{fiat}\n{crypto}\n━━━━━━━━━━━━━━━━━━━',

    // ---- tools: todo ----
    'tools.todo.addUsage': 'Usage: !todo add [item]',
    'tools.todo.added': '✅ Added to the list: "{item}"',
    'tools.todo.badIndex': 'Invalid item number.',
    'tools.todo.removed': '🗑️ Item "{item}" deleted.',
    'tools.todo.cleared': '🧹 Your list was fully cleared.',
    'tools.todo.empty': '📝 Your list is empty. Add items with:\n`!todo add [item]`',
    'tools.todo.title': '📝 *Your personal list:*\n━━━━━━━━━━━━━━━━━━━\n',
    'tools.todo.footer': '\n_To delete an item: !todo del [number]_',

    // ---- tools: choose ----
    'tools.choose.usage': 'Usage: !choose [option 1], [option 2], [option 3]...\nExample: !choose pizza, burger, shawarma',
    'tools.choose.result': '🎯 The bot chose: *{choice}*!',

    // ---- owner ----
    'owner.uptimeDays': '{n} days',
    'owner.uptimeHours': '{n} hours',
    'owner.uptimeMinutes': '{n} minutes',
    'owner.uptimeSeconds': '{n} seconds',
    'owner.status': '🤖 *Status:*\nUptime: {uptime}\nMode: {mode}\nOwner: {owner}',
    'owner.notSet': 'not set',
    'owner.version': '⚙️ Version 1.0.0 (WhatsApp Agent Platform v1 - 2026)',
    'owner.owner': '👑 Owner: {id}',
    'owner.setMode.usage': 'Usage: !setmode [self/authorized/public]',
    'owner.setMode.ok': '🔒 Bot mode changed to: *{mode}*',
    'owner.addAuth.usage': 'Usage: !addauth user:<id>',
    'owner.addAuth.ok': '✅ {user} added to authorized users.',
    'owner.removeAuth.ok': '❌ {user} removed from authorized users.',
    'owner.listAuth': '📋 Authorized users:\n{list}',
    'owner.listAuth.none': 'none',

    // ---- command handler / middlewares ----
    'handler.cooldown': '⏳ Wait 5 seconds between commands (Anti-Spam).',
    'handler.ownerOnly': '⛔ Owner-only command.',
    'handler.cmdError': 'An error occurred while running the command.',
    'handler.cmdLog': 'Error running !{cmd}:',
    'auth.selfOnly': 'The bot is in self-use mode only.',
    'auth.authorizedOnly': 'The bot is open to authorized users only.',

    // ---- gemini service ----
    'gemini.noKey': 'Error: GEMINI_API_KEY is not set in the .env file',
    'gemini.commError': 'Error communicating with the AI: {err}',

    // ---- index.js ----
    'index.noToken': '❌ WA_API_TOKEN must be set in the .env file!',
    'index.reminder': '⏰ *Reminder:* {text}',
    'index.reminderError': 'Error sending reminder:',
    'index.closing': '\nClosing bot...',
    'index.sigterm': '[Shutdown] Received SIGTERM — closing gracefully'
  }
};

function t(key, vars = {}) {
  const lang = config.lang || 'he';
  let s = (STR[lang] && STR[lang][key] !== undefined) ? STR[lang][key] : (STR.he[key] !== undefined ? STR.he[key] : key);
  if (vars && typeof vars === 'object') {
    for (const k of Object.keys(vars)) {
      s = s.split('{' + k + '}').join(String(vars[k]));
    }
  }
  return s;
}

// Pick a language-dependent value (e.g. parallel content banks).
function pick(heVal, enVal) {
  return (config.lang || 'he') === 'en' ? enVal : heVal;
}

module.exports = { t, pick, STR };
