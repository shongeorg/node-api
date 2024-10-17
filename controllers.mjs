import { toJson } from "./loger.mjs";

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

export const indexController = () => {
  return toJson(data);
};
export const fakerController = async () => {
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

export const postsController = {
  getAll: async () => {
    return toJson(data.posts || []);
  },
  getById: async (id) => {
    const post = data.posts.find((x) => x.id === +id);
    return toJson(post || {});
  },
};

export const usersController = {
  getAll: async () => {
    return toJson(data.users || []);
  },
  getById: async (id) => {
    const user = data.users.find((x) => x.id === +id);
    return toJson(user || {});
  },
};
