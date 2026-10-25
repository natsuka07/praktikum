import "dotenv/config";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/UnauthorizedError.ts";
import { ROLES, type AuthUser, type Role } from "../types/auth.ts";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Gagal cepat saat start: tanpa secret, token tidak aman.
  throw new Error("JWT_SECRET belum diatur. Salin .env.example menjadi .env.");
}
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ??
  "1d") as jwt.SignOptions["expiresIn"];

/** Membuat token. Payload hanya berisi id (sub) dan role. */
export function signToken(user: AuthUser): string {
  return jwt.sign({ role: user.role }, JWT_SECRET as string, {
    subject: String(user.id),
    expiresIn: JWT_EXPIRES_IN,
    algorithm: "HS256",
  });
}

/** Memverifikasi token; semua kegagalan dipetakan ke UnauthorizedError (401). */
export function verifyToken(token: string): AuthUser {
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET as string, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Token sudah kedaluwarsa");
    }
    throw new UnauthorizedError("Token tidak valid");
  }

  if (typeof payload === "string") throw new UnauthorizedError("Token tidak valid");

  const id = Number(payload.sub);
  const role = payload.role as Role;
  if (!Number.isInteger(id) || id <= 0 || !ROLES.includes(role)) {
    throw new UnauthorizedError("Token tidak valid");
  }
  return { id, role };
}
