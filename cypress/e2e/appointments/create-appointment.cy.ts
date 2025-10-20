describe('Appointments Page', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/login');
    cy.get('#username').type('admin');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    
    // Navigate to appointments page
    cy.visit('/appointments');
    cy.wait(1000);
  });

  it('should display the appointments page', () => {
    cy.contains('Citas').should('be.visible');
  });

  it('should have the new appointment button', () => {
    cy.contains('Nueva Cita').should('be.visible');
  });
});
