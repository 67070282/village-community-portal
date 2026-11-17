import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { root, migrate, exclusive } from "./db.js";
import { seed } from "./seed.js";
import { dispatch, openapi, routes } from "./api.js";
import { fail } from "./security.js";
await migrate();
await seed();
const port = Number(process.env.PORT || 3000),
  host = process.env.HOST || "127.0.0.1";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  try {
    const url = new URL(req.url, "http://localhost");
    if (
      req.headers.origin &&
      !["GET", "HEAD", "OPTIONS"].includes(req.method)
    ) {
      if (new URL(req.headers.origin).host !== req.headers.host)
        fail(403, "ไม่อนุญาตคำขอจากเว็บไซต์อื่น", "ORIGIN_REJECTED");
    }
    if (url.pathname === "/api/v1/openapi.json") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(openapi()));
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store");
      let body = "",
        size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 65536) fail(413, "ข้อมูลเกินขนาด 64KB", "PAYLOAD_TOO_LARGE");
        body += chunk;
      }
      let b = {};
      if (body) {
        if (!req.headers["content-type"]?.startsWith("application/json"))
          fail(415, "ใช้ Content-Type: application/json");
        try {
          b = JSON.parse(body);
        } catch {
          fail(400, "JSON ไม่ถูกต้อง", "BAD_JSON");
        }
        if (!b || Array.isArray(b) || typeof b !== "object")
          fail(400, "ข้อมูลต้องเป็น JSON object");
      }
      await exclusive(() => dispatch(req, res, url, b));
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) fail(405, "Method not allowed");
    let filename = decodeURIComponent(url.pathname);
    if (filename === "/") filename = "/index.html";
    if (filename === "/docs") filename = "/docs.html";
    const absolute = path.resolve(root, "public", "." + filename);
    const publicRoot = path.resolve(root, "public");
    if (!absolute.startsWith(publicRoot + path.sep)) fail(403, "Forbidden");
    const content = await readFile(absolute).catch(() => {
      fail(404, "ไม่พบไฟล์");
    });
    res.setHeader(
      "Content-Type",
      mime[path.extname(absolute)] || "application/octet-stream",
    );
    res.setHeader("Cache-Control", "no-cache");
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (e) {
    if (res.headersSent) {
      res.end();
      return;
    }
    const duplicate =
      e.code === "ER_DUP_ENTRY" ||
      String(e.message).includes("UNIQUE constraint");
    const status = e.status || (duplicate ? 409 : 500);
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: {
          code: e.status
            ? e.code || "REQUEST_ERROR"
            : duplicate
              ? "CONFLICT"
              : "INTERNAL_ERROR",
          message:
            status === 500
              ? "เกิดข้อผิดพลาดภายในระบบ"
              : duplicate
                ? "ข้อมูลนี้มีอยู่แล้ว"
                : e.message,
        },
      }),
    );
    if (status === 500) console.error(e);
  }
});
server.listen(port, host, () =>
  console.log(
    `Village Community Portal: http://${host}:${server.address().port}\nAPI documentation: http://${host}:${server.address().port}/docs\n${routes.length} REST endpoints + OpenAPI specification`,
  ),
);
server.requestTimeout = 15000;
server.headersTimeout = 10000;
