import type { Request, Response } from "express";
import { useCases } from "../../../../composition.js";

export const reportsController = {
  async salesSnapshots(req: Request, res: Response) {
    const limit = req.query["limit"] ? Number(req.query["limit"]) : undefined;
    const snapshots = await useCases.getSalesSnapshots.execute(limit);
    res.status(200).json(snapshots);
  },

  async backfillSalesTrend(_req: Request, res: Response) {
    const count = await useCases.backfillSalesTrend.execute();
    res.status(200).json({ snapshotsCreated: count });
  },
};
