import { Inject, Injectable } from '@nestjs/common';
import {
  AiProvider,
  AI_PROVIDER_TOKEN,
} from '../../providers/ai-provider.interface';
import {
  AiChatOptions,
  AiChatResponse,
} from '../../../infra/providers/ai/ai.types';

@Injectable()
export class CompleteAiChatUseCase {
  constructor(
    @Inject(AI_PROVIDER_TOKEN)
    private readonly provider: AiProvider,
  ) {}

  async execute(options: AiChatOptions): Promise<AiChatResponse> {
    return this.provider.chatCompletion(options);
  }

  async quickPrompt(
    prompt: string,
    systemPrompt?: string,
    model?: string,
  ): Promise<string> {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system' as const, content: systemPrompt });
    }
    messages.push({ role: 'user' as const, content: prompt });

    const response = await this.provider.chatCompletion({
      model,
      messages,
    });
    return response.text;
  }
}
