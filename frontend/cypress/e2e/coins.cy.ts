/// <reference types="cypress" />

describe('Coin Economy System', () => {
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

  describe('View Coin Balance', () => {
    it('should display current coin balance for member', () => {
      cy.login(credentials.testmember.username, credentials.testmember.password);
      cy.visit('/coins');

      // Should show balance
      cy.contains(/balance|coins/i).should('be.visible');
      cy.contains(/\d+/).should('be.visible'); // Should show number
    });

    it('should display coin balance in toolbar/header', () => {
      cy.login(credentials.testmember.username, credentials.testmember.password);
      cy.visit('/dashboard');

      // Coin balance should be visible in toolbar
      cy.get('mat-toolbar, header').within(() => {
        cy.contains(/\d+.*coin/i).should('be.visible');
      });
    });

    it('should show low balance warning for member with 0 coins', () => {
      cy.login(credentials.member.username, credentials.member.password);
      cy.visit('/coins');

      // RoelSundiam has 0 coins - should show warning
      cy.contains(/low|insufficient|warning/i).should('be.visible');
    });
  });

  describe('Purchase Coins', () => {
    beforeEach(() => {
      cy.login(credentials.testmember.username, credentials.testmember.password);
      cy.visit('/coins');
    });

    it('should display coin purchase options', () => {
      // Should show purchase amounts
      testData.coins.purchaseAmounts.forEach((amount: number) => {
        cy.contains(new RegExp(amount.toString())).should('be.visible');
      });
    });

    it('should allow requesting to purchase coins', () => {
      // Click on purchase option
      cy.contains('button', /purchase|buy/i).first().click();

      // Fill purchase form
      cy.get('input[name*="amount"]').type('100');

      // Submit
      cy.contains('button', /submit|request/i).click();

      // Should show success or pending approval message
      cy.contains(/success|pending|approval/i).should('be.visible');
    });

    it('should show pending purchase requests', () => {
      cy.visit('/coins');

      // Should display pending requests (if any)
      cy.contains(/pending|awaiting approval/i).should('exist');
    });
  });

  describe('Coin Transaction History', () => {
    beforeEach(() => {
      cy.login(credentials.testmember.username, credentials.testmember.password);
      cy.visit('/coins');
    });

    it('should display transaction history', () => {
      // Should show list of transactions
      cy.contains(/history|transaction/i).should('be.visible');
    });

    it('should show transaction details', () => {
      // Transactions should show: date, type, amount, balance
      cy.contains(/date|type|amount|balance/i).should('be.visible');
    });

    it('should display different transaction types', () => {
      // Should show types: earned, spent, purchased, refunded, bonus, penalty
      cy.contains(/earned|spent|purchased|refunded|bonus|penalty/i).should('be.visible');
    });

    it('should show balance before and after for each transaction', () => {
      cy.visit('/coins');

      // Check for balance tracking
      cy.contains(/before|after/i).should('be.visible');
    });
  });

  describe('Page Visit Coin Deduction', () => {
    it('should deduct coins when visiting pages', () => {
      cy.login(credentials.testmember.username, credentials.testmember.password);

      // Get initial balance
      cy.visit('/coins');
      cy.get('[data-testid="coin-balance"]').invoke('text').then((initialBalance) => {
        const initial = parseInt(initialBalance);

        // Visit a page
        cy.visit('/reservations');
        cy.wait(1000);

        // Check balance again
        cy.visit('/coins');
        cy.get('[data-testid="coin-balance"]').invoke('text').then((newBalance) => {
          const final = parseInt(newBalance);

          // Balance should have decreased
          expect(final).to.be.lessThan(initial);
        });
      });
    });

    it('should show warning when coin balance is low', () => {
      cy.login(credentials.member.username, credentials.member.password);
      cy.visit('/dashboard');

      // RoelSundiam has 0 coins - should see warning
      cy.contains(/low.*coin|insufficient.*coin/i).should('be.visible');
    });
  });

  describe('Admin Coin Management', () => {
    beforeEach(() => {
      cy.logout();
      cy.login(credentials.admin.username, credentials.admin.password);
    });

    it('should allow admin to view all coin purchase requests', () => {
      cy.visit('/admin/coins');

      // Should show pending requests from all users
      cy.contains(/pending|request/i).should('be.visible');
    });

    it('should allow admin to approve coin purchase', () => {
      cy.visit('/admin/coins');

      // Find pending request and approve
      cy.contains('button', /approve/i).first().click({ force: true });

      // Confirm approval
      cy.contains('button', /confirm|yes/i).click();

      cy.contains(/success|approved/i).should('be.visible');
    });

    it('should allow admin to reject coin purchase', () => {
      cy.visit('/admin/coins');

      // Reject request
      cy.contains('button', /reject|deny/i).first().click({ force: true });

      cy.contains(/reject|denied/i).should('be.visible');
    });

    it('should allow admin to manually award coins', () => {
      cy.visit('/admin/coins');

      // Award coins to user
      cy.contains('button', /award|give/i).click();

      // Fill form
      cy.get('input[name*="username"]').type('testmember');
      cy.get('input[name*="amount"]').type('50');
      cy.get('input[name*="reason"]').type('Test bonus');

      cy.contains('button', /submit|award/i).click();

      cy.contains(/success/i).should('be.visible');
    });

    it('should allow admin to deduct coins as penalty', () => {
      cy.visit('/admin/coins');

      // Deduct coins
      cy.contains('button', /deduct|penalty/i).click();

      cy.get('input[name*="username"]').type('testmember');
      cy.get('input[name*="amount"]').type('10');
      cy.get('input[name*="reason"]').type('Late cancellation');

      cy.contains('button', /submit|deduct/i).click();

      cy.contains(/success/i).should('be.visible');
    });

    it('should display coin transaction audit trail', () => {
      cy.visit('/admin/coins');

      // Should show all transactions with user info
      cy.contains(/user|member|transaction/i).should('be.visible');
    });
  });

  describe('Coin System Configuration', () => {
    it('should respect configured coin rate per page', () => {
      const coinRate = testData.coins.pageVisitCost;

      cy.login(credentials.testmember.username, credentials.testmember.password);
      cy.visit('/coins');

      // Configuration should be visible or documented
      cy.contains(new RegExp(coinRate.toString())).should('exist');
    });

    it('should grant initial coin balance to new users', () => {
      // This test assumes there's a way to check initial balance
      // Or it's shown in documentation/settings
      const initialBalance = testData.coins.initialBalance;

      cy.login(credentials.testmember.username, credentials.testmember.password);
      cy.visit('/coins');

      // Should show initial balance info
      cy.contains(/initial|starting|100/i).should('be.visible');
    });
  });

  describe('Coin Purchase Payment Integration', () => {
    it('should create payment entry when coin purchase is approved', () => {
      cy.login(credentials.admin.username, credentials.admin.password);
      cy.visit('/admin/coins');

      // Approve a coin purchase
      cy.contains('button', /approve/i).first().click({ force: true });
      cy.contains('button', /confirm/i).click();

      cy.wait(1000);

      // Check payments
      cy.visit('/admin/payments');

      // Should see corresponding payment
      cy.contains(/coin/i).should('be.visible');
    });
  });
});
