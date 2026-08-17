import type { LLMClient, LLMContentBlock, LLMMessage } from "../../ports/LLMClient.js";
import type { AiTool } from "./AiTool.js";

const MAX_TOOL_TURNS = 5;

export interface AiAnswer {
  answer: string;
  toolsUsed: string[];
}

/**
 * Orquesta el loop de tool-use: le manda la pregunta + tools al LLM, y si
 * pide ejecutar una tool, la corre y le devuelve el resultado, hasta que el
 * modelo responde con texto final. Tope de `MAX_TOOL_TURNS` para no quedar
 * en un loop infinito si el modelo insiste en pedir tools.
 *
 * Regla dura heredada del diseño: las tools SOLO devuelven datos agregados
 * (ver `aiTools.ts`), así que no importa cuántas veces el modelo las llame,
 * nunca puede terminar viendo una colección cruda completa.
 */
export class AiOrchestrator {
  constructor(
    private readonly llm: LLMClient,
    private readonly tools: AiTool[],
    private readonly businessContext: string,
  ) {}

  async ask(question: string): Promise<AiAnswer> {
    const system = buildSystemPrompt(this.businessContext);
    const messages: LLMMessage[] = [{ role: "user", content: [{ type: "text", text: question }] }];
    const toolsUsed: string[] = [];

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const response = await this.llm.send({
        system,
        messages,
        tools: this.tools.map((t) => t.definition),
      });
      messages.push({ role: "assistant", content: response.content });

      const toolCalls = response.content.filter(
        (block): block is Extract<LLMContentBlock, { type: "tool_use" }> => block.type === "tool_use",
      );

      if (response.stopReason !== "tool_use" || toolCalls.length === 0) {
        const answer = response.content
          .filter((block): block is Extract<LLMContentBlock, { type: "text" }> => block.type === "text")
          .map((block) => block.text)
          .join("\n")
          .trim();
        return { answer, toolsUsed };
      }

      const resultBlocks: LLMContentBlock[] = [];
      for (const call of toolCalls) {
        toolsUsed.push(call.name);
        const tool = this.tools.find((t) => t.definition.name === call.name);
        const result = tool
          ? await tool.execute(call.input)
          : { error: `Tool desconocida: ${call.name}` };
        resultBlocks.push({ type: "tool_result", toolUseId: call.id, content: JSON.stringify(result) });
      }
      messages.push({ role: "user", content: resultBlocks });
    }

    throw new Error("AiOrchestrator: se superó el máximo de turnos de tool-use sin respuesta final");
  }
}

function buildSystemPrompt(businessContext: string): string {
  return [
    "Sos el AI Marketing Analyst de decision-engine. Respondés preguntas sobre el negocio usando",
    "ÚNICAMENTE las tools disponibles — nunca inventes números. Si una pregunta no se puede",
    "responder con las tools que tenés, decilo explícitamente en vez de adivinar.",
    "",
    "Contexto de negocio:",
    businessContext,
  ].join("\n");
}
