import type { LLMClient, LLMContentBlock, LLMMessage, LLMResponse, LLMTool } from "../../../ports/LLMClient.js";
import { env } from "../../../shared/config/env.js";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 1024;
const TIMEOUT_MS = 20000;

interface OpenAiToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
}

/**
 * Segundo adapter de `LLMClient` — Groq expone una API compatible con el
 * formato de tool-calling de OpenAI (`tool_calls` en la respuesta, mensajes
 * `role: "tool"` para los resultados), distinto del formato de Anthropic
 * (`tool_use`/`tool_result` como bloques dentro de un mismo mensaje). Toda
 * esa diferencia de wire format vive ACÁ — `AiOrchestrator` no se entera,
 * es exactamente lo que el puerto está diseñado para aislar.
 */
export class GroqLLMClient implements LLMClient {
  async send(params: { system: string; messages: LLMMessage[]; tools: LLMTool[] }): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: [{ role: "system", content: params.system }, ...toOpenAiMessages(params.messages)],
          tools: params.tools.map((tool) => ({
            type: "function",
            function: { name: tool.name, description: tool.description, parameters: tool.inputSchema },
          })),
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Groq API respondió ${response.status}: ${body}`);
      }

      const data = (await response.json()) as {
        choices: { message: OpenAiMessage; finish_reason: string }[];
      };
      const choice = data.choices[0];
      if (!choice) {
        throw new Error("Groq API respondió sin choices");
      }

      // Normalizado a la convención del puerto (ver AiOrchestrator): Groq/OpenAI usa
      // "tool_calls" (plural) donde Anthropic usa "tool_use" — acá se traduce, no en
      // el caso de uso, que no debería saber que existen dos wire formats distintos.
      const stopReason = choice.finish_reason === "tool_calls" ? "tool_use" : choice.finish_reason;
      return { content: fromOpenAiMessage(choice.message), stopReason };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function toOpenAiMessages(messages: LLMMessage[]): OpenAiMessage[] {
  const result: OpenAiMessage[] = [];

  for (const message of messages) {
    if (message.role === "assistant") {
      const text = message.content
        .filter((b): b is Extract<LLMContentBlock, { type: "text" }> => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const toolCalls = message.content
        .filter((b): b is Extract<LLMContentBlock, { type: "tool_use" }> => b.type === "tool_use")
        .map((b): OpenAiToolCall => ({
          id: b.id,
          type: "function",
          function: { name: b.name, arguments: JSON.stringify(b.input) },
        }));
      result.push({
        role: "assistant",
        content: text || null,
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
      });
      continue;
    }

    // role === "user": texto y tool_result se mandan como mensajes separados
    // (OpenAI/Groq no anidan tool results dentro de un mensaje de usuario).
    const text = message.content
      .filter((b): b is Extract<LLMContentBlock, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    if (text) {
      result.push({ role: "user", content: text });
    }
    for (const block of message.content) {
      if (block.type === "tool_result") {
        result.push({ role: "tool", tool_call_id: block.toolUseId, content: block.content });
      }
    }
  }

  return result;
}

function fromOpenAiMessage(message: OpenAiMessage): LLMContentBlock[] {
  const blocks: LLMContentBlock[] = [];
  if (message.content) {
    blocks.push({ type: "text", text: message.content });
  }
  for (const call of message.tool_calls ?? []) {
    blocks.push({
      type: "tool_use",
      id: call.id,
      name: call.function.name,
      input: JSON.parse(call.function.arguments) as Record<string, unknown>,
    });
  }
  return blocks;
}
