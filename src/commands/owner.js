const config = require('../config');
const db = require('../services/database');

function formatUptime(ms) {
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (d > 0) parts.push(`${d} ימים`);
  if (h > 0) parts.push(`${h} שעות`);
  if (m > 0) parts.push(`${m} דקות`);
  parts.push(`${s} שניות`);
  return parts.join(', ');
}

module.exports = {
  async status(client, msg) {
    const uptime = formatUptime(Date.now() - config.startTime);
    await client.sendMessage(msg.from, `🤖 *סטטוס:*\nזמן ריצה: ${uptime}\nמצב: ${db.get().mode}\nבעלים: ${config.ownerId || 'לא הוגדר'}`);
  },

  async version(client, msg) {
    await client.sendMessage(msg.from, '⚙️ גרסה 1.0.0 (WhatsApp Agent Platform v1 - 2026)');
  },

  async owner(client, msg) {
    await client.sendMessage(msg.from, `👑 בעלים: ${config.ownerId}`);
  },

  async setMode(client, msg, args) {
    const m = args[0]?.toLowerCase();
    if (!['self', 'authorized', 'public'].includes(m)) {
      return client.sendMessage(msg.from, 'שימוש: !שנהמצב [self/authorized/public]');
    }
    db.update(d => { d.mode = m; });
    await client.sendMessage(msg.from, `🔒 מצב הבוט שונה ל: *${m}*`);
  },

  async addAuth(client, msg, args) {
    const u = args[0];
    if (!u || !u.startsWith('user:')) return client.sendMessage(msg.from, 'שימוש: !הוסףמורשהגלובלי user:<id>');
    db.update(d => { if (!d.authorizedUsers.includes(u)) d.authorizedUsers.push(u); });
    await client.sendMessage(msg.from, `✅ ${u} נוסף למורשים.`);
  },

  async removeAuth(client, msg, args) {
    const u = args[0];
    db.update(d => { d.authorizedUsers = d.authorizedUsers.filter(x => x !== u); });
    await client.sendMessage(msg.from, `❌ ${u} הוסר מהמורשים.`);
  },

  async listAuth(client, msg) {
    const l = db.get().authorizedUsers || [];
    await client.sendMessage(msg.from, `📋 מורשים:\n${l.join('\n') || 'אין מורשים'}`);
  }
};
