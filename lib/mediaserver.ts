import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createReadStream } from "node:fs";

/**
 * A minimal, range-capable static file server used only during rendering.
 *
 * Remotion's OffthreadVideo/Audio compositor can only fetch http(s) URLs, not
 * file:// paths. Rather than stage media into a public dir, we serve the exact
 * referenced files over localhost by id, with HTTP range support so the video
 * compositor can seek.
 */
export interface MediaServer {
  /** Base URL, e.g. http://127.0.0.1:38123 */
  baseUrl: string;
  /** Register a file and get back its served URL. Deduplicates by abs path. */
  add(absPath: string): string;
  close(): Promise<void>;
}

const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".m4v": "video/mp4",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
};

export async function startMediaServer(): Promise<MediaServer> {
  const byId = new Map<string, string>(); // id -> abs path
  const idByPath = new Map<string, string>(); // abs path -> id
  let counter = 0;

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const id = decodeURIComponent(url.pathname.replace(/^\//, ""));
      const file = byId.get(id);
      if (!file || !fs.existsSync(file)) {
        res.writeHead(404).end("not found");
        return;
      }
      const stat = fs.statSync(file);
      const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
      const range = req.headers.range;
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        const start = m && m[1] ? parseInt(m[1], 10) : 0;
        const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
        if (start >= stat.size || end >= stat.size) {
          res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
          return;
        }
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
          "Content-Type": type,
        });
        createReadStream(file, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": stat.size,
          "Accept-Ranges": "bytes",
          "Content-Type": type,
        });
        createReadStream(file).pipe(res);
      }
    } catch (e) {
      res.writeHead(500).end(String(e));
    }
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    add(absPath: string): string {
      const resolved = path.resolve(absPath);
      let id = idByPath.get(resolved);
      if (!id) {
        const ext = path.extname(resolved);
        id = `m${counter++}${ext}`;
        idByPath.set(resolved, id);
        byId.set(id, resolved);
      }
      return `${baseUrl}/${id}`;
    },
    close() {
      return new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
