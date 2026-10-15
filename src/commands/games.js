const db = require('../services/database');

const suits = ['♠', '♥', '♦', '♣'];
const ranks = [
  { r: '2', v: 2 }, { r: '3', v: 3 }, { r: '4', v: 4 }, { r: '5', v: 5 },
  { r: '6', v: 6 }, { r: '7', v: 7 }, { r: '8', v: 8 }, { r: '9', v: 9 },
  { r: '10', v: 10 }, { r: 'J', v: 10 }, { r: 'Q', v: 10 }, { r: 'K', v: 10 }, { r: 'A', v: 11 }
];

function drawCard() {
  const suit = suits[Math.floor(Math.random() * suits.length)];
  const rank = ranks[Math.floor(Math.random() * ranks.length)];
  return { str: `${rank.r}${suit}`, val: rank.v, isAce: rank.r === 'A' };
}

function calculateHand(hand) {
  let sum = hand.reduce((acc, c) => acc + c.val, 0);
  let aces = hand.filter(c => c.isAce).length;
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
}

function formatHand(hand, hideSecond = false) {
  if (hideSecond) return `[ ${hand[0].str} | 🎴 ]`;
  return `[ ${hand.map(c => c.str).join(' | ')} ] (סך הכל: *${calculateHand(hand)}*)`;
}

// --- איקס-עיגול ---
const cellEmoji = { ' ': '⬜', 'X': '❌', 'O': '⭕' };

function renderBoard(board) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const cells = [];
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      cells.push(board[i] === ' ' ? `${r * 3 + c + 1}️⃣` : cellEmoji[board[i]]);
    }
    rows.push(cells.join(''));
  }
  return rows.join('\n');
}

