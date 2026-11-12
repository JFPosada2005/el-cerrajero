from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        if self.path in ('/', '/index.html'):
            self.send_header('Clear-Site-Data', '"cache"')
        super().end_headers()
    def do_GET(self):
        if self.path == '/health':
            body = b'{"status":"ok"}'
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()
    def log_message(self, format, *args):
        if self.path == '/health':
            return
        super().log_message(format, *args)


if __name__ == '__main__':
    server = ThreadingHTTPServer(('', 8000), NoCacheHandler)
    print('El Cerrajero en http://127.0.0.1:8000')
    server.serve_forever()
