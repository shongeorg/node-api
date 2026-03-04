const { PrismaClient } = await import("@prisma/client");
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const categories = Array.from({ length: 4 }, () => faker.commerce.department());
const notes = Array.from({ length: 16 }, () => faker.lorem.sentence());

const createdCategories = [];
const fn = async () => {
  for (let name of categories) {
    const cat = await prisma.category.create({ data: { name } });
    createdCategories.push(cat);
  }

  for (let title of notes) {
    const randomCategory =
      createdCategories[Math.floor(Math.random() * createdCategories.length)];
    const note = await prisma.note.create({
      data: { title, categoryId: randomCategory.id },
    });
    console.log(note);
  }
};

fn();
