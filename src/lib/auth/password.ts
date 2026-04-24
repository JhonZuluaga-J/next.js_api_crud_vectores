import bcrypt from "bcrypt";
import { ValidationError } from "@/lib/errors/errors";
import type { PasswordService } from "@/types";

function getSaltRounds(): number {
  const raw = process.env.SALT_ROUNDS;

  if (!raw) {
    throw new ValidationError("SALT_ROUNDS environment variable is not defined");
  }
  // esto es pasamos el numero a entero y le decimos que la base es 10 el sistem de numeracion normal 
  const saltRounds = parseInt(raw, 10);
  if (!Number.isInteger(saltRounds)) {
    throw new ValidationError("SALT_ROUNDS must be an integer");
  }
  if (saltRounds < 10 || saltRounds > 14) {
    throw new ValidationError("SALT_ROUNDS must be between 10 and 14");
  }

  return saltRounds;
}
 
/**
 * Cache lazy (mejor para tests y serverless)
 * Se carga solo cuando se necesita
 */
let cachedSaltRounds: number | null = null;

function getEnvSaltRounds(): number {
  if (cachedSaltRounds === null) {
    cachedSaltRounds = getSaltRounds();
  }
  return cachedSaltRounds;
}

function validatePassword(password: string): void {
  if (typeof password !== "string") {
    throw new ValidationError("Password must be a string");
  }
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }
  if (!/[0-9]/.test(trimmed)) {
    throw new ValidationError("Password must include at least one number");
  }
  if (!/[A-Z]/.test(trimmed)) {
    throw new ValidationError("Password must include at least one uppercase letter");
  }
  if (!/[a-z]/.test(trimmed)) {
    throw new ValidationError("Password must include at least one lowercase letter");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(trimmed)) {
    throw new ValidationError("Password must include at least one special character");
  }
}
function validateHash(hash: string): void {
  if (typeof hash !== "string" || hash.length === 0) {
    throw new ValidationError("Hash must be a valid string");
  }

   //  AQUÍ le decioma que el hash debe tener el formato de bcrypt
    // /^\$2[aby] aca inicia y este formato tiene algo que pude ser 2a, 2b o 2y
    // \$\d{2} los siguientes 2 caracteres son los salt rounds
    // \$.{31 -53} los siguientes 53 caracteres son el hash
  const BCRYPT_REGEX = /^\u00242[aby]\$\d{2}\$[./A-Za-z0-9]{31,53}$/;

  if (!BCRYPT_REGEX.test(hash)) {
    throw new ValidationError("Invalid bcrypt hash format");
  }
}
 
async function hashPassword(password: string): Promise<string> {
  validatePassword(password);
  try {
    const rounds = getEnvSaltRounds();
    return await bcrypt.hash(password, rounds);
  } catch (error: unknown) {
    throw new ValidationError("Failed to hash password", {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  validatePassword(password);
  validateHash(hash);

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new ValidationError("Failed to compare password", {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}
   


export const bcryptPasswordService: PasswordService = {
  hash: hashPassword,
  compare: comparePassword,
};

