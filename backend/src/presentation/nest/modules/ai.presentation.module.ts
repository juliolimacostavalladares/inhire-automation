import { Module } from '@nestjs/common';
import { AiController } from '../../http/controllers/ai.controller';
import { CheckAiHealthUseCase } from '../../../app/useCases/ai/check-ai-health.usecase';

@Module({
  controllers: [AiController],
  providers: [CheckAiHealthUseCase],
})
export class AiPresentationModule {}
