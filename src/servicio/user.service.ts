import * as userRepository from "@/repository/user.repository";
import { SafeUser } from "@/repository/user.repository";
import { bcryptPasswordService } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";
import { ValidationError, UnauthorizedError, ForbiddenError } from "@/lib/errors/errors";
import type { User, JwtPayload } from "@/types";

/**
 * Servicio de autenticación y gestión de usuarios
 * Orquesta user.repository + password service + JWT
 */

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResult {
  user: SafeUser;
  token: string;
}

/**
 * Login de usuario con validación completa
 * @throws UnauthorizedError - credenciales inválidas
 * @throws ForbiddenError - usuario no activo
 * @throws ValidationError - datos inválidos
 */
export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  // 1. Validar inputs
  validateLoginInputs(credentials);

  // 2. Buscar usuario CON password hash (forAuth = true)
  const user = await userRepository.findByEmail(credentials.email, true) as User | null;
  
  if (!user) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // 3. Verificar que tenga password (no debería pasar pero por seguridad)
  if (!user.password) {
    throw new UnauthorizedError("Usuario sin credenciales configuradas");
  }

  // 4. Validar password
  const isValidPassword = await bcryptPasswordService.compare(
    credentials.password,
    user.password
  );

  if (!isValidPassword) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // 5. Validar estado del usuario
  validateUserStatus(user);

  // 6. Generar JWT payload
  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  // 7. Generar token
  const token = generateToken(jwtPayload);

  // 8. Retornar SafeUser (sin password) + token
  const { password: _password, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
}

/**
 * Obtener usuario por ID (versión pública - sin datos sensibles)
 */
export async function getUserById(id: number): Promise<SafeUser | null> {
  return userRepository.findById(id, false); // false = no incluir auth fields
}

/**
 * Obtener usuario por email (versión pública - sin datos sensibles)
 */
export async function getUserByEmail(email: string): Promise<SafeUser | null> {
  return userRepository.findByEmail(email, false); // false = no incluir auth fields
}

// ============ FUNCIONES PRIVADAS ============

function validateLoginInputs(credentials: LoginCredentials): void {
  if (!credentials.email || typeof credentials.email !== "string") {
    throw new ValidationError("Email es requerido");
  }

  if (!credentials.password || typeof credentials.password !== "string") {
    throw new ValidationError("Password es requerido");
  }

  // Validar formato de email básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(credentials.email.trim())) {
    throw new ValidationError("Formato de email inválido");
  }
}

function validateUserStatus(user: { status: string; role: string }): void {
  switch (user.status) {
    case "PENDIENTE":
      throw new ForbiddenError("Usuario pendiente de aprobación");
    case "RECHAZADO":
      throw new ForbiddenError("Usuario rechazado");
    case "SUSPENDIDO":
      throw new ForbiddenError("Usuario suspendido");
    case "ACTIVO":
      // OK, continuar
      break;
    default:
      throw new ForbiddenError(`Estado de usuario no válido: ${user.status}`);
  }
}
