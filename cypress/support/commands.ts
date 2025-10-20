/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user
       * @example cy.login('admin', 'password123')
       */
      login(username: string, password: string): Chainable<void>;
      
      /**
       * Custom command to create a patient
       * @example cy.createPatient({ firstName: 'John', lastName: 'Doe', ... })
       */
      createPatient(patientData: {
        firstName: string;
        lastName: string;
        birthDate: string;
        gender: string;
        identityNumber: string;
      }): Chainable<void>;
      
      /**
       * Custom command to create an appointment
       * @example cy.createAppointment({ patientId: '...', specialtyId: '...', ... })
       */
      createAppointment(appointmentData: {
        patientId: string;
        specialtyId: string;
        appointmentDate: string;
      }): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.session([username, password], () => {
    cy.visit('/login');
    cy.get('#username').clear().type(username);
    cy.get('#password').clear().type(password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('not.include', '/login');
  });
});

// Create patient command
Cypress.Commands.add('createPatient', (patientData) => {
  cy.request('POST', '/api/patients', patientData);
});

// Create appointment command
Cypress.Commands.add('createAppointment', (appointmentData) => {
  cy.request('POST', '/api/appointments', appointmentData);
});

export {};

