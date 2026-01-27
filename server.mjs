// import { createServer } from "node:http";
// import { loger } from "./loger.mjs";
// import { routes } from "./routes.mjs";

// const getRoute = async (pathname) => {
//   const [, route, param] = pathname.split("/");

//   if (route === "" && routes["/"]) {
//     return await routes["/"]();
//   }

//   if (param && routes[`${route}/:id`]) {
//     return await routes[`${route}/:id`](param);
//   }

//   if (routes[route]) {
//     return await routes[route](param);
//   }

//   throw new Error("404");
// };

// const server = createServer(async (req, res) => {
//   const url = req.url ? new URL(req.url, `http://${req.headers.host}`) : null;
//   loger(req, res, req.method);
//   try {
//     const route = await getRoute(url?.pathname || "/");
//     res.writeHead(200, { "Content-Type": "application/json" });
//     res.end(route);
//   } catch (error) {
//     if (error.message === "404") {
//       res.writeHead(404, { "Content-Type": "text/html" });
//       res.end("<h1>404 Not Found</h1>");
//     } else {
//       console.error("Error:", error);
//       res.writeHead(500, { "Content-Type": "text/html" });
//       res.end("<h1>500 Internal Server Error</h1>");
//     }
//   }
// });

// server.listen(3000, "127.0.0.1", () => {
//   console.log("Listening on http://127.0.0.1:3000");
// });


import { createServer } from "node:http";

class Route {
  constructor({ method, pattern, handler }) {
    this.method = method;
    this.pattern = new URLPattern({ pathname: pattern });
    this.handler = handler;
  }
  match(reqMethod, url) {
    if (this.method !== reqMethod) return null;
    const res = this.pattern.exec(url);
    return res ? { params: res.pathname.groups } : null;
  }
}

class Router {
  constructor() {
    this.routes = [];
  }
  add(method, pattern, handler) {
    this.routes.push(new Route({ method, pattern, handler }));
    return this;
  }
  get(pattern, handler) {
    return this.add("GET", pattern, handler);
  }
  post(pattern, handler) {
    return this.add("POST", pattern, handler);
  }
  put(pattern, handler) {
    return this.add("PUT", pattern, handler);
  }
  patch(pattern, handler) {
    return this.add("PATCH", pattern, handler);
  }
  delete(pattern, handler) {
    return this.add("DELETE", pattern, handler);
  }

  find(method, url) {
    for (const r of this.routes) {
      const res = r.match(method, url);
      if (res) return { route: r, ...res };
    }
    return null;
  }
}

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

const router = new Router();

router
  .get("/users/:id", (params) => ({ method: "GET", id: params.id }))
  .post("/users", (params, data) => ({ method: "POST", data }))
  .put("/users/:id", (params, data) => ({ method: "PUT", id: params.id, data }))
  .patch("/users/:id", (params, data) => ({
    method: "PATCH",
    id: params.id,
    data,
  }))
  .delete("/users/:id", (params) => ({ method: "DELETE", id: params.id }));

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const match = router.find(req.method, url);

  if (match) {
    try {
      let body = {};
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        body = await getBody(req);
      }

      const result = await match.route.handler(match.params, body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
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


