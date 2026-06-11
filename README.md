# Qualifi — AI Lead Qualification Backend

Receives GHL form submissions, places an outbound AI voice call via Vapi, qualifies the lead, then either live-transfers the call or books a calendar slot — texting you the outcome either way.

## Quick Start

### 1. Install dependencies
```
npm install
cd frontend && npm install && cd ..
```

### 2. Set up environment variables
```
cp .env.example .env
```
Open `.env` and fill in every value. See comments in `.env.example` for where to find each one.

### 3. Start the servers

**Terminal 1 — Backend (API + webhooks):**
```
npm run dev        # port 3000, auto-restarts on changes
```

**Terminal 2 — Frontend (dashboard):**
```
cd frontend && npm run dev    # port 5173, proxies /api/* to backend
```

Open `http://localhost:5173` in your browser.

### 4. Expose localhost via ngrok (for GHL/Vapi webhooks)
```
ngrok http 3000
```
Copy the `https://xxxxx.ngrok.io` URL — you'll use it for both webhooks below.

### 5. Configure GoHighLevel webhook
- Go to **Settings > Integrations > Webhooks** (or the Automation trigger "Form Submitted")
- Set the URL to: `https://your-ngrok-url/webhooks/ghl-new-lead`
- Select the form(s) you want to trigger calls

### 6. Configure Vapi webhook
- Go to **Vapi Dashboard > Account > Webhooks**
- Set the URL to: `https://your-ngrok-url/webhooks/vapi-events`
- Enable: `function-call`, `end-of-call-report`, `status-update`

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /health | Uptime check |
| POST | /webhooks/ghl-new-lead | GHL form submission |
| POST | /webhooks/vapi-events | Vapi call events |

## Environment Variables

See `.env.example` for the full list with descriptions.

## Project Structure

```
src/
  index.js              Express app + route wiring
  config.js             Loads and validates env vars
  webhooks/
    ghlNewLead.js       Handles incoming GHL form submissions
    vapiEvents.js       Handles Vapi function calls + end-of-call reports
  services/
    vapi.js             Vapi API calls (start call, trigger transfer)
    ghl.js              GHL API calls (SMS, calendar, tags, notes)
  lib/
    logger.js           Structured Winston logger
```

## Call Outcomes

| Outcome | What happens |
|---------|-------------|
| TRANSFER | Vapi transfers call to your number + SMS "NOW — name (number)" |
| BOOK | GHL calendar event created + SMS "BOOK — name at time" |
| NOT QUALIFIED | Lead tagged `ai-not-qualified` in GHL, no SMS |

All calls: transcript + recording URL written as a note on the GHL contact.
