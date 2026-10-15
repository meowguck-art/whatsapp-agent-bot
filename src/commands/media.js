const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);
const axios = require('axios');
const db = require('../services/database');
const { t } = require('../i18n');

// אבטחה: כל הפקודות החיצוניות רצות דרך execFile עם מערך ארגומנטים (ללא shell),
// כך שקלט מהמשתמש לעולם לא יכול להפוך לפקודת shell (מניעת command injection).

function ensureTempDir() {
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

function validTimestamp(s) {
  return /^[\d:.]+$/.test(s || '');
}

// מצב חיפוש יוטיוב: userId -> { results: [{id,title,duration}], selected, ts }
const ytSearchState = new Map();
const YT_TTL = 10 * 60 * 1000;
// עקיפת חסימת הבוט של יוטיוב: שימוש ב-player של אנדרואיד במקום בווב
const YT_ARGS = ['--extractor-args', 'youtube:player_client=android'];
// חוסן הורדות: בלי progress (מונע maxBuffer overflow), retries ו-timeout
const YT_DL_ARGS = ['--no-progress', '--retries', '5', '--socket-timeout', '30', '--fragment-retries', '5'];
const EXEC_OPTS = { maxBuffer: 10 * 1024 * 1024 };

function getYtState(userId) {
  const s = ytSearchState.get(userId);
  if (!s || Date.now() - s.ts > YT_TTL) { ytSearchState.delete(userId); return null; }
  return s;
}

async function searchYoutube(query) {
  const { stdout } = await execFilePromise('yt-dlp', [
    ...YT_ARGS, ...YT_DL_ARGS, '--flat-playlist', '--no-warnings',
    '--print', '%(id)s\t%(title)s\t%(duration_string)s',
    `ytsearch10:${query}`
  ], EXEC_OPTS);
  return stdout.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const [id, title, duration] = line.split('\t');
    return { id, title: title || id, duration: duration || '' };
  }).filter(v => v.id && /^[a-zA-Z0-9_-]{11}$/.test(v.id));
}

function ytFormatName(fmt) {
  return fmt === 'audio' ? t('media.yt.formatAudio') : fmt === 'voice' ? t('media.yt.formatVoice') : t('media.yt.formatVideo');
}

async function downloadAndSendYoutube(client, msg, url, format, title = '') {
  await client.sendMessage(msg.from, t('media.yt.downloading', {
    format: ytFormatName(format), title: title ? `:\n"${title}"` : ''
  }));
  const tempDir = ensureTempDir();
  const stamp = Date.now();
  try {
    let filePath, mime, sendType, caption = null, extraFields = null;
    if (format === 'video') {
      filePath = path.join(tempDir, `ytv_${stamp}.mp4`);
      await execFilePromise('yt-dlp', [
        ...YT_ARGS, ...YT_DL_ARGS, '-f', 'best[ext=mp4]/mp4', '-o', filePath, url, '--max-filesize', '15M'
      ], EXEC_OPTS);
      if (!fs.existsSync(filePath)) throw new Error('NO_FILE: yt-dlp produced no mp4 (over --max-filesize 15M?)');
      mime = 'video/mp4'; sendType = 'video'; caption = t('media.done');
    } else {
      const mp3Path = path.join(tempDir, `yta_${stamp}.mp3`);
      await execFilePromise('yt-dlp', [
        ...YT_ARGS, ...YT_DL_ARGS, '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '128K',
        '-o', mp3Path, url, '--max-filesize', '15M'
      ], EXEC_OPTS);
      if (!fs.existsSync(mp3Path)) throw new Error('NO_FILE: yt-dlp produced no mp3 (over --max-filesize 15M?)');
      if (format === 'voice') {
        filePath = path.join(tempDir, `ytvoice_${stamp}.ogg`);
        await execFilePromise('ffmpeg', ['-y', '-i', mp3Path, '-c:a', 'libopus', '-b:a', '64k', filePath]);
        try { fs.unlinkSync(mp3Path); } catch {}
        mime = 'audio/ogg'; sendType = 'audio'; extraFields = { voice: true };
      } else {
        filePath = mp3Path;
        mime = 'audio/mpeg'; sendType = 'audio';
      }
    }
    const buffer = fs.readFileSync(filePath);
    const filename = format === 'video' ? 'video.mp4' : format === 'voice' ? 'voice.ogg' : 'song.mp3';
    const uploadedId = await client.uploadMedia(buffer, mime, filename);
    await client.sendMedia(msg.from, sendType, uploadedId, caption, null, extraFields);
    try { fs.unlinkSync(filePath); } catch {}
  } catch (e) {
    console.error('[YouTube download error]', e.message);
    const errMsg = e.message || '';
    const errText = /429|Too Many Requests/i.test(errMsg)
      ? t('media.yt.rateLimit')
      : /NO_FILE/.test(errMsg)
        ? t('media.yt.noFile')
        : t('media.yt.error');
    await client.sendMessage(msg.from, errText);
  }
}

