/**
 * Mock Prisma Client for unit testing
 * Provides in-memory data storage that mimics Prisma's API
 */

class MockPrismaClient {
  constructor() {
    this.$reset();
  }

  // Reset all data (for beforeEach hooks)
  $reset() {
    this.categories = [];
    this.notes = [];
    this.categoryIdCounter = 1;
    this.noteIdCounter = 1;
  }

  // Category operations
  get category() {
    return {
      findMany: async ({ include = {}, where = {} } = {}) => {
        let results = [...this.categories];

        // Apply where filters
        if (where.id) {
          results = results.filter((c) => c.id === where.id);
        }

        // Include related notes
        if (include.notes) {
          results = results.map((c) => ({
            ...c,
            notes: this.notes.filter((n) => n.categoryId === c.id),
          }));
        }

        return results;
      },

      findUnique: async ({ include = {}, where = {} } = {}) => {
        let result = this.categories.find((c) => c.id === where.id);

        if (!result) return null;

        // Include related notes
        if (include.notes) {
          result = {
            ...result,
            notes: this.notes.filter((n) => n.categoryId === result.id),
          };
        }

        return result;
      },

      create: async ({ data = {} } = {}) => {
        const newCategory = {
          id: this.categoryIdCounter++,
          name: data.name,
        };
        this.categories.push(newCategory);
        return newCategory;
      },

      update: async ({ where = {}, data = {} } = {}) => {
        const index = this.categories.findIndex((c) => c.id === where.id);
        if (index === -1) return null;

        this.categories[index] = {
          ...this.categories[index],
          ...data,
        };
        return this.categories[index];
      },

      delete: async ({ where = {} } = {}) => {
        const index = this.categories.findIndex((c) => c.id === where.id);
        if (index === -1) return null;

        const deleted = this.categories.splice(index, 1)[0];
        return deleted;
      },
    };
  }

  // Note operations
  get note() {
    return {
      findMany: async ({ include = {}, where = {} } = {}) => {
        let results = [...this.notes];

        // Apply where filters
        if (where.id) {
          results = results.filter((n) => n.id === where.id);
        }
        if (where.categoryId) {
          results = results.filter((n) => n.categoryId === where.categoryId);
        }
        if (where.archived !== undefined) {
          results = results.filter((n) => n.archived === where.archived);
        }

        // Include related category
        if (include.category) {
          results = results.map((n) => ({
            ...n,
            category: this.categories.find((c) => c.id === n.categoryId) || null,
          }));
        }

        return results;
      },

      findUnique: async ({ include = {}, where = {} } = {}) => {
        let result = this.notes.find((n) => n.id === where.id);

        if (!result) return null;

        // Include related category
        if (include.category) {
          result = {
            ...result,
            category: this.categories.find((c) => c.id === result.categoryId) || null,
          };
        }

        return result;
      },

      create: async ({ data = {} } = {}) => {
        const newNote = {
          id: this.noteIdCounter++,
          title: data.title,
          content: data.content || null,
          archived: data.archived ?? false,
          categoryId: data.categoryId,
        };
        this.notes.push(newNote);
        return newNote;
      },

      update: async ({ where = {}, data = {} } = {}) => {
        const index = this.notes.findIndex((n) => n.id === where.id);
        if (index === -1) return null;

        this.notes[index] = {
          ...this.notes[index],
          ...data,
        };
        return this.notes[index];
      },

      delete: async ({ where = {} } = {}) => {
        const index = this.notes.findIndex((n) => n.id === where.id);
        if (index === -1) return null;

        const deleted = this.notes.splice(index, 1)[0];
        return deleted;
      },
    };
  }

  // Transaction support
  async $transaction(operations) {
    try {
      const results = await Promise.all(operations);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // Disconnect (no-op for mock)
  async $disconnect() {}
}

// Create singleton instance for tests
export const mockPrisma = new MockPrismaClient();

// Factory functions for creating test data
export const factories = {
  category: (overrides = {}) => ({
    id: mockPrisma.categoryIdCounter,
    name: `Test Category ${mockPrisma.categoryIdCounter}`,
    ...overrides,
  }),

  note: (overrides = {}) => ({
    id: mockPrisma.noteIdCounter,
    title: `Test Note ${mockPrisma.noteIdCounter}`,
    content: 'Test content',
    archived: false,
    categoryId: 1,
    ...overrides,
  }),
};

export default MockPrismaClient;
