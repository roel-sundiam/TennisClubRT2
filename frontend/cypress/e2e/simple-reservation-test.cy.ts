/// <reference types="cypress" />

/**
 * Simple test to debug the reservation form
 */

describe('Simple Reservation Test - Debug', () => {
  let credentials: any;

  before(() => {
    cy.fixture('credentials').then((creds) => {
      credentials = creds;
    });
  });

  it('should navigate to reservations and interact with form', () => {
    // Login
    cy.login(credentials.member.username, credentials.member.password);

    // Visit reservations
    cy.visit('/reservations');
    cy.wait(2000);

    // Take screenshot of initial page
    cy.screenshot('01-initial-page');

    // Select date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];

    cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
    cy.wait(3000);

    // Take screenshot after date selection
    cy.screenshot('02-after-date-selection');

    // Check what elements are on the page
    cy.get('body', { timeout: 5000 }).should('exist').then(($body) => {
      if ($body.find('.time-btn').length > 0) {
        cy.log('✅ Time buttons found!');
        cy.get('.time-btn').its('length').then(count => {
          cy.log(`Found ${count} time buttons`);
        });

        // Click START time button (10:00 AM)
        cy.get('.time-btn').contains('10:00').click();
        cy.wait(2000); // Wait for end times to load
        cy.screenshot('03-after-start-time');

        // Scroll down to see end time section
        cy.scrollTo('bottom');
        cy.wait(500);

        // Now click END time button - target the end time section specifically
        cy.contains('h4', 'End Time').should('be.visible'); // Verify end time section appeared
        cy.contains('h4', 'End Time').parent().within(() => {
          // Within the end time section, click 11:00
          cy.get('.time-btn').contains('11:00').click();
        });
        cy.wait(3000); // Wait for fee calculation

        // Check Angular component state via browser console
        cy.window().then((win) => {
          // Access Angular component through debugging
          const angularComp = (win as any).ng?.getComponent?.(win.document.querySelector('app-reservations'));
          if (angularComp) {
            cy.log('Component state:', {
              selectedStartTime: angularComp.selectedStartTime,
              selectedEndTime: angularComp.selectedEndTime,
              calculatedFee: angularComp.calculatedFee
            });
          } else {
            cy.log('Could not access Angular component');
          }
        });

        // Scroll down to see if fee info is below
        cy.scrollTo('bottom');
        cy.wait(500);
        cy.screenshot('04-after-end-time');

        // Log the entire page HTML to console
        cy.get('body').then($body => {
          const html = $body.html();
          cy.log('Page contains "fee":', html.includes('fee'));
          cy.log('Page contains "Fee":', html.includes('Fee'));
          cy.log('Page contains "total":', html.includes('total'));
        });

        // Check for fee info with different possible selectors
        cy.log('Checking for fee-info...');
        if ($body.find('.fee-info').length > 0) {
          cy.log('✅ .fee-info found!');
        } else if ($body.find('[class*="fee"]').length > 0) {
          cy.log('⚠️ Found elements with "fee" in class, but not .fee-info');
          cy.get('[class*="fee"]', { timeout: 5000 }).first().invoke('attr', 'class').then(className => {
            cy.log(`First fee element class: ${className}`);
          });
        } else {
          cy.log('❌ No fee elements found');
        }

        // Try to find any element containing "₱" (peso sign)
        cy.get('body').then($b => {
          const pesoText = $b.text();
          if (pesoText.includes('₱')) {
            cy.log('✅ Found peso sign (₱) in page text');
          } else {
            cy.log('❌ No peso sign found');
          }
        });
      } else {
        cy.log('❌ No time buttons found');
      }
    });

    // Take final screenshot
    cy.screenshot('05-final-state');
  });
});
