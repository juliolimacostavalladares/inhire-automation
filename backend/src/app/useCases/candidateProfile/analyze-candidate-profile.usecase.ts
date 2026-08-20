import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AI_PROVIDER_TOKEN,
  IAiProvider,
} from '../../providers/ai-provider.interface';
import {
  CANDIDATE_PROFILES_REPOSITORY_TOKEN,
  ICandidateProfilesRepository,
} from '../../repositories/candidate-profiles.repository.interface';
import {
  ICandidateProfileAnalysisDTO,
  IExperienceEntryDTO,
  IEducationEntryDTO,
} from '../../../domain/dtos';

@Injectable()
export class AnalyzeCandidateProfileUseCase {
  private readonly logger = new Logger(AnalyzeCandidateProfileUseCase.name);

  constructor(
    @Inject(CANDIDATE_PROFILES_REPOSITORY_TOKEN)
    private readonly profileRepository: ICandidateProfilesRepository,
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: IAiProvider,
  ) {}

  async execute(userId: string): Promise<ICandidateProfileAnalysisDTO> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Perfil do candidato não encontrado.');
    }

    const experiences = (profile.experiences as IExperienceEntryDTO[]) || [];
    const education = (profile.education as IEducationEntryDTO[]) || [];
    const skills = profile.skills || [];

    const profileContext = `
      Título Profissional: ${profile.professionalTitle || 'Não informado'}
      Área: ${profile.professionalArea || 'Não informado'}
      Senioridade declarada: ${profile.seniority || 'Não informado'}
      Localização: ${profile.location || 'Não informado'}
      Resumo: ${profile.summary || 'Não informado'}
      Competências/Skills: ${skills.join(', ') || 'Nenhuma'}

      Experiências Profissionais:
      ${experiences
        .map(
          (e) =>
            `- ${e.title || 'Cargo não especificado'} na empresa ${e.company} (${e.startYear || ''} - ${e.ongoing ? 'Atual' : e.endYear || ''})\n  Descrição: ${e.description || 'Sem descrição'}`,
        )
        .join('\n')}

      Formação Acadêmica:
      ${education
        .map(
          (ed) =>
            `- ${ed.degree || 'Grau'} em ${ed.field || 'Área'} na instituição ${ed.school} (${ed.startYear || ''} - ${ed.endYear || ''})`,
        )
        .join('\n')}
          `.trim();

    const systemPrompt = `
      Você é um Headhunter e Especialista em Carreira sênior em tecnologia e recrutamento.
      Sua missão é realizar uma análise aprofundada do perfil profissional do candidato.

      Responda ESTRITAMENTE com um objeto JSON válido (sem texto adicional antes ou depois) no seguinte formato:
      {
        "seniority": "Senioridade avaliada (ex: Estágio, Júnior, Pleno, Sênior, Especialista, Tech Lead, etc.)",
        "headline": "Uma headline de alto impacto para o perfil profissional (ex: Engenheiro de Software Full Stack | Node.js, React & Arquitetura em Nuvem)",
        "summary": "Um resumo executivo profissional refinado em 2 ou 3 parágrafos destacando o valor e diferenciais do candidato",
        "coreCompetencies": ["Competência técnica/comportamental principal 1", "Competência 2", "..."],
        "strengths": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3"],
        "recommendations": ["Recomendação estratégica de carreira 1", "Recomendação 2", "Recomendação 3"],
        "targetRoles": ["Cargo Alvo 1", "Cargo Alvo 2", "Cargo Alvo 3"],
        "searchKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
      }`;

    try {
      const response = await this.aiProvider.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Analise detalhadamente o perfil a seguir e gere os insights profissionais:\n\n${profileContext}`,
          },
        ],
        temperature: 0.2,
      });

      const parsed = this.parseJsonOutput(response.text);
      return this.sanitizeAnalysisOutput(parsed, profile.professionalTitle || 'Profissional');
    } catch (error) {
      this.logger.error(
        `Falha ao analisar perfil via IA: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.getFallbackAnalysis(profile.professionalTitle || 'Profissional', skills);
    }
  }

  private parseJsonOutput(text: string): Record<string, unknown> {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      const firstBracket = cleaned.indexOf('{');
      const lastBracket = cleaned.lastIndexOf('}');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const substring = cleaned.substring(firstBracket, lastBracket + 1);
        return JSON.parse(substring) as Record<string, unknown>;
      }
      throw new Error('Formato JSON inválido retornado pelo modelo de IA');
    }
  }

  private sanitizeAnalysisOutput(
    data: Record<string, unknown>,
    fallbackTitle: string,
  ): ICandidateProfileAnalysisDTO {
    const toStringArray = (val: unknown): string[] =>
      Array.isArray(val)
        ? val
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((item) => item.trim())
        : [];

    return {
      seniority:
        typeof data.seniority === 'string' && data.seniority.trim().length > 0
          ? data.seniority.trim()
          : 'Pleno',
      headline:
        typeof data.headline === 'string' && data.headline.trim().length > 0
          ? data.headline.trim()
          : `${fallbackTitle} | Especialista`,
      summary:
        typeof data.summary === 'string' && data.summary.trim().length > 0
          ? data.summary.trim()
          : 'Perfil profissional consolidado com experiência relevante no mercado.',
      coreCompetencies: toStringArray(data.coreCompetencies),
      strengths: toStringArray(data.strengths),
      recommendations: toStringArray(data.recommendations),
      targetRoles: toStringArray(data.targetRoles),
      searchKeywords: toStringArray(data.searchKeywords),
    };
  }

  private getFallbackAnalysis(
    fallbackTitle: string,
    skills: string[],
  ): ICandidateProfileAnalysisDTO {
    return {
      seniority: 'Pleno',
      headline: `${fallbackTitle} | Tecnologia & Soluções`,
      summary: 'Profissional com sólida atuação na área e competências técnicas aplicadas a projetos do setor.',
      coreCompetencies: skills.slice(0, 5),
      strengths: [
        'Experiência prática comprovada',
        'Capacidade de adaptação a novos desafios',
        'Foco em entrega de resultados',
      ],
      recommendations: [
        'Destaque métricas de impacto nas experiências profissionais',
        'Mantenha as principais tecnologias do mercado atualizadas no perfil',
        'Personalize palavras-chave para matching com vagas alvo',
      ],
      targetRoles: [fallbackTitle],
      searchKeywords: skills.slice(0, 8),
    };
  }
}
