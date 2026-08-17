import { describe, expect, it } from "vitest";
import { AiOrchestrator } from "./AiOrchestrator.js";
import type { LLMClient, LLMMessage, LLMResponse, LLMTool } from "../../ports/LLMClient.js";
import type { AiTool } from "./AiTool.js";

/**
 * Fake que simula el loop de tool-use de Anthropic: la primera vez que ve
 * `tools.length > 0` y todavía no le pasaron un `tool_result`, pide ejecutar
 * la primera tool disponible. Una vez que recibe el resultado, contesta con
 * texto final. Así se prueba el loop de `AiOrchestrator` sin pegarle a la
 * API real (mismo criterio del proyecto: nunca tests contra dependencias
 * externas).
 */
class FakeLLMClient implements LLMClient {
  calls = 0;

  async send(params: { system: string; messages: LLMMessage[]; tools: LLMTool[] }): Promise<LLMResponse> {
    this.calls++;
    const hasToolResult = params.messages.some((m) => m.content.some((b) => b.type === "tool_result"));

    if (!hasToolResult && params.tools.length > 0) {
      const firstTool = params.tools[0]!;
      return {
        stopReason: "tool_use",
        content: [{ type: "tool_use", id: "call-1", name: firstTool.name, input: {} }],
      };
    }

    return { stopReason: "end_turn", content: [{ type: "text", text: "respuesta final" }] };
  }
}

class AlwaysToolUseLLMClient implements LLMClient {
  async send(): Promise<LLMResponse> {
    return {
      stopReason: "tool_use",
      content: [{ type: "tool_use", id: "call-x", name: "loop_tool", input: {} }],
    };
  }
}

function buildEchoTool(name: string): AiTool {
  return {
    definition: { name, description: "tool de prueba", inputSchema: { type: "object", properties: {} } },
    async execute() {
      return { ok: true };
    },
  };
}

describe("AiOrchestrator", () => {
  it("ejecuta la tool que pide el modelo y devuelve la respuesta final", async () => {
    const llm = new FakeLLMClient();
    const orchestrator = new AiOrchestrator(llm, [buildEchoTool("get_recommendations_summary")], "contexto de prueba");

    const result = await orchestrator.ask("¿cómo van las recomendaciones?");

    expect(result.answer).toBe("respuesta final");
    expect(result.toolsUsed).toEqual(["get_recommendations_summary"]);
    expect(llm.calls).toBe(2); // 1 pide la tool, 1 contesta con el resultado ya en mano
  });

  it("devuelve texto directo si el modelo no pide ninguna tool", async () => {
    class DirectAnswerClient implements LLMClient {
      async send(): Promise<LLMResponse> {
        return { stopReason: "end_turn", content: [{ type: "text", text: "no hace falta ninguna tool" }] };
      }
    }

    const orchestrator = new AiOrchestrator(new DirectAnswerClient(), [], "contexto de prueba");
    const result = await orchestrator.ask("hola");

    expect(result.answer).toBe("no hace falta ninguna tool");
    expect(result.toolsUsed).toEqual([]);
  });

  it("corta el loop si el modelo pide tools indefinidamente, en vez de colgarse", async () => {
    const orchestrator = new AiOrchestrator(new AlwaysToolUseLLMClient(), [buildEchoTool("loop_tool")], "contexto");

    await expect(orchestrator.ask("pregunta")).rejects.toThrow(/máximo de turnos/);
  });

  it("si el modelo pide una tool desconocida, le pasa un error en el tool_result en vez de explotar", async () => {
    class UnknownToolClient implements LLMClient {
      calls = 0;
      async send(params: { messages: LLMMessage[] }): Promise<LLMResponse> {
        this.calls++;
        const hasToolResult = params.messages.some((m) => m.content.some((b) => b.type === "tool_result"));
        if (!hasToolResult) {
          return { stopReason: "tool_use", content: [{ type: "tool_use", id: "call-1", name: "no_existe", input: {} }] };
        }
        return { stopReason: "end_turn", content: [{ type: "text", text: "ok" }] };
      }
    }

    const orchestrator = new AiOrchestrator(new UnknownToolClient(), [], "contexto");
    const result = await orchestrator.ask("pregunta");

    expect(result.answer).toBe("ok");
  });
});
