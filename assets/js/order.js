/* ============================================================
   order.js — LuxDrive Travel
   Form validation, price calc, file upload, rate limiting,
   WA redirect, modal confirmation
   ============================================================ */

'use strict';

// ===================== CONSTANTS =====================
const WA_NUMBER = '62895629466956';

const DESTINATION_DATA = {
  bali:        { label: 'Bali',        harga: 2500000, hari: 3 },
  yogyakarta:  { label: 'Yogyakarta',  harga: 1800000, hari: 2 },
  bromo:       { label: 'Bromo',       harga: 1500000, hari: 2 },
  raja_ampat:  { label: 'Raja Ampat',  harga: 4500000, hari: 5 },
  labuan_bajo: { label: 'Labuan Bajo', harga: 3500000, hari: 4 },
  lombok:      { label: 'Lombok',      harga: 2000000, hari: 3 },
};

const ARMADA_DATA = {
  alphard:  { label: 'Toyota Alphard (Premium)',    biaya: 350000 },
  hiace:    { label: 'Hiace Commuter (Group)',       biaya: 500000 },
  fortuner: { label: 'Toyota Fortuner (Adventure)', biaya: 400000 },
};

// ===================== STATE =====================
let waUrl     = '';
let uploadedFile = null;

// ===================== HELPERS =====================
const $ = (id) => document.getElementById(id);

function formatRupiah(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function setError(fieldId, errorId, show, msg = '') {
  const field = $(fieldId);
  const err   = $(errorId);
  if (!field || !err) return;
  field.classList.toggle('error', show);
  if (show) {
    err.textContent = msg || err.textContent;
    err.classList.add('show');
  } else {
    err.classList.remove('show');
  }
}

function clearError(fieldId, errorId) {
  setError(fieldId, errorId, false);
}

// ===================== SET MIN DATE =====================
(function setMinDates() {
  const today = new Date().toISOString().split('T')[0];
  const tb    = $('tglBerangkat');
  const tp    = $('tglPulang');
  if (tb) tb.min = today;
  if (tp) tp.min = today;
})();

// ===================== AUTO-FILL FROM URL PARAMS =====================
(function autoFillFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const dest   = params.get('dest');
  const arm    = params.get('armada');
  if (dest) {
    const sel = $('destinasi');
    if (sel) {
      sel.value = dest;
      sel.dispatchEvent(new Event('change'));
    }
  }
  if (arm) {
    const sel = $('armada');
    if (sel) {
      sel.value = arm;
      sel.dispatchEvent(new Event('change'));
    }
  }
})();

// ===================== TRIP TYPE SELECTOR =====================
(function initTripType() {
  const btnOneWay    = $('btnOneWay');
  const btnRoundTrip = $('btnRoundTrip');
  const hiddenInput  = $('tipePerjalanan');
  const groupPulang  = $('groupTglPulang');
  const inputPulang  = $('tglPulang');
  const calcTipe     = $('calcTipe');

  if (!btnOneWay || !btnRoundTrip) return;

  function setTripType(type) {
    if (type === 'oneway') {
      btnOneWay.classList.add('active');
      btnRoundTrip.classList.remove('active');
      if (hiddenInput) hiddenInput.value = 'oneway';
      if (groupPulang) groupPulang.style.display = 'none';
      if (inputPulang) {
        inputPulang.value = '';
        inputPulang.removeAttribute('required');
      }
      clearError('tglPulang', 'tglPulangError');
      if (calcTipe) calcTipe.textContent = 'Sekali Jalan';
    } else {
      btnRoundTrip.classList.add('active');
      btnOneWay.classList.remove('active');
      if (hiddenInput) hiddenInput.value = 'roundtrip';
      if (groupPulang) groupPulang.style.display = 'block';
      if (inputPulang) {
        inputPulang.setAttribute('required', 'required');
      }
      if (calcTipe) calcTipe.textContent = 'Pulang Pergi';
    }
    recalcPrice();
  }

  btnOneWay.addEventListener('click', () => setTripType('oneway'));
  btnRoundTrip.addEventListener('click', () => setTripType('roundtrip'));
})();

