import { CheckAiHealthUseCase } from './check-ai-health.usecase';
import type { IAiProvider } from '../../providers/ai-provider.interface';
import type { AiModelInfo } from '../../../infra/providers/ai/ai.types';

describe('CheckAiHealthUseCase', () => {
  let useCase: CheckAiHealthUseCase;
  let aiProviderMock: jest.Mocked<IAiProvider>;

  const sampleModels: AiModelInfo[] = [
    {
      id: 'openai/gpt-4o',
      name: 'openai/gpt-4o',
      category: 'chat',
      contextWindow: 128000,
      provider: 'openai',
    },
    {
      id: 'openai/gpt-4o-mini',
      name: 'openai/gpt-4o-mini',
      category: 'chat',
      contextWindow: 128000,
      provider: 'openai',
    },
  ];

  const checkHealthMock = jest.fn().mockResolvedValue(true);
  const getAvailableModelsMock = jest.fn().mockResolvedValue(sampleModels);

  beforeEach(() => {
    aiProviderMock = {
      name: '9router',
      chatCompletion: jest.fn(),
      getAvailableModels: getAvailableModelsMock,
      checkHealth: checkHealthMock,
    };

    useCase = new CheckAiHealthUseCase(aiProviderMock);
    jest.clearAllMocks();
  });

  it('should return provider name', () => {
    expect(useCase.getProviderName()).toBe('9router');
  });

  it('should return health status', async () => {
    const isHealthy = await useCase.checkHealth();
    expect(isHealthy).toBe(true);
    expect(checkHealthMock).toHaveBeenCalledTimes(1);
  });

  it('should return available models', async () => {
    const models = await useCase.getAvailableModels('chat');
    expect(models).toEqual(sampleModels);
    expect(getAvailableModelsMock).toHaveBeenCalledWith('chat');
  });
});
