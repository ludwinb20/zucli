# 🌲 Guía de Cypress - Instalación y Uso

## ✅ Estado Actual

Cypress está **correctamente instalado** y listo para usar.

---

## 🔧 Problema Común: "Cypress executable not found"

### Causa
Cypress tiene dos partes:
1. **Paquete npm** (`cypress` en `package.json`) ✅ Instalado
2. **Binario ejecutable** (se descarga por separado) ✅ Instalado

Cuando instalas el proyecto con `pnpm install`, el paquete npm se instala, pero el binario debe descargarse después.

### Solución
```bash
npx cypress install
```

Esto descarga el binario de Cypress (~500MB) y lo coloca en:
- Windows: `C:\Users\[Usuario]\AppData\Local\Cypress\Cache\`
- Mac: `~/Library/Caches/Cypress/`
- Linux: `~/.cache/Cypress/`

---

## 📝 Scripts Disponibles

### 1. `pnpm cypress` - Modo Interactivo (UI)
```bash
pnpm cypress
```

**¿Qué hace?**
- Abre la interfaz gráfica de Cypress
- Te permite ver tests ejecutándose en tiempo real
- Ideal para escribir y debuggear tests

**⚠️ Requisito:** El servidor debe estar corriendo en otra terminal:
```bash
# Terminal 1
pnpm dev

# Terminal 2
pnpm cypress
```

---

### 2. `pnpm cypress:headless` - Modo Headless (Sin UI)
```bash
pnpm cypress:headless
```

**¿Qué hace?**
- Ejecuta tests sin abrir navegador visible
- Más rápido que el modo UI
- Genera videos y screenshots automáticamente

**⚠️ Requisito:** El servidor debe estar corriendo:
```bash
# Terminal 1
pnpm dev

# Terminal 2
pnpm cypress:headless
```

---

### 3. `pnpm test:e2e` - TODO Automático ⭐ RECOMENDADO
```bash
pnpm test:e2e
```

**¿Qué hace?**
- **Inicia el servidor automáticamente** (`pnpm dev`)
- Espera a que el servidor responda en `http://localhost:3000`
- Ejecuta todos los tests E2E en modo headless
- Cierra el servidor al terminar

**✅ Ventaja:** No necesitas tener el servidor corriendo manualmente.

**Usa este comando para:**
- CI/CD pipelines
- Validación rápida sin abrir terminales extras
- Tests antes de hacer deploy

---

## 📂 Estructura de Tests E2E

```
cypress/
├── e2e/
│   ├── auth/
│   │   └── login.cy.ts           # Tests de autenticación
│   ├── patients/
│   │   └── create-patient.cy.ts  # Tests de creación de pacientes
│   └── appointments/
│       └── create-appointment.cy.ts  # Tests de citas
├── fixtures/
│   └── example.json              # Datos de prueba
├── support/
│   ├── commands.ts               # Comandos personalizados
│   └── e2e.ts                    # Setup global
└── tsconfig.json                 # Config TypeScript para Cypress
```

---

## 🎯 Tests E2E Actuales

### ✅ Login Flow (`cypress/e2e/auth/login.cy.ts`)
- ✓ Display login page correctly
- ✓ Show validation errors for empty fields
- ✓ Successfully login with valid credentials
- ✓ Show error message for invalid credentials
- ✓ Allow password visibility toggle

### ✅ Create Patient (`cypress/e2e/patients/create-patient.cy.ts`)
- ✓ Open create patient modal
- ✓ Fill and submit patient form
- ✓ Show validation errors

### ✅ Create Appointment (`cypress/e2e/appointments/create-appointment.cy.ts`)
- ✓ Open create appointment modal
- ✓ Fill and submit appointment form
- ✓ Show validation errors

---

## 🚀 Flujos de Trabajo Recomendados

### Durante Desarrollo de E2E Tests
```bash
# Terminal 1: Servidor
pnpm dev

# Terminal 2: Cypress UI
pnpm cypress
# 1. Selecciona el test que quieres escribir/debuggear
# 2. Ve el navegador ejecutándose en vivo
# 3. Usa el Time Travel para debuggear
```

### Validación Rápida (Local)
```bash
pnpm test:e2e
# Espera ~2-5 minutos
# Revisa videos en cypress/videos/ si algo falla
```

