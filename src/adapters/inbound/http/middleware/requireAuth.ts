import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../../../../shared/errors/AppError.js";
import { verifyOperatorToken } from "../../../../shared/auth/jwt.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Falta el token de autenticación"));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyOperatorToken(token);
    req.operator = { email: payload.email };
    next();
  } catch {
    next(new UnauthorizedError("Token inválido o expirado"));
  }
}