function checkWinner(b) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, c, d] of lines) {
    if (b[a] !== ' ' && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

async function endTictactoe(client, userId, game, winner) {
  let text = `${renderBoard(game.board)}\n\n`;
  if (winner === 'X') {
    text += '🎉 *ניצחת את הבוט!* (+3 נקודות מוניטין)';
    db.update(d => {
      delete d.tictactoe[userId];
      d.reputation[userId] = (d.reputation[userId] || 0) + 3;
    });
  } else if (winner === 'O') {
    text += '🤖 *הבוט ניצח!* נסה שוב עם `!איקסעיגול התחל`';
    db.update(d => { delete d.tictactoe[userId]; });
  } else {
    text += '🤝 *תיקו!* כל הכבוד.';
    db.update(d => { delete d.tictactoe[userId]; });
  }
  await client.sendMessage(userId, text);
}

module.exports = {
  // בלקג'ק - התחלת משחק
  async blackjack(client, msg, args) {
    const userId = msg.from;
    const sub = args[0]?.toLowerCase();

    if (sub === 'בטל') {
      db.update(d => { delete d.blackjack[userId]; });
      return client.sendMessage(userId, '🛑 משחק הבלקג\'ק בוטל.');
    }

    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];

    const game = { playerHand, dealerHand };
    const pScore = calculateHand(playerHand);

    if (pScore === 21) {
      db.update(d => {
        delete d.blackjack[userId];
        d.reputation[userId] = (d.reputation[userId] || 0) + 5;
      });
      return client.sendMessage(userId, `🃏 *BLACKJACK! בלקג'ק טבעי!* 🎉\n\nהיד שלך: ${formatHand(playerHand)}\nיד הבוט: ${formatHand(dealerHand)}\n\nניצחת וזכית ב-5 נקודות מוניטין!`);
    }

    db.update(d => { d.blackjack[userId] = game; });

    const text = 
`🃏 *משחק בלקג'ק (21)* 🃏
━━━━━━━━━━━━━━━━━━━
👤 *היד שלך:* ${formatHand(playerHand)}
🤖 *היד של הבוט:* ${formatHand(dealerHand, true)}
━━━━━━━━━━━━━━━━━━━
בחר את הצעד הבא:
▫️ \`!קלף\` - לקחת קלף נוסף (Hit)
▫️ \`!עמוד\` - לעצור ולבדוק תוצאה (Stand)
▫️ \`!בלקג'ק בטל\` - לביטול המשחק`;

    await client.sendMessage(userId, text);
  },

  // לקיחת קלף נוסף
  async blackjackHit(client, msg) {
    const userId = msg.from;
    const game = db.get().blackjack[userId];
    if (!game) return client.sendMessage(userId, 'לא פעיל כרגע משחק בלקג\'ק. שלח !בלקג\'ק כדי להתחיל.');

    game.playerHand.push(drawCard());
    const pScore = calculateHand(game.playerHand);

    if (pScore > 21) {
      db.update(d => { delete d.blackjack[userId]; });
      return client.sendMessage(userId, `💥 *נפסלת! (Bust)*\nהיד שלך: ${formatHand(game.playerHand)}\nעברת את 21. הבוט ניצח הפעם!`);
    }

    db.update(d => { d.blackjack[userId] = game; });
    await client.sendMessage(userId, `🃏 לקחת קלף:\n${formatHand(game.playerHand)}\n\nשלח \`!קלף\` לקלף נוסף, או \`!עמוד\` לעצירה.`);
  },

  // עצירה ותור הבוט
  async blackjackStand(client, msg) {
    const userId = msg.from;
    const game = db.get().blackjack[userId];
    if (!game) return client.sendMessage(userId, 'לא פעיל כרגע משחק בלקג\'ק. שלח !בלקג\'ק כדי להתחיל.');

    const pScore = calculateHand(game.playerHand);

    // הבוט מושך קלפים עד שמגיע ל-17 לפחות
    while (calculateHand(game.dealerHand) < 17) {
      game.dealerHand.push(drawCard());
    }

    const dScore = calculateHand(game.dealerHand);
    let result = '';

    if (dScore > 21) {
      result = '🎉 *הבוט נפסל (Bust)! ניצחת!* (+3 נקודות)';
      db.update(d => { d.reputation[userId] = (d.reputation[userId] || 0) + 3; });
    } else if (pScore > dScore) {
      result = '🏆 *ניצחת את הבוט!* (+3 נקודות)';
      db.update(d => { d.reputation[userId] = (d.reputation[userId] || 0) + 3; });
    } else if (pScore < dScore) {
      result = '🤖 *הבוט ניצח!* נסה שוב בפעם הבאה.';
    } else {
      result = '🤝 *תיקו (Push)!*';
    }

    db.update(d => { delete d.blackjack[userId]; });

    const text = 
`🃏 *תוצאת בלקג'ק* 🃏
━━━━━━━━━━━━━━━━━━━
👤 *היד שלך:* ${formatHand(game.playerHand)}
🤖 *היד של הבוט:* ${formatHand(game.dealerHand)}
━━━━━━━━━━━━━━━━━━━
${result}`;

    await client.sendMessage(userId, text);
  },

  async tictactoe(client, msg, args) {
    const userId = msg.from;
    const sub = args[0]?.toLowerCase();
    if (sub === 'בטל') {
      db.update(d => { delete d.tictactoe[userId]; });
      return client.sendMessage(userId, '🛑 משחק האיקס-עיגול בוטל.');
    }

    let game = db.get().tictactoe[userId];
    if (!game || sub === 'התחל') {
      game = { board: Array(9).fill(' '), active: true };
      db.update(d => { d.tictactoe[userId] = game; });
      return client.sendMessage(userId, `🎮 *משחק איקס-עיגול החל!* אתה ❌ והבוט ⭕\n${renderBoard(game.board)}\nבחר משבצת 1-9 עם \`!איקסעיגול [מספר]\``);
    }

    const pos = parseInt(sub, 10);
    if (!Number.isInteger(pos) || pos < 1 || pos > 9) {
      return client.sendMessage(userId, `בחר משבצת פנויה (1-9):\n${renderBoard(game.board)}`);
    }
    const idx = pos - 1;
    if (game.board[idx] !== ' ') {
      return client.sendMessage(userId, `❌ המשבצת ${pos} תפוסה. בחר אחרת:\n${renderBoard(game.board)}`);
    }

    game.board[idx] = 'X';
    let winner = checkWinner(game.board);
    if (winner || !game.board.includes(' ')) {
      return endTictactoe(client, userId, game, winner);
    }

    // תור הבוט - מהלך אקראי
    const empty = game.board.map((v, i) => v === ' ' ? i : -1).filter(i => i >= 0);
    game.board[empty[Math.floor(Math.random() * empty.length)]] = 'O';
    winner = checkWinner(game.board);

    if (winner || !game.board.includes(' ')) {
      return endTictactoe(client, userId, game, winner);
    }

    db.update(d => { d.tictactoe[userId] = game; });
    await client.sendMessage(userId, `${renderBoard(game.board)}\nתורך! שלח \`!איקסעיגול [1-9]\``);
  },

  async trivia(client, msg) {
    const q = triviaBank[Math.floor(Math.random() * triviaBank.length)];
    db.update(d => { d.trivia[msg.from] = q.a; });
    const opts = q.options.map((o, i) => `${i + 1}. ${o}`).join('\n');
    await client.sendMessage(msg.from, `❓ *${q.q}*\n${opts}\n_ענה: !תשובה [מספר]_`);
  },
  async answer(client, msg, args) {
    const correct = db.get().trivia[msg.from];
    if (!correct) return client.sendMessage(msg.from, 'אין שאלת טריוויה פעילה. שלח !טריוויה כדי להתחיל.');
    const guess = parseInt(args[0], 10);
    if (guess === correct) {
      db.update(d => {
        delete d.trivia[msg.from];
        d.reputation[msg.from] = (d.reputation[msg.from] || 0) + 2;
      });
      return client.sendMessage(msg.from, '🎉 *נכון מאוד!* (+2 נקודות מוניטין)');
    }
    await client.sendMessage(msg.from, '❌ לא נכון, נסה שוב!');
  },
  async dice(client, msg) { await client.sendMessage(msg.from, `🎲 תוצאה: *${Math.floor(Math.random() * 6) + 1}*`); },
  async coin(client, msg) { await client.sendMessage(msg.from, `🪙 תוצאה: *${Math.random() < 0.5 ? 'עץ' : 'פלי'}*`); },
  async joke(client, msg) {
    await client.sendMessage(msg.from, `😄 ${jokes[Math.floor(Math.random() * jokes.length)]}`);
  },
  async quote(client, msg) {
    await client.sendMessage(msg.from, `📜 ${quotes[Math.floor(Math.random() * quotes.length)]}`);
  },
  async reverse(client, msg, args) { await client.sendMessage(msg.from, args.join(' ').split('').reverse().join('')); },
  async thanks(client, msg, args, rawMsg) {
    const quotedId = rawMsg.context?.id;
    const quoted = quotedId ? db.get().recentMessages[quotedId] : null;
    if (!quoted || !quoted.from) {
      return client.sendMessage(msg.from, '⭐ הגב (Reply) על הודעה של מישהו עם !תודה כדי להעניק לו נקודת מוניטין.');
    }
    if (quoted.from === msg.from) {
      return client.sendMessage(msg.from, '😉 אי אפשר להעניק מוניטין לעצמך!');
    }
    db.update(d => { d.reputation[quoted.from] = (d.reputation[quoted.from] || 0) + 1; });
    await client.sendMessage(msg.from, `⭐ תודה רבה! הוענקה נקודת מוניטין.`);
  },
  async reputation(client, msg) { await client.sendMessage(msg.from, `📊 המוניטין שלך: *${db.get().reputation[msg.from] || 0}*`); },
  async top5(client, msg) {
    const rep = db.get().reputation || {};
    const sorted = Object.entries(rep).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length === 0) return client.sendMessage(msg.from, '🏆 עדיין אין ניקוד מוניטין. שחקו כדי לצבור נקודות!');
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    let text = '🏆 *טופ 5 מוניטין* 🏆\n━━━━━━━━━━━━━━━━━━━\n';
    sorted.forEach(([user, score], i) => {
      const you = user === msg.from ? ' (אתה)' : '';
      text += `${medals[i]} ${score} נקודות${you}\n`;
    });
    await client.sendMessage(msg.from, text.trim());
  }
};

