      // Melakukan fetch dengan timeout & retry (exponential backoff)
      async function fetchWithTimeoutAndRetry(url, options = {}, retries = 3, delay = 1000, timeoutMs = 10000) {
        // Validasi ukuran payload sebelum dikirim
        if (options.body) {
          const size = options.body.length || 0;
          if (size > 250 * 1024) { // 250 KB limit
            throw new Error("Payload terlalu besar (maksimal 250 KB)");
          }
        }

        for (let i = 0; i < retries; i++) {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeoutMs);
          
          try {
            const fetchOptions = { ...options, signal: controller.signal };
            const response = await fetch(url, fetchOptions);
            clearTimeout(id);
            if (!response.ok) {
              throw new Error("HTTP " + response.status);
            }
            return response;
          } catch (err) {
            clearTimeout(id);
            const isLastAttempt = i === retries - 1;
            const isAbort = err.name === "AbortError";
            console.warn(`Attempt ${i + 1} failed: ${isAbort ? "Timeout" : err.message}`);
            
            if (isLastAttempt) {
              throw new Error(isAbort ? "Request timeout setelah beberapa kali percobaan" : err.message);
            }
            // Tunggu sebelum mencoba kembali (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
          }
        }
      }

      async function apiList() {
        if (!GAS_URL) return { success: false, error: "GAS_URL belum diset" };
        try {
          if (typeof syncManager !== "undefined") syncManager.setStatus("syncing");
          const res = await fetchWithTimeoutAndRetry(GAS_URL + "?action=list", { method: "GET" });
          const data = await res.json();
          if (typeof syncManager !== "undefined") syncManager.setStatus("online");
          return data;
        } catch (err) {
          if (typeof syncManager !== "undefined") syncManager.setStatus("error");
          throw err;
        }
      }

      async function apiCall(action, data) {
        if (!GAS_URL) return { success: false, error: "GAS_URL belum diset" };
        
        // Validasi format/key payload dasar
        if (!action) {
          throw new Error("Action wajib diisi");
        }
        
        try {
          if (typeof syncManager !== "undefined") syncManager.setStatus("syncing");
          const bodyData = JSON.stringify(Object.assign({ action }, data));
          const res = await fetchWithTimeoutAndRetry(GAS_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: bodyData,
          });
          const json = await res.json();
          if (typeof syncManager !== "undefined") syncManager.setStatus("online");
          return json;
        } catch (err) {
          if (typeof syncManager !== "undefined") syncManager.setStatus("error");
          throw err;
        }
      }

      async function submitToAppsScript(url, payload) {
        if (!url) {
          console.log("[GAS] URL belum diset, payload:", payload);
          return;
        }
        try {
          if (typeof syncManager !== "undefined") syncManager.setStatus("syncing");
          const res = await fetchWithTimeoutAndRetry(url, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "text/plain" },
          });
          const text = await res.text();
          const json = JSON.parse(text);
          if (typeof syncManager !== "undefined") syncManager.setStatus("online");
          return json;
        } catch (err) {
          console.error("[GAS] Gagal kirim:", err);
          if (typeof syncManager !== "undefined") syncManager.setStatus("error");
        }
      }

