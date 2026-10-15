const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');

class WhatsAppClient {
  constructor() {
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: { 'Authorization': `Bearer ${config.apiToken}` },
      timeout: 35000
    });
    this.sendQueue = [];
    this.isProcessing = false;
  }

  async sendRaw(endpoint, method, data, headers = {}) {
    try {
      const response = await this.http({
        url: endpoint,
        method,
        data,
        headers: { ...headers }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error(`[API Error ${error.response.status}]:`, JSON.stringify(error.response.data));
      }
      throw error;
    }
  }

  enqueueSend(task) {
    return new Promise((resolve, reject) => {
      this.sendQueue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.sendQueue.length === 0) return;
    this.isProcessing = true;

    const { task, resolve, reject } = this.sendQueue.shift();
    try {
      const result = await task();
      resolve(result);
    } catch (e) {
      reject(e);
    } finally {
      setTimeout(() => {
        this.isProcessing = false;
        this.processQueue();
      }, 5200);
    }
  }

  sendMessage(to, text, contextMessageId = null) {
    return this.enqueueSend(() => {
      const payload = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text }
      };
      if (contextMessageId) {
        payload.context = { message_id: contextMessageId };
      }
      return this.sendRaw('/messages', 'POST', payload, { 'Content-Type': 'application/json' });
    });
  }

  sendMedia(to, type, mediaId, caption = null, filename = null, extraFields = null) {
    return this.enqueueSend(async () => {
      const payload = {
        messaging_product: "whatsapp",
        to,
        type: type,
        [type]: { id: mediaId, ...(extraFields || {}) }
      };
      if (caption && ['image', 'video', 'document'].includes(type)) {
        payload[type].caption = caption;
      }
      if (filename && type === 'document') {
        payload[type].filename = filename;
      }
      const res = await this.sendRaw('/messages', 'POST', payload, { 'Content-Type': 'application/json' });
      
      // שמירה של ההודעה שנשלחה כדי שאם יצטטו אותה, ה-mediaId יימצא מיד
      if (res?.messages?.[0]?.id) {
        const sentId = res.messages[0].id;
        const db = require('../services/database');
        db.update(d => {
          d.recentMessages[sentId] = {
            mediaId: mediaId,
            type: type,
            from: 'agent'
          };
        });
      }
      return res;
    });
  }

  // הודעה אינטראקטיבית עם כפתורי תשובה — נשלחת ישירות, ללא צורך בתבנית מאושרת
  // (עובד בחלון השירות של 24 שעות; עד 3 כפתורים, כותרת עד 20 תווים)
  sendInteractiveButtons(to, bodyText, buttons, options = {}) {
    return this.enqueueSend(async () => {
      const clean = (buttons || []).slice(0, 3).map(b => ({
        type: 'reply',
        reply: {
          id: String(b.id).slice(0, 256),
          title: String(b.title).slice(0, 20)
        }
      }));
      if (clean.length === 0) throw new Error('sendInteractiveButtons: need at least 1 button');

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: String(bodyText).slice(0, 1024) },
          action: { buttons: clean }
        }
      };
      if (options.header) {
        payload.interactive.header = { type: 'text', text: String(options.header).slice(0, 60) };
      }
      if (options.footer) {
        payload.interactive.footer = { text: String(options.footer).slice(0, 60) };
      }
      if (options.contextMessageId) {
        payload.context = { message_id: options.contextMessageId };
      }

      const res = await this.sendRaw('/messages', 'POST', payload, { 'Content-Type': 'application/json' });
      this.trackSentInteractive(res, to, clean.map(b => b.reply.id));
      return res;
    });
  }

  // כפתור "התקשר בוואטסאפ" (שיחת קול למספר העסק) — סוג Direct Send בלבד.
  // לא ניתן לשלב עם כפתורי תשובה/קישור ולא עם footer. דורש הפעלת שיחות במספר.
  sendVoiceCallButton(to, bodyText, options = {}) {
    return this.enqueueSend(async () => {
      const payload = {
        messaging_product: 'whatsapp',
        to,
        category: 'utility',
        type: 'interactive',
        interactive: {
          type: 'voice_call',
          body: { text: String(bodyText).slice(0, 1024) },
          action: {
            name: 'voice_call',
            parameters: {
              display_text: String(options.displayText || 'התקשר בוואטסאפ').slice(0, 20),
              ttl_minutes: options.ttlMinutes || 10080
            }
          }
        }
      };
      if (options.header) {
        payload.interactive.header = { type: 'text', text: String(options.header).slice(0, 60) };
      }

      const res = await this.sendRaw('/messages', 'POST', payload, { 'Content-Type': 'application/json' });
      this.trackSentInteractive(res, to, ['voice_call']);
      return res;
    });
  }

  trackSentInteractive(res, to, buttonIds) {
    if (res?.messages?.[0]?.id) {
      const sentId = res.messages[0].id;
      const db = require('../services/database');
      db.update(d => {
        d.recentMessages[sentId] = {
          from: 'agent',
          to: to,
          type: 'interactive',
          buttonIds: buttonIds,
          timestamp: String(Math.floor(Date.now() / 1000))
        };
      });
    }
  }

  markAsReadAndTyping(messageId, typing = true) {
    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId
    };
    if (typing) {
      payload.typing_indicator = { type: "text" };
    }
    return this.sendRaw('/statuses', 'POST', payload, { 'Content-Type': 'application/json' }).catch(() => null);
  }

  async getMediaMetadata(mediaId) {
    return this.sendRaw(`/media/${mediaId}`, 'GET');
  }

  async downloadMediaBytes(mediaUrl) {
    const response = await axios.get(mediaUrl, {
      headers: { 'Authorization': `Bearer ${config.apiToken}` },
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  }

  async uploadMedia(buffer, mimeType, filename = 'file') {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    form.append('file', buffer, { filename, contentType: mimeType });
    const res = await this.sendRaw('/media', 'POST', form, form.getHeaders());
    return res.id;
  }
}

module.exports = new WhatsAppClient();
