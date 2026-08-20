import { Global, Module, Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AI_PROVIDER_TOKEN } from '../../../app/providers/ai-provider.interface';
import { NineRouterAiProvider } from './providers/9router.provider';
import { CompleteAiChatUseCase } from '../../../app/useCases/ai/complete-ai-chat.usecase';
import { GenerateStructuredJsonUseCase } from '../../../app/useCases/ai/generate-structured-json.usecase';
import { CheckAiHealthUseCase } from '../../../app/useCases/ai/check-ai-health.usecase';
import { Environment } from '../../config/environment';

const aiProviderFactory: Provider = {
  provide: AI_PROVIDER_TOKEN,
  useFactory: (
    nineRouterProvider: NineRouterAiProvider,
    config: ConfigService<Environment>,
  ) => {
    const providerName =
      config.get('aiProvider', { infer: true }) || '9router';

    switch (providerName.toLowerCase()) {
      case '9router':
      case 'ninerouter':
      default:
        return nineRouterProvider;
    }
  },
  inject: [NineRouterAiProvider, ConfigService],
};

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    NineRouterAiProvider,
    aiProviderFactory,
    CompleteAiChatUseCase,
    GenerateStructuredJsonUseCase,
    CheckAiHealthUseCase,
    AiService,
  ],
  exports: [
    AiService,
    AI_PROVIDER_TOKEN,
    NineRouterAiProvider,
    CompleteAiChatUseCase,
    GenerateStructuredJsonUseCase,
    CheckAiHealthUseCase,
  ],
})
export class AiModule {}