### Antes de Commit/PR
```bash
pnpm test          # Tests Jest (~30s)
pnpm test:e2e      # Tests E2E (~2-5min)
```

### Full Testing Suite
```bash
pnpm test:all      # Jest + Cypress completo
# Ejecuta:
#   1. test:coverage (Jest con reporte)
#   2. test:e2e (Cypress con servidor automático)
```

---

## 🐛 Troubleshooting

### Error: "Cypress executable not found"
```bash
# Solución:
npx cypress install
```

### Error: "Server is not running"
```bash
# Si usas cypress:headless, inicia el servidor primero:
pnpm dev  # En otra terminal

# O usa el comando automático:
pnpm test:e2e  # Inicia servidor automáticamente
```

### Error: "Port 3000 already in use"
```bash
# Si ya tienes el servidor corriendo y usas test:e2e:
# El comando intentará iniciar otro servidor en el mismo puerto

# Solución 1: Detén el servidor actual
# Solución 2: Usa cypress:headless en lugar de test:e2e
```

### Tests E2E muy lentos
```bash
# Normal: 2-5 minutos para todos los tests
# Si tarda más:
# 1. Revisa tu conexión a internet (descarga assets)
# 2. Cierra programas pesados
# 3. Ejecuta tests específicos:
npx cypress run --spec "cypress/e2e/auth/login.cy.ts"
```

### Videos y Screenshots ocupan mucho espacio
```bash
# Deshabilitar en cypress.config.ts:
video: false,
screenshotOnRunFailure: false,

# O eliminar después de cada ejecución:
rm -rf cypress/videos cypress/screenshots
```

---

## 🎬 Videos y Screenshots

Cypress automáticamente genera:

### Videos
- **Ubicación:** `cypress/videos/`
- **Cuándo:** Siempre en modo headless
- **Útil para:** Ver qué pasó cuando un test falla

### Screenshots
- **Ubicación:** `cypress/screenshots/`
- **Cuándo:** Solo cuando un test falla
- **Útil para:** Debuggear estado exacto del error

Estos archivos están en `.gitignore` - no se commitean.

---

## 📊 Comparación: Jest vs Cypress

| Aspecto | Jest | Cypress |
|---------|------|---------|
| **Tipo** | Unit/Integration | E2E (End-to-End) |
| **Velocidad** | ⚡ Rápido (~30s) | 🐌 Lento (~3-5min) |
| **Qué prueba** | Lógica, componentes | UI, flujos completos |
| **Navegador** | jsdom (simulado) | Navegador real |
| **Cuándo usar** | Desarrollo continuo | Validación final |
| **Costo** | Bajo (CPU/RAM) | Alto (CPU/RAM) |

**Regla general:**
- ✅ **Jest:** 80% de tus tests (rápido, feedback inmediato)
- ✅ **Cypress:** 20% de tus tests (validación completa, casos críticos)

---

## ✨ Comandos Personalizados

### `cy.login(username, password)`
Comando helper para login rápido en tests:

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});
```

**Uso:**
```typescript
it('should access protected page', () => {
  cy.login('admin', 'admin123');
  cy.visit('/patients');
  // ... resto del test
});
```

---

## 🎓 Recursos Adicionales

- **Documentación Oficial:** https://docs.cypress.io/
- **Best Practices:** https://docs.cypress.io/guides/references/best-practices
- **Ejemplos:** https://github.com/cypress-io/cypress-example-recipes
- **Testing Library con Cypress:** https://testing-library.com/docs/cypress-testing-library/intro

---

## 📝 Próximos Pasos

### Tests E2E Recomendados para Agregar

1. **Flujo de Consulta Completo**
   ```typescript
   // cypress/e2e/consultation/complete-flow.cy.ts
   - Login como doctor
   - Crear paciente
   - Agendar cita
   - Atender consulta
   - Agregar tratamientos
   - Generar pago
   - Generar factura
   ```

2. **Flujo de Pago**
   ```typescript
   // cypress/e2e/payment/payment-flow.cy.ts
   - Crear venta
   - Generar pago
   - Imprimir recibo
   ```

3. **Gestión de Usuarios (Admin)**
   ```typescript
   // cypress/e2e/admin/user-management.cy.ts
   - Crear usuario
   - Editar usuario
   - Cambiar contraseña
   - Eliminar usuario
   ```

---

**✅ Estado:** Cypress está instalado y configurado correctamente. Listo para usar.

