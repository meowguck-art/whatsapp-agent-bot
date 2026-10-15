const db = require('../services/database');
const { t, pick } = require('../i18n');

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
  return `[ ${hand.map(c => c.str).join(' | ')} ] ${t('games.handTotal', { total: calculateHand(hand) })}`;
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
    text += t('games.tictactoe.win', { points: 3 });
    db.update(d => {
      delete d.tictactoe[userId];
      d.reputation[userId] = (d.reputation[userId] || 0) + 3;
    });
  } else if (winner === 'O') {
    text += t('games.tictactoe.lose');
    db.update(d => { delete d.tictactoe[userId]; });
  } else {
    text += t('games.tictactoe.draw');
    db.update(d => { delete d.tictactoe[userId]; });
  }
  await client.sendMessage(userId, text);
}

module.exports = {
  // בלקג'ק - התחלת משחק
  async blackjack(client, msg, args) {
    const userId = msg.from;
    const sub = args[0]?.toLowerCase();

    if (sub === 'בטל' || sub === 'cancel') {
      db.update(d => { delete d.blackjack[userId]; });
      return client.sendMessage(userId, t('games.blackjack.cancel'));
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
      return client.sendMessage(userId, t('games.blackjack.natural', {
        player: formatHand(playerHand), bot: formatHand(dealerHand), points: 5
      }));
    }

    db.update(d => { d.blackjack[userId] = game; });

    const text = t('games.blackjack.start', {
      player: formatHand(playerHand), bot: formatHand(dealerHand, true)
    });

    await client.sendMessage(userId, text);
  },

  // לקיחת קלף נוסף
  async blackjackHit(client, msg) {
    const userId = msg.from;
    const game = db.get().blackjack[userId];
    if (!game) return client.sendMessage(userId, t('games.blackjack.noGame'));

    game.playerHand.push(drawCard());
    const pScore = calculateHand(game.playerHand);

    if (pScore > 21) {
      db.update(d => { delete d.blackjack[userId]; });
      return client.sendMessage(userId, t('games.blackjack.bust', { hand: formatHand(game.playerHand) }));
    }

    db.update(d => { d.blackjack[userId] = game; });
    await client.sendMessage(userId, t('games.blackjack.hit', { hand: formatHand(game.playerHand) }));
  },

  // עצירה ותור הבוט
  async blackjackStand(client, msg) {
    const userId = msg.from;
    const game = db.get().blackjack[userId];
    if (!game) return client.sendMessage(userId, t('games.blackjack.noGame'));

    const pScore = calculateHand(game.playerHand);

    // הבוט מושך קלפים עד שמגיע ל-17 לפחות
    while (calculateHand(game.dealerHand) < 17) {
      game.dealerHand.push(drawCard());
    }

    const dScore = calculateHand(game.dealerHand);
    let result = '';

    if (dScore > 21) {
      result = t('games.blackjack.dealerBust', { points: 3 });
      db.update(d => { d.reputation[userId] = (d.reputation[userId] || 0) + 3; });
    } else if (pScore > dScore) {
      result = t('games.blackjack.win', { points: 3 });
      db.update(d => { d.reputation[userId] = (d.reputation[userId] || 0) + 3; });
    } else if (pScore < dScore) {
      result = t('games.blackjack.lose');
    } else {
      result = t('games.blackjack.push');
    }

    db.update(d => { delete d.blackjack[userId]; });

    const text = t('games.blackjack.result', {
      player: formatHand(game.playerHand), bot: formatHand(game.dealerHand), result
    });

    await client.sendMessage(userId, text);
  },

  async tictactoe(client, msg, args) {
    const userId = msg.from;
    const sub = args[0]?.toLowerCase();
    if (sub === 'בטל' || sub === 'cancel') {
      db.update(d => { delete d.tictactoe[userId]; });
      return client.sendMessage(userId, t('games.tictactoe.cancel'));
    }

    let game = db.get().tictactoe[userId];
    if (!game || sub === 'התחל' || sub === 'start') {
      game = { board: Array(9).fill(' '), active: true };
      db.update(d => { d.tictactoe[userId] = game; });
      return client.sendMessage(userId, t('games.tictactoe.start', { board: renderBoard(game.board) }));
    }

    const pos = parseInt(sub, 10);
    if (!Number.isInteger(pos) || pos < 1 || pos > 9) {
      return client.sendMessage(userId, t('games.tictactoe.invalid', { board: renderBoard(game.board) }));
    }
    const idx = pos - 1;
    if (game.board[idx] !== ' ') {
      return client.sendMessage(userId, t('games.tictactoe.taken', { pos, board: renderBoard(game.board) }));
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
    await client.sendMessage(userId, t('games.tictactoe.turn', { board: renderBoard(game.board) }));
  },

  async trivia(client, msg) {
    const bank = pick(triviaBank, triviaBankEn);
    const q = bank[Math.floor(Math.random() * bank.length)];
    db.update(d => { d.trivia[msg.from] = q.a; });
    const opts = q.options.map((o, i) => `${i + 1}. ${o}`).join('\n');
    await client.sendMessage(msg.from, t('games.trivia.question', { q: q.q, opts }));
  },
  async answer(client, msg, args) {
    const correct = db.get().trivia[msg.from];
    if (!correct) return client.sendMessage(msg.from, t('games.trivia.noActive'));
    const guess = parseInt(args[0], 10);
    if (guess === correct) {
      db.update(d => {
        delete d.trivia[msg.from];
        d.reputation[msg.from] = (d.reputation[msg.from] || 0) + 2;
      });
      return client.sendMessage(msg.from, t('games.trivia.correct', { points: 2 }));
    }
    await client.sendMessage(msg.from, t('games.trivia.wrong'));
  },
  async dice(client, msg) { await client.sendMessage(msg.from, t('games.dice', { n: Math.floor(Math.random() * 6) + 1 })); },
  async coin(client, msg) { await client.sendMessage(msg.from, t('games.coin.result', { side: Math.random() < 0.5 ? t('games.coin.heads') : t('games.coin.tails') })); },
  async joke(client, msg) {
    const bank = pick(jokes, jokesEn);
    await client.sendMessage(msg.from, t('games.joke.format', { text: bank[Math.floor(Math.random() * bank.length)] }));
  },
  async quote(client, msg) {
    const bank = pick(quotes, quotesEn);
    await client.sendMessage(msg.from, t('games.quote.format', { text: bank[Math.floor(Math.random() * bank.length)] }));
  },
  async reverse(client, msg, args) { await client.sendMessage(msg.from, args.join(' ').split('').reverse().join('')); },
  async thanks(client, msg, args, rawMsg) {
    const quotedId = rawMsg.context?.id;
    const quoted = quotedId ? db.get().recentMessages[quotedId] : null;
    if (!quoted || !quoted.from) {
      return client.sendMessage(msg.from, t('games.thanks.usage'));
    }
    if (quoted.from === msg.from) {
      return client.sendMessage(msg.from, t('games.thanks.self'));
    }
    db.update(d => { d.reputation[quoted.from] = (d.reputation[quoted.from] || 0) + 1; });
    await client.sendMessage(msg.from, t('games.thanks.ok'));
  },
  async reputation(client, msg) { await client.sendMessage(msg.from, t('games.reputation', { score: db.get().reputation[msg.from] || 0 })); },
  async top5(client, msg) {
    const rep = db.get().reputation || {};
    const sorted = Object.entries(rep).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length === 0) return client.sendMessage(msg.from, t('games.top5.empty'));
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    let text = t('games.top5.title');
    sorted.forEach(([user, score], i) => {
      const you = user === msg.from ? t('games.top5.you') : '';
      text += t('games.top5.row', { medal: medals[i], score, you });
    });
    await client.sendMessage(msg.from, text.trim());
  }
};

