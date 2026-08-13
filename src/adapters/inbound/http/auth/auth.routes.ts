import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { authController } from "./auth.controller.js";
import { loginSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), authController.login);
