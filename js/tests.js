/**
 * SiKerja Automated Integration & E2E Test Suite
 * =========================================================================
 * Skrip ini mendefinisikan rangkaian pengujian otomatis untuk memvalidasi:
 * 1. Navigasi dan Tab Halaman
 * 2. Validasi Formulir & Highlight Field-error
 * 3. Penyimpanan & Pemuatan Draft Laporan Harian (JSON)
 * 4. Pembuatan File PDF Vektor (JSA, IBPPR, Laporan)
 * 5. Antrean Offline & Sinkronisasi Offline-First
 * 6. Pemulihan Sesi Input (Session Recovery)
 * =========================================================================
 */

"use strict";

(function() {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has("test")) return;

  // CSS Khusus untuk Test Runner Overlay
  const TEST_CSS = `
    #test-runner-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(17, 24, 39, 0.96);
      z-index: 999999;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
      color: #e5e7eb;
    }
    .test-container {
      width: 90%;
      max-width: 650px;
      background: #1f2937;
      border-radius: 16px;
      border: 1px solid #374151;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .test-header {
      background: #111827;
      padding: 20px 24px;
      border-bottom: 1px solid #374151;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #fbbf24;
    }
    .test-body {
      padding: 24px;
      max-height: 420px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .test-item {
      display: flex;
      flex-direction: column;
      padding: 12px 16px;
      background: #111827;
      border-radius: 8px;
      border: 1px solid #374151;
      transition: all 0.2s;
    }
    .test-item-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .test-item.running {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }
    .test-item.success {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }
    .test-item.fail {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }
    .test-icon {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: bold;
      font-size: 13px;
    }
    .running .test-icon {
      background: #3b82f6;
      color: #fff;
      animation: spin 1s linear infinite;
    }
    .success .test-icon {
      background: #10b981;
      color: #fff;
    }
    .fail .test-icon {
      background: #ef4444;
      color: #fff;
    }
    .test-name {
      flex-grow: 1;
      font-size: 14.5px;
      font-weight: 500;
    }
    .test-duration {
      font-size: 12px;
      color: #9ca3af;
    }
    .test-error {
      font-size: 12.5px;
      color: #fca5a5;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed rgba(239, 68, 68, 0.2);
      line-height: 1.4;
    }
    .test-footer {
      background: #111827;
      padding: 16px 24px;
      border-top: 1px solid #374151;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-summary {
      font-size: 14.5px;
      font-weight: 600;
    }
    .test-summary.pass { color: #10b981; }
    .test-summary.fail { color: #ef4444; }
    .test-btn {
      background: #fbbf24;
      color: #111827;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .test-btn:hover {
      opacity: 0.9;
    }
    .test-progress-bar {
      height: 4px;
      background: #374151;
      width: 100%;
    }
    .test-progress-fill {
      height: 100%;
      background: #fbbf24;
      width: 0%;
      transition: width 0.3s;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // Helper asersi & utilitas
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || "Asersi gagal");
    }
  }

  function assertEquals(expected, actual, message) {
    if (expected !== actual) {
      throw new Error(`${message || "Asersi gagal"}: diharapkan '${expected}', tetapi mendapatkan '${actual}'`);
    }
  }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Definisi Pengujian
  const testSuite = [
    {
      id: "nav-tab-test",
      name: "Uji Navigasi & Tab Halaman",
      fn: async () => {
        // Pindah ke Dashboard
        switchTab('dashboard');
        await sleep(150);
        assert(document.getElementById('mod-dashboard').classList.contains('active'), "Tab Dashboard harus aktif");

        // Pindah ke IBPPR
        switchTab('ibppr');
        await sleep(150);
        assert(document.getElementById('mod-ibppr').classList.contains('active'), "Tab IBPPR harus aktif");

        // Pindah ke JSA
        switchTab('jsa');
        await sleep(150);
        assert(document.getElementById('mod-jsa').classList.contains('active'), "Tab JSA harus aktif");

        // Pindah ke Laporan
        switchTab('laporan');
        await sleep(150);
        assert(document.getElementById('mod-laporan').classList.contains('active'), "Tab Laporan Harian harus aktif");

        // Pindah ke JSA Log
        switchTab('jsa-log');
        await sleep(150);
        assert(document.getElementById('mod-jsa-log').classList.contains('active'), "Tab JSA Log harus aktif");
      }
    },
    {
      id: "validation-test",
      name: "Uji Validasi Formulir & Highlight Field-error",
      fn: async () => {
        switchTab('laporan');
        await sleep(150);

        // Reset form dengan auto-approve confirm dialog
        const originalConfirm = confirmDialog.show;
        confirmDialog.show = (title, msg, cb) => cb();
        laporan.reset();
        confirmDialog.show = originalConfirm;

        // Submit form kosong untuk memicu error
        await laporan.submit();
        await sleep(150);

        // Verifikasi highlight error merah pada input wajib No. Laporan
        const noLapor = document.getElementById("laporan-noLaporan");
        const parent = noLapor.parentElement;
        assert(parent.classList.contains("field-error"), "Kolom wajib kosong harus memiliki kelas CSS field-error");

        // Verifikasi Toast pesan kesalahan tampil
        const toastMsg = document.getElementById("app-toast-msg").textContent;
        assert(toastMsg.includes("Mohon lengkapi semua kolom wajib"), "Pesan toast error validasi wajib ditampilkan");
      }
    },
    {
      id: "draft-test",
      name: "Uji Draft Laporan Harian (Save & Load JSON)",
      fn: async () => {
        switchTab('laporan');
        await sleep(150);

        const originalConfirm = confirmDialog.show;
        confirmDialog.show = (title, msg, cb) => cb();
        laporan.reset();

        // Isi form dengan mock data
        document.getElementById("laporan-noLaporan").value = "LH/TEST/2026/088";
        document.getElementById("laporan-tanggal").value = "2026-06-26";
        document.getElementById("laporan-pengawas").value = "Agus Prasetyo";
        document.getElementById("laporan-lokasi").value = "Area Kilang Pertamina";
        document.getElementById("laporan-cuaca").value = "Berawan";
        document.getElementById("laporan-jumlahPekerja").value = "30";
        document.getElementById("laporan-jamMulai").value = "08:00";
        document.getElementById("laporan-jamSelesai").value = "17:00";
        document.getElementById("laporan-deskripsiPekerjaan").value = "Pembersihan tangki minyak mentah.";
        document.getElementById("laporan-persenProgres").value = 45;
        document.getElementById("laporan-temuanK3").value = "Ceceran oli di walkway dekat tangki B.";
        document.getElementById("laporan-tindakanKoreksi").value = "Ditaburi pasir absorbent segera.";
        document.getElementById("laporan-alat").value = "Vacuum truck, blower, hazmat suit";
        document.getElementById("laporan-material").value = "Pasir absorbent, degreaser";

        // Mock downloadJSON untuk menangkap draft
        let capturedDraft = null;
        window.downloadJSON = (filename, data) => {
          capturedDraft = data;
        };

        laporan.saveDraft();
        assert(capturedDraft !== null, "Draft JSON harus berhasil disimpan/didownload");
        assertEquals("LAPORAN", capturedDraft.modul, "Tipe modul draft harus LAPORAN");
        assertEquals("LH/TEST/2026/088", capturedDraft.payload.noLaporan, "Nomor laporan dalam draft harus tepat");

        // Reset form
        laporan.reset();
        assertEquals("", document.getElementById("laporan-noLaporan").value, "Nomor laporan harus kosong setelah reset");

        // Muat draft kembali
        laporan.loadDraft(capturedDraft);
        await sleep(150);

        // Verifikasi kecocokan data setelah restorasi
        assertEquals("LH/TEST/2026/088", document.getElementById("laporan-noLaporan").value, "No Laporan setelah restore salah");
        assertEquals("2026-06-26", document.getElementById("laporan-tanggal").value, "Tanggal setelah restore salah");
        assertEquals("Agus Prasetyo", document.getElementById("laporan-pengawas").value, "Pengawas setelah restore salah");
        assertEquals("Area Kilang Pertamina", document.getElementById("laporan-lokasi").value, "Lokasi setelah restore salah");
        assertEquals("Berawan", document.getElementById("laporan-cuaca").value, "Cuaca setelah restore salah");
        assertEquals("30", document.getElementById("laporan-jumlahPekerja").value, "Jumlah Pekerja setelah restore salah");
        assertEquals("08:00", document.getElementById("laporan-jamMulai").value, "Jam Mulai setelah restore salah");
        assertEquals("17:00", document.getElementById("laporan-jamSelesai").value, "Jam Selesai setelah restore salah");
        assertEquals("Pembersihan tangki minyak mentah.", document.getElementById("laporan-deskripsiPekerjaan").value, "Deskripsi setelah restore salah");
        assertEquals("45", document.getElementById("laporan-persenProgres").value, "Progres setelah restore salah");
        assertEquals("Ceceran oli di walkway dekat tangki B.", document.getElementById("laporan-temuanK3").value, "Temuan K3 setelah restore salah");
        assertEquals("Ditaburi pasir absorbent segera.", document.getElementById("laporan-tindakanKoreksi").value, "Tindakan setelah restore salah");
        assertEquals("Vacuum truck, blower, hazmat suit", document.getElementById("laporan-alat").value, "Alat setelah restore salah");
        assertEquals("Pasir absorbent, degreaser", document.getElementById("laporan-material").value, "Material setelah restore salah");

        confirmDialog.show = originalConfirm;
      }
    },
    {
      id: "pdf-test",
      name: "Uji Integritas Pembuat PDF (JSA, IBPPR, Laporan)",
      fn: async () => {
        // Intersepsi fungsi save pdf agar tidak membuka download prompt
        const originalSave = window.jspdf.jsPDF.prototype.save;
        let pdfName = null;
        window.jspdf.jsPDF.prototype.save = function(name) {
          pdfName = name;
        };

        // 1. Ekspor Laporan PDF
        const laporanPayload = {
          noLaporan: "LH-TEST-123",
          tanggal: "2026-06-26",
          pengawas: "Budi Santoso",
          lokasi: "Area Proyek C",
          cuaca: "Hujan",
          deskripsiPekerjaan: "Pemasangan tiang pancang baja.",
          jumlahPekerja: 24,
          jamMulai: "07:30",
          jamSelesai: "16:30",
          persenProgres: 60,
          temuanK3: "Pekerja tidak memakai sarung tangan.",
          tindakanKoreksi: "Diberikan sarung tangan baru.",
          alat: "Mobile crane, generator",
          material: "Tiang baja H-beam"
        };
        await exportLaporanPDF(laporanPayload, "Laporan_Test.pdf");
        assert(pdfName === "Laporan_Test.pdf", "exportLaporanPDF gagal membuat file PDF");
        pdfName = null;

        // 2. Ekspor JSA PDF
        const jsaPayload = {
          modul: "JSA",
          payload: {
            noFormJSA: "JSA-TEST-1",
            tanggal: "2026-06-26",
            jenisPekerjaan: "Bekerja di Ketinggian",
            lokasi: "Tower Crane A",
            perusahaan: "PT Konstruksi Utama",
            penanggungjawab: "Supardi",
            apd: ["Helm proyek", "Sepatu safety", "Safety harness"],
            pelaksana: ["Soni", "Dedi"],
            steps: [
              { id: 1, langkah: "Naik tangga tower", bahaya: "Pekerja terpeleset", akibat: "Terjatuh, cidera berat", pengendalian: "Gunakan double lanyard harness dengan benar" }
            ]
          }
        };
        await exportJSAPDF(jsaPayload, "JSA_Test.pdf");
        assert(pdfName === "JSA_Test.pdf", "exportJSAPDF gagal membuat file PDF");
        pdfName = null;

        // 3. Ekspor IBPPR PDF
        const ibpprPayload = {
          modul: "IBPPR",
          payload: {
            noFormIBPPR: "IBPPR-TEST-1",
            tanggal: "2026-06-26",
            jenisPekerjaan: "Pengelasan pipa gas",
            lokasi: "Yard 2",
            perusahaan: "PT Mega Indah",
            pengawas: "Mulyono",
            rows: [
              { id: 1, aktivitas: "Pengelasan", bahaya: "Percikan api", akibat: "Kebakaran, iritasi mata", resikoAwal: 8, pengendalian: "Pasang welding screen dan pakai face shield", resikoSisa: 2 }
            ]
          }
        };
        await exportIBPPRPDF(ibpprPayload, "IBPPR_Test.pdf");
        assert(pdfName === "IBPPR_Test.pdf", "exportIBPPRPDF gagal membuat file PDF");

        window.jspdf.jsPDF.prototype.save = originalSave;
      }
    },
    {
      id: "offline-test",
      name: "Uji Antrean Offline-First & Indikator Status",
      fn: async () => {
        const originalApiCall = window.apiCall;
        
        // Menerapkan mock API gagal (koneksi putus)
        window.apiCall = async () => {
          throw new Error("Jaringan gagal koneksi");
        };

        const offlineKey = "sk_jsa_offline_queue";
        localStorage.removeItem(offlineKey);

        switchTab('jsa');
        await sleep(150);

        const originalConfirm = confirmDialog.show;
        confirmDialog.show = (title, msg, cb) => cb();
        jsa.reset();

        // Isi data minimal JSA
        document.getElementById("jsa-noForm").value = "JSA-TEST-OFFLINE";
        document.getElementById("jsa-tanggal").value = "2026-06-26";
        document.getElementById("jsa-jenisPekerjaan").value = "Tes Offline-First";
        document.getElementById("jsa-lokasi").value = "Sistem Lokal";
        document.getElementById("jsa-perusahaan").value = "Testing Unit";
        document.getElementById("jsa-penanggungjawab").value = "Tester";
        jsa.setSteps([
          { id: 1, langkah: "Tes", bahaya: "Bahaya", akibat: "Akibat", pengendalian: "Koreksi" }
        ]);

        // Submit form
        await jsa.submit();
        await sleep(250);

        // Pastikan masuk antrean localstorage offline
        const queue = JSON.parse(localStorage.getItem(offlineKey)) || [];
        assert(queue.length > 0, "Submit saat gagal jaringan harus masuk ke antrean offline localStorage");
        assertEquals("JSA-TEST-OFFLINE", queue[0].payload.noFormJSA, "Data antrean offline tidak cocok");

        // Pastikan status indikator sinkronisasi di topbar menunjukkan status offline/gagal
        const syncText = document.getElementById("sync-text").textContent;
        assert(syncText.includes("Offline") || syncText.includes("Gagal"), "Indikator topbar harus merespons status offline/gagal");

        // Hapus antrean & restore
        localStorage.removeItem(offlineKey);
        confirmDialog.show = originalConfirm;
        window.apiCall = originalApiCall;

        if (typeof syncManager !== "undefined") {
          syncManager.updateIndicator();
        }
      }
    },
    {
      id: "session-test",
      name: "Uji Pemulihan Sesi (Session Recovery)",
      fn: async () => {
        switchTab('laporan');
        await sleep(150);

        const originalConfirm = confirmDialog.show;
        confirmDialog.show = (title, msg, cb) => cb();
        laporan.reset();

        // Tulis nilai pada input
        document.getElementById("laporan-noLaporan").value = "LH-TEST-SESI-AKTIF";
        document.getElementById("laporan-pengawas").value = "Ahli K3";
        
        // Simpan sesi manual
        if (typeof session !== "undefined") {
          session.save();
        }

        // Hapus input
        document.getElementById("laporan-noLaporan").value = "";
        document.getElementById("laporan-pengawas").value = "";

        // Pulihkan sesi
        if (typeof session !== "undefined") {
          session.restore();
        }
        await sleep(150);

        // Verifikasi hasil
        assertEquals("LH-TEST-SESI-AKTIF", document.getElementById("laporan-noLaporan").value, "Gagal memulihkan No Laporan dari session storage");
        assertEquals("Ahli K3", document.getElementById("laporan-pengawas").value, "Gagal memulihkan Pengawas dari session storage");

        // Bersihkan
        sessionStorage.removeItem("sk_draft_laporan");
        confirmDialog.show = originalConfirm;
      }
    }
  ];

  // Inisialisasi UI Test Runner & Menjalankan Tes
  async function startRunner() {
    // Sisipkan CSS
    const styleEl = document.createElement("style");
    styleEl.innerHTML = TEST_CSS;
    document.head.appendChild(styleEl);

    // Bangun DOM
    const overlay = document.createElement("div");
    overlay.id = "test-runner-overlay";
    overlay.innerHTML = `
      <div class="test-container">
        <div class="test-header">
          <h2>SiKerja Test Console</h2>
          <span class="test-duration" id="runner-timer">Menyiapkan...</span>
        </div>
        <div class="test-progress-bar">
          <div class="test-progress-fill" id="runner-progress"></div>
        </div>
        <div class="test-body" id="runner-body"></div>
        <div class="test-footer">
          <div class="test-summary" id="runner-summary">Menjalankan pengujian otomatis...</div>
          <button class="test-btn" id="runner-close-btn" style="display:none" onclick="document.getElementById('test-runner-overlay').remove()">Tutup Konsol</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const bodyEl = document.getElementById("runner-body");
    const progressEl = document.getElementById("runner-progress");
    const summaryEl = document.getElementById("runner-summary");
    const closeBtn = document.getElementById("runner-close-btn");
    const timerEl = document.getElementById("runner-timer");

    // Tulis daftar tes di awal
    testSuite.forEach(test => {
      const item = document.createElement("div");
      item.id = test.id;
      item.className = "test-item";
      item.innerHTML = `
        <div class="test-item-row">
          <div class="test-icon">⏳</div>
          <div class="test-name">${test.name}</div>
          <div class="test-duration" id="dur-${test.id}">-</div>
        </div>
        <div class="test-error" id="err-${test.id}" style="display:none"></div>
      `;
      bodyEl.appendChild(item);
    });

    const report = {
      total: testSuite.length,
      passed: 0,
      failed: 0,
      duration: 0,
      details: []
    };

    const startTime = performance.now();
    timerEl.textContent = "Sedang Menguji...";

    // Jalankan setiap tes sekuensial
    for (let i = 0; i < testSuite.length; i++) {
      const test = testSuite[i];
      const itemEl = document.getElementById(test.id);
      const iconEl = itemEl.querySelector(".test-icon");
      const durEl = document.getElementById("dur-" + test.id);
      const errEl = document.getElementById("err-" + test.id);

      itemEl.className = "test-item running";
      iconEl.textContent = "🌀";

      const testStart = performance.now();
      let success = true;
      let errorMsg = null;

      try {
        await test.fn();
      } catch (err) {
        success = false;
        errorMsg = err.message || err.toString();
        console.error(`[TEST FAIL] ${test.name}:`, err);
      }

      const testDur = Math.round(performance.now() - testStart);
      durEl.textContent = `${testDur}ms`;

      if (success) {
        itemEl.className = "test-item success";
        iconEl.textContent = "✔";
        report.passed++;
      } else {
        itemEl.className = "test-item fail";
        iconEl.textContent = "✘";
        errEl.textContent = errorMsg;
        errEl.style.display = "block";
        report.failed++;
      }

      report.details.push({
        name: test.name,
        success: success,
        duration: testDur,
        error: errorMsg
      });

      // Update progress bar
      const progressPercent = Math.round(((i + 1) / testSuite.length) * 100);
      progressEl.style.width = progressPercent + "%";
      await sleep(150); // Jeda kecil visual
    }

    const totalDur = Math.round(performance.now() - startTime);
    report.duration = totalDur;
    timerEl.textContent = `Selesai dalam ${totalDur}ms`;

    // Tampilkan hasil di footer
    if (report.failed > 0) {
      summaryEl.textContent = `❌ ${report.passed} Lulus, ${report.failed} Gagal`;
      summaryEl.className = "test-summary fail";
    } else {
      summaryEl.textContent = `✅ Semua ${report.passed} Pengujian Lulus!`;
      summaryEl.className = "test-summary pass";
    }

    closeBtn.style.display = "block";

    // Kirim laporan kembali ke server Python
    try {
      await fetch("/api/test-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report)
      });
    } catch (e) {
      console.warn("Gagal mengirim hasil tes ke server runner CLI:", e);
    }
  }

  // Tunggu window load penuh untuk memicu test runner
  window.addEventListener("load", () => {
    setTimeout(startRunner, 800);
  });
})();
