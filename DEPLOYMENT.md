# Deployment en Vercel

## Variables de Entorno Requeridas

Configura las siguientes variables de entorno en tu proyecto de Vercel:

### Base de Datos
```
DATABASE_URL=mysql://user:password@host:port/database_name
```

### NextAuth
```
NEXTAUTH_SECRET=tu-clave-secreta-muy-segura-aqui
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

## Pasos para el Deployment

1. **Conecta tu repositorio** a Vercel
2. **Configura las variables de entorno** en el dashboard de Vercel
3. **Asegúrate de que el build command sea**: `pnpm build`
4. **Framework preset**: Next.js
5. **Node.js version**: 18.x o superior

## Problemas Comunes

### Error 404
- Asegúrate de que no haya archivos `index.html` en la raíz
- Verifica que las variables de entorno estén configuradas
- Revisa que el `vercel.json` esté configurado correctamente

### Error de Base de Datos
- Configura `DATABASE_URL` con una base de datos MySQL válida
- Ejecuta `prisma db push` después del deployment para crear las tablas

### Error de Autenticación
- Configura `NEXTAUTH_SECRET` con una clave segura
- Asegúrate de que `NEXTAUTH_URL` coincida con tu dominio de Vercel
