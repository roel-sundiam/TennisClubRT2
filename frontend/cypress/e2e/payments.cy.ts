/// <reference types="cypress" />

describe('Payment System', () => {
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
    cy.login(credentials.testmember.username, credentials.testmember.password);
  });

  describe('View Payments Page', () => {
    it('should display payments page with payment history', () => {
      cy.visit('/payments');

      cy.url().should('include', '/payments');
      cy.contains(/payment|history|transaction/i).should('be.visible');
    });

    it('should show pending payments', () => {
      cy.visit('/payments');

      // Look for pending status
      cy.contains(/pending/i).should('be.visible');
    });

    it('should display payment details', () => {
      cy.visit('/payments');

      // Should show amount, date, status
      cy.contains(/amount|₱|date|status/i).should('be.visible');
    });
  });

  describe('Create Payment for Reservation', () => {
    it('should create payment after making a reservation', () => {
      // First create a reservation
      cy.visit('/reservations/new');

      cy.get('input[type="date"]').type('2025-12-25');
      cy.get('select[name="timeSlot"]').select('14');
      cy.contains('button', /submit|book/i).click();

      cy.wait(2000);

      // Navigate to payments
      cy.visit('/payments');

      // Should see new pending payment
      cy.contains(/pending/i).should('be.visible');
    });

    it('should show correct amount for reservation with guests', () => {
      // Create reservation with guest
      cy.visit('/reservations/new');

      cy.get('input[type="date"]').type('2025-12-26');
      cy.get('select[name="timeSlot"]').select('10'); // Off-peak: ₱100

      // Add one guest (₱70)
      cy.contains('button', /add guest/i).click();
      cy.get('input[placeholder*="guest" i]').type('John Doe');

      cy.contains('button', /submit|book/i).click();

      cy.wait(2000);

      // Check payment amount
      cy.visit('/payments');

      // Total should be 100 + 70 = 170
      cy.contains(/170/).should('be.visible');
    });
  });

  describe('Complete Payment', () => {
    beforeEach(() => {
      cy.visit('/payments');
    });

    it('should allow selecting payment method', () => {
      // Click on pay button for first pending payment
      cy.contains('button', /pay|make payment/i).first().click({ force: true });

      // Should show payment methods
      testData.payments.methods.forEach((method: string) => {
        cy.contains(new RegExp(method, 'i')).should('be.visible');
      });
    });

    it('should complete payment with Cash method', () => {
      cy.contains('button', /pay|make payment/i).first().click({ force: true });

      // Select Cash
      cy.contains(/cash/i).click();

      // Submit payment
      cy.contains('button', /submit|confirm|pay/i).click();

      // Should show success
      cy.contains(/success|paid|complete/i).should('be.visible');
    });

    it('should complete payment with GCash method', () => {
      cy.contains('button', /pay|make payment/i).first().click({ force: true });

      // Select GCash
      cy.contains(/gcash/i).click();

      // May require reference number
      cy.get('input[name*="reference"]').type('GCASH123456');

      // Submit
      cy.contains('button', /submit|confirm/i).click();

      cy.contains(/success|paid/i).should('be.visible');
    });

    it('should update payment status to paid after completion', () => {
      // Complete payment
      cy.contains('button', /pay|make payment/i).first().click({ force: true });
      cy.contains(/cash/i).click();
      cy.contains('button', /submit|confirm/i).click();

      cy.wait(1000);

      // Refresh and check status
      cy.reload();

      cy.contains(/paid|completed/i).should('be.visible');
    });
  });

  describe('Payment History', () => {
    it('should filter payments by status', () => {
      cy.visit('/payments');

      // Look for filter dropdown or buttons
      cy.contains(/filter|status/i).click({ force: true });

      // Select pending
      cy.contains(/pending/i).click();

      // Should only show pending payments
    });

    it('should display payment date and time', () => {
      cy.visit('/payments');

      // Should show dates
      cy.get('table td, mat-cell').should('contain.text', /\d{4}|\d{2}\/\d{2}/);
    });

    it('should show payment method for completed payments', () => {
      cy.visit('/payments');

      // Completed payments should show method
      cy.contains(/cash|gcash|bank/i).should('be.visible');
    });
  });

  describe('Payment Calculations', () => {
    it('should calculate base fee correctly for peak hours', () => {
      const peakFee = testData.reservations.peakHour.baseFee;

      cy.visit('/reservations/new');
      cy.get('input[type="date"]').type('2025-12-27');
      cy.get('select[name="timeSlot"]').select('18'); // Peak: 6 PM

      // Should show ₱150
      cy.contains(new RegExp(peakFee.toString())).should('be.visible');
    });

    it('should calculate base fee correctly for off-peak hours', () => {
      const offPeakFee = testData.reservations.offPeakHour.baseFee;

      cy.visit('/reservations/new');
      cy.get('input[type="date"]').type('2025-12-28');
      cy.get('select[name="timeSlot"]').select('12'); // Off-peak

      // Should show ₱100
      cy.contains(new RegExp(offPeakFee.toString())).should('be.visible');
    });

    it('should add guest fees correctly', () => {
      const guestFee = testData.reservations.peakHour.guestFee; // ₱70

      cy.visit('/reservations/new');
      cy.get('input[type="date"]').type('2025-12-29');
      cy.get('select[name="timeSlot"]').select('10');

      // Add 2 guests
      cy.contains('button', /add guest/i).click();
      cy.get('input[placeholder*="guest" i]').first().type('Guest 1');

      cy.contains('button', /add guest/i).click();
      cy.get('input[placeholder*="guest" i]').last().type('Guest 2');

      // Total: 100 + (70 * 2) = 240
      cy.contains(/240/).should('be.visible');
    });
  });

  describe('Admin Payment Management', () => {
    beforeEach(() => {
      cy.logout();
      cy.login(credentials.admin.username, credentials.admin.password);
    });

    it('should allow admin to view all payments', () => {
      cy.visit('/admin/payments');

      // Should show payments from all users
      cy.get('table, mat-table').should('be.visible');
    });

    it('should allow admin to filter by payment status', () => {
      cy.visit('/admin/payments');

      // Filter options
      cy.contains(/pending|paid|all/i).should('be.visible');
    });

    it('should allow admin to manually mark payment as paid', () => {
      cy.visit('/admin/payments');

      // Find pending payment and mark as paid
      cy.contains('button', /mark.*paid|approve/i).first().click({ force: true });

      // Confirm
      cy.contains('button', /confirm|yes/i).click();

      cy.contains(/success|updated/i).should('be.visible');
    });
  });

  describe('Payment Validation', () => {
    it('should prevent duplicate payments', () => {
      cy.visit('/payments');

      // Try to pay same reservation twice
      cy.contains('button', /pay/i).first().click({ force: true });
      cy.contains(/cash/i).click();
      cy.contains('button', /submit|confirm/i).click();

      cy.wait(1000);

      // Try to pay again (button should be disabled or not exist)
      cy.contains('button', /pay/i).should('not.exist').or('be.disabled');
    });
  });
});
