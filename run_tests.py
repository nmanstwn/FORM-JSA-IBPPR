import http.server
import socketserver
import json
import webbrowser
import os
import sys
import threading
import time

PORT = 8000
test_results = None

def color(text, ansi_code):
    """Membungkus teks dengan warna ANSI untuk output terminal."""
    return f"\033[{ansi_code}m{text}\033[0m"

class TestHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Menonaktifkan logging request standar agar console tetap bersih
        pass

    def do_POST(self):
        global test_results
        if self.path == '/api/test-results':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                test_results = json.loads(post_data.decode('utf-8'))
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'{"status":"received"}')
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(f'{{"error":"{str(e)}"}}'.encode('utf-8'))
            return
        
        self.send_response(404)
        self.end_headers()

    def do_GET(self):
        # Resolve request path, abaikan query parameters
        parsed_path = self.path.split('?')[0]
        if parsed_path == '/':
            parsed_path = '/index.html'
            
        # Dapatkan path absolut file
        clean_path = parsed_path.lstrip('/')
        filepath = os.path.join(os.getcwd(), clean_path)
        
        # Mencegah directory traversal
        if not os.path.abspath(filepath).startswith(os.getcwd()):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b'Forbidden')
            return
            
        if os.path.exists(filepath) and os.path.isfile(filepath):
            self.send_response(200)
            
            # Deteksi Content Type secara manual
            if filepath.endswith('.html'):
                self.send_header('Content-type', 'text/html; charset=utf-8')
            elif filepath.endswith('.css'):
                self.send_header('Content-type', 'text/css; charset=utf-8')
            elif filepath.endswith('.js'):
                self.send_header('Content-type', 'application/javascript; charset=utf-8')
            elif filepath.endswith('.png'):
                self.send_header('Content-type', 'image/png')
            elif filepath.endswith('.json'):
                self.send_header('Content-type', 'application/json; charset=utf-8')
            else:
                self.send_header('Content-type', 'application/octet-stream')
                
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            try:
                with open(filepath, 'rb') as f:
                    self.wfile.write(f.read())
            except Exception:
                pass
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'File Not Found')

def run_server(server):
    try:
        server.serve_forever()
    except Exception:
        pass

def main():
    socketserver.TCPServer.allow_reuse_address = True
    try:
        # Bind ke 127.0.0.1 secara eksplisit untuk kompatibilitas localhost di Windows
        server = socketserver.TCPServer(("127.0.0.1", PORT), TestHandler)
    except Exception as e:
        print(color(f"Gagal memulai server pada port {PORT}: {e}", "91"))
        sys.exit(1)

    server_thread = threading.Thread(target=run_server, args=(server,))
    server_thread.daemon = True
    server_thread.start()

    print(color(f"[*] Server pengujian berjalan di http://127.0.0.1:{PORT}", "96"))
    print(color("Membuka browser untuk menjalankan pengujian integrasi otomatis...", "93"))
    time.sleep(1)
    
    webbrowser.open(f"http://127.0.0.1:{PORT}/?test=true")

    # Tunggu hasil pengujian dikirim dari browser
    try:
        while test_results is None:
            time.sleep(0.2)
    except KeyboardInterrupt:
        print(color("\nPengujian dibatalkan oleh pengguna.", "91"))
        server.shutdown()
        sys.exit(1)

    # Cetak laporan hasil pengujian
    print("\n" + color("="*60, "1"))
    print(color("             LAPORAN PENGUJIAN OTOMATIS (SiKerja)", "1;96"))
    print(color("="*60, "1"))

    passed_count = test_results.get("passed", 0)
    failed_count = test_results.get("failed", 0)
    total_count = test_results.get("total", 0)
    duration = test_results.get("duration", 0)
    details = test_results.get("details", [])

    for test in details:
        if test["success"]:
            status = color("[LULUS]", "92")
            print(f" {status} {test['name']} ({test['duration']}ms)")
        else:
            status = color("[GAGAL]", "91")
            print(f" {status} {test['name']} ({test['duration']}ms)")
            print(color(f"   Detail Error: {test.get('error', 'Kesalahan tidak dikenal')}", "91"))

    print(color("="*60, "1"))
    summary = f"Total: {total_count} | Lulus: {passed_count} | Gagal: {failed_count} (Durasi: {duration}ms)"
    if failed_count > 0:
        print(color(summary, "1;91"))
        print(color("="*60, "1"))
        print(color("\n[FAIL] PENGUJIAN GAGAL!", "1;91"))
        exit_code = 1
    else:
        print(color(summary, "1;92"))
        print(color("="*60, "1"))
        print(color("\n[PASS] SEMUA PENGUJIAN LULUS DENGAN SUKSES!", "1;92"))
        exit_code = 0

    # Shutdown server
    server.shutdown()
    sys.exit(exit_code)

if __name__ == '__main__':
    main()
