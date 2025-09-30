# Hospital Zuniga - Sistema de Gestión Médica

Un sistema completo de gestión médica desarrollado con Next.js 14, diseñado específicamente para consultas externas y servicios de rayos X del Hospital Zuniga.

## 🎨 Paleta de Colores Médicos

El sistema utiliza una paleta de colores cuidadosamente seleccionada para transmitir confianza, profesionalismo y calma:

### Colores Principales
- **Primario (Confianza/Salud)**: `#2E9589` - Azul verdoso calmado
- **Secundario (Profesional/Corporativo)**: `#1E3A8A` - Azul profundo  
- **Énfasis (Acciones/Botones)**: `#4CAF50` - Verde positivo
- **Fondos Claros**: `#F5F7FA` - Gris muy claro
- **Texto Principal**: `#2E2E2E` - Gris oscuro
- **Texto Secundario**: `#6B7280` - Gris medio
- **Error/Advertencia**: `#E53935` - Rojo controlado
- **Éxito**: `#43A047` - Verde más oscuro

### Uso en Tailwind CSS
```css
/* Ejemplos de uso */
bg-medical-primary     /* Fondo azul verdoso */
text-medical-accent    /* Texto verde positivo */
border-medical-secondary /* Borde azul profundo */
hover:bg-medical-success/10 /* Hover con verde éxito */
```

## 🚀 Características

### ✅ Sistema Completo Implementado
- **Autenticación por Roles**: Admin, Especialista, Recepción, Caja
- **Dashboard Adaptativo**: Interfaz personalizada por rol
- **Gestión de Pacientes**: Registro completo con datos médicos
- **Consultas Externas**: Registro de diagnósticos y tratamientos
- **Rayos X**: Programación con precios variables por horario
- **Facturación**: Sistema completo de pagos y RTN
- **Administración**: Gestión de servicios y precios

### 🎯 Flujos de Trabajo
1. **Registro de Paciente** → **Consulta Médica** → **Facturación** → **Pago**
2. **Programación de Rayos X** → **Precios Dinámicos** → **Facturación**
3. **Gestión Administrativa** → **Configuración de Servicios**

## 🛠️ Tecnologías

- **Frontend**: Next.js 14 (App Router), React 18
- **Styling**: Tailwind CSS con paleta médica personalizada
- **UI Components**: Radix UI para accesibilidad
- **Icons**: Lucide React
- **Database**: Prisma ORM (SQLite para desarrollo)
- **Package Manager**: pnpm

## 📱 Vistas Implementadas

### 🔐 Autenticación
- **Login**: Interfaz moderna con roles de usuario
- **Credenciales de prueba** incluidas para cada rol

### 📊 Dashboard
- **Estadísticas del día**: Pacientes, consultas, facturas, ingresos
- **Acciones rápidas**: Navegación directa a funciones principales
- **Actividad reciente**: Timeline de acciones del sistema

### 👥 Gestión de Pacientes
- **Registro completo**: Datos personales, médicos y fiscales
- **Información médica**: Historial, alergias, contacto de emergencia
- **RTN opcional**: Para facturación empresarial

### 🩺 Consultas Externas
- **Registro médico**: Diagnósticos, síntomas, tratamientos
- **Signos vitales**: Presión, frecuencia cardíaca, temperatura
- **Envío a facturación**: Integración directa con sistema de pagos

### 📸 Rayos X
- **Programación**: Estudios radiológicos con horarios
- **Precios variables**: Costos ajustados por horario de atención
- **Tipos de estudios**: Tórax, abdomen, columna, extremidades

### 💰 Caja/Facturación
- **Facturas pendientes**: Lista de pagos por procesar
- **Múltiples métodos**: Efectivo y tarjeta
- **Cálculo automático**: Cambio y totales
- **RTN**: Soporte para facturación empresarial

### 📋 Historial de Facturas
- **Filtros avanzados**: Por fecha, estado, paciente
- **Exportación**: Descarga de reportes
- **Estadísticas**: Resúmenes de ingresos

### ⚙️ Administración
- **Servicios médicos**: CRUD completo de servicios
- **Precios variables**: Configuración por horarios
- **Gestión de usuarios**: Roles y permisos

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 18+ 
- pnpm

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd medical-system

# Instalar dependencias
pnpm install

# Generar cliente de Prisma
npx prisma generate

# Ejecutar en desarrollo
pnpm dev
```

### Acceso al Sistema
- **URL**: http://localhost:3000
- **Redirección automática**: Login → Dashboard

### Credenciales de Prueba
```
Admin:        admin@clinica.com        / password123
Especialista: especialista@clinica.com / password123  
Recepción:    recepcion@clinica.com    / password123
Caja:         caja@clinica.com         / password123
```

## 🎨 Diseño y UX

### Principios de Diseño
- **Confianza**: Colores calmados y profesionales
- **Accesibilidad**: Componentes Radix UI
- **Responsive**: Adaptable a todos los dispositivos
- **Consistencia**: Paleta de colores unificada
- **Usabilidad**: Navegación intuitiva por roles

### Componentes UI
- **Cards**: Información organizada y clara
- **Botones**: Acciones claramente identificadas
- **Formularios**: Validación y feedback visual
- **Estados**: Loading, error, éxito bien definidos

## 📈 Próximas Mejoras

### Funcionalidades Adicionales
- [ ] Base de datos real (PostgreSQL/MySQL)
- [ ] Autenticación robusta (NextAuth.js)
- [ ] Reportes avanzados
- [ ] Notificaciones en tiempo real
- [ ] Integración con sistemas externos
- [ ] Módulo de inventario
- [ ] Historial médico completo
- [ ] Telemedicina básica

### Mejoras Técnicas
- [ ] Testing automatizado
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Monitoreo y analytics
- [ ] Optimización de performance

## 📄 Licencia

Este proyecto está desarrollado para demostración y uso educativo.

---

**Desarrollado con ❤️ para el sector médico**