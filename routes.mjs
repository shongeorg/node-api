import {
  fakerController,
  indexController,
  postsController,
  usersController,
} from "./controllers.mjs";

export const routes = {
  "/": indexController,
  "posts/:id": postsController.getById,
  posts: postsController.getAll,
  "users/:id": usersController.getById,
  users: usersController.getAll,
  faker: fakerController,
};
