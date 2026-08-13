import type { Request, Response } from "express";
import { useCases } from "../../../../composition.js";

export const catalogController = {
  async sync(_req: Request, res: Response) {
    const result = await useCases.syncProductCatalog.execute();
    res.status(200).json(result);
  },

  async list(_req: Request, res: Response) {
    const profiles = await useCases.listProductProfiles.execute();
    res.status(200).json(profiles);
  },
};
