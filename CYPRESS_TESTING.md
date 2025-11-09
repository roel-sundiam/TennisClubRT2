# Cypress E2E Testing Guide

This document provides comprehensive guidance for running and writing Cypress end-to-end tests for the Tennis Club RT2 application.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Running Tests](#running-tests)
4. [Test Database Setup](#test-database-setup)
5. [Test Structure](#test-structure)
6. [Writing Tests](#writing-tests)
7. [Custom Commands](#custom-commands)
8. [Test Fixtures](#test-fixtures)
9. [Troubleshooting](#troubleshooting)

## Overview

Cypress is configured to test critical user flows in the Tennis Club RT2 application:

- **Authentication**: Login, logout, session persistence
- **Authorization**: Role-based access control (member, admin, superadmin)
- **Court Reservations**: Creating, viewing, canceling reservations
- **Payments**: Payment processing, history, admin management
- **Coin System**: Balance viewing, purchasing, transactions, admin approval

## Installation

Cypress is already installed in the frontend directory. If you need to reinstall:

```bash
cd frontend
npm install --save-dev cypress
```

## Running Tests

### Option 1: Interactive Mode (Recommended for Development)

Open Cypress Test Runner with a graphical interface:

```bash
# From root directory
npm run e2e

# Or from frontend directory
cd frontend
npm run cypress:open
```

This opens the Cypress Test Runner where you can:
- Select which tests to run
- Watch tests execute in real-time
- Debug failed tests
- See detailed logs

### Option 2: Headless Mode (For CI/CD)

Run all tests in headless mode (no GUI):

```bash
# From root directory
npm run e2e:headless

# Or from frontend directory
cd frontend
npm run cypress:run
```

### Option 3: Specific Test File

Run a single test spec:

```bash
cd frontend
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

## Test Database Setup

### Important: Using Test Database

The tests use a separate MongoDB database named `TennisClubRT2_Test` to avoid polluting production/development data.

### Backend Configuration

The backend automatically switches to the test database when `NODE_ENV=test`:

```typescript
// backend/src/config/database.ts
if (process.env.NODE_ENV === 'test') {
  mongoUri = mongoUri.replace(/\/[^/?]+(\?|$)/, '/TennisClubRT2_Test$1');
}
```

### Starting Backend in Test Mode

```bash
# Set environment variable and start backend
cd backend
NODE_ENV=test npm run dev
```

Or from root:

```bash
npm run dev:test
```

### Test Data Seeding

The backend provides endpoints for test data management:

**Seed Test Data** (Creates test users):
```bash
POST http://localhost:3000/api/test/seed
```

**Cleanup Test Data** (Removes reservations, payments, etc.):
```bash
DELETE http://localhost:3000/api/test/cleanup
```

**Health Check**:
```bash
GET http://localhost:3000/api/test/health
```

**Note**: These endpoints only work when `NODE_ENV=test` and return 403 otherwise.

### Test User Credentials

The following test accounts are available:

| Username      | Password   | Role        | Coin Balance | Purpose                              |
|---------------|------------|-------------|--------------|--------------------------------------|
| superadmin    | admin123   | superadmin  | 1000         | Full system access                   |
| admin         | admin123   | admin       | 500          | Administrative functions             |
| RoelSundiam   | RT2Tennis  | member      | 0            | Test low balance warnings            |
| testmember    | pass123    | member      | 100          | Regular member testing               |

## Test Structure

### Directory Layout

```
frontend/
├── cypress/
│   ├── e2e/                    # Test specs
│   │   ├── auth.cy.ts          # Authentication tests
│   │   ├── authorization.cy.ts # Role-based access tests
│   │   ├── reservations.cy.ts  # Court reservation tests
│   │   ├── payments.cy.ts      # Payment system tests
│   │   └── coins.cy.ts         # Coin economy tests
│   ├── fixtures/               # Test data
│   │   ├── credentials.json    # User credentials
│   │   └── test-data.json      # Reservation/payment data
│   ├── support/                # Helper files
│   │   ├── commands.ts         # Custom Cypress commands
│   │   └── e2e.ts             # Global configuration
│   └── tsconfig.json           # TypeScript config for tests
├── cypress.config.ts           # Cypress configuration
└── package.json
```

### Test Spec Organization

Each test file follows this pattern:

```typescript
describe('Feature Name', () => {
  let credentials: any;

  before(() => {
    // Load fixtures once before all tests
    cy.fixture('credentials').then((creds) => {
      credentials = creds;
    });
  });

  beforeEach(() => {
    // Setup before each test
    cy.login(credentials.member.username, credentials.member.password);
    cy.visit('/feature-page');
  });

  describe('Sub-feature', () => {
    it('should perform specific action', () => {
      // Test assertions
    });
  });
});
```

## Writing Tests

### Basic Test Example

```typescript
it('should display login form', () => {
  cy.visit('/login');
  cy.get('input[name="username"]').should('be.visible');
  cy.get('input[name="password"]').should('be.visible');
  cy.contains('button', 'Login').should('be.visible');
});
```

### Using Custom Commands

```typescript
it('should login successfully', () => {
  // Login via API (faster than UI)
  cy.login('testmember', 'pass123');

  // Navigate to page
  cy.visit('/dashboard');

  // Verify authentication
  cy.isAuthenticated().should('be.true');
});
```

### API Testing

```typescript
it('should reject unauthorized API calls', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/admin/members`,
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.equal(401);
  });
});
```

### Waiting for Network Requests

```typescript
it('should create reservation', () => {
  cy.intercept('POST', '/api/reservations').as('createReservation');

  // Fill form and submit
  cy.get('input[type="date"]').type('2025-12-15');
  cy.contains('button', 'Book').click();

  // Wait for API call
  cy.wait('@createReservation').its('response.statusCode').should('eq', 201);
});
```

## Custom Commands

### Available Commands

#### `cy.login(username, password)`
Logs in user via API and stores JWT token.

```typescript
cy.login('testmember', 'pass123');
```

#### `cy.logout()`
Clears authentication data.

```typescript
cy.logout();
```

#### `cy.seedTestData()`
Seeds test database with initial data.

```typescript
cy.seedTestData();
```

#### `cy.cleanupTestData()`
Removes test data from database.

```typescript
cy.cleanupTestData();
```

#### `cy.getAuthToken()`
Returns current JWT token from localStorage.

```typescript
cy.getAuthToken().should('not.be.null');
```

#### `cy.isAuthenticated()`
Checks if user is currently authenticated.

```typescript
cy.isAuthenticated().should('be.true');
```

### Creating Custom Commands

Add to `cypress/support/commands.ts`:

```typescript
Cypress.Commands.add('customCommand', (arg1, arg2) => {
  // Implementation
});
```

Add TypeScript types to `cypress/support/e2e.ts`:

```typescript
declare global {
  namespace Cypress {
    interface Chainable {
      customCommand(arg1: string, arg2: number): Chainable<void>;
    }
  }
}
```

## Test Fixtures

### Credentials (`cypress/fixtures/credentials.json`)

Contains test user credentials:

```json
{
  "superadmin": {
    "username": "superadmin",
    "password": "admin123",
    "role": "superadmin"
  }
}
```

### Test Data (`cypress/fixtures/test-data.json`)

Contains test data for reservations, payments, etc.:

```json
{
  "reservations": {
    "peakHour": {
      "timeSlot": 18,
      "baseFee": 150
    }
  }
}
```

### Loading Fixtures

```typescript
before(() => {
  cy.fixture('credentials').then((data) => {
    credentials = data;
  });
});
```

## Troubleshooting

### Tests Failing with 401 Unauthorized

**Issue**: Authentication not working

**Solution**:
- Ensure backend is running on port 3000
- Check that test users exist in database
- Run `cy.seedTestData()` to create test users

### Database Connection Errors

**Issue**: Tests can't connect to MongoDB

**Solution**:
- Verify `MONGODB_URI` in backend `.env`
- Ensure MongoDB Atlas allows connections from your IP
- Check that `NODE_ENV=test` is set

### CORS Errors

**Issue**: API calls blocked by CORS

**Solution**:
- Verify frontend is running on port 4200
- Check backend CORS configuration includes `http://localhost:4200`
- Add `chromeWebSecurity: false` to `cypress.config.ts` (already configured)

### Flaky Tests

**Issue**: Tests pass sometimes, fail other times

**Solution**:
- Add explicit waits: `cy.wait(1000)`
- Wait for network requests: `cy.intercept()` and `cy.wait('@alias')`
- Increase timeout: `cy.get('selector', { timeout: 10000 })`
- Enable retries in `cypress.config.ts` (already configured)

### Test Data Pollution

**Issue**: Previous test data affects current tests

**Solution**:
- Run `cy.cleanupTestData()` in `beforeEach`
- Use unique data for each test
- Reset coin balances between tests

### Selector Not Found

**Issue**: `cy.get()` can't find element

**Solution**:
- Check if element exists in current Angular version
- Use `cy.contains()` for text-based selection
- Add `data-testid` attributes to elements
- Use `.should('be.visible')` before interacting

### WebSocket Connection Issues

**Issue**: Real-time features not working in tests

**Solution**:
- Mock WebSocket connections
- Disable real-time features during tests
- Use `cy.intercept()` to stub Socket.IO calls

## Best Practices

1. **Keep tests independent**: Each test should work in isolation
2. **Use API for setup**: Login via `cy.login()` instead of UI
3. **Clean up after tests**: Reset database state
4. **Use fixtures**: Centralize test data
5. **Add data-testid**: Make selectors more stable
6. **Wait for API**: Use `cy.intercept()` and `cy.wait()`
7. **Test critical paths**: Focus on most important flows
8. **Keep tests fast**: Avoid unnecessary waits
9. **Use descriptive names**: Clear test descriptions
10. **Group related tests**: Use `describe()` blocks

## Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm run install:all
      - name: Start backend in test mode
        run: NODE_ENV=test npm run dev:backend &
      - name: Start frontend
        run: npm run dev:frontend &
      - name: Wait for services
        run: sleep 30
      - name: Run Cypress tests
        run: npm run e2e:headless
```

## Additional Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress TypeScript Support](https://docs.cypress.io/guides/tooling/typescript-support)
- [Angular Testing with Cypress](https://docs.cypress.io/guides/component-testing/angular/overview)

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review Cypress logs in the Test Runner
3. Check browser console for errors
4. Verify backend logs for API errors
5. Ensure test database is properly configured
