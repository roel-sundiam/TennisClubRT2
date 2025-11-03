// ***********************************************************
// This support file is loaded before all test files
// Import commands, custom commands, and global configuration
// ***********************************************************

// Import commands
import './commands';

// Prevent TypeScript errors for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with username and password
       * @example cy.login('RoelSundiam', 'RT2Tennis')
       */
      login(username: string, password: string): Chainable<void>;

      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>;

      /**
       * Custom command to seed test database with initial data
       * @example cy.seedTestData()
       */
      seedTestData(): Chainable<void>;

      /**
       * Custom command to cleanup test database
       * @example cy.cleanupTestData()
       */
      cleanupTestData(): Chainable<void>;

      /**
       * Custom command to get auth token from localStorage
       * @example cy.getAuthToken()
       */
      getAuthToken(): Chainable<string | null>;

      /**
       * Custom command to check if user is authenticated
       * @example cy.isAuthenticated()
       */
      isAuthenticated(): Chainable<boolean>;
    }
  }
}

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing tests on uncaught exceptions
  // This is useful for handling Angular zone.js errors
  console.error('Uncaught exception:', err);

  // Return false to prevent the error from failing the test
  // Customize this based on your needs
  if (err.message.includes('ResizeObserver') ||
      err.message.includes('zone.js')) {
    return false;
  }

  // Allow other errors to fail the test
  return true;
});

// Before each test
beforeEach(() => {
  // Clear localStorage and sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();
});
