import { describe, it, assert, beforeEach } from '../runner.js';
import { mockPrisma } from '../mocks/prisma.js';

// Controller helper
const toJson = (data) => JSON.stringify(data, null, 2);

// Controller factory
const createController = () => ({
  async getAll() {
    const notes = await mockPrisma.note.findMany({ include: { category: true } });
    return toJson(notes);
  },

  async getById({ id }) {
    if (!id) return toJson({ error: 'Note ID is required' });
    const note = await mockPrisma.note.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });
    if (!note) return toJson({ error: 'Note not found' });
    return toJson(note);
  },

  async create(_, body) {
    if (!body?.title) return toJson({ error: 'Title is required' });
    if (!body?.categoryId) return toJson({ error: 'CategoryId is required' });
    const note = await mockPrisma.note.create({
      data: {
        title: body.title,
        content: body.content || null,
        categoryId: Number(body.categoryId),
      },
      include: { category: true },
    });
    return toJson(note);
  },

  async update({ id }, body) {
    if (!id) return toJson({ error: 'Note ID is required' });
    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.categoryId !== undefined) updateData.categoryId = Number(body.categoryId);
    if (body.archived !== undefined) updateData.archived = body.archived;
    const note = await mockPrisma.note.update({
      where: { id: Number(id) },
      data: updateData,
      include: { category: true },
    });
    if (!note) return toJson({ error: 'Note not found' });
    return toJson(note);
  },

  async delete({ id }) {
    if (!id) return toJson({ error: 'Note ID is required' });
    const deleted = await mockPrisma.note.delete({
      where: { id: Number(id) },
    });
    if (!deleted) return toJson({ error: 'Note not found' });
    return toJson({ message: 'Note deleted' });
  },
});

describe('NotesController', () => {
  describe('getAll', () => {
    beforeEach(() => {
      mockPrisma.$reset();
    });

    it('should return empty array when no notes', async () => {
      const controller = createController();
      const result = await controller.getAll();
      const parsed = JSON.parse(result);
      assert(Array.isArray(parsed));
      assert.strictEqual(parsed.length, 0);
    });

    it('should return all notes with category', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({ data: { name: 'Test Category' } });
      await mockPrisma.note.create({ data: { title: 'Note 1', categoryId: category.id } });
      await mockPrisma.note.create({ data: { title: 'Note 2', categoryId: category.id } });

      const result = await controller.getAll();
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.length, 2);
      assert.strictEqual(parsed[0].title, 'Note 1');
      assert.strictEqual(parsed[1].title, 'Note 2');
      assert(parsed[0].category);
      assert.strictEqual(parsed[0].category.name, 'Test Category');
    });
  });

  describe('getById', () => {
    beforeEach(() => {
      mockPrisma.$reset();
    });

    it('should return note by ID', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({ data: { name: 'Test Category' } });
      const note = await mockPrisma.note.create({
        data: { title: 'Test Note', content: 'Content', categoryId: category.id },
      });

      const result = await controller.getById({ id: String(note.id) });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.title, 'Test Note');
      assert.strictEqual(parsed.content, 'Content');
      assert.strictEqual(parsed.id, note.id);
    });

    it('should return 404 for non-existent note', async () => {
      const controller = createController();
      const result = await controller.getById({ id: '999' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Note not found');
    });

    it('should return error when ID not provided', async () => {
      const controller = createController();
      const result = await controller.getById({});
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Note ID is required');
    });
  });

  describe('create', () => {
    beforeEach(() => {
      mockPrisma.$reset();
    });

    it('should create new note', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({ data: { name: 'Test Category' } });
      const result = await controller.create(null, {
        title: 'New Note',
        content: 'Test content',
        categoryId: category.id,
      });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.title, 'New Note');
      assert.strictEqual(parsed.content, 'Test content');
      assert(typeof parsed.id === 'number');
    });

    it('should create note without content', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({ data: { name: 'Test Category' } });
      const result = await controller.create(null, {
        title: 'Note without content',
        categoryId: category.id,
      });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.title, 'Note without content');
      assert.strictEqual(parsed.content, null);
    });

    it('should return error when title is missing', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({ data: { name: 'Test Category' } });
      const result = await controller.create(null, { categoryId: category.id });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Title is required');
    });

    it('should return error when categoryId is missing', async () => {
      const controller = createController();
      const result = await controller.create(null, { title: 'Test' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'CategoryId is required');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockPrisma.$reset();
    });

    it('should update note title', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({ data: { name: 'Test Category' } });
      const note = await mockPrisma.note.create({
        data: { title: 'Old Title', categoryId: category.id },
      });

      const result = await controller.update({ id: String(note.id) }, { title: 'New Title' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.title, 'New Title');
    });

    it('should update note content', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({ data: { name: 'Test Category' } });
      const note = await mockPrisma.note.create({
        data: { title: 'Test', content: 'Old content', categoryId: category.id },
      });

      const result = await controller.update({ id: String(note.id) }, { content: 'New content' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.content, 'New content');
    });

    it('should update archived status', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({ data: { name: 'Test Category' } });
      const note = await mockPrisma.note.create({
        data: { title: 'Test', categoryId: category.id, archived: false },
      });

      const result = await controller.update({ id: String(note.id) }, { archived: true });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.archived, true);
    });

    it('should return 404 for non-existent note', async () => {
      const controller = createController();
      const result = await controller.update({ id: '999' }, { title: 'New Title' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Note not found');
    });

    it('should return error when ID not provided', async () => {
      const controller = createController();
      const result = await controller.update({}, { title: 'Test' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Note ID is required');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      mockPrisma.$reset();
    });

    it('should delete existing note', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({ data: { name: 'Test Category' } });
      const note = await mockPrisma.note.create({
        data: { title: 'To Delete', categoryId: category.id },
      });

      const result = await controller.delete({ id: String(note.id) });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.message, 'Note deleted');

      const deleted = await mockPrisma.note.findUnique({ where: { id: note.id } });
      assert.strictEqual(deleted, null);
    });

    it('should return 404 for non-existent note', async () => {
      const controller = createController();
      const result = await controller.delete({ id: '999' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Note not found');
    });

    it('should return error when ID not provided', async () => {
      const controller = createController();
      const result = await controller.delete({});
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Note ID is required');
    });
  });
});
