// backend/server.js — LuxDrive Travel
// Node.js Express backend for security layer

'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const morgan       = require('morgan');
const orderRoutes  = require('./routes/order');
const waRoutes     = require('./routes/whatsapp');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security Headers ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS policy violation'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parser ───────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── Logging ──────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Global Rate Limiter ───────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs : 15 * 60 * 1000, // 15 minutes
  max      : 100,
  standardHeaders: true,
  legacyHeaders  : false,
  message  : { success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
});
app.use(globalLimiter);

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/order',    orderRoutes);
app.use('/api/whatsapp', waRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'LuxDrive API is running', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ─── Error Handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[LuxDrive Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan server' : err.message,
  });
});

// ─── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚗 LuxDrive Travel API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
