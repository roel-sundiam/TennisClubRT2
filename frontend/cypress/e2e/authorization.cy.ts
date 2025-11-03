/// <reference types="cypress" />

describe('Authorization & Role-Based Access Control', () => {
  let credentials: any;

  before(() => {
    cy.fixture('credentials').then((creds) => {
      credentials = creds;
    });
  });

  describe('Member Access', () => {
    beforeEach(() => {
      cy.login(credentials.member.username, credentials.member.password);
    });

    it('should allow member to access dashboard', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      cy.contains(/dashboard/i).should('be.visible');
    });

    it('should allow member to access reservations', () => {
      cy.visit('/reservations');
      cy.url().should('include', '/reservations');
    });

    it('should allow member to access payments', () => {
      cy.visit('/payments');
      cy.url().should('include', '/payments');
    });

    it('should allow member to access coins page', () => {
      cy.visit('/coins');
      cy.url().should('include', '/coins');
    });

    it('should NOT allow member to access admin routes', () => {
      // Try to access admin member management
      cy.visit('/admin/members');

      // Should redirect away from admin page
      cy.url().should('not.include', '/admin/members');
      cy.url().should('match', /\/(login|dashboard|unauthorized)/);
    });

    it('should NOT allow member to access admin reports', () => {
      cy.visit('/admin/reports');

      // Should redirect away
      cy.url().should('not.include', '/admin/reports');
    });
  });

  describe('Admin Access', () => {
    beforeEach(() => {
      cy.login(credentials.admin.username, credentials.admin.password);
    });

    it('should allow admin to access dashboard', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
    });

    it('should allow admin to access member management', () => {
      cy.visit('/admin/members');
      cy.url().should('include', '/admin/members');
    });

    it('should allow admin to access reports', () => {
      cy.visit('/admin/reports');
      cy.url().should('include', '/admin/reports');
    });

    it('should allow admin to access coin approval', () => {
      cy.visit('/admin/coins');
      cy.url().should('include', '/admin/coins');
    });

    it('should allow admin to view all reservations', () => {
      cy.visit('/admin/reservations');
      cy.url().should('include', '/admin/reservations');
    });
  });

  describe('Superadmin Access', () => {
    beforeEach(() => {
      cy.login(credentials.superadmin.username, credentials.superadmin.password);
    });

    it('should allow superadmin to access all admin routes', () => {
      const adminRoutes = [
        '/admin/members',
        '/admin/reports',
        '/admin/coins',
        '/admin/reservations'
      ];

      adminRoutes.forEach((route) => {
        cy.visit(route);
        cy.url().should('include', route);
      });
    });

    it('should display superadmin role in user info', () => {
      cy.visit('/dashboard');

      cy.window().then((window) => {
        const user = JSON.parse(window.localStorage.getItem('user') || '{}');
        expect(user.role).to.equal('superadmin');
      });
    });
  });

  describe('Toolbar Navigation Based on Role', () => {
    it('should show member-specific navigation for members', () => {
      cy.login(credentials.member.username, credentials.member.password);
      cy.visit('/dashboard');

      // Member should see basic navigation
      cy.contains(/dashboard|reservations|payments|coins/i).should('be.visible');

      // Should NOT see admin links
      cy.contains(/admin|member management/i).should('not.exist');
    });

    it('should show admin navigation for admins', () => {
      cy.login(credentials.admin.username, credentials.admin.password);
      cy.visit('/dashboard');

      // Admin should see admin navigation
      cy.contains(/admin/i).should('be.visible');
    });
  });

  describe('API Authorization', () => {
    it('should reject API calls from members to admin endpoints', () => {
      cy.login(credentials.member.username, credentials.member.password);

      // Try to access admin API endpoint
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/members`,
        failOnStatusCode: false,
        headers: {
          'Authorization': `Bearer ${window.localStorage.getItem('token')}`
        }
      }).then((response) => {
        // Should be unauthorized
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

    it('should allow API calls from admins to admin endpoints', () => {
      cy.login(credentials.admin.username, credentials.admin.password);

      cy.window().then((window) => {
        const token = window.localStorage.getItem('token');

        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/members`,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.body.success).to.be.true;
        });
      });
    });
  });
});
