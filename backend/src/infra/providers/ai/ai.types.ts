export type AiRole = 'system' | 'user' | 'assistant';

export interface AiChatMessage {
  role: AiRole;
  content: string;
}

export interface AiChatOptions {
  model?: string;
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' | 'text' };
  metadata?: Record<string, unknown>;
}

export interface AiChatResponse {
  text: string;
  model: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
}

export interface AiStructuredJsonOptions<T = unknown> {
  model?: string;
  systemPrompt?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  validate?: (parsed: unknown) => T;
}

export type AiModelCategory = 'chat' | 'image' | 'tts' | 'embedding';

export interface AiModelInfo {
  id: string;
  name?: string;
  category?: AiModelCategory;
  contextWindow?: number;
  provider?: string;
  raw?: unknown;
}