function ytFormatMenu(video) {
  return t('media.yt.formatMenu', { title: video.title });
}

function ytParseFormat(word) {
  const w = (word || '').toLowerCase();
  if (w === 'שמע' || w === 'audio') return 'audio';
  if (w === 'קולי' || w === 'voice') return 'voice';
  if (w === 'וידאו' || w === 'video') return 'video';
  return null;
}

module.exports = {
  // חיתוך מדיה
  async trimMedia(client, msg, args, rawMsg) {
    if (args.length < 2) {
      return client.sendMessage(msg.from, t('media.trim.usage'));
    }

    const start = args[0];
    const end = args[1];

    if (!validTimestamp(start) || !validTimestamp(end)) {
      return client.sendMessage(msg.from, t('media.trim.invalidTime'));
    }

    let mediaId = rawMsg.audio?.id || rawMsg.video?.id;
    let type = rawMsg.video ? 'video' : 'audio';

    // בדיקת הודעה מצוטטת
    if (!mediaId && rawMsg.context?.id) {
      const quoted = db.get().recentMessages[rawMsg.context.id];
      if (quoted && quoted.mediaId) {
        mediaId = quoted.mediaId;
        type = quoted.type === 'video' ? 'video' : 'audio';
      }
    }

    if (!mediaId) {
      return client.sendMessage(msg.from, t('media.trim.noMedia'));
    }

    try {
      await client.sendMessage(msg.from, t('media.trim.working', { start, end }));
      const meta = await client.getMediaMetadata(mediaId);
      const buffer = await client.downloadMediaBytes(meta.url);

      const tempDir = ensureTempDir();

      const inExt = type === 'video' ? 'mp4' : 'mp3';
      const inFile = path.join(tempDir, `cut_in_${Date.now()}.${inExt}`);
      const outFile = path.join(tempDir, `cut_out_${Date.now()}.${inExt}`);
      fs.writeFileSync(inFile, buffer);

      // קידוד מחדש כדי להבטיח קובץ תקין ונגן עובד בוואטסאפ
      const ffmpegArgs = type === 'video'
        ? ['-y', '-i', inFile, '-ss', start, '-to', end, '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', outFile]
        : ['-y', '-i', inFile, '-ss', start, '-to', end, '-c:a', 'libmp3lame', '-q:a', '2', outFile];

      await execFilePromise('ffmpeg', ffmpegArgs);

      if (!fs.existsSync(outFile)) {
        throw new Error('הקובץ החתוך לא נוצר');
      }

      const cutBuffer = fs.readFileSync(outFile);
      const mime = type === 'video' ? 'video/mp4' : 'audio/mpeg';
      const uploadedId = await client.uploadMedia(cutBuffer, mime, `cut.${inExt}`);

      await client.sendMedia(msg.from, type, uploadedId, t('media.trim.done', { start, end }));

      try { fs.unlinkSync(inFile); fs.unlinkSync(outFile); } catch {}
    } catch (e) {
      console.error(e);
      await client.sendMessage(msg.from, t('media.trim.error'));
    }
  },

  async sticker(client, msg, args, rawMsg) {
    let mediaId = rawMsg.image?.id || rawMsg.video?.id;
    let isVideo = rawMsg.type === 'video';

    if (!mediaId && rawMsg.context?.id) {
      const quoted = db.get().recentMessages[rawMsg.context.id];
      if (quoted && quoted.mediaId) {
        mediaId = quoted.mediaId;
        isVideo = quoted.type === 'video';
      }
    }

    if (!mediaId) return client.sendMessage(msg.from, t('media.sticker.noMedia'));

    try {
      await client.sendMessage(msg.from, t('media.sticker.working'));
      const meta = await client.getMediaMetadata(mediaId);
      const buffer = await client.downloadMediaBytes(meta.url);
      const tempDir = ensureTempDir();

      const inExt = isVideo ? 'mp4' : 'jpg';
      const inputPath = path.join(tempDir, `in_${Date.now()}.${inExt}`);
      const outputPath = path.join(tempDir, `out_${Date.now()}.webp`);
      fs.writeFileSync(inputPath, buffer);

      const ffmpegArgs = isVideo
        ? ['-y', '-i', inputPath, '-t', '3', '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=12,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba', '-c:v', 'libwebp', '-lossless', '0', '-q:v', '40', '-loop', '0', '-an', outputPath]
        : ['-y', '-i', inputPath, '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba', '-c:v', 'libwebp', '-q:v', '70', outputPath];

      await execFilePromise('ffmpeg', ffmpegArgs);
      const webpBuffer = fs.readFileSync(outputPath);
      const uploadedId = await client.uploadMedia(webpBuffer, 'image/webp', 'sticker.webp');
      await client.sendMedia(msg.from, 'sticker', uploadedId);
      try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch {}
    } catch (e) {
      await client.sendMessage(msg.from, t('media.sticker.error'));
    }
  },

  async tofile(client, msg, args, rawMsg) {
    let mediaId = rawMsg.image?.id || rawMsg.video?.id || rawMsg.audio?.id;
    let mimeType = rawMsg.image ? 'image/jpeg' : rawMsg.video ? 'video/mp4' : 'audio/mp3';
    let ext = rawMsg.image ? 'jpg' : rawMsg.video ? 'mp4' : 'mp3';

    if (!mediaId && rawMsg.context?.id) {
      const quoted = db.get().recentMessages[rawMsg.context.id];
      if (quoted && quoted.mediaId) {
        mediaId = quoted.mediaId;
        ext = quoted.type === 'video' ? 'mp4' : quoted.type === 'audio' ? 'mp3' : 'jpg';
        mimeType = quoted.type === 'video' ? 'video/mp4' : quoted.type === 'audio' ? 'audio/mpeg' : 'image/jpeg';
      }
    }

    if (!mediaId) return client.sendMessage(msg.from, t('media.tofile.noMedia'));

    try {
      await client.sendMessage(msg.from, t('media.tofile.working'));
      const meta = await client.getMediaMetadata(mediaId);
      const buffer = await client.downloadMediaBytes(meta.url);
      const filename = `file_${Date.now()}.${ext}`;

      const uploadedId = await client.uploadMedia(buffer, mimeType, filename);
      await client.sendMedia(msg.from, 'document', uploadedId, null, filename);
    } catch (e) {
      await client.sendMessage(msg.from, t('media.tofile.error'));
    }
  },

  async youtube(client, msg, args) {
    const raw = args.join(' ').trim();
    const userId = msg.from;
    if (!raw) return client.sendMessage(msg.from, t('media.yt.usage'));

    // קישור ישיר → הורדה מיידית כקובץ שמע (התנהגות קודמת)
    if (/^https?:\/\//i.test(raw)) {
      return downloadAndSendYoutube(client, msg, raw, 'audio');
    }

    const state = getYtState(userId);
    const fmtOnly = raw.match(/^(שמע|קולי|וידאו|audio|voice|video)$/i);
    const numMatch = raw.match(/^(\d{1,2})(?:\s+(שמע|קולי|וידאו|audio|voice|video))?$/i);

    // שלב 3: בחירת פורמט אחרי בחירת סרטון
    if (fmtOnly && state && state.selected) {
      const fmt = ytParseFormat(fmtOnly[1]);
      const video = state.selected;
      ytSearchState.delete(userId);
      return downloadAndSendYoutube(client, msg, `https://www.youtube.com/watch?v=${video.id}`, fmt, video.title);
    }

    // שלב 2: בחירת מספר תוצאה (עם פורמט אופציונלי בפקודה אחת)
    if (numMatch && state && state.results.length) {
      const n = parseInt(numMatch[1], 10);
      if (n < 1 || n > state.results.length)
        return client.sendMessage(msg.from, t('media.yt.range', { max: state.results.length }));
      const video = state.results[n - 1];
      if (numMatch[2]) {
        const fmt = ytParseFormat(numMatch[2]);
        ytSearchState.delete(userId);
        return downloadAndSendYoutube(client, msg, `https://www.youtube.com/watch?v=${video.id}`, fmt, video.title);
      }
      state.selected = video;
      state.ts = Date.now();
      return client.sendMessage(msg.from, ytFormatMenu(video));
    }

    // שלב 1: חיפוש חדש → 10 תוצאות ממוספרות
    await client.sendMessage(msg.from, t('media.yt.searching', { q: raw }));
    let results;
    try {
      results = await searchYoutube(raw);
    } catch (e) {
      console.error('[YouTube search error]', e.message);
      return client.sendMessage(msg.from, t('media.yt.searchError'));
    }
    if (!results.length) return client.sendMessage(msg.from, t('media.yt.noResults'));
    ytSearchState.set(userId, { results, selected: null, ts: Date.now() });
    const list = results.map((v, i) =>
      `${i + 1}. ${v.title}${v.duration && v.duration !== 'NA' ? ` (${v.duration})` : ''}`
    ).join('\n');
    return client.sendMessage(msg.from, t('media.yt.results', { list }));
  },

  async downloadVideo(client, msg, args) {
    const url = args[0];
    if (!url || !/^https?:\/\//i.test(url)) return client.sendMessage(msg.from, t('media.video.usage'));

    await client.sendMessage(msg.from, t('media.video.working'));
    const tempDir = ensureTempDir();

    const outFile = path.join(tempDir, `vid_${Date.now()}.mp4`);
    try {
      await execFilePromise('yt-dlp', [
        ...YT_ARGS, ...YT_DL_ARGS, '-f', 'best[ext=mp4]/mp4', '-o', outFile, url, '--max-filesize', '15M'
      ], EXEC_OPTS);
      const videoBuffer = fs.readFileSync(outFile);
      const uploadedId = await client.uploadMedia(videoBuffer, 'video/mp4', 'video.mp4');
      await client.sendMedia(msg.from, 'video', uploadedId, t('media.done'));
      try { fs.unlinkSync(outFile); } catch {}
    } catch (e) {
      await client.sendMessage(msg.from, t('media.video.error'));
    }
  },

  async qrCode(client, msg, args) {
    const text = args.join(' ');
    if (!text) return client.sendMessage(msg.from, t('media.qr.usage'));
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}`;
      const res = await axios.get(qrUrl, { responseType: 'arraybuffer' });
      const uploadedId = await client.uploadMedia(Buffer.from(res.data), 'image/png', 'qr.png');
      await client.sendMedia(msg.from, 'image', uploadedId, t('media.qr.caption', { text }));
    } catch (e) {
      await client.sendMessage(msg.from, t('media.qr.error'));
    }
  },

  async reminder(client, msg, args) {
    if (args.length < 3) return client.sendMessage(msg.from, t('media.reminder.usage'));
    const amount = parseInt(args[0], 10);
    const unit = args[1];
    const text = args.slice(2).join(' ');

    if (!Number.isFinite(amount) || amount <= 0) {
      return client.sendMessage(msg.from, t('media.reminder.badAmount'));
    }
    if (!['דק', 'שע', 'ימ', 'm', 'h', 'd'].some(u => unit.startsWith(u))) {
      return client.sendMessage(msg.from, t('media.reminder.badUnit'));
    }

    let ms = amount * 60 * 1000;
    if (unit.startsWith('שע') || unit.startsWith('h')) ms = amount * 60 * 60 * 1000;
    if (unit.startsWith('ימ') || unit.startsWith('d')) ms = amount * 24 * 60 * 60 * 1000;

    const dueTime = Date.now() + ms;
    db.update(d => {
      if (!Array.isArray(d.reminders)) d.reminders = [];
      d.reminders.push({ to: msg.from, text, dueTime });
    });
    await client.sendMessage(msg.from, t('media.reminder.set', { amount, unit }));
  },

  async shorten(client, msg, args) {
    const url = args[0];
    if (!url) return client.sendMessage(msg.from, t('media.shorten.usage'));
    try {
      const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      await client.sendMessage(msg.from, t('media.shorten.ok', { url: res.data }));
    } catch {
      await client.sendMessage(msg.from, t('media.shorten.error'));
    }
  },

  async link(client, msg, args) {
    const num = (args[0] || '').replace(/[^0-9]/g, '');
    if (!num) return client.sendMessage(msg.from, t('media.link.usage'));
    await client.sendMessage(msg.from, `📲 https://wa.me/${num}`);
  },

  async calc(client, msg, args) {
    const expr = args.join('');
    if (!/^[0-9+\-*/.() ]+$/.test(expr)) return client.sendMessage(msg.from, t('media.calc.invalid'));
    try {
      const result = Function(`'use strict'; return (${expr})`)();
      await client.sendMessage(msg.from, t('media.calc.result', { result }));
    } catch {
      await client.sendMessage(msg.from, t('media.calc.error'));
    }
  },

  async search(client, msg, args) {
    const q = args.join(' ');
    if (!q) return client.sendMessage(msg.from, t('media.search.usage'));
    await client.sendMessage(msg.from, `🔍 https://www.google.com/search?q=${encodeURIComponent(q)}`);
  }
};

