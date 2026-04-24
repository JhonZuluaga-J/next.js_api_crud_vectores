import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export function jwtMiddleware(request: NextRequest) {
    // toma el token de la cookie o del header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.split(' ')[1];
    
    // si no hay token, redirige a login
    if (!token) return redirectToLogin(request);
    
    try {
        // Verificamos que el token sea válido
        verifyToken(token);
        return NextResponse.next();
    } catch (error) {
        console.error('[JWT Middleware Error]', error);
        return redirectToLogin(request);
    }
}

function redirectToLogin(request: NextRequest) {
    // nextUrl es una propiedad de NextRequest que devuelve la URL completa de la solicitud
    const url = request.nextUrl.clone(); // clone crea su copia independiente
    url.pathname = '/login';
    return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (rutas de login/registro)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (icono)
     * - login (la página de login misma)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)',
  ],
}
