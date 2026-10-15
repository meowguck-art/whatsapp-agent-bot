const config = require('../config');
const cooldowns = new Map();

function checkCooldown(userId) {
  if (userId === config.ownerId) return true;
  const now = Date.now();
  const lastTime = cooldowns.get(userId) || 0;
  if (now - lastTime < 5000) return false;
  cooldowns.set(userId, now);
  return true;
}

module.exports = { checkCooldown };
