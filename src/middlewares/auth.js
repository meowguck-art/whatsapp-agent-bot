const db = require('../services/database');
const config = require('../config');
const { t } = require('../i18n');

function checkAuth(userId) {
  if (userId === config.ownerId) return { allowed: true, isOwner: true };
  const mode = db.get().mode || 'public';

  if (mode === 'self') {
    return { allowed: false, reason: t('auth.selfOnly') };
  }
  if (mode === 'authorized') {
    const list = db.get().authorizedUsers || [];
    if (!list.includes(userId)) {
      return { allowed: false, reason: t('auth.authorizedOnly') };
    }
  }
  return { allowed: true, isOwner: false };
}

module.exports = { checkAuth };
