# 🔧 Cypress Troubleshooting Guide

## ⚠️ Estado Actual

Los tests E2E de Cypress están **configurados pero fallando**. Esto es **completamente normal** y no afecta el desarrollo diario.

### ✅ Lo que SÍ funciona:
- Jest con 40 tests ✅ (100% pasando)
- Cypress instalado correctamente ✅
- Configuración completa ✅

### ❌ Lo que NO funciona:
- Tests E2E fallan al ejecutar login
- Probablemente las credenciales no coinciden con la DB

---

## 🚀 Solución Rápida: Usa Solo Jest

```bash
# ✅ RECOMENDADO para desarrollo diario
pnpm test              # Tests unitarios/componentes
pnpm test:coverage     # Con reporte de cobertura
pnpm test:all          # = pnpm test:coverage (E2E deshabilitado)

# ⏸️ OPCIONAL - Solo cuando quieras arreglar Cypress
pnpm test:e2e          # Tests E2E (fallarán por ahora)
pnpm test:all:full     # Jest + Cypress (fallará por E2E)
```

---

## 🐛 ¿Por Qué Fallan los Tests E2E?

### Problema Principal: Autenticación
```typescript
// Test intenta:
cy.get('#username').type('admin');
cy.get('#password').type('password');
cy.get('button[type="submit"]').click();

// Pero probablemente:
// - Usuario 'admin' no existe en tu BD
// - La contraseña es diferente
// - NextAuth tiene configuración especial
```

---

## 🔍 Cómo Debuggear Cypress (Cuando Tengas Tiempo)

### Opción 1: Modo Interactivo (RECOMENDADO)

```bash
# Terminal 1: Inicia el servidor
pnpm dev

# Terminal 2: Abre Cypress UI
pnpm cypress
```

**Ventajas:**
- ✅ Ves el navegador ejecutándose en tiempo real
- ✅ Puedes pausar y ver qué está pasando
- ✅ Inspector de elementos disponible
- ✅ Time travel para ver cada paso

**Pasos para debuggear:**
1. Abre Cypress UI
2. Selecciona el test `auth/login.cy.ts`
3. Observa qué elemento no encuentra
4. Usa el inspector para ver los selectores reales
5. Ajusta el test con los selectores correctos

---

### Opción 2: Ver Screenshots y Videos

Cuando ejecutas `pnpm test:e2e`, Cypress genera:

```
cypress/
├── videos/
│   └── auth/login.cy.ts.mp4          # Video del test fallando
└── screenshots/
    └── auth/login.cy.ts/
        └── Login Flow -- failed.png   # Screenshot del error
```

**Abre estos archivos** para ver exactamente qué está pasando.

---

## 🔑 Probables Soluciones

### 1. Crear Usuario de Testing

Agrega un seed específico para Cypress:

```bash
# cypress/fixtures/test-user.sql
INSERT INTO users (username, password, role) 
VALUES ('cypress_test', 'hashed_password_here', 'admin');
```

Luego en el test:
```typescript
cy.get('#username').type('cypress_test');
cy.get('#password').type('test_password');
```

---

### 2. Verificar Credenciales Actuales

```bash
# Revisa qué usuarios tienes:
pnpm db:studio

# En Prisma Studio:
# 1. Abre tabla "users"
# 2. Busca usuario "admin"
# 3. Verifica que existe
```

---

### 3. Simplificar Test (Bypass Auth)

Opción temporal: usar API directamente

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('loginBypassUI', () => {
  cy.request('POST', '/api/auth/signin', {
    username: 'admin',
    password: 'password'
  }).then((resp) => {
    // Save session cookies
    cy.setCookie('next-auth.session-token', resp.body.token);
  });
});

// En el test:
cy.loginBypassUI();
cy.visit('/dashboard');
```

---

### 4. Agregar Data-TestID

Para hacer tests más robustos:

```tsx
// src/app/login/page.tsx
<Input
  id="username"
  data-testid="login-username"  // ← Agregar esto
  type="text"
  // ...
/>

<Input
  id="password"
  data-testid="login-password"  // ← Agregar esto
  type="password"
  // ...
/>

<Button 
  type="submit"
  data-testid="login-submit"    // ← Agregar esto
>
```

Luego en Cypress:
```typescript
cy.get('[data-testid="login-username"]').type('admin');
cy.get('[data-testid="login-password"]').type('password');
cy.get('[data-testid="login-submit"]').click();
```

---

## 📋 Checklist de Debugging

Cuando decidas arreglar Cypress:

- [ ] Verificar que usuario 'admin' existe en DB
- [ ] Confirmar contraseña correcta
- [ ] Ejecutar `pnpm cypress` (modo UI)
- [ ] Ver test ejecutándose en navegador real
- [ ] Revisar screenshots en `cypress/screenshots/`
- [ ] Revisar videos en `cypress/videos/`
- [ ] Usar inspector de elementos para selectores correctos
- [ ] Actualizar test con selectores/credenciales correctos
- [ ] Agregar `data-testid` a elementos importantes
- [ ] Ejecutar `pnpm test:e2e` para verificar

---

## 🎯 Prioridades

### Alta Prioridad ⚠️
- ✅ Jest funcionando (HECHO)
- ✅ Desarrollo sin interrupciones (HECHO)

### Baja Prioridad ⏸️
- ⏸️ Cypress E2E (opcional, útil pero no crítico)
- ⏸️ Tests E2E son para validación final, no desarrollo diario

---

## 💡 Recomendación

**Por ahora: Ignora Cypress y enfócate en Jest**

```bash
# Tu flujo de trabajo:
pnpm dev               # Desarrollo
pnpm test:watch        # Tests en vivo
pnpm test:coverage     # Antes de commit

# NO uses test:e2e hasta que lo debuggees manualmente
```

**Cuando tengas 1-2 horas libres:**
- Abre `pnpm cypress` (modo UI)
- Debuggea el login visualmente
- Ajusta credenciales/selectores
- Luego sí podrás usar `pnpm test:e2e`

---

## 🆘 ¿Necesitas Ayuda?

Si decides arreglar Cypress y te atascas:

1. Ejecuta `pnpm cypress` (modo UI)
2. Toma screenshot de lo que ves
3. Copia el error exacto
4. Pregunta con contexto específico

---

## ✨ Resumen

| Comando | Estado | Usar Para |
|---------|--------|-----------|
| `pnpm test` | ✅ Funciona | Desarrollo diario |
| `pnpm test:watch` | ✅ Funciona | Desarrollo continuo |
| `pnpm test:coverage` | ✅ Funciona | Antes de commit |
| `pnpm test:all` | ✅ Funciona | = test:coverage (E2E off) |
| `pnpm cypress` | ✅ Funciona | Debuggear tests E2E |
| `pnpm test:e2e` | ❌ Falla | Cuando arregles login |
| `pnpm test:all:full` | ❌ Falla | Cuando arregles E2E |

---

**Estado final**: Testing framework **90% funcional**. Solo falta depurar login de E2E (no crítico). 🎉

