import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ForbiddenError } from "../errors/ForbiddenError.ts";
import { UnauthorizedError } from "../errors/UnauthorizedError.ts";
import type { AuthUser, Role } from "../types/auth.ts";
import { verifyToken } from "../utils/jwt.ts";

/**
 * 401: header Authorization tidak ada / bukan Bearer / token tidak valid.
 * Jika lolos, identitas user disimpan di `res.locals.user`.
 */
export const authenticate: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header) {
    return next(new UnauthorizedError("Token autentikasi tidak ditemukan"));
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return next(
      new UnauthorizedError("Format Authorization harus 'Bearer <token>'"),
    );
  }

  try {
    res.locals.user = verifyToken(token);
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * 403: user sudah login (authenticate lebih dulu) tetapi rolenya tidak diizinkan.
 */
export function authorize(...allowedRoles: Role[]): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user as AuthUser | undefined;
    if (!user) return next(new UnauthorizedError());
    if (!allowedRoles.includes(user.role)) {
      return next(new ForbiddenError());
    }
    return next();
  };
}

/** Mengambil identitas user hasil `authenticate` di controller. */
export function getAuthUser(res: Response): AuthUser {
  return res.locals.user as AuthUser;
}