const hangmanWords = ['מחשב', 'ישראל', 'מוזיקה', 'שוקולד', 'טלפון', 'אינטרנט', 'חלל', 'חופשה', 'אופניים', 'גלידה', 'פיצה'];
const hangmanWordsEn = ['computer', 'israel', 'music', 'chocolate', 'phone', 'internet', 'space', 'vacation', 'bicycle', 'icecream', 'pizza'];

// משחק איש תלוי / hangman
module.exports.hangman = async function(client, msg, args) {
  const userId = msg.from;
  const letter = args[0]?.trim();

  if (letter === 'בטל' || letter.toLowerCase() === 'cancel') {
    db.update(d => { delete d.hangman[userId]; });
    return client.sendMessage(userId, t('games.hangman.cancel'));
  }

  let game = db.get().hangman[userId];

  // התחלת משחק / start
  if (!game) {
    const words = pick(hangmanWords, hangmanWordsEn);
    const word = words[Math.floor(Math.random() * words.length)];
    game = { word, guessed: [], lives: 6 };
    db.update(d => { d.hangman[userId] = game; });
    const mask = word.split('').map(() => '—').join(' ');
    return client.sendMessage(userId, t('games.hangman.start', { mask }));
  }

  // משחק קיים ללא אות - הצגת המצב הנוכחי (בלי לאפס)
  if (!letter) {
    const mask = game.word.split('').map(c => game.guessed.includes(c) ? c : '—').join(' ');
    return client.sendMessage(userId, t('games.hangman.status', {
      mask, lives: '❤️'.repeat(game.lives), letters: game.guessed.join(', ') || t('games.hangman.noLetters')
    }));
  }

  if (letter.length !== 1) return client.sendMessage(userId, t('games.hangman.oneLetter'));
  if (game.guessed.includes(letter)) return client.sendMessage(userId, t('games.hangman.already', { letter }));

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
    return client.sendMessage(userId, t('games.hangman.win', { word: game.word, points: 3 }));
  }

  if (game.lives <= 0) {
    db.update(d => { delete d.hangman[userId]; });
    return client.sendMessage(userId, t('games.hangman.lose', { word: game.word }));
  }

  db.update(d => { d.hangman[userId] = game; });
  await client.sendMessage(userId, t('games.hangman.status', {
    mask, lives: '❤️'.repeat(game.lives), letters: game.guessed.join(', ')
  }));
};

