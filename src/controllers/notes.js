import { noteService } from '../services/note.js';
import { toJson } from '../loger.js';

/**
 * Notes Controller
 * Handles HTTP requests for note operations
 */
export const notesController = {
  /**
   * GET /notes - Get all notes
   */
  async getAll() {
    try {
      const notes = await noteService.getAll();
      return toJson(notes);
    } catch (error) {
      console.error('Error in notesController.getAll:', error);
      throw new Error('Failed to fetch notes');
    }
  },

  /**
   * GET /notes/:id - Get note by ID
   * @param {Object} params - Route params
   * @param {string} params.id - Note ID
   */
  async getById({ id }) {
    try {
      if (!id) {
        return toJson({ error: 'Note ID is required' }, 400);
      }

      const note = await noteService.getById(id);

      if (!note) {
        return toJson({ error: 'Note not found' }, 404);
      }

      return toJson(note);
    } catch (error) {
      console.error('Error in notesController.getById:', error);
      throw new Error('Failed to fetch note');
    }
  },

  /**
   * POST /notes - Create new note
   * @param {Object} body - Request body
   * @param {string} body.title - Note title
   * @param {string} [body.content] - Note content
   * @param {number} body.categoryId - Category ID
   */
  async create(_, body) {
    try {
      if (!body?.title) {
        return toJson({ error: 'Title is required' }, 400);
      }

      if (!body?.categoryId) {
        return toJson({ error: 'CategoryId is required' }, 400);
      }

      const note = await noteService.create({
        title: body.title,
        content: body.content,
        categoryId: body.categoryId,
      });
      return toJson(note, 201);
    } catch (error) {
      console.error('Error in notesController.create:', error);
      throw new Error('Failed to create note');
    }
  },

  /**
   * PUT /notes/:id - Update note
   * @param {Object} params - Route params
   * @param {string} params.id - Note ID
   * @param {Object} body - Request body
   */
  async update({ id }, body) {
    try {
      if (!id) {
        return toJson({ error: 'Note ID is required' }, 400);
      }

      const updateData = {};
      if (body.title !== undefined) updateData.title = body.title;
      if (body.content !== undefined) updateData.content = body.content;
      if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
      if (body.archived !== undefined) updateData.archived = body.archived;

      const note = await noteService.update(id, updateData);

      if (!note) {
        return toJson({ error: 'Note not found' }, 404);
      }

      return toJson(note);
    } catch (error) {
      console.error('Error in notesController.update:', error);
      if (error.message.includes('not found')) {
        return toJson({ error: 'Note not found' }, 404);
      }
      throw new Error('Failed to update note');
    }
  },

  /**
   * DELETE /notes/:id - Delete note
   * @param {Object} params - Route params
   * @param {string} params.id - Note ID
   */
  async delete({ id }) {
    try {
      if (!id) {
        return toJson({ error: 'Note ID is required' }, 400);
      }

      await noteService.delete(id);
      return toJson({ message: 'Note deleted' });
    } catch (error) {
      console.error('Error in notesController.delete:', error);
      if (error.message.includes('not found')) {
        return toJson({ error: 'Note not found' }, 404);
      }
      throw new Error('Failed to delete note');
    }
  },
};

export default notesController;
