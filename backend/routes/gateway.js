// backend/routes/gateway.js — Velora Travel
// Automated WhatsApp Gateway API Integration (Cara 2: Bot WhatsApp Otomatis)

'use strict';

const express = require('express');
const router  = express.Router();

/**
 * Send automated WhatsApp message via Gateway API (e.g. Fonnte / Waha / Wablas)
 * @param {string} phone - Customer's WhatsApp phone number
 * @param {object} ticket - Ticket data object
 */
async function sendWhatsAppGateway(phone, ticket) {
  // Format phone number to Indonesian international format (e.g. 0812 -> 62812)
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  const messageText = [
    `Halo kak *${ticket.nama}*, terima kasih telah memesan di *Velora Travel*! 🚗✨`,
    '',
    `Berikut adalah rincian E-Tiket Boarding Pass Anda:`,
    `🎫 *Kode Booking*: *${ticket.code}*`,
    `📍 *Tujuan*: ${ticket.destLabel || ticket.destVal}`,
    `🚙 *Armada*: ${ticket.armLabel || ticket.armVal}`,
    `📅 *Jadwal*: ${ticket.tglBerangkat} ${ticket.tglPulang ? 's/d ' + ticket.tglPulang : '(Sekali Jalan)'}`,
    `👥 *Penumpang*: ${ticket.penumpang} Orang`,
    `📌 *Titik Jemput*: ${ticket.titikJemput}`,
    '',
    `💰 *DP 50%*: ${ticket.dpFmt} *(TERVERIFIKASI)*`,
    `💳 *Total*: ${ticket.totalFmt}`,
    '',
    `🔗 *Buka E-Tiket Digital & Download PDF*:`,
    `${ticket.ticketUrl}`,
    '',
    `Sopir kami akan menghubungi Anda H-1 sebelum penjemputan. Selamat menikmati perjalanan mewah bersama Velora Travel! 🙏`
  ].join('\n');

  // 1. Fonnte API Integration (Default Indonesian Gateway)
  const fonnteToken = process.env.FONNTE_TOKEN || process.env.WA_GATEWAY_TOKEN;
  if (fonnteToken) {
    try {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': fonnteToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: cleanPhone,
          message: messageText,
          countryCode: '62'
        })
      });

      const resData = await response.json();
      return { success: true, gateway: 'fonnte', data: resData };
    } catch (err) {
      console.warn('[WA Gateway Error]', err.message);
      return { success: false, error: err.message };
    }
  }

  // 2. Ready Simulation / Log Mode
  console.log(`[WA Gateway Bot] Automated message queued for ${cleanPhone} (Booking: ${ticket.code})`);
  return {
    success: true,
    simulated: true,
    message: `Pesan bot disiapkan untuk ${cleanPhone}. Masukkan FONNTE_TOKEN di .env untuk pengiriman langsung.`
  };
}

// POST /api/gateway/send-wa
router.post('/send-wa', async (req, res) => {
  const { phone, ticketData } = req.body;

  if (!phone || !ticketData) {
    return res.status(400).json({ success: false, message: 'Nomor WhatsApp dan data tiket wajib disertakan' });
  }

  const result = await sendWhatsAppGateway(phone, ticketData);
  return res.json(result);
});

module.exports = router;
