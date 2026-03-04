import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const categoryService = {
  /**
   * Get all categories with their notes
   * @returns {Promise<Array>} Array of categories
   */
  async getAll() {
    return prisma.category.findMany({
      include: { notes: true },
    });
  },

  /**
   * Get category by ID with notes
   * @param {number} id - Category ID
   * @returns {Promise<Object|null>} Category or null
   */
  async getById(id) {
    return prisma.category.findUnique({
      where: { id: Number(id) },
      include: { notes: true },
    });
  },

  /**
   * Create new category
   * @param {Object} data - Category data
   * @param {string} data.name - Category name
   * @returns {Promise<Object>} Created category
   */
  async create({ name }) {
    return prisma.category.create({
      data: { name },
      include: { notes: true },
    });
  },

  /**
   * Update category by ID
   * @param {number} id - Category ID
   * @param {Object} data - Updated data
   * @param {string} data.name - New name
   * @returns {Promise<Object|null>} Updated category or null
   */
  async update(id, { name }) {
    return prisma.category.update({
      where: { id: Number(id) },
      data: { name },
      include: { notes: true },
    });
  },

  /**
   * Delete category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Object>} Deleted category
   */
  async delete(id) {
    return prisma.category.delete({
      where: { id: Number(id) },
    });
  },
};

export default categoryService;
