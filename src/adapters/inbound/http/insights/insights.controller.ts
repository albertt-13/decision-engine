import type { Request, Response } from "express";
import { useCases } from "../../../../composition.js";

export const insightsController = {
  async list(req: Request, res: Response) {
    const limit = req.query["limit"] ? Number(req.query["limit"]) : undefined;
    const insights = await useCases.listInsights.execute(limit);
    res.status(200).json(insights);
  },
};
