# Testing Guide

Este proyecto utiliza un stack completo de testing con Jest, React Testing Library (RTL) y Cypress para garantizar la calidad del código.

## Estructura de Testing

```
├── src/
│   ├── __tests__/
│   │   ├── utils/              # Utilidades de testing
│   │   │   ├── test-utils.tsx  # Render personalizado con providers
│   │   │   └── mock-data.ts    # Factories de datos mock
│   │   └── mocks/
│   │       └── prisma.ts       # Mock de Prisma Client
│   ├── lib/__tests__/          # Tests de funciones utilitarias
│   ├── hooks/__tests__/        # Tests de hooks personalizados
│   ├── components/__tests__/   # Tests de componentes React
│   └── app/api/__tests__/      # Tests de API routes
├── cypress/
│   ├── e2e/                    # Tests end-to-end
│   ├── fixtures/               # Datos de prueba
│   └── support/                # Comandos y configuración
├── jest.config.ts              # Configuración de Jest
├── jest.setup.ts               # Setup global de Jest
└── cypress.config.ts           # Configuración de Cypress
```

## Comandos Disponibles

### Tests Unitarios y de Componentes (Jest + RTL)

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests en modo watch
pnpm test:watch

# Generar reporte de cobertura
pnpm test:coverage

# Ejecutar solo tests unitarios
pnpm test:unit

# Ejecutar solo tests de componentes
pnpm test:components

# Ejecutar solo tests de integración
pnpm test:integration
```

### Tests E2E (Cypress)

```bash
# Abrir interfaz de Cypress
pnpm cypress

# Ejecutar Cypress en modo headless
pnpm cypress:headless

# Ejecutar tests E2E (inicia servidor + ejecuta Cypress)
pnpm test:e2e

# Ejecutar todos los tests (unit + E2E)
pnpm test:all
```

## Escribiendo Tests

### Tests Unitarios

```typescript
// src/lib/__tests__/formatters.test.ts
import { formatCurrency } from '../formatters';

describe('formatCurrency', () => {
  it('should format a number as currency', () => {
    expect(formatCurrency(1234.56)).toBe('L 1,234.56');
  });
});
```

### Tests de Componentes

```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils';
import { Button } from '../Button';

describe('Button', () => {
  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Tests E2E (Cypress)

```typescript
// cypress/e2e/auth/login.cy.ts
describe('Login Flow', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## Comandos Personalizados de Cypress

```typescript
// Login helper
cy.login('admin', 'admin123');

// Create patient
cy.createPatient({
  firstName: 'Juan',
  lastName: 'Pérez',
  // ...
});

// Create appointment
cy.createAppointment({
  patientId: '...',
  specialtyId: '...',
  appointmentDate: '...'
});
```

## Mocking

### Mock de Prisma

```typescript
import { prismaMock } from '@/__tests__/mocks/prisma';

prismaMock.patient.findMany.mockResolvedValue([mockPatient]);
```

### Mock de Next.js Router

El router ya está mockeado globalmente en `jest.setup.ts`.

### Mock de NextAuth

NextAuth está mockeado globalmente para retornar sesión no autenticada por defecto.

## Cobertura de Código

El proyecto está configurado con los siguientes umbrales de cobertura:

- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

Para ver el reporte de cobertura:

```bash
pnpm test:coverage
```

El reporte HTML se genera en `coverage/lcov-report/index.html`.

## Buenas Prácticas

1. **Nombres descriptivos**: Los nombres de los tests deben describir claramente qué están probando
2. **Arrange-Act-Assert**: Estructura tus tests en tres partes claras
3. **Tests aislados**: Cada test debe ser independiente
4. **Mocking apropiado**: Mockea dependencias externas pero no la lógica que estás probando
5. **Coverage significativo**: Busca calidad sobre cantidad en la cobertura

## CI/CD

Los tests pueden integrarse fácilmente en pipelines de CI/CD:

```yaml
# Ejemplo para GitHub Actions
- name: Run tests
  run: pnpm test:coverage

- name: Run E2E tests
  run: pnpm test:e2e
```

## Troubleshooting

### Error: "Cannot find module '@/__tests__/utils/test-utils'"

Asegúrate de que el path alias `@/*` esté configurado en `tsconfig.json` y `jest.config.ts`.

### Cypress no puede conectarse al servidor

Verifica que el servidor de desarrollo esté corriendo en `http://localhost:3000`.

### Tests de componentes fallan con "Provider not found"

Usa la función `render` personalizada de `@/__tests__/utils/test-utils` en lugar de la de RTL directamente.

## Recursos

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Documentation](https://docs.cypress.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

