<div align="center">

# 🤖 WhatsApp Agent Bot Platform v1

### A modular, advanced and powerful WhatsApp bot built on the official WhatsApp Agent Platform API
_Built and optimized for clean runs on Termux, Linux and Node.js environments_

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![WhatsApp Agent Platform](https://img.shields.io/badge/WhatsApp-Agent%20v1-25D366.svg?style=for-the-badge&logo=whatsapp)](https://api.whatsapp.com/agent/v1)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini%201.5-8E75B2.svg?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-Supported-007808.svg?style=for-the-badge&logo=ffmpeg)](https://ffmpeg.org/)
[![Termux](https://img.shields.io/badge/Termux-Tested-black.svg?style=for-the-badge&logo=android)](https://termux.dev/)

</div>

---

## 🌟 Overview

The project is built according to the WhatsApp Agent Platform v1 API spec. It includes:
* Efficient long-polling with precise offset tracking.
* A built-in message queue that prevents exceeding the rate limit (12 requests per minute).
* A fast local JSON-based database — no heavy SQL servers required.
* A fully modular architecture that makes adding new commands easy.

---

## 🚀 Commands & Features

### 🧠 AI (Google Gemini)
* `!שאל [question]` - Free-form AI chat and Q&A.
* `!סכם` - Summarize long messages and texts (works directly or as a reply).
* `!דמיין [description]` - Generate a detailed professional English prompt for image generators.
* `!תרגם [language] [text]` - Accurate translation into any language.

### 🎬 Media & Downloads
* `!יוטיוב [song]` - Search and download songs from YouTube as playable MP3 files.
* `!טיקטוק [link]` - Download TikTok videos in max quality, no watermark.
* `!אינסטה [link]` - Download Instagram Reels.
* `!חתוך [start] [end]` - Trim a song or video in reply to a message (e.g. `!חתוך 00:10 00:40`).
* `!סטיקר` or `!s` - Turn a photo or short video into a transparent 512x512 WebP sticker.
* `!פילטר [שחורלבן/נגטיב/טשטוש]` - Fast image processing with FFmpeg.
* `!למי` or `!tofile` - Send media as a document to preserve original quality without compression.
* `!qr [text/link]` - High-quality scannable QR code generator.

### 🛠️ Tools & Daily Info
* `!מזגאוויר [city]` - Live weather forecast (temperature, wind and sky conditions).
* `!חדשות` - Top 5 breaking news flashes in Israel (Ynet).
* `!שער` - Current USD, EUR, Bitcoin and Ethereum rates in shekels.
* `!שבת [city]` - Shabbat candle-lighting and havdalah times plus the weekly Torah portion.
* `!רשימה [הוסף/מחק/הצג/נקה]` - Manage a personal shopping or task list, saved persistently.
* `!תזכורת [time] [דק/שע/ימ] [message]` - Personal reminders that survive bot restarts.
* `!בחר [option 1, option 2...]` - Random picker / decision wheel.
* `!קיצור [link]` - Shorten long URLs via TinyURL.
* `!לינק [number]` - Direct WhatsApp chat link without saving the contact.
* `!מחשבון [expression]` - Solve math expressions.
* `!חיפוש [query]` - Direct Google search link.

### 🎮 Games & Community
* `!בלקג'ק` - Blackjack against the bot (`!קלף`, `!עמוד`).
* `!קרב [התקפה/מיוחד/ריפוי]` - Turn-based RPG battle against the bot with an HP bar.
* `!תלוי [letter]` - Interactive Hebrew hangman.
* `!חידון` / `!ניחוש [name]` - Emoji quiz: guess famous movies.
* `!איקסעיגול [1-9]` - Tic-tac-toe against the bot.
* `!טריוויה` / `!תשובה [1-4]` - American-style trivia questions.
* `!קובייה` / `!מטבע` - Roll a dice or flip a coin.
* `!בדיחה` / `!ציטוט` / `!הפוך` - Quick fun.
* `!תודה` - Give a reputation point to another user (reply to their message).
* `!מוניטין` / `!טופ5` - Personal score and leaderboard.

### 👑 System & Admin
* `!תפריט` - Smart control panel split across 5 pages (`!1` to `!5`).
* `!פינג` - Bot response time in ms.
* `!אני` - Show your account details and ID.
* `!ויקיפדיה [term]` - Fetch a Hebrew Wikipedia summary.
* `!שעה` / `!תאריך` - Local Israel time and date.
* `!סטטוס` - Uptime and bot status (owner only).
* `!גרסה` / `!בעלים` - Version and developer info.
* `!שנהמצב [self/authorized/public]` - Change the bot's access level.
* `!הוסףמורשהגלובלי` / `!הסרמורשהגלובלי` / `!רשימהגלובלית` - Manage VIP users.

---

## 📋 Requirements

* Node.js 18+
* FFmpeg (needed for stickers, trimming and filters)
* Python + yt-dlp (needed for song and video downloads)
* Access token from WhatsApp (Settings > Agents > Create an agent > Chat info > API key)
* Free API key from Google AI Studio for Gemini

---

## 🛠️ Install & Run

### 1. Set up the environment on Termux:
```bash
pkg update -y && pkg install git nodejs ffmpeg python -y
pip install yt-dlp
```

### 2. Clone the repo and install dependencies:
```bash
git clone https://github.com/meowguck-art/whatsapp-agent-bot.git
cd whatsapp-agent-bot
npm install
```

### 3. Configure environment variables (.env):
Create a file named `.env` with:
```env
WA_BASE_URL=https://api.whatsapp.com/agent/v1
WA_API_TOKEN=your_whatsapp_agent_token_here
GEMINI_API_KEY=your_gemini_api_key_here
BOT_OWNER_ID=user:YOUR_NUMBER
BOT_MODE=public
POLL_TIMEOUT=15
```

### 4. Start the bot:
```bash
npm start
```

---

## 📁 Project Structure

```text
whatsapp-agent-bot/
├── .env                      # environment variables and secret keys
├── .gitignore                # keep sensitive files out of git
├── package.json              # dependencies and run config
├── data.json                 # local database for groups, games and tasks
└── src/
    ├── index.js              # main entry point + background reminder loop
    ├── config.js             # env config loading
    ├── client/
    │   ├── api.js            # HTTP wrapper with rate-limit queue
    │   └── poller.js         # long-polling and offset tracking
    ├── services/
    │   ├── database.js       # database management
    │   └── gemini.js         # Google Gemini integration
    ├── middlewares/
    │   ├── auth.js           # permissions (Self/Authorized/Public)
    │   └── cooldown.js       # anti-spam and rate limiting
    ├── handlers/
    │   ├── commandHandler.js # command routing
    │   └── messageHandler.js # message intake and history
    └── commands/
        ├── ai.js             # AI commands
        ├── media.js          # stickers, trimming, YouTube, TikTok, QR
        ├── tools.js          # weather, news, rates, tasks
        ├── games.js          # blackjack, battle, hangman, quizzes, trivia
        ├── general.js        # paged menu, Wikipedia, ping, Shabbat times
        └── owner.js          # admin commands
```

---

## ⚙️ WhatsApp Agent Platform Spec Compliance

1. **Rate limiting:**
   The platform caps at 12 requests per minute for messages and statuses. The bot uses an internal queue that spaces sends 5.2 seconds apart, ensuring smooth operation with no 429 errors.

2. **Offset tracking in long polling:**
   The bot stores the `next_offset` from every update request and keeps polling at that offset when it gets a 204 (no content).

3. **Opaque identifiers:**
   Strictly preserves the `user:<id>` and `agent:<id>` identifier formats exactly as received from WhatsApp's servers.

---

## 📄 License

This project is distributed under the MIT license. Free to use, modify and distribute.

---
<div align="center">
  <b>Built with love for the developer community 🚀</b>
</div>
