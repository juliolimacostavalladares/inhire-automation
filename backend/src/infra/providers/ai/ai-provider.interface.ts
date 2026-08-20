import {
  AiChatOptions,
  AiChatResponse,
  AiModelCategory,
  AiModelInfo,
} from './ai.types';

export const AI_PROVIDER_TOKEN = Symbol('AI_PROVIDER_TOKEN');

export interface AiProvider {
  readonly name: string;
  chatCompletion(options: AiChatOptions): Promise<AiChatResponse>;
  getAvailableModels(category?: AiModelCategory): Promise<AiModelInfo[]>;
  checkHealth(): Promise<boolean>;
}
