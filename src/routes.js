import { categoriesController } from './controllers/categories.js';
import { notesController } from './controllers/notes.js';
import {
  fakerController,
  indexController,
  postsController,
  usersController,
} from './controllers.js';

export const routes = {
  '': indexController,
  'posts/:id': postsController.getById,
  posts: postsController.getAll,
  'users/:id': usersController.getById,
  users: usersController.getAll,
  faker: fakerController,
  // Categories CRUD
  'post:categories': categoriesController.create,
  'put:categories/:id': categoriesController.update,
  'delete:categories/:id': categoriesController.delete,
  'get:categories/:id': categoriesController.getById,
  'get:categories': categoriesController.getAll,
  // Notes CRUD
  'post:notes': notesController.create,
  'put:notes/:id': notesController.update,
  'delete:notes/:id': notesController.delete,
  'get:notes/:id': notesController.getById,
  'get:notes': notesController.getAll,
};
