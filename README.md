# WhatsApp Bot

WhatsApp automation bot with web dashboard. Built with Next.js frontend and Express backend using whatsapp-web.js.

## Overview

This project splits the original bot into two services:
- **Backend** (port 4000): WhatsApp bot with Express API
- **Frontend** (port 3000): Next.js dashboard for monitoring and control

Both services are deployed separately on Railway from the same repo.

## What Changed from Original bot.js

### Added Files/Folders
- `app/` - Next.js frontend application
- `components/` - React UI components
- `backend/bot.js` - Modified version of original bot with API endpoints
- `backend/replies.js` - Extracted reply logic (same as original)
- `backend/nixpacks.toml` - Railway deployment config for Chromium support

### Key Modifications to bot.js

**DO NOT MODIFY THESE SECTIONS:**

1. **Express API Server (lines ~50-150)**
   - Endpoints for frontend communication
   - `/api/status` - Bot status and QR code
   - `/api/messages` - Last 10 messages
   - `/api/send` - Manual message sending
   - `/api/logout` - Session reset
   - Port 4000 with CORS enabled

2. **Data Storage Structure**
   - Now exposes `data.json` via API
   - Frontend reads this for activity display

3. **Client Initialization**
   - Modified for Railway deployment
   - `webVersionCache` and `puppeteer` config added
   - Handles `PUPPETEER_EXECUTABLE_PATH` environment variable

**SAFE TO MODIFY:**

1. **Reply Logic** (`backend/replies.js`)
   - All message responses
   - Cooldown settings
   - Blacklist behavior
   - Same structure as your original bot

2. **Anti-spam Settings** (line ~25)
   - `COOLDOWN` duration
   - Message rate limits

3. **Message Handling Logic** (line ~70-120)
   - Message processing
   - Delay timing
   - Response conditions

## Environment Variables

### Backend (.env in backend folder or Railway)
```
PORT=4000
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### Frontend (.env.local)
```
NEXT_PUBLIC_BOT_URL=http://localhost:4000
```

For production, set `NEXT_PUBLIC_BOT_URL` to your Railway backend URL.

## Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

## Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
node bot.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Backend runs on `http://localhost:4000`
Frontend runs on `http://localhost:3000`

## Railway Deployment

### Backend Service
- Build command: `cd backend && npm install`
- Start command: `PUPPETEER_EXECUTABLE_PATH=$(which chromium) node bot.js`
- Root directory: `/`
- Port: 4000
- Uses `backend/nixpacks.toml` for Chromium dependencies

### Frontend Service
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Root directory: `/`
- Port: 3000
- Set `NEXT_PUBLIC_BOT_URL` environment variable to backend Railway URL

## Project Structure

```
├── app/                    # Next.js frontend
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── backend/
│   ├── bot.js             # Modified original bot + API
│   ├── replies.js         # Reply logic (your original logic)
│   ├── dashboard.js       # Simple HTML dashboard (unused)
│   ├── nixpacks.toml      # Railway Chromium config
│   └── package.json
├── components/            # UI components
│   ├── UI/
│   └── inPageComponents/
├── public/               # Static assets
├── .gitignore
├── package.json          # Frontend dependencies
└── README.md
```

## How It Works

1. Backend bot connects to WhatsApp via QR code
2. Backend exposes API endpoints for frontend
3. Frontend polls `/api/status` every 3 seconds
4. Frontend displays QR code, bot status, and recent messages
5. User can send manual messages via frontend
6. Bot continues auto-replying based on `replies.js` logic

## Files You Should NOT Touch

- `app/page.jsx` - Main dashboard polling logic
- `backend/bot.js` API endpoints section (lines ~50-150)
- `components/inPageComponents/*` - Frontend components
- `backend/nixpacks.toml` - Railway config

## Files You CAN Modify

- `backend/replies.js` - All response logic
- `backend/bot.js` message handling (lines ~70-120)
- `COOLDOWN` and rate limit settings
- Blacklist behavior

## Troubleshooting

**QR Code Not Showing:**
- Check backend is running on port 4000
- Check `NEXT_PUBLIC_BOT_URL` is set correctly
- Check CORS is enabled in backend

**Bot Not Responding:**
- Check `.wwebjs_auth` folder exists in backend
- Check Chromium path is correct on Railway
- Check `data.json` is being created

**Railway Deployment Fails:**
- Ensure `nixpacks.toml` is in backend folder
- Check `PUPPETEER_EXECUTABLE_PATH` is set
- Verify both services are using correct start commands
