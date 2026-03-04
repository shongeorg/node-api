import { PrismaClient } from "@prisma/client";
import { toJson } from "./loger.js";

const prisma = new PrismaClient();

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
    (d) => d.json(),
  );
  return toJson(res.data);
};

export const postsController = {
  getAll: async () => {
    return toJson(data.posts || []);
  },
  getById: async ({ id }) => {
    const post = data.posts.find((x) => x.id === +id);
    return toJson(post || {});
  },
};

export const usersController = {
  getAll: async () => {
    return toJson(data.users || []);
  },
  getById: async ({ id }) => {
    const user = data.users.find((x) => x.id === +id);
    return toJson(user || {});
  },
};

export const categoriesController = {
  getAll: async (params, body, method) => {
    const categories = await prisma.category.findMany({
      include: { notes: true },
    });
    return toJson(categories);
  },
  getById: async (params, body, method) => {
    const { id } = params;
    const category = await prisma.category.findUnique({
      where: { id: +id },
      include: { notes: true },
    });
    return toJson(category || { error: "Category not found" });
  },
  create: async (params, body, method) => {
    const { name } = body;
    if (!name) return toJson({ error: "Name is required" });
    const category = await prisma.category.create({
      data: { name },
      include: { notes: true },
    });
    return toJson(category);
  },
  update: async (params, body, method) => {
    const { id } = params;
    const { name } = body;
    if (!name) return toJson({ error: "Name is required" });
    const category = await prisma.category.update({
      where: { id: +id },
      data: { name },
      include: { notes: true },
    });
    return toJson(category);
  },
  delete: async (params, body, method) => {
    const { id } = params;
    await prisma.category.delete({
      where: { id: +id },
    });
    return toJson({ message: "Category deleted" });
  },
};

// Notes Controllers
export const notesController = {
  getAll: async (params, body, method) => {
    const notes = await prisma.note.findMany({
      include: { category: true },
    });
    return toJson(notes);
  },
  getById: async (params, body, method) => {
    const { id } = params;
    const note = await prisma.note.findUnique({
      where: { id: +id },
      include: { category: true },
    });
    return toJson(note || { error: "Note not found" });
  },
  create: async (params, body, method) => {
    const { title, content, categoryId } = body;
    if (!title) return toJson({ error: "Title is required" });
    if (!categoryId) return toJson({ error: "CategoryId is required" });
    const note = await prisma.note.create({
      data: { title, content, categoryId: +categoryId },
      include: { category: true },
    });
    return toJson(note);
  },
  update: async (params, body, method) => {
    const { id } = params;
    const { title, content, categoryId, archived } = body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (categoryId !== undefined) updateData.categoryId = +categoryId;
    if (archived !== undefined) updateData.archived = archived;
    const note = await prisma.note.update({
      where: { id: +id },
      data: updateData,
      include: { category: true },
    });
    return toJson(note);
  },
  delete: async (params, body, method) => {
    const { id } = params;
    await prisma.note.delete({
      where: { id: +id },
    });
    return toJson({ message: "Note deleted" });
  },
};
