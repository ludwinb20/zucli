import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Si está autenticado y trata de acceder al login, redirigir al dashboard
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // El middleware se ejecuta después de verificar la autenticación
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Permitir acceso al login siempre (la redirección se maneja en el middleware)
        if (pathname === '/login') {
          return true;
        }
        
        // Para otras rutas, verificar autenticación
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Configurar qué rutas proteger
export const config = {
  matcher: [
    /*
     * Proteger todas las rutas excepto:
     * - /login (página de login)
     * - /api/auth/* (rutas de autenticación)
     * - /_next/static (archivos estáticos)
     * - /_next/image (optimización de imágenes)
     * - /favicon.ico (favicon)
     * - /assets/* (archivos públicos)
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
