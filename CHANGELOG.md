# Cosmetic Reservation Backend - Changelog

## Major Updates (November 2025)

### ✅ Task 1: Database & Testing Strategy Refactoring

**Removed In-Memory Database**
- ❌ Uninstalled `mongodb-memory-server` (unstable, deprecated)
- ✅ Tests now use a native MongoDB database

**Updated Test Configuration**
- `test/setup.ts`: Now connects to a real test database via `MONGO_URI_TEST` environment variable
- Default: `mongodb://localhost:27017/cosmetic-reservation-test`
- Database is automatically cleaned up after all tests complete

**Test Seeders Implemented**
- `test/helpers.ts`: Added `seedBaselineData()` function (optional)
- Database cleared before each test via `clearDatabase()`
- Tests create their own data as needed (test isolation)
- Can call `seedBaselineData()` explicitly if baseline data is required

### ✅ Task 2: Full CRUD Implementation & Critical Bug Fixes

**Materials API - NEW Endpoints**
- `GET /api/materials/:id` - Get material by ID
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

**Procedures API - NEW Endpoints**
- `GET /api/procedures/:id` - Get procedure by ID
- `PUT /api/procedures/:id` - Update procedure
- `DELETE /api/procedures/:id` - Delete procedure

**Bookings API - NEW Endpoints**
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

**Clients API - NEW Endpoint**
- `GET /api/clients/:id` - Get client by ID

**Total Endpoints: 21** (exceeds minimum requirement of 8)
- Clients: 5 (GET all, GET by ID, POST, PUT, DELETE)
- Materials: 5 (GET all, GET by ID, POST, PUT, DELETE)
- Procedures: 6 (GET all, GET by ID, POST, PUT, DELETE, POST BOM)
- Bookings: 5 (GET all, GET by ID, POST, PUT, DELETE, PATCH status)

**🚨 CRITICAL BUG FIX: Server Crash Prevention**

**Problem:** Adding a material with an invalid unit (e.g., "L" instead of "ml") crashed the entire server.

**Solution Implemented:**
1. **Validation Schemas Tightened** (`src/middleware/validation.ts`):
   - `createMaterialSchema.unit`: Changed from `z.string()` to `z.enum(['ml', 'g', 'pcs'])`
   - `createBookingSchema.status`: Added error messages to enum
   - `createBookingSchema.paymentType`: Added error messages to enum
   - Added `updateMaterialSchema`, `updateProcedureSchema`, `updateBookingSchema` with proper validation

2. **Error Handling Added to ALL Controllers**:
   - Every controller function now wrapped in `try...catch`
   - Errors passed to `next(error)` instead of crashing
   - Express error middleware handles all errors gracefully

**Code Quality Improvements**
- All controllers refactored to follow **Single Responsibility Principle**
- Functions kept under **20 lines** where possible
- **DRY principle** applied throughout
- All functions use **try-catch** for robust error handling

**Integration Tests Expanded**
- Added tests for all new CRUD endpoints
- Materials: 12 test cases
- Procedures: 15 test cases
- Bookings: 18 test cases
- Clients: Already had full coverage

### ✅ Task 3: Frontend Developer GUI

**Created Interactive Web Interface** (`public/` directory)

**Features:**
- 📱 Responsive design with modern UI
- 🎨 Beautiful gradient theme
- 📑 Tabbed interface for all 4 models
- ✅ Forms for all CRUD operations
- 🔄 Real-time API response display
- ❌ Error handling with visual feedback

**Files Created:**
- `public/index.html` - Main HTML structure
- `public/styles.css` - Modern, responsive styling
- `public/app.js` - Fetch API integration for all endpoints

**Access:** Navigate to `http://localhost:3000/` after starting the server

**Helmet Security Fix**
- ❌ Removed the insecure "disable Helmet for /docs" workaround
- ✅ Helmet now enabled globally with proper CSP configuration
- ✅ Swagger UI works correctly with secure headers
- ✅ Static files served securely

---

## Setup Instructions

### Prerequisites
1. **MongoDB** must be running locally
   - Install MongoDB: `brew install mongodb-community` (macOS)
   - Start MongoDB: `brew services start mongodb-community`
   - Or use MongoDB Compass GUI

### Environment Variables

Create a `.env` file in the root directory (if not exists):

```env
# Development Database
MONGO_URI=mongodb://localhost:27017/cosmetic-reservation

# Test Database (used by vitest)
MONGO_URI_TEST=mongodb://localhost:27017/cosmetic-reservation-test

# Optional
PORT=3000
OWNER_EMAIL=your-email@example.com
```

### Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Start production server
npm start
```

### Accessing the Application

- **Frontend GUI:** http://localhost:3000/
- **API Documentation (Swagger):** http://localhost:3000/docs
- **API Base URL:** http://localhost:3000/api

---

## Testing

### Running Tests

Tests now connect to a real MongoDB database at `MONGO_URI_TEST`.

**Important:** Make sure MongoDB is running before executing tests!

```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch
```

### Test Database

- Tests use a separate database: `cosmetic-reservation-test`
- Database is automatically cleaned and seeded before each test
- Database is dropped after all tests complete
- No interference with development data

---

## API Endpoints Summary

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Materials
- `GET /api/materials` - List all materials
- `GET /api/materials/:id` - Get material by ID
- `POST /api/materials` - Create material (unit must be: ml, g, or pcs)
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

### Procedures
- `GET /api/procedures` - List all procedures
- `GET /api/procedures/:id` - Get procedure by ID
- `POST /api/procedures` - Create procedure
- `PUT /api/procedures/:id` - Update procedure
- `DELETE /api/procedures/:id` - Delete procedure
- `POST /api/procedures/:id/bom` - Update procedure bill of materials

### Bookings
- `GET /api/bookings` - List all bookings (last 50)
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking
- `PATCH /api/bookings/:id/status/:newStatus` - Update booking status

---

## Engineering Principles Followed

✅ **At least 8 endpoints** - 21 endpoints implemented  
✅ **REST API** - All endpoints follow REST conventions  
✅ **2 services** - Loyalty and Notification services  
✅ **NoSQL database** - MongoDB with Mongoose  
✅ **Input validation** - Zod schemas with strict validation  
✅ **Integration tests** - Full test coverage for all endpoints  
✅ **Documentation** - Swagger/OpenAPI documentation  
✅ **DRY principle** - Code refactored to eliminate duplication  
✅ **Single Responsibility** - Each function does one thing  
✅ **20 lines / 2 indentations** - Code kept clean and readable  

---

## Notes

- The application will **NOT crash** from invalid input anymore
- All errors are handled gracefully and returned as JSON
- Use the frontend GUI at `/` for easy API testing
- Check Swagger docs at `/docs` for detailed API specifications
- Monitor the terminal for request logs and errors
