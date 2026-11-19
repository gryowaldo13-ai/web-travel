/* ============================================================
   security.js — LuxDrive Travel
   Input sanitization, XSS prevention, rate limiting helpers,
   form validation utilities
   ============================================================ */

'use strict';

// ===================== SANITIZATION =====================

/**
 * Strip all HTML tags from a string to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Remove HTML tags entirely (for WA message text, not for display).
 */
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize a phone number: keep only digits, +, -, spaces.
 */
function sanitizePhone(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[^0-9+\-\s]/g, '').trim();
}

// ===================== VALIDATORS =====================

/**
 * Validate Indonesian phone / WhatsApp number.
 * Accepts: 08xx, 628xx, +628xx (10–15 digits)
 */
function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-]/g, '');
  return /^(\+?62|0)[0-9]{9,13}$/.test(cleaned);
}

/**
 * Basic email validation.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Ensure date string is today or in the future.
 */
function isDateTodayOrFuture(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  return d >= today;
}

/**
 * Ensure end date is strictly after start date.
 */
function isEndAfterStart(startStr, endStr) {
  if (!startStr || !endStr) return false;
  return new Date(endStr) > new Date(startStr);
}

// ===================== RATE LIMITING =====================
const RATE_LIMIT_KEY    = 'ld_submit_times';
const RATE_LIMIT_MAX    = 3;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes in ms

/**
 * Check whether the user has exceeded the submit rate limit.
 * Returns { allowed: boolean, waitMs: number }
 */
function checkRateLimit() {
  let times = [];
  try {
    times = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
  } catch (_) { times = []; }

  const now     = Date.now();
  const cutoff  = now - RATE_LIMIT_WINDOW;
  times         = times.filter(t => t > cutoff);            // keep only recent
  const waitMs  = times.length >= RATE_LIMIT_MAX
    ? (times[0] + RATE_LIMIT_WINDOW) - now
    : 0;

  return { allowed: times.length < RATE_LIMIT_MAX, waitMs, times };
}

/**
 * Record a submit timestamp.
 */
function recordSubmit() {
  let { times } = checkRateLimit();
  times = times.filter(t => t > Date.now() - RATE_LIMIT_WINDOW);
  times.push(Date.now());
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(times));
  } catch (_) {}
}

/**
 * Format milliseconds to a human-readable string "X menit Y detik".
 */
function formatWaitTime(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const min      = Math.floor(totalSec / 60);
  const sec      = totalSec % 60;
  if (min > 0) return `${min} menit ${sec} detik`;
  return `${sec} detik`;
}

// ===================== FILE VALIDATION =====================

/**
 * Validate an uploaded file for type and size (Mobile Friendly: iOS/Android).
 * @param {File} file
 * @param {string[]} allowedTypes
 * @param {number} maxBytes
 * @returns {{ valid: boolean, error: string }}
 */
function validateFile(file, allowedTypes = null, maxBytes = 10 * 1024 * 1024) {
  if (!file) return { valid: false, error: 'File tidak ditemukan' };

  // Mobile compatibility: check MIME type OR file extension
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const ext  = name.split('.').pop() || '';

  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp'];
  const isImageMime = mime.startsWith('image/');
  const isImageExt  = validExtensions.includes(ext);

  // If specific allowedTypes provided and not mobile-default
  if (allowedTypes && Array.isArray(allowedTypes) && allowedTypes.length > 0) {
    const typeMatch = allowedTypes.some(t => mime.includes(t.replace('image/', '')) || ext === t.replace('image/', ''));
    if (!typeMatch && !isImageMime && !isImageExt) {
      return { valid: false, error: 'Format file tidak valid. Gunakan format gambar (JPG, PNG, WEBP, HEIC)' };
    }
  } else {
    // Default check: any image mime or valid image extension
    if (!isImageMime && !isImageExt) {
      return { valid: false, error: 'Format file tidak valid. Silakan pilih file gambar (JPG, PNG, WEBP, HEIC)' };
    }
  }

  if (file.size > maxBytes) {
    return { valid: false, error: `Ukuran file terlalu besar (maks. ${Math.round(maxBytes / 1024 / 1024)} MB)` };
  }
  return { valid: true, error: '' };
}

// ===================== EXPORT =====================
window.LuxSecurity = {
  sanitizeString,
  stripHtml,
  sanitizePhone,
  isValidPhone,
  isValidEmail,
  isDateTodayOrFuture,
  isEndAfterStart,
  checkRateLimit,
  recordSubmit,
  formatWaitTime,
  validateFile,
};
