const { createServer } = require("node:http");
const request = require("supertest");

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

const toJson = (data) => JSON.stringify(data);

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
  "/posts": async () => {
    return toJson(data.posts || []);
  },
  "/posts/:id": async (id) => {
    const post = data.posts.find((x) => x.id === +id);
    return toJson(post || null);
  },
  "/users": async () => {
    return toJson(data.users || []);
  },
  "/users/:id": async (id) => {
    const user = data.users.find((x) => x.id === +id);
    return toJson(user || null);
  },
  "/faker": fakerControler,
};

const getRoute = async (pathname) => {
  const [, route, param] = pathname.split("/");

  if (route === "" && routes["/"]) {
    return await routes["/"]();
  }

  if (routes[`/${route}`]) {
    return await routes[`/${route}`](param);
  }

  const matchPost = route.match(/posts/);
  const matchUser = route.match(/users/);

  if (matchPost || matchUser) {
    const key = matchPost ? "/posts/:id" : "/users/:id";
    return await routes[key](param);
  }

  throw new Error("404");
};

const server = createServer(async (req, res) => {
  const url = req.url ? new URL(req.url, `http://${req.headers.host}`) : null;
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

const app = server.listen(3000, "127.0.0.1", () => {
  console.log("Listening on http://127.0.0.1:3000");
});

describe("API tests", () => {
  afterAll(() => {
    app.close();
  });

  test("GET / returns index data", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(data);
  });

  test("GET /posts returns all posts", async () => {
    const response = await request(app).get("/posts");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(data.posts);
  });

  test("GET /users returns all users", async () => {
    const response = await request(app).get("/users");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(data.users);
  });

  test("GET /invalid returns 404", async () => {
    const response = await request(app).get("/invalid");
    expect(response.status).toBe(404);
  });
});
