import { Inject, Injectable } from '@nestjs/common';
import {
  AiProvider,
  AI_PROVIDER_TOKEN,
} from '../../providers/ai-provider.interface';
import {
  AiModelCategory,
  AiModelInfo,
} from '../../../infra/providers/ai/ai.types';

@Injectable()
export class CheckAiHealthUseCase {
  constructor(
    @Inject(AI_PROVIDER_TOKEN)
    private readonly provider: AiProvider,
  ) {}

  async checkHealth(): Promise<boolean> {
    return this.provider.checkHealth();
  }

  async getAvailableModels(category?: AiModelCategory): Promise<AiModelInfo[]> {
    return this.provider.getAvailableModels(category);
  }

  getProviderName(): string {
    return this.provider.name;
  }
}
