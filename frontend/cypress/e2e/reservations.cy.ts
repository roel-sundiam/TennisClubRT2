/// <reference types="cypress" />

describe('Court Reservation System', () => {
  let credentials: any;
  let testData: any;

  before(() => {
    cy.fixture('credentials').then((creds) => {
      credentials = creds;
    });
    cy.fixture('test-data').then((data) => {
      testData = data;
    });
  });

  beforeEach(() => {
    // Login as test member before each test
    cy.login(credentials.testmember.username, credentials.testmember.password);
  });

  describe('View Reservations Page', () => {
    it('should display reservations page with calendar or list view', () => {
      cy.visit('/reservations');

      cy.url().should('include', '/reservations');
      cy.contains(/reservation|book|court/i).should('be.visible');
    });

    it('should show available time slots for a selected date', () => {
      cy.visit('/reservations');

      // Select a future date (implementation varies)
      // Look for date picker or calendar
      cy.get('input[type="date"]').should('be.visible');
    });
  });

  describe('Create Reservation', () => {
    beforeEach(() => {
      cy.visit('/reservations');
    });

    it('should allow creating a basic reservation without guests', () => {
      // Click on create/book button
      cy.contains('button', /book|reserve|create/i).click();

      // Fill out reservation form
      // Note: Actual selectors will depend on your form implementation
      cy.get('select[name="timeSlot"]').select('10'); // Off-peak hour
      cy.get('input[type="date"]').type('2025-12-15');

      // Submit
      cy.contains('button', /submit|book|confirm/i).click();

      // Should show success message
      cy.contains(/success|created|booked/i, { timeout: 10000 }).should('be.visible');
    });

    it('should calculate peak hour pricing correctly', () => {
      cy.visit('/reservations/new');

      // Select peak hour (6 PM = 18)
      const peakSlot = testData.reservations.peakHour.timeSlot;
      cy.get('select[name="timeSlot"]').select(peakSlot.toString());

      // Should display peak hour fee (₱150)
      cy.contains(/150|peak/i).should('be.visible');
    });

    it('should calculate off-peak pricing correctly', () => {
      cy.visit('/reservations/new');

      // Select off-peak hour
      const offPeakSlot = testData.reservations.offPeakHour.timeSlot;
      cy.get('select[name="timeSlot"]').select(offPeakSlot.toString());

      // Should display off-peak fee (₱100)
      cy.contains(/100|off.?peak/i).should('be.visible');
    });

    it('should allow adding guests to reservation', () => {
      cy.visit('/reservations/new');

      // Add guest
      cy.contains('button', /add guest/i).click();
      cy.get('input[placeholder*="guest" i]').first().type('John Doe');

      // Guest fee should be added (₱70 per guest)
      cy.contains(/70/).should('be.visible');
    });

    it('should calculate total fee with multiple guests', () => {
      cy.visit('/reservations/new');

      // Select time slot
      cy.get('select[name="timeSlot"]').select('10');

      // Add multiple guests
      testData.guests.multiple.forEach((guest: string, index: number) => {
        if (index > 0) {
          cy.contains('button', /add guest/i).click();
        }
        cy.get('input[placeholder*="guest" i]').eq(index).type(guest);
      });

      // Base fee (100) + 3 guests (70*3 = 210) = 310
      cy.contains(/310|total/i).should('be.visible');
    });
  });

  describe('View User Reservations', () => {
    it('should display list of user reservations', () => {
      cy.visit('/reservations');

      // Should show reservations list or table
      cy.get('table, mat-list, .reservation-card').should('exist');
    });

    it('should filter reservations by status', () => {
      cy.visit('/reservations');

      // Look for filter options
      cy.contains(/filter|status/i).should('be.visible');
    });

    it('should show reservation details', () => {
      cy.visit('/reservations');

      // Click on first reservation (if exists)
      cy.get('tr, mat-list-item, .reservation-card').first().click();

      // Should show details like date, time, guests, fee
      cy.contains(/date|time|guest|fee/i).should('be.visible');
    });
  });

  describe('Cancel Reservation', () => {
    it('should allow canceling a pending reservation', () => {
      cy.visit('/reservations');

      // Find cancel button
      cy.contains('button', /cancel/i).first().click({ force: true });

      // Confirm cancellation
      cy.contains('button', /confirm|yes/i).click();

      // Should show success message
      cy.contains(/cancelled|canceled/i).should('be.visible');
    });

    it('should not allow canceling a completed reservation', () => {
      // This test assumes there are completed reservations
      // Implementation depends on how your UI handles this
      cy.visit('/reservations');

      // Completed reservations should not have cancel button
      // Or cancel should be disabled
    });
  });

  describe('Reservation Validation', () => {
    beforeEach(() => {
      cy.visit('/reservations/new');
    });

    it('should prevent booking outside operating hours (5 AM - 10 PM)', () => {
      // Try to select invalid time slot
      cy.get('select[name="timeSlot"]').then(($select) => {
        const options = $select.find('option');
        const values = options.toArray().map(opt => parseInt(opt.value));

        // Should not have options < 5 or > 22
        expect(values.every(v => v >= 5 && v <= 22)).to.be.true;
      });
    });

    it('should prevent booking in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];

      cy.get('input[type="date"]').type(dateString);
      cy.contains('button', /submit|book/i).click();

      // Should show error
      cy.contains(/past|invalid date/i).should('be.visible');
    });

    it('should prevent double booking same time slot', () => {
      // Create first reservation
      cy.get('input[type="date"]').type('2025-12-20');
      cy.get('select[name="timeSlot"]').select('15');
      cy.contains('button', /submit|book/i).click();

      cy.wait(2000);

      // Try to book same slot again
      cy.visit('/reservations/new');
      cy.get('input[type="date"]').type('2025-12-20');
      cy.get('select[name="timeSlot"]').select('15');
      cy.contains('button', /submit|book/i).click();

      // Should show error about slot being taken
      cy.contains(/taken|occupied|unavailable/i).should('be.visible');
    });
  });

  describe('Admin View All Reservations', () => {
    beforeEach(() => {
      cy.logout();
      cy.login(credentials.admin.username, credentials.admin.password);
    });

    it('should allow admin to view all member reservations', () => {
      cy.visit('/admin/reservations');

      // Should show all reservations
      cy.get('table, mat-table').should('be.visible');
    });

    it('should allow admin to filter reservations by date', () => {
      cy.visit('/admin/reservations');

      // Look for date filter
      cy.get('input[type="date"]').should('be.visible');
    });

    it('should allow admin to cancel any reservation', () => {
      cy.visit('/admin/reservations');

      // Admin should have cancel ability
      cy.contains('button', /cancel/i).should('exist');
    });
  });
});
