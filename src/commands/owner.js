const config = require('../config');
const db = require('../services/database');
const { t } = require('../i18n');

function formatUptime(ms) {
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (d > 0) parts.push(t('owner.uptimeDays', { n: d }));
  if (h > 0) parts.push(t('owner.uptimeHours', { n: h }));
  if (m > 0) parts.push(t('owner.uptimeMinutes', { n: m }));
  parts.push(t('owner.uptimeSeconds', { n: s }));
  return parts.join(', ');
}

module.exports = {
  async status(client, msg) {
    const uptime = formatUptime(Date.now() - config.startTime);
    await client.sendMessage(msg.from, t('owner.status', {
      uptime, mode: db.get().mode, owner: config.ownerId || t('owner.notSet')
    }));
  },

  async version(client, msg) {
    await client.sendMessage(msg.from, t('owner.version'));
  },

  async owner(client, msg) {
    await client.sendMessage(msg.from, t('owner.owner', { id: config.ownerId }));
  },

  async setMode(client, msg, args) {
    const m = args[0]?.toLowerCase();
    if (!['self', 'authorized', 'public'].includes(m)) {
      return client.sendMessage(msg.from, t('owner.setMode.usage'));
    }
    db.update(d => { d.mode = m; });
    await client.sendMessage(msg.from, t('owner.setMode.ok', { mode: m }));
  },

  async addAuth(client, msg, args) {
    const u = args[0];
    if (!u || !u.startsWith('user:')) return client.sendMessage(msg.from, t('owner.addAuth.usage'));
    db.update(d => { if (!d.authorizedUsers.includes(u)) d.authorizedUsers.push(u); });
    await client.sendMessage(msg.from, t('owner.addAuth.ok', { user: u }));
  },

  async removeAuth(client, msg, args) {
    const u = args[0];
    db.update(d => { d.authorizedUsers = d.authorizedUsers.filter(x => x !== u); });
    await client.sendMessage(msg.from, t('owner.removeAuth.ok', { user: u }));
  },

  async listAuth(client, msg) {
    const l = db.get().authorizedUsers || [];
    await client.sendMessage(msg.from, t('owner.listAuth', { list: l.join('\n') || t('owner.listAuth.none') }));
  }
};
