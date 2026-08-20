import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AI_PROVIDER_TOKEN, AiProvider } from '../../../app/providers/ai-provider.interface';
import {
  AiChatOptions,
  AiChatResponse,
  AiModelCategory,
  AiModelInfo,
  AiStructuredJsonOptions,
} from './ai.types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER_TOKEN)
    private readonly provider: AiProvider,
  ) {}

  getProviderName(): string {
    return this.provider.name;
  }

  async chat(options: AiChatOptions): Promise<AiChatResponse> {
    return this.provider.chatCompletion(options);
  }

  async complete(
    prompt: string,
    systemPrompt?: string,
    model?: string,
  ): Promise<string> {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system' as const, content: systemPrompt });
    }
    messages.push({ role: 'user' as const, content: prompt });

    const response = await this.chat({
      model,
      messages,
    });
    return response.text;
  }

  async generateStructuredJson<T>(options: AiStructuredJsonOptions<T>): Promise<T> {
    const systemPrompt =
      options.systemPrompt ||
      'Você é um assistente de inteligência artificial especializado em extração e estruturação de dados. Responda ESTRITAMENTE em formato JSON válido, sem texto introdutório ou explicativo.';

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: options.prompt },
    ];

    const response = await this.chat({
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.1,
      maxTokens: options.maxTokens,
      responseFormat: { type: 'json_object' },
      timeoutMs: options.timeoutMs,
    });

    const rawText = response.text.trim();
    const cleanJson = this.extractJsonString(rawText);

    try {
      const parsed: unknown = JSON.parse(cleanJson);
      if (options.validate) {
        return options.validate(parsed);
      }
      return parsed as T;
    } catch (error) {
      this.logger.error(
        `Failed to parse structured JSON from AI response: ${
          error instanceof Error ? error.message : String(error)
        }. Response was: "${rawText.slice(0, 300)}"`,
      );

      // Attach raw text to error so callers can implement their own fallback
      const enrichedError = new InternalServerErrorException(
        'Falha ao interpretar resposta estruturada da inteligência artificial',
      );
      (enrichedError as unknown as Record<string, unknown>).rawText = rawText;
      throw enrichedError;
    }
  }

  async getModels(category?: AiModelCategory): Promise<AiModelInfo[]> {
    return this.provider.getAvailableModels(category);
  }

  async isHealthy(): Promise<boolean> {
    return this.provider.checkHealth();
  }

  private extractJsonString(text: string): string {
    const trimmed = text.trim();

    // Case 1: fenced code block (```json ... ```)
    if (trimmed.startsWith('```')) {
      const firstNewline = trimmed.indexOf('\n');
      const lastFence = trimmed.lastIndexOf('```');
      if (firstNewline !== -1 && lastFence > firstNewline) {
        return trimmed.slice(firstNewline + 1, lastFence).trim();
      }
    }

    // Case 2: JSON object wrapped with braces
    const firstBrace = trimmed.indexOf('{');
    const firstBracket = trimmed.indexOf('[');

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      const lastBrace = trimmed.lastIndexOf('}');
      if (lastBrace > firstBrace) {
        return trimmed.slice(firstBrace, lastBrace + 1);
      }
    } else if (firstBracket !== -1) {
      const lastBracket = trimmed.lastIndexOf(']');
      if (lastBracket > firstBracket) {
        return trimmed.slice(firstBracket, lastBracket + 1);
      }
    }

    return trimmed;
  }
}
