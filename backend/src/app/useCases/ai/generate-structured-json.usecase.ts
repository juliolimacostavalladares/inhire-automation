import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  AiProvider,
  AI_PROVIDER_TOKEN,
} from '../../providers/ai-provider.interface';
import { AiStructuredJsonOptions } from '../../../infra/providers/ai/ai.types';

@Injectable()
export class GenerateStructuredJsonUseCase {
  private readonly logger = new Logger(GenerateStructuredJsonUseCase.name);

  constructor(
    @Inject(AI_PROVIDER_TOKEN)
    private readonly provider: AiProvider,
  ) {}

  async execute<T = unknown>(options: AiStructuredJsonOptions<T>): Promise<T> {
    const systemPrompt = [
      options.systemPrompt ||
        'Você é um assistente de extração e estruturação de dados rigoroso.',
      'Sua resposta DEVE ser estritamente um JSON válido sem nenhum texto adicional fora do bloco JSON.',
    ].join(' ');

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: options.prompt },
    ];

    const response = await this.provider.chatCompletion({
      model: options.model,
      temperature: options.temperature ?? 0.1,
      messages,
    });

    const cleanedText = this.cleanJsonResponse(response.text);

    try {
      const parsed = JSON.parse(cleanedText) as unknown;
      if (options.validate) {
        return options.validate(parsed);
      }
      return parsed as T;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown JSON parse error';
      this.logger.error(
        `Failed to parse structured JSON from AI response: ${msg}. Response was: "${response.text.slice(0, 300)}"`,
      );
      throw new InternalServerErrorException(
        `O modelo de IA retornou uma resposta em formato inválido: ${msg}`,
      );
    }
  }

  private cleanJsonResponse(raw: string): string {
    let text = raw.trim();
    const markdownJsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (markdownJsonMatch) {
      text = markdownJsonMatch[1].trim();
    }
    return text;
  }
}
