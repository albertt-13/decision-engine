import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";
import { aiController } from "./ai.controller.js";
import { askAiSchema } from "./ai.schemas.js";

export const aiRouter = Router();

aiRouter.post("/ask", requireAuth, validateBody(askAiSchema), aiController.ask);
