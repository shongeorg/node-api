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

const server = createServer(async (req, res) => {
  loger(req, res);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/^\/+/, "");

  // Exact match (routes use keys without leading slash, "/" maps to "")
  let handler = routes[pathname];

  // Param match (e.g., users/:id, posts/:id)
  if (!handler) {
    for (const [pattern, h] of Object.entries(routes)) {
      const [base, param] = pattern.split("/");
      if (param === ":id" && pathname.startsWith(base + "/")) {
        const id = pathname.slice(base.length + 1);
        if (id && !id.includes("/")) {
          handler = () => h(id);
          break;
        }
      }
    }
  }

  if (handler) {
    try {
      let body = {};
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        body = await getBody(req);
      }

      const result = await handler({}, body);
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
