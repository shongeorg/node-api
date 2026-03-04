import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const noteService = {
  /**
   * Get all notes with their category
   * @returns {Promise<Array>} Array of notes
   */
  async getAll() {
    return prisma.note.findMany({
      include: { category: true },
    });
  },

  /**
   * Get note by ID with category
   * @param {number} id - Note ID
   * @returns {Promise<Object|null>} Note or null
   */
  async getById(id) {
    return prisma.note.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });
  },

  /**
   * Create new note
   * @param {Object} data - Note data
   * @param {string} data.title - Note title
   * @param {string} [data.content] - Note content
   * @param {number} data.categoryId - Category ID
   * @returns {Promise<Object>} Created note
   */
  async create({ title, content, categoryId }) {
    return prisma.note.create({
      data: {
        title,
        content: content || null,
        categoryId: Number(categoryId),
      },
      include: { category: true },
    });
  },

  /**
   * Update note by ID
   * @param {number} id - Note ID
   * @param {Object} data - Updated data
   * @param {string} [data.title] - New title
   * @param {string} [data.content] - New content
   * @param {number} [data.categoryId] - New category ID
   * @param {boolean} [data.archived] - Archived status
   * @returns {Promise<Object|null>} Updated note or null
   */
  async update(id, data) {
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.categoryId !== undefined) updateData.categoryId = Number(data.categoryId);
    if (data.archived !== undefined) updateData.archived = data.archived;

    return prisma.note.update({
      where: { id: Number(id) },
      data: updateData,
      include: { category: true },
    });
  },

  /**
   * Delete note by ID
   * @param {number} id - Note ID
   * @returns {Promise<Object>} Deleted note
   */
  async delete(id) {
    return prisma.note.delete({
      where: { id: Number(id) },
    });
  },
};

export default noteService;
