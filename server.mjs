import { createServer } from "node:http";
import { loger } from "./loger.mjs";
import { routes } from "./routes.mjs";

const getRoute = async (pathname) => {
  const [, route, param] = pathname.split("/");

  if (route === "" && routes["/"]) {
    return await routes["/"]();
  }

  if (param && routes[`${route}/:id`]) {
    return await routes[`${route}/:id`](param);
  }

  if (routes[route]) {
    return await routes[route](param);
  }

  throw new Error("404");
};

const server = createServer(async (req, res) => {
  const url = req.url ? new URL(req.url, `http://${req.headers.host}`) : null;
  loger(req, res, req.method);
  try {
    const route = await getRoute(url?.pathname || "/");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(route);
  } catch (error) {
    if (error.message === "404") {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 Not Found</h1>");
    } else {
      console.error("Error:", error);
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end("<h1>500 Internal Server Error</h1>");
    }
  }
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Listening on http://127.0.0.1:3000");
});
