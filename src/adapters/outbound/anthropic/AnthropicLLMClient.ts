import type { LLMClient, LLMContentBlock, LLMMessage, LLMResponse, LLMTool } from "../../../ports/LLMClient.js";
import { env } from "../../../shared/config/env.js";

const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1024;
const TIMEOUT_MS = 20000;

interface AnthropicWireBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

/**
 * Único adapter de `LLMClient` hoy: le pega a la Messages API de Anthropic
 * directo con `fetch` (mismo criterio que `OrderFlowDataSource` — sin SDK
 * de por medio para una integración de una sola llamada HTTP). Traduce
 * `LLMContentBlock` <-> el wire format de Anthropic, que son casi
 * idénticos salvo `toolUseId` <-> `tool_use_id`.
 */
export class AnthropicLLMClient implements LLMClient {
  async send(params: { system: string; messages: LLMMessage[]; tools: LLMTool[] }): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: params.system,
          messages: params.messages.map(toWireMessage),
          tools: params.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
          })),
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Anthropic API respondió ${response.status}: ${body}`);
      }

      const data = (await response.json()) as { content: AnthropicWireBlock[]; stop_reason: string };
      return { content: data.content.map(fromWireBlock), stopReason: data.stop_reason };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function toWireMessage(message: LLMMessage): { role: string; content: AnthropicWireBlock[] } {
  return { role: message.role, content: message.content.map(toWireBlock) };
}

function toWireBlock(block: LLMContentBlock): AnthropicWireBlock {
  switch (block.type) {
    case "text":
      return { type: "text", text: block.text };
    case "tool_use":
      return { type: "tool_use", id: block.id, name: block.name, input: block.input };
    case "tool_result":
      return { type: "tool_result", tool_use_id: block.toolUseId, content: block.content };
  }
}

function fromWireBlock(block: AnthropicWireBlock): LLMContentBlock {
  if (block.type === "text") {
    return { type: "text", text: block.text ?? "" };
  }
  if (block.type === "tool_use") {
    return { type: "tool_use", id: block.id ?? "", name: block.name ?? "", input: block.input ?? {} };
  }
  throw new Error(`AnthropicLLMClient: bloque de respuesta inesperado "${block.type}"`);
}
