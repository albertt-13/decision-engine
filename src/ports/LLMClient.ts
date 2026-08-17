/**
 * Bloques de contenido, formato compartido por request/response — se eligió
 * porque coincide casi 1:1 con el wire format de Anthropic (`type: "text"`,
 * `"tool_use"`, `"tool_result"`), pero el dominio/aplicación no importa el
 * SDK de Anthropic en ningún lado: solo estos tipos, definidos acá.
 */
export type LLMContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; toolUseId: string; content: string };

export interface LLMMessage {
  role: "user" | "assistant";
  content: LLMContentBlock[];
}

export interface LLMTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface LLMResponse {
  content: LLMContentBlock[];
  stopReason: string;
}

export interface LLMClient {
  send(params: { system: string; messages: LLMMessage[]; tools: LLMTool[] }): Promise<LLMResponse>;
}
