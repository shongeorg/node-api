import { categoryService } from '../services/category.js';
import { toJson } from '../loger.js';

/**
 * Categories Controller
 * Handles HTTP requests for category operations
 */
export const categoriesController = {
  /**
   * GET /categories - Get all categories
   */
  async getAll() {
    try {
      const categories = await categoryService.getAll();
      return toJson(categories);
    } catch (error) {
      console.error('Error in categoriesController.getAll:', error);
      throw new Error('Failed to fetch categories');
    }
  },

  /**
   * GET /categories/:id - Get category by ID
   * @param {Object} params - Route params
   * @param {string} params.id - Category ID
   */
  async getById({ id }) {
    try {
      if (!id) {
        return toJson({ error: 'Category ID is required' }, 400);
      }

      const category = await categoryService.getById(id);

      if (!category) {
        return toJson({ error: 'Category not found' }, 404);
      }

      return toJson(category);
    } catch (error) {
      console.error('Error in categoriesController.getById:', error);
      throw new Error('Failed to fetch category');
    }
  },

  /**
   * POST /categories - Create new category
   * @param {Object} body - Request body
   * @param {string} body.name - Category name
   */
  async create(_, body) {
    try {
      if (!body?.name) {
        return toJson({ error: 'Name is required' }, 400);
      }

      const category = await categoryService.create({ name: body.name });
      return toJson(category, 201);
    } catch (error) {
      console.error('Error in categoriesController.create:', error);
      throw new Error('Failed to create category');
    }
  },

  /**
   * PUT /categories/:id - Update category
   * @param {Object} params - Route params
   * @param {string} params.id - Category ID
   * @param {Object} body - Request body
   * @param {string} body.name - New category name
   */
  async update({ id }, body) {
    try {
      if (!id) {
        return toJson({ error: 'Category ID is required' }, 400);
      }

      if (!body?.name) {
        return toJson({ error: 'Name is required' }, 400);
      }

      const category = await categoryService.update(id, { name: body.name });

      if (!category) {
        return toJson({ error: 'Category not found' }, 404);
      }

      return toJson(category);
    } catch (error) {
      console.error('Error in categoriesController.update:', error);
      if (error.message.includes('not found')) {
        return toJson({ error: 'Category not found' }, 404);
      }
      throw new Error('Failed to update category');
    }
  },

  /**
   * DELETE /categories/:id - Delete category
   * @param {Object} params - Route params
   * @param {string} params.id - Category ID
   */
  async delete({ id }) {
    try {
      if (!id) {
        return toJson({ error: 'Category ID is required' }, 400);
      }

      await categoryService.delete(id);
      return toJson({ message: 'Category deleted' });
    } catch (error) {
      console.error('Error in categoriesController.delete:', error);
      if (error.message.includes('not found')) {
        return toJson({ error: 'Category not found' }, 404);
      }
      throw new Error('Failed to delete category');
    }
  },
};

export default categoriesController;
