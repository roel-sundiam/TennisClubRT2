# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design System

📋 **IMPORTANT**: See `DESIGN_SYSTEM.md` for comprehensive UI/UX guidelines, component standards, and design patterns. The modern toolbar is ALWAYS visible across all pages.

## Development Commands

### Starting Development Environment

```bash
# Start both frontend and backend concurrently
npm run dev

# Individual services
cd backend && npm run dev     # Express.js server on :3000
cd frontend && ng serve       # Angular dev server on :4200

# Alternative frontend port for testing
cd frontend && ng serve --port 4201
```

### Backend Commands

```bash
cd backend
npm run build                 # TypeScript compilation
npm run start                # Production server
npm run create-superadmin    # Create initial admin user
npm run import-members       # Import existing member data
npm run test                 # Run backend tests
```

### Frontend Commands

```bash
cd frontend
ng build                     # Production build
ng build --configuration=development  # Development build
ng test                      # Unit tests
ng lint                      # Code linting
```

### Database Operations

```bash
# From backend directory
npm run create-superadmin    # Creates admin with credentials in console
npm run import-members       # Imports members from Excel/CSV data
```

## Architecture Overview

### Technology Stack

- **Frontend**: Angular 20.x with standalone components, Angular Material, PWA capabilities
- **Backend**: Express.js with TypeScript, MongoDB with Mongoose
- **Authentication**: JWT-based with role-based access control (member/admin/superadmin)
- **Database**: MongoDB Atlas with optimized compound indexes

### Key Business Logic

#### User Roles & Approval System

```typescript
// Three-tier role system
role: 'member' | 'admin' | 'superadmin'

// Multi-step approval process
pending registration → admin approval → membership fee payment → active member
```

#### Court Reservation System

- **Operating Hours**: 5 AM - 10 PM (timeSlot: 5-22)
- **Peak Hours**: 5AM, 6PM, 7PM, 9PM (₱100 fixed)
- **Off-Peak**: ₱20 per player
- **Conflict Prevention**: Unique compound index on (date, timeSlot) for active reservations

#### Coin Economy

- New users receive 100 coins
- Page visits consume coins (configurable rate)
- Admins can award/deduct coins with audit trail

### API Structure

Base URL: `http://localhost:3000/api`

#### Authentication Flow

1. `POST /auth/register` - Creates pending user
2. Admin approves via member management
3. `POST /auth/login` - Returns JWT + user data
4. JWT required for all protected endpoints

#### Key Endpoints

```
/reservations     # Court booking CRUD
/payments        # Payment processing
/coins           # Coin transactions
/weather         # Weather API integration
/members         # Admin: member management
/polls           # Polling system
/reports         # Admin: analytics
```

### Database Schema Patterns

#### Core Models with Business Rules

```typescript
// User with approval workflow
User: { isApproved: boolean, membershipFeesPaid: boolean, coinBalance: number }

// Reservation with pricing logic
Reservation: {
  date: Date,
  timeSlot: number,
  totalFee: number, // Auto-calculated in pre-save
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

// Financial audit trail
CoinTransaction: {
  balanceBefore: number,
  balanceAfter: number,
  type: 'earned' | 'spent' | 'purchased' | 'refunded' | 'bonus' | 'penalty'
}
```

#### Critical Indexes

- `Reservation: { date: 1, timeSlot: 1 }` (unique for active reservations)
- `User: { username: 1 }`, `{ email: 1 }` (unique)
- `CoinTransaction: { userId: 1, createdAt: -1 }` (transaction history)

### Frontend Architecture

#### Standalone Component Pattern

All components use Angular's standalone architecture with direct imports:

```typescript
@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule, ReactiveFormsModule],
  // ...
})
```

#### Route Guards

- `authGuard`: Requires valid JWT
- `loginGuard`: Redirects authenticated users away from login
- `adminGuard`: Requires admin/superadmin role

#### Services Architecture

- `AuthService`: JWT management, user state with BehaviorSubjects
- Component-level HTTP calls to backend API
- LocalStorage for token/user persistence with validation

### Environment Configuration

#### Required Environment Variables

```bash
# Backend (.env)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
WEATHER_API_KEY=openweather-api-key
PORT=3000

# Pricing configuration
PEAK_HOURS=5,18,19,21
PEAK_HOUR_FEE=100
OFF_PEAK_FEE_PER_MEMBER=20

# Coin system
INITIAL_COIN_BALANCE=100
COIN_RATE_PER_PAGE=1

# Rate limiting (production only)
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=500    # Max requests per window
```

#### Weather Integration

- OpenWeather API for Delapaz Norte, San Fernando, Pampanga
- Coordinates: lat=15.087, lon=120.6285
- Weather data attached to reservations

### Development Patterns

#### Testing Strategy

- Backend: Jest unit tests for business logic
- Frontend: Angular testing utilities
- **Test Credentials:** See `TEST_CREDENTIALS.md` for complete list of test accounts
- **Primary Test User:** RoelSundiam/RT2Tennis (member)
- **Admin Access:** superadmin/admin123 (superadmin)

#### Database Seeding

Use provided scripts for initial data:

```bash
npm run create-superadmin  # Creates admin user
npm run import-members     # Loads member data
```

#### Senior-Friendly Design Requirements

- Large fonts (minimum 16px)
- High contrast colors
- Simple navigation patterns
- Touch-friendly button sizes (min 48px)
- Clear error messages

### Security Implementation

#### Multi-Layer Validation

1. Frontend: Angular reactive forms with validators
2. Backend: express-validator middleware
3. Database: Mongoose schema validation
4. Business Rules: Custom validation in pre-save hooks

#### Authentication Middleware

```typescript
// Applied to all protected routes
requireApprovedUser; // Checks JWT + approval status
requireMembershipFees; // Validates membership payment
requireAdmin; // Role-based access control
```

#### Rate Limiting

- **Development**: Rate limiting disabled for local development
- **Production**: 500 requests per 15-minute window per IP
- **Health Endpoints**: `/health` and `/api/health` are included in rate limiting
- **Error Message**: "Too many requests from this IP, please try again later."

### Common Development Workflows

#### Git Workflow

**IMPORTANT**: Claude can handle `git add`, `git commit`, and `git push` operations when requested by the user.

- **Trigger phrase**: When you say **"go git"**, I will automatically handle all git operations (add, commit, push)

#### Adding New Features

1. Define TypeScript interfaces in `/backend/src/types/`
2. Create Mongoose model with validation
3. Implement controller with business logic
4. Add routes with appropriate middleware
5. Create Angular service for API calls
6. Build component with Material Design
7. Add route guards as needed

#### Debugging Tips

- Backend logs all HTTP requests with emojis (📥 📤)
- Frontend auth state logged in AuthService
- MongoDB connection status logged on startup
- All API errors return structured format: `{ success: boolean, message: string, data?: any }`

#### Common Issues

- CORS: Add frontend port to backend CORS configuration
- Authentication: Check localStorage for malformed user data
- Database: Verify MongoDB Atlas IP whitelist for development
- Time Zones: All dates stored in UTC, displayed in local time
