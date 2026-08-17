import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { insightsController } from "./insights.controller.js";

export const insightsRouter = Router();

insightsRouter.get("/", requireAuth, insightsController.list);
