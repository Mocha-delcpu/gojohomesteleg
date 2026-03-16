# Gojo Homes Telegram Bot

A production-ready Telegram bot for the Gojo Homes property marketplace. Built with Node.js, TypeScript, Telegraf, and Supabase.

## Quick Start

### 1. Clone & Install
```bash
cd gojo-telegram-bot
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```env
BOT_TOKEN=your_telegram_bot_token
BOT_USERNAME=your_bot_username
CHANNEL_IDS=@GojoHomes1,@GojoHomes2

# Existing Database Credentials
SUPABASE_URL=your_project_url
ADMIN_IDS=your_telegram_user_id,another_admin_id
```

| Variable | Description |
|---|---|
| `BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) on Telegram |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key (Settings → API) |
| `CHANNEL_IDS` | Comma separated channel usernames list like `@gojohomesproperties,@gojohomes` — the bot must be an **admin** of these channels |
| `ADMIN_IDS` | Comma-separated Telegram user IDs for admin access |

### 3. Set Up Supabase Database
Run the SQL in `supabase-schema.sql` in your Supabase SQL editor:
```
Supabase Dashboard → SQL Editor → paste supabase-schema.sql → Run
```

### 4. Run Locally
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
npm run start:prod
```

---

## Features

| Feature | Command / Action |
|---|---|
| Post a property | `/post` or "📢 Post Property" button |
| Search properties | `/search` or "🔍 Search" button |
| Browse latest | `/latest` or "🆕 Latest Listings" button |
| View agency page | Deep link: `?start=agency_<id>` |
| Share a search | Auto-generated after every search |
| Viral listing share | Auto-shown after every posted listing |

## Admin Commands
> Only works for Telegram IDs listed in `ADMIN_IDS`

| Command | Description |
|---|---|
| `/list_properties` | List the 20 most recent listings |
| `/delete_listing <uuid>` | Delete a listing and remove it from the channel |
| `/verify_agency <agency_id>` | Grant ✔️ Verified badge to an agency |
| `/edit_listing <uuid>` | Instructions for editing (delete + repost) |

## Deep Linking

| URL | Effect |
|---|---|
| `?start=search_bole_5000_15000_apartment` | Opens bot and instantly runs this search |
| `?start=agency_sunrise` | Shows Sunrise agency profile + listings |
| `?start=listing_<uuid>` | Shows a single listing |

## Project Structure
```
src/
├── index.ts              # Bot entry point
├── config/env.ts         # Environment variable loader
├── services/
│   ├── supabase.ts       # Supabase client
│   ├── db.ts             # All database queries
│   └── channel.ts        # Telegram channel publishing
├── commands/
│   ├── start.ts          # /start, /search, /post, /latest + deep link parser
│   └── admin.ts          # Admin-only commands
├── scenes/
│   ├── postProperty.ts   # 9-step wizard for posting a listing
│   ├── searchProperty.ts # 4-step wizard for searching
│   └── index.ts          # Scene registration
├── actions/main.ts       # Inline keyboard button handlers
└── utils/
    ├── formatting.ts     # Listing formatter, link builders
    ├── menus.ts          # Keyboard menu factories
    ├── logger.ts         # Winston logger
    └── types.ts          # Custom MyContext type
```

## Deployment (Cloud Server)
```bash
# Using PM2 (recommended)
npm install -g pm2
npm run build
pm2 start dist/index.js --name gojo-homes-bot
pm2 save
```

Or use any Node.js hosting: **Railway**, **Render**, **Heroku**, **VPS with PM2**.
