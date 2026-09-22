import http.server, functools
D = "/Users/melodychui/Desktop/portfolio"
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()
with http.server.ThreadingHTTPServer(("", 4173), functools.partial(H, directory=D)) as s:
    s.serve_forever()
