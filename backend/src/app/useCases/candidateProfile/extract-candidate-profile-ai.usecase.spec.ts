import { ExtractCandidateProfileAiUseCase } from './extract-candidate-profile-ai.usecase';
import { AiProvider } from '../../providers/ai-provider.interface';

describe('ExtractCandidateProfileAiUseCase (AI CV Extraction)', () => {
  let useCase: ExtractCandidateProfileAiUseCase;
  let chatCompletionMock: jest.Mock;

  beforeEach(() => {
    chatCompletionMock = jest.fn();
    const mockProvider: AiProvider = {
      name: 'test-ai',
      chatCompletion: chatCompletionMock,
      getAvailableModels: jest.fn(),
      checkHealth: jest.fn(),
    };
    useCase = new ExtractCandidateProfileAiUseCase(mockProvider);
  });

  it('extracts structured profile from raw CV text using AI', async () => {
    const aiJson = {
      fullName: 'Ada Lovelace',
      professionalTitle: 'Engenheira de Software',
      professionalArea: 'Engenharia de Software',
      seniority: 'Sênior',
      phone: '+55 11 99999-9999',
      location: 'São Paulo, SP',
      summary: 'Desenvolvedora pioneira com ampla experiência em computação.',
      skills: ['TypeScript', 'Node.js', 'NestJS', 'PostgreSQL'],
      experiences: [
        {
          company: 'Tech Corp',
          title: 'Senior Developer',
          startMonth: 'Jan',
          startYear: '2022',
          endMonth: null,
          endYear: null,
          ongoing: true,
          location: 'Remoto',
          description: 'Liderança técnica e arquitetura de microsserviços.',
        },
      ],
      education: [
        {
          school: 'USP',
          degree: 'Bacharelado',
          field: 'Ciência da Computação',
          startMonth: 'Fev',
          startYear: '2016',
          endMonth: 'Dez',
          endYear: '2020',
          ongoing: false,
        },
      ],
    };

    chatCompletionMock.mockResolvedValue({
      text: `\`\`\`json\n${JSON.stringify(aiJson)}\n\`\`\``,
      model: 'openai/gpt-4o',
    });

    const result = await useCase.execute('Currículo da Ada Lovelace com histórico...');

    expect(result.fullName).toBe('Ada Lovelace');
    expect(result.professionalTitle).toBe('Engenheira de Software');
    expect(result.seniority).toBe('Sênior');
    expect(result.skills).toEqual(['TypeScript', 'Node.js', 'NestJS', 'PostgreSQL']);
    expect(result.experiences).toHaveLength(1);
    expect(result.experiences[0].company).toBe('Tech Corp');
    expect(result.education).toHaveLength(1);
    expect(chatCompletionMock).toHaveBeenCalled();
  });

  it('handles empty CV text safely returning default structure', async () => {
    const result = await useCase.execute('   ');
    expect(result.fullName).toBeNull();
    expect(result.skills).toEqual([]);
    expect(result.experiences).toEqual([]);
    expect(chatCompletionMock).not.toHaveBeenCalled();
  });

  it('handles AI failure gracefully without crashing', async () => {
    chatCompletionMock.mockRejectedValue(new Error('AI timeout or network error'));

    const result = await useCase.execute('Algum texto válido de currículo');
    expect(result.fullName).toBeNull();
    expect(result.skills).toEqual([]);
    expect(result.experiences).toEqual([]);
  });
});
