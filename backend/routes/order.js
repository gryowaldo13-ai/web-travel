// backend/routes/order.js — LuxDrive Travel
// Order API route with validation and rate limiting

'use strict';

const express   = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const router    = express.Router();

// Strict rate limit for order submissions
const orderLimiter = rateLimit({
  windowMs : 10 * 60 * 1000, // 10 minutes
  max      : 3,
  standardHeaders: true,
  legacyHeaders  : false,
  message  : {
    success: false,
    message: 'Terlalu banyak percobaan pemesanan. Coba lagi dalam 10 menit.',
  },
  keyGenerator: (req) => req.ip,
});

// Validation rules
const orderValidation = [
  body('nama')
    .trim()
    .notEmpty().withMessage('Nama wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama harus 3–100 karakter')
    .escape(),

  body('whatsapp')
    .trim()
    .notEmpty().withMessage('Nomor WhatsApp wajib diisi')
    .matches(/^(\+?62|0)[0-9]{9,13}$/).withMessage('Format nomor WhatsApp tidak valid')
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),

  body('destinasi')
    .trim()
    .notEmpty().withMessage('Destinasi wajib dipilih')
    .isIn(['bali','yogyakarta','bromo','raja_ampat','labuan_bajo','lombok'])
    .withMessage('Destinasi tidak valid'),

  body('armada')
    .trim()
    .notEmpty().withMessage('Armada wajib dipilih')
    .isIn(['alphard','hiace','fortuner'])
    .withMessage('Armada tidak valid'),

  body('tglBerangkat')
    .notEmpty().withMessage('Tanggal keberangkatan wajib diisi')
    .isDate().withMessage('Format tanggal tidak valid')
    .custom((val) => {
      const today = new Date(); today.setHours(0,0,0,0);
      if (new Date(val) < today) throw new Error('Tanggal keberangkatan minimal hari ini');
      return true;
    }),

  body('tglPulang')
    .notEmpty().withMessage('Tanggal kepulangan wajib diisi')
    .isDate().withMessage('Format tanggal tidak valid')
    .custom((val, { req }) => {
      if (new Date(val) <= new Date(req.body.tglBerangkat)) {
        throw new Error('Tanggal kepulangan harus setelah keberangkatan');
      }
      return true;
    }),

  body('penumpang')
    .notEmpty().withMessage('Jumlah penumpang wajib diisi')
    .isInt({ min: 1, max: 20 }).withMessage('Penumpang harus 1–20 orang'),

  body('titikJemput')
    .trim()
    .notEmpty().withMessage('Titik penjemputan wajib diisi')
    .isLength({ min: 10, max: 500 }).withMessage('Titik jemput harus 10–500 karakter')
    .escape(),

  body('keterangan')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Keterangan maksimal 1000 karakter')
    .escape(),
];

// POST /api/order
router.post('/', orderLimiter, orderValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors : errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }

  const {
    nama, whatsapp, email, destinasi, armada,
    tglBerangkat, tglPulang, penumpang, titikJemput, keterangan,
  } = req.body;

  // Log order (replace with DB write / notification service in production)
  const orderLog = {
    id        : `LD-${Date.now()}`,
    timestamp : new Date().toISOString(),
    nama, whatsapp, email, destinasi, armada,
    tglBerangkat, tglPulang, penumpang: parseInt(penumpang, 10),
    titikJemput, keterangan,
    ip        : req.ip,
  };
  console.log('[Order Received]', JSON.stringify(orderLog, null, 2));

  return res.status(201).json({
    success : true,
    message : 'Pesanan diterima! Tim kami akan segera menghubungi Anda via WhatsApp.',
    orderId : orderLog.id,
  });
});

module.exports = router;
