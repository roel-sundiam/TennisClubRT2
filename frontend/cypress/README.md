# Cypress Tests

This directory contains end-to-end (E2E) tests for the Tennis Club RT2 application.

## Quick Start

```bash
# Open Cypress Test Runner (interactive)
npm run cypress:open

# Run all tests headless
npm run cypress:run

# Run specific test
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

## Directory Structure

```
cypress/
├── e2e/              # Test specifications
│   ├── auth.cy.ts           # Authentication tests
│   ├── authorization.cy.ts  # Role-based access control
│   ├── reservations.cy.ts   # Court reservations
│   ├── payments.cy.ts       # Payment system
│   └── coins.cy.ts          # Coin economy
├── fixtures/         # Test data
│   ├── credentials.json     # User credentials
│   └── test-data.json       # Reservation/payment data
└── support/          # Helper files
    ├── commands.ts          # Custom commands
    └── e2e.ts              # Global config
```

## Test Coverage

- ✅ **Authentication**: Login, logout, session persistence
- ✅ **Authorization**: Member, admin, superadmin access control
- ✅ **Reservations**: Create, view, cancel reservations
- ✅ **Payments**: Payment processing, history, admin management
- ✅ **Coins**: Balance, purchases, transactions, admin approval

## Custom Commands

- `cy.login(username, password)` - Login via API
- `cy.logout()` - Clear authentication
- `cy.seedTestData()` - Seed test database
- `cy.cleanupTestData()` - Clean up test data
- `cy.getAuthToken()` - Get JWT token
- `cy.isAuthenticated()` - Check auth status

## Test Database

Tests use `TennisClubRT2_Test` database. See `CYPRESS_TESTING.md` for setup.

## Documentation

For comprehensive documentation, see:
- **Main Guide**: `/CYPRESS_TESTING.md`
- **Test Credentials**: `/TEST_CREDENTIALS.md`
- **Project Setup**: `/CLAUDE.md`
