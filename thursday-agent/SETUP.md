# TNF PDF Lineup Agent Setup Guide

## 🏈 New Architecture: PDF-Based Lineup Generation

Instead of web scraping ETR (which requires authentication), this new system works by:

1. **You upload a PDF** of projections to your Slack channel
2. **Slack bot receives** the PDF and extracts projection data using GPT-4 Vision
3. **GPT analyzes** projections and generates optimal lineups
4. **Bot responds** with lineup recommendations

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Slack App
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name it "TNF Lineup Agent"
4. Select your workspace

### 3. Configure Slack App Permissions
**OAuth & Permissions:**
- Add these Bot Token Scopes:
  - `files:read`
  - `files:write`
  - `chat:write`
  - `channels:read`
  - `groups:read`
  - `im:read`
  - `mpim:read`

**Event Subscriptions:**
- Enable Events
- Subscribe to Bot Events:
  - `file_shared`
- Request URL: `https://your-domain.com/slack/events`

### 4. Install App to Workspace
- Go to "Install App" in your Slack app settings
- Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 5. Environment Setup
```bash
# Copy the example file
cp .env-example .env

# Edit .env with your credentials:
OPENAI_API_KEY=sk-your-openai-api-key-here
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
SLACK_SIGNING_SECRET=your-slack-signing-secret-here
ALLOWED_CHANNELS=#dfs-lineups,#thursday-night-football
PORT=3000
```

### 6. Deploy or Run Locally

**Option A: Run Locally (for testing)**
```bash
npm run dev
```

**Option B: Deploy to Cloud**
- Deploy to Heroku, Railway, or similar
- Update your Slack app's Request URL to point to your deployed app

## 📋 How to Use

1. **Upload PDF**: Upload a PDF of projections to your configured Slack channel
2. **Wait**: The bot will process the PDF (usually takes 30-60 seconds)
3. **Get Lineups**: Bot responds with 3 optimal lineup strategies:
   - **BALANCED**: Mix of high-floor and ceiling players
   - **CONTRARIAN**: Lower ownership, higher upside  
   - **CASH**: High-floor, safe plays

## 📄 PDF Format Requirements

The PDF should contain clear projection data with:
- Player names
- Positions (QB, RB, WR, TE, K, DST)
- Team abbreviations
- Salaries (DraftKings format)
- Projections (fantasy points)
- Optional: Ownership percentages

## 🔧 Troubleshooting

**Bot not responding:**
- Check that the Slack app is installed in your workspace
- Verify the Request URL is correct and accessible
- Check server logs for errors

**PDF parsing issues:**
- Ensure PDF contains clear, readable text (not just images)
- Try a different PDF format or source
- Check OpenAI API key is valid

**Permission errors:**
- Verify bot has access to the channel
- Check OAuth scopes are correctly configured

## 🎯 Benefits of New Architecture

✅ **No authentication issues** - works with any PDF source
✅ **More reliable** - no web scraping failures
✅ **Flexible** - works with projections from any site
✅ **Better analysis** - GPT-4 provides sophisticated lineup optimization
✅ **Easy to use** - just upload PDF to Slack
✅ **Scalable** - can handle multiple users/channels

## 🔄 Migration from Old System

The old web scraper is still available:
```bash
npm run start-scraper  # Old web scraping version
npm run start          # New PDF-based version
```

You can keep both systems running if needed.
