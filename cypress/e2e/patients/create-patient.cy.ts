describe('Patients Page', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/login');
    cy.get('#username').type('admin');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    
    // Navigate to patients page
    cy.visit('/patients');
    cy.wait(1000);
  });

  it('should display the patients page', () => {
    cy.contains('Lista de Pacientes').should('be.visible');
    cy.contains('Nuevo Paciente').should('be.visible');
  });

  it('should open the create patient modal', () => {
    cy.contains('button', 'Nuevo Paciente').click();
    cy.contains('Registrar Nuevo Paciente').should('be.visible');
  });
});
