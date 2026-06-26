"use strict";

      /* -------------------------------------------------------------------------
       AUTO-RESIZE TEXTAREA - tinggi menyesuaikan isi, tanpa scroll
       ------------------------------------------------------------------------- */
      function autoResize(el) {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }
      document.addEventListener("input", (e) => {
        if (e.target.tagName === "TEXTAREA") autoResize(e.target);
      });
      function initTextareaHeights() {
        document.querySelectorAll("textarea").forEach(autoResize);
      }

      /* -------------------------------------------------------------------------
       KONSTANTA & KONFIGURASI
       ------------------------------------------------------------------------- */
      // GAS_URL didefinisikan secara global di index.html agar mudah dikonfigurasi oleh pengguna.

      // Daftar APD standar konstruksi (JSA sheet, rows A7:H15)
      const APD_LIST = [
        "Helm proyek",
        "Sepatu safety",
        "Rompi K3",
        "Sarung tangan",
        "Kacamata safety",
        "Masker debu",
        "Ear plug",
        "Safety harness",
      ];

      // Opsi tingkat resiko berdasarkan nilai Akibat × Peluang (IBPR matrix)
      // Rendah: 1-4 | Sedang: 5-9 | Tinggi: 10-16 | Ekstrem: 17-25
      const RISK_LEVELS = [
        { max: 4, label: "Rendah", cls: "risk-rendah" },
        { max: 9, label: "Sedang", cls: "risk-sedang" },
        { max: 16, label: "Tinggi", cls: "risk-tinggi" },
        { max: 25, label: "Ekstrem", cls: "risk-ekstrem" },
      ];

      /* -------------------------------------------------------------------------
       CONFIRM DIALOG CUSTOM
       ------------------------------------------------------------------------- */
      const confirmDialog = (() => {
        let _cb = null;
        const overlay = () => document.getElementById("confirm-overlay");
        const box = () => document.getElementById("confirm-box");

        // ikon bawaan yang bisa dipilih lewat opts.icon ('reset' default, 'trash' untuk hapus)
        const ICONS = {
          reset:
            '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>',
          trash:
            '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
        };

        // show: dipertahankan kompatibel dengan pemanggilan lama show(title, msg, cb)
        // sekaligus menerima opts opsional sebagai argumen ke-4:
        //   { okLabel, cancelLabel, icon: 'reset'|'trash', danger: true }
        function show(title, msg, cb, opts) {
          opts = opts || {};
          document.getElementById("confirm-title").textContent = title;
          document.getElementById("confirm-msg").textContent = msg;

          const okBtn = document.getElementById("confirm-ok-btn");
          const cancelBtn = document.getElementById("confirm-cancel-btn");
          if (okBtn) okBtn.textContent = opts.okLabel || "Ya, Reset";
          if (cancelBtn) cancelBtn.textContent = opts.cancelLabel || "Batal";

          const iconKey = opts.icon || "reset";
          const iconSvg = document.getElementById("confirm-icon-svg");
          if (iconSvg) iconSvg.innerHTML = ICONS[iconKey] || ICONS.reset;

          _cb = cb;
          const ov = overlay();
          ov.style.display = "flex";
          requestAnimationFrame(() => {
            box().style.transform = "scale(1)";
            box().style.opacity = "1";
          });
        }
        function hide() {
          box().style.transform = "scale(0.95)";
          box().style.opacity = "0";
          setTimeout(() => {
            overlay().style.display = "none";
          }, 180);
        }
        return {
          show,
          ok() {
            hide();
            if (_cb) {
              _cb();
              _cb = null;
            }
          },
          cancel() {
            hide();
            _cb = null;
          },
        };
      })();

      /* -------------------------------------------------------------------------
       DOC META DIALOG - popup edit No. Dok / No. Rev / Tgl Terbit
       Mengubah DOC_META global yang dipakai semua sheet PDF (IBPPR, JSA, LOG)
       ------------------------------------------------------------------------- */
      const docMetaDialog = (() => {
        const overlay = () => document.getElementById("docmeta-overlay");
        const box = () => document.getElementById("docmeta-box");

        function renderTopbar() {
          document.getElementById("topbar-doc-meta-line1").textContent =
            DOC_META.noDok;
          document.getElementById("topbar-doc-meta-line2").textContent =
            "Rev." + DOC_META.noRev + " · " + DOC_META.tglTerbit;
        }

        function open() {
          document.getElementById("docmeta-noDok").value = DOC_META.noDok;
          document.getElementById("docmeta-noRev").value = DOC_META.noRev;
          document.getElementById("docmeta-tglTerbit").value =
            DOC_META.tglTerbit;
          const ov = overlay();
          ov.style.display = "flex";
          requestAnimationFrame(() => {
            box().style.transform = "scale(1)";
            box().style.opacity = "1";
          });
        }

        function hide() {
          box().style.transform = "scale(0.95)";
          box().style.opacity = "0";
          setTimeout(() => {
            overlay().style.display = "none";
          }, 180);
        }

        function save() {
          DOC_META = {
            noDok:
              document.getElementById("docmeta-noDok").value.trim() ||
              DOC_META.noDok,
            noRev:
              document.getElementById("docmeta-noRev").value.trim() ||
              DOC_META.noRev,
            tglTerbit:
              document.getElementById("docmeta-tglTerbit").value.trim() ||
              DOC_META.tglTerbit,
          };
          renderTopbar();
          hide();
          try {
            session.save();
          } catch (e) {}
          showToast(
            "✓ Info dokumen diperbarui - otomatis berlaku di PDF berikutnya",
          );
        }

        function cancel() {
          hide();
        }

        return { open, save, cancel, renderTopbar };
      })();

      /* -------------------------------------------------------------------------
       DIALOG NAMA PELAKSANA - popup input per-baris, tanpa batas jumlah
       ------------------------------------------------------------------------- */
      const pelaksanaDialog = (() => {
        const overlay = () => document.getElementById("pelaksana-overlay");
        const box = () => document.getElementById("pelaksana-box");
        let rowCount = 0;

        function addRow(value, focus) {
          const wrap = document.getElementById("pelaksana-inputs");
          const i = rowCount++;
          const row = document.createElement("div");
          row.id = "pelaksana-row-wrap-" + i;
          row.style.cssText = "display:flex;align-items:center;gap:8px";

          const num = document.createElement("span");
          num.id = "pelaksana-num-" + i;
          num.style.cssText =
            "font-size:13px;color:var(--ink-faint);width:22px;flex-shrink:0;text-align:right;font-family:var(--font-mono)";

          const inp = document.createElement("input");
          inp.type = "text";
          inp.id = "pelaksana-inp-" + i;
          inp.placeholder = "Nama pelaksana…";
          inp.value = value || "";
          inp.style.cssText =
            "flex:1;padding:9px 12px;border-radius:var(--r-sm);border:1.5px solid var(--line-strong);font-family:var(--font-body);font-size:13.5px;color:var(--ink);background:var(--paper-deep);outline:none;transition:border-color .15s";
          inp.addEventListener("focus", () => {
            inp.style.borderColor = "var(--amber)";
          });
          inp.addEventListener("blur", () => {
            inp.style.borderColor = "var(--line-strong)";
          });
          inp.addEventListener("input", updateCounter);
          inp.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              // jika ini baris terakhir, tambah baris baru
              const rows = document.querySelectorAll(
                '#pelaksana-inputs input[type="text"]',
              );
              const last = rows[rows.length - 1];
              if (inp === last) addRow("", true);
              else {
                const idx = Array.from(rows).indexOf(inp);
                if (rows[idx + 1]) rows[idx + 1].focus();
              }
            }
          });

          const del = document.createElement("button");
          del.type = "button";
          del.title = "Hapus baris ini";
          del.innerHTML = "&times;";
          del.style.cssText =
            "width:30px;height:30px;border-radius:50%;border:none;background:var(--paper-deep);color:var(--ink-faint);font-size:17px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;line-height:1;transition:background .15s,color .15s";
          del.addEventListener("mouseenter", () => {
            del.style.background = "var(--risk-extreme-bg)";
            del.style.color = "var(--risk-extreme)";
          });
          del.addEventListener("mouseleave", () => {
            del.style.background = "var(--paper-deep)";
            del.style.color = "var(--ink-faint)";
          });
          del.addEventListener("click", () => {
            row.remove();
            renumber();
            updateCounter();
          });

          row.appendChild(num);
          row.appendChild(inp);
          row.appendChild(del);
          wrap.appendChild(row);
          renumber();
          updateCounter();
          if (focus) inp.focus();
        }

        function renumber() {
          const rows = document.querySelectorAll("#pelaksana-inputs > div");
          rows.forEach((r, idx) => {
            const num = r.querySelector("span");
            if (num) num.textContent = idx + 1 + ".";
            const inp = r.querySelector("input");
            if (inp) inp.setAttribute("aria-label", "Nama pelaksana #" + (idx + 1));
            const del = r.querySelector("button");
            if (del) del.setAttribute("aria-label", "Hapus pelaksana #" + (idx + 1));
          });
        }

        function updateCounter() {
          const inputs = document.querySelectorAll(
            '#pelaksana-inputs input[type="text"]',
          );
          const filled = Array.from(inputs).filter((el) =>
            el.value.trim(),
          ).length;
          document.getElementById("pelaksana-counter").textContent =
            filled + " orang";
        }

        function getCurrentNames() {
          const raw = document.getElementById("jsa-namaPelaksana").value;
          return raw
            ? raw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
        }

        function buildInputs(names) {
          document.getElementById("pelaksana-inputs").innerHTML = "";
          rowCount = 0;
          const list = names.length ? names : [""];
          list.forEach((n) => addRow(n, false));
        }

        function open() {
          buildInputs(getCurrentNames());
          updateCounter();
          const ov = overlay();
          ov.style.display = "flex";
          requestAnimationFrame(() => {
            box().style.transform = "scale(1)";
            box().style.opacity = "1";
          });
          setTimeout(() => {
            const first = document.querySelector(
              '#pelaksana-inputs input[type="text"]',
            );
            if (first) first.focus();
          }, 220);
        }

        function hide() {
          box().style.transform = "scale(0.95)";
          box().style.opacity = "0";
          setTimeout(() => {
            overlay().style.display = "none";
          }, 180);
        }

        function close() {
          hide();
        }

        function save() {
          const inputs = document.querySelectorAll(
            '#pelaksana-inputs input[type="text"]',
          );
          const names = Array.from(inputs)
            .map((el) => el.value.trim())
            .filter(Boolean);
          document.getElementById("jsa-namaPelaksana").value = names.join(", ");
          const preview = document.getElementById("jsa-namaPelaksana-preview");
          if (names.length) {
            preview.style.color = "var(--ink)";
            preview.innerHTML = names
              .map(
                (n) =>
                  `<span style="display:inline-block;background:var(--amber-soft);color:var(--amber-deep);border-radius:6px;padding:2px 9px;font-size:12.5px;font-weight:600;margin:2px 3px 2px 0">${escHTML(n)}</span>`,
              )
              .join("");
          } else {
            preview.style.color = "var(--ink-faint)";
            preview.textContent = "Belum ada nama pelaksana…";
          }
          hide();
          showToast(
            "✓ " +
              (names.length
                ? names.length + " pelaksana disimpan"
                : "Nama pelaksana dikosongkan"),
          );
        }

        function addRowPublic() {
          addRow("", true);
        }

        function onOverlayClick(e) {
          if (e.target === overlay()) hide();
        }

        return { open, close, save, onOverlayClick, addRow: addRowPublic };
      })();

      /* -------------------------------------------------------------------------
       SYNC PREVIEW NAMA PELAKSANA - dipanggil setelah load draft / session restore
       ------------------------------------------------------------------------- */
      function syncPelaksanaPreview() {
        const hidden = document.getElementById("jsa-namaPelaksana");
        const preview = document.getElementById("jsa-namaPelaksana-preview");
        if (!hidden || !preview) return;
        const raw = hidden.value.trim();
        const names = raw
          ? raw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        if (names.length) {
          preview.style.color = "var(--ink)";
          preview.innerHTML = names
            .map(
              (n) =>
                `<span style="display:inline-block;background:var(--amber-soft);color:var(--amber-deep);border-radius:6px;padding:2px 9px;font-size:12.5px;font-weight:600;margin:2px 3px 2px 0">${escHTML(n)}</span>`,
            )
            .join("");
        } else {
          preview.style.color = "var(--ink-faint)";
          preview.textContent = "Belum ada nama pelaksana…";
        }
      }

      /* -------------------------------------------------------------------------
       NAVIGASI TAB
       ------------------------------------------------------------------------- */
      function switchTab(tab) {
        document
          .querySelectorAll(".module")
          .forEach((m) => m.classList.remove("active"));
        document
          .querySelectorAll(".tab-btn")
          .forEach((b) => {
            b.classList.remove("is-active");
            b.setAttribute("aria-selected", "false");
          });
        document.getElementById("mod-" + tab).classList.add("active");
        const activeBtn = document.getElementById("tab-" + tab);
        if (activeBtn) {
          activeBtn.classList.add("is-active");
          activeBtn.setAttribute("aria-selected", "true");
        }
        try {
          sessionStorage.setItem("sk_activeTab", tab);
        } catch (e) {}
      }

      /* -------------------------------------------------------------------------
       TOAST NOTIFIKASI
       ------------------------------------------------------------------------- */
      let toastTimer;
      function showToast(msg, duration = 2800) {
        const el = document.getElementById("app-toast");
        document.getElementById("app-toast-msg").textContent = msg;
        el.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove("show"), duration);
      }

      /* -------------------------------------------------------------------------
       UTILITAS
       ------------------------------------------------------------------------- */
      // Hitung nilai resiko dari Paparan × Peluang (akibat kini teks bebas)
      function calcNilai(paparan, peluang) {
        const a = parseInt(paparan) || 0;
        const p = parseInt(peluang) || 0;
        return a * p;
      }
      // Tentukan tingkat resiko dari nilai
      function getTingkatResiko(nilai) {
        for (const r of RISK_LEVELS) {
          if (nilai <= r.max) return r;
        }
        return { label: "-", cls: "risk-none" };
      }
      // Render chip resiko (HTML string)
      function riskChip(nilai) {
        if (!nilai)
          return `<span class="risk-chip risk-none"><span class="dot"></span>-</span>`;
        const r = getTingkatResiko(nilai);
        return `<span class="risk-chip ${r.cls}"><span class="dot"></span>${r.label} (${nilai})</span>`;
      }
      // Format tanggal → "18 Jun 2026"
      function fmtDate(d) {
        if (!d) return "-";
        if (!d || String(d).trim() === "") return "-";
        const s = String(d).trim();
        const dt = new Date(s + "T00:00:00");
        if (isNaN(dt.getTime())) return "-";
        return dt.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      // Chip resiko dari string label (untuk JSA LOG)
      function riskChipStr(label) {
        const map = {
          Rendah: "risk-rendah",
          Sedang: "risk-sedang",
          Tinggi: "risk-tinggi",
          Ekstrem: "risk-ekstrem",
        };
        const cls = map[label] || "risk-none";
        return `<span class="risk-chip ${cls}"><span class="dot"></span>${label || "-"}</span>`;
      }

      /* =========================================================================
       MODUL IBPPR
       ========================================================================= */
      /* =========================================================================
       SIMPAN DRAFT - download JSON untuk load otomatis nanti
       ========================================================================= */
      function downloadJSON(filename, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      function loadDraftFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const draft = JSON.parse(e.target.result);
            if (draft.modul === "IBPPR") {
              ibppr.loadDraft(draft);
              switchTab("ibppr");
              showToast("✓ Draft IBPPR berhasil dimuat");
            } else if (draft.modul === "JSA") {
              jsa.loadDraft(draft);
              switchTab("jsa");
              showToast("✓ Draft JSA berhasil dimuat");
            } else if (draft.modul === "LAPORAN") {
              laporan.loadDraft(draft);
              switchTab("laporan");
              showToast("✓ Draft Laporan Harian berhasil dimuat");
            } else {
              showToast("⚠ Format draft tidak dikenal");
            }
          } catch (err) {
            showToast("⚠ File JSON tidak valid");
          }
        };
        reader.readAsText(file);
        // reset input agar bisa upload file yang sama lagi
        event.target.value = "";
      }

      /* =========================================================================
       KONFIRMASI UPDATE JSA LOG (saat Generate di JSA)
       ========================================================================= */
      const jsaLogConfirm = (() => {
        let _cb = null;
        const overlay = () =>
          document.getElementById("jsa-log-confirm-overlay");
        const box = () => document.getElementById("jsa-log-confirm-box");
        function show(cb) {
          _cb = cb;
          overlay().style.display = "flex";
          requestAnimationFrame(() => {
            box().style.transform = "scale(1)";
            box().style.opacity = "1";
          });
        }
        function hide() {
          box().style.transform = "scale(0.95)";
          box().style.opacity = "0";
          setTimeout(() => {
            overlay().style.display = "none";
          }, 180);
        }
        return {
          show,
          yes() {
            hide();
            if (_cb) {
              _cb(true);
              _cb = null;
            }
          },
          skip() {
            hide();
            if (_cb) {
              _cb(false);
              _cb = null;
            }
          },
        };
      })();

      const generateModal = (() => {
        let _docHTML = null;
        let _baseName = "dokumen";
        let _uploadPulseTimer = null; // [BARU] interval animasi progress saat menunggu upload spreadsheet

        const STEPS_IBPPR = [
          "Validasi data form…",
          "Menyusun tabel aktivitas & bahaya…",
          "Menghitung nilai & tingkat resiko…",
          "Menyusun layout dokumen IBPPR…",
          "Mengisi data ke format tabel resmi…",
          "Finalisasi dokumen…",
        ];
        const STEPS_JSA = [
          "Validasi data form…",
          "Menyusun header JSA…",
          "Memproses daftar APD…",
          "Menyusun urutan langkah pekerjaan…",
          "Mengisi data ke format tabel resmi…",
          "Finalisasi dokumen…",
        ];
        const STEPS_LOG = [
          "Mengambil data riwayat JSA…",
          "Mengurutkan baris arsip…",
          "Menyusun layout dokumen JSA LOG…",
          "Mengisi data ke format tabel resmi…",
          "Finalisasi dokumen…",
        ];

        // setStepLabel: ganti teks satu baris #gen-step-label dengan transisi
        // fade halus (fade-out singkat, ganti teks, fade-in) - menggantikan
        // pendekatan lama yang menumpuk seluruh step sebagai daftar checklist.
        function setStepLabel(text) {
          const el = document.getElementById("gen-step-label");
          if (!el) return;
          el.style.opacity = "0";
          setTimeout(() => {
            el.textContent = text;
            el.style.opacity = "1";
          }, 160);
        }

        // [BARU] openUploading: tampilkan overlay SEGERA saat mulai mengirim data
        // ke spreadsheet (sebelum await selesai), supaya tidak ada jeda "layar
        // kosong" antara modal konfirmasi "Ya, Update" tertutup dan modal generate
        // PDF terbuka. Progress bar berdenyut (indeterminate) karena durasi proses
        // sebenarnya tidak diketahui - beda dengan open() yang animasinya
        // bertahap/simulatif karena dokumennya sudah pasti siap.
        function openUploading(modulLabel) {
          stopUploadingPulse();
          document.getElementById("gen-title").textContent = "Mengunggah…";
          document.getElementById("gen-subtitle").textContent =
            "Menyimpan data ke spreadsheet JSA LOG";
          const stepLabelEl = document.getElementById("gen-step-label");
          if (stepLabelEl) {
            stepLabelEl.style.opacity = "1";
            stepLabelEl.textContent = "Mengirim data ke server…";
          }
          document.getElementById("gen-pct").textContent = "";
          document.getElementById("gen-done-actions").style.display = "none";
          document.getElementById("gen-progress-wrap").style.display = "block";
          document.getElementById("gen-preview-wrap").style.display = "none";

          document.getElementById("gen-icon-bolt").style.display = "";
          document.getElementById("gen-icon-check").style.display = "none";
          document.getElementById("gen-icon-wrap").style.background =
            "var(--amber-soft)";

          const overlay = document.getElementById("generate-overlay");
          const box = document.getElementById("generate-box");
          overlay.style.display = "flex";
          requestAnimationFrame(() => {
            box.style.transform = "scale(1)";
            box.style.opacity = "1";
          });

          const bar = document.getElementById("gen-progress-bar");
          // [DIUBAH] animasi loading SEARAH SAJA (tidak pernah mundur) selama
          // menunggu durasi upload yang tidak diketahui: bar naik terus mendekati
          // 92% dengan langkah yang makin mengecil (mirip pola "indeterminate"
          // umum), lalu DITAHAN di situ sampai upload sungguhan selesai dan
          // finishUploadingPulse() menuntaskannya ke 100%. Tidak ada lagi
          // pengurangan width di titik manapun.
          bar.style.transition = "width 0.6s ease-out";
          let pct = 10;
          bar.style.width = pct + "%";
          _uploadPulseTimer = setInterval(() => {
            const remaining = 92 - pct;
            if (remaining <= 0.5) return; // sudah mentok di plafon, tahan di sana
            pct += remaining * 0.18; // makin dekat plafon, makin kecil langkahnya
            bar.style.width = pct + "%";
          }, 550);
        }

        function stopUploadingPulse() {
          if (_uploadPulseTimer) {
            clearInterval(_uploadPulseTimer);
            _uploadPulseTimer = null;
          }
          const bar = document.getElementById("gen-progress-bar");
          if (bar) bar.style.transition = "width 0.4s ease";
        }

        // [BARU] finishUploadingPulse: hentikan denyut upload dan TUNTASKAN bar
        // ke 100% terlebih dahulu (bukan langsung reset ke 0%), supaya transisi
        // ke fase "Generating…" terasa berkelanjutan/maju, bukan mundur dulu
        // baru maju lagi. Mengembalikan Promise yang resolve setelah animasi
        // "tuntas 100%" selesai, sehingga open() bisa dipanggil setelahnya.
        function finishUploadingPulse() {
          return new Promise((resolve) => {
            stopUploadingPulse();
            const bar = document.getElementById("gen-progress-bar");
            const pctEl = document.getElementById("gen-pct");
            if (!bar) {
              resolve();
              return;
            }
            bar.style.transition = "width 0.35s ease";
            bar.style.width = "100%";
            if (pctEl) pctEl.textContent = "";
            const stepLabelEl = document.getElementById("gen-step-label");
            if (stepLabelEl) {
              stepLabelEl.style.opacity = "1";
              stepLabelEl.textContent = "Data tersimpan…";
            }
            // beri waktu agar bar benar-benar terlihat penuh sebelum direset
            setTimeout(resolve, 380);
          });
        }

        let _modulLabel = "";
        let _payload = null;
        async function open(modulLabel, filename, docHTML, payload) {
          _payload = payload || null;
          // [DIUBAH] jika sebelumnya ada animasi pulsa upload yang masih berjalan,
          // tuntaskan dulu sampai 100% supaya transisi ke fase generate berikutnya
          // terlihat maju terus (bukan mundur lalu maju lagi).
          if (_uploadPulseTimer) {
            await finishUploadingPulse();
          } else {
            stopUploadingPulse();
          }
          _baseName = (filename || "dokumen.pdf").replace(/\.(pdf|html)$/i, "");
          _docHTML = docHTML || null;
          _modulLabel = modulLabel || "";
          const steps =
            modulLabel === "JSA"
              ? STEPS_JSA
              : modulLabel === "LOG"
                ? STEPS_LOG
                : STEPS_IBPPR;

          document.getElementById("gen-title").textContent = "Generating…";
          document.getElementById("gen-subtitle").textContent =
            "Menyusun dokumen " + modulLabel;
          const bar = document.getElementById("gen-progress-bar");
          // [DIUBAH] reset ke 0% tanpa transisi (instan) tepat sebelum fase baru
          // dimulai, supaya tidak terlihat sebagai animasi "mundur" yang sempat
          // terlihat oleh mata - bar baru "muncul" kosong lalu langsung maju lagi.
          bar.style.transition = "none";
          bar.style.width = "0%";
          // force reflow supaya transition:none benar-benar diterapkan dulu
          void bar.offsetWidth;
          bar.style.transition = "width 0.4s ease-in-out";
          document.getElementById("gen-pct").textContent = "0%";
          const stepLabelEl = document.getElementById("gen-step-label");
          if (stepLabelEl) {
            stepLabelEl.style.opacity = "1";
            stepLabelEl.textContent = steps[0];
          }
          document.getElementById("gen-done-actions").style.display = "none";
          document.getElementById("gen-progress-wrap").style.display = "block";
          document.getElementById("gen-preview-wrap").style.display = "none";
          const pdfBtn = document.getElementById("gen-btn-pdf");
          if (pdfBtn) pdfBtn.disabled = false;
          const pdfLabel = document.getElementById("gen-btn-pdf-label");
          if (pdfLabel) pdfLabel.textContent = "Download PDF";
          const frame = document.getElementById("gen-preview-frame");
          if (frame) frame.srcdoc = "";

          // ikon
          document.getElementById("gen-icon-bolt").style.display = "";
          document.getElementById("gen-icon-check").style.display = "none";
          document.getElementById("gen-icon-wrap").style.background =
            "var(--amber-soft)";

          const overlay = document.getElementById("generate-overlay");
          const box = document.getElementById("generate-box");
          overlay.style.display = "flex";
          requestAnimationFrame(() => {
            box.style.transform = "scale(1)";
            box.style.opacity = "1";
          });

          // simulasi progres bertahap (proses sesungguhnya - penyusunan tabel -
          // sudah selesai sebelum modal dibuka; ini hanya animasi UX)
          let step = 0;
          const total = steps.length;
          function tick() {
            if (step >= total) {
              // selesai
              document.getElementById("gen-progress-bar").style.width = "100%";
              document.getElementById("gen-pct").textContent = "100%";
              setStepLabel("Selesai!");
              setTimeout(() => {
                document.getElementById("gen-title").textContent =
                  "Dokumen Siap!";
                document.getElementById("gen-subtitle").textContent =
                  "Data telah masuk ke format tabel " + modulLabel;
                document.getElementById("gen-icon-bolt").style.display = "none";
                document.getElementById("gen-icon-check").style.display = "";
                document.getElementById("gen-icon-wrap").style.background =
                  "var(--risk-low-bg)";
                document.getElementById("gen-progress-wrap").style.display =
                  "none";
                document.getElementById("gen-done-actions").style.display =
                  "flex";
                document.getElementById(
                  "gen-done-actions",
                ).style.flexDirection = "column";
                if (_docHTML) {
                  const frame = document.getElementById("gen-preview-frame");
                  if (frame) frame.srcdoc = _docHTML;
                  document.getElementById("gen-preview-wrap").style.display =
                    "block";
                }
              }, 350);
              return;
            }
            const pct = Math.round(((step + 1) / total) * 95);
            document.getElementById("gen-progress-bar").style.width = pct + "%";
            document.getElementById("gen-pct").textContent = pct + "%";
            setStepLabel(steps[step]);
            step++;
            // jeda acak 320–700ms per langkah (simulasi proses)
            setTimeout(tick, 320 + Math.random() * 380);
          }
          setTimeout(tick, 200);
        }

        return {
          open,
          openUploading, // [BARU] dipanggil sebelum await upload ke spreadsheet
          async downloadPDF() {
            if (_modulLabel === "JSA") {
              await exportJSAPDF(_payload, _baseName + ".pdf");
            } else if (_modulLabel === "IBPPR") {
              await exportIBPPRPDF(_payload, _baseName + ".pdf");
            } else {
              showToast("⚠ Modul tidak dikenal");
            }
          },
          close() {
            stopUploadingPulse(); // [BARU] jaga-jaga jika modal ditutup saat masih dalam fase upload
            const box = document.getElementById("generate-box");
            const overlay = document.getElementById("generate-overlay");
            box.style.transform = "scale(0.92)";
            box.style.opacity = "0";
            setTimeout(() => {
              overlay.style.display = "none";
            }, 220);
          },
        };
      })();
      function markFieldError(el, markEl) {
        const target = markEl || el;
        const fieldDiv = target.closest(".field") || target;
        fieldDiv.classList.add("field-error");
        const clear = () => {
          fieldDiv.classList.remove("field-error");
          el.removeEventListener("input", clear);
          el.removeEventListener("change", clear);
          el.removeEventListener("click", clear);
        };
        el.addEventListener("input", clear);
        el.addEventListener("change", clear);
        el.addEventListener("click", clear);
      }

      function clearAllErrors(scope) {
        scope
          .querySelectorAll(".field-error")
          .forEach((f) => f.classList.remove("field-error"));
      }

      function getFieldLabel(el) {
        // Cek apakah di dalam row modul IBPPR
        const ibpprCard = el.closest("#ibppr-rows-container .card");
        if (ibpprCard) {
          const numChip = ibpprCard.querySelector(".num-chip");
          const seq = numChip ? numChip.textContent.trim() : "?";
          const labelEl = el.closest(".field")?.querySelector("label");
          const name = labelEl ? labelEl.textContent.replace(/\*/g, "").trim() : "Kolom";
          return `${name} (Aktivitas #${seq})`;
        }
        
        // Cek apakah di dalam row modul JSA
        const jsaCard = el.closest("#jsa-steps-container .card");
        if (jsaCard) {
          const numChip = jsaCard.querySelector(".num-chip");
          const seq = numChip ? numChip.textContent.trim() : "?";
          const labelEl = el.closest(".field")?.querySelector("label");
          const name = labelEl ? labelEl.textContent.replace(/\*/g, "").trim() : "Kolom";
          return `${name} (Langkah #${seq})`;
        }
        
        // Default: ambil label dari pembungkus field terdekat
        const labelEl = el.closest(".field")?.querySelector("label");
        if (labelEl) {
          return labelEl.textContent.replace(/\*/g, "").trim();
        }
        
        return el.placeholder || el.id || "Kolom wajib";
      }

      // checks: array of { el, markEl?, isValid? }
      //   el      -> elemen sumber nilai (boleh hidden input / checkbox grup)
      //   markEl  -> elemen yang ditandai merah & di-scroll (default: el)
      //   isValid -> fungsi custom (el) => boolean; default: el.value tidak kosong
      function validateFields(checks) {
        let firstInvalidEl = null;
        let valid = true;
        let invalidLabels = [];
        checks.forEach(({ el, markEl, isValid }) => {
          if (!el) return;
          const ok = isValid ? isValid(el) : !!(el.value && el.value.trim());
          if (!ok) {
            valid = false;
            markFieldError(el, markEl);
            if (!firstInvalidEl) firstInvalidEl = markEl || el;
            const label = getFieldLabel(el);
            if (label && !invalidLabels.includes(label)) {
              invalidLabels.push(label);
            }
          }
        });
        return { valid, firstInvalidEl, invalidLabels };
      }

      function scrollToFirstError(el) {
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.focus(), 400);
      }

      /* =========================================================================
       SESSION PERSISTENCE - simpan & restore semua state saat refresh
       Menggunakan sessionStorage (bertahan selama tab browser terbuka).
       ========================================================================= */
      const session = (() => {
        const KEY = "sk_session_v1";

        function save() {
          try {
            // Scroll position
            const viewArea = document.querySelector(".view-area");
            const scrollTop = viewArea ? viewArea.scrollTop : 0;
            const ibpprHeader = {};
            ["noForm", "namaPekerjaan", "lokasi"].forEach((f) => {
              const el = document.getElementById("ibppr-" + f);
              if (el) ibpprHeader[f] = el.value;
            });

            // Kumpulkan baris IBPPR dari state
            const ibpprBaris = ibppr.getRows();

            // Kumpulkan semua field JSA header
            const jsaHeader = {};
            [
              "noJSA",
              "tanggal",
              "jenisPekerjaan",
              "pengawas",
              "namaPelaksana",
              "apdTambahan",
              "lokasi",
              "penanggungjawab",
            ].forEach((f) => {
              const el = document.getElementById("jsa-" + f);
              if (el) jsaHeader[f] = el.value;
            });
            const resEl = document.getElementById("jsa-resiko");
            if (resEl) jsaHeader.resiko = resEl.value;

            // APD checklist
            const apdChecked = [];
            APD_LIST.forEach((_, i) => {
              const el = document.getElementById("apd-" + i);
              if (el) apdChecked.push(el.checked);
            });

            // Langkah JSA dari state
            const jsaLangkah = jsa.getSteps();

            // Laporan Header fields
            const laporanHeader = {};
            [
              "noLaporan", "tanggal", "pengawas", "lokasi", "cuaca",
              "jumlahPekerja", "jamMulai", "jamSelesai", "deskripsiPekerjaan",
              "persenProgres", "temuanK3", "tindakanKoreksi", "alat", "material"
            ].forEach(f => {
              const el = document.getElementById("laporan-" + f);
              if (el) laporanHeader[f] = el.value;
            });

            // Filter & search JSA Log
            const logSearch =
              document.getElementById("log-search")?.value || "";
            const logFilterResiko =
              document.getElementById("log-filter-resiko")?.value || "";
            const logFilterTahun =
              document.getElementById("log-filter-tahun")?.value || "";

            const data = {
              activeTab: sessionStorage.getItem("sk_activeTab") || "dashboard",
              scrollTop,
              docMeta: DOC_META,
              ibpprHeader,
              ibpprBaris,
              jsaHeader,
              apdChecked,
              jsaLangkah,
              laporanHeader,
              logSearch,
              logFilterResiko,
              logFilterTahun,
            };
            sessionStorage.setItem(KEY, JSON.stringify(data));
          } catch (e) {
            /* sessionStorage mungkin disabled atau penuh */
          }
        }

        function load() {
          try {
            const raw = sessionStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : null;
          } catch (e) {
            return null;
          }
        }

        function restore() {
          const sess = load();
          if (sess) {
            // 1. Tab aktif
            if (sess.activeTab) switchTab(sess.activeTab);
            else switchTab("dashboard");

            // 1b. Info dokumen (No. Dok / No. Rev / Tgl Terbit)
            if (sess.docMeta) {
              DOC_META = Object.assign({}, DOC_META, sess.docMeta);
              docMetaDialog.renderTopbar();
            }

            // 2. IBPPR header fields
            if (sess.ibpprHeader) {
              Object.entries(sess.ibpprHeader).forEach(([f, v]) => {
                const el = document.getElementById("ibppr-" + f);
                if (el) el.value = v;
              });
            }

            // 3. IBPPR baris (jika ada data tersimpan & berbeda dari dummy)
            if (sess.ibpprBaris && sess.ibpprBaris.length) {
              ibppr.setRows(sess.ibpprBaris);
            }

            // 4. JSA header fields
            if (sess.jsaHeader) {
              [
                "noJSA",
                "tanggal",
                "jenisPekerjaan",
                "pengawas",
                "namaPelaksana",
                "apdTambahan",
                "lokasi",
                "penanggungjawab",
              ].forEach((f) => {
                const el = document.getElementById("jsa-" + f);
                if (el && sess.jsaHeader[f] !== undefined)
                  el.value = sess.jsaHeader[f];
              });
              syncPelaksanaPreview();
              const resEl = document.getElementById("jsa-resiko");
              if (resEl && sess.jsaHeader.resiko !== undefined)
                resEl.value = sess.jsaHeader.resiko;
            }

            // 5. APD checklist
            if (sess.apdChecked && sess.apdChecked.length) {
              APD_LIST.forEach((_, i) => {
                const el = document.getElementById("apd-" + i);
                if (el && sess.apdChecked[i] !== undefined)
                  el.checked = sess.apdChecked[i];
              });
            }

            // 6. JSA langkah
            if (sess.jsaLangkah && sess.jsaLangkah.length) {
              jsa.setSteps(sess.jsaLangkah);
            }

            // 6b. Laporan header fields
            if (sess.laporanHeader) {
              Object.entries(sess.laporanHeader).forEach(([f, v]) => {
                const el = document.getElementById("laporan-" + f);
                if (el) {
                  el.value = v;
                  if (f === "persenProgres") {
                    const rangeEl = document.getElementById("laporan-persenProgres-range");
                    if (rangeEl) rangeEl.value = v;
                  }
                }
              });
            }

            // 7. JSA Log filter & search
            if (sess.logSearch !== undefined) {
              const el = document.getElementById("log-search");
              if (el) {
                el.value = sess.logSearch;
              }
            }
            if (sess.logFilterResiko !== undefined) {
              const el = document.getElementById("log-filter-resiko");
              if (el) {
                el.value = sess.logFilterResiko;
              }
            }
            if (sess.logFilterTahun !== undefined) {
              const el = document.getElementById("log-filter-tahun");
              if (el) {
                el.value = sess.logFilterTahun;
              }
            }
            // re-apply filter jika ada
            if (sess.logSearch || sess.logFilterResiko || sess.logFilterTahun) {
              setTimeout(() => jsaLog.filter(), 100);
            }

            // 8. Restore scroll position
            if (sess.scrollTop) {
              setTimeout(() => {
                const viewArea = document.querySelector(".view-area");
                if (viewArea) viewArea.scrollTop = sess.scrollTop;
              }, 200);
            }

            setTimeout(initTextareaHeights, 150);
          } else {
            switchTab("dashboard");
          }
        }

        // Pasang event listener: simpan tiap kali ada perubahan input di seluruh halaman
        function startAutoSave() {
          document.addEventListener("input", () => save(), { passive: true });
          document.addEventListener("change", () => save(), { passive: true });
          // scroll position
          const viewArea = document.querySelector(".view-area");
          if (viewArea)
            viewArea.addEventListener("scroll", () => save(), {
              passive: true,
            });
        }

        return { save, load, restore, startAutoSave };
      })();

      /* =========================================================================
       SYNCHRONIZATION & OFFLINE MANAGER (offline-first)
       ========================================================================= */
      document.addEventListener("DOMContentLoaded", () => {
        syncManager.init();
        ibppr.init();
        jsa.init();
        laporan.init();
        jsaLog.init();
        setTimeout(initTextareaHeights, 100);

        // Keyboard navigation for pelaksana edit div
        const displayDiv = document.getElementById("jsa-namaPelaksana-display");
        if (displayDiv) {
          displayDiv.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              pelaksanaDialog.open();
            }
          });
        }

        // Hook _initFromDraft untuk IBPPR - dijalankan setelah init normal
        ibppr._initFromDraft = function () {
          const baris = this._draftData || [];
          if (!baris.length) return;
          ibppr.setRows(baris);
          this._draftData = null;
        };

        // Hook _initFromDraft untuk JSA
        jsa._initFromDraft = function () {
          const langkah = this._draftLangkah || [];
          if (!langkah.length) return;
          jsa.setSteps(langkah);
          this._draftLangkah = null;
        };

        // ── RESTORE SESSION ────────────────────────────────────────────────────────
        session.restore();

        // Mulai auto-save setelah restore selesai
        setTimeout(() => {
          session.startAutoSave();
          updateDashboardStats();
        }, 300);
      });

      // Globally accessible function for dashboard stats
      function updateDashboardStats(jsaEntries) {
        // 1. Total JSA
        let entries = jsaEntries;
        if (!entries) {
          try {
            const cached = localStorage.getItem("sk_jsa_log_entries");
            if (cached) entries = JSON.parse(cached);
          } catch (e) {}
        }
        const jsaCount = entries ? entries.length : 0;
        const kpiTotalJsa = document.getElementById("kpi-total-jsa");
        if (kpiTotalJsa) kpiTotalJsa.textContent = jsaCount;
        
        // 2. Total IBPPR
        let ibpprCount = 0;
        try {
          ibpprCount = parseInt(localStorage.getItem("sk_ibppr_success_count")) || 0;
        } catch (e) {}
        const kpiTotalIbppr = document.getElementById("kpi-total-ibppr");
        if (kpiTotalIbppr) kpiTotalIbppr.textContent = ibpprCount;

        // 3. Total Laporan
        let laporanCount = 0;
        try {
          laporanCount = parseInt(localStorage.getItem("sk_laporan_success_count")) || 0;
        } catch (e) {}
        const kpiTotalLaporan = document.getElementById("kpi-total-laporan");
        if (kpiTotalLaporan) kpiTotalLaporan.textContent = laporanCount;

        // 4. Pending Sync
        if (typeof syncManager !== "undefined") {
          const pendingCount = syncManager.getPendingCount();
          const kpiPendingSync = document.getElementById("kpi-pending-sync");
          if (kpiPendingSync) kpiPendingSync.textContent = pendingCount;
        }

        // 5. Risk distribution
        if (entries) {
          const counts = { Rendah: 0, Sedang: 0, Tinggi: 0, Ekstrem: 0 };
          entries.forEach(e => {
            if (counts[e.resiko] !== undefined) counts[e.resiko]++;
          });
          const maxCount = Math.max(1, counts.Rendah, counts.Sedang, counts.Tinggi, counts.Ekstrem);
          ["Rendah", "Sedang", "Tinggi", "Ekstrem"].forEach(r => {
            const lower = r.toLowerCase();
            const valEl = document.getElementById("risk-val-" + lower);
            const barEl = document.getElementById("risk-bar-" + lower);
            if (valEl) valEl.textContent = counts[r];
            if (barEl) barEl.style.width = ((counts[r] / maxCount) * 100) + "%";
          });
        }
      }
