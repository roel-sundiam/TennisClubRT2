import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4801',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false, // Disable to prevent CORS issues during testing

    // Test environment configuration
    env: {
      apiUrl: 'http://localhost:3000/api',
      testDatabase: 'TennisClubRT2_Test'
    },

    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 60000,

    // Retry configuration for flaky tests
    retries: {
      runMode: 2,
      openMode: 0
    },

    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
  },
});
