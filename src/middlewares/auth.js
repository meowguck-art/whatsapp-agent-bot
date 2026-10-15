const db = require('../services/database');
const config = require('../config');

function checkAuth(userId) {
  if (userId === config.ownerId) return { allowed: true, isOwner: true };
  const mode = db.get().mode || 'public';

  if (mode === 'self') {
    return { allowed: false, reason: 'הבוט במצב שימוש עצמי בלבד.' };
  }
  if (mode === 'authorized') {
    const list = db.get().authorizedUsers || [];
    if (!list.includes(userId)) {
      return { allowed: false, reason: 'הבוט פתוח למשתמשים מורשים בלבד.' };
    }
  }
  return { allowed: true, isOwner: false };
}

module.exports = { checkAuth };
