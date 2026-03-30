require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Cached DB connection for serverless
let dbConnected = false;
const ensureDB = async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (err) {
      return res.status(500).json({ message: 'Database connection failed. Check MONGO_URI env var.' });
    }
  }
  next();
};

app.get('/', (req, res) => res.json({ status: 'ok', service: 'sidekick-backend', message: 'SideKick API is running 🤝' }));
app.get('/health', (req, res) => res.json({ status: 'ok', mongo_uri_set: !!process.env.MONGO_URI, jwt_secret_set: !!process.env.JWT_SECRET }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'sidekick-backend' }));

app.use('/api/auth',      ensureDB, require('./routes/auth'));
app.use('/api/users',     ensureDB, require('./routes/users'));
app.use('/api/matches',   ensureDB, require('./routes/matches'));
app.use('/api/events',    ensureDB, require('./routes/events'));
app.use('/api/chats',     ensureDB, require('./routes/chats'));
app.use('/api/reports',   ensureDB, require('./routes/reports'));
app.use('/api/safety',    ensureDB, require('./routes/safety'));
app.use('/api/profile',   ensureDB, require('./routes/profile'));
app.use('/api/dashboard', ensureDB, require('./routes/dashboard'));
app.use('/api/ratings',   ensureDB, require('./routes/ratings'));
app.use('/api/admin',     ensureDB, require('./routes/admin'));

app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} not found` }));
app.use(require('./middleware/errorHandler'));

// Local dev only
if (require.main === module) {
  const http = require('http');
  const { Server } = require('socket.io');
  const { initSocket } = require('./utils/socket');
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: process.env.FRONTEND_URL || '*' } });
  app.set('io', io);
  initSocket(io);
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    dbConnected = true;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  });
}

module.exports = app;
