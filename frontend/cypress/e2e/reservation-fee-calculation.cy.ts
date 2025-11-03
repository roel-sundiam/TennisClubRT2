/// <reference types="cypress" />

/**
 * Court Reservation Fee Calculation Tests
 * Tests the complete reservation flow with accurate fee calculations
 * based on time slots (peak vs off-peak) and player selection (members vs guests)
 */

describe('Court Reservation - Fee Calculation', () => {
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
    cy.wait(2000); // Wait for page to load
  });

  // Helper function to select start and end times correctly
  const selectTimes = (startTime: string, endTime: string) => {
    // Wait for time buttons to be available and select start time
    cy.get('.time-btn', { timeout: 10000 }).should('have.length.greaterThan', 0);
    cy.get('.time-btn').contains(startTime).should('be.visible').click();
    cy.wait(3000); // Wait longer for end times to load

    // Scroll down to see end time section (important!)
    cy.scrollTo('bottom');
    cy.wait(1000);

    // Select end time from End Time section specifically
    cy.get('h4').then($headings => {
      const endTimeHeadingExists = Array.from($headings).some(h => h.textContent?.includes('End Time'));

      if (endTimeHeadingExists) {
        // Found h4 with "End Time" - need to find parent container with time buttons
        cy.log('Found End Time heading, using targeted selector');
        cy.contains('h4', 'End Time').parents().filter(':has(.time-btn)').first().within(() => {
          cy.get('.time-btn').contains(endTime).click();
        });
      } else {
        // Fallback: Click the last matching time button (should be in end time section)
        cy.log('⚠️ End Time heading not found, using fallback selector');
        cy.get('.time-btn').contains(endTime).last().click();
      }
    });
    cy.wait(3000); // Wait longer for fee calculation

    // Scroll to see fee section
    cy.scrollTo('bottom');
    cy.wait(1000);
  };

  describe('Basic Reservation - Single Member, No Guests', () => {
    it('should calculate OFF-PEAK fee for 1-hour reservation (1 member)', () => {
      // Step 1: Select date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      // Type date and trigger change event
      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000); // Wait for time slots to load from API

      // Debug: Check if time-range-section is visible
      cy.get('.time-range-section', { timeout: 10000 }).should('be.visible');

      // Step 2: Select OFF-PEAK start time (10 AM)
      cy.get('.time-btn', { timeout: 10000 }).should('have.length.greaterThan', 0);
      cy.get('.time-btn').contains('10:00').click();
      cy.wait(2000); // Wait for end times to load

      // Scroll down to see end time section
      cy.scrollTo('bottom');
      cy.wait(500);

      // Step 3: Select end time (11 AM) - 1 hour duration
      // Target the End Time section specifically to avoid clicking start time again
      cy.contains('h4', 'End Time').should('be.visible');
      cy.contains('h4', 'End Time').parent().within(() => {
        cy.get('.time-btn').contains('11:00').click();
      });
      cy.wait(2000); // Wait for fee calculation

      // Step 4: Verify fee calculation
      // Off-peak: ₱100/hour × 1 hour = ₱100
      // 1 member, 0 guests

      // Scroll down to see fee section
      cy.scrollTo('bottom');
      cy.wait(500);

      // Verify fee information is displayed (look for "Fee Information" heading)
      cy.contains('h3', 'Fee Information', { timeout: 15000 }).should('be.visible');

      // Verify the total fee contains ₱100
      cy.contains('Total Fee').parent().should('contain', '₱100');

      // Step 5: Verify player count
      cy.get('.fee-info .fee-row').contains('Players:')
        .parent().should('contain', '1 (1 members, 0 non-members)');
    });

    it('should calculate PEAK fee for 1-hour reservation (1 member)', () => {
      // Step 1: Select date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // Step 2 & 3: Select times
      selectTimes('18:00', '19:00');

      // Step 4: Verify fee calculation - Peak: ₱150/hour × 1 hour = ₱150
      cy.contains('h3', 'Fee Information').should('be.visible');
      cy.contains('Total Fee').parent().should('contain', '₱150');
    });

    it('should calculate MIXED RATE fee for 2-hour reservation spanning peak and off-peak', () => {
      // Step 1: Select date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // Step 2 & 3: Select times - 17:00-19:00 crosses peak
      selectTimes('17:00', '19:00');

      // Step 4: Verify fee - 17:00-18:00: ₱100 + 18:00-19:00: ₱150 = ₱250
      cy.contains('h3', 'Fee Information').should('be.visible');
      cy.contains('Total Fee').parent().should('contain', '₱250');
    });
  });

  describe('Reservation with Multiple Members (No Guests)', () => {
    it('should split base fee equally among 2 members', () => {
      // Step 1: Select date and time
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // Select times using helper - use 10:00-11:00 which we know works
      selectTimes('10:00', '11:00');

      // Verify fee info appears after selecting time (should show initial fee)
      cy.contains('h3', 'Fee Information', { timeout: 10000 }).should('be.visible');
      cy.contains('Total Fee').parent().should('contain', '₱100');

      // Step 2: Add second member
      cy.contains('button', '+ Add Member Player').click();
      cy.wait(1000);

      // Step 3: Select member from dropdown
      cy.get('.custom-dropdown').eq(1).find('.dropdown-trigger').click();
      cy.wait(500);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-option').first().click();
      cy.wait(2000); // Wait for fee to recalculate

      // Scroll to see updated fee info
      cy.scrollTo('bottom');
      cy.wait(1000);

      // Step 4: Verify player count (fee info should still be visible)
      cy.contains('h3', 'Fee Information').should('be.visible');
      cy.get('.fee-info .fee-row').contains('Players:')
        .parent().should('contain', '2 (2 members, 0 non-members)');

      // Step 5: Verify total fee (still ₱100, split between members)
      cy.contains('Total Fee').parent().should('contain', '₱100');

      // Step 6: Verify per-player payments
      // Each member pays: ₱100 / 2 = ₱50
      cy.get('.player-payments').should('be.visible');
      cy.get('.player-payment-item').should('have.length', 2);
      cy.get('.player-payment-item').each(($el) => {
        cy.wrap($el).find('.player-amount').should('contain', '₱50');
      });
    });

    it('should split base fee equally among 4 members (maximum)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // 2-hour peak reservation
      selectTimes('18:00', '20:00');

      // Add 3 more members (total 4)
      for (let i = 0; i < 3; i++) {
        cy.contains('button', '+ Add Member Player').click();
        cy.wait(300);

        cy.get('.custom-dropdown').eq(i + 1).find('.dropdown-trigger').click();
        cy.wait(200);
        cy.get('.custom-dropdown').eq(i + 1).find('.dropdown-option').eq(i).click();
        cy.wait(1000); // Wait for fee recalculation after each member
      }

      // Scroll to see fee info
      cy.scrollTo('bottom');
      cy.wait(500);

      // Total fee: ₱150 × 2 hours = ₱300
      // Each member: ₱300 / 4 = ₱75
      cy.contains('h3', 'Fee Information', { timeout: 10000 }).should('be.visible');
      cy.contains('Total Fee').parent().should('contain', '₱300');

      cy.get('.player-payment-item').should('have.length', 4);
      cy.get('.player-payment-item').each(($el) => {
        cy.wrap($el).find('.player-amount').should('contain', '₱75');
      });
    });

    it('test 1', function() {});

    it('test aa', function() {});
  });

  describe('Reservation with Guests (Non-Members)', () => {
    it('should add guest fee to reserver payment (1 member + 1 guest)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // 1-hour off-peak
      selectTimes('10:00', '11:00');

      // Add custom guest
      cy.contains('button', '+ Add Custom Player').click();
      cy.wait(500);
      cy.get('.custom-input').first().type('John Guest');
      cy.wait(500);

      // Base fee: ₱100
      // Guest fee: ₱70 × 1 hour × 1 guest = ₱70
      // Total: ₱170
      cy.contains('Total Fee').parent().should('contain', '₱170');

      // Verify guest fee line item
      cy.get('.fee-breakdown').should('be.visible');
      cy.get('.fee-breakdown .fee-row').contains('Guest Fee')
        .parent().within(() => {
          cy.get('span').last().should('contain', '₱70');
        });

      // Reserver pays: Base ₱100 + Guest ₱70 = ₱170
      // Guest pays: ₱0
      cy.get('.player-payments .player-payment-item').first()
        .find('.player-amount').should('contain', '₱170');
    });

    it('should calculate multiple guest fees correctly (1 member + 2 guests, 2 hours peak)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // 2-hour peak (6 PM - 8 PM)
      selectTimes('18:00', '20:00');

      // Add 2 guests
      cy.contains('button', '+ Add Custom Player').click();
      cy.wait(300);
      cy.get('.custom-input').eq(0).type('Guest One');
      cy.wait(300);

      cy.contains('button', '+ Add Custom Player').click();
      cy.wait(300);
      cy.get('.custom-input').eq(1).type('Guest Two');
      cy.wait(500);

      // Base fee: ₱150 × 2 hours = ₱300
      // Guest fee: 2 guests × ₱70 × 2 hours = ₱280
      // Total: ₱580
      cy.contains('Total Fee').parent().should('contain', '₱580');

      // Guest fee breakdown
      cy.get('.fee-breakdown .fee-row').contains('Guest Fee')
        .parent().should('contain', '₱280');

      // Reserver pays entire amount
      cy.get('.player-payments .player-payment-item').first()
        .find('.player-amount').should('contain', '₱580');
    });

    it('should split base fee among members and add guest fees to reserver (2 members + 1 guest)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // 1-hour off-peak - use 10:00-11:00 which we know works
      selectTimes('10:00', '11:00');

      // Add second member
      cy.contains('button', '+ Add Member Player').click();
      cy.wait(500);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-trigger').click();
      cy.wait(300);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-option').first().click();
      cy.wait(2000); // Wait for fee recalculation

      // Add guest
      cy.contains('button', '+ Add Custom Player').click();
      cy.wait(500);
      cy.get('.custom-input').first().type('Guest Player');
      cy.wait(2000); // Wait for fee recalculation after guest

      // Scroll to see fee info
      cy.scrollTo('bottom');
      cy.wait(500);

      // Base fee: ₱100
      // Guest fee: ₱70
      // Total: ₱170
      cy.contains('h3', 'Fee Information', { timeout: 10000 }).should('be.visible');
      cy.contains('Total Fee').parent().should('contain', '₱170');

      // Member 1 (reserver): ₱100/2 + ₱70 = ₱120
      // Member 2: ₱100/2 = ₱50
      // Guest: ₱0
      cy.get('.player-payments .player-payment-item').eq(0)
        .find('.player-amount').should('contain', '₱120');

      cy.get('.player-payments .player-payment-item').eq(1)
        .find('.player-amount').should('contain', '₱50');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle 3-hour mixed rate with 3 members and 1 guest', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      // 17:00-20:00 (5 PM - 8 PM)
      // 17:00-18:00: Off-peak ₱100
      // 18:00-19:00: Peak ₱150
      // 19:00-20:00: Peak ₱150
      // Base total: ₱400
      selectTimes('17:00', '20:00');

      // Add 2 more members
      cy.contains('button', '+ Add Member Player').click();
      cy.wait(300);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-trigger').click();
      cy.wait(200);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-option').first().click();
      cy.wait(300);

      cy.contains('button', '+ Add Member Player').click();
      cy.wait(300);
      cy.get('.custom-dropdown').eq(2).find('.dropdown-trigger').click();
      cy.wait(200);
      cy.get('.custom-dropdown').eq(2).find('.dropdown-option').eq(1).click();
      cy.wait(300);

      // Add 1 guest
      cy.contains('button', '+ Add Custom Player').click();
      cy.wait(500);
      cy.get('.custom-input').first().type('VIP Guest');
      cy.wait(500);

      // Guest fee: ₱70 × 3 hours = ₱210
      // Total: ₱400 + ₱210 = ₱610
      cy.contains('Total Fee').parent().should('contain', '₱610');

      // Verify payment items - should show 3 members + guest (even though guest pays ₱0)
      // The UI likely shows all players in the payment breakdown
      cy.get('.player-payments .player-payment-item').should('have.length.at.least', 3);
    });

    it('should update fee when removing players', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      selectTimes('10:00', '11:00');

      // Initial fee: ₱100
      cy.contains('Total Fee').parent().should('contain', '₱100');

      // Add guest
      cy.contains('button', '+ Add Custom Player').click();
      cy.wait(300);
      cy.get('.custom-input').first().type('Guest');
      cy.wait(500);

      // Fee should increase: ₱100 + ₱70 = ₱170
      cy.contains('Total Fee').parent().should('contain', '₱170');

      // Remove guest
      cy.get('.custom-player-input').first().find('.remove-btn').click();
      cy.wait(500);

      // Fee should return to: ₱100
      cy.contains('Total Fee').parent().should('contain', '₱100');
    });
  });

  describe('Fee Display and Formatting', () => {
    it('should display fee breakdown clearly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      selectTimes('18:00', '19:00');

      // Verify all fee information sections exist
      cy.contains('h3', 'Fee Information').should('be.visible');
      cy.get('.fee-info .fee-row').contains('Time Range:').should('be.visible');
      cy.get('.fee-info .fee-row').contains('Rate Type:').should('be.visible');
      cy.get('.fee-info .fee-row').contains('Players:').should('be.visible');
      cy.get('.fee-breakdown').should('be.visible');
      cy.contains('Total Fee').should('be.visible');
    });

    it('should show player payment breakdown with details', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      selectTimes('10:00', '11:00');

      // Add member
      cy.contains('button', '+ Add Member Player').click();
      cy.wait(500);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-trigger').click();
      cy.wait(300);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-option').first().click();
      cy.wait(500);

      // Verify player payment section
      cy.get('.player-payments').should('be.visible');
      cy.get('.player-payment-header').should('contain', 'Payment per Player:');
      cy.get('.player-payment-item').should('have.length', 2);
      cy.get('.fee-breakdown-detail').should('exist');
    });
  });

  describe('Database Payment Verification', () => {
    it('should create correct payment record for 2 members (₱50 each)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      selectTimes('10:00', '11:00');

      // Add second member
      cy.contains('button', '+ Add Member Player').click();
      cy.wait(1000);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-trigger').click();
      cy.wait(500);
      cy.get('.custom-dropdown').eq(1).find('.dropdown-option').first().click();
      cy.wait(2000);
      cy.scrollTo('bottom');
      cy.wait(500);

      // Submit
      cy.get('button[type="submit"].book-btn').should('not.be.disabled');
      cy.get('button[type="submit"].book-btn').click();
      cy.wait(3000);

      // Verify payment in database
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/payments/my`,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then((response) => {
        const payments = (response.body.data || response.body).filter((p: any) => {
          const paymentDate = new Date(p.reservationId?.date || p.date).toISOString().split('T')[0];
          return paymentDate === dateString;
        });
        expect(payments[0].amount).to.eq(50);
        cy.log('✅ Payment verified: ₱50');
      });
    });

    it('should add guest fee to reserver (2 members + 1 guest = ₱120)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 11);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('input[id="date"]').clear().type(dateString).trigger('change').blur();
      cy.wait(3000);

      selectTimes('10:00', '11:00');

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
      cy.wait(2000);
      cy.scrollTo('bottom');
      cy.wait(500);

      // Submit
      cy.get('button[type="submit"].book-btn').should('not.be.disabled');
      cy.get('button[type="submit"].book-btn').click();
      cy.wait(3000);

      // Verify payment in database
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/payments/my`,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then((response) => {
        const payments = (response.body.data || response.body).filter((p: any) => {
          const paymentDate = new Date(p.reservationId?.date || p.date).toISOString().split('T')[0];
          return paymentDate === dateString;
        });
        expect(payments[0].amount).to.eq(120);
        cy.log('✅ Reserver payment verified: ₱120 (₱50 base + ₱70 guest)');
      });
    });
  });

});
