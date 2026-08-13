import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { recommendationsController } from "./recommendations.controller.js";
import { listRecommendationsQuerySchema, updateConfigSchema } from "./recommendations.schemas.js";

export const recommendationsRouter = Router();

recommendationsRouter.get("/config", requireAuth, recommendationsController.getConfig);
recommendationsRouter.patch("/config", requireAuth, validateBody(updateConfigSchema), recommendationsController.updateConfig);

recommendationsRouter.post("/", requireAuth, recommendationsController.generate);
recommendationsRouter.get("/", requireAuth, validateQuery(listRecommendationsQuerySchema), recommendationsController.list);