// פילטרים גרפיים לתמונות / image filters
module.exports.filter = async function(client, msg, args, rawMsg) {
  const type = args[0]?.toLowerCase();
  const filterMap = {
    'שחורלבן': 'hue=s=0',
    'bw': 'hue=s=0',
    'נגטיב': 'negate',
    'negative': 'negate',
    'טשטוש': 'gblur=sigma=15',
    'blur': 'gblur=sigma=15'
  };

  if (!filterMap[type]) {
    return client.sendMessage(msg.from, t('media.filter.usage'));
  }

  let mediaId = rawMsg.image?.id;
  if (!mediaId && rawMsg.context?.id) {
    const quoted = db.get().recentMessages[rawMsg.context.id];
    if (quoted && quoted.mediaId && quoted.type === 'image') {
      mediaId = quoted.mediaId;
    }
  }

  if (!mediaId) return client.sendMessage(msg.from, t('media.filter.noMedia'));

  try {
    await client.sendMessage(msg.from, t('media.filter.working'));
    const meta = await client.getMediaMetadata(mediaId);
    const buffer = await client.downloadMediaBytes(meta.url);

    const tempDir = ensureTempDir();

    const inFile = path.join(tempDir, `flt_in_${Date.now()}.jpg`);
    const outFile = path.join(tempDir, `flt_out_${Date.now()}.jpg`);
    fs.writeFileSync(inFile, buffer);

    await execFilePromise('ffmpeg', ['-y', '-i', inFile, '-vf', filterMap[type], outFile]);

    const outBuffer = fs.readFileSync(outFile);
    const uploadedId = await client.uploadMedia(outBuffer, 'image/jpeg', 'filtered.jpg');
    await client.sendMedia(msg.from, 'image', uploadedId, t('media.filter.done', { type }));

    try { fs.unlinkSync(inFile); fs.unlinkSync(outFile); } catch {}
  } catch (e) {
    console.error(e);
    await client.sendMessage(msg.from, t('media.filter.error'));
  }
};
