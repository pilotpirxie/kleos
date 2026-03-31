/**
 * Minimal HTTP server for asserting axios request shape and controlling responses.
 * Parses the incoming body as UTF-8 string (sufficient for JSON/urlencoded/multipart assertions in tests).
 */
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { text } from "node:stream/consumers";

/** Parsed request snapshot returned from /echo and similar routes. */
export type EchoedRequest = {
  method: string | undefined;
  path: string;
  search: string;
  headers: IncomingMessage["headers"];
  body: string;
};

export type TestServer = {
  /** Base URL e.g. http://127.0.0.1:PORT */
  baseURL: string;
  /** Underlying HTTP server; call close() when done. */
  server: Server;
};

/**
 * Reads the full request body as a UTF-8 string without throwing on empty body.
 */
async function readBodyText(req: IncomingMessage): Promise<string> {
  if (req.method === "GET" || req.method === "HEAD") {
    return "";
  }
  try {
    return await text(req);
  } catch {
    return "";
  }
}

/**
 * Starts a test server on an ephemeral port. Routes:
 * - /echo — JSON echo of method, path, query, headers, raw body string
 * - /json — 200 JSON { "hello": "world" }
 * - /status/:code — responds with numeric status, optional body "ok"
 * - /delay?ms=N — waits N ms then 200
 * - /chunked — streams several chunks for download progress tests
 */
export async function startTestServer(): Promise<TestServer> {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const path = url.pathname;
    const bodyText = await readBodyText(req);

    if (path === "/json" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ hello: "world" }));
      return;
    }

    const statusMatch = /^\/status\/(\d{3})$/.exec(path);
    if (statusMatch) {
      const code = Number(statusMatch[1]);
      res.writeHead(code, { "Content-Type": "text/plain" });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      res.end(code >= 400 ? "error" : "ok");
      return;
    }

    if (path === "/delay" && req.method === "GET") {
      const ms = Number(url.searchParams.get("ms") ?? "0");
      await new Promise((r) => setTimeout(r, ms));
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("delayed");
      return;
    }

    if (path === "/chunked" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Transfer-Encoding": "chunked",
      });
      const parts = [Buffer.alloc(8000, 1), Buffer.alloc(8000, 2), Buffer.alloc(4000, 3)];
      for (const part of parts) {
        res.write(part);
      }
      res.end();
      return;
    }

    if (path === "/echo" || path === "/echo/") {
      const echoed: EchoedRequest = {
        method: req.method,
        path: url.pathname,
        search: url.search,
        headers: req.headers,
        body: bodyText,
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(echoed));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (address === null || typeof address === "string") {
    server.close();
    throw new Error("Failed to bind test server");
  }

  return {
    baseURL: `http://127.0.0.1:${address.port}`,
    server,
  };
}

/**
 * Closes the server and waits for the port to be released.
 */
export function stopTestServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err: Error | undefined) => (err ? reject(err) : resolve()));
  });
}