const hangmanWords = ['מחשב', 'ישראל', 'מוזיקה', 'שוקולד', 'טלפון', 'אינטרנט', 'חלל', 'חופשה', 'אופניים', 'גלידה', 'פיצה'];

// משחק איש תלוי
module.exports.hangman = async function(client, msg, args) {
  const userId = msg.from;
  const letter = args[0]?.trim();

  if (letter === 'בטל') {
    db.update(d => { delete d.hangman[userId]; });
    return client.sendMessage(userId, '🛑 משחק האיש התלוי בוטל.');
  }

  let game = db.get().hangman[userId];

  // התחלת משחק
  if (!game) {
    const word = hangmanWords[Math.floor(Math.random() * hangmanWords.length)];
    game = { word, guessed: [], lives: 6 };
    db.update(d => { d.hangman[userId] = game; });
    const mask = word.split('').map(() => '—').join(' ');
    return client.sendMessage(userId, `🪢 *משחק איש תלוי החל!*\n\nהמילה: ${mask}\nפסילות שנותרו: ❤️ x 6\n\nשלח: \`!תלוי [אות]\` כדי לנחש.`);
  }

  // משחק קיים ללא אות - הצגת המצב הנוכחי (בלי לאפס)
  if (!letter) {
    const mask = game.word.split('').map(c => game.guessed.includes(c) ? c : '—').join(' ');
    return client.sendMessage(userId, `🪢 המילה: ${mask}\nפסילות: ${'❤️'.repeat(game.lives)}\nאותיות: ${game.guessed.join(', ') || 'עדיין לא נוחשו'}\n\nנחש אות: \`!תלוי [אות]\``);
  }

  if (letter.length !== 1) return client.sendMessage(userId, 'שלח אות אחת בלבד.');
  if (game.guessed.includes(letter)) return client.sendMessage(userId, `כבר ניחשת את האות "${letter}".`);

  game.guessed.push(letter);
  if (!game.word.includes(letter)) {
    game.lives--;
  }

  const mask = game.word.split('').map(c => game.guessed.includes(c) ? c : '—').join(' ');

  if (!mask.includes('—')) {
    db.update(d => {
      delete d.hangman[userId];
      d.reputation[userId] = (d.reputation[userId] || 0) + 3;
    });
    return client.sendMessage(userId, `🎉 *כל הכבוד! ניחשת את המילה:* *${game.word}*!\nזכית ב-+3 נקודות מוניטין!`);
  }

  if (game.lives <= 0) {
    db.update(d => { delete d.hangman[userId]; });
    return client.sendMessage(userId, `💀 *נפסלת!* המילה הייתה: *${game.word}*.\nשלח !תלוי להתחלת משחק חדש.`);
  }

  db.update(d => { d.hangman[userId] = game; });
  await client.sendMessage(userId, `🪢 המילה: ${mask}\nפסילות: ${'❤️'.repeat(game.lives)}\nאותיות: ${game.guessed.join(', ')}\n\nנחש אות: \`!תלוי [אות]\``);
};

