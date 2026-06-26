      let DOC_META = {
        noDok: "FR/PK3/JSA/002",
        noRev: "0",
        tglTerbit: "10 MEI 2022",
      };
      const LOGO_KIRI =
        "https://raw.githubusercontent.com/muhamadqosas/pdf-processing-system/refs/heads/main/Picture1.png";
      const LOGO_KANAN =
        "https://raw.githubusercontent.com/muhamadqosas/pdf-processing-system/refs/heads/main/Picture2.png";

      function escHTML(s) {
        if (s === undefined || s === null) return "";
        return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>");
      }

      // templateStyles: CSS tabel 100% diambil dari TEMPLATE_MULTI_HALAMAN_3_SHEET_PDF.html
      // (struktur header repeat per-halaman, baris TTD tunggal di akhir, dsb.)
      function templateStyles() {
        return `
        body { font-family:'Arial Narrow', Arial, sans-serif; background:#fff; padding:0; margin:0; }
        .sheet-title { font-size:11px; font-weight:bold; margin:0 0 3px 1px; color:#444; }
        table { border-collapse:collapse; width:100%; table-layout:fixed; border:1.5px solid #000; }
        td { border:0.5px solid #555; font-size:10.5px; padding:2px 4px; vertical-align:middle; text-align:center; word-wrap:break-word; overflow-wrap:break-word; }
        .l  { text-align:left; }
        .b  { font-weight:bold; }
        .big{ font-size:13px; font-weight:bold; }
        .top{ vertical-align:top; }
        .rh { height:20px; }
        .rh-atr { height:34px; }
        .ttd-label { height:20px; }
        .ttd-label td { font-weight:bold; }
        .ttd-space { height:60px; }
        .ttd-name  { height:18px; }
        .ttd-name td { text-decoration:underline; }
        .ttd-jabatan { height:18px; }
        thead { display:table-header-group; }
        tbody { display:table-row-group; }
        tr, td { page-break-inside:avoid; break-inside:avoid; }
        table { page-break-inside:auto; break-inside:auto; }
        .page-portrait, .page-landscape { background:#fff; margin:0 auto; box-sizing:border-box; }
        .page-portrait  { width:794px;  padding:28px; }
        .page-landscape { width:1123px; padding:38px; }
        @media print {
          body { background:#fff; margin:0; padding:0; }
          .page-portrait, .page-landscape { box-shadow:none !important; margin:0 !important; }
        }
      `;
      }

      function wrapStandaloneDoc(title, bodyHTML) {
        return (
          `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">` +
          `<title>${escHTML(title)}</title><style>${templateStyles()}</style></head>` +
          `<body>${bodyHTML}</body></html>`
        );
      }

      // wrapSheetPage: bungkus satu tabel sheet ke dalam div .page-portrait / .page-landscape
      // - struktur ini PERSIS mengikuti TEMPLATE_MULTI_HALAMAN_3_SHEET_PDF.html, supaya
      // downloadPDF() (logika row-by-row page-breaking) bisa mengukur & memotong tabel
      // dengan cara yang sama seperti pada template aslinya.
      function wrapSheetPage(sheetTitle, orientation, tableHTML) {
        const pageClass =
          orientation === "portrait" ? "page-portrait" : "page-landscape";
        return `
      <div class="${pageClass}">
        <div class="sheet-title">Sheet: ${escHTML(sheetTitle)}</div>
        ${tableHTML}
      </div>`;
      }

      // ---- Sheet: JSA LOG  (struktur tabel 100% dari template - A4 Landscape) ----
      function buildJSALogSheet(entries) {
        const list = entries && entries.length ? entries : [{}];
        const rows = list
          .map(
            (e, i) => `
          <tr class="rh">
            <td>${i + 1}</td>
            <td class="l">${escHTML(e.noFormJSA)}</td>
            <td>${e.tanggal ? fmtDate(e.tanggal) : ""}</td>
            <td>${escHTML(e.resiko)}</td>
            <td class="l">${escHTML(e.jenisPekerjaan)}</td>
            <td class="l">${escHTML(e.lokasi)}</td>
            <td class="l">${escHTML(e.penanggungjawab)}</td>
          </tr>`,
          )
          .join("");

        const table = `
        <table>
          <colgroup>
            <col style="width:111px"><col style="width:237px"><col style="width:106px">
            <col style="width:106px"><col style="width:174px"><col style="width:106px"><col style="width:208px">
          </colgroup>
          <thead>
          <tr class="rh">
            <td rowspan="3" style="padding:2px;">
              <img src="${LOGO_KIRI}" style="max-width:100%;max-height:50px;width:auto;height:auto;display:block;margin:0 auto;">
            </td>
            <td colspan="3" rowspan="3" class="big">FORM JSA LOG</td>
            <td rowspan="3" style="padding:2px;">
              <img src="${LOGO_KANAN}" style="max-width:100%;max-height:50px;width:auto;height:auto;display:block;margin:0 auto;">
            </td>
            <td class="l" style="font-size:9px;"><b>No. Dok</b></td>
            <td class="l" style="font-size:9px;">${DOC_META.noDok}</td>
          </tr>
          <tr class="rh">
            <td class="l" style="font-size:9px;"><b>No. Rev</b></td>
            <td class="l" style="font-size:9px;">${DOC_META.noRev}</td>
          </tr>
          <tr class="rh">
            <td class="l" style="font-size:9px;"><b>Tgl Terbit</b></td>
            <td class="l" style="font-size:9px;">${DOC_META.tglTerbit}</td>
          </tr>
          <tr class="rh">
            <td class="b">No</td>
            <td class="b">No. Form JSA</td>
            <td class="b">Tanggal</td>
            <td class="b">Resiko</td>
            <td class="b">Jenis Pekerjaan</td>
            <td class="b">Lokasi</td>
            <td class="b">Penanggung Jawab</td>
          </tr>
          </thead>
          <tbody>
          ${rows}
          <tr class="ttd-label">
            <td colspan="2">Diketahui</td>
            <td colspan="3">Diperiksa</td>
            <td colspan="2">Disusun</td>
          </tr>
          <tr><td colspan="2" style="height:60px;"></td><td colspan="3"></td><td colspan="2"></td></tr>
          <tr class="ttd-name">
            <td colspan="2">Hartono Mulyo Raharjo</td>
            <td colspan="3">Adrian Soesanto</td>
            <td colspan="2">Nur Rohman Setiawan</td>
          </tr>
          <tr class="ttd-jabatan">
            <td colspan="2">Direktur</td>
            <td colspan="3">Manajer Operasional</td>
            <td colspan="2">Supervisor K3</td>
          </tr>
          </tbody>
        </table>`;
        return wrapSheetPage("JSA LOG", "landscape", table);
      }

      // ---- Sheet: JSA  (struktur tabel 100% dari template - A4 Portrait) ----
      function buildJSASheet(payload) {
        const h = payload.header || {};
        const langkah =
          payload.langkah && payload.langkah.length ? payload.langkah : [{}];
        const apdList = h.apdList && h.apdList.length ? h.apdList : [];

        const apdHTML = apdList.length
          ? apdList.map((a) => `<div>${escHTML(a)}</div>`).join("")
          : "<div>-</div>";

        // namaPelaksana: input teks tunggal, dipisah per baris/koma jadi list
        const namaPelaksanaList = String(h.namaPelaksana || "")
          .split(/\r?\n|,/)
          .map((s) => s.trim())
          .filter(Boolean);
        const namaPelaksanaHTML = namaPelaksanaList.length
          ? namaPelaksanaList.map((n) => `<div>${escHTML(n)}</div>`).join("")
          : "<div>-</div>";

        const stepRows = langkah
          .map(
            (l, i) => `
          <tr class="rh-atr">
            <td colspan="1">${i + 1}</td>
            <td colspan="3" class="l">${escHTML(l.urutanPekerjaan)}</td>
            <td colspan="2" class="l">${escHTML(l.potensiBahaya)}</td>
            <td colspan="3" class="l">${escHTML(l.upayaPengendalian)}</td>
          </tr>`,
          )
          .join("");

        const table = `
        <table style="border:1.5px solid #000;">
          <colgroup>
            <col style="width:30px"><col style="width:90px"><col style="width:120px"><col style="width:10px">
            <col style="width:110px"><col style="width:130px"><col style="width:80px"><col style="width:98px">
          </colgroup>
          <thead>
          <tr style="height:20px;">
            <td rowspan="3" colspan="2" style="border:none;border-right:0.5px solid #555;padding:2px;text-align:center;">
              <img src="${LOGO_KIRI}" style="max-width:100%;max-height:50px;width:auto;height:auto;display:block;margin:0 auto;">
            </td>
            <td colspan="4" rowspan="3" class="big" style="border:none;border-right:0.5px solid #555;">JOB SAFETY ANALYSIS</td>
            <td rowspan="3" colspan="1" style="border:none;border-right:0.5px solid #555;padding:2px;text-align:center;">
              <img src="${LOGO_KANAN}" style="max-width:100%;max-height:50px;width:auto;height:auto;display:block;margin:0 auto;">
            </td>
            <td class="l b" style="font-size:9px;padding:1px 4px;">No. Dok</td>
            <td class="l" style="font-size:9px;padding:1px 4px;">${DOC_META.noDok}</td>
          </tr>
          <tr style="height:20px;">
            <td class="l b" style="font-size:9px;padding:1px 4px;">No. Rev</td>
            <td class="l" style="font-size:9px;padding:1px 4px;">${DOC_META.noRev}</td>
          </tr>
          <tr style="height:20px;">
            <td class="l b" style="font-size:9px;padding:1px 4px;">Tgl Terbit</td>
            <td class="l" style="font-size:9px;padding:1px 4px;">${DOC_META.tglTerbit}</td>
          </tr>
          <tr style="height:0px;">
            <td colspan="9" style="border:none;border-top:1.5px solid #000;padding:0;"></td>
          </tr>
          <tr>
            <td colspan="5" class="l" style="border:none;padding:1px 5px;font-size:10.5px;">
              <div style="display:flex;"><span style="display:inline-block;width:95px;font-weight:bold;">No. JSA</span><span style="width:12px;">:</span><span>${escHTML(h.noJSA)}</span></div>
            </td>
            <td colspan="4" class="l" style="border:none;padding:1px 5px;font-size:10.5px;">
              <div style="display:flex;"><span style="display:inline-block;width:95px;font-weight:bold;">Tanggal</span><span style="width:12px;">:</span><span>${h.tanggal ? fmtDate(h.tanggal) : ""}</span></div>
            </td>
          </tr>
          <tr>
            <td colspan="5" class="l" style="border:none;padding:1px 5px;font-size:10.5px;">
              <div style="display:flex;"><span style="display:inline-block;width:95px;font-weight:bold;">Jenis Pekerjaan</span><span style="width:12px;">:</span><span>${escHTML(h.jenisPekerjaan)}</span></div>
            </td>
            <td colspan="4" class="l" style="border:none;padding:1px 5px;font-size:10.5px;">
              <div style="display:flex;"><span style="display:inline-block;width:95px;font-weight:bold;">Lokasi Pekerjaan</span><span style="width:12px;">:</span><span>${escHTML(h.lokasi)}</span></div>
            </td>
          </tr>
          <tr>
            <td colspan="5" class="l" style="border:none;padding:1px 5px;font-size:10.5px;vertical-align:top;">
              <div style="display:flex;"><span style="display:inline-block;width:95px;font-weight:bold;">Pengawas</span><span style="width:12px;">:</span><span>${escHTML(h.pengawas)}</span></div>
            </td>
            <td colspan="4" class="l" style="border:none;padding:1px 5px;font-size:10.5px;vertical-align:top;">
            </td>
          </tr>
          <tr>
            <td colspan="5" class="l" style="border:none;padding:1px 5px;font-size:10.5px;vertical-align:top;">
              <div style="display:flex;align-items:flex-start;">
                <span style="display:inline-block;width:95px;font-weight:bold;flex-shrink:0;">APD</span>
                <span style="width:12px;flex-shrink:0;">:</span>
                <span style="line-height:1.7;">${apdHTML}</span>
              </div>
            </td>
            <td colspan="4" class="l" style="border:none;padding:1px 5px;font-size:10.5px;vertical-align:top;">
              <div style="display:flex;align-items:flex-start;">
                <span style="display:inline-block;width:95px;font-weight:bold;flex-shrink:0;">Nama Pelaksana</span>
                <span style="width:12px;flex-shrink:0;">:</span>
                <span style="line-height:1.7;">${namaPelaksanaHTML}</span>
              </div>
            </td>
          </tr>
          <tr style="height:6px;">
            <td colspan="9" style="border:none;border-top:1.5px solid #000;padding:0;"></td>
          </tr>
          <tr class="rh">
            <td class="b" colspan="1">No.</td>
            <td class="b" colspan="3">Urutan Pekerjaan</td>
            <td class="b" colspan="2">Potensi Bahaya</td>
            <td class="b" colspan="3">Upaya Pengendalian</td>
          </tr>
          </thead>
          <tbody>
          ${stepRows}
          <tr><td colspan="9" style="height:20px;border-left:none;border-right:none;"></td></tr>
          <tr class="ttd-label">
            <td colspan="3">Dianalisa</td>
            <td colspan="3">Diperiksa</td>
            <td colspan="3">Disetujui</td>
          </tr>
          <tr><td colspan="3" style="height:60px;"></td><td colspan="3"></td><td colspan="3"></td></tr>
          <tr class="ttd-name">
            <td colspan="3">Nur Rohman Setiawan</td>
            <td colspan="3">Adrian Soesanto</td>
            <td colspan="3">Hartono Mulyo Raharjo</td>
          </tr>
          <tr class="ttd-jabatan">
            <td colspan="3">Supervisor K3</td>
            <td colspan="3">Manajer Operasional</td>
            <td colspan="3">Direktur</td>
          </tr>
          </tbody>
        </table>`;
        return wrapSheetPage("JSA", "portrait", table);
      }

      // ---- Sheet: IBPPR  (struktur tabel 100% dari template - A4 Landscape) ----
      function buildIBPPRSheet(payload) {
        const h = payload.header || {};
        const baris =
          payload.baris && payload.baris.length ? payload.baris : [{}];
        const dataRows = baris
          .map(
            (r, i) => `
          <tr class="rh-atr">
            <td>${i + 1}</td>
            <td class="l">${escHTML(r.aktivitas)}</td>
            <td class="l">${escHTML(r.potensiBahaya)}</td>
            <td class="l">${escHTML(r.resikoAwal)}</td>
            <td class="l">${escHTML(r.akibat)}</td>
            <td>${escHTML(r.paparan)}</td>
            <td>${escHTML(r.peluang)}</td>
            <td><b>${r.nilai || ""}</b></td>
            <td>${escHTML(r.tingkatResiko)}</td>
            <td class="l">${escHTML(r.pengendalian)}</td>
          </tr>`,
          )
          .join("");

        const table = `
        <table>
          <colgroup>
            <col style="width:30px"><col style="width:160px"><col style="width:150px"><col style="width:100px">
            <col style="width:100px"><col style="width:45px"><col style="width:45px"><col style="width:38px">
            <col style="width:65px"><col style="width:314px">
          </colgroup>
          <thead>
          <tr class="rh">
            <td rowspan="3" colspan="2" style="padding:2px;">
              <img src="${LOGO_KIRI}" style="max-width:100%;max-height:50px;width:auto;height:auto;display:block;margin:0 auto;">
            </td>
            <td colspan="4" rowspan="3" class="big">IDENTIFIKASI BAHAYA, PENILAIAN &amp; PENGENDALIAN RESIKO</td>
            <td rowspan="3" colspan="2" style="padding:2px;">
              <img src="${LOGO_KANAN}" style="max-width:100%;max-height:50px;width:auto;height:auto;display:block;margin:0 auto;">
            </td>
            <td class="l" style="font-size:9px;"><b>No. Dok</b></td>
            <td class="l" style="font-size:9px;">${DOC_META.noDok}</td>
          </tr>
          <tr class="rh">
            <td class="l" style="font-size:9px;"><b>No. Rev</b></td>
            <td class="l" style="font-size:9px;">${DOC_META.noRev}</td>
          </tr>
          <tr class="rh">
            <td class="l" style="font-size:9px;"><b>Tgl Terbit</b></td>
            <td class="l" style="font-size:9px;">${DOC_META.tglTerbit}</td>
          </tr>
          <tr>
            <td colspan="10" class="l" style="border-bottom:none;padding:1px 5px;">
              <div style="display:flex;"><span style="display:inline-block;width:110px;font-weight:bold;">No. IBPPR</span><span style="width:12px;font-weight:bold;">:</span><span>${escHTML(h.noForm)}</span></div>
            </td>
          </tr>
          <tr>
            <td colspan="10" class="l" style="border-top:none;border-bottom:none;padding:1px 5px;">
              <div style="display:flex;"><span style="display:inline-block;width:110px;font-weight:bold;">Nama Pekerjaan</span><span style="width:12px;font-weight:bold;">:</span><span>${escHTML(h.namaPekerjaan)}</span></div>
            </td>
          </tr>
          <tr>
            <td colspan="10" class="l" style="border-top:none;padding:1px 5px;">
              <div style="display:flex;"><span style="display:inline-block;width:110px;font-weight:bold;">Lokasi</span><span style="width:12px;font-weight:bold;">:</span><span>${escHTML(h.lokasi)}</span></div>
            </td>
          </tr>
          <tr>
            <td class="b" rowspan="2">No.</td>
            <td class="b" rowspan="2">Aktivitas Pekerjaan</td>
            <td class="b" rowspan="2">Potensi Bahaya</td>
            <td class="b" rowspan="2">Resiko</td>
            <td class="b" rowspan="2">Akibat / Dampak</td>
            <td colspan="4" class="b" style="font-size:9.5px;">Penilaian Resiko</td>
            <td class="b" rowspan="2">Pengendalian Resiko</td>
          </tr>
          <tr>
            <td class="b" style="font-size:9px;">Paparan<br>(1–5)</td>
            <td class="b" style="font-size:9px;">Peluang<br>(1–5)</td>
            <td class="b" style="font-size:9px;">Nilai</td>
            <td class="b" style="font-size:9px;">Tingkat</td>
          </tr>
          </thead>
          <tbody>
          ${dataRows}
          <tr><td colspan="10" style="height:16px;border-left:none;border-right:none;"></td></tr>
          <tr class="ttd-label">
            <td colspan="3">Disusun</td>
            <td colspan="6">Diperiksa</td>
            <td colspan="1">Disetujui</td>
          </tr>
          <tr><td colspan="3" style="height:60px;"></td><td colspan="6"></td><td colspan="1"></td></tr>
          <tr class="ttd-name">
            <td colspan="3">Nur Rohman Setiawan</td>
            <td colspan="6">Adrian Soesanto</td>
            <td colspan="1">Hartono Mulyo Raharjo</td>
          </tr>
          <tr class="ttd-jabatan">
            <td colspan="3">Supervisor K3</td>
            <td colspan="6">Manajer Operasional</td>
            <td colspan="1">Direktur</td>
          </tr>
          </tbody>
        </table>`;
        return wrapSheetPage("IBPPR", "landscape", table);
      }

      /* =========================================================================
       VEKTOR PDF GENERATOR (JSA & IBPPR)
       ========================================================================= */
      // Helper untuk memuat gambar lokal menjadi base64 secara asynchronous
      async function loadImageBase64(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 500; // Capping logo resolution to 200px max (saves huge PDF space while maintaining crisp look)
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Generator PDF Vektor JSA
      async function exportJSAPDF(payload, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ compress: true,
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const marginL = 10;
        const marginR = 10;
        const pageW = 210;
        const tableW = pageW - marginL - marginR; // 190 mm

        const borderStyle = { lineColor: [0, 0, 0], lineWidth: 0.3 };
        const baseStyle = {
          ...borderStyle,
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 8.5,
          cellPadding: 2.5,
          font: "helvetica",
        };

        const pdfBtn = document.getElementById("gen-btn-pdf");
        const pdfLabel = document.getElementById("gen-btn-pdf-label");
        if (pdfBtn) pdfBtn.disabled = true;
        if (pdfLabel) pdfLabel.textContent = "Membuat PDF…";

        try {
          // Load logos
          const logoB64 = await loadImageBase64("logo.png");
          const smk3B64 = await loadImageBase64("smk3.png");

          // ── 1. HEADER TABLE ──
          const colLogo = 22;
          const colSMK3 = 22;
          const colLabel = 25;
          const colVal = 30;
          const colJudul = tableW - colLogo - colSMK3 - colLabel - colVal; // 190 - 22 - 22 - 25 - 30 = 91 mm

          doc.autoTable({
            startY: 10,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            body: [
              [
                { content: "", rowSpan: 3, styles: { cellWidth: colLogo, minCellHeight: 20 } },
                {
                  content: "JOB SAFETY ANALYSIS",
                  rowSpan: 3,
                  styles: {
                    cellWidth: colJudul,
                    halign: "center",
                    valign: "middle",
                    fontStyle: "bold",
                    fontSize: 11,
                  },
                },
                { content: "", rowSpan: 3, styles: { cellWidth: colSMK3, minCellHeight: 20 } },
                { content: "No. Dok", styles: { cellWidth: colLabel, fontStyle: "bold" } },
                { content: DOC_META.noDok, styles: { cellWidth: colVal } },
              ],
              [
                { content: "No. Rev", styles: { fontStyle: "bold" } },
                { content: DOC_META.noRev },
              ],
              [
                { content: "Tgl Terbit", styles: { fontStyle: "bold" } },
                { content: DOC_META.tglTerbit },
              ],
            ],
            styles: { ...baseStyle },
            theme: "grid",
            didDrawCell(data) {
              if (data.row.index === 0 && data.column.index === 0 && logoB64) {
                const s = 14;
                doc.addImage(
                  logoB64,
                  "PNG",
                  data.cell.x + (data.cell.width - s) / 2,
                  data.cell.y + (data.cell.height - s) / 2,
                  s,
                  s
                );
              }
              if (data.row.index === 0 && data.column.index === 2 && smk3B64) {
                const s = 14;
                doc.addImage(
                  smk3B64,
                  "PNG",
                  data.cell.x + (data.cell.width - s) / 2,
                  data.cell.y + (data.cell.height - s) / 2,
                  s,
                  s
                );
              }
            },
          });

          // ── 2. METADATA SECTION ──
          const h = payload.header || {};
          const apdText = (h.apdList || []).length ? h.apdList.join("\n") : "-";
          
          const namaPelaksanaList = String(h.namaPelaksana || "")
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean);
          const pelaksanaText = namaPelaksanaList.length ? namaPelaksanaList.join("\n") : "-";

          const colMetaLabel = 32;
          const colMetaVal = tableW / 2 - colMetaLabel; // 95 - 32 = 63 mm

          doc.autoTable({
            startY: doc.lastAutoTable.finalY + 3,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            body: [
              [
                { content: "No. JSA", styles: { fontStyle: "bold", cellWidth: colMetaLabel } },
                { content: h.noJSA || "-", styles: { cellWidth: colMetaVal } },
                { content: "Tanggal", styles: { fontStyle: "bold", cellWidth: colMetaLabel } },
                { content: h.tanggal ? fmtDate(h.tanggal) : "-", styles: { cellWidth: colMetaVal } },
              ],
              [
                { content: "Jenis Pekerjaan", styles: { fontStyle: "bold" } },
                { content: h.jenisPekerjaan || "-" },
                { content: "Lokasi Pekerjaan", styles: { fontStyle: "bold" } },
                { content: h.lokasi || "-" },
              ],
              [
                { content: "Pengawas", styles: { fontStyle: "bold" } },
                { content: h.pengawas || "-" },
                { content: "Penanggung Jawab", styles: { fontStyle: "bold" } },
                { content: h.penanggungjawab || "-" },
              ],
              [
                { content: "APD", styles: { fontStyle: "bold", valign: "top" } },
                { content: apdText, styles: { valign: "top" } },
                { content: "Nama Pelaksana", styles: { fontStyle: "bold", valign: "top" } },
                { content: pelaksanaText, styles: { valign: "top" } },
              ],
            ],
            styles: { ...baseStyle, fontSize: 8 },
            theme: "grid",
          });

          // ── 3. STEPS TABLE ──
          const steps = payload.langkah || [];
          const colStepNo = 10;
          const colStepWidth = (tableW - colStepNo) / 3; // (190 - 10) / 3 = 60 mm

          doc.autoTable({
            startY: doc.lastAutoTable.finalY + 4,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            head: [
              [
                { content: "No", styles: { halign: "center", fontStyle: "bold", cellWidth: colStepNo } },
                { content: "Urutan Pekerjaan", styles: { halign: "center", fontStyle: "bold", cellWidth: colStepWidth } },
                { content: "Potensi Bahaya", styles: { halign: "center", fontStyle: "bold", cellWidth: colStepWidth } },
                { content: "Upaya Pengendalian", styles: { halign: "center", fontStyle: "bold", cellWidth: colStepWidth } },
              ],
            ],
            body: steps.map((s, i) => [
              { content: i + 1, styles: { halign: "center" } },
              s.urutanPekerjaan || "-",
              s.potensiBahaya || "-",
              s.upayaPengendalian || "-",
            ]),
            styles: { ...baseStyle, fontSize: 8, valign: "top" },
            headStyles: { fillColor: [240, 240, 240] },
            theme: "grid",
          });

          // ── 4. FOOTER (SIGNATURES) ──
          const colTTD = tableW / 3;
          const footerH = 45;
          const pageH = 280; 
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
                { content: "Dianalisa", styles: { halign: "center", fontStyle: "bold" } },
                { content: "Diperiksa", styles: { halign: "center", fontStyle: "bold" } },
                { content: "Disetujui", styles: { halign: "center", fontStyle: "bold" } },
              ],
              [
                { content: "", styles: { minCellHeight: 18 } },
                { content: "" },
                { content: "" },
              ],
              [
                { content: "Nur Rohman Setiawan", styles: { halign: "center", fontStyle: "bold", textDecoration: "underline" } },
                { content: "Adrian Soesanto", styles: { halign: "center", fontStyle: "bold", textDecoration: "underline" } },
                { content: "Hartono Mulyo Raharjo", styles: { halign: "center", fontStyle: "bold", textDecoration: "underline" } },
              ],
              [
                { content: "Supervisor K3", styles: { halign: "center" } },
                { content: "Manajer Operasional", styles: { halign: "center" } },
                { content: "Direktur", styles: { halign: "center" } },
              ],
            ],
            styles: { ...baseStyle, fontSize: 8 },
            columnStyles: {
              0: { cellWidth: colTTD },
              1: { cellWidth: colTTD },
              2: { cellWidth: colTTD },
            },
            theme: "grid",
          });

          doc.save(filename);
          showToast("✓ PDF JSA berhasil diunduh");
        } catch (err) {
          console.error("[PDF] gagal membuat:", err);
          showToast("⚠ Gagal membuat PDF, coba lagi");
        } finally {
          if (pdfBtn) pdfBtn.disabled = false;
          if (pdfLabel) pdfLabel.textContent = "Download PDF";
        }
      }

      // Generator PDF Vektor IBPPR
      async function exportIBPPRPDF(payload, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ compress: true,
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });

        const marginL = 10;
        const marginR = 10;
        const pageW = 297;
        const tableW = pageW - marginL - marginR; // 277 mm

        const borderStyle = { lineColor: [0, 0, 0], lineWidth: 0.3 };
        const baseStyle = {
          ...borderStyle,
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 8,
          cellPadding: 2,
          font: "helvetica",
        };

        const pdfBtn = document.getElementById("gen-btn-pdf");
        const pdfLabel = document.getElementById("gen-btn-pdf-label");
        if (pdfBtn) pdfBtn.disabled = true;
        if (pdfLabel) pdfLabel.textContent = "Membuat PDF…";

        try {
          // Load logos
          const logoB64 = await loadImageBase64("logo.png");
          const smk3B64 = await loadImageBase64("smk3.png");

          // ── 1. HEADER TABLE ──
          const colLogo = 22;
          const colSMK3 = 22;
          const colLabel = 25;
          const colVal = 35;
          const colJudul = tableW - colLogo - colSMK3 - colLabel - colVal; // 277 - 22 - 22 - 25 - 35 = 173 mm

          doc.autoTable({
            startY: 10,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            body: [
              [
                { content: "", rowSpan: 3, styles: { cellWidth: colLogo, minCellHeight: 18 } },
                {
                  content: "IDENTIFIKASI BAHAYA, PENILAIAN & PENGENDALIAN RESIKO",
                  rowSpan: 3,
                  styles: {
                    cellWidth: colJudul,
                    halign: "center",
                    valign: "middle",
                    fontStyle: "bold",
                    fontSize: 11,
                  },
                },
                { content: "", rowSpan: 3, styles: { cellWidth: colSMK3, minCellHeight: 18 } },
                { content: "No. Dok", styles: { cellWidth: colLabel, fontStyle: "bold" } },
                { content: DOC_META.noDok, styles: { cellWidth: colVal } },
              ],
              [
                { content: "No. Rev", styles: { fontStyle: "bold" } },
                { content: DOC_META.noRev },
              ],
              [
                { content: "Tgl Terbit", styles: { fontStyle: "bold" } },
                { content: DOC_META.tglTerbit },
              ],
            ],
            styles: { ...baseStyle },
            theme: "grid",
            didDrawCell(data) {
              if (data.row.index === 0 && data.column.index === 0 && logoB64) {
                const s = 14;
                doc.addImage(
                  logoB64,
                  "PNG",
                  data.cell.x + (data.cell.width - s) / 2,
                  data.cell.y + (data.cell.height - s) / 2,
                  s,
                  s
                );
              }
              if (data.row.index === 0 && data.column.index === 2 && smk3B64) {
                const s = 14;
                doc.addImage(
                  smk3B64,
                  "PNG",
                  data.cell.x + (data.cell.width - s) / 2,
                  data.cell.y + (data.cell.height - s) / 2,
                  s,
                  s
                );
              }
            },
          });

          // ── 2. METADATA SECTION ──
          const h = payload.header || {};
          const colMetaLabel = 40;
          const colMetaVal = tableW - colMetaLabel;

          doc.autoTable({
            startY: doc.lastAutoTable.finalY + 3,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            body: [
              [
                { content: "No. IBPPR", styles: { fontStyle: "bold", cellWidth: colMetaLabel } },
                { content: h.noForm || "-", styles: { cellWidth: colMetaVal } },
              ],
              [
                { content: "Nama Pekerjaan", styles: { fontStyle: "bold" } },
                { content: h.namaPekerjaan || "-" },
              ],
              [
                { content: "Lokasi", styles: { fontStyle: "bold" } },
                { content: h.lokasi || "-" },
              ],
            ],
            styles: { ...baseStyle, fontSize: 8 },
            theme: "grid",
          });

          // ── 3. DATA TABLE ──
          const baris = payload.baris || [];
          const colNo = 10;
          const colAktivitas = 45;
          const colBahaya = 40;
          const colResiko = 30;
          const colAkibat = 30;
          const colPaparan = 15;
          const colPeluang = 15;
          const colNilai = 12;
          const colTingkat = 20;
          const colPengendalian = 60; // 10+45+40+30+30+15+15+12+20+60 = 277 mm

          doc.autoTable({
            startY: doc.lastAutoTable.finalY + 4,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            head: [
              [
                { content: "No.", rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold", cellWidth: colNo } },
                { content: "Aktivitas Pekerjaan", rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold", cellWidth: colAktivitas } },
                { content: "Potensi Bahaya", rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold", cellWidth: colBahaya } },
                { content: "Resiko", rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold", cellWidth: colResiko } },
                { content: "Akibat / Dampak", rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold", cellWidth: colAkibat } },
                { content: "Penilaian Resiko", colSpan: 4, styles: { halign: "center", valign: "middle", fontStyle: "bold" } },
                { content: "Pengendalian Resiko", rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold", cellWidth: colPengendalian } }
              ],
              [
                { content: "Paparan\n(1-5)", styles: { halign: "center", valign: "middle", fontStyle: "bold", cellWidth: colPaparan } },
                { content: "Peluang\n(1-5)", styles: { halign: "center", valign: "middle", fontStyle: "bold", cellWidth: colPeluang } },
                { content: "Nilai", styles: { halign: "center", valign: "middle", fontStyle: "bold", cellWidth: colNilai } },
                { content: "Tingkat", styles: { halign: "center", valign: "middle", fontStyle: "bold", cellWidth: colTingkat } }
              ]
            ],
            body: baris.map((r, i) => [
              { content: i + 1, styles: { halign: "center" } },
              r.aktivitas || "-",
              r.potensiBahaya || "-",
              r.resikoAwal || "-",
              r.akibat || "-",
              { content: r.paparan || "-", styles: { halign: "center" } },
              { content: r.peluang || "-", styles: { halign: "center" } },
              { content: r.nilai || "-", styles: { halign: "center", fontStyle: "bold" } },
              { content: r.tingkatResiko || "-", styles: { halign: "center" } },
              r.pengendalian || "-",
            ]),
            styles: { ...baseStyle, fontSize: 8, valign: "top" },
            headStyles: { fillColor: [240, 240, 240] },
            theme: "grid",
          });

          // ── 4. FOOTER (SIGNATURES) ──
          const colTTD = tableW / 3;
          const footerH = 45;
          const pageH = 195; // landscape usable height (A4 height is 210mm)
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
                { content: "Disusun", styles: { halign: "center", fontStyle: "bold" } },
                { content: "Diperiksa", styles: { halign: "center", fontStyle: "bold" } },
                { content: "Disetujui", styles: { halign: "center", fontStyle: "bold" } },
              ],
              [
                { content: "", styles: { minCellHeight: 18 } },
                { content: "" },
                { content: "" },
              ],
              [
                { content: "Nur Rohman Setiawan", styles: { halign: "center", fontStyle: "bold", textDecoration: "underline" } },
                { content: "Adrian Soesanto", styles: { halign: "center", fontStyle: "bold", textDecoration: "underline" } },
                { content: "Hartono Mulyo Raharjo", styles: { halign: "center", fontStyle: "bold", textDecoration: "underline" } },
              ],
              [
                { content: "Supervisor K3", styles: { halign: "center" } },
                { content: "Manajer Operasional", styles: { halign: "center" } },
                { content: "Direktur", styles: { halign: "center" } },
              ],
            ],
            styles: { ...baseStyle, fontSize: 8 },
            columnStyles: {
              0: { cellWidth: colTTD },
              1: { cellWidth: colTTD },
              2: { cellWidth: colTTD },
            },
            theme: "grid",
          });

          doc.save(filename);
          showToast("✓ PDF IBPPR berhasil diunduh");
        } catch (err) {
          console.error("[PDF] gagal membuat:", err);
          showToast("⚠ Gagal membuat PDF, coba lagi");
        } finally {
          if (pdfBtn) pdfBtn.disabled = false;
          if (pdfLabel) pdfLabel.textContent = "Download PDF";
        }
      }

      // ---- Sheet: LAPORAN HARIAN (struktur tabel A4 Portrait) ----
      function buildLaporanSheet(val) {
        return `
        <table>
          <colgroup>
            <col style="width:150px"><col style="width:250px">
            <col style="width:150px"><col style="width:244px">
          </colgroup>
          <thead>
          <tr class="rh">
            <td style="padding:2px;">
              <img src="${LOGO_KIRI}" style="max-width:100%;max-height:50px;width:auto;height:auto;display:block;margin:0 auto;">
            </td>
            <td colspan="2" class="big">LAPORAN HARIAN PROYEK</td>
            <td class="l" style="font-size:9px;"><b>No. Dok:</b> ${DOC_META.noDok}<br><b>No. Rev:</b> ${DOC_META.noRev}<br><b>Tgl Terbit:</b> ${DOC_META.tglTerbit}</td>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td class="b l">No. Laporan</td>
            <td class="l">${escHTML(val.noLaporan)}</td>
            <td class="b l">Tanggal</td>
            <td class="l">${val.tanggal ? fmtDate(val.tanggal) : ""}</td>
          </tr>
          <tr>
            <td class="b l">Nama Pengawas</td>
            <td class="l">${escHTML(val.pengawas)}</td>
            <td class="b l">Lokasi Pekerjaan</td>
            <td class="l">${escHTML(val.lokasi)}</td>
          </tr>
          <tr>
            <td class="b l">Kondisi Cuaca</td>
            <td class="l">${escHTML(val.cuaca)}</td>
            <td class="b l">Jam Kerja / Shift</td>
            <td class="l">${escHTML(val.jamMulai)} s/d ${escHTML(val.jamSelesai)} WIB</td>
          </tr>
          <tr>
            <td class="b l">Jumlah Tenaga Kerja</td>
            <td class="l" colspan="3">${escHTML(val.jumlahPekerja)} Orang</td>
          </tr>
          
          <tr style="background:#f3f4f6"><td colspan="4" class="b l big" style="text-align:left;height:24px">Detail Aktivitas &amp; Progres</td></tr>
          <tr>
            <td class="b l top">Deskripsi Aktivitas Hari Ini</td>
            <td class="l top" colspan="3" style="min-height:80px;text-align:left">${escHTML(val.deskripsiPekerjaan)}</td>
          </tr>
          <tr>
            <td class="b l">Persentase Progres Kerja</td>
            <td class="l" colspan="3"><b>${escHTML(val.persenProgres)}%</b></td>
          </tr>

          <tr style="background:#f3f4f6"><td colspan="4" class="b l big" style="text-align:left;height:24px">Aspek Keselamatan Kerja (K3)</td></tr>
          <tr>
            <td class="b l top">Temuan Bahaya (Unsafe Act/Condition)</td>
            <td class="l top" colspan="3" style="min-height:50px;text-align:left">${escHTML(val.temuanK3 || "-")}</td>
          </tr>
          <tr>
            <td class="b l top">Tindakan Koreksi Langsung</td>
            <td class="l top" colspan="3" style="min-height:50px;text-align:left">${escHTML(val.tindakanKoreksi || "-")}</td>
          </tr>

          <tr style="background:#f3f4f6"><td colspan="4" class="b l big" style="text-align:left;height:24px">Logistik &amp; Sumber Daya</td></tr>
          <tr>
            <td class="b l top">Alat/Mesin Utama yang Digunakan</td>
            <td class="l top" colspan="3" style="min-height:40px;text-align:left">${escHTML(val.alat || "-")}</td>
          </tr>
          <tr>
            <td class="b l top">Material Utama yang Digunakan</td>
            <td class="l top" colspan="3" style="min-height:40px;text-align:left">${escHTML(val.material || "-")}</td>
          </tr>
          
          <tr class="ttd-label"><td colspan="2">Dibuat Oleh:</td><td colspan="2">Diketahui Oleh:</td></tr>
          <tr class="ttd-space"><td colspan="2"></td><td colspan="2"></td></tr>
          <tr class="ttd-name"><td colspan="2">${escHTML(val.pengawas)}</td><td colspan="2">Penanggung Jawab K3</td></tr>
          <tr class="ttd-jabatan"><td colspan="2">Pengawas Lapangan</td><td colspan="2">Pimpinan Unit / HSE</td></tr>
          </tbody>
        </table>`;
      }

      async function exportLaporanPDF(payload, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ compress: true,
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const marginL = 10;
        const marginR = 10;
        const pageW = 210;
        const tableW = pageW - marginL - marginR; // 190 mm

        const borderStyle = { lineColor: [0, 0, 0], lineWidth: 0.3 };
        const baseStyle = {
          ...borderStyle,
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 8.5,
          cellPadding: 2.5,
          font: "helvetica",
        };

        const pdfBtn = document.getElementById("gen-btn-pdf");
        const pdfLabel = document.getElementById("gen-btn-pdf-label");
        if (pdfBtn) pdfBtn.disabled = true;
        if (pdfLabel) pdfLabel.textContent = "Membuat PDF…";

        try {
          const logoB64 = await loadImageBase64("logo.png");
          const smk3B64 = await loadImageBase64("smk3.png");

          // ── 1. HEADER TABLE ──
          const colLogo = 22;
          const colSMK3 = 22;
          const colLabel = 25;
          const colVal = 30;
          const colJudul = tableW - colLogo - colSMK3 - colLabel - colVal; // 190 - 22 - 22 - 25 - 30 = 91 mm

          doc.autoTable({
            startY: 10,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            body: [
              [
                { content: "", rowSpan: 3, styles: { cellWidth: colLogo, minCellHeight: 20 } },
                {
                  content: "LAPORAN HARIAN PROYEK",
                  rowSpan: 3,
                  styles: {
                    cellWidth: colJudul,
                    halign: "center",
                    valign: "middle",
                    fontStyle: "bold",
                    fontSize: 11,
                  },
                },
                { content: "", rowSpan: 3, styles: { cellWidth: colSMK3, minCellHeight: 20 } },
                { content: "No. Dok", styles: { cellWidth: colLabel, fontStyle: "bold" } },
                { content: DOC_META.noDok, styles: { cellWidth: colVal } },
              ],
              [
                { content: "No. Rev", styles: { fontStyle: "bold" } },
                { content: DOC_META.noRev },
              ],
              [
                { content: "Tgl Terbit", styles: { fontStyle: "bold" } },
                { content: DOC_META.tglTerbit },
              ],
            ],
            styles: { ...baseStyle },
            theme: "grid",
            didDrawCell(data) {
              if (data.row.index === 0 && data.column.index === 0 && logoB64) {
                const s = 14;
                doc.addImage(
                  logoB64,
                  "PNG",
                  data.cell.x + (data.cell.width - s) / 2,
                  data.cell.y + (data.cell.height - s) / 2,
                  s,
                  s
                );
              }
              if (data.row.index === 0 && data.column.index === 2 && smk3B64) {
                const s = 14;
                doc.addImage(
                  smk3B64,
                  "PNG",
                  data.cell.x + (data.cell.width - s) / 2,
                  data.cell.y + (data.cell.height - s) / 2,
                  s,
                  s
                );
              }
            },
          });

          // ── 2. INFORMASI UMUM ──
          doc.autoTable({
            startY: doc.lastAutoTable.finalY + 4,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            body: [
              [
                { content: "No. Laporan", styles: { fontStyle: "bold", cellWidth: 40 } },
                { content: payload.noLaporan || "-" },
                { content: "Tanggal", styles: { fontStyle: "bold", cellWidth: 40 } },
                { content: payload.tanggal ? fmtDate(payload.tanggal) : "-" },
              ],
              [
                { content: "Nama Pengawas", styles: { fontStyle: "bold" } },
                { content: payload.pengawas || "-" },
                { content: "Lokasi Pekerjaan", styles: { fontStyle: "bold" } },
                { content: payload.lokasi || "-" },
              ],
              [
                { content: "Kondisi Cuaca", styles: { fontStyle: "bold" } },
                { content: payload.cuaca || "Cerah" },
                { content: "Jam Kerja", styles: { fontStyle: "bold" } },
                { content: (payload.jamMulai || "08:00") + " s/d " + (payload.jamSelesai || "17:00") + " WIB" },
              ],
              [
                { content: "Jumlah Tenaga Kerja", styles: { fontStyle: "bold" } },
                { content: (payload.jumlahPekerja || "0") + " Orang", colspan: 3 },
              ],
            ],
            styles: { ...baseStyle },
            theme: "grid",
          });

          // ── 3. DETAIL AKTIVITAS & PROGRES ──
          doc.autoTable({
            startY: doc.lastAutoTable.finalY + 4,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            body: [
              [
                {
                  content: "DETAIL AKTIVITAS & PROGRES KERJA",
                  colspan: 2,
                  styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
                },
              ],
              [
                { content: "Deskripsi Aktivitas Hari Ini", styles: { fontStyle: "bold", cellWidth: 50 } },
                { content: payload.deskripsiPekerjaan || "-", styles: { halign: "left" } },
              ],
              [
                { content: "Persentase Progres Kerja", styles: { fontStyle: "bold" } },
                { content: (payload.persenProgres || "0") + " %", styles: { fontStyle: "bold" } },
              ],
            ],
            styles: { ...baseStyle },
            theme: "grid",
          });

          // ── 4. ASPEK KESELAMATAN KERJA (K3) ──
          doc.autoTable({
            startY: doc.lastAutoTable.finalY + 4,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            body: [
              [
                {
                  content: "ASPEK KESELAMATAN & KESEHATAN KERJA (K3)",
                  colspan: 2,
                  styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
                },
              ],
              [
                { content: "Temuan Bahaya (Unsafe Act/Condition)", styles: { fontStyle: "bold", cellWidth: 50 } },
                { content: payload.temuanK3 || "-", styles: { halign: "left" } },
              ],
              [
                { content: "Tindakan Koreksi Langsung", styles: { fontStyle: "bold" } },
                { content: payload.tindakanKoreksi || "-", styles: { halign: "left" } },
              ],
            ],
            styles: { ...baseStyle },
            theme: "grid",
          });

          // ── 5. LOGISTIK & SUMBER DAYA ──
          doc.autoTable({
            startY: doc.lastAutoTable.finalY + 4,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            body: [
              [
                {
                  content: "LOGISTIK & SUMBER DAYA",
                  colspan: 2,
                  styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
                },
              ],
              [
                { content: "Alat/Mesin Utama yang Digunakan", styles: { fontStyle: "bold", cellWidth: 50 } },
                { content: payload.alat || "-", styles: { halign: "left" } },
              ],
              [
                { content: "Material Utama yang Digunakan", styles: { fontStyle: "bold" } },
                { content: payload.material || "-", styles: { halign: "left" } },
              ],
            ],
            styles: { ...baseStyle },
            theme: "grid",
          });

          // ── 6. SIGN-OFF TTD TABLE ──
          const colTTD = tableW / 2; // 95 mm
          doc.autoTable({
            startY: doc.lastAutoTable.finalY + 6,
            margin: { left: marginL, right: marginR },
            tableWidth: tableW,
            body: [
              [
                { content: "Dibuat Oleh:", styles: { halign: "center", fontStyle: "bold" } },
                { content: "Diketahui Oleh:", styles: { halign: "center", fontStyle: "bold" } },
              ],
              [
                { content: "", styles: { minCellHeight: 18 } },
                { content: "", styles: { minCellHeight: 18 } },
              ],
              [
                {
                  content: payload.pengawas || "Pengawas Lapangan",
                  styles: { halign: "center", fontStyle: "bold", textDecoration: "underline" },
                },
                {
                  content: "Penanggung Jawab K3 / HSE",
                  styles: { halign: "center", fontStyle: "bold", textDecoration: "underline" },
                },
              ],
              [
                { content: "Pengawas Lapangan", styles: { halign: "center", fontSize: 7.5 } },
                { content: "Pimpinan Unit / HSE", styles: { halign: "center", fontSize: 7.5 } },
              ],
            ],
            styles: { ...baseStyle },
            columnStyles: {
              0: { cellWidth: colTTD },
              1: { cellWidth: colTTD },
            },
            theme: "grid",
          });

          doc.save(filename);
        } catch (err) {
          console.error("[PDF] gagal membuat laporan harian:", err);
          showToast("⚠ Gagal membuat PDF Laporan Harian");
          throw err;
        } finally {
          if (pdfBtn) pdfBtn.disabled = false;
          if (pdfLabel) pdfLabel.textContent = "Download PDF";
        }
      }

      /* =========================================================================
       MODAL GENERATE PROGRESS
       ========================================================================= */
