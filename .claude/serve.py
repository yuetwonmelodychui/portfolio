import functools
import http.server
import os

DIRECTORY = "/Users/melodychui/Desktop/portfolio"
PORT = int(os.environ.get("PORT", "4173"))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


Handler = functools.partial(Handler, directory=DIRECTORY)

with http.server.ThreadingHTTPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
