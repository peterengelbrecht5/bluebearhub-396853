# Blue Bear & Blue Ballot

## Overview
Blue Bear is a Nordic-inspired navigation portal that serves as a central hub to access multiple business applications. One of these applications is Blue Ballot - a democratic voting platform with election management capabilities.

## Blue Ballot Voting Application

### Features
- **Authentication**: Secure user registration and login with bcrypt password hashing
- **Role-Based Access**: Admin and Voter roles with different permissions
- **Election Management** (Admin Only):
  - Create and manage elections
  - Add contests with single/multi-choice options
  - Assign eligible voters to specific elections
  - View real-time results and tallies
- **Voting** (Voters):
  - View assigned elections
  - Cast votes in contests
  - One vote per contest (double-vote prevention)
  - Vote confirmation receipts
- **Audit Logging**: All critical actions are logged for transparency

### Admin Access
**Creating the Admin Account:**

The application requires the `ADMIN_PASSWORD` environment variable to be set before starting. This is a security measure to prevent default credentials.

1. Set the admin password as a Replit secret:
   - Go to Secrets (lock icon in left sidebar)
   - Add secret: `ADMIN_PASSWORD` with your secure password (minimum 8 characters)

2. Optionally customize admin email (defaults to admin@blueballot.com):
   - Add secret: `ADMIN_EMAIL` with your preferred admin email

3. On first startup, the admin account will be created automatically

**Default Admin Email:** `admin@blueballot.com` (unless ADMIN_EMAIL is set)
**Admin Password:** Set via ADMIN_PASSWORD secret (required)

**IMPORTANT**: 
- The application will NOT start without ADMIN_PASSWORD being set
- Use a strong, unique password
- Change the password regularly
- Never commit passwords to version control

### Security
- All user registrations create voter accounts only
- Admin accounts must be created server-side via bootstrap
- Passwords are hashed with bcrypt (10 rounds)
- Sessions use HttpOnly cookies
- Double-vote prevention enforced at API level
- Role-based access control on all admin endpoints

### Architecture
- **Frontend**: React with Wouter routing, TanStack Query, Shadcn UI components
- **Backend**: Express.js with session-based authentication
- **Storage**: In-memory storage (MemStorage) - easily swappable for PostgreSQL
- **Styling**: Tailwind CSS with Nordic-inspired design (deep blues, clean typography)

### Data Model
- **Users**: email, password (hashed), role (admin/voter), name
- **Elections**: title, description, start/end dates, status
- **Contests**: title, description, type (single/multi-choice)
- **Options**: contest choices with labels and descriptions
- **Eligible Voters**: tracks which users can vote in which elections
- **Votes**: immutable vote records with contest and option IDs
- **Audit Logs**: tracks all critical actions (registration, login, voting, etc.)

### Routes
- `/` - Blue Bear navigation portal
- `/login` - Authentication page
- `/ballot` - Voter dashboard (protected)
- `/admin` - Admin dashboard (protected, admin-only)

### API Endpoints
**Authentication**:
- `POST /api/auth/register` - Register new voter account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

**Elections** (Protected):
- `GET /api/elections` - List elections (filtered by role)
- `POST /api/elections` - Create election (admin)
- `GET /api/elections/:id` - Get election details
- `PATCH /api/elections/:id` - Update election (admin)
- `DELETE /api/elections/:id` - Delete election (admin)

**Contests**:
- `GET /api/elections/:electionId/contests` - List contests
- `POST /api/elections/:electionId/contests` - Create contest (admin)

**Options**:
- `GET /api/contests/:contestId/options` - List options
- `POST /api/contests/:contestId/options` - Add option (admin)
- `DELETE /api/options/:id` - Delete option (admin)

**Voting**:
- `POST /api/votes` - Cast vote (voters, one per contest)

**Results** (Admin):
- `GET /api/contests/:contestId/results` - Get vote tallies

**Admin**:
- `GET /api/users` - List all users (admin)
- `GET /api/audit-logs` - View audit logs (admin)
- `GET /api/elections/:electionId/eligible-voters` - List eligible voters (admin)
- `POST /api/elections/:electionId/eligible-voters` - Add eligible voter (admin)

### Recent Changes
- **2025-01-26**: Fixed critical security vulnerability - registration now always creates voter accounts
- **2025-01-26**: Added admin bootstrap function to create initial admin user
- **2025-01-26**: Implemented complete voting system with authentication, elections, and vote casting
- **2025-01-26**: Created Nordic-inspired Blue Bear navigation portal

### Environment Variables (Replit Secrets)
- `ADMIN_PASSWORD` - **REQUIRED** - Initial admin password (minimum 8 characters)
- `SESSION_SECRET` - Session encryption key (auto-generated if not set)
- `ADMIN_EMAIL` - Initial admin email (default: admin@blueballot.com)
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 5000)

### Security Notes
**Session Storage**: The current implementation uses in-memory sessions (MemoryStore). This is suitable for development but NOT for production:
- Sessions are lost on server restart
- Not suitable for multi-process deployments
- Memory leaks under high load

For production, you should:
1. Use a persistent session store (Redis, PostgreSQL, etc.)
2. Configure SESSION_SECRET to a strong random value
3. Enable HTTPS and set `secure: true` on cookies
4. Consider implementing rate limiting on auth endpoints
