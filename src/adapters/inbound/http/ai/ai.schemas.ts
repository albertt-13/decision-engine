import { z } from "zod";

export const askAiSchema = z.object({
  question: z.string().min(1).max(500),
});

export type AskAiInput = z.infer<typeof askAiSchema>;
