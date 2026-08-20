import { CompleteAiChatUseCase } from './complete-ai-chat.usecase';
import { AiProvider } from '../../providers/ai-provider.interface';

describe('CompleteAiChatUseCase (Clean Architecture)', () => {
  let useCase: CompleteAiChatUseCase;
  let chatCompletionMock: jest.Mock;

  beforeEach(() => {
    chatCompletionMock = jest.fn();
    const mockProvider: AiProvider = {
      name: 'test-provider',
      chatCompletion: chatCompletionMock,
      getAvailableModels: jest.fn(),
      checkHealth: jest.fn(),
    };
    useCase = new CompleteAiChatUseCase(mockProvider);
  });

  it('delegates chat completion to AI provider port', async () => {
    chatCompletionMock.mockResolvedValue({
      text: 'Resposta AI',
      model: 'openai/gpt-4o',
    });

    const response = await useCase.execute({
      messages: [{ role: 'user', content: 'Olá' }],
    });

    expect(response.text).toBe('Resposta AI');
    expect(chatCompletionMock).toHaveBeenCalledWith({
      messages: [{ role: 'user', content: 'Olá' }],
    });
  });

  it('provides quickPrompt helper with system and user messages', async () => {
    chatCompletionMock.mockResolvedValue({
      text: 'Texto gerado',
      model: 'openai/gpt-4o',
    });

    const text = await useCase.quickPrompt('Prompt', 'System');
    expect(text).toBe('Texto gerado');
    expect(chatCompletionMock).toHaveBeenCalledWith({
      model: undefined,
      messages: [
        { role: 'system', content: 'System' },
        { role: 'user', content: 'Prompt' },
      ],
    });
  });
});
