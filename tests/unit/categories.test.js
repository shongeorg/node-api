import { describe, it, assert, beforeEach } from '../runner.js';
import { mockPrisma } from '../mocks/prisma.js';

// Controller helper
const toJson = (data) => JSON.stringify(data, null, 2);

// Controller factory
const createController = () => ({
  async getAll() {
    const categories = await mockPrisma.category.findMany({ include: { notes: true } });
    return toJson(categories);
  },

  async getById({ id }) {
    if (!id) return toJson({ error: 'Category ID is required' });
    const category = await mockPrisma.category.findUnique({
      where: { id: Number(id) },
      include: { notes: true },
    });
    if (!category) return toJson({ error: 'Category not found' });
    return toJson(category);
  },

  async create(_, body) {
    if (!body?.name) return toJson({ error: 'Name is required' });
    const category = await mockPrisma.category.create({
      data: { name: body.name },
      include: { notes: true },
    });
    return toJson(category);
  },

  async update({ id }, body) {
    if (!id) return toJson({ error: 'Category ID is required' });
    if (!body?.name) return toJson({ error: 'Name is required' });
    const category = await mockPrisma.category.update({
      where: { id: Number(id) },
      data: { name: body.name },
      include: { notes: true },
    });
    if (!category) return toJson({ error: 'Category not found' });
    return toJson(category);
  },

  async delete({ id }) {
    if (!id) return toJson({ error: 'Category ID is required' });
    const deleted = await mockPrisma.category.delete({
      where: { id: Number(id) },
    });
    if (!deleted) return toJson({ error: 'Category not found' });
    return toJson({ message: 'Category deleted' });
  },
});

describe('CategoriesController', () => {
  describe('getAll', () => {
    beforeEach(() => {
      mockPrisma.$reset();
    });

    it('should return empty array when no categories', async () => {
      const controller = createController();
      const result = await controller.getAll();
      const parsed = JSON.parse(result);
      assert(Array.isArray(parsed));
      assert.strictEqual(parsed.length, 0);
    });

    it('should return all categories with notes', async () => {
      const controller = createController();
      mockPrisma.$reset();
      await mockPrisma.category.create({ data: { name: 'Test 1' } });
      await mockPrisma.category.create({ data: { name: 'Test 2' } });

      const result = await controller.getAll();
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.length, 2);
      assert.strictEqual(parsed[0].name, 'Test 1');
      assert.strictEqual(parsed[1].name, 'Test 2');
    });
  });

  describe('getById', () => {
    beforeEach(() => {
      mockPrisma.$reset();
    });

    it('should return category by ID', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({
        data: { name: 'Test Category' },
      });

      const result = await controller.getById({ id: String(category.id) });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.name, 'Test Category');
      assert.strictEqual(parsed.id, category.id);
    });

    it('should return 404 for non-existent category', async () => {
      const controller = createController();
      const result = await controller.getById({ id: '999' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Category not found');
    });

    it('should return error when ID not provided', async () => {
      const controller = createController();
      const result = await controller.getById({});
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Category ID is required');
    });
  });

  describe('create', () => {
    beforeEach(() => {
      mockPrisma.$reset();
    });

    it('should create new category', async () => {
      const controller = createController();
      const result = await controller.create(null, { name: 'New Category' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.name, 'New Category');
      assert(typeof parsed.id === 'number');
    });

    it('should return error when name is missing', async () => {
      const controller = createController();
      const result = await controller.create(null, {});
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Name is required');
    });

    it('should return error when body is null', async () => {
      const controller = createController();
      const result = await controller.create(null, null);
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Name is required');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockPrisma.$reset();
    });

    it('should update existing category', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({
        data: { name: 'Old Name' },
      });

      const result = await controller.update(
        { id: String(category.id) },
        { name: 'New Name' }
      );
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.name, 'New Name');
      assert.strictEqual(parsed.id, category.id);
    });

    it('should return 404 for non-existent category', async () => {
      const controller = createController();
      const result = await controller.update({ id: '999' }, { name: 'New Name' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Category not found');
    });

    it('should return error when name is missing', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({
        data: { name: 'Test' },
      });

      const result = await controller.update({ id: String(category.id) }, {});
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Name is required');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      mockPrisma.$reset();
    });

    it('should delete existing category', async () => {
      const controller = createController();
      const category = await mockPrisma.category.create({
        data: { name: 'To Delete' },
      });

      const result = await controller.delete({ id: String(category.id) });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.message, 'Category deleted');

      const deleted = await mockPrisma.category.findUnique({
        where: { id: category.id },
      });
      assert.strictEqual(deleted, null);
    });

    it('should return 404 for non-existent category', async () => {
      const controller = createController();
      const result = await controller.delete({ id: '999' });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Category not found');
    });

    it('should return error when ID not provided', async () => {
      const controller = createController();
      const result = await controller.delete({});
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.error, 'Category ID is required');
    });
  });
});
