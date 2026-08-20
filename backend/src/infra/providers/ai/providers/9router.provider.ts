import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AiProvider } from '../ai-provider.interface';
import {
  AiChatOptions,
  AiChatResponse,
  AiModelCategory,
  AiModelInfo,
} from '../ai.types';
import { Environment } from '../../../config/environment';

@Injectable()
export class NineRouterAiProvider implements AiProvider {
  readonly name = '9router';
  private readonly logger = new Logger(NineRouterAiProvider.name);
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly defaultModel: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService<Environment, true>,
  ) {
    const rawUrl =
      this.config.get('aiBaseUrl', { infer: true }) || 'http://localhost:20128';
    this.baseUrl = rawUrl.replace(/\/+$/, '');
    this.apiKey = this.config.get('aiApiKey', { infer: true });
    this.defaultModel =
      this.config.get('aiDefaultModel', { infer: true }) || 'openai/gpt-4o';
  }

  async chatCompletion(options: AiChatOptions): Promise<AiChatResponse> {
    const model = options.model || this.defaultModel;
    const url = `${this.baseUrl}/v1/chat/completions`;

    const payload = {
      model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: false,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    this.logger.debug(`Sending chat completion request to 9Router (${model}) at ${url}`);

    const response = await firstValueFrom(
      this.http.post<{
        model?: string;
        choices: Array<{
          message: { role: string; content: string };
          finish_reason?: string;
        }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      }>(url, payload, { headers, timeout: 60000 }),
    );

    const firstChoice = response.data?.choices?.[0];
    const text = firstChoice?.message?.content || '';

    return {
      text,
      model: response.data?.model || model,
      finishReason: firstChoice?.finish_reason,
      usage: response.data?.usage
        ? {
            promptTokens: response.data.usage.prompt_tokens,
            completionTokens: response.data.usage.completion_tokens,
            totalTokens: response.data.usage.total_tokens,
          }
        : undefined,
      raw: response.data,
    };
  }

  async getAvailableModels(category?: AiModelCategory): Promise<AiModelInfo[]> {
    const path = category ? `/v1/models/${category}` : '/v1/models';
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const response = await firstValueFrom(
      this.http.get<{
        data: Array<{
          id: string;
          context_window?: number;
          owned_by?: string;
        }>;
      }>(url, { headers, timeout: 10000 }),
    );

    const rawList = response.data?.data || [];
    return rawList.map((m) => ({
      id: m.id,
      name: m.id,
      category,
      contextWindow: m.context_window,
      ownedBy: m.owned_by,
    }));
  }

  async checkHealth(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/health`;
      const response = await firstValueFrom(
        this.http.get(url, { timeout: 5000 }),
      );
      return response.status >= 200 && response.status < 300;
    } catch {
      return false;
    }
  }
}