// מאגר בדיחות וציטוטים / jokes & quotes banks
const jokes = [
  'למה מחשבים לא הולכים לים? כי הם מפחדים מגלישה!',
  'למה הספר הלך לרופא? כי היו לו דפים חולים!',
  'מה אומר אפס לשמונה? איזה חגורה יפה יש לך!',
  'למה התרנגול חצה את הכביש? כי הוא רצה להגיע לצד השני!',
  'מה קורה כשפיל דורך על נמלה? היא צועקת: היי, תיזהר!',
  'למה דגים לא משחקים כדורגל? כי הם מפחדים מהרשת!'
];

const jokesEn = [
  'Why don\'t computers go to the beach? They\'re afraid of surfing the net!',
  'Why did the book go to the doctor? It had sick pages!',
  'What does zero say to eight? Nice belt you\'ve got there!',
  'Why did the chicken cross the road? To get to the other side!',
  'What happens when an elephant steps on an ant? It yells: hey, watch out!',
  'Why don\'t fish play soccer? They\'re afraid of the net!'
];

const quotes = [
  'תעשה את מה שאתה אוהב!',
  'הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו.',
  'אל תחכה להזדמנות - צור אותה.',
  'הצלחה היא סכום של מאמצים קטנים שחוזרים על עצמם יום אחר יום.',
  'הדבר היחיד שעומד בינך לבין המטרה שלך הוא הסיפור שאתה מספר לעצמך.'
];

const quotesEn = [
  'Do what you love!',
  'The best way to predict the future is to create it.',
  'Don\'t wait for opportunity — create it.',
  'Success is the sum of small efforts repeated day after day.',
  'The only thing standing between you and your goal is the story you tell yourself.'
];