// מאגר בדיחות וציטוטים
const jokes = [
  'למה מחשבים לא הולכים לים? כי הם מפחדים מגלישה!',
  'למה הספר הלך לרופא? כי היו לו דפים חולים!',
  'מה אומר אפס לשמונה? איזה חגורה יפה יש לך!',
  'למה התרנגול חצה את הכביש? כי הוא רצה להגיע לצד השני!',
  'מה קורה כשפיל דורך על נמלה? היא צועקת: היי, תיזהר!',
  'למה דגים לא משחקים כדורגל? כי הם מפחדים מהרשת!'
];

const quotes = [
  'תעשה את מה שאתה אוהב!',
  'הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו.',
  'אל תחכה להזדמנות - צור אותה.',
  'הצלחה היא סכום של מאמצים קטנים שחוזרים על עצמם יום אחר יום.',
  'הדבר היחיד שעומד בינך לבין המטרה שלך הוא הסיפור שאתה מספר לעצמך.'
];

// מאגר שאלות טריוויה
const triviaBank = [
  { q: 'מהי בירת ישראל?', options: ['ירושלים', 'תל אביב', 'חיפה', 'אילת'], a: 1 },
  { q: 'כמה יבשות יש בעולם?', options: ['5', '6', '7', '8'], a: 3 },
  { q: 'מהו האוקיינוס הגדול בעולם?', options: ['האטלנטי', 'ההודי', 'השקט', 'הארקטי'], a: 3 },
  { q: 'באיזו שנה הוקמה מדינת ישראל?', options: ['1945', '1948', '1950', '1967'], a: 2 },
  { q: 'מהו החג הארוך ביותר בלוח העברי?', options: ['פסח', 'סוכות', 'חנוכה', 'פורים'], a: 2 },
  { q: 'כמה שחקנים יש בקבוצת כדורגל על המגרש?', options: ['9', '10', '11', '12'], a: 3 },
  { q: 'מהי השפה המדוברת ביותר בעולם?', options: ['אנגלית', 'ספרדית', 'הינדי', 'מנדרינית'], a: 4 },
  { q: 'איזה כוכב לכת הוא הקרוב ביותר לשמש?', options: ['נוגה', 'כוכב חמה', 'מאדים', 'צדק'], a: 2 }
];

