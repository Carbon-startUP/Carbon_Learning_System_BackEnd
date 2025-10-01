# Carbon Learning System Backend

Educational management system backend with Node.js, Express.js, PostgreSQL, and Redis.

## Features

- Multi-role authentication (Admin, Teacher, Student, Parent)
- School & course management with enrollment system
- Session-based auth with Redis caching
- Metadata system for user information
- Role-based dashboards

## Quick Start with Docker (Recommended)

### 1. Clone & Setup
```bash
git clone https://github.com/Carbon-startUP/Carbon_Learning_System_BackEnd.git
cd Carbon_Learning_System_BackEnd
```

### 2. Environment Configuration
Create `.env` file:
```env
POSTGRES_DB=carbon_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
REDIS_URL=redis://redis:6379
```

### 3. Start Services
```bash
docker compose up -d
docker compose exec carbon_backend npm run db:migrate
docker compose exec carbon_backend npm run db:seed
```

### 4. Access
- API: http://localhost:3111/api/health

---

## Local Setup (Without Docker)

### Prerequisites
- Node.js 18+, PostgreSQL 15+, Redis 7+

### Setup
```bash
# Install dependencies
npm install

# Create database
createdb carbon_db

# Start Redis
redis-server

# Configure environment (update DATABASE_URL for local)
cp .env.example .env

# Run migrations & seeds
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

## Scripts

```bash
npm run dev          # Development server
npm start            # Production server
npm run db:migrate   # Run migrations
npm run db:seed      # Run seeds
```

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Redis
- **Auth**: Session-based with Argon2
- **Security**: Helmet, CORS, rate limiting

