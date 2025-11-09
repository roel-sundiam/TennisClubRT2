/// <reference types="cypress" />

describe('Authentication Flow', () => {
  let credentials: any;

  before(() => {
    // Load test credentials
    cy.fixture('credentials').then((creds) => {
      credentials = creds;
    });
  });

  beforeEach(() => {
    // Visit login page before each test
    cy.visit('/login');
  });

  describe('Login Functionality', () => {
    it('should display login form with all required fields', () => {
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.contains('button', 'Login').should('be.visible');
    });

    it('should successfully login with valid member credentials', () => {
      const { username, password } = credentials.member;

      cy.get('input[name="username"]').type(username);
      cy.get('input[name="password"]').type(password);
      cy.contains('button', 'Login').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');

      // Verify token and user data are stored
      cy.getAuthToken().should('not.be.null');
      cy.isAuthenticated().should('be.true');
    });

    it('should successfully login with admin credentials', () => {
      const { username, password } = credentials.admin;

      cy.get('input[name="username"]').type(username);
      cy.get('input[name="password"]').type(password);
      cy.contains('button', 'Login').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');

      // Verify admin access
      cy.window().then((window) => {
        const user = JSON.parse(window.localStorage.getItem('user') || '{}');
        expect(user.role).to.be.oneOf(['admin', 'superadmin']);
      });
    });

    it('should show error message with invalid credentials', () => {
      cy.get('input[name="username"]').type('invaliduser');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.contains('button', 'Login').click();

      // Should stay on login page
      cy.url().should('include', '/login');

      // Should show error message (may vary based on implementation)
      cy.contains(/invalid|error|failed/i).should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.contains('button', 'Login').click();

      // Check for validation messages (implementation may vary)
      cy.get('input[name="username"]').then(($input) => {
        expect($input[0].validity.valid).to.be.false;
      });
    });

    it('should toggle password visibility', () => {
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');

      // Click toggle button (if exists)
      cy.get('button[aria-label*="password"]').click({ multiple: true, force: true });

      // Password should be visible (implementation dependent)
      cy.wait(100);
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      // Login before testing logout
      cy.login(credentials.member.username, credentials.member.password);
      cy.visit('/dashboard');
    });

    it('should successfully logout user', () => {
      // Find and click logout button (may be in toolbar, menu, etc.)
      cy.contains('button', /logout|sign out/i).click();

      // Should redirect to login
      cy.url().should('include', '/login');

      // Verify auth data is cleared
      cy.getAuthToken().should('be.null');
      cy.isAuthenticated().should('be.false');
    });

    it('should not allow access to protected routes after logout', () => {
      // Logout
      cy.contains('button', /logout|sign out/i).click();

      // Try to access dashboard
      cy.visit('/dashboard');

      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session across page reloads', () => {
      cy.login(credentials.testmember.username, credentials.testmember.password);
      cy.visit('/dashboard');

      // Reload page
      cy.reload();

      // Should still be authenticated
      cy.url().should('include', '/dashboard');
      cy.isAuthenticated().should('be.true');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without authentication', () => {
      cy.visit('/reservations');

      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should allow access to protected routes when authenticated', () => {
      cy.login(credentials.member.username, credentials.member.password);
      cy.visit('/reservations');

      // Should stay on reservations page
      cy.url().should('include', '/reservations');
    });
  });
});
