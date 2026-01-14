# Admin Labs - Setup Guide

## Prerequisites

- PostgreSQL database (local or remote)
- Bun runtime
- Node.js (if not using Bun)

## Setup Instructions

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Database

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/admin_labs?schema=public"
```

Replace `username`, `password`, `localhost`, `5432`, and `admin_labs` with your PostgreSQL credentials.

### 3. Generate Prisma Client

```bash
bun run db:generate
```

### 4. Run Database Migrations

```bash
bun run db:migrate
```

This will create the `users` and `sessions` tables in your database.

### 5. Seed Default Admin User

```bash
bun run db:seed
```

This creates a default admin user:
- **Username:** `admin`
- **Email:** `admin@labs.edu`
- **Password:** `admin123`

**⚠️ Important:** Change the default password after first login!

### 6. Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

## Database Schema

### User Model
- `id`: Unique identifier (CUID)
- `username`: Unique username
- `email`: Optional unique email
- `password`: Hashed password (bcrypt)
- `name`: Optional display name
- `role`: User role (default: "admin")
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### Session Model
- `id`: Unique identifier (CUID)
- `userId`: Foreign key to User
- `token`: Unique session token
- `expiresAt`: Session expiration date
- `createdAt`: Session creation timestamp
- `updatedAt`: Last update timestamp

## API Routes

### POST `/api/auth/login`
Authenticate user and create session.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@labs.edu",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### POST `/api/auth/logout`
Logout and destroy session.

## Protected Routes

Routes under `/dashboard` are protected and require authentication. The middleware will redirect unauthenticated users to the login page.

## Useful Commands

- `bun run db:generate` - Generate Prisma Client
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed default admin user
- `bun run db:studio` - Open Prisma Studio (database GUI)

