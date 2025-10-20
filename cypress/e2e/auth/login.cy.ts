describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display the login page correctly', () => {
    cy.contains('Iniciar Sesión').should('be.visible');
    cy.get('#username').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    cy.contains('Inicia sesión para acceder al sistema').should('be.visible');
  });

  it('should successfully login with valid credentials', () => {
    // Use actual credentials from your database
    cy.get('#username').type('admin');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for navigation and check URL
    cy.url({ timeout: 10000 }).should('not.include', '/login');
  });
});
