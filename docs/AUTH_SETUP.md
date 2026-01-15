# Authentication & Database Setup

This ERP system uses **Better Auth** for authentication and **Prisma** with **PostgreSQL** for database management.

## Database Schema

The database includes the following models:

### Core Auth Models
- **User**: Main user table with role-based access (ADMIN, FACULTY, STUDENT)
- **Account**: OAuth provider accounts
- **Session**: User sessions
- **VerificationToken**: Email verification tokens

### ERP Models
- **StudentProfile**: Student-specific data (roll number, department, semester, etc.)
- **FacultyProfile**: Faculty-specific data (employee ID, designation, etc.)
- **AdminProfile**: Admin-specific data and permissions
- **Course**: Course information
- **StudentCourse**: Many-to-many relationship between students and courses
- **Attendance**: Student attendance records
- **Grade**: Student grades and exam results

## Setup Instructions

### 1. Environment Variables

Make sure your `.env` file contains:
```env
DATABASE_URL='your-postgresql-url'
BETTER_AUTH_SECRET='your-secret-key'
BETTER_AUTH_URL='http://localhost:3000'
NEXT_PUBLIC_BETTER_AUTH_URL='http://localhost:3000'
```

### 2. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. (Optional) View Database

```bash
npx prisma studio
```

## Usage

### Server-Side Authentication

```typescript
import { getSession, requireAuth, requireRole } from '@/lib/auth-helpers'

// Get current session
const session = await getSession()

// Require authentication
const session = await requireAuth()

// Require specific role
const session = await requireRole('ADMIN')
const session = await requireRole(['ADMIN', 'FACULTY'])
```

### Client-Side Authentication

```typescript
'use client'

import { useAuth, useRequireAuth, useRequireRole } from '@/hooks/use-auth'
import { signIn, signUp, signOut } from '@/lib/auth-client'

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  // Automatically redirect if not authenticated
  useRequireAuth()
  
  // Automatically redirect if not admin
  useRequireRole('ADMIN')
  
  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

### Sign In / Sign Up

```typescript
// Sign in with email and password
await signIn.email({
  email: 'user@example.com',
  password: 'password123'
})

// Sign up
await signUp.email({
  email: 'newuser@example.com',
  password: 'password123',
  name: 'John Doe',
  role: 'STUDENT'
})
```

## API Routes

Authentication endpoints are available at:
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-out`
- `GET /api/auth/session`

## Middleware

Route protection is handled by [middleware.ts](middleware.ts):
- Public routes: `/login`, `/sign-up`
- Admin routes: `/admin/*` (requires ADMIN role)
- Faculty routes: `/faculty/*` (requires FACULTY role)
- Student routes: `/students/*` (requires STUDENT role)

## User Roles

- **ADMIN**: Full system access
- **FACULTY**: Access to course management, attendance, grades
- **STUDENT**: Access to personal courses, attendance, grades

## Creating Your First User

You can create users programmatically or through a sign-up form. For initial admin setup:

```typescript
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// Create admin user
const hashedPassword = await hash('admin123', 10)
await prisma.user.create({
  data: {
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    adminProfile: {
      create: {
        employeeId: 'ADMIN001',
        position: 'System Administrator',
        permissions: JSON.stringify(['all'])
      }
    }
  }
})
```

## Security Notes

1. **Change BETTER_AUTH_SECRET** in production to a strong random string
2. Never commit `.env` file to version control
3. Use HTTPS in production
4. Enable email verification in production environments
5. Implement rate limiting for authentication endpoints
