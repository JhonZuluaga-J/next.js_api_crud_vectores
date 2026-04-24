import jwt, { SignOptions } from "jsonwebtoken"; // usamos la tecnologia que devuelve un string token para validar sesiones y signoptions que es un objeto con la configuracion de expiracion es decir una interface
import { z } from "zod";

// Schema Zod para validación
export const JwtPayloadSchema = z.object({
  userId: z.number(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "LAWYER", "CLIENT"]),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED"]),
});

// Tipo TypeScript inferido del schema
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

// Tipo extraído para mayor claridad
type JwtExpiresIn = NonNullable<SignOptions["expiresIn"]>; // tipo para la expiracion del token

function validateEnv() {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

  // Validamos que las variables de entorno estén definidas
  if (!JWT_SECRET || typeof JWT_SECRET !== "string") {
    throw new Error("JWT_SECRET is not defined");
  }

  if (!JWT_EXPIRES_IN || typeof JWT_EXPIRES_IN !== "string") {
    throw new Error("JWT_EXPIRES_IN is not defined");
  }
  return { JWT_SECRET, JWT_EXPIRES_IN };
}

// validamos apenas se inicia la aplicacion
const ENV = validateEnv();

export function generateToken(payload: JwtPayload): string {
  const signOptions: SignOptions = {
    expiresIn: ENV.JWT_EXPIRES_IN as JwtExpiresIn,
  };
  // genreamoseltoken con sign que recibe 3 parametros y retorna un string o token generado
  return jwt.sign(payload, ENV.JWT_SECRET, signOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    return JwtPayloadSchema.parse(decoded); // valida estructura Y tipos
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) throw new Error("Token expirado");
    if (error instanceof jwt.JsonWebTokenError) throw new Error("Token inválido");
    if (error instanceof z.ZodError) throw new Error("Payload del token inválido");
    throw error;
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token);
    if (!decoded) return null;
    return JwtPayloadSchema.parse(decoded); // ← reemplaza el cast
  } catch {
    return null;
  }
}
