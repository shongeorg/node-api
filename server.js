import { createServer } from "node:http";
import { routes } from "./routes.js";
import { loger } from "./loger.js";

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
// Format: "method:path" or just "path" (defaults to GET)
const findRoute = (method, pathname) => {
  const methodLower = method.toLowerCase();

  for (const [pattern, handler] of Object.entries(routes)) {
    const colonIndex = pattern.indexOf(':');
    
    // Check if it's a method-specific route (e.g., "put:categories/:id")
    if (colonIndex !== -1) {
      const routeMethod = pattern.slice(0, colonIndex);
      const routePath = pattern.slice(colonIndex + 1);

      // Method-specific route (post, put, patch, delete, get)
      if (["post", "put", "patch", "delete", "get"].includes(routeMethod)) {
        if (routeMethod !== methodLower) continue;

        // Check for param route (e.g., "categories/:id")
        if (routePath.endsWith("/:id")) {
          const base = routePath.slice(0, -3); // Remove "/:id"
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

    // Legacy GET routes (no method prefix) - only for GET requests
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

const server = createServer(async (req, res) => {
  loger(req, res);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/^\/+/, "");

  const route = findRoute(req.method, pathname);

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
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

server.listen(3000);
