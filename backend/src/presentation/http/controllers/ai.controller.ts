import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard, Public } from '../guards/api-key.guard';
import { CheckAiHealthUseCase } from '../../../app/useCases/ai/check-ai-health.usecase';
import type { AiModelCategory } from '../../../infra/providers/ai/ai.types';

@Controller('ai')
@UseGuards(ApiKeyGuard)
export class AiController {
  constructor(private readonly checkAiHealthUseCase: CheckAiHealthUseCase) {}

  @Public()
  @Get('models')
  async getModels(@Query('category') category?: AiModelCategory) {
    const provider = this.checkAiHealthUseCase.getProviderName();
    const models = await this.checkAiHealthUseCase.getAvailableModels(category);
    return {
      provider,
      total: models.length,
      models,
    };
  }

  @Public()
  @Get('health')
  async getHealth() {
    const provider = this.checkAiHealthUseCase.getProviderName();
    const healthy = await this.checkAiHealthUseCase.checkHealth();
    return {
      provider,
      status: healthy ? 'ok' : 'unhealthy',
    };
  }
}