// חידון אימוג'י
const emojiList = [
  { emojis: '🦁👑', title: 'מלך האריות' },
  { emojis: '🕷️🕸️', title: 'ספיידרמן' },
  { emojis: '🚢🧊💔', title: 'טיטאניק' },
  { emojis: '🧙‍♂️⚡👓', title: 'הארי פוטר' },
  { emojis: '🦇🌃🦸', title: 'באטמן' },
  { emojis: '🦖🌴🚗', title: 'פארק היורה' }
];

module.exports.emojiQuiz = async function(client, msg) {
  const item = emojiList[Math.floor(Math.random() * emojiList.length)];
  db.update(d => {
    d.emojiQuiz[msg.from] = item.title;
  });
  await client.sendMessage(msg.from, `🎬 *חידון אימוג'ים! איזה סרט זה?*\n\n${item.emojis}\n\n_ענה באמצעות: !ניחוש [שם הסרט]_`);
};

module.exports.guessEmoji = async function(client, msg, args) {
  const ans = db.get().emojiQuiz[msg.from];
  if (!ans) return client.sendMessage(msg.from, 'אין חידון פעיל. שלח !חידון כדי להתחיל.');
  const userGuess = args.join(' ').trim();
  if (!userGuess) return client.sendMessage(msg.from, 'נחש שם של סרט: !ניחוש [שם הסרט]');
  if (userGuess.includes(ans) || ans.includes(userGuess)) {
    db.update(d => {
      delete d.emojiQuiz[msg.from];
      d.reputation[msg.from] = (d.reputation[msg.from] || 0) + 3;
    });
    return client.sendMessage(msg.from, `🎉 *בול! התשובה היא אכן "${ans}"!* (+3 נקודות מוניטין)`);
  }
  await client.sendMessage(msg.from, '❌ לא נכון, נסה שוב!');
};

// קרב תורות נגד הבוט
module.exports.battle = async function(client, msg, args) {
  const userId = msg.from;
  const action = args[0]?.toLowerCase();

  if (action === 'בטל') {
    db.update(d => { delete d.battle[userId]; });
    return client.sendMessage(userId, '🛑 הקרב הופסק.');
  }

  let b = db.get().battle[userId];
  if (!b || action === 'התחל') {
    b = { playerHp: 100, botHp: 100 };
    db.update(d => { d.battle[userId] = b; });
    return client.sendMessage(userId, `⚔️ *קרב מול הבוט התחיל!*\n\n👤 אתה: 100/100 HP\n🤖 בוט: 100/100 HP\n\nבחר מהלך:\n▫️ \`!קרב התקפה\` (נזק בטוח)\n▫️ \`!קרב מיוחד\` (נזק גבוה או החטאה)\n▫️ \`!קרב ריפוי\` (+25 חיים)`);
  }

  let log = '';
  if (action === 'התקפה') {
    const dmg = Math.floor(Math.random() * 10) + 15;
    b.botHp -= dmg;
    log += `🗡️ תקפת את הבוט והורדת לו *${dmg}* חיים!\n`;
  } else if (action === 'מיוחד') {
    if (Math.random() < 0.6) {
      const dmg = Math.floor(Math.random() * 20) + 25;
      b.botHp -= dmg;
      log += `💥 התקפה מיוחדת פגעה! הורדת לבוט *${dmg}* חיים!\n`;
    } else {
      log += `💨 ההתקפה המיוחדת החטיאה!\n`;
    }
  } else if (action === 'ריפוי') {
    b.playerHp = Math.min(100, b.playerHp + 25);
    log += `🧪 שתית שיקוי ונרפאת ב-*25* חיים!\n`;
  } else {
    return client.sendMessage(userId, 'בחר: !קרב [התקפה / מיוחד / ריפוי / בטל]');
  }

  if (b.botHp <= 0) {
    db.update(d => {
      delete d.battle[userId];
      d.reputation[userId] = (d.reputation[userId] || 0) + 5;
    });
    return client.sendMessage(userId, `🏆 *ניצחת את הבוט בקרב!* זכית ב-+5 נקודות מוניטין!\n\n${log}`);
  }

  // תור הבוט לתקוף
  const botDmg = Math.floor(Math.random() * 12) + 10;
  b.playerHp -= botDmg;
  log += `🤖 הבוט החזיר מכה והוריד לך *${botDmg}* חיים!`;

  if (b.playerHp <= 0) {
    db.update(d => { delete d.battle[userId]; });
    return client.sendMessage(userId, `💀 *הובסת בקרב!* נסה שוב עם !קרב.\n\n${log}`);
  }

  db.update(d => { d.battle[userId] = b; });
  const status = `\n\n👤 אתה: ${b.playerHp}/100 HP\n🤖 בוט: ${b.botHp}/100 HP\n\nבחר מהלך: \`!קרב התקפה\` | \`!קרב מיוחד\` | \`!קרב ריפוי\``;
  await client.sendMessage(userId, log + status);
};