// ===================== PRICE CALCULATOR =====================
function recalcPrice() {
  const destVal   = $('destinasi')?.value;
  const armVal    = $('armada')?.value;
  const dateStart = $('tglBerangkat')?.value;
  const dateEnd   = $('tglPulang')?.value;
  const penumpang = parseInt($('penumpang')?.value || '1', 10) || 1;
  const tipe      = $('tipePerjalanan')?.value || 'oneway';

  const destData = DESTINATION_DATA[destVal];
  const armData  = ARMADA_DATA[armVal];

  let durasi = 0;
  if (tipe === 'roundtrip') {
    if (dateStart && dateEnd) {
      const diff = Math.round((new Date(dateEnd) - new Date(dateStart)) / (1000 * 60 * 60 * 24));
      durasi = diff > 0 ? diff : 0;
    }
  } else {
    // Sekali Jalan: gunakan durasi standar paket destinasi (atau 1 hari)
    durasi = destData ? (destData.hari || 1) : 1;
  }

  const calcDest   = $('calcDest');
  const calcArmada = $('calcArmada');
  const calcDurasi = $('calcDurasi');
  const calcPaket  = $('calcPaket');
  const calcBiayaA = $('calcBiayaArmada');
  const calcTotal  = $('calcTotal');
  const calcDP     = $('calcDP');
  const calcTipe   = $('calcTipe');

  if (calcTipe) calcTipe.textContent = tipe === 'roundtrip' ? 'Pulang Pergi' : 'Sekali Jalan';
  if (!calcDest) return;

  calcDest.textContent   = destData ? destData.label : '—';
  calcArmada.textContent = armData  ? armData.label  : '—';
  calcDurasi.textContent = durasi   ? `${durasi} hari` : '—';

  const canCalculate = destData && armData && (tipe === 'oneway' ? Boolean(dateStart) : (durasi > 0));

  if (canCalculate) {
    const paket       = destData.harga * penumpang;
    const biayaArmada = armData.biaya  * durasi;
    const total       = paket + biayaArmada;
    const dp          = Math.ceil(total * 0.5);

    calcPaket.textContent  = formatRupiah(paket);
    calcBiayaA.textContent = formatRupiah(biayaArmada);
    calcTotal.textContent  = formatRupiah(total);
    calcDP.textContent     = formatRupiah(dp);

    // Store for WA message
    window._orderCalc = { total, dp, paket, biayaArmada, durasi, penumpang, tipe };
  } else {
    calcPaket.textContent  = '—';
    calcBiayaA.textContent = '—';
    calcTotal.textContent  = '—';
    calcDP.textContent     = '—';
    window._orderCalc      = null;
  }
}

['destinasi', 'armada', 'tglBerangkat', 'tglPulang', 'penumpang'].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener('change', recalcPrice);
  if (el && id === 'penumpang') el.addEventListener('input', recalcPrice);
});

// ===================== FILE UPLOAD =====================
(function initUpload() {
  const zone    = $('uploadZone');
  const input   = $('buktiTransfer');
  const preview = $('uploadPreview');
  const img     = $('previewImg');
  const name    = $('fileName');
  const remove  = $('removeFile');

  if (!zone || !input) return;

  // Click zone → trigger input safely (avoid duplicate click on mobile)
  zone.addEventListener('click', (e) => {
    if (e.target !== input) {
      input.click();
    }
  });

  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });

  // Drag & drop
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (file) handleFile(file);
  });

  if (remove) remove.addEventListener('click', (e) => {
    e.stopPropagation();
    clearUpload();
  });

  function handleFile(file) {
    const sec = window.LuxSecurity;
    const result = sec ? sec.validateFile(file) : { valid: file.size < 10*1024*1024, error: 'File tidak valid' };

    if (!result.valid) {
      window.showToast?.(result.error, 'error');
      clearUpload();
      return;
    }

    uploadedFile = file;
    clearError('buktiTransfer', 'buktiError');
    const bErr = $('buktiError');
    if (bErr) bErr.classList.remove('show');
    zone.classList.remove('error');

    const reader = new FileReader();
    reader.onload = (e) => {
      if (img) img.src = e.target.result;
      if (name) name.textContent = `${file.name || 'screenshot.jpg'} (${(file.size / 1024).toFixed(1)} KB)`;
      if (preview) {
        preview.style.display = 'flex';
        preview.classList.add('visible');
      }
    };
    reader.onerror = () => {
      if (name) name.textContent = `${file.name || 'screenshot'} (${(file.size / 1024).toFixed(1)} KB)`;
      if (preview) {
        preview.style.display = 'flex';
        preview.classList.add('visible');
      }
    };
    reader.readAsDataURL(file);
  }

  function clearUpload() {
    uploadedFile = null;
    if (img) img.src = '';
    if (name) name.textContent = '';
    if (preview) {
      preview.style.display = 'none';
      preview.classList.remove('visible');
    }
    if (input) input.value = '';
  }
  window._clearUpload = clearUpload;
})();

