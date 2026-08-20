import { InternalServerErrorException } from '@nestjs/common';
import { AiProvider } from '../../../app/providers/ai-provider.interface';
import { AiService } from './ai.service';
import { AiChatOptions, AiChatResponse } from './ai.types';

describe('AiService (Agnostic AI Facade)', () => {
  let service: AiService;
  let chatCompletionMock: jest.Mock;
  let getAvailableModelsMock: jest.Mock;
  let checkHealthMock: jest.Mock;

  beforeEach(() => {
    chatCompletionMock = jest.fn();
    getAvailableModelsMock = jest.fn();
    checkHealthMock = jest.fn();

    const mockProvider: AiProvider = {
      name: 'mock-provider',
      chatCompletion: chatCompletionMock,
      getAvailableModels: getAvailableModelsMock,
      checkHealth: checkHealthMock,
    };

    service = new AiService(mockProvider);
  });

  it('exposes the active provider name', () => {
    expect(service.getProviderName()).toBe('mock-provider');
  });

  it('delegates chat completion directly to active provider', async () => {
    const mockResponse: AiChatResponse = {
      text: 'Resposta gerada',
      model: 'mock-model',
    };
    chatCompletionMock.mockResolvedValue(mockResponse);

    const options: AiChatOptions = {
      messages: [{ role: 'user', content: 'Teste' }],
    };
    const result = await service.chat(options);

    expect(result).toBe(mockResponse);
    expect(chatCompletionMock).toHaveBeenCalledWith(options);
  });

  it('provides convenient complete helper', async () => {
    chatCompletionMock.mockResolvedValue({
      text: 'Texto completado',
      model: 'mock-model',
    });

    const result = await service.complete(
      'Pergunta do usuário',
      'Prompt do sistema',
    );
    expect(result).toBe('Texto completado');
    expect(chatCompletionMock).toHaveBeenCalledWith({
      model: undefined,
      messages: [
        { role: 'system', content: 'Prompt do sistema' },
        { role: 'user', content: 'Pergunta do usuário' },
      ],
    });
  });

  it('generates and parses structured JSON response correctly', async () => {
    chatCompletionMock.mockResolvedValue({
      text: '```json\n{"name":"Dev Senior","skills":["Node","Nest","Postgres"]}\n```',
      model: 'mock-model',
    });

    interface ProfileOutput {
      name: string;
      skills: string[];
    }

    const result = await service.generateStructuredJson<ProfileOutput>({
      prompt: 'Analise o CV',
      validate: (data: unknown): ProfileOutput => {
        const item = data as Record<string, unknown>;
        if (typeof item.name !== 'string' || !Array.isArray(item.skills)) {
          throw new Error('Invalid schema');
        }
        return { name: item.name, skills: item.skills as string[] };
      },
    });

    expect(result).toEqual({
      name: 'Dev Senior',
      skills: ['Node', 'Nest', 'Postgres'],
    });
  });

  it('throws InternalServerErrorException on invalid JSON', async () => {
    chatCompletionMock.mockResolvedValue({
      text: 'Texto não-json que quebra o parser',
      model: 'mock-model',
    });

    await expect(
      service.generateStructuredJson({
        prompt: 'Extraia dados',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('delegates model discovery and health checks to the provider', async () => {
    getAvailableModelsMock.mockResolvedValue([
      { id: 'model-1', name: 'Model One' },
    ]);
    checkHealthMock.mockResolvedValue(true);

    await expect(service.getModels('chat')).resolves.toHaveLength(1);
    await expect(service.isHealthy()).resolves.toBe(true);
  });
});
