/**
 * GOOGLE APPS SCRIPT BACKEND CODE (JSA & IBPPR Integration)
 * =========================================================================
 * Panduan Penggunaan & Keamanan:
 * 1. Buka Google Sheets Anda.
 * 2. Klik Ekstensi -> Apps Script.
 * 3. Hapus semua kode bawaan dan tempelkan kode di bawah ini.
 * 4. Ganti TOKEN_SECRET di bawah dengan token rahasia Anda sendiri.
 * 5. Klik Deploy -> New Deployment -> Web App.
 *    - Execute as: Me (your-email)
 *    - Who has access: Anyone (ini wajib agar form lapangan bisa mengirim data tanpa login Google)
 * 6. Salin URL Web App yang dihasilkan dan masukkan ke variabel `GAS_URL` di `index.html`.
 * =========================================================================
 */

// Ganti dengan token keamanan pilihan Anda sendiri.
// Kirimkan header/parameter token ini jika Anda ingin membatasi akses di masa mendatang.
const TOKEN_SECRET = "HMJ_SAFETY_TOKEN_2026"; 

/**
 * Endpoint POST
 * Menangani penambahan log JSA (upsert) dan tindakan penghapusan log
 */
function doPost(e) {
  try {
    // 1. Validasi keberadaan payload
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, error: "Payload tidak ditemukan atau kosong" });
    }
    
    // 2. Validasi ukuran payload (maksimal 250KB untuk mencegah spam)
    const rawContent = e.postData.contents;
    if (rawContent.length > 250 * 1024) {
      return responseJSON({ success: false, error: "Payload terlalu besar (maksimal 250KB)" });
    }
    
    const requestData = JSON.parse(rawContent);
    const action = requestData.action;
    const payload = requestData.payload;
    
    // 3. Otorisasi Token (Opsional - aktifkan jika menambahkan token pengaman di masa depan)
    /*
    const clientToken = requestData.token;
    if (clientToken !== TOKEN_SECRET) {
      return responseJSON({ success: false, error: "Unauthorized: Token tidak valid" });
    }
    */

    if (action === "add") {
      return handleAddEntry(payload);
    } else if (action === "delete") {
      return handleDeleteEntry(requestData.id);
    } else if (action === "add_laporan") {
      return handleAddLaporan(payload);
    } else {
      return responseJSON({ success: false, error: "Tindakan (action) tidak dikenal" });
    }
    
  } catch (err) {
    return responseJSON({ success: false, error: "Server Error: " + err.toString() });
  }
}

/**
 * Endpoint GET
 * Menangani pengambilan data riwayat JSA Log
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === "list") {
      return handleListEntries();
    }
    return responseJSON({ success: false, error: "Action parameter wajib diisi (list)" });
  } catch (err) {
    return responseJSON({ success: false, error: "Server Error: " + err.toString() });
  }
}

/**
 * Menyimpan atau memperbarui data JSA Log di sheet "JSA LOG" (Upsert)
 */
function handleAddEntry(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("JSA LOG");
  
  // Jika sheet JSA LOG belum ada, buat baru
  if (!sheet) {
    sheet = ss.insertSheet("JSA LOG");
    // Tulis header kolom
    sheet.appendRow(["No", "No. Form JSA", "Tanggal", "Resiko", "Jenis Pekerjaan", "Lokasi", "Penanggung Jawab"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  const noForm = payload.noFormJSA;
  if (!noForm) {
    return responseJSON({ success: false, error: "No. Form JSA wajib diisi" });
  }
  
  const data = sheet.getDataRange().getValues();
  let foundRowIdx = -1;
  
  // Cari apakah No. Form JSA sudah ada (kolom B, index 1)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(noForm).trim()) {
      foundRowIdx = i + 1; // 1-indexed row number
      break;
    }
  }
  
  const rowData = [
    foundRowIdx !== -1 ? foundRowIdx - 1 : data.length, // Kolom A: No Urut
    noForm,                                            // Kolom B: No. Form JSA
    payload.tanggal || "",                              // Kolom C: Tanggal
    payload.resiko || "-",                              // Kolom D: Resiko
    payload.jenisPekerjaan || "-",                      // Kolom E: Jenis Pekerjaan
    payload.lokasi || "-",                              // Kolom F: Lokasi
    payload.penanggungjawab || "-"                      // Kolom G: Penanggung Jawab
  ];
  
  if (foundRowIdx !== -1) {
    // Update baris yang sudah ada
    sheet.getRange(foundRowIdx, 1, 1, 7).setValues([rowData]);
    return responseJSON({ success: true, updated: true, id: noForm });
  } else {
    // Tambah baris baru
    sheet.appendRow(rowData);
    return responseJSON({ success: true, updated: false, id: noForm });
  }
}

/**
 * Menghapus entri JSA Log dari sheet berdasarkan No. JSA
 */
function handleDeleteEntry(id) {
  if (!id) {
    return responseJSON({ success: false, error: "ID JSA wajib disertakan untuk menghapus" });
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("JSA LOG");
  if (!sheet) {
    return responseJSON({ success: false, error: "Sheet JSA LOG tidak ditemukan" });
  }
  
  const data = sheet.getDataRange().getValues();
  let deleted = false;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      deleted = true;
      break;
    }
  }
  
  if (deleted) {
    // Rapikan kembali nomor urut di kolom A (kolom 1)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const range = sheet.getRange(2, 1, lastRow - 1, 1);
      const values = [];
      for (let r = 1; r <= lastRow - 1; r++) {
        values.push([r]);
      }
      range.setValues(values);
    }
    return responseJSON({ success: true });
  }
  
  return responseJSON({ success: false, error: "Data log JSA tidak ditemukan" });
}