// ===================== FORM VALIDATION =====================
function validateAll() {
  const sec = window.LuxSecurity || {};
  let valid = true;

  // Nama
  const nama = $('nama')?.value.trim() || '';
  if (nama.length < 3) {
    setError('nama', 'namaError', true, 'Nama lengkap wajib diisi (min. 3 karakter)');
    valid = false;
  } else { clearError('nama', 'namaError'); }

  // WhatsApp
  const wa = $('whatsapp')?.value.trim() || '';
  const waClean = sec.sanitizePhone ? sec.sanitizePhone(wa) : wa;
  if (!sec.isValidPhone ? !/^(\+?62|0)[0-9]{9,13}$/.test(waClean.replace(/[\s\-]/g,'')) : !sec.isValidPhone(waClean)) {
    setError('whatsapp', 'whatsappError', true);
    valid = false;
  } else { clearError('whatsapp', 'whatsappError'); }

  // Email
  const email = $('email')?.value.trim() || '';
  if (!sec.isValidEmail ? !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) : !sec.isValidEmail(email)) {
    setError('email', 'emailError', true);
    valid = false;
  } else { clearError('email', 'emailError'); }

  // Destinasi
  if (!$('destinasi')?.value) {
    setError('destinasi', 'destinasiError', true);
    valid = false;
  } else { clearError('destinasi', 'destinasiError'); }

  // Armada
  if (!$('armada')?.value) {
    setError('armada', 'armadaError', true);
    valid = false;
  } else { clearError('armada', 'armadaError'); }

  // Tanggal Berangkat
  const tgB = $('tglBerangkat')?.value;
  const todayOk = sec.isDateTodayOrFuture ? sec.isDateTodayOrFuture(tgB) : (tgB && new Date(tgB) >= new Date(new Date().toDateString()));
  if (!todayOk) {
    setError('tglBerangkat', 'tglBerangkatError', true, 'Pilih tanggal keberangkatan (min. hari ini)');
    valid = false;
  } else { clearError('tglBerangkat', 'tglBerangkatError'); }

  // Tanggal Pulang (Hanya wajib jika Pulang Pergi)
  const tipe = $('tipePerjalanan')?.value || 'oneway';
  if (tipe === 'roundtrip') {
    const tgP = $('tglPulang')?.value;
    const endOk = sec.isEndAfterStart ? sec.isEndAfterStart(tgB, tgP) : (tgP && new Date(tgP) > new Date(tgB));
    if (!endOk) {
      setError('tglPulang', 'tglPulangError', true, 'Tanggal kepulangan harus setelah keberangkatan');
      valid = false;
    } else { clearError('tglPulang', 'tglPulangError'); }
  } else {
    clearError('tglPulang', 'tglPulangError');
  }

  // Penumpang
  const pax = parseInt($('penumpang')?.value || '0', 10);
  if (pax < 1 || pax > 20) {
    setError('penumpang', 'penumpangError', true);
    valid = false;
  } else { clearError('penumpang', 'penumpangError'); }

  // Titik Jemput
  const tj = $('titikJemput')?.value.trim() || '';
  if (tj.length < 10) {
    setError('titikJemput', 'titikJemputError', true, 'Titik penjemputan wajib diisi (min. 10 karakter)');
    valid = false;
  } else { clearError('titikJemput', 'titikJemputError'); }

  // Bukti Transfer
  if (!uploadedFile) {
    const buktiErr = $('buktiError');
    if (buktiErr) {
      buktiErr.classList.add('show');
      $('uploadZone')?.classList.add('error');
    }
    valid = false;
  } else {
    const buktiErr = $('buktiError');
    if (buktiErr) {
      buktiErr.classList.remove('show');
      $('uploadZone')?.classList.remove('error');
    }
  }

  return valid;
}

