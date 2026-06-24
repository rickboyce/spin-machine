#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const root = path.resolve(__dirname, "..", "site");
const port = Number(process.env.PORT || process.argv[2] || 8000);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp"
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(body);
}

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, `http://${host}:${port}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== root) {
    return null;
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
    return;
  }

  let filePath = resolveRequestPath(req.url);
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(res, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Not Found" : "Server Error");
      return;
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    send(res, 200, req.method === "HEAD" ? "" : content, { "Content-Type": contentType });
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Try PORT=8124 node dev/server.js`);
  } else if (error.code === "EACCES" || error.code === "EPERM") {
    console.error(`Cannot bind to ${host}:${port}. Try another port or check local permissions.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`Spin Machine dev server running at http://${host}:${port}`);
  console.log(`Serving ${root}`);
});
