/// <reference types="cypress" />

/**
 * Custom Cypress Commands for Tennis Club RT2 Testing
 */

const API_URL = Cypress.env('apiUrl') || 'http://localhost:3000/api';

/**
 * Login command - Authenticates user and stores JWT token
 */
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.log(`Logging in as: ${username}`);

  cy.request({
    method: 'POST',
    url: `${API_URL}/auth/login`,
    body: {
      username,
      password
    },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 && response.body.success) {
      const { token, user } = response.body.data;

      // Store token and user in localStorage (matching AuthService behavior)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      cy.log('Login successful', user.role);
    } else {
      cy.log('Login failed', response.body.message || 'Unknown error');
      throw new Error(`Login failed: ${response.body.message || 'Unknown error'}`);
    }
  });
});

/**
 * Logout command - Clears authentication data
 */
Cypress.Commands.add('logout', () => {
  cy.log('Logging out');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  cy.clearCookies();
});

/**
 * Seed test database with initial data
 */
Cypress.Commands.add('seedTestData', () => {
  cy.log('Seeding test database');

  cy.request({
    method: 'POST',
    url: `${API_URL}/test/seed`,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('Test data seeded successfully');
    } else {
      cy.log('Warning: Seed endpoint may not exist yet', response.status);
    }
  });
});

/**
 * Cleanup test database
 */
Cypress.Commands.add('cleanupTestData', () => {
  cy.log('Cleaning up test database');

  cy.request({
    method: 'DELETE',
    url: `${API_URL}/test/cleanup`,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('Test data cleaned up successfully');
    } else {
      cy.log('Warning: Cleanup endpoint may not exist yet', response.status);
    }
  });
});

/**
 * Get authentication token from localStorage
 */
Cypress.Commands.add('getAuthToken', () => {
  return cy.window().then((window) => {
    return window.localStorage.getItem('token');
  });
});

/**
 * Check if user is currently authenticated
 */
Cypress.Commands.add('isAuthenticated', () => {
  return cy.window().then((window) => {
    const token = window.localStorage.getItem('token');
    const user = window.localStorage.getItem('user');
    return !!(token && user);
  });
});

// Add more custom commands as needed
// Example: cy.createReservation(courtId, date, timeSlot)
// Example: cy.makePayment(reservationId, amount)