// --- מרוץ סולמות ונחשים (מרוץ ל-100 מול הבוט) ---
const RACE_LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
const RACE_SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function raceMove(pos, roll) {
  const target = pos + roll;
  if (target > 100) return { pos, events: ['⏸️ עברת את 100 — נשארת במקום (צריך בדיוק 100!)'] };
  let np = target;
  const events = [];
  if (RACE_LADDERS[np]) {
    events.push(`🪜 *סולם!* ${np} ← ${RACE_LADDERS[np]}`);
    np = RACE_LADDERS[np];
  } else if (RACE_SNAKES[np]) {
    events.push(`🐍 *נחש!* ${np} ← ${RACE_SNAKES[np]}`);
    np = RACE_SNAKES[np];
  }
  return { pos: np, events };
}

function raceBar(player, bot) {
  const cells = [];
  for (let i = 0; i < 10; i++) {
    const lo = i * 10, hi = (i + 1) * 10;
    const p = player >= lo && (player < hi || (i === 9 && player === 100));
    const b = bot >= lo && (bot < hi || (i === 9 && bot === 100));
    cells.push(p && b ? '🟣' : p ? '🟢' : b ? '🔴' : '⬜');
  }
  return cells.join('');
}

module.exports.race = async function(client, msg, args) {
  const userId = msg.from;
  if (args[0]?.toLowerCase() === 'בטל') {
    db.update(d => { delete d.race[userId]; });
    return client.sendMessage(userId, '🛑 המרוץ בוטל.');
  }
  db.update(d => { d.race[userId] = { player: 0, bot: 0 }; });
  await client.sendMessage(userId,
`🏁 *מרוץ סולמות ונחשים החל!* 🐍🪜
━━━━━━━━━━━━━━
🟢 אתה נגד 🔴 הבוט — מי שמגיע *בדיוק* ל-100 ראשון מנצח!
סולמות מעלים 🪜 נחשים מורידים 🐍

שלח \`!זרוק\` כדי לזרוק את הקובייה.`);
};

module.exports.raceRoll = async function(client, msg) {
  const userId = msg.from;
  const g = db.get().race[userId];
  if (!g) return client.sendMessage(userId, 'אין מרוץ פעיל. שלח `!מרוץ` כדי להתחיל.');

  const roll = Math.floor(Math.random() * 6) + 1;
  const pm = raceMove(g.player, roll);
  g.player = pm.pos;
  let log = `🎲 זרקת: ${DICE_FACES[roll - 1]} (*${roll}*) → משבצת *${g.player}*`;
  pm.events.forEach(e => { log += '\n' + e; });

  if (g.player === 100) {
    db.update(d => {
      delete d.race[userId];
      d.reputation[userId] = (d.reputation[userId] || 0) + 4;
    });
    return client.sendMessage(userId, `🏆 *ניצחת את המרוץ!* 🎉 (+4 נקודות מוניטין)\n\n${log}`);
  }

  const broll = Math.floor(Math.random() * 6) + 1;
  const bm = raceMove(g.bot, broll);
  g.bot = bm.pos;
  log += `\n\n🤖 הבוט זרק: ${DICE_FACES[broll - 1]} (*${broll}*) → משבצת *${g.bot}*`;
  bm.events.forEach(e => { log += '\n' + e; });

  if (g.bot === 100) {
    db.update(d => { delete d.race[userId]; });
    return client.sendMessage(userId, `🤖 *הבוט ניצח במרוץ!* נסה שוב עם \`!מרוץ\`\n\n${log}`);
  }

  db.update(d => { d.race[userId] = g; });
  await client.sendMessage(userId,
`🏁 *מרוץ סולמות ונחשים* 🐍
━━━━━━━━━━━━━━
${log}
━━━━━━━━━━━━━━
${raceBar(g.player, g.bot)}
🟢 אתה: *${g.player}* | 🔴 בוט: *${g.bot}*

שלח \`!זרוק\` לתור הבא`);
};
