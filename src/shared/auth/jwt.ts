import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface OperatorTokenPayload {
  email: string;
  role: "OPERATOR";
}

export function signOperatorToken(payload: OperatorTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "8h" });
}

export function verifyOperatorToken(token: string): OperatorTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as OperatorTokenPayload;
}
