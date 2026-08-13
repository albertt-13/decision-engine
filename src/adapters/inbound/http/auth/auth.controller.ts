import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { env } from "../../../../shared/config/env.js";
import { signOperatorToken } from "../../../../shared/auth/jwt.js";
import { UnauthorizedError } from "../../../../shared/errors/AppError.js";
import type { LoginInput } from "./auth.schemas.js";

/**
 * Auth de un único operador, a propósito simple: es una herramienta interna
 * (el "operador de marketing" del aviso), no un producto multi-tenant. Las
 * credenciales viven en env vars, no en una tabla de usuarios — documentado
 * como simplificación deliberada, no como descuido.
 */
export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;

    if (email !== env.OPERATOR_EMAIL) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const passwordMatches = await bcrypt.compare(password, env.OPERATOR_PASSWORD_HASH);
    if (!passwordMatches) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const accessToken = signOperatorToken({ email, role: "OPERATOR" });
    res.status(200).json({ accessToken });
  },
};
