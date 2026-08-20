import {
  AiChatOptions,
  AiChatResponse,
  AiModelCategory,
  AiModelInfo,
} from '../../infra/providers/ai/ai.types';

export const AI_PROVIDER_TOKEN = Symbol.for('AI_PROVIDER_TOKEN');

export interface AiProvider {
  readonly name: string;
  chatCompletion(options: AiChatOptions): Promise<AiChatResponse>;
  getAvailableModels(category?: AiModelCategory): Promise<AiModelInfo[]>;
  checkHealth(): Promise<boolean>;
}

export type IAiProvider = AiProvider;
