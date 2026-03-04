#!/usr/bin/env node

/**
 * CLI для Node.js API
 * Використання: node src/cli.js <command> [options]
 * 
 * Команди:
 *   routes              - Показати всі маршрути
 *   scaffold <entity>   - Створити CRUD за шаблоном
 *   help                - Показати довідку
 */

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

const colorize = (color, str) => `${colors[color]}${str}${colors.reset}`;

// Helper: вивід таблиці
function printTable(headers, rows) {
  const widths = headers.map((h, i) => 
    Math.max(h.length, ...rows.map(r => String(r[i] || '').length))
  );
  
  // Header
  const separator = widths.map(w => '─'.repeat(w)).join('┼');
  console.log(colorize('dim', `┌─${separator}─┐`));
  
  const headerRow = headers.map((h, i) => colorize('bold', h.padEnd(widths[i]))).join(' │ ');
  console.log(colorize('dim', '│') + ` ${headerRow} ` + colorize('dim', '│'));
  
  console.log(colorize('dim', `├─${separator}─┤`));
  
  // Rows
  rows.forEach(row => {
    const rowStr = row.map((cell, i) => {
      const str = String(cell || '').padEnd(widths[i]);
      if (i === 0) return colorize('cyan', str); // Method column
      if (i === 1) return colorize('yellow', str); // Path column
      return str;
    }).join(' │ ');
    console.log(colorize('dim', '│') + ` ${rowStr} ` + colorize('dim', '│'));
  });
  
  console.log(colorize('dim', `└─${separator}─┘`));
}

// Command: routes
function cmdRoutes() {
  console.log(`\n${colorize('bold', colorize('cyan', '◼'))} ${colorize('bold', 'API Routes')}\n`);
  
  try {
    const routesContent = readFileSync(join(rootDir, 'src', 'routes.js'), 'utf-8');
    
    // Parse routes from file
    const routeMatches = routesContent.matchAll(/['"]([^'"]+)['"]\s*:\s*(\w+)/g);
    const routes = [];
    
    for (const match of routeMatches) {
      const [_, path, controller] = match;
      
      // Parse method from path (e.g., "post:categories" -> POST /categories)
      let method = 'GET';
      let routePath = path;
      
      if (path.startsWith('post:')) {
        method = 'POST';
        routePath = path.slice(5);
      } else if (path.startsWith('put:')) {
        method = 'PUT';
        routePath = path.slice(4);
      } else if (path.startsWith('delete:')) {
        method = 'DELETE';
        routePath = path.slice(7);
      } else if (path.startsWith('get:')) {
        method = 'GET';
        routePath = path.slice(4);
      }
      
      routes.push([method, `/${routePath}`, controller]);
    }
    
    printTable(['Method', 'Path', 'Handler'], routes);
    console.log(`\n${colorize('green', `✓ Total: ${routes.length} routes`)}\n`);
  } catch (error) {
    console.error(colorize('red', `Error: ${error.message}`));
    process.exit(1);
  }
}

