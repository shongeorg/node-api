import { createServer } from "node:http";
import { loger } from "./loger.mjs";

const data = {
  posts: [
    { name: "nodejs", id: 1 },
    { name: "npm", id: 2 },
    { name: "react", id: 3 },
  ],
  users: [
    { name: "John", id: 1 },
    { name: "Jane", id: 2 },
  ],
  faker: `https://node-api-rust-nine.vercel.app/faker`,
};
const toJson = (data) => JSON.stringify(data, null, 2);

const indexControler = () => {
  return toJson(data);
};
const fakerControler = async () => {
  const query = {
    uuid: "uuid",
    name: "firstName",
    email: "companyEmail",
    birthday: "date",
    image: "image",
    status: "emoji",
    phone: "phone",
    address: "streetAddress",
    wesite: "wesite",
    url: "url",
  };
  const params = new URLSearchParams(query).toString();
  const res = await fetch(`https://fakerapi.it/api/v2/custom?${params}`).then(
    (d) => d.json()
  );
  return toJson(res.data);
};

const routes = {
  "/": indexControler,
  "posts/:id": async (id) => {
    const post = data.posts.find((x) => x.id === +id);
    return toJson(post || {});
  },
  posts: async () => {
    return toJson(data.posts || []);
  },
  "users/:id": async (id) => {
    const user = data.users.find((x) => x.id === +id);
    return toJson(user || {});
  },
  users: async () => {
    return toJson(data.users || []);
  },
  faker: fakerControler,
};

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
