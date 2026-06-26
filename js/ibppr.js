      const ibppr = (() => {
        // state: array baris aktivitas IBPPR
        let rows = [];
        let nextId = 1;

        // Tidak ada data dummy - IBPPR mulai dari kosong

        // Buat elemen card untuk satu baris IBPPR
        function createRowEl(row) {
          const nilai = calcNilai(row.paparan, row.peluang);
          const tr = getTingkatResiko(nilai);
          const el = document.createElement("div");
          el.className = "card";
          el.id = "ibppr-row-" + row.id;
          el.style.cssText = "margin-bottom:12px;padding:14px";
          el.innerHTML = `
          <!-- Card per baris aktivitas IBPPR -->
          <div class="card-title-row" style="margin-bottom:10px">
            <h3>
              <span class="num-chip">${row.seq}</span>
              Aktivitas #${row.seq}
            </h3>
            <button class="btn btn-danger-ghost btn-sm" onclick="ibppr.removeRow(${row.id})" aria-label="Hapus Aktivitas #${row.seq}">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              Hapus
            </button>
          </div>
          <div class="field-grid" style="gap:10px">
            <div class="field">
              <!-- aktivitas: uraian aktivitas pekerjaan (col C sheet IBPPR) -->
              <label for="ibppr-aktivitas-${row.id}">Aktivitas Pekerjaan <span class="req">*</span></label>
              <textarea id="ibppr-aktivitas-${row.id}" rows="1" placeholder="Uraikan aktivitas pekerjaan…" oninput="ibppr.updateField(${row.id},'aktivitas',this.value)">${row.aktivitas}</textarea>
            </div>
            <div class="field">
              <!-- potensiBahaya: potensi bahaya dari aktivitas tersebut (col D) -->
              <label for="ibppr-potensiBahaya-${row.id}">Potensi Bahaya <span class="req">*</span></label>
              <textarea id="ibppr-potensiBahaya-${row.id}" rows="1" placeholder="Deskripsikan potensi bahaya…" oninput="ibppr.updateField(${row.id},'potensiBahaya',this.value)">${row.potensiBahaya}</textarea>
            </div>
            <!-- Penilaian Resiko (cols E:J): Akibat × Peluang → Nilai → Tingkat -->
            <div style="background:var(--paper-deep);border-radius:var(--r-md);padding:12px;border:1px solid var(--line)">
              <div style="font-size:11.5px;font-weight:700;color:var(--ink-soft);margin-bottom:10px;letter-spacing:0.2px">PENILAIAN RESIKO</div>
              <div class="field-grid cols-2" style="gap:8px">
                <div class="field" style="grid-column:1/-1">
                  <!-- resikoAwal: deskripsi resiko awal sebelum pengendalian (col E, teks bebas) -->
                  <label for="ibppr-resikoAwal-${row.id}">Resiko <span class="req">*</span></label>
                  <textarea id="ibppr-resikoAwal-${row.id}" rows="1" placeholder="Contoh: Resiko tertimpa, terjatuh, terpapar bahan kimia…" oninput="ibppr.updateField(${row.id},'resikoAwal',this.value)">${row.resikoAwal}</textarea>
                </div>
                <div class="field" style="grid-column:1/-1">
                  <!-- akibat: deskripsi akibat/dampak dari bahaya (col F, teks bebas) -->
                  <label for="ibppr-akibat-${row.id}">Akibat / Dampak <span class="req">*</span></label>
                  <textarea id="ibppr-akibat-${row.id}" rows="1" placeholder="Contoh: Cedera pekerja, luka bakar, ISPA…" oninput="ibppr.updateField(${row.id},'akibat',this.value)">${row.akibat}</textarea>
                </div>
                <div class="field">
                  <!-- paparan: tingkat keparahan/dampak bahaya, bukan frekuensi waktu (1-5, col G) -->
                  <label for="ibppr-paparan-${row.id}">Paparan (1–5) <span class="req">*</span></label>
                  <select id="ibppr-paparan-${row.id}" oninput="ibppr.updatePenilaian(${row.id},'paparan',this.value)">
                    <option value="">-</option>
                    ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${row.paparan == n ? "selected" : ""}>${n} – ${["Sangat Ringan", "Ringan", "Sedang", "Berat", "Sangat Fatal"][n - 1]}</option>`).join("")}
                  </select>
                </div>
                <div class="field">
                  <!-- peluang: kemungkinan kejadian bahaya (1-5, col H) -->
                  <label for="ibppr-peluang-${row.id}">Peluang (1–5) <span class="req">*</span></label>
                  <select id="ibppr-peluang-${row.id}" oninput="ibppr.updatePenilaian(${row.id},'peluang',this.value)">
                    <option value="">-</option>
                    ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${row.peluang == n ? "selected" : ""}>${n} – ${["Hampir mustahil", "Jarang terjadi", "Mungkin", "Kemungkinan besar", "Hampir pasti"][n - 1]}</option>`).join("")}
                  </select>
                </div>
                <div class="field">
                  <!-- nilai: hasil Akibat×Paparan×Peluang (col I, dihitung otomatis) -->
                  <!-- tingkatResiko: label dari nilai (col J, otomatis) -->
                  <label>Nilai &amp; Tingkat</label>
                  <div id="ibppr-risk-${row.id}" style="padding:9px 0">${riskChip(nilai)}</div>
                </div>
              </div>
            </div>
            <div class="field">
              <!-- pengendalian: upaya pengendalian resiko (col K) -->
              <label for="ibppr-pengendalian-${row.id}">Pengendalian Resiko <span class="req">*</span></label>
              <textarea id="ibppr-pengendalian-${row.id}" rows="1" placeholder="Langkah pengendalian / mitigasi…" oninput="ibppr.updateField(${row.id},'pengendalian',this.value)">${row.pengendalian}</textarea>
            </div>
          </div>
        `;
          return el;
        }

        function render() {
          const container = document.getElementById("ibppr-rows-container");
          container.innerHTML = "";
          rows.forEach((row, i) => {
            row.seq = i + 1;
            container.appendChild(createRowEl(row));
          });
          setTimeout(initTextareaHeights, 0);
        }

        return {
          init() {
            rows = [
              {
                id: nextId++,
                seq: 1,
                aktivitas: "",
                potensiBahaya: "",
                resikoAwal: "",
                akibat: "",
                paparan: "",
                peluang: "",
                pengendalian: "",
              },
            ];
            render();
          },
          // clearRows: kosongkan array baris internal + DOM tanpa menambah baris
          // kosong default. Dipakai sebelum restore session, supaya addRow()
          // berikutnya tidak menumpuk di atas baris kosong sisa init().
          clearRows() {
            rows = [];
            const container = document.getElementById("ibppr-rows-container");
            if (container) container.innerHTML = "";
          },
          addRow() {
            rows.push({
              id: nextId++,
              seq: rows.length + 1,
              aktivitas: "",
              potensiBahaya: "",
              resikoAwal: "",
              akibat: "",
              paparan: "",
              peluang: "",
              pengendalian: "",
            });
            render();
            // scroll ke baris baru
            setTimeout(
              () =>
                document
                  .getElementById("ibppr-row-" + (nextId - 1))
                  ?.scrollIntoView({ behavior: "smooth", block: "center" }),
              50,
            );
          },
          removeRow(id) {
            if (rows.length <= 1) {
              showToast("Minimal 1 baris aktivitas");
              return;
            }
            rows = rows.filter((r) => r.id !== id);
            render();
          },
          updateField(id, field, val) {
            const r = rows.find((r) => r.id === id);
            if (r) r[field] = val;
          },
          updatePenilaian(id, field, val) {
            const r = rows.find((r) => r.id === id);
            if (!r) return;
            r[field] = val;
            // hitung ulang nilai (Paparan × Peluang - akibat kini teks bebas)
            const nilai = parseInt(r.paparan || 0) * parseInt(r.peluang || 0);
            document.getElementById("ibppr-risk-" + id).innerHTML =
              riskChip(nilai);
          },
          reset() {
            confirmDialog.show(
              "Reset Form IBPPR",
              "Semua isian akan dihapus dan tidak dapat dikembalikan.",
              () => {
                rows = [];
                nextId = 1;
                // tambah 1 baris kosong sebagai placeholder
                rows.push({
                  id: nextId++,
                  seq: 1,
                  aktivitas: "",
                  potensiBahaya: "",
                  resikoAwal: "",
                  akibat: "",
                  paparan: "",
                  peluang: "",
                  pengendalian: "",
                });
                render();
                ["noForm", "namaPekerjaan", "lokasi"].forEach((f) => {
                  const el = document.getElementById("ibppr-" + f);
                  if (el) el.value = "";
                });
                showToast("Form IBPPR direset");
              },
            );
          },
          // getPayload: bangun object yang siap dikirim ke Apps Script doPost()
          getPayload() {
            return {
              modul: "IBPPR",
              header: {
                noForm: document.getElementById("ibppr-noForm").value,
                namaPekerjaan: document.getElementById("ibppr-namaPekerjaan")
                  .value,
                lokasi: document.getElementById("ibppr-lokasi").value,
              },
              // baris: array of row objects, dipetakan ke cols B:K sheet IBPPR
              baris: rows.map((r) => ({
                no: r.seq,
                aktivitas: r.aktivitas,
                potensiBahaya: r.potensiBahaya,
                resikoAwal: r.resikoAwal,
                akibat: r.akibat,
                paparan: r.paparan,
                peluang: r.peluang,
                nilai: calcNilai(r.paparan, r.peluang),
                tingkatResiko: getTingkatResiko(calcNilai(r.paparan, r.peluang))
                  .label,
                pengendalian: r.pengendalian,
              })),
            };
          },
          getRows() {
            return rows;
          },
          setRows(newRows) {
            rows = newRows.map((r, i) => ({
              id: nextId++,
              seq: i + 1,
              aktivitas: r.aktivitas || "",
              potensiBahaya: r.potensiBahaya || "",
              resikoAwal: r.resikoAwal || "",
              akibat: r.akibat || "",
              paparan: r.paparan || "",
              peluang: r.peluang || "",
              pengendalian: r.pengendalian || "",
            }));
            render();
          },
          async submit() {
            const payload = this.getPayload();
            if (!payload.header.noForm || !payload.header.namaPekerjaan) {
              showToast("⚠ No. Form dan Nama Pekerjaan wajib diisi");
              return;
            }
            // Increment local success count
            try {
              const current = parseInt(localStorage.getItem("sk_ibppr_success_count")) || 0;
              localStorage.setItem("sk_ibppr_success_count", current + 1);
            } catch (e) {}
            if (typeof updateDashboardStats === "function") {
              updateDashboardStats();
            }
            showToast("✓ IBPPR berhasil disimpan (simulasi)");
          },
        };
      })();
      // --- IBPPR extensions ---
      ibppr.saveDraft = function () {
        const payload = this.getPayload();
        const filename =
          "draft-ibppr-" +
          (payload.header.noForm || "baru").replace(/\//g, "-") +
          ".json";
        downloadJSON(filename, payload);
        showToast("✓ Draft IBPPR tersimpan: " + filename);
      };

      ibppr.loadDraft = function (draft) {
        if (!draft || draft.modul !== "IBPPR") return;
        const h = draft.header || {};
        ["noForm", "namaPekerjaan", "lokasi"].forEach((f) => {
          const el = document.getElementById("ibppr-" + f);
          if (el && h[f] !== undefined) el.value = h[f];
        });
        if (draft.baris && draft.baris.length) {
          // akses rows via closure tidak langsung - re-init dengan data draft
          // lewat reset + addRow pattern dengan data
          // simpan ke ibppr._draftRows lalu trigger re-render
          this._pendingDraftRows = draft.baris;
          this._applyDraftRows();
        }
      };

      ibppr._applyDraftRows = function () {
        // Tidak bisa akses 'rows' closure langsung dari luar,
        // jadi kita gunakan UI: reset kemudian isi field satu per satu
        // Solusi: expose rows via internal approach
        // Karena ibppr adalah IIFE, kita trigger reset tanpa confirm, lalu render
        const baris = this._pendingDraftRows || [];
        // Trigger internal reset langsung (tanpa konfirmasi dialog)
        document.getElementById("ibppr-rows-container").innerHTML = "";
        // hapus semua baris dulu lewat UI, lalu tambah ulang
        // Karena ibppr.reset() pakai confirmDialog, kita pakai approach berbeda:
        // kita panggil addRow berulang dan isi field via DOM setelah render
        // Simpan baris di ibppr._draftRows dan panggil init-ulang rows
        this._loadRowsFromDraft(baris);
      };

      // Kita perlu akses internal rows - ini adalah tambahan fungsi init khusus draft
      ibppr._loadRowsFromDraft = function (baris) {
        // approach: panggil ibppr.init() tapi ganti rows dengan data draft
        // kita tambahkan flag _draftData ke ibppr
        ibppr._draftData = baris;
        ibppr._initFromDraft();
      };

      /* =========================================================================
       VALIDASI FORM - tandai field kosong dengan border merah + scroll otomatis
       ========================================================================= */
      

ibppr.generate = function () {
        const payload = this.getPayload();
        const scope = document.getElementById("mod-ibppr");
        clearAllErrors(scope);

        // Kumpulkan semua input text, date, dan textarea dalam modul IBPPR
        const els = [
          ...scope.querySelectorAll(
            'input[type="text"], input[type="date"], textarea, select',
          ),
        ];
        const checks = els.map((el) => ({ el }));
        const { valid, firstInvalidEl, invalidLabels } = validateFields(checks);

        if (!valid) {
          const listStr = invalidLabels.slice(0, 3).join(", ") + (invalidLabels.length > 3 ? ` (+${invalidLabels.length - 3} lainnya)` : "");
          showToast(`⚠ Harap lengkapi field: ${listStr}`);
          scrollToFirstError(firstInvalidEl);
          return;
        }

        const filename =
          "IBPPR-" +
          (payload.header.noForm || "baru").replace(/\//g, "-") +
          ".pdf";
        // Susun dokumen sungguhan: data form diisi ke struktur tabel resmi sheet IBPPR
        const docHTML = wrapStandaloneDoc(
          "IBPPR - " + (payload.header.noForm || ""),
          buildIBPPRSheet(payload),
        );
        generateModal.open("IBPPR", filename, docHTML, payload);
      };