// Command: scaffold
function cmdScaffold(entityName) {
  if (!entityName) {
    console.error(colorize('red', 'Error: Entity name is required'));
    console.log(`Usage: node src/cli.js scaffold <EntityName>`);
    console.log(`Example: node src/cli.js scaffold Product`);
    process.exit(1);
  }
  
  // Normalize entity name (capitalize first letter)
  const entity = entityName.charAt(0).toUpperCase() + entityName.slice(1);
  const entityLower = entity.toLowerCase();
  const entityPlural = entity.endsWith('s') ? entity : entity + 's';
  const entityPluralLower = entityLower + 's';
  
  console.log(`\n${colorize('bold', colorize('cyan', '◼'))} ${colorize('bold', `Scaffolding ${entity}`)}\n`);
  
  const srcDir = join(rootDir, 'src');
  const controllersDir = join(srcDir, 'controllers');
  const servicesDir = join(srcDir, 'services');
  
  // 1. Create Service
  const servicePath = join(servicesDir, `${entityLower}.js`);
  const serviceContent = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ${entityLower}Service = {
  /**
   * Get all ${entityPluralLower}
   * @returns {Promise<Array>}
   */
  async getAll() {
    // TODO: Implement get all logic
    return prisma.${entityLower}.findMany();
  },

  /**
   * Get ${entity} by ID
   * @param {number} id - ${entity} ID
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    // TODO: Implement get by ID logic
    return prisma.${entityLower}.findUnique({
      where: { id: Number(id) },
    });
  },

  /**
   * Create new ${entity}
   * @param {Object} data - ${entity} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    // TODO: Implement create logic
    return prisma.${entityLower}.create({
      data,
    });
  },

  /**
   * Update ${entity} by ID
   * @param {number} id - ${entity} ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    // TODO: Implement update logic
    return prisma.${entityLower}.update({
      where: { id: Number(id) },
      data,
    });
  },

  /**
   * Delete ${entity} by ID
   * @param {number} id - ${entity} ID
   * @returns {Promise<Object>}
   */
  async delete(id) {
    // TODO: Implement delete logic
    return prisma.${entityLower}.delete({
      where: { id: Number(id) },
    });
  },
};

export default ${entityLower}Service;
`;
  
  // 2. Create Controller
  const controllerPath = join(controllersDir, `${entityLower}.js`);
  const controllerContent = `import { ${entityLower}Service } from '../services/${entityLower}.js';
import { toJson } from '../loger.js';

/**
 * ${entity} Controller
 * Handles HTTP requests for ${entityPluralLower} operations
 */
export const ${entityLower}Controller = {
  /**
   * GET /${entityPluralLower} - Get all ${entityPluralLower}
   */
  async getAll() {
    try {
      const items = await ${entityLower}Service.getAll();
      return toJson(items);
    } catch (error) {
      console.error('Error in ${entityLower}Controller.getAll:', error);
      throw new Error('Failed to fetch ${entityPluralLower}');
    }
  },

  /**
   * GET /${entityPluralLower}/:id - Get ${entity} by ID
   */
  async getById({ id }) {
    try {
      if (!id) {
        return toJson({ error: '${entity} ID is required' }, 400);
      }

      const item = await ${entityLower}Service.getById(id);

      if (!item) {
        return toJson({ error: '${entity} not found' }, 404);
      }

      return toJson(item);
    } catch (error) {
      console.error('Error in ${entityLower}Controller.getById:', error);
      throw new Error('Failed to fetch ${entity}');
    }
  },

  /**
   * POST /${entityPluralLower} - Create new ${entity}
   */
  async create(_, body) {
    try {
      // TODO: Add validation for required fields
      const item = await ${entityLower}Service.create(body);
      return toJson(item, 201);
    } catch (error) {
      console.error('Error in ${entityLower}Controller.create:', error);
      throw new Error('Failed to create ${entity}');
    }
  },

  /**
   * PUT /${entityPluralLower}/:id - Update ${entity}
   */
  async update({ id }, body) {
    try {
      if (!id) {
        return toJson({ error: '${entity} ID is required' }, 400);
      }

      // TODO: Add validation for fields
      const item = await ${entityLower}Service.update(id, body);

      if (!item) {
        return toJson({ error: '${entity} not found' }, 404);
      }

      return toJson(item);
    } catch (error) {
      console.error('Error in ${entityLower}Controller.update:', error);
      if (error.message.includes('not found')) {
        return toJson({ error: '${entity} not found' }, 404);
      }
      throw new Error('Failed to update ${entity}');
    }
  },

  /**
   * DELETE /${entityPluralLower}/:id - Delete ${entity}
   */
  async delete({ id }) {
    try {
      if (!id) {
        return toJson({ error: '${entity} ID is required' }, 400);
      }

      await ${entityLower}Service.delete(id);
      return toJson({ message: '${entity} deleted' });
    } catch (error) {
      console.error('Error in ${entityLower}Controller.delete:', error);
      if (error.message.includes('not found')) {
        return toJson({ error: '${entity} not found' }, 404);
      }
      throw new Error('Failed to delete ${entity}');
    }
  },
};

export default ${entityLower}Controller;
`;

  // 3. Update routes.js
  const routesPath = join(srcDir, 'routes.js');
  
  try {
    // Create directories if not exist
    if (!existsSync(controllersDir)) {
      mkdirSync(controllersDir, { recursive: true });
    }
    if (!existsSync(servicesDir)) {
      mkdirSync(servicesDir, { recursive: true });
    }
    
    // Write service file
    writeFileSync(servicePath, serviceContent);
    console.log(`  ${colorize('green', '✓')} Created: src/services/${entityLower}.js`);
    
    // Write controller file
    writeFileSync(controllerPath, controllerContent);
    console.log(`  ${colorize('green', '✓')} Created: src/controllers/${entityLower}.js`);
    
    // Update routes.js
    const routesContent = readFileSync(routesPath, 'utf-8');
    
    // Add import
    const importLine = `import { ${entityLower}Controller } from './controllers/${entityLower}.js';`;
    if (!routesContent.includes(importLine)) {
      const newRoutes = routesContent.replace(
        /^(import .+ from .+;)/m,
        `${importLine}\n$1`
      );
      writeFileSync(routesPath, newRoutes);
    }
    
    // Add routes (before closing brace)
    const routesToAdd = `
  // ${entity} CRUD
  'post:${entityPluralLower}': ${entityLower}Controller.create,
  'put:${entityPluralLower}/:id': ${entityLower}Controller.update,
  'delete:${entityPluralLower}/:id': ${entityLower}Controller.delete,
  'get:${entityPluralLower}/:id': ${entityLower}Controller.getById,
  'get:${entityPluralLower}': ${entityLower}Controller.getAll,
`;
    
    if (!routesContent.includes(`'get:${entityPluralLower}'`)) {
      const updatedRoutes = routesContent.replace(
        /^(export const routes = \{)/m,
        `$1${routesToAdd}`
      );
      writeFileSync(routesPath, updatedRoutes);
    }
    
    console.log(`  ${colorize('green', '✓')} Updated: src/routes.js`);
    
    console.log(`\n${colorize('green', `✓ ${entity} scaffolded successfully!`)}\n`);
    console.log(`  ${colorize('dim', 'Next steps:')} `);
    console.log(`  1. Update Prisma schema with ${entity} model`);
    console.log(`  2. Run: npx prisma migrate dev`);
    console.log(`  3. Implement logic in src/services/${entityLower}.js\n`);
    
  } catch (error) {
    console.error(colorize('red', `Error: ${error.message}`));
    process.exit(1);
  }
}

// Command: help
function cmdHelp() {
  console.log(`
${colorize('bold', colorize('cyan', '◼'))} ${colorize('bold', 'Node.js API CLI')}

${colorize('bold', 'Usage:')} node src/cli.js ${colorize('yellow', '<command>')} [options]

${colorize('bold', 'Commands:')}
  ${colorize('cyan', 'routes')}              Show all API routes
  ${colorize('cyan', 'scaffold')} ${colorize('yellow', '<Entity>')}    Generate CRUD files for an entity
  ${colorize('cyan', 'help')}                Show this help message

${colorize('bold', 'Examples:')}
  node src/cli.js routes
  node src/cli.js scaffold Product
  node src/cli.js scaffold Category
  node src/cli.js help

${colorize('dim', 'Inspired by Laravel & AdonisJS CLI')}
`);
}

// Main
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'routes':
    cmdRoutes();
    break;
  case 'scaffold':
    cmdScaffold(args[1]);
    break;
  case 'help':
  case '--help':
  case '-h':
    cmdHelp();
    break;
  default:
    if (!command) {
      console.error(colorize('red', 'Error: No command provided'));
    } else {
      console.error(colorize('red', `Error: Unknown command '${command}'`));
    }
    console.log(`Run '${colorize('cyan', 'node src/cli.js help')}' for usage.\n`);
    process.exit(1);
}
