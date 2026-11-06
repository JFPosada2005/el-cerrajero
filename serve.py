from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    server = ThreadingHTTPServer(('', 8000), NoCacheHandler)
    print('El Cerrajero en http://127.0.0.1:8000')
    server.serve_forever()
