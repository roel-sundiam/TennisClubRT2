# Testing Guide - Frontend

This guide covers testing for the Tennis Club RT2 frontend application.

## Test Types

### 1. Unit Tests (Jasmine/Karma)

Run Angular component and service unit tests:

```bash
npm run test
```

**Configuration**: `karma.conf.js` and `tsconfig.spec.json`

**Test Files**: `*.spec.ts` files alongside components

### 2. E2E Tests (Cypress)

Run end-to-end tests covering complete user workflows:

```bash
# Interactive mode (recommended for development)
npm run cypress:open
npm run e2e

# Headless mode (for CI/CD)
npm run cypress:run
npm run e2e:headless
```

**Configuration**: `cypress.config.ts`

**Test Files**: `cypress/e2e/*.cy.ts`

## Cypress E2E Testing

### Prerequisites

1. **Backend running**: Start backend server
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend running**: Start Angular dev server
   ```bash
   cd frontend
   npm run start
   # or
   ng serve
   ```

3. **Test database**: For isolated testing, use test database
   ```bash
   cd backend
   NODE_ENV=test npm run dev
   ```

### Running Tests

**Interactive Mode** (Watch tests run in browser):
```bash
npm run cypress:open
```

**Headless Mode** (Command line only):
```bash
npm run cypress:run
```

**Specific Test**:
```bash
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

### Test Specs

- `auth.cy.ts` - Login, logout, session management
- `authorization.cy.ts` - Role-based access control
- `reservations.cy.ts` - Court booking workflows
- `payments.cy.ts` - Payment processing
- `coins.cy.ts` - Coin economy system

### Custom Commands

Cypress custom commands for common operations:

```typescript
// Login via API (faster than UI)
cy.login('username', 'password');

// Logout
cy.logout();

// Check authentication
cy.isAuthenticated().should('be.true');

// Get JWT token
cy.getAuthToken().should('not.be.null');

// Seed/cleanup test data
cy.seedTestData();
cy.cleanupTestData();
```

### Test Fixtures

Test data is stored in `cypress/fixtures/`:

- `credentials.json` - Test user credentials
- `test-data.json` - Reservation and payment data

Load fixtures in tests:

```typescript
before(() => {
  cy.fixture('credentials').then((creds) => {
    credentials = creds;
  });
});
```

### Test Database

E2E tests use `TennisClubRT2_Test` database:

- Automatically used when `NODE_ENV=test`
- Keeps test data separate from development
- Reset between test runs for consistency

**Test Users**:
- `superadmin` / `admin123` (superadmin)
- `admin` / `admin123` (admin)
- `RoelSundiam` / `RT2Tennis` (member, 0 coins)
- `testmember` / `pass123` (member, 100 coins)

## Debugging Tests

### Cypress Interactive Mode

1. Open Cypress Test Runner: `npm run cypress:open`
2. Click on test spec to run
3. Use Chrome DevTools to debug
4. See live DOM updates and snapshots

### Common Issues

**Tests fail with "cy.login is not a function"**
- Solution: Ensure `cypress/support/e2e.ts` is loaded
- Check TypeScript declarations in support files

**Authentication errors**
- Solution: Verify backend is running on port 3000
- Check test users exist (run seed endpoint)

**Element not found**
- Solution: Add explicit waits or use `{ timeout: 10000 }`
- Check Angular routing and component rendering

**CORS errors**
- Solution: Verify `chromeWebSecurity: false` in config
- Check backend CORS allows `localhost:4200`

## Best Practices

1. **Keep tests independent** - Each test should work in isolation
2. **Use custom commands** - Leverage `cy.login()` instead of UI login
3. **Wait for API calls** - Use `cy.intercept()` and `cy.wait()`
4. **Clean up test data** - Reset state between tests
5. **Use fixtures** - Centralize test data
6. **Add data-testid** - Make selectors stable and maintainable
7. **Test critical paths first** - Focus on most important workflows

## Documentation

For comprehensive testing documentation:

- **Cypress Guide**: `/CYPRESS_TESTING.md`
- **Test Credentials**: `/TEST_CREDENTIALS.md`
- **Project Guide**: `/CLAUDE.md`

## CI/CD Integration

Cypress tests can run in continuous integration:

```yaml
# Example GitHub Actions
- name: Run E2E tests
  run: |
    npm run dev:backend &
    npm run dev:frontend &
    sleep 30
    npm run e2e:headless
```

## Getting Help

- Check `CYPRESS_TESTING.md` for troubleshooting
- Review Cypress documentation: https://docs.cypress.io
- Check test logs in Cypress Test Runner
- Verify backend logs for API errors
