const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);
const axios = require('axios');
const db = require('../services/database');

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
  return fmt === 'audio' ? '🎵 קובץ שמע (MP3)' : fmt === 'voice' ? '🎤 הודעה קולית' : '🎬 קליפ וידאו (MP4)';
}

async function downloadAndSendYoutube(client, msg, url, format, title = '') {
  await client.sendMessage(msg.from, `⏳ מוריד ${ytFormatName(format)}${title ? `:\n"${title}"` : ''}\nאנא המתן...`);
  const tempDir = ensureTempDir();
  const stamp = Date.now();
  try {
    let filePath, mime, sendType, caption = null, extraFields = null;
    if (format === 'video') {
      filePath = path.join(tempDir, `ytv_${stamp}.mp4`);
      await execFilePromise('yt-dlp', [
        ...YT_ARGS, ...YT_DL_ARGS, '-f', 'best[ext=mp4]/mp4', '-o', filePath, url, '--max-filesize', '15M'
      ], EXEC_OPTS);
      mime = 'video/mp4'; sendType = 'video'; caption = '🎬 הורד בהצלחה!';
    } else {
      const mp3Path = path.join(tempDir, `yta_${stamp}.mp3`);
      await execFilePromise('yt-dlp', [
        ...YT_ARGS, ...YT_DL_ARGS, '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '128K',
        '-o', mp3Path, url, '--max-filesize', '15M'
      ], EXEC_OPTS);
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
    const errText = /429|Too Many Requests/i.test(e.message || '')
      ? '⏳ יוטיוב חוסם זמנית (יותר מדי בקשות). חכה כמה דקות ונסה שוב.'
      : '❌ שגיאה בהורדה מיוטיוב.';
    await client.sendMessage(msg.from, errText);
  }
}

function ytFormatMenu(video) {
  return `🎵 *${video.title}*\n\nבחר פורמט — שלח:\n` +
    `\`!יוטיוב שמע\` — קובץ MP3\n` +
    `\`!יוטיוב קולי\` — הודעה קולית 🎤\n` +
    `\`!יוטיוב וידאו\` — קליפ MP4`;
}

function ytParseFormat(word) {
  if (word === 'שמע') return 'audio';
  if (word === 'קולי') return 'voice';
  if (word === 'וידאו') return 'video';
  return null;
}

module.exports = {
  // חיתוך מדיה
  async trimMedia(client, msg, args, rawMsg) {
    if (args.length < 2) {
      return client.sendMessage(msg.from, 'שימוש: הגב על שיר או סרטון וכתוב:\n!חתוך [התחלה] [סיום]\nדוגמה: !חתוך 00:10 00:30 או !חתוך 10 30');
    }

    const start = args[0];
    const end = args[1];

    if (!validTimestamp(start) || !validTimestamp(end)) {
      return client.sendMessage(msg.from, '❌ פורמט זמן לא תקין. דוגמה: !חתוך 00:10 00:30');
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
      return client.sendMessage(msg.from, '❌ עליך להגיב (Reply) ישירות על קובץ שמע או סרטון שברצונך לחתוך.');
    }

    try {
      await client.sendMessage(msg.from, `⏳ חותך את הקובץ מ-${start} עד ${end}, אנא המתן...`);
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

      await client.sendMedia(msg.from, type, uploadedId, `✂️ נחתך בהצלחה (${start} - ${end})`);

      try { fs.unlinkSync(inFile); fs.unlinkSync(outFile); } catch {}
    } catch (e) {
      console.error(e);
      await client.sendMessage(msg.from, '❌ שגיאה בחיתוך הקובץ. ודא שציינת זמנים תקינים (למשל: !חתוך 00:10 00:30).');
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

    if (!mediaId) return client.sendMessage(msg.from, '❌ שלח תמונה עם הכיתוב *!סטיקר*, או הגב על תמונה.');

    try {
      await client.sendMessage(msg.from, '⏳ מעבד את הסטיקר...');
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
      await client.sendMessage(msg.from, '❌ שגיאה בהמרת הסטיקר.');
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

    if (!mediaId) return client.sendMessage(msg.from, '❌ הגב עם *!למי* על תמונה או קובץ.');

    try {
      await client.sendMessage(msg.from, '⏳ מכין את הקובץ כמסמך...');
      const meta = await client.getMediaMetadata(mediaId);
      const buffer = await client.downloadMediaBytes(meta.url);
      const filename = `file_${Date.now()}.${ext}`;

      const uploadedId = await client.uploadMedia(buffer, mimeType, filename);
      await client.sendMedia(msg.from, 'document', uploadedId, null, filename);
    } catch (e) {
      await client.sendMessage(msg.from, '❌ שגיאה בהמרת הקובץ למסמך.');
    }
  },

  async youtube(client, msg, args) {
    const raw = args.join(' ').trim();
    const userId = msg.from;
    if (!raw) return client.sendMessage(msg.from, 'שימוש: !יוטיוב [שם שיר או קישור]\nדוגמה: !יוטיוב עומר אדם');

    // קישור ישיר → הורדה מיידית כקובץ שמע (התנהגות קודמת)
    if (/^https?:\/\//i.test(raw)) {
      return downloadAndSendYoutube(client, msg, raw, 'audio');
    }

    const state = getYtState(userId);
    const fmtOnly = raw.match(/^(שמע|קולי|וידאו)$/);
    const numMatch = raw.match(/^(\d{1,2})(?:\s+(שמע|קולי|וידאו))?$/);

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
        return client.sendMessage(msg.from, `בחר מספר בין 1 ל-${state.results.length}.`);
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
    await client.sendMessage(msg.from, `🔎 מחפש "${raw}"...`);
    let results;
    try {
      results = await searchYoutube(raw);
    } catch (e) {
      console.error('[YouTube search error]', e.message);
      return client.sendMessage(msg.from, '❌ שגיאה בחיפוש ביוטיוב.');
    }
    if (!results.length) return client.sendMessage(msg.from, 'לא נמצאו תוצאות, נסה ניסוח אחר.');
    ytSearchState.set(userId, { results, selected: null, ts: Date.now() });
    const list = results.map((v, i) =>
      `${i + 1}. ${v.title}${v.duration && v.duration !== 'NA' ? ` (${v.duration})` : ''}`
    ).join('\n');
    return client.sendMessage(msg.from,
      `🎵 *תוצאות חיפוש:*\n\n${list}\n\nשלח \`!יוטיוב [מספר]\` לבחירה\nדוגמה: \`!יוטיוב 3\` או ישירות \`!יוטיוב 3 קולי\``);
  },

  async downloadVideo(client, msg, args) {
    const url = args[0];
    if (!url || !/^https?:\/\//i.test(url)) return client.sendMessage(msg.from, 'שימוש: !טיקטוק [קישור]');

    await client.sendMessage(msg.from, '⏳ מוריד את הסרטון, רק רגע...');
    const tempDir = ensureTempDir();

    const outFile = path.join(tempDir, `vid_${Date.now()}.mp4`);
    try {
      await execFilePromise('yt-dlp', [
        ...YT_ARGS, ...YT_DL_ARGS, '-f', 'best[ext=mp4]/mp4', '-o', outFile, url, '--max-filesize', '15M'
      ], EXEC_OPTS);
      const videoBuffer = fs.readFileSync(outFile);
      const uploadedId = await client.uploadMedia(videoBuffer, 'video/mp4', 'video.mp4');
      await client.sendMedia(msg.from, 'video', uploadedId, '🎬 הורד בהצלחה!');
      try { fs.unlinkSync(outFile); } catch {}
    } catch (e) {
      await client.sendMessage(msg.from, '❌ שגיאה בהורדת הסרטון.');
    }
  },

  async qrCode(client, msg, args) {
    const text = args.join(' ');
    if (!text) return client.sendMessage(msg.from, 'שימוש: !qr [טקסט או קישור]');
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}`;
      const res = await axios.get(qrUrl, { responseType: 'arraybuffer' });
      const uploadedId = await client.uploadMedia(Buffer.from(res.data), 'image/png', 'qr.png');
      await client.sendMedia(msg.from, 'image', uploadedId, `📱 QR: "${text}"`);
    } catch (e) {
      await client.sendMessage(msg.from, '❌ שגיאה ביצירת קוד QR.');
    }
  },

  async reminder(client, msg, args) {
    if (args.length < 3) return client.sendMessage(msg.from, 'שימוש: !תזכורת [זמן] [דק/שע/ימ] [הודעה]');
    const amount = parseInt(args[0], 10);
    const unit = args[1];
    const text = args.slice(2).join(' ');

    if (!Number.isFinite(amount) || amount <= 0) {
      return client.sendMessage(msg.from, '❌ הזמן חייב להיות מספר חיובי. דוגמה: !תזכורת 10 דק לקנות חלב');
    }
    if (!['דק', 'שע', 'ימ'].some(u => unit.startsWith(u))) {
      return client.sendMessage(msg.from, '❌ יחידת זמן לא תקינה. השתמש ב: דק / שע / ימ');
    }

    let ms = amount * 60 * 1000;
    if (unit.startsWith('שע')) ms = amount * 60 * 60 * 1000;
    if (unit.startsWith('ימ')) ms = amount * 24 * 60 * 60 * 1000;

    const dueTime = Date.now() + ms;
    db.update(d => {
      if (!Array.isArray(d.reminders)) d.reminders = [];
      d.reminders.push({ to: msg.from, text, dueTime });
    });
    await client.sendMessage(msg.from, `✅ נקבעה תזכורת לעוד ${amount} ${unit}.`);
  },

  async shorten(client, msg, args) {
    const url = args[0];
    if (!url) return client.sendMessage(msg.from, 'נא להזין קישור.');
    try {
      const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      await client.sendMessage(msg.from, `🔗 קישור מקוצר: ${res.data}`);
    } catch {
      await client.sendMessage(msg.from, 'שגיאה בקיצור.');
    }
  },

  async link(client, msg, args) {
    const num = (args[0] || '').replace(/[^0-9]/g, '');
    if (!num) return client.sendMessage(msg.from, 'נא להזין מספר.');
    await client.sendMessage(msg.from, `📲 https://wa.me/${num}`);
  },

  async calc(client, msg, args) {
    const expr = args.join('');
    if (!/^[0-9+\-*/.() ]+$/.test(expr)) return client.sendMessage(msg.from, 'ביטוי לא חוקי.');
    try {
      const result = Function(`'use strict'; return (${expr})`)();
      await client.sendMessage(msg.from, `🔢 תוצאה: *${result}*`);
    } catch {
      await client.sendMessage(msg.from, 'שגיאה בחישוב.');
    }
  },

  async search(client, msg, args) {
    const q = args.join(' ');
    if (!q) return client.sendMessage(msg.from, 'הזן ערך.');
    await client.sendMessage(msg.from, `🔍 https://www.google.com/search?q=${encodeURIComponent(q)}`);
  }
};

// פילטרים גרפיים לתמונות
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
    return client.sendMessage(msg.from, 'שימוש: הגב על תמונה עם:\n!פילטר [שחורלבן / נגטיב / טשטוש]');
  }

  let mediaId = rawMsg.image?.id;
  if (!mediaId && rawMsg.context?.id) {
    const quoted = db.get().recentMessages[rawMsg.context.id];
    if (quoted && quoted.mediaId && quoted.type === 'image') {
      mediaId = quoted.mediaId;
    }
  }

  if (!mediaId) return client.sendMessage(msg.from, '❌ עליך להגיב (Reply) על תמונה.');

  try {
    await client.sendMessage(msg.from, '⏳ מפעיל פילטר על התמונה...');
    const meta = await client.getMediaMetadata(mediaId);
    const buffer = await client.downloadMediaBytes(meta.url);

    const tempDir = ensureTempDir();

    const inFile = path.join(tempDir, `flt_in_${Date.now()}.jpg`);
    const outFile = path.join(tempDir, `flt_out_${Date.now()}.jpg`);
    fs.writeFileSync(inFile, buffer);

    await execFilePromise('ffmpeg', ['-y', '-i', inFile, '-vf', filterMap[type], outFile]);

    const outBuffer = fs.readFileSync(outFile);
    const uploadedId = await client.uploadMedia(outBuffer, 'image/jpeg', 'filtered.jpg');
    await client.sendMedia(msg.from, 'image', uploadedId, `✨ פילטר ${type} הופעל בהצלחה!`);

    try { fs.unlinkSync(inFile); fs.unlinkSync(outFile); } catch {}
  } catch (e) {
    console.error(e);
    await client.sendMessage(msg.from, '❌ שגיאה בהפעלת הפילטר.');
  }
};
