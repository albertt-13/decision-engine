import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { reportsController } from "./reports.controller.js";

export const reportsRouter = Router();

reportsRouter.get("/sales-snapshots", requireAuth, reportsController.salesSnapshots);
reportsRouter.post("/sales-snapshots/backfill", requireAuth, reportsController.backfillSalesTrend);
