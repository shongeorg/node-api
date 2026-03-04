# Node.js REST API

A modern Vanilla Node.js REST API with CLI, Interactive UI Tester, and comprehensive testing suite.

![Node.js](https://img.shields.io/badge/Node.js-24.14.0-green)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Tests](https://img.shields.io/badge/Tests-31%20passing-brightgreen)

## ✨ Features

- **🛠 CLI Tool** - Laravel/AdonisJS-style commands for routes and scaffolding
- **🌐 UI API Tester** - Interactive web interface for testing endpoints
- **🧪 Testing Framework** - Custom test runner on pure Node.js (31 tests)
- **📦 Service Architecture** - Clean separation of business logic and HTTP handlers
- **🚀 Prisma ORM** - Type-safe database access with PostgreSQL
- **⚡ Graceful Shutdown** - Proper signal handling and cleanup

## 🚀 Quick Start

### Prerequisites
- Node.js v24.14.0 or higher
- PostgreSQL database (or use Prisma Accelerate)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd node-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Open UI Tester
Navigate to **http://localhost:3000** in your browser.

## 📡 API Endpoints

### Index & Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | UI API Tester |
| GET | `/faker` | Generate fake user data |

### Posts (Static Data)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | Get all posts |
| GET | `/posts/:id` | Get post by ID |

### Users (Static Data)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get user by ID |

### Categories (Database)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Get all categories |
| GET | `/categories/:id` | Get category by ID |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |

### Notes (Database)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notes` | Get all notes |
| GET | `/notes/:id` | Get note by ID |
| POST | `/notes` | Create note |
| PUT | `/notes/:id` | Update note |
| DELETE | `/notes/:id` | Delete note |

## 🛠 CLI Commands

### Show All Routes
```bash
node src/cli.js routes
```

**Output:**
```
◼ API Routes
┌───────┼───────────────┼─────────────────────┐
│ Method │ Path            │ Handler              │
├───────┼───────────────┼─────────────────────┤
│ GET    │ /categories     │ categoriesController │
│ POST   │ /categories     │ categoriesController │
│ PUT    │ /categories/:id │ categoriesController │
│ DELETE │ /categories/:id │ categoriesController │
└───────┼───────────────┼─────────────────────┘
```

### Generate CRUD (Scaffold)
```bash
node src/cli.js scaffold <EntityName>

# Examples
node src/cli.js scaffold Product
node src/cli.js scaffold Order
node src/cli.js scaffold Customer
```

This creates:
- `src/services/<entity>.js` - Service layer with CRUD methods
- `src/controllers/<entity>.js` - HTTP request handlers
- Auto-registers 5 routes in `src/routes.js`

### Show Help
```bash
node src/cli.js help
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Output
```
✓ Passed: 31
✗ Failed: 0
Total: 31
```

### Test Structure
Tests are located in `tests/unit/` and use a custom test runner built on pure Node.js (`node:assert`, `node:events`).

```javascript
import { describe, it, assert, beforeEach } from '../runner.js';
import { mockPrisma } from '../mocks/prisma.js';

describe('CategoriesController', () => {
  beforeEach(() => {
    mockPrisma.$reset();
  });

  it('should return all categories', async () => {
    const controller = createController();
    const result = await controller.getAll();
    assert(Array.isArray(JSON.parse(result)));
  });
});
```

## 🗄 Database Schema

### Category Model
```prisma
model Category {
  id    Int    @id @default(autoincrement())
  name  String
  notes Note[]
}
```

### Note Model
```prisma
model Note {
  id         Int      @id @default(autoincrement())
  title      String
  content    String?
  archived   Boolean  @default(false)
  categoryId Int
  category   Category @relation(fields: [categoryId], references: [id])
}
```

## 📁 Project Structure

```
node-api/
├── src/
│   ├── server.js           # HTTP server + static files
│   ├── config.js           # Environment configuration
│   ├── cli.js              # CLI tool
│   ├── routes.js           # Route definitions
│   ├── loger.js            # Logging middleware
│   ├── controllers/        # HTTP handlers
│   │   ├── categories.js
│   │   ├── notes.js
│   │   └── index.js
│   └── services/           # Business logic
│       ├── category.js
│       └── note.js
├── tests/
│   ├── runner.js           # Test runner
│   ├── mocks/
│   │   └── prisma.js       # Mock Prisma client
│   └── unit/
│       ├── categories.test.js
│       └── notes.test.js
├── public/
│   └── index.html          # UI API Tester
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds.js
├── .env.example
├── package.json
└── README.md
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Prisma Accelerate or local PostgreSQL)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY"
# Or: DATABASE_URL="postgresql://user:password@localhost:5432/nodeapi"

# Server
PORT=3000
NODE_ENV=development
```

## 📜 Available Scripts

```bash
npm start           # Start production server
npm run dev         # Start development server with --watch
npm test            # Run unit tests
npm run seeds       # Seed database with test data
node src/cli.js routes          # Show all routes
node src/cli.js scaffold Product  # Generate CRUD
node src/cli.js help            # Show CLI help
```

## 🎯 Usage Examples

### Using UI Tester
1. Open http://localhost:3000
2. Select an endpoint from the left panel
3. Configure request (ID, JSON body)
4. Click "Send Request"
5. View formatted response

### Using cURL
```bash
# Get all categories
curl http://localhost:3000/categories

# Get category by ID
curl http://localhost:3000/categories/1

# Create category
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "New Category"}'

# Update category
curl -X PUT http://localhost:3000/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Category"}'

# Delete category
curl -X DELETE http://localhost:3000/categories/1
```

### Using PowerShell
```powershell
# Get all notes
Invoke-RestMethod -Uri 'http://localhost:3000/notes'

# Create note
$body = @{title='New Note'; categoryId=1} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/notes' `
  -Method Post -Body $body -ContentType 'application/json'
```

## 🏗 Architecture

### Request Flow
```
HTTP Request
    ↓
server.js (Static files → API routing)
    ↓
routes.js (Route matching)
    ↓
controller (HTTP handling, validation)
    ↓
service (Business logic, Prisma)
    ↓
Prisma → Database
    ↓
Response (JSON)
```

### Key Design Decisions
- **ES Modules** - Modern JavaScript module system
- **Service Layer** - Isolated business logic for easy testing
- **Controller Layer** - HTTP-specific handling and validation
- **Mock Prisma** - In-memory database for unit tests
- **Graceful Shutdown** - Proper cleanup on SIGTERM/SIGINT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- CLI design inspired by [Laravel Artisan](https://laravel.com/docs/artisan) and [AdonisJS Ace](https://docs.adonisjs.com/guides/ace)
- UI Tester design inspired by modern API testing tools
- Testing framework built on Node.js built-in modules

---

**Built with ❤️ using Node.js, Prisma, and PostgreSQL**
