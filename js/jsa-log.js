      const jsaLog = (() => {
        // Tidak ada data dummy - JSA LOG mulai dari kosong
        let entries = [];
        let filteredEntries = [...entries];

        function renderStats(list) {
          const counts = { Rendah: 0, Sedang: 0, Tinggi: 0, Ekstrem: 0 };
          list.forEach((e) => {
            if (counts[e.resiko] !== undefined) counts[e.resiko]++;
          });
          const map = [
            {
              label: "Rendah",
              cls: "risk-rendah",
              color: "var(--risk-low)",
              bg: "var(--risk-low-bg)",
            },
            {
              label: "Sedang",
              cls: "risk-sedang",
              color: "var(--risk-medium)",
              bg: "var(--risk-medium-bg)",
            },
            {
              label: "Tinggi",
              cls: "risk-tinggi",
              color: "var(--risk-high)",
              bg: "var(--risk-high-bg)",
            },
            {
              label: "Ekstrem",
              cls: "risk-ekstrem",
              color: "var(--risk-extreme)",
              bg: "var(--risk-extreme-bg)",
            },
          ];
          document.getElementById("log-stats").innerHTML = map
            .map(
              (m) => `
          <div style="background:${m.bg};border-radius:var(--r-md);padding:12px 10px;text-align:center">
            <div style="font-family:var(--font-mono);font-size:22px;font-weight:800;color:${m.color}">${counts[m.label]}</div>
            <div style="font-size:10.5px;font-weight:700;color:${m.color};margin-top:1px">${m.label}</div>
          </div>
        `,
            )
            .join("");
        }

        function renderList(list) {
          const container = document.getElementById("log-list");
          const empty = document.getElementById("log-empty");
          if (!list.length) {
            container.innerHTML = "";
            empty.style.display = "block";
            return;
          }
          empty.style.display = "none";
          container.innerHTML = list
            .map(
              (e) => `
          <!-- Kartu JSA LOG - satu baris sheet "JSA LOG" per kartu -->
          <div class="card" style="margin-bottom:10px;cursor:pointer;transition:box-shadow 0.15s,transform 0.12s"
            onclick="jsaLog.showDetail('${String(e.id).replace(/'/g, "\\'")}')"
            onmouseover="this.style.boxShadow='var(--shadow-pop)'"
            onmouseout="this.style.boxShadow='var(--shadow-card)'">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
              <div style="flex:1;min-width:0">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--amber-deep);margin-bottom:2px">${e.noFormJSA}</div>
                <div style="font-size:14px;font-weight:700;color:var(--ink);line-height:1.3;word-break:break-word">${e.jenisPekerjaan}</div>
              </div>
              ${riskChipStr(e.resiko)}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px">
              <span style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--ink-soft)">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;stroke:var(--ink-faint)"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${fmtDate(e.tanggal)}
              </span>
              <span style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--ink-soft)">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;stroke:var(--ink-faint)"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 13 8 13s8-7.75 8-13a8 8 0 0 0-8-8z"/></svg>
                ${e.lokasi || "-"}
              </span>
              <span style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--ink-soft)">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px;stroke:var(--ink-faint)"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${e.penanggungjawab || "-"}
              </span>
            </div>
            <div style="margin-top:10px;font-size:11.5px;color:var(--amber-deep);font-weight:600;display:flex;align-items:center;gap:4px">
              Lihat Detail
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" style="width:12px;height:12px;stroke:currentColor"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        `,
            )
            .join("");
        }

        return {
          init() {
            this.reload();
          },
          async reload() {
            const container = document.getElementById("log-list");
            const empty = document.getElementById("log-empty");
            const refreshBtn = document.getElementById("log-refresh-btn");
            const refreshIcon = document.getElementById("log-refresh-icon");
            if (refreshBtn) refreshBtn.disabled = true;
            if (refreshIcon) refreshIcon.classList.add("log-refresh-spinning");
            if (container)
              container.innerHTML =
                '<div style="text-align:center;padding:24px;color:var(--ink-faint);font-size:13px">Memuat data dari spreadsheet…</div>';
            if (empty) empty.style.display = "none";
            try {
              const res = await apiList();
              if (!res || res.success !== true) {
                throw new Error(
                  (res && res.error) || "Respons server tidak valid",
                );
              }
              // data dari sheet diurutkan lama→baru (No urut), tampilkan terbaru di atas
              entries = (res.data || []).slice().reverse();
              // [BARU] JSA Log selalu refer ke spreadsheet - terapkan ulang
              // filter/pencarian yang sedang aktif di atas data terbaru ini
              this.filter();
            } catch (err) {
              console.error("[jsaLog] Gagal memuat data:", err);
              showToast("⚠ Gagal memuat data JSA Log dari spreadsheet");
              entries = [];
              filteredEntries = [];
              renderStats(entries);
              renderList(entries);
            } finally {
              if (refreshBtn) refreshBtn.disabled = false;
              if (refreshIcon)
                refreshIcon.classList.remove("log-refresh-spinning");
            }
          },
          // addEntry: kirim data ke server (upsert - backend otomatis update
          // kalau No. Form JSA sudah ada, atau tambah baris baru kalau belum).
          // [BARU] tidak pernah lagi menyisipkan data secara lokal/optimis -
          // JSA Log SELALU mengambil ulang dari spreadsheet setelah berhasil
          // simpan, supaya tampilan di web selalu cerminan persis isi sheet.
          // Return: { success, updated, id, error } supaya pemanggil tahu hasil
          // sebenarnya (bukan asumsi selalu berhasil).
          async addEntry(data) {
            const { _payload, ...summary } = data;
            try {
              if (!navigator.onLine) {
                throw new Error("Koneksi offline");
              }
              const res = await apiCall("add", { payload: summary });
              if (res && res.success) {
                // simpan payload lengkap (detail langkah/APD) di cache lokal,
                // di-keyed dengan id stabil (= No. Form JSA) - aman dipakai
                // lintas reload karena id sekarang bukan lagi UUID acak
                if (_payload && res.id) {
                  this._detailMap = this._detailMap || {};
                  this._detailMap[res.id] = _payload;
                }
                await this.reload();
                return { success: true, updated: !!res.updated, id: res.id, offline: false };
              }
              throw new Error((res && res.error) || "Respons server tidak valid");
            } catch (err) {
              console.warn("[jsaLog] Gagal simpan, masukkan ke antrean offline:", err);
              if (typeof syncManager !== "undefined") {
                syncManager.queueOffline("add", { payload: summary, _payload });
                return { success: true, offline: true, id: summary.noFormJSA };
              }
              return {
                success: false,
                error: err.message || "Gagal terhubung ke server",
              };
            }
          },
          _detailMap: {},
          filter() {
            const q = document.getElementById("log-search").value.toLowerCase();
            const res = document.getElementById("log-filter-resiko").value;
            const thn = document.getElementById("log-filter-tahun").value;
            filteredEntries = entries.filter((e) => {
              const matchQ =
                !q ||
                [
                  e.noFormJSA,
                  e.jenisPekerjaan,
                  e.lokasi,
                  e.penanggungjawab,
                ].some((f) => f && f.toLowerCase().includes(q));
              const matchRes = !res || e.resiko === res;
              const matchThn = !thn || (e.tanggal && e.tanggal.startsWith(thn));
              return matchQ && matchRes && matchThn;
            });
            renderStats(filteredEntries);
            renderList(filteredEntries);
          },
          showDetail(id) {
            const e = entries.find((e) => String(e.id) === String(id));
            if (!e) return;
            this._currentDetailId = e.id;
            const detail = this._detailMap[id];
            document.getElementById("log-modal-title").textContent =
              e.noFormJSA;

            // Reset tombol hapus ke kondisi semula setiap kali modal dibuka.
            // Tombol ini elemen DOM tunggal yang dipakai bersama untuk semua log,
            // jadi kalau tidak direset di sini, state "Menghapus…" dari
            // penghapusan sebelumnya akan nyangkut dan membuat tombol tidak bisa
            // diklik lagi pada log berikutnya.
            const delBtn = document.getElementById("log-delete-btn");
            if (delBtn) {
              delBtn.disabled = false;
              delBtn.style.opacity = 1;
              delBtn.innerHTML =
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Hapus Log Ini';
            }

            let langkahHtml = "";
            if (detail && detail.langkah && detail.langkah.length) {
              langkahHtml = `
              <div style="margin-top:14px">
                <div style="font-size:11.5px;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Urutan Pekerjaan</div>
                ${detail.langkah
                  .map(
                    (l) => `
                  <div style="padding:10px 12px;background:var(--paper-deep);border-radius:var(--r-sm);margin-bottom:6px;border-left:3px solid var(--steel)">
                    <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--steel-deep);font-weight:700;margin-bottom:4px">Langkah ${l.no}</div>
                    <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:4px">${l.urutanPekerjaan || "-"}</div>
                    <div style="font-size:12px;color:var(--risk-high);margin-bottom:2px">⚠ ${l.potensiBahaya || "-"}</div>
                    <div style="font-size:12px;color:var(--risk-low)">✓ ${l.upayaPengendalian || "-"}</div>
                  </div>
                `,
                  )
                  .join("")}
              </div>`;
              if (detail.header.apdList && detail.header.apdList.length) {
                langkahHtml += `
                <div style="margin-top:12px">
                  <div style="font-size:11.5px;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">APD</div>
                  <div style="display:flex;flex-wrap:wrap;gap:5px">
                    ${detail.header.apdList.map((a) => `<span style="background:var(--steel-soft);color:var(--steel-deep);border-radius:5px;padding:4px 9px;font-size:11.5px;font-weight:600">${a}</span>`).join("")}
                  </div>
                </div>`;
              }
            }

            document.getElementById("log-modal-body").innerHTML = `
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;align-items:center">
              ${riskChipStr(e.resiko)}
              <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-faint)">${fmtDate(e.tanggal)}</span>
            </div>
            <div style="background:var(--paper-deep);border-radius:var(--r-md);padding:14px;display:grid;gap:10px">
              ${[
                ["Jenis Pekerjaan", e.jenisPekerjaan],
                ["Lokasi", e.lokasi],
                ["Penanggung Jawab", e.penanggungjawab],
                detail ? ["Pengawas", detail.header.pengawas] : null,
                detail ? ["Pelaksana", detail.header.namaPelaksana] : null,
              ]
                .filter(Boolean)
                .map(
                  ([l, v]) => `
                <div>
                  <div style="font-size:10.5px;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.5px">${l}</div>
                  <div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-top:2px">${v || "-"}</div>
                </div>
              `,
                )
                .join("")}
            </div>
            ${langkahHtml}
          `;
            const overlay = document.getElementById("log-modal-overlay");
            overlay.style.display = "flex";
            requestAnimationFrame(() => (overlay.style.opacity = 1));
          },
          closeDetail(e) {
            if (e && e.target !== document.getElementById("log-modal-overlay"))
              return;
            document.getElementById("log-modal-overlay").style.display = "none";
          },
          deleteCurrent() {
            const id = this._currentDetailId;
            if (!id) return;
            confirmDialog.show(
              "Hapus Log JSA Ini?",
              "Hapus log JSA ini secara permanen dari Google Sheet? Tindakan ini tidak bisa dibatalkan.",
              () => this._doDelete(id),
              { okLabel: "Ya, Hapus", cancelLabel: "Batal", icon: "trash" },
            );
          },
          async _doDelete(id) {
            const btn = document.getElementById("log-delete-btn");
            if (btn) {
              btn.disabled = true;
              btn.style.opacity = 0.6;
              btn.textContent = "Menghapus…";
            }

            try {
              const res = await apiCall("delete", { id });
              if (!res || res.success !== true) {
                throw new Error(
                  (res && res.error) || "Gagal menghapus di server",
                );
              }
              document.getElementById("log-modal-overlay").style.display =
                "none";
              if (btn) {
                btn.disabled = false;
                btn.style.opacity = 1;
                btn.innerHTML =
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Hapus Log Ini';
              }
              showToast("✓ Log berhasil dihapus");
              await this.reload();
            } catch (err) {
              console.error("[jsaLog] Gagal menghapus:", err);
              showToast("⚠ Gagal menghapus log: " + err.message);
              if (btn) {
                btn.disabled = false;
                btn.style.opacity = 1;
                btn.innerHTML =
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Hapus Log Ini';
              }
            }
          },
          // getAll: ekspos seluruh entries (urut terbaru→lama) untuk dipakai
          // saat menyusun dokumen cetak sheet "JSA LOG"
          getAll() {
            return entries.map((e) => ({ ...e }));
          },
          // generate: susun & buka dokumen tabel resmi sheet "JSA LOG" berisi
          // seluruh arsip JSA yang sedang ditampilkan (mengikuti filter aktif)
          generate() {
            const list = filteredEntries.length ? filteredEntries : entries;
            if (!list.length) {
              showToast("⚠ Tidak ada data untuk digenerate");
              return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ compress: true,
              orientation: "portrait",
              unit: "mm",
              format: "a4",
            });

            const marginL = 15;
            const marginR = 15;
            const pageW = 210;
            const tableW = pageW - marginL - marginR;

            const colNo = tableW * 0.05;
            const colNoForm = tableW * 0.15;
            const colTgl = tableW * 0.12;
            const colResiko = tableW * 0.1;
            const colJenis = tableW * 0.15;
            const colLokasi = tableW * 0.215;
            const colPJ = tableW * 0.215;
            const colLabel = 25;
            const colVal = 45;
            const colLogoJudul = tableW - colLabel - colVal;
            const borderStyle = { lineColor: [0, 0, 0], lineWidth: 0.3 };
            const baseStyle = {
              ...borderStyle,
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
              fontSize: 8,
              cellPadding: 2,
            };

            const img = new Image();
            const img2 = new Image();
            let logoB64 = null;
            let smk3B64 = null;

            function toB64(i) {
  const c = document.createElement("canvas");
  const maxDim = 500; // Resize to 200px max
  let w = i.width;
  let h = i.height;
  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(i, 0, 0, w, h);
  return c.toDataURL("image/png");
}

function buildPDF() {
              // ── HEADER: |LOGO HMJ|FORM JSA LOG|LOGO SMK3|No.Dok/Rev/Tgl| ──
              const colLogo = 22;
              const colSMK3 = 22;
              const colJudul = tableW - colLogo - colSMK3 - colLabel - colVal;

              doc.autoTable({
                startY: 10,
                margin: { left: marginL, right: marginR },
                tableWidth: tableW,
                body: [
                  [
                    {
                      content: "",
                      rowSpan: 3,
                      styles: { cellWidth: colLogo, minCellHeight: 20 },
                    },
                    {
                      content: "FORM JSA LOG",
                      rowSpan: 3,
                      styles: {
                        cellWidth: colJudul,
                        halign: "center",
                        valign: "middle",
                        fontStyle: "bold",
                        fontSize: 11,
                      },
                    },
                    {
                      content: "",
                      rowSpan: 3,
                      styles: { cellWidth: colSMK3, minCellHeight: 20 },
                    },
                    {
                      content: "No. Dok",
                      styles: { cellWidth: colLabel, fontStyle: "bold" },
                    },
                    {
                      content: "FR/PK3/JSA/002",
                      styles: { cellWidth: colVal },
                    },
                  ],
                  [
                    { content: "No. Rev", styles: { fontStyle: "bold" } },
                    { content: "0" },
                  ],
                  [
                    { content: "Tgl Terbit", styles: { fontStyle: "bold" } },
                    { content: "10 Mei 2022" },
                  ],
                ],
                styles: { ...baseStyle },
                theme: "grid",
                didDrawCell(data) {
                  if (
                    data.row.index === 0 &&
                    data.column.index === 0 &&
                    logoB64
                  ) {
                    const s = 14;
                    doc.addImage(
                      logoB64,
                      "PNG",
                      data.cell.x + (data.cell.width - s) / 2,
                      data.cell.y + (data.cell.height - s) / 2,
                      s,
                      s,
                    );
                  }
                  if (
                    data.row.index === 0 &&
                    data.column.index === 2 &&
                    smk3B64
                  ) {
                    const s = 14;
                    doc.addImage(
                      smk3B64,
                      "PNG",
                      data.cell.x + (data.cell.width - s) / 2,
                      data.cell.y + (data.cell.height - s) / 2,
                      s,
                      s,
                    );
                  }
                },
              });
              // ── TABEL DATA ──
              doc.autoTable({
                startY: doc.lastAutoTable.finalY + 5,
                margin: { left: marginL, right: marginR },
                tableWidth: tableW,
                head: [
                  [
                    {
                      content: "No",
                      styles: {
                        cellWidth: colNo,
                        halign: "center",
                        valign: "middle",
                      },
                    },
                    {
                      content: "No. Form JSA",
                      styles: {
                        cellWidth: colNoForm,
                        halign: "center",
                        valign: "middle",
                      },
                    },
                    {
                      content: "Tanggal",
                      styles: {
                        cellWidth: colTgl,
                        halign: "center",
                        valign: "middle",
                      },
                    },
                    {
                      content: "Resiko",
                      styles: {
                        cellWidth: colResiko,
                        halign: "center",
                        valign: "middle",
                      },
                    },
                    {
                      content: "Jenis Pekerjaan",
                      styles: {
                        cellWidth: colJenis,
                        halign: "center",
                        valign: "middle",
                      },
                    },
                    {
                      content: "Lokasi",
                      styles: {
                        cellWidth: colLokasi,
                        halign: "center",
                        valign: "middle",
                      },
                    },
                    {
                      content: "Penanggung Jawab",
                      styles: {
                        cellWidth: colPJ,
                        halign: "center",
                        valign: "middle",
                      },
                    },
                  ],
                ],
                body: list.map((e, i) => [
                  {
                    content: i + 1,
                    styles: { halign: "center", valign: "middle" },
                  },
                  {
                    content: e.noFormJSA || "-",
                    styles: { halign: "center", valign: "middle" },
                  },
                  {
                    content: e.tanggal || "-",
                    styles: { halign: "center", valign: "middle" },
                  },
                  {
                    content: e.resiko || "-",
                    styles: { halign: "center", valign: "middle" },
                  },
                  {
                    content: e.jenisPekerjaan || "-",
                    styles: { halign: "center", valign: "middle" },
                  },
                  {
                    content: e.lokasi || "-",
                    styles: { halign: "center", valign: "middle" },
                  },
                  {
                    content: e.penanggungjawab || "-",
                    styles: { halign: "center", valign: "middle" },
                  },
                ]),
                styles: { ...baseStyle, valign: "middle" },
                headStyles: {
                  ...baseStyle,
                  fontStyle: "bold",
                  halign: "center",
                  valign: "middle",
                },
                theme: "grid",
              });

              // ── FOOTER (satu blok, tidak boleh terpecah) ──
              const colTTD = tableW / 3;
              const footerH = 52;
              const pageH = 277; // A4 portrait usable
              const spaceLeft = pageH - doc.lastAutoTable.finalY;
              const footerStartY =
                spaceLeft < footerH
                  ? (() => {
                      doc.addPage();
                      return 15;
                    })()
                  : doc.lastAutoTable.finalY + 5;

              doc.autoTable({
                startY: footerStartY,
                margin: { left: marginL, right: marginR },
                tableWidth: tableW,
                body: [
                  [
                    {
                      content: "Diketahui",
                      styles: { halign: "center", valign: "middle" },
                    },
                    {
                      content: "Diperiksa",
                      styles: { halign: "center", valign: "middle" },
                    },
                    {
                      content: "Disusun",
                      styles: { halign: "center", valign: "middle" },
                    },
                  ],
                  [
                    { content: "", styles: { minCellHeight: 22 } },
                    { content: "" },
                    { content: "" },
                  ],
                  [
                    {
                      content: "Hartono Mulyo Raharjo",
                      styles: { halign: "center", valign: "middle" },
                    },
                    {
                      content: "Adrian Soesanto",
                      styles: { halign: "center", valign: "middle" },
                    },
                    {
                      content: "Nur Rohman Setiawan",
                      styles: { halign: "center", valign: "middle" },
                    },
                  ],
                  [
                    {
                      content: "Direktur",
                      styles: { halign: "center", valign: "middle" },
                    },
                    {
                      content: "Manajer Operasional",
                      styles: { halign: "center", valign: "middle" },
                    },
                    {
                      content: "Supervisor K3",
                      styles: { halign: "center", valign: "middle" },
                    },
                  ],
                ],
                styles: { ...baseStyle },
                columnStyles: {
                  0: { cellWidth: colTTD },
                  1: { cellWidth: colTTD },
                  2: { cellWidth: colTTD },
                },
                theme: "grid",
              });
              doc.save("JSA-LOG.pdf");
            }

            img.onload = function () {
              logoB64 = toB64(img);
              if (smk3B64 || img2.complete) buildPDF();
            };
            img2.onload = function () {
              smk3B64 = toB64(img2);
              if (logoB64) buildPDF();
            };
            img2.onerror = function () {
              if (logoB64) buildPDF();
            };
            img.src = "logo.png";
            img2.src = "smk3.png";
          },
        };
      })();
