// backend/server.js — LuxDrive Travel
// Node.js Express server: serves frontend static files & provides security API

'use strict';

require('dotenv').config();

const path         = require('path');
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const morgan       = require('morgan');
const orderRoutes  = require('./routes/order');
const waRoutes     = require('./routes/whatsapp');

const app  = express();
const PORT = process.env.PORT || 3000;

const rootDir = path.join(__dirname, '..');
const srcDir  = path.join(rootDir, 'src');

// ─── Security Headers ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      imgSrc:     ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // Allow all in dev / frontend usage
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parser ───────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── Logging ──────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Global Rate Limiter for API ──────────────────────────────
const globalLimiter = rateLimit({
  windowMs : 15 * 60 * 1000, // 15 minutes
  max      : 100,
  standardHeaders: true,
  legacyHeaders  : false,
  message  : { success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
});
app.use('/api/', globalLimiter);

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/order',    orderRoutes);
app.use('/api/whatsapp', waRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'LuxDrive API is running', timestamp: new Date().toISOString() });
});

// ─── Frontend Static Files ────────────────────────────────────
app.use('/assets', express.static(path.join(rootDir, 'assets')));
app.use('/src',    express.static(srcDir));

// Route handlers for HTML pages
app.get('/', (_req, res) => {
  res.sendFile(path.join(srcDir, 'index.html'));
});

app.get('/index.html', (_req, res) => {
  res.sendFile(path.join(srcDir, 'index.html'));
});

app.get(['/order', '/order.html'], (_req, res) => {
  res.sendFile(path.join(srcDir, 'order.html'));
});

app.get(['/tentang-kami', '/tentang-kami.html', '/tentang%20kami.html', '/tentang kami.html'], (_req, res) => {
  res.sendFile(path.join(srcDir, 'tentang kami.html'));
});

// ─── 404 Handlers ──────────────────────────────────────────────
// API 404
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan' });
});

// Frontend fallback
app.use((_req, res) => {
  res.sendFile(path.join(srcDir, 'index.html'));
});

// ─── Error Handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[LuxDrive Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan server' : err.message,
  });
});

// ─── Start (if executed directly) ──────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚗 LuxDrive Travel running on http://localhost:${PORT}`);
    console.log(`   Frontend    : http://localhost:${PORT}`);
    console.log(`   Order page  : http://localhost:${PORT}/order`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = app;
