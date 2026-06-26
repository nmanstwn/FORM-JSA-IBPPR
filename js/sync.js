      const syncManager = (() => {
        const QUEUE_KEY = "sk_offline_queue_v1";
        let _status = "online"; // online, offline, syncing, error
        
        function getQueue() {
          try {
            const raw = localStorage.getItem(QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
          } catch (e) {
            return [];
          }
        }
        
        function saveQueue(queue) {
          try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
          } catch (e) {}
          updateIndicator();
        }
        
        function setStatus(status) {
          _status = status;
          updateIndicator();
        }
        
        function updateIndicator() {
          const dot = document.getElementById("sync-dot");
          const text = document.getElementById("sync-text");
          const indicator = document.getElementById("sync-indicator");
          if (!dot || !text || !indicator) return;
          
          const queue = getQueue();
          const pendingCount = queue.length;
          
          // Reset classes
          dot.className = "";
          
          let statusText = "";
          if (!navigator.onLine) {
            dot.style.background = "#9e9e9e"; // Grey
            text.textContent = pendingCount > 0 ? `Offline (${pendingCount})` : "Offline";
            indicator.title = "Koneksi terputus. Klik untuk melihat antrean.";
            statusText = `Koneksi offline. ${pendingCount > 0 ? pendingCount + ' data tertunda.' : ''}`;
          } else if (_status === "syncing") {
            dot.style.background = "#ff9800"; // Orange
            dot.classList.add("sync-pulsing");
            text.textContent = "Menyinkron...";
            indicator.title = "Sedang mengirim data ke server...";
            statusText = "Sedang menyinkronkan data ke spreadsheet.";
          } else if (_status === "error") {
            dot.style.background = "#f44336"; // Red
            text.textContent = pendingCount > 0 ? `Gagal Sinkron (${pendingCount})` : "Gagal Sinkron";
            indicator.title = "Gagal menyinkronkan data. Klik untuk detail.";
            statusText = `Gagal sinkronisasi data. ${pendingCount} data tertunda.`;
          } else {
            dot.style.background = "#4caf50"; // Green
            text.textContent = pendingCount > 0 ? `Tersimpan Lokal (${pendingCount})` : "Terhubung";
            indicator.title = pendingCount > 0 
              ? `${pendingCount} data tertunda di antrean. Klik untuk detail.`
              : "Semua data telah sinkron dengan server.";
            statusText = pendingCount > 0 
              ? `Tersimpan lokal. ${pendingCount} data tertunda.` 
              : "Terhubung dan tersinkronisasi.";
          }
          indicator.setAttribute("aria-label", "Status sinkronisasi: " + statusText);
        }
        
        function queueOffline(action, data) {
          const queue = getQueue();
          // Hindari duplikasi log yang sama berdasarkan noFormJSA atau noLaporan jika ada
          const noForm = data.payload?.noLaporan || data.payload?.noFormJSA || data.payload?.noForm || "baru";
          const exists = queue.some(item => (
            item.data.payload?.noLaporan === noForm ||
            item.data.payload?.noFormJSA === noForm || 
            item.data.payload?.noForm === noForm
          ));
          if (!exists) {
            queue.push({
              id: Date.now() + Math.random().toString(36).substr(2, 5),
              action,
              data,
              timestamp: new Date().toISOString()
            });
            saveQueue(queue);
          }
        }
        
        let _isSyncing = false;
        async function processQueue() {
          if (_isSyncing) return;
          if (!navigator.onLine) {
            updateIndicator();
            return;
          }
          
          const queue = getQueue();
          if (queue.length === 0) {
            setStatus("online");
            return;
          }
          
          _isSyncing = true;
          setStatus("syncing");
          
          let successCount = 0;
          const remainingQueue = [];
          
          for (const item of queue) {
            try {
              if (item.action === "add") {
                const res = await apiCall("add", { payload: item.data.payload });
                if (res && res.success) {
                  // Simpan ke detail cache local JSA
                  if (item.data._payload && res.id) {
                    jsaLog._detailMap = jsaLog._detailMap || {};
                    jsaLog._detailMap[res.id] = item.data._payload;
                  }
                  successCount++;
                  continue; // Berhasil, jangan masukkan ke remaining
                }
              } else if (item.action === "add_laporan") {
                const res = await apiCall("add_laporan", { payload: item.data.payload });
                if (res && res.success) {
                  // Simpan ke detail cache local Laporan
                  if (item.data._payload && res.id) {
                    if (typeof laporan !== "undefined") {
                      laporan._detailMap = laporan._detailMap || {};
                      laporan._detailMap[res.id] = item.data._payload;
                    }
                  }
                  successCount++;
                  continue; // Berhasil, jangan masukkan ke remaining
                }
              }
              // Jika gagal, simpan kembali di antrean
              remainingQueue.push(item);
            } catch (err) {
              console.error(`Gagal menyinkronkan item ${item.id}:`, err);
              remainingQueue.push(item);
            }
          }
          
          saveQueue(remainingQueue);
          _isSyncing = false;
          
          if (successCount > 0) {
            showToast(`✓ Berhasil menyinkronkan ${successCount} data ke server`);
            await jsaLog.reload();
          }
          
          if (remainingQueue.length > 0) {
            setStatus("error");
          } else {
            setStatus("online");
          }
        }
        
        function manualSync() {
          if (!navigator.onLine) {
            showToast("⚠ Masih offline. Periksa koneksi internet Anda.");
            updateIndicator();
            return;
          }
          showToast("⏳ Memulai sinkronisasi antrean...");
          processQueue();
        }

        function showSyncModal() {
          const overlay = document.getElementById("sync-modal-overlay");
          const box = document.getElementById("sync-modal-box");
          const netStatus = document.getElementById("sync-modal-net-status");
          const countSpan = document.getElementById("sync-modal-queue-count");
          const listWrapper = document.getElementById("sync-modal-list-wrapper");
          const list = document.getElementById("sync-modal-list");
          const actionBtn = document.getElementById("sync-modal-action-btn");
          const downloadBtn = document.getElementById("sync-modal-download-btn");
          
          if (!overlay || !box) return;
          
          const queue = getQueue();
          const pendingCount = queue.length;
          
          // Internet status
          if (navigator.onLine) {
            netStatus.textContent = "Online (Tersambung)";
            netStatus.style.color = "var(--risk-low)";
          } else {
            netStatus.textContent = "Offline (Terputus)";
            netStatus.style.color = "var(--risk-extreme)";
          }
          
          // Queue count
          countSpan.textContent = pendingCount + " data";
          
          // Queue items list
          if (pendingCount > 0) {
            listWrapper.style.display = "block";
            list.innerHTML = queue.map((item, idx) => {
              const docNo = item.data.payload?.noLaporan || item.data.payload?.noFormJSA || item.data.payload?.noForm || item.data.payload?.header?.noJSA || "Dokumen baru";
              const type = item.action === "add" ? "Kirim JSA" : (item.action === "add_laporan" ? "Kirim Laporan" : "Sinkronisasi");
              const time = new Date(item.timestamp).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
              return `
                <div style="display:flex;justify-content:space-between;padding:8px 12px;border-bottom:${idx < pendingCount - 1 ? '1px solid var(--line)' : 'none'};font-size:12px;color:var(--ink-soft);">
                  <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${docNo}</div>
                  <div style="color:var(--ink-faint);">${type} (${time})</div>
                </div>
              `;
            }).join("");
            
            // Enable/disable sync action
            if (navigator.onLine) {
              actionBtn.disabled = false;
              actionBtn.style.background = "var(--amber)";
              actionBtn.style.cursor = "pointer";
              actionBtn.style.opacity = "1";
            } else {
              actionBtn.disabled = true;
              actionBtn.style.background = "var(--paper-deep)";
              actionBtn.style.cursor = "not-allowed";
              actionBtn.style.opacity = "0.6";
            }
            downloadBtn.style.display = "block";
          } else {
            listWrapper.style.display = "none";
            list.innerHTML = "";
            actionBtn.disabled = true;
            actionBtn.style.background = "var(--paper-deep)";
            actionBtn.style.cursor = "not-allowed";
            actionBtn.style.opacity = "0.6";
            downloadBtn.style.display = "none";
          }
          
          overlay.style.display = "flex";
          requestAnimationFrame(() => {
            box.style.transform = "scale(1)";
            box.style.opacity = "1";
          });
        }
        
        function closeSyncModal() {
          const overlay = document.getElementById("sync-modal-overlay");
          const box = document.getElementById("sync-modal-box");
          if (!overlay || !box) return;
          box.style.transform = "scale(0.95)";
          box.style.opacity = "0";
          setTimeout(() => {
            overlay.style.display = "none";
          }, 180);
        }
        
        function onOverlayClick(e) {
          if (e && e.target === document.getElementById("sync-modal-overlay")) {
            closeSyncModal();
          }
        }
        
        function triggerSyncFromModal() {
          closeSyncModal();
          manualSync();
        }
        
        function downloadQueueBackup() {
          const queue = getQueue();
          if (queue.length === 0) return;
          const filename = "cadangan-antrean-sikerja-" + Date.now() + ".json";
          downloadJSON(filename, { queue });
          showToast("✓ Cadangan antrean berhasil diunduh");
        }
        
        return {
          init() {
            window.addEventListener("online", () => {
              showToast("📶 Koneksi terdeteksi. Menyinkronkan...");
              processQueue();
            });
            window.addEventListener("offline", () => {
              showToast("⚠️ Koneksi terputus. Mode offline aktif.");
              updateIndicator();
            });
            updateIndicator();
            
            // Keyboard accessibility for indicator
            const indicator = document.getElementById("sync-indicator");
            if (indicator) {
              indicator.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  showSyncModal();
                }
              });
            }

            // Jalankan sinkronisasi pertama kali jika online
            setTimeout(() => {
              if (navigator.onLine) processQueue();
            }, 1000);
          },
          queueOffline,
          processQueue,
          manualSync,
          setStatus,
          getPendingCount() {
            return getQueue().length;
          },
          showSyncModal,
          closeSyncModal,
          onOverlayClick,
          triggerSyncFromModal,
          downloadQueueBackup
        };
      })();
