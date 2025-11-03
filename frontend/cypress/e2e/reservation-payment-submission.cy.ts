/// <reference types="cypress" />

/**
 * Court Reservation - Payment and Submission Tests
 * Tests that verify payment records are correctly created in the database
 * when reservations are submitted with different player configurations
 */

describe('Court Reservation - Payment Submission & Database Verification', () => {
  let credentials: any;

  before(() => {
    cy.fixture('credentials').then((creds) => {
      credentials = creds;
    });
  });

  beforeEach(() => {
    // Login as RoelSundiam
    cy.login(credentials.member.username, credentials.member.password);
    cy.visit('/reservations');
    cy.wait(3000); // Wait longer for page to load

    // Ensure the date input is visible before proceeding
    cy.get('input[id="date"]', { timeout: 10000 }).should('be.visible');
  });

  // Helper function to select start and end times correctly
  const selectTimes = (startTime: string, endTime: string) => {
    // Wait for time buttons to be available and select start time
    cy.get('.time-btn', { timeout: 10000 }).should('have.length.greaterThan', 0);

    // Store reference to start time button to avoid re-query during Angular re-render
    cy.get('.time-btn').contains(startTime).as('startTimeBtn');
    cy.get('@startTimeBtn').should('be.visible');
    cy.get('@startTimeBtn').click({ force: true }); // Use force to avoid re-render issues
    cy.wait(3000); // Wait longer for end times to load

    // Scroll down to see end time section (important!)
    cy.scrollTo('bottom');
    cy.wait(1500);

    // Select end time from End Time section specifically
    cy.get('h4').then($headings => {
      const endTimeHeadingExists = Array.from($headings).some(h => h.textContent?.includes('End Time'));

      if (endTimeHeadingExists) {
        // Found h4 with "End Time" - need to find parent container with time buttons
        cy.log('Found End Time heading, using targeted selector');
        cy.contains('h4', 'End Time').parents().filter(':has(.time-btn)').first().within(() => {
          cy.get('.time-btn').contains(endTime).as('endTimeBtn');
          cy.get('@endTimeBtn').click({ force: true });
        });
      } else {
        // Fallback: Click the last matching time button (should be in end time section)
        cy.log('⚠️ End Time heading not found, using fallback selector');
        cy.get('.time-btn').contains(endTime).last().as('endTimeBtnFallback');
        cy.get('@endTimeBtnFallback').click({ force: true });
      }
    });
    cy.wait(3000); // Wait longer for fee calculation

    // Scroll to see fee section
    cy.scrollTo('bottom');
    cy.wait(1000);
  };

  describe('Basic Submission', () => {
    it.skip('should successfully submit reservation and show confirmation', () => {
      // Reload the page to ensure fresh state
      cy.reload();
      cy.wait(3000);

      // Ensure date input is visible
      cy.get('input[id="date"]', { timeout: 10000 }).should('be.visible');

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // Select start time
      cy.get('.time-btn', { timeout: 10000 }).should('have.length.greaterThan', 0);
      cy.get('.time-btn').contains('10:00').should('be.visible').click({ force: true });
      cy.wait(3000);

      // Scroll to see end time
      cy.scrollTo('bottom');
      cy.wait(1500);

      // Select end time
      cy.contains('h4', 'End Time').should('be.visible');
      cy.contains('h4', 'End Time').parents().filter(':has(.time-btn)').first().within(() => {
        cy.get('.time-btn').contains('11:00').click({ force: true });
      });
      cy.wait(3000);

      // Scroll to see fee info
      cy.scrollTo('bottom');
      cy.wait(2000);

      // Wait for fee calculation to complete - verify fee info is visible
      cy.contains('h3', 'Fee Information', { timeout: 15000 }).should('be.visible');
      cy.contains('Total Fee').parent().should('contain', '₱100');

      // Wait a bit more for form validation
      cy.wait(1000);

      // Verify submit button is enabled
      cy.get('button[type="submit"].book-btn').should('not.be.disabled');

      // Submit reservation
      cy.get('button[type="submit"].book-btn').click();

      // Wait for success message or redirect
      cy.wait(3000);

      // Should redirect or show success
      cy.url().should('match', /\/(reservations|dashboard)/);
    });
  });

  describe('Payment Record Creation - Multiple Members', () => {
    it('should create payment records with correct split amounts for 2 members', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 8); // Different date to avoid conflicts
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // Select start time
      cy.get('.time-btn', { timeout: 10000 }).should('have.length.greaterThan', 0);
      cy.get('.time-btn').contains('10:00').should('be.visible').click({ force: true });
      cy.wait(3000);

      // Scroll to see end time
      cy.scrollTo('bottom');
      cy.wait(1500);

      // Select end time
      cy.contains('h4', 'End Time').should('be.visible');
      cy.contains('h4', 'End Time').parents().filter(':has(.time-btn)').first().within(() => {
        cy.get('.time-btn').contains('11:00').click({ force: true });
      });
      cy.wait(3000);

      // Scroll to see fee info
      cy.scrollTo('bottom');
      cy.wait(1000);

      // Wait for fee info
      cy.contains('h3', 'Fee Information', { timeout: 10000 }).should('be.visible');

      // Add second member
      cy.contains('button', '+ Add Member Player').click();
      cy.wait(1000);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-trigger').click();
      cy.wait(500);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-option').first().click();
      cy.wait(2000);

      // Scroll and verify split fee
      cy.scrollTo('bottom');
      cy.wait(500);

      // Verify total is still ₱100
      cy.contains('Total Fee').parent().should('contain', '₱100');

      // Verify each member pays ₱50
      cy.get('.player-payment-item').should('have.length', 2);
      cy.get('.player-payment-item').each(($el) => {
        cy.wrap($el).find('.player-amount').should('contain', '₱50');
      });

      // Log that we're about to submit (don't need to capture usernames)
      cy.log('Submitting reservation with 2 members, ₱50 each');

      // Submit reservation
      cy.get('button[type="submit"].book-btn').should('not.be.disabled');
      cy.get('button[type="submit"].book-btn').click();

      // Wait for success and redirect
      cy.wait(3000);
      cy.url().should('match', /\/(reservations|dashboard)/);

      // Now verify the payment records were created correctly
      // Use the member's own payments endpoint
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/payments/my`,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);

        const payments = response.body.data || response.body;

        // Find payments for this reservation (by date)
        const reservationPayments = payments.filter((p: any) => {
          const paymentDate = new Date(p.reservationId?.date || p.date).toISOString().split('T')[0];
          return paymentDate === dateString;
        });

        cy.log(`Found ${reservationPayments.length} payment(s) for logged-in user for this date`);

        // Should have at least 1 payment (the logged-in user's payment)
        expect(reservationPayments.length).to.be.at.least(1);

        // The logged-in user's payment should be ₱50
        const myPayment = reservationPayments[0];
        expect(myPayment.amount).to.eq(50);
        expect(myPayment.status).to.eq('pending');

        cy.log(`✅ Payment record verified: User pays ₱50`);
        cy.log('Note: Cannot verify other member\'s payment without admin access');
      });
    });
  });

  describe('Payment Record Creation - Members with Guests', () => {
    it('should add guest fees to reserver payment (2 members + 1 guest)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 9); // Different date to avoid conflicts
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // Select start time
      cy.get('.time-btn', { timeout: 10000 }).should('have.length.greaterThan', 0);
      cy.get('.time-btn').contains('10:00').should('be.visible').click({ force: true });
      cy.wait(3000);

      // Scroll to see end time
      cy.scrollTo('bottom');
      cy.wait(1500);

      // Select end time
      cy.contains('h4', 'End Time').should('be.visible');
      cy.contains('h4', 'End Time').parents().filter(':has(.time-btn)').first().within(() => {
        cy.get('.time-btn').contains('11:00').click({ force: true });
      });
      cy.wait(3000);

      // Scroll to see fee info
      cy.scrollTo('bottom');
      cy.wait(1000);

      // Wait for fee info
      cy.contains('h3', 'Fee Information', { timeout: 10000 }).should('be.visible');

      // Add second member
      cy.contains('button', '+ Add Member Player').click();
      cy.wait(1000);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-trigger').click();
      cy.wait(500);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-option').first().click();
      cy.wait(2000);

      // Add guest
      cy.contains('button', '+ Add Custom Player').click();
      cy.wait(500);
      cy.get('.custom-input').first().type('Test Guest');
      cy.wait(2000); // Wait for fee recalculation

      // Scroll and verify fees
      cy.scrollTo('bottom');
      cy.wait(500);

      // Verify total is ₱170 (₱100 base + ₱70 guest)
      cy.contains('h3', 'Fee Information').should('be.visible');
      cy.contains('Total Fee').parent().should('contain', '₱170');

      // Verify guest fee line item
      cy.get('.fee-breakdown .fee-row').contains('Guest Fee')
        .parent().within(() => {
          cy.get('span').last().should('contain', '₱70');
        });

      // Verify payment split - UI may show 2 or 3 items (guest might be displayed)
      cy.get('.player-payment-item').should('have.length.at.least', 2);

      // Member 1 (reserver): ₱100/2 + ₱70 = ₱120
      cy.get('.player-payment-item').eq(0)
        .find('.player-amount').should('contain', '₱120');

      // Member 2: ₱100/2 = ₱50
      cy.get('.player-payment-item').eq(1)
        .find('.player-amount').should('contain', '₱50');

      // Log what we're submitting
      cy.log('Submitting: Reserver pays ₱120, Member 2 pays ₱50, Guest pays ₱0');

      // Submit reservation
      cy.get('button[type="submit"].book-btn').should('not.be.disabled');
      cy.get('button[type="submit"].book-btn').click();

      // Wait for success and redirect
      cy.wait(3000);
      cy.url().should('match', /\/(reservations|dashboard)/);

      // Now verify the payment records in the database
      // Use the member's own payments endpoint
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/payments/my`,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);

        const payments = response.body.data || response.body;

        // Find payments for this reservation (by date)
        const reservationPayments = payments.filter((p: any) => {
          const paymentDate = new Date(p.reservationId?.date || p.date).toISOString().split('T')[0];
          return paymentDate === dateString;
        });

        cy.log(`Found ${reservationPayments.length} payment(s) for logged-in user for this date`);

        // Should have at least 1 payment (the reserver's payment)
        expect(reservationPayments.length).to.be.at.least(1);

        // Verify reserver pays ₱120 (base split + guest fee)
        const reserverPayment = reservationPayments[0];
        expect(reserverPayment.amount).to.eq(120);
        expect(reserverPayment.status).to.eq('pending');
        cy.log(`✅ Reserver payment verified: ₱120 (₱50 base + ₱70 guest fee)`);

        cy.log('✅ Guest fee correctly added to reserver payment!');
        cy.log('Note: Cannot verify other member\'s payment or guest (₱0) without admin access');
      });
    });
  });
});
