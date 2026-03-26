# 🤝 SideKick — Find Your Companion

> **"Never go alone. Find your SideKick."**

A smart companion-matching platform for students and young professionals to safely find like-minded people for events, outings, and casual meetups.

---

## 1. PRODUCT OVERVIEW

> SideKick matches verified users with compatible companions nearby for real-world activities — safely, smartly, and instantly.

### Key Features
- **Verified Profiles** — OTP + Government ID (mocked) + Face Scan
- **Smart Matching** — Interest overlap + Distance + Availability + Safety score
- **Activity-Based** — Match for specific events (movies, sports, food, etc.)
- **Real-Time Chat** — Socket.io-powered messaging after match
- **Event Board** — Browse/create local activities
- **Safety First** — Report/block system, public-only meetups, verified badges

### User Flow
```
Register → OTP Verify → Upload Gov ID (mocked) → Face Scan → Set Interests/Availability
    → Browse Events or Get Matches → Send/Accept Request → Chat → Meetup → Rate
```

---

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (React)                       │
│   Auth | Dashboard | Match | Chat | Events | Profile    │
└──────────────────────┬──────────────────────────────────┘
                       │ REST + Socket.io
┌──────────────────────▼──────────────────────────────────┐
│              Node.js / Express API (Port 5000)           │
│   Auth | Users | Matches | Events | Chat | Reports      │
└──────┬──────────────────────────────────┬───────────────┘
       │ MongoDB Driver                   │ HTTP (internal)
┌──────▼───────┐                ┌─────────▼───────────────┐
│  MongoDB     │                │  Python Microservice     │
│  Atlas       │                │  (Flask, Port 8000)      │
│  Collections:│                │  - Matching Algorithm    │
│  users       │                │  - Face Verify Simulate  │
│  matches     │                │  - Score Calculator      │
│  events      │                └─────────────────────────┘
│  chats       │
│  reports     │
└──────────────┘
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Socket.io-client, Axios, TailwindCSS |
| Backend | Node.js, Express.js, Socket.io, JWT, Mongoose |
| Database | MongoDB Atlas |
| Microservice | Python 3.11, Flask, scikit-learn (cosine similarity) |
| Auth | JWT + bcrypt + Twilio OTP (mocked in dev) |
| Deployment | Vercel (FE), Render (BE + Python), MongoDB Atlas |

---

## 3. FEATURE BREAKDOWN (MVP)

| Feature | Status | Notes |
|---------|--------|-------|
| JWT Auth | ✅ | Access + Refresh tokens |
| OTP Verification | ✅ | Twilio SMS (mock in dev) |
| Gov ID Verification | ✅ | Mocked API response |
| Face Scan | ✅ | Webcam capture + simulated check |
| Profile + Interests | ✅ | Tags-based selection |
| Matching Algorithm | ✅ | Python microservice |
| Chat System | ✅ | Socket.io real-time |
| Event Creation/Joining | ✅ | CRUD events |
| Safety Reporting | ✅ | Report + Block + Admin flag |

---

## 9. DEPLOYMENT PLAN

### Frontend → Vercel
```bash
cd frontend && npm run build
# Connect GitHub repo to Vercel, set REACT_APP_API_URL env
```

### Backend → Render
```
Build Command: npm install
Start Command: node server.js
Env: MONGO_URI, JWT_SECRET, TWILIO_*, PYTHON_SERVICE_URL
```

### Python Service → Render (separate service)
```
Build: pip install -r requirements.txt
Start: gunicorn app:app
```

### Database → MongoDB Atlas
- Free M0 cluster
- IP whitelist: 0.0.0.0/0 for Render
- Create DB user with readWrite role

---

## 10. ONE-WEEK EXECUTION PLAN

### Day 1 — Setup + Auth
- Init repos (monorepo or separate)
- MongoDB Atlas + env config
- User model + Register/Login APIs
- OTP mock flow
- React app scaffold + Auth pages

### Day 2 — Verification + Profile
- Gov ID mock API
- Face scan webcam component
- Profile creation page
- Interests/availability selection UI

### Day 3 — Matching Engine
- Python Flask service setup
- Matching algorithm implementation
- Node.js → Python service integration
- Match request API (send/accept/reject)

### Day 4 — Events + Dashboard
- Event model + CRUD APIs
- Event browse/create UI
- Dashboard page with matches + events
- Location filter (city-level)

### Day 5 — Chat System
- Socket.io setup (Node)
- Chat model + message persistence
- React chat UI
- Match → Chat room flow

### Day 6 — Safety + Polish
- Report/Block system (API + UI)
- Verified badge display
- Responsive design polish
- Loading states + error handling

### Day 7 — Deploy + Demo
- Deploy all three services
- End-to-end testing
- Demo script + slides
- README + API docs

---

## 🌟 BONUS

### 2 Hackathon-Winning Unique Features

**1. Vibe Check™ Quiz**
> A 60-second personality quiz on signup that assigns a "vibe tag" (e.g., *The Adventurer*, *The Foodie*, *The Planner*). Matches show vibe compatibility — makes pairing feel personal and fun, not algorithmic.

**2. SideKick Safety Circle**
> Users can add 1–2 trusted contacts (parent/friend). Before any meetup, the app auto-sends a "Check-in link" to the safety circle with the event details and location. After the meetup, a "I'm safe" button closes the check-in. If not pressed in 2 hours, safety contact gets an alert.

---

### 2 Monetization Ideas

1. **SideKick Pro** — ₹99/month: Unlimited matches (free = 5/day), priority match visibility, read receipts, advanced filters
2. **Promoted Events** — Local businesses (cafes, cinemas, escape rooms) pay to feature their events on the platform. Users get a small cashback/discount for attending sponsored events.

---

### 2 Risks + Mitigations

| Risk | Mitigation |
|------|-----------|
| **Fake/unsafe profiles** — bad actors creating fake IDs | Government ID mock now → integrate DigiLocker API post-MVP; mandatory face scan match on each login session |
| **Low network effect** — platform is useless with few users | Launch exclusively in 1–2 college campuses first (closed beta), grow organically via WhatsApp/college groups, offer "Founding Member" badge for early adopters |
