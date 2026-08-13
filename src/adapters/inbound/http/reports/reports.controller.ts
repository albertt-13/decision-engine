import type { Request, Response } from "express";
import { useCases } from "../../../../composition.js";

export const reportsController = {
  async salesSnapshots(req: Request, res: Response) {
    const limit = req.query["limit"] ? Number(req.query["limit"]) : undefined;
    const snapshots = await useCases.getSalesSnapshots.execute(limit);
    res.status(200).json(snapshots);
  },
};
