import { GenerateStructuredJsonUseCase } from './generate-structured-json.usecase';
import { AiProvider } from '../../providers/ai-provider.interface';
import { InternalServerErrorException } from '@nestjs/common';

describe('GenerateStructuredJsonUseCase (Clean Architecture)', () => {
  let useCase: GenerateStructuredJsonUseCase;
  let mockProvider: jest.Mocked<AiProvider>;

  beforeEach(() => {
    mockProvider = {
      name: 'test-provider',
      chatCompletion: jest.fn(),
      getAvailableModels: jest.fn(),
      checkHealth: jest.fn(),
    };
    useCase = new GenerateStructuredJsonUseCase(mockProvider);
  });

  it('parses clean JSON from markdown-wrapped AI output', async () => {
    mockProvider.chatCompletion.mockResolvedValue({
      text: '```json\n{"role":"Senior Dev","level":"Lead"}\n```',
      model: 'openai/gpt-4o',
    });

    const result = await useCase.execute<{ role: string; level: string }>({
      prompt: 'Analise',
    });

    expect(result).toEqual({ role: 'Senior Dev', level: 'Lead' });
  });

  it('throws InternalServerErrorException when JSON is malformed', async () => {
    mockProvider.chatCompletion.mockResolvedValue({
      text: 'Invalid non-JSON text',
      model: 'openai/gpt-4o',
    });

    await expect(
      useCase.execute({
        prompt: 'Analise',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