/**
 * Mengambil daftar seluruh riwayat JSA Log
 */
function handleListEntries() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("JSA LOG");
  
  if (!sheet) {
    return responseJSON({ success: true, data: [] });
  }
  
  const data = sheet.getDataRange().getValues();
  const list = [];
  
  // Format index kolom:
  // Col A(0): No, Col B(1): No Form JSA, Col C(2): Tanggal, Col D(3): Resiko,
  // Col E(4): Jenis Pekerjaan, Col F(5): Lokasi, Col G(6): Penanggung Jawab
  for (let i = 1; i < data.length; i++) {
    let tglRaw = data[i][2];
    let tglStr = "";
    if (tglRaw instanceof Date) {
      tglStr = Utilities.formatDate(tglRaw, Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      tglStr = String(tglRaw);
    }
    
    list.push({
      id: data[i][1], // id unik berupa No. JSA
      noFormJSA: data[i][1],
      tanggal: tglStr,
      resiko: data[i][3],
      jenisPekerjaan: data[i][4],
      lokasi: data[i][5],
      penanggungjawab: data[i][6]
    });
  }
  
  return responseJSON({ success: true, data: list });
}

/**
 * Menyimpan data laporan harian ke sheet "LAPORAN HARIAN" (Upsert)
 */
function handleAddLaporan(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("LAPORAN HARIAN");
  
  if (!sheet) {
    sheet = ss.insertSheet("LAPORAN HARIAN");
    sheet.appendRow([
      "No", 
      "No. Laporan", 
      "Tanggal", 
      "Pengawas", 
      "Lokasi", 
      "Cuaca", 
      "Deskripsi Pekerjaan", 
      "Jumlah Tenaga Kerja", 
      "Temuan K3", 
      "Tindakan Koreksi"
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  const noLaporan = payload.noLaporan;
  if (!noLaporan) {
    return responseJSON({ success: false, error: "No. Laporan wajib diisi" });
  }
  
  const data = sheet.getDataRange().getValues();
  let foundRowIdx = -1;
  
  // Cari berdasarkan No. Laporan (kolom B, index 1)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(noLaporan).trim()) {
      foundRowIdx = i + 1;
      break;
    }
  }
  
  const rowData = [
    foundRowIdx !== -1 ? foundRowIdx - 1 : data.length, // No
    noLaporan,
    payload.tanggal || "",
    payload.pengawas || "",
    payload.lokasi || "",
    payload.cuaca || "",
    payload.deskripsiPekerjaan || "",
    payload.jumlahPekerja || 0,
    payload.temuanK3 || "",
    payload.tindakanKoreksi || ""
  ];
  
  if (foundRowIdx !== -1) {
    sheet.getRange(foundRowIdx, 1, 1, 10).setValues([rowData]);
    return responseJSON({ success: true, updated: true, id: noLaporan });
  } else {
    sheet.appendRow(rowData);
    return responseJSON({ success: true, updated: false, id: noLaporan });
  }
}

/**
 * Helper untuk memformat respons JSON dengan CORS Header agar tidak diblokir browser
 */
function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
