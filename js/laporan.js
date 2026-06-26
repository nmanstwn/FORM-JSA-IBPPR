const laporan = (() => {
  // state fields
  const fields = [
    "noLaporan", "tanggal", "pengawas", "lokasi", "cuaca",
    "jumlahPekerja", "jamMulai", "jamSelesai", "deskripsiPekerjaan",
    "persenProgres", "temuanK3", "tindakanKoreksi", "alat", "material"
  ];

  function getFormValues() {
    const data = {};
    fields.forEach(f => {
      const el = document.getElementById("laporan-" + f);
      if (el) {
        if (f === "jumlahPekerja" || f === "persenProgres") {
          data[f] = parseFloat(el.value) || 0;
        } else {
          data[f] = el.value;
        }
      }
    });
    return data;
  }

  function setFormValues(data) {
    if (!data) return;
    fields.forEach(f => {
      const el = document.getElementById("laporan-" + f);
      if (el && data[f] !== undefined) {
        el.value = data[f];
      }
    });
    // sync range input with number input
    const rangeEl = document.getElementById("laporan-persenProgres-range");
    if (rangeEl && data.persenProgres !== undefined) {
      rangeEl.value = data.persenProgres;
    }
  }

  return {
    init() {
      // Set default date
      const dateEl = document.getElementById("laporan-tanggal");
      if (dateEl && !dateEl.value) {
        dateEl.value = new Date().toISOString().substring(0, 10);
      }
      
      // Auto-growing textarea
      const textareas = ["deskripsiPekerjaan", "temuanK3", "tindakanKoreksi", "alat", "material"];
      textareas.forEach(id => {
        const el = document.getElementById("laporan-" + id);
        if (el) {
          el.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = (this.scrollHeight) + "px";
          });
        }
      });
      
      // Update stats initially
      this.updateDashboardStats();
    },

    getPayload() {
      const val = getFormValues();
      return {
        modul: "LAPORAN",
        payload: {
          noLaporan: val.noLaporan,
          tanggal: val.tanggal,
          pengawas: val.pengawas,
          lokasi: val.lokasi,
          cuaca: val.cuaca,
          deskripsiPekerjaan: val.deskripsiPekerjaan,
          jumlahPekerja: val.jumlahPekerja,
          jamMulai: val.jamMulai,
          jamSelesai: val.jamSelesai,
          persenProgres: val.persenProgres,
          temuanK3: val.temuanK3,
          tindakanKoreksi: val.tindakanKoreksi,
          alat: val.alat,
          material: val.material
        }
      };
    },

    loadDraft(draft) {
      if (!draft || draft.modul !== "LAPORAN") return;
      setFormValues(draft.payload);
    },

    saveDraft() {
      const payload = this.getPayload();
      const val = payload.payload;
      if (!val.noLaporan) {
        showToast("⚠ No. Laporan wajib diisi untuk menyimpan draft");
        // Mark visual error
        const el = document.getElementById("laporan-noLaporan");
        if (el) {
          el.parentElement.classList.add("field-error");
          setTimeout(() => el.parentElement.classList.remove("field-error"), 3000);
        }
        return;
      }
      const filename = "draft-laporan-" + val.noLaporan.replace(/\//g, "-") + ".json";
      downloadJSON(filename, payload);
      showToast("✓ Draft Laporan Harian tersimpan: " + filename);
    },

    reset() {
      confirmDialog.show(
        "Reset Formulir Laporan Harian",
        "Apakah Anda yakin ingin menghapus seluruh data pada formulir Laporan Harian ini? Tindakan ini tidak dapat dibatalkan.",
        () => {
          fields.forEach(f => {
            const el = document.getElementById("laporan-" + f);
            if (el) {
              if (f === "cuaca") {
                el.value = "Cerah";
              } else if (f === "jumlahPekerja") {
                el.value = "";
              } else if (f === "persenProgres") {
                el.value = 0;
              } else if (f === "jamMulai") {
                el.value = "08:00";
              } else if (f === "jamSelesai") {
                el.value = "17:00";
              } else {
                el.value = "";
              }
            }
          });
          const rangeEl = document.getElementById("laporan-persenProgres-range");
          if (rangeEl) rangeEl.value = 0;
          
          const dateEl = document.getElementById("laporan-tanggal");
          if (dateEl) dateEl.value = new Date().toISOString().substring(0, 10);
          
          showToast("✓ Formulir Laporan Harian berhasil direset");
        }
      );
    },

    async submit() {
      const payload = this.getPayload();
      const val = payload.payload;
      
      // Validation
      let isValid = true;
      const requiredFields = ["noLaporan", "tanggal", "pengawas", "lokasi", "jumlahPekerja", "deskripsiPekerjaan"];
      
      requiredFields.forEach(f => {
        const el = document.getElementById("laporan-" + f);
        if (el) {
          if (!el.value || (f === "jumlahPekerja" && parseInt(el.value) < 0)) {
            el.parentElement.classList.add("field-error");
            isValid = false;
          } else {
            el.parentElement.classList.remove("field-error");
          }
        }
      });

      if (!isValid) {
        showToast("⚠ Mohon lengkapi semua kolom wajib dengan benar");
        return;
      }

      showProgressModal("Laporan");
      
      try {
        if (!navigator.onLine) {
          throw new Error("Koneksi offline");
        }
        
        updateProgressStep(0, "Menghubungkan ke spreadsheet Laporan Harian...");
        const res = await apiCall("add_laporan", { payload: val });
        
        if (res && res.success) {
          updateProgressStep(1, "Menyimpan data laporan...");
          setTimeout(() => {
            hideProgressModal();
            showToast("✓ Laporan Harian berhasil disimpan ke spreadsheet");
            
            // Increment local success count
            try {
              const current = parseInt(localStorage.getItem("sk_laporan_success_count")) || 0;
              localStorage.setItem("sk_laporan_success_count", current + 1);
            } catch (e) {}
            
            laporan.updateDashboardStats();
          }, 1000);
        } else {
          throw new Error((res && res.error) || "Gagal menyimpan laporan");
        }
      } catch (err) {
        console.warn("[Laporan] Gagal simpan, masukkan ke antrean offline:", err);
        updateProgressStep(0, "Koneksi gagal. Menyimpan ke antrean offline...");
        
        if (typeof syncManager !== "undefined") {
          syncManager.queueOffline("add_laporan", { payload: val, _payload: payload });
          setTimeout(() => {
            hideProgressModal();
            showToast("✓ Tersimpan di antrean offline. Akan disinkronkan saat online.");
            
            // Increment local success count
            try {
              const current = parseInt(localStorage.getItem("sk_laporan_success_count")) || 0;
              localStorage.setItem("sk_laporan_success_count", current + 1);
            } catch (e) {}
            
            laporan.updateDashboardStats();
          }, 1000);
        } else {
          hideProgressModal();
          showToast("⚠ Gagal menyimpan: " + err.message);
        }
      }
    },

    downloadPDF() {
      const payload = this.getPayload();
      const val = payload.payload;
      if (!val.noLaporan) {
        showToast("⚠ No. Laporan wajib diisi untuk cetak PDF");
        return;
      }
      
      showProgressModal("Laporan");
      updateProgressStep(0, "Menyusun layout dokumen PDF...");
      
      setTimeout(() => {
        try {
          updateProgressStep(1, "Mengekspor Laporan Harian ke PDF...");
          exportLaporanPDF(val, "Laporan_Harian_" + val.noLaporan.replace(/\//g, "-") + ".pdf");
          hideProgressModal();
          showToast("✓ PDF Laporan Harian berhasil diunduh");
        } catch (e) {
          console.error(e);
          hideProgressModal();
          showToast("⚠ Gagal mengekspor PDF: " + e.message);
        }
      }, 800);
    },

    updateDashboardStats() {
      // Calculate stats for Dashboard
      const kpiTotalLaporan = document.getElementById("kpi-total-laporan");
      if (kpiTotalLaporan) {
        let count = 0;
        try {
          const lCount = localStorage.getItem("sk_laporan_success_count");
          count = parseInt(lCount) || 0;
        } catch (e) {}
        kpiTotalLaporan.textContent = count;
      }
    }
  };
})();
