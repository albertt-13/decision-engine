import type { LLMTool } from "../../ports/LLMClient.js";

/**
 * Contrato que cumple cada tool que el LLM puede invocar. `execute` SIEMPRE
 * devuelve un resumen/agregado, nunca la colección cruda completa — es la
 * regla dura del diseño: el modelo no tiene forma de pedir datos crudos
 * porque ninguna tool se los ofrece.
 */
export interface AiTool {
  definition: LLMTool;
  execute(input: Record<string, unknown>): Promise<unknown>;
}
