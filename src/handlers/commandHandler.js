const ai = require('../commands/ai');
const media = require('../commands/media');
const games = require('../commands/games');
const tools = require('../commands/tools');
const general = require('../commands/general');
const owner = require('../commands/owner');
const { checkCooldown } = require('../middlewares/cooldown');
const { checkAuth } = require('../middlewares/auth');
const { t } = require('../i18n');

const map = {
  // תפריט ודפדוף
  'תפריט': general.menu, 'עזרה': general.menu, 'menu': general.menu, 'help': general.menu,
  '1': general.menu1, 'בינה': general.menu1,
  '2': general.menu2, 'מדיה': general.menu2,
  '3': general.menu3, 'כלים': general.menu3,
  '4': general.menu4, 'משחקים': general.menu4,
  '5': general.menu5, 'מנהל': general.menu5,

  // AI
  'שאל': ai.ask, 'ask': ai.ask,
  'סכם': ai.summarize, 'summarize': ai.summarize,
  'דמיין': ai.imagine, 'imagine': ai.imagine,
  'תרגם': ai.translate, 'translate': ai.translate,

  // כלים
  'מזגאוויר': tools.weather, 'מזג_אוויר': tools.weather, 'weather': tools.weather,
  'חדשות': tools.news, 'מבזק': tools.news, 'news': tools.news,
  'שער': tools.rates, 'שערים': tools.rates, 'קריפטו': tools.rates,
  'רשימה': tools.todo, 'todo': tools.todo,
  'בחר': tools.choose, 'choose': tools.choose,

  // מדיה
  'טיקטוק': media.downloadVideo, 'tiktok': media.downloadVideo,
  'אינסטה': media.downloadVideo, 'אינסטגרם': media.downloadVideo, 'insta': media.downloadVideo,
  'הורד': media.downloadVideo,
  'חתוך': media.trimMedia, 'cut': media.trimMedia,
  'פילטר': media.filter,
  'qr': media.qrCode,
  'יוטיוב': media.youtube, 'שיר': media.youtube,
  'סטיקר': media.sticker, 's': media.sticker,
  'למי': media.tofile, 'tofile': media.tofile,
  'תזכורת': media.reminder,
  'קיצור': media.shorten,
  'לינק': media.link,
  'מחשבון': media.calc,
  'חיפוש': media.search,

  // משחקים
  'תלוי': games.hangman, 'אישתלוי': games.hangman,
  'חידון': games.emojiQuiz, 'חידוןאימוגי': games.emojiQuiz,
  'ניחוש': games.guessEmoji,
  'קרב': games.battle,
  'בלקגק': games.blackjack, 'בלקג\'ק': games.blackjack, 'blackjack': games.blackjack, '21': games.blackjack,
  'קלף': games.blackjackHit, 'hit': games.blackjackHit,
  'עמוד': games.blackjackStand, 'stand': games.blackjackStand,
  'איקסעיגול': games.tictactoe,
  'מרוץ': games.race, 'סולמות': games.race,
  'זרוק': games.raceRoll,
  'טריוויה': games.trivia,
  'תשובה': games.answer,
  'קובייה': games.dice,
  'מטבע': games.coin,
  'בדיחה': games.joke,
  'ציטוט': games.quote,
  'הפוך': games.reverse,
  'תודה': games.thanks,
  'מוניטין': games.reputation,
  'טופ5': games.top5,

  // אינטראקטיבי
  'כפתורים': general.buttonsDemo, 'buttons': general.buttonsDemo,

  // מידע כללי
  'שבת': general.shabbat, 'shabbat': general.shabbat,
  'פינג': general.ping,
  'אני': general.me,
  'ויקיפדיה': general.wiki,
  'שעה': general.time,
  'תאריך': general.date,
  'מחק': general.deleteMsg,

  // בעלים
  'סטטוס': owner.status,
  'גרסה': owner.version,
  'בעלים': owner.owner,
  'שנהמצב': owner.setMode,
  'הוסףמורשהגלובלי': owner.addAuth,
  'הסרמורשהגלובלי': owner.removeAuth,
  'רשימהגלובלית': owner.listAuth
};

const ownerCmds = ['סטטוס', 'גרסה', 'בעלים', 'שנהמצב', 'הוסףמורשהגלובלי', 'הסרמורשהגלובלי', 'רשימהגלובלית'];

async function handleCommand(client, msg, rawData) {
  const text = msg.text?.body?.trim() || msg.image?.caption?.trim() || msg.video?.caption?.trim() || '';
  if (!text.startsWith('!')) return false;

  const parts = text.slice(1).split(/ +/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  const handler = map[cmd];
  if (!handler) return false;

  if (!checkCooldown(msg.from)) {
    await client.sendMessage(msg.from, t('handler.cooldown'));
    return true;
  }

  const auth = checkAuth(msg.from);
  if (!auth.allowed) {
    await client.sendMessage(msg.from, auth.reason);
    return true;
  }

  if (ownerCmds.includes(cmd) && !auth.isOwner) {
    await client.sendMessage(msg.from, t('handler.ownerOnly'));
    return true;
  }

  await client.markAsReadAndTyping(msg.id, true);

  try {
    await handler(client, msg, args, rawData);
  } catch (err) {
    console.error(t('handler.cmdLog', { cmd }), err);
    await client.sendMessage(msg.from, t('handler.cmdError'));
  }

  return true;
}

module.exports = { handleCommand };
