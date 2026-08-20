import { NotFoundException } from '@nestjs/common';
import { AnalyzeCandidateProfileUseCase } from './analyze-candidate-profile.usecase';
import { ICandidateProfilesRepository } from '../../repositories/candidate-profiles.repository.interface';
import { AiProvider } from '../../providers/ai-provider.interface';
import { CandidateProfileStatus } from '../../../domain/enums';

describe('AnalyzeCandidateProfileUseCase (Candidate Profile Analysis)', () => {
  let useCase: AnalyzeCandidateProfileUseCase;
  let findByUserIdMock: jest.Mock;
  let chatCompletionMock: jest.Mock;

  beforeEach(() => {
    findByUserIdMock = jest.fn();
    chatCompletionMock = jest.fn();

    const mockRepo: ICandidateProfilesRepository = {
      findByUserId: findByUserIdMock,
      upsert: jest.fn(),
    };

    const mockAi: AiProvider = {
      name: '9router',
      chatCompletion: chatCompletionMock,
      getAvailableModels: jest.fn(),
      checkHealth: jest.fn(),
    };

    useCase = new AnalyzeCandidateProfileUseCase(mockRepo, mockAi);
  });

  it('performs deep career profile analysis using AI model', async () => {
    findByUserIdMock.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      status: CandidateProfileStatus.COMPLETE,
      professionalTitle: 'Engenheiro de Software Sênior',
      professionalArea: 'Tecnologia',
      seniority: 'Sênior',
      location: 'São Paulo, SP',
      skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes'],
      summary: 'Profissional com mais de 7 anos construindo sistemas distribuídos.',
      experiences: [
        {
          company: 'Fintech X',
          title: 'Staff Engineer',
          startYear: '2021',
          ongoing: true,
          description: 'Liderança de arquitetura de pagamentos.',
        },
      ],
      education: [
        {
          school: 'USP',
          degree: 'Bacharelado',
          field: 'Sistemas de Informação',
          startYear: '2013',
          endYear: '2017',
          ongoing: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const aiAnalysisResponse = {
      seniority: 'Sênior / Staff',
      headline: 'Staff Engineer | Sistemas Distribuídos & Pagamentos de Alta Escala',
      summary: 'Engenheiro com histórico consistente em fintechs de alto volume.',
      coreCompetencies: ['Arquitetura Distribuída', 'TypeScript/Node.js', 'Kubernetes'],
      strengths: ['Liderança técnica', 'Resiliência de sistemas', 'Alta escalabilidade'],
      recommendations: ['Explorar artigos técnicos sobre arquitetura de pagamentos'],
      targetRoles: ['Staff Engineer', 'Principal Engineer', 'Tech Lead'],
      searchKeywords: ['Staff Engineer', 'Distributed Systems', 'TypeScript', 'Node.js'],
    };

    chatCompletionMock.mockResolvedValue({
      text: JSON.stringify(aiAnalysisResponse),
      model: 'openai/gpt-4o',
    });

    const analysis = await useCase.execute('user-1');

    expect(analysis.seniority).toBe('Sênior / Staff');
    expect(analysis.headline).toBe('Staff Engineer | Sistemas Distribuídos & Pagamentos de Alta Escala');
    expect(analysis.coreCompetencies).toContain('Arquitetura Distribuída');
    expect(analysis.targetRoles).toContain('Staff Engineer');
    expect(findByUserIdMock).toHaveBeenCalledWith('user-1');
    expect(chatCompletionMock).toHaveBeenCalled();
  });

  it('throws NotFoundException if profile does not exist', async () => {
    findByUserIdMock.mockResolvedValue(null);

    await expect(useCase.execute('unknown-user')).rejects.toThrow(NotFoundException);
  });

  it('provides safe fallback analysis if AI provider fails', async () => {
    findByUserIdMock.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      status: CandidateProfileStatus.NEEDS_REVIEW,
      professionalTitle: 'Desenvolvedor Frontend',
      skills: ['React', 'TypeScript'],
      experiences: [],
      education: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    chatCompletionMock.mockRejectedValue(new Error('AI service unavailable'));

    const fallback = await useCase.execute('user-1');

    expect(fallback.seniority).toBe('Pleno');
    expect(fallback.headline).toContain('Desenvolvedor Frontend');
    expect(fallback.coreCompetencies).toEqual(['React', 'TypeScript']);
  });
});