// מאגר שאלות טריוויה / trivia question bank
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

const triviaBankEn = [
  { q: 'What is the capital of Israel?', options: ['Jerusalem', 'Tel Aviv', 'Haifa', 'Eilat'], a: 1 },
  { q: 'How many continents are there?', options: ['5', '6', '7', '8'], a: 3 },
  { q: 'What is the largest ocean in the world?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], a: 3 },
  { q: 'In what year was the State of Israel founded?', options: ['1945', '1948', '1950', '1967'], a: 2 },
  { q: 'How many players does a soccer team field?', options: ['9', '10', '11', '12'], a: 3 },
  { q: 'What is the most spoken language in the world?', options: ['English', 'Spanish', 'Hindi', 'Mandarin'], a: 4 },
  { q: 'Which planet is closest to the sun?', options: ['Venus', 'Mercury', 'Mars', 'Jupiter'], a: 2 },
  { q: 'How many days are in a leap year?', options: ['364', '365', '366', '367'], a: 3 }
];

// חידון אימוג'י / emoji quiz bank
const emojiList = [
  { emojis: '🦁👑', title: 'מלך האריות' },
  { emojis: '🕷️🕸️', title: 'ספיידרמן' },
  { emojis: '🚢🧊💔', title: 'טיטאניק' },
  { emojis: '🧙‍♂️⚡👓', title: 'הארי פוטר' },
  { emojis: '🦇🌃🦸', title: 'באטמן' },
  { emojis: '🦖🌴🚗', title: 'פארק היורה' }
];

const emojiListEn = [
  { emojis: '🦁👑', title: 'The Lion King' },
  { emojis: '🕷️🕸️', title: 'Spider-Man' },
  { emojis: '🚢🧊💔', title: 'Titanic' },
  { emojis: '🧙‍♂️⚡👓', title: 'Harry Potter' },
  { emojis: '🦇🌃🦸', title: 'Batman' },
  { emojis: '🦖🌴🚗', title: 'Jurassic Park' }
];

module.exports.emojiQuiz = async function(client, msg) {
  const bank = pick(emojiList, emojiListEn);
  const item = bank[Math.floor(Math.random() * bank.length)];
  db.update(d => {
    d.emojiQuiz[msg.from] = item.title;
  });
  await client.sendMessage(msg.from, t('games.emoji.prompt', { emojis: item.emojis }));
};

module.exports.guessEmoji = async function(client, msg, args) {
  const ans = db.get().emojiQuiz[msg.from];
  if (!ans) return client.sendMessage(msg.from, t('games.emoji.noActive'));
  const userGuess = args.join(' ').trim();
  if (!userGuess) return client.sendMessage(msg.from, t('games.emoji.noGuess'));
  if (userGuess.includes(ans) || ans.includes(userGuess)) {
    db.update(d => {
      delete d.emojiQuiz[msg.from];
      d.reputation[msg.from] = (d.reputation[msg.from] || 0) + 3;
    });
    return client.sendMessage(msg.from, t('games.emoji.correct', { ans, points: 3 }));
  }
  await client.sendMessage(msg.from, t('games.emoji.wrong'));
};

// קרב תורות נגד הבוט / turn-based battle vs the bot
module.exports.battle = async function(client, msg, args) {
  const userId = msg.from;
  const action = args[0]?.toLowerCase();

  if (action === 'בטל' || action === 'cancel') {
    db.update(d => { delete d.battle[userId]; });
    return client.sendMessage(userId, t('games.battle.cancel'));
  }

  let b = db.get().battle[userId];
  if (!b || action === 'התחל') {
    b = { playerHp: 100, botHp: 100 };
    db.update(d => { d.battle[userId] = b; });
    return client.sendMessage(userId, t('games.battle.start'));
  }

  let log = '';
  if (action === 'התקפה' || action === 'attack') {
    const dmg = Math.floor(Math.random() * 10) + 15;
    b.botHp -= dmg;
    log += t('games.battle.attackLog', { dmg });
  } else if (action === 'מיוחד' || action === 'special') {
    if (Math.random() < 0.6) {
      const dmg = Math.floor(Math.random() * 20) + 25;
      b.botHp -= dmg;
      log += t('games.battle.specialHit', { dmg });
    } else {
      log += t('games.battle.specialMiss');
    }
  } else if (action === 'ריפוי' || action === 'heal') {
    b.playerHp = Math.min(100, b.playerHp + 25);
    log += t('games.battle.heal', { amount: 25 });
  } else {
    return client.sendMessage(userId, t('games.battle.invalid'));
  }

  if (b.botHp <= 0) {
    db.update(d => {
      delete d.battle[userId];
      d.reputation[userId] = (d.reputation[userId] || 0) + 5;
    });
    return client.sendMessage(userId, t('games.battle.win', { points: 5, log }));
  }

  // תור הבוט לתקוף
  const botDmg = Math.floor(Math.random() * 12) + 10;
  b.playerHp -= botDmg;
  log += t('games.battle.counter', { dmg: botDmg });

  if (b.playerHp <= 0) {
    db.update(d => { delete d.battle[userId]; });
    return client.sendMessage(userId, t('games.battle.lose', { log }));
  }

  db.update(d => { d.battle[userId] = b; });
  const status = t('games.battle.status', { php: b.playerHp, bhp: b.botHp });
  await client.sendMessage(userId, log + status);
};

// --- מרוץ סולמות ונחשים (מרוץ ל-100 מול הבוט) ---
const RACE_LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
const RACE_SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function raceMove(pos, roll) {
  const target = pos + roll;
  if (target > 100) return { pos, events: [t('games.race.overshoot')] };
  let np = target;
  const events = [];
  if (RACE_LADDERS[np]) {
    events.push(t('games.race.ladder', { from: np, to: RACE_LADDERS[np] }));
    np = RACE_LADDERS[np];
  } else if (RACE_SNAKES[np]) {
    events.push(t('games.race.snake', { from: np, to: RACE_SNAKES[np] }));
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
  if (['בטל', 'cancel'].includes(args[0]?.toLowerCase())) {
    db.update(d => { delete d.race[userId]; });
    return client.sendMessage(userId, t('games.race.cancel'));
  }
  db.update(d => { d.race[userId] = { player: 0, bot: 0 }; });
  await client.sendMessage(userId, t('games.race.start'));
};

module.exports.raceRoll = async function(client, msg) {
  const userId = msg.from;
  const g = db.get().race[userId];
  if (!g) return client.sendMessage(userId, t('games.race.noRace'));

  const roll = Math.floor(Math.random() * 6) + 1;
  const pm = raceMove(g.player, roll);
  g.player = pm.pos;
  let log = t('games.race.roll', { face: DICE_FACES[roll - 1], roll, pos: g.player });
  pm.events.forEach(e => { log += '\n' + e; });

  if (g.player === 100) {
    db.update(d => {
      delete d.race[userId];
      d.reputation[userId] = (d.reputation[userId] || 0) + 4;
    });
    return client.sendMessage(userId, t('games.race.win', { points: 4, log }));
  }

  const broll = Math.floor(Math.random() * 6) + 1;
  const bm = raceMove(g.bot, broll);
  g.bot = bm.pos;
  log += '\n\n' + t('games.race.botRoll', { face: DICE_FACES[broll - 1], roll: broll, pos: g.bot });
  bm.events.forEach(e => { log += '\n' + e; });

  if (g.bot === 100) {
    db.update(d => { delete d.race[userId]; });
    return client.sendMessage(userId, t('games.race.botWin', { log }));
  }

  db.update(d => { d.race[userId] = g; });
  await client.sendMessage(userId, t('games.race.board', {
    log, bar: raceBar(g.player, g.bot), player: g.player, bot: g.bot
  }));
};