// ===================== BUILD WA MESSAGE =====================
function buildWAMessage() {
  const sec   = window.LuxSecurity || {};
  const strip = sec.stripHtml || ((s) => s.replace(/<[^>]*>/g,'').trim());
  const calc  = window._orderCalc || {};

  const nama     = strip($('nama')?.value || '');
  const wa       = strip($('whatsapp')?.value || '');
  const email    = strip($('email')?.value || '');
  const destVal  = $('destinasi')?.value;
  const armVal   = $('armada')?.value;
  const tgB      = $('tglBerangkat')?.value;
  const tgP      = $('tglPulang')?.value;
  const pax      = $('penumpang')?.value || '1';
  const titik    = strip($('titikJemput')?.value || '');
  const ket      = strip($('keterangan')?.value || '—');

  const destLabel = DESTINATION_DATA[destVal]?.label || destVal;
  const armLabel  = ARMADA_DATA[armVal]?.label  || armVal;

  const totalFmt = calc.total ? formatRupiah(calc.total) : 'Dihitung manual';
  const dpFmt    = calc.dp    ? formatRupiah(calc.dp)    : '50% dari total';
  const duraFmt  = calc.durasi ? `${calc.durasi} hari` : '—';

  const tipe     = $('tipePerjalanan')?.value || 'oneway';
  const tipeText = tipe === 'roundtrip' ? 'Pulang Pergi (Round Trip)' : 'Sekali Jalan (One Way)';

  const lines = [
    '🚗 *PESANAN BARU — LUXDRIVE TRAVEL* 🚗',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '*📋 DATA PEMESAN*',
    `👤 Nama        : ${nama}`,
    `📱 WhatsApp    : ${wa}`,
    `📧 Email       : ${email}`,
    '',
    '*🗺️ DETAIL PERJALANAN*',
    `🔄 Tipe Trip    : ${tipeText}`,
    `📍 Destinasi   : ${destLabel}`,
    `🚙 Armada      : ${armLabel}`,
    `📅 Berangkat   : ${tgB}`,
    ...(tipe === 'roundtrip' ? [`📅 Pulang      : ${tgP}`] : []),
    `⏱️  Durasi      : ${duraFmt}`,
    `👥 Penumpang   : ${pax} orang`,
    `📌 Titik Jemput: ${titik}`,
    '',
    '*💰 INFORMASI PEMBAYARAN*',
    `💳 Total Harga : ${totalFmt}`,
    `💰 DP (50%)    : ${dpFmt} (SUDAH DITRANSFER)`,
    `📎 Bukti TF    : ${uploadedFile ? uploadedFile.name : 'Terlampir via Chat'}`,
    '',
    '*📝 KETERANGAN TAMBAHAN*',
    ket,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '⚠️ *PERHATIAN:* Bukti transfer screenshot di atas dikirimkan bersamaan melalui lampiran foto ke nomor WA ini.',
    '',
    '✅ Terima kasih telah mempercayai *LuxDrive Travel*!',
  ];

  return lines.join('\n');
}

// ===================== MODAL =====================
(function initModal() {
  const overlay = $('modalKonfirmasi');
  const btnWA   = $('btnLanjutWA');
  const btnClose= $('btnTutupModal');

  if (!overlay) return;

  window._showModal = () => {
    overlay.classList.add('active');
    overlay.focus?.();
  };

  window._hideModal = () => {
    overlay.classList.remove('active');
  };

  if (btnWA) {
    btnWA.addEventListener('click', () => {
      window._hideModal();
      if (waUrl) window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', window._hideModal);
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window._hideModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window._hideModal();
  });
})();

// ===================== FORM SUBMIT =====================
const form   = $('orderForm');
const submitBtn = $('submitBtn');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Rate limit check
    const sec = window.LuxSecurity || {};
    if (sec.checkRateLimit) {
      const { allowed, waitMs } = sec.checkRateLimit();
      if (!allowed) {
        const waitStr = sec.formatWaitTime ? sec.formatWaitTime(waitMs) : `${Math.ceil(waitMs/60000)} menit`;
        window.showToast?.(`Terlalu banyak percobaan. Coba lagi dalam ${waitStr}.`, 'error', 5000);
        return;
      }
    }

    // Validate
    if (!validateAll()) {
      window.showToast?.('Mohon lengkapi semua field yang diperlukan.', 'error');
      // Scroll to first error
      const firstErr = form.querySelector('.form-control.error, .upload-zone.error');
      if (firstErr) {
        const navH = document.getElementById('navbar')?.offsetHeight || 80;
        window.scrollTo({ top: firstErr.getBoundingClientRect().top + window.scrollY - navH - 20, behavior: 'smooth' });
      }
      return;
    }

    // Build WA URL
    recalcPrice();
    const msg = buildWAMessage();
    waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

    // Record submit
    if (sec.recordSubmit) sec.recordSubmit();

    // Loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    }

    // Brief delay then show modal
    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Pesanan via WhatsApp';
      }
      window._showModal?.();
    }, 800);
  });

  // Live validation on blur
  ['nama','whatsapp','email','destinasi','armada','tglBerangkat','tglPulang','penumpang','titikJemput'].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('blur', () => validateAll());
      el.addEventListener('input', () => {
        if (el.classList.contains('error')) validateAll();
      });
    }
  });
}
