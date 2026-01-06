# Blue Bear Landing Hub

## Overview

Blue Bear is a Nordic-inspired navigation portal serving as a central hub to access multiple business applications. The primary application is Blue Ballot - a democratic voting platform with secure authentication, role-based access control, election management, and audit logging. The portal links to various sub-applications including Blue Finance, Bear Hope, Blue Farms, Blue Energies, Blue Health, and Bear Market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Design System**: Nordic-inspired theme with custom CSS variables for light/dark modes
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Session Management**: express-session with cookie-based authentication
- **Password Hashing**: bcrypt (10 rounds)
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines users, elections, contests, options, votes, audit logs
- **Migrations**: Drizzle Kit for schema push (`db:push` script)

### Authentication & Authorization
- **Admin Bootstrap**: Requires `ADMIN_PASSWORD` environment variable on first run
- **Role System**: Two roles - "admin" and "voter"
- **Session Cookies**: HttpOnly, secure in production, 1-week expiry
- **Protected Routes**: Middleware checks for authentication and admin role

### AI Integrations
- **Chat**: OpenAI-powered conversational AI with streaming responses
- **Image Generation**: gpt-image-1 model for image generation/editing
- **Batch Processing**: Rate-limited concurrent processing with automatic retries
- Location: `server/replit_integrations/` contains chat, image, batch, and automation modules

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including shadcn/ui
    pages/        # Route components (Home, Login, Admin, Voter dashboards)
    lib/          # Utilities, auth context, query client
server/           # Express backend
  replit_integrations/  # AI feature modules
shared/           # Shared types and database schema
```

## External Dependencies

### Database
- PostgreSQL (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database operations
- drizzle-zod for schema validation

### AI Services
- OpenAI API via Replit AI Integrations
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_PASSWORD` - Required for admin account bootstrap (minimum 8 characters)
- `ADMIN_EMAIL` - Optional, defaults to admin@blueballot.com
- `SESSION_SECRET` - For session encryption (has fallback for development)

### Key NPM Dependencies
- Frontend: React, TanStack Query, wouter, tailwindcss, radix-ui components
- Backend: Express, express-session, bcrypt, drizzle-orm
- AI: openai, p-limit, p-retry for batch processing
- Validation: zod, drizzle-zod