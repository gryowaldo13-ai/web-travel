// backend/routes/whatsapp.js — LuxDrive Travel
// WhatsApp message helper endpoint

'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const router  = express.Router();

const WA_NUMBER = process.env.WA_NUMBER || '62895629466956';

// Build WhatsApp wa.me URL
function buildWaUrl(data) {
  const { nama, whatsapp, email, destinasi, armada, tglBerangkat, tglPulang, penumpang, titikJemput, keterangan, totalHarga, dp } = data;

  const msg = [
    '🚗 *PESANAN BARU — LUXDRIVE TRAVEL*',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '*📋 DATA PEMESAN*',
    `👤 Nama        : ${nama}`,
    `📱 WhatsApp    : ${whatsapp}`,
    `📧 Email       : ${email}`,
    '',
    '*🗺️ DETAIL PERJALANAN*',
    `📍 Destinasi   : ${destinasi}`,
    `🚙 Armada      : ${armada}`,
    `📅 Berangkat   : ${tglBerangkat}`,
    `📅 Pulang      : ${tglPulang}`,
    `👥 Penumpang   : ${penumpang} orang`,
    `📌 Titik Jemput: ${titikJemput}`,
    '',
    '*💰 PEMBAYARAN*',
    `💳 Total       : ${totalHarga}`,
    `💰 DP (50%)    : ${dp}`,
    '',
    '*📝 KETERANGAN*',
    keterangan || '—',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '⚠️ _Mohon kirimkan foto bukti transfer DP ke chat ini._',
  ].join('\n');

  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// POST /api/whatsapp/generate-url
router.post('/generate-url', [
  body('nama').trim().notEmpty().escape(),
  body('whatsapp').trim().notEmpty().escape(),
  body('email').trim().isEmail().normalizeEmail(),
  body('destinasi').trim().notEmpty().escape(),
  body('armada').trim().notEmpty().escape(),
  body('tglBerangkat').trim().notEmpty(),
  body('tglPulang').trim().notEmpty(),
  body('penumpang').isInt({ min:1, max:20 }),
  body('titikJemput').trim().notEmpty().escape(),
  body('keterangan').optional().trim().escape(),
  body('totalHarga').trim().notEmpty(),
  body('dp').trim().notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const url = buildWaUrl(req.body);
  res.json({ success: true, url });
});

module.exports = router;
