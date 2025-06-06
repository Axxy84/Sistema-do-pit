# CLAUDE.md

# language: pt-BR


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a complete restaurant/pizzeria management system (ERP) with:
- **Backend**: Node.js/Express with PostgreSQL database
- **Frontend**: React with Vite, TailwindCSS, and Radix UI components
- **Infrastructure**: PostgreSQL on neural server (192.168.0.105)

## Essential Commands

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Run migrations (creates tables and admin user)
npm run migrate

# Development server with hot reload
npm run dev

# Production server
npm start

# Test database connection
node test-db.cjs
```

### Frontend Development
```bash
# From project root
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Database Setup
```sql
-- Initial setup (run as postgres user)
CREATE DATABASE pizzaria_db;
CREATE USER pizzaria_user WITH PASSWORD 'pizzaria_pass';
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO pizzaria_user;
```

## Architecture Overview

### Backend Structure
- **Entry Point**: `backend/server.js` - Express server with security middlewares
- **Database**: `backend/config/database.js` - PostgreSQL connection pool
- **Authentication**: JWT-based with refresh tokens, middleware in `backend/middleware/auth.js`
- **Routes**: Modular route files in `backend/routes/`
- **Cache System**: In-memory cache-aside pattern in `backend/cache/`

### Frontend Architecture
- **API Client**: `src/lib/apiClient.js` - Centralized HTTP client with auth handling
- **Services**: `src/services/` - Domain-specific API calls
- **Components**: Reusable UI components in `src/components/`
- **Pages**: Route-level components in `src/pages/`
- **Context**: Auth context in `src/contexts/AuthContext.jsx`

### Key Features
1. **Authentication System**:
   - JWT with refresh tokens
   - Automatic token refresh on 401 responses
   - Protected routes on frontend

2. **Cache Implementation**:
   - Cache-aside pattern for heavy queries
   - TTL-based expiration
   - Automatic invalidation on data changes
   - Admin panel for cache management at `/api/cache-admin`

3. **Order Management**:
   - Complex order form with multiple payment methods
   - Pizza customization (sizes, borders, half/half)
   - Delivery fee calculation
   - Customer points system

4. **Dashboard Analytics**:
   - Real-time KPIs
   - Sales charts
   - Top products
   - Recent orders

## Database Schema Highlights

Key tables:
- `usuarios` - System users (employees)
- `clientes` - Customers
- `pedidos` - Orders with complex status workflow
- `itens_pedido` - Order items with pizza customization
- `produtos` - Products (pizzas, drinks, etc.)
- `fechamentos_caixa` - Cash closing records
- `transacoes` - Financial transactions

## Environment Configuration

Backend `.env` required variables:
```
DB_HOST=192.168.0.105
DB_PORT=5432
DB_NAME=pizzaria_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=strong_secret_key
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Main Resources
- `/api/orders` - Order management
- `/api/products` - Product catalog
- `/api/customers` - Customer management
- `/api/dashboard` - Analytics data
- `/api/cash-closing` - Cash register operations
- `/api/reports` - Business reports

## Development Notes

1. **CORS Configuration**: Backend accepts requests from any localhost port in development
2. **Cache Strategy**: Heavy queries are cached with appropriate TTLs (2-15 minutes)
3. **Error Handling**: API client automatically handles 401/403 and redirects to login
4. **Database Connection**: Uses connection pool with 20 max connections
5. **Security**: Helmet.js for security headers, rate limiting on sensitive endpoints

## Testing Credentials

Default admin user (created by migration):
- Email: `admin@pizzaria.com`
- Password: `admin123`

⚠️ Change this password immediately in production!