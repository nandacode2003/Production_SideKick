# SideKick 🤝

**Find your companion for any activity — safely and smartly.**

## What's New (Phase 1 Evaluation Update)

- **Smart Matching** — Python microservice with interest, availability, distance & safety scoring (local fallback included)
- **Event Map** — Interactive Mapbox map showing all events with category emojis
- **System Status Page** — Live health check of all microservices
- **NLP Chat Moderation** — Message moderation + sentiment analysis (optional microservice)
- **Improved Auth** — Phone verification, better OTP flow, face verification with fallback
- **User Ratings** — Rate your match after meetup (affects safety score)
- **Rideshare Events** — New event categories: rideshare & drive
- **Vercel-optimized backend** — Serverless-compatible with cached DB connection

## Project Structure

```
sidekick/
├── backend/          # Node.js + Express API (Vercel)
├── frontend/         # React app (Vercel)
├── python-service/   # Python matching microservice (Render)
└── docs/             # API & database documentation
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env   # fill in REACT_APP_API_URL and REACT_APP_MAPBOX_TOKEN
npm install
npm start
```

### Seed Demo Data
```bash
cd backend
npm run demo-seed      # seeds 10 demo users + events (requires your account to exist)
```

## Environment Variables

### Backend (.env)
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret (optional) |
| `EMAIL_USER` / `GMAIL_USER` | Gmail address for emails |
| `EMAIL_PASS` / `GMAIL_PASS` | Gmail app password |
| `FRONTEND_URL` | Frontend URL for CORS |
| `PYTHON_SERVICE_URL` | Python matching service URL |
| `FACE_SERVICE_URL` | Face verification service URL |
| `NLP_SERVICE_URL` | NLP moderation service URL |

### Frontend (.env)
| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend API URL |
| `REACT_APP_SOCKET_URL` | Socket.IO server URL |
| `REACT_APP_MAPBOX_TOKEN` | Mapbox public token (for Map page) |

## Deployment

- **Backend** → Vercel (uses `backend/vercel.json`)
- **Frontend** → Vercel
- **Python Service** → Render (uses `python-service/Procfile`)

## Tech Stack

- **Frontend**: React 18, Framer Motion, Tailwind CSS, Socket.IO Client, Mapbox GL
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT, Nodemailer
- **Python**: Flask, Gunicorn (matching algorithm)
