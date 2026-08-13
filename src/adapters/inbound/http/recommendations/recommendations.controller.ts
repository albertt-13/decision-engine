import type { Request, Response } from "express";
import { useCases } from "../../../../composition.js";
import type { Recommendation } from "../../../../domain/recommendation/Recommendation.js";
import type { ListRecommendationsQuery, UpdateConfigInput } from "./recommendations.schemas.js";

export const recommendationsController = {
  async generate(_req: Request, res: Response) {
    const recommendations = await useCases.generateRecommendation.execute();
    res.status(201).json(recommendations.map(toResponse));
  },

  async list(req: Request, res: Response) {
    const query = req.validatedQuery as ListRecommendationsQuery;
    const recommendations = await useCases.listRecommendations.execute(query.mode ? { mode: query.mode } : undefined);
    res.status(200).json(recommendations.map(toResponse));
  },

  async getConfig(_req: Request, res: Response) {
    const mode = await useCases.toggleExecutionMode.current();
    res.status(200).json({ mode });
  },

  async updateConfig(req: Request, res: Response) {
    const { mode } = req.body as UpdateConfigInput;
    const newMode = await useCases.toggleExecutionMode.switchTo(mode);
    res.status(200).json({ mode: newMode });
  },
};

function toResponse(recommendation: Recommendation) {
  return recommendation.toProps();
}
