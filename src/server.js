import { createServer } from "node:http";
import { readFileSync, statSync, createReadStream } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { routes } from "./routes.js";
import { loger } from "./loger.js";
import config from "./config.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// MIME types for static files
const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const getBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", (err) => reject(err));
  });
};

// Route matching with HTTP methods
const findRoute = (method, pathname) => {
  const methodLower = method.toLowerCase();

  for (const [pattern, handler] of Object.entries(routes)) {
    const colonIndex = pattern.indexOf(":");

    if (colonIndex !== -1) {
      const routeMethod = pattern.slice(0, colonIndex);
      const routePath = pattern.slice(colonIndex + 1);

      if (["post", "put", "patch", "delete", "get"].includes(routeMethod)) {
        if (routeMethod !== methodLower) continue;

        if (routePath.endsWith("/:id")) {
          const base = routePath.slice(0, -3);
          if (pathname.startsWith(base)) {
            const id = pathname.slice(base.length);
            if (id && !id.includes("/")) {
              return { handler, params: { id } };
            }
          }
        } else if (routePath === pathname) {
          return { handler, params: {} };
        }
        continue;
      }
    }

    if (method === "GET") {
      if (pattern.endsWith("/:id")) {
        const base = pattern.slice(0, -3);
        if (pathname.startsWith(base)) {
          const id = pathname.slice(base.length);
          if (id && !id.includes("/")) {
            return { handler, params: { id } };
          }
        }
      } else if (pattern === pathname) {
        return { handler, params: {} };
      }
    }
  }

  return null;
};

// Serve static files from public directory
const serveStatic = (res, filePath) => {
  try {
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const stream = createReadStream(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    stream.pipe(res);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("File not found");
  }
};

const server = createServer(async (req, res) => {
  loger(req, res);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Serve static files from /public
  if (req.method === "GET" && pathname !== "/") {
    const publicDir = join(__dirname, "..", "public");
    const filePath = join(publicDir, pathname === "/" ? "index.html" : pathname);

    try {
      const stats = statSync(filePath);
      if (stats.isFile()) {
        serveStatic(res, filePath);
        return;
      }
    } catch (error) {
      // File not found, continue to API routing
    }
  }

  // API routing
  const cleanPath = pathname === "/" ? "" : pathname.replace(/^\/+/, "");
  const route = findRoute(req.method, cleanPath);

  if (route) {
    try {
      let body = {};
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        body = await getBody(req);
      }

      const result = await route.handler(route.params, body, req.method);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(result);
    } catch (error) {
      res.writeHead(error.message === "Invalid JSON" ? 400 : 500, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    // Try to serve 404.html from public
    const notFoundPath = join(__dirname, "..", "public", "404.html");
    try {
      statSync(notFoundPath);
      serveStatic(res, notFoundPath);
    } catch (error) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  }
});

// Graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${new Date().toISOString()} - ${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      console.error("Error during server close:", err);
      process.exit(1);
    }

    console.log("HTTP server closed.");
    
    // Close database connections if any
    if (global.prismadb) {
      global.prismadb.$disconnect().then(() => {
        console.log("Database connections closed.");
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error("Forced shutdown due to timeout.");
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Start server
server.listen(config.port, config.host, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀  Node.js API Server                                  ║
║                                                           ║
║   Server running at http://${config.host}:${config.port}                    ║
║   API Tester UI at http://localhost:${config.port}                      ║
║                                                           ║
║   Press Ctrl+C to stop                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default server;
