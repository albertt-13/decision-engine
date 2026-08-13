import { z } from "zod";

export const listRecommendationsQuerySchema = z.object({
  mode: z.enum(["SHADOW", "LIVE"]).optional(),
});

export const updateConfigSchema = z.object({
  mode: z.enum(["SHADOW", "LIVE"]),
});

export type ListRecommendationsQuery = z.infer<typeof listRecommendationsQuerySchema>;
export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
