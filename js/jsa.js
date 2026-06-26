      const jsa = (() => {
        let steps = [];
        let nextId = 1;

        // Tidak ada data dummy - JSA mulai dari kosong

        function createStepEl(step) {
          const el = document.createElement("div");
          el.className = "card";
          el.id = "jsa-step-" + step.id;
          el.style.cssText =
            "margin-bottom:12px;padding:14px;border-left:3px solid var(--steel);";
          el.innerHTML = `
          <!-- Card per langkah JSA; urutan pekerjaan dipetakan ke kolom B:H sheet JSA -->
          <div class="card-title-row" style="margin-bottom:10px">
            <h3>
              <span class="num-chip" style="background:var(--steel-soft);color:var(--steel-deep)">${step.seq}</span>
              Langkah #${step.seq}
            </h3>
            <button class="btn btn-danger-ghost btn-sm" onclick="jsa.removeStep(${step.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              Hapus
            </button>
          </div>
          <div class="field-grid" style="gap:10px">
            <div class="field">
              <!-- urutanPekerjaan: uraian langkah pekerjaan (col B, sheet JSA) -->
              <label>Urutan Pekerjaan <span class="req">*</span></label>
              <textarea rows="1" placeholder="Uraikan langkah pekerjaan ini…" oninput="jsa.updateStep(${step.id},'urutanPekerjaan',this.value)">${step.urutanPekerjaan}</textarea>
            </div>
            <div class="field">
              <!-- potensiBahaya: potensi bahaya pada langkah ini (col C:E, sheet JSA) -->
              <label>Potensi Bahaya <span class="req">*</span></label>
              <textarea rows="1" placeholder="Potensi bahaya pada langkah ini…" oninput="jsa.updateStep(${step.id},'potensiBahaya',this.value)">${step.potensiBahaya}</textarea>
            </div>
            <div class="field">
              <!-- upayaPengendalian: upaya pengendalian bahaya (col F:H, sheet JSA) -->
              <label>Upaya Pengendalian <span class="req">*</span></label>
              <textarea rows="1" placeholder="Langkah mitigasi / pengendalian…" oninput="jsa.updateStep(${step.id},'upayaPengendalian',this.value)">${step.upayaPengendalian}</textarea>
            </div>
          </div>
        `;
          return el;
        }

        function render() {
          const container = document.getElementById("jsa-steps-container");
          container.innerHTML = "";
          steps.forEach((s, i) => {
            s.seq = i + 1;
            container.appendChild(createStepEl(s));
          });
          setTimeout(initTextareaHeights, 0);
        }

        // Render checklist APD
        function renderAPD() {
          const container = document.getElementById("jsa-apd-grid");
          container.innerHTML = APD_LIST.map(
            (apd, i) => `
          <label style="display:flex;align-items:center;gap:8px;padding:9px 11px;background:var(--paper-deep);border:1.5px solid var(--line);border-radius:var(--r-sm);cursor:pointer;font-size:12.5px;font-weight:500;color:var(--ink-soft);transition:border-color 0.15s,background 0.15s">
            <!-- apdList: array APD yang dicentang, dipetakan ke rows A7:H15 sheet JSA -->
            <input type="checkbox" id="apd-${i}" value="${apd}" style="accent-color:var(--amber);width:15px;height:15px;cursor:pointer">
            ${apd}
          </label>
        `,
          ).join("");
        }

        return {
          init() {
            steps = [
              {
                id: nextId++,
                seq: 1,
                urutanPekerjaan: "",
                potensiBahaya: "",
                upayaPengendalian: "",
              },
            ];
            render();
            renderAPD();
          },
          // clearSteps: kosongkan array langkah internal + DOM tanpa menambah
          // langkah kosong default. Dipakai sebelum restore session, supaya
          // addStep() berikutnya tidak menumpuk di atas langkah kosong sisa init().
          clearSteps() {
            steps = [];
            const container = document.getElementById("jsa-steps-container");
            if (container) container.innerHTML = "";
          },
          addStep() {
            steps.push({
              id: nextId++,
              seq: steps.length + 1,
              urutanPekerjaan: "",
              potensiBahaya: "",
              upayaPengendalian: "",
            });
            render();
            setTimeout(
              () =>
                document
                  .getElementById("jsa-step-" + (nextId - 1))
                  ?.scrollIntoView({ behavior: "smooth", block: "center" }),
              50,
            );
          },
          removeStep(id) {
            if (steps.length <= 1) {
              showToast("Minimal 1 langkah pekerjaan");
              return;
            }
            steps = steps.filter((s) => s.id !== id);
            render();
          },
          updateStep(id, field, val) {
            const s = steps.find((s) => s.id === id);
            if (s) s[field] = val;
          },
          reset() {
            confirmDialog.show(
              "Reset Form JSA",
              "Data di JSA Log tidak terpengaruh.",
              () => {
                steps = [];
                nextId = 1;
                steps.push({
                  id: nextId++,
                  seq: 1,
                  urutanPekerjaan: "",
                  potensiBahaya: "",
                  upayaPengendalian: "",
                });
                render();
                // uncheck semua APD checkbox
                APD_LIST.forEach((_, i) => {
                  const el = document.getElementById("apd-" + i);
                  if (el) el.checked = false;
                });
                renderAPD();
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
                  if (el) el.value = "";
                });
                const resEl = document.getElementById("jsa-resiko");
                if (resEl) resEl.value = "";
                showToast("Form JSA direset");
              },
            );
          },
          getSelectedAPD() {
            const checked = [];
            APD_LIST.forEach((_, i) => {
              const el = document.getElementById("apd-" + i);
              if (el && el.checked) checked.push(el.value);
            });
            const tambahan = document
              .getElementById("jsa-apdTambahan")
              .value.trim();
            if (tambahan)
              checked.push(
                ...tambahan
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              );
            return checked;
          },
          // getPayload: bangun payload untuk dikirim ke Apps Script doPost()
          getPayload() {
            return {
              modul: "JSA",
              header: {
                noJSA: document.getElementById("jsa-noJSA").value,
                tanggal: document.getElementById("jsa-tanggal").value,
                jenisPekerjaan:
                  document.getElementById("jsa-jenisPekerjaan").value,
                pengawas: document.getElementById("jsa-pengawas").value,
                namaPelaksana:
                  document.getElementById("jsa-namaPelaksana").value,
                lokasi: document.getElementById("jsa-lokasi").value,
                resiko: document.getElementById("jsa-resiko").value,
                penanggungjawab: document.getElementById("jsa-penanggungjawab")
                  .value,
                apdList: this.getSelectedAPD(),
              },
              // langkah: array urutan pekerjaan, dipetakan ke rows 17-36 sheet JSA
              langkah: steps.map((s) => ({
                no: s.seq,
                urutanPekerjaan: s.urutanPekerjaan,
                potensiBahaya: s.potensiBahaya,
                upayaPengendalian: s.upayaPengendalian,
              })),
            };
          },
          getSteps() {
            return steps;
          },
          setSteps(newSteps) {
            steps = newSteps.map((s, i) => ({
              id: nextId++,
              seq: i + 1,
              urutanPekerjaan: s.urutanPekerjaan || "",
              potensiBahaya: s.potensiBahaya || "",
              upayaPengendalian: s.upayaPengendalian || "",
            }));
            render();
          },
          async submit() {
            const payload = this.getPayload();
            const h = payload.header;
            if (!h.noJSA || !h.jenisPekerjaan) {
              showToast("⚠ No. JSA dan Jenis Pekerjaan wajib diisi");
              return;
            }
            // Simpan ke JSA LOG (tersimpan ke Google Sheet via apiCall('add', ...))
            await jsaLog.addEntry({
              noFormJSA: h.noJSA,
              tanggal: h.tanggal,
              resiko: h.resiko,
              jenisPekerjaan: h.jenisPekerjaan,
              lokasi: h.lokasi,
              penanggungjawab: h.penanggungjawab,
              _payload: payload, // simpan payload lengkap untuk detail view
            });
            showToast("✓ JSA disimpan & masuk ke JSA LOG");
          },
        };
      })();
      // --- JSA extensions ---
      jsa.saveDraft = function () {
        const payload = this.getPayload();
        const filename =
          "draft-jsa-" +
          (payload.header.noJSA || "baru").replace(/\//g, "-") +
          ".json";
        downloadJSON(filename, payload);
        showToast("✓ Draft JSA tersimpan: " + filename);
      };

      jsa.loadDraft = function (draft) {
        if (!draft || draft.modul !== "JSA") return;
        const h = draft.header || {};
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
          if (el && h[f] !== undefined) el.value = h[f];
        });
        syncPelaksanaPreview();
        const resEl = document.getElementById("jsa-resiko");
        if (resEl && h.resiko) resEl.value = h.resiko;
        // APD checklist
        if (h.apdList && h.apdList.length) {
          APD_LIST.forEach((apd, i) => {
            const el = document.getElementById("apd-" + i);
            if (el) el.checked = h.apdList.includes(apd);
          });
        }
        if (draft.langkah && draft.langkah.length) {
          jsa._draftLangkah = draft.langkah;
          jsa._initFromDraft();
        }
      };

      jsa.generate = function () {
        const payload = this.getPayload();
        const h = payload.header;
        const scope = document.getElementById("mod-jsa");
        clearAllErrors(scope);

        // Kumpulkan semua input text, date, dan textarea dalam modul JSA
        // (apdTambahan dikecualikan karena memang opsional/bebas)
        const els = [
          ...scope.querySelectorAll(
            'input[type="text"], input[type="date"], textarea, select',
          ),
        ].filter(
          (el) => el.id !== "jsa-apdTambahan" && el.id !== "jsa-namaPelaksana",
        );
        const checks = els.map((el) => ({ el }));

        // APD: minimal 1 item harus dicentang
        const apdGrid = document.getElementById("jsa-apd-grid");
        const apdCheckboxes = [
          ...scope.querySelectorAll('#jsa-apd-grid input[type="checkbox"]'),
        ];
        const apdHasChecked = () => apdCheckboxes.some((cb) => cb.checked);
        checks.push({
          el: apdGrid,
          markEl: apdGrid,
          isValid: () => apdHasChecked(),
        });

        if (!apdHasChecked()) {
          const clearApdError = () => {
            if (apdHasChecked()) {
              apdGrid.classList.remove("field-error");
              apdCheckboxes.forEach((cb) =>
                cb.removeEventListener("change", clearApdError),
              );
            }
          };
          apdCheckboxes.forEach((cb) =>
            cb.addEventListener("change", clearApdError),
          );
        }

        // namaPelaksana: input hidden, ditandai lewat kotak display yang terlihat
        const namaPelaksanaEl = document.getElementById("jsa-namaPelaksana");
        const namaPelaksanaDisplay = document.getElementById(
          "jsa-namaPelaksana-display",
        );
        checks.push({
          el: namaPelaksanaEl,
          markEl: namaPelaksanaDisplay,
          isValid: (el) => !!(el.value && el.value.trim()),
        });

        const { valid, firstInvalidEl, invalidLabels } = validateFields(checks);

        if (!valid) {
          const listStr = invalidLabels.slice(0, 3).join(", ") + (invalidLabels.length > 3 ? ` (+${invalidLabels.length - 3} lainnya)` : "");
          showToast(`⚠ Harap lengkapi field: ${listStr}`);
          scrollToFirstError(firstInvalidEl);
          return;
        }

        const filename =
          "JSA-" + (h.noJSA || "baru").replace(/\//g, "-") + ".pdf";
        jsaLogConfirm.show(async (updateLog) => {
          if (updateLog) {
            // [BARU] tampilkan overlay loading SEGERA (sebelum await) supaya
            // layar tidak kosong/diam selama proses simpan ke spreadsheet.
            generateModal.openUploading("JSA");
            // [BARU] tunggu hasil simpan yang sebenarnya dari server (upsert),
            // lalu tampilkan toast sesuai hasil nyata - bukan asumsi selalu berhasil
            const result = await jsaLog.addEntry({
              noFormJSA: h.noJSA,
              tanggal: h.tanggal,
              resiko: h.resiko,
              jenisPekerjaan: h.jenisPekerjaan,
              lokasi: h.lokasi,
              penanggungjawab: h.penanggungjawab,
              _payload: payload,
            });
            if (result && result.success) {
              showToast(
                result.offline
                  ? "⚠ Offline: Data disimpan di antrean lokal"
                  : (result.updated
                      ? "✓ JSA Log diperbarui di spreadsheet"
                      : "✓ JSA ditambahkan ke JSA Log")
              );
            } else {
              showToast(
                "⚠ Gagal menyimpan ke JSA Log: " +
                  (result && result.error ? result.error : "tidak diketahui"),
              );
            }
          }
          // Susun dokumen sungguhan: data form diisi ke struktur tabel resmi sheet JSA.
          // PDF JSA selalu hanya berisi sheet JSA - sama saja isinya baik pilih
          // "Ya, Update" maupun "Tidak, Skip". Sheet JSA LOG punya dokumen &
          // tombol download terpisah sendiri di tab JSA Log (lihat jsaLog.generate()).
          const bodyHTML = buildJSASheet(payload);
          const docHTML = wrapStandaloneDoc(
            "JSA - " + (h.noJSA || ""),
            bodyHTML,
          );
          generateModal.open("JSA", filename, docHTML, payload);
        });
      };
