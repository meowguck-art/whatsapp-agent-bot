const fs = require('fs');
const path = require('path');
const config = require('../config');

const DB_FILE = path.join(__dirname, '../../data.json');

const defaultData = {
  mode: config.defaultMode || 'public',
  reputation: {},
  authorizedUsers: [],
  recentMessages: {},
  reminders: [],
  tictactoe: {},
  trivia: {},
  blackjack: {},
  todos: {},
  hangman: {},
  emojiQuiz: {},
  battle: {},
  race: {}
};

function freshData() {
  return JSON.parse(JSON.stringify(defaultData));
}

function load() {
  if (!fs.existsSync(DB_FILE)) {
    const data = freshData();
    save(data);
    return data;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    return {
      ...freshData(),
      ...parsed,
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      tictactoe: parsed.tictactoe || {},
      trivia: parsed.trivia || {},
      blackjack: parsed.blackjack || {},
      todos: parsed.todos || {},
      hangman: parsed.hangman || {},
      emojiQuiz: parsed.emojiQuiz || {},
      battle: parsed.battle || {},
      race: parsed.race || {},
      reputation: parsed.reputation || {},
      recentMessages: parsed.recentMessages || {},
      authorizedUsers: Array.isArray(parsed.authorizedUsers) ? parsed.authorizedUsers : []
    };
  } catch (e) {
    return freshData();
  }
}

function save(data) {
  // כתיבה אטומית: קודם לקובץ זמני ואז החלפה, כדי לא להשחית את ה-DB בקריסה
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

module.exports = {
  get: () => load(),
  update: (fn) => {
    const current = load();
    fn(current);
    save(current);
  }
};
