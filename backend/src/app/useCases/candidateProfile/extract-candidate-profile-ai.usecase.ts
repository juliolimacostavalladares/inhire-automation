import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AI_PROVIDER_TOKEN,
  IAiProvider,
} from '../../providers/ai-provider.interface';
import {
  IExtractedCandidateProfileDTO,
  IExperienceEntryDTO,
  IEducationEntryDTO,
} from '../../../domain/dtos';

@Injectable()
export class ExtractCandidateProfileAiUseCase {
  private readonly logger = new Logger(ExtractCandidateProfileAiUseCase.name);

  constructor(
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: IAiProvider,
  ) {}

  async execute(rawCvText: string): Promise<IExtractedCandidateProfileDTO> {
    const trimmedText = rawCvText.trim();
    if (!trimmedText) {
      return this.getEmptyProfile();
    }

    const systemPrompt = `Você é um assistente especialista em recrutamento e processamento de currículos (ATS).
Sua tarefa é analisar o texto bruto extraído de um currículo/CV (que pode vir do LinkedIn ou outro formato) e extrair os dados estruturados do candidato.

Responda ESTRITAMENTE com um objeto JSON válido (sem texto adicional antes ou depois, sem markdown delimitador que não seja json) no seguinte formato:
{
  "fullName": "Nome Completo do Candidato ou null",
  "professionalTitle": "Cargo / Título profissional mais recente ou principal ou null",
  "professionalArea": "Área profissional (ex: Engenharia de Software, Produto, Dados, Design, Marketing, etc.) ou null",
  "seniority": "Senioridade estimada (Estágio, Júnior, Pleno, Sênior, Especialista, Lead, Tech Lead, Gerente) ou null",
  "phone": "Telefone/WhatsApp ou null",
  "location": "Cidade, Estado/País ou null",
  "summary": "Resumo profissional ou bio extraída do currículo ou null",
  "skills": ["Skill 1", "Skill 2"],
  "experiences": [
    {
      "company": "Nome da Empresa",
      "title": "Cargo exercido",
      "startMonth": "Mês de início (ex: Jan, Março) ou null",
      "startYear": "Ano de início (ex: 2021) ou null",
      "endMonth": "Mês de término ou null",
      "endYear": "Ano de término ou null",
      "ongoing": true ou false,
      "location": "Local ou null",
      "description": "Descrição das atividades/conquistas ou null"
    }
  ],
  "education": [
    {
      "school": "Instituição de ensino",
      "degree": "Grau (ex: Bacharelado, Pós-graduação, Tecnólogo, Mestrado) ou null",
      "field": "Curso / Área de estudo ou null",
      "startMonth": "Mês início ou null",
      "startYear": "Ano início ou null",
      "endMonth": "Mês término ou null",
      "endYear": "Ano término ou null",
      "ongoing": true ou false
    }
  ]
}`;

    try {
      const response = await this.aiProvider.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Analise o seguinte currículo e extraia todos os dados no schema JSON especificado:\n\n${trimmedText.slice(0, 12000)}`,
          },
        ],
        temperature: 0.1,
      });

      const parsed = this.parseJsonOutput(response.text);
      return this.sanitizeProfileOutput(parsed);
    } catch (error) {
      this.logger.error(
        `Falha ao extrair dados do currículo via IA: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.getEmptyProfile();
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
      // Fallback: tenta encontrar o primeiro { e o último }
      const firstBracket = cleaned.indexOf('{');
      const lastBracket = cleaned.lastIndexOf('}');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const substring = cleaned.substring(firstBracket, lastBracket + 1);
        return JSON.parse(substring) as Record<string, unknown>;
      }
      throw new Error('Formato JSON inválido retornado pelo modelo de IA');
    }
  }

  private isRecord(val: unknown): val is Record<string, unknown> {
    return typeof val === 'object' && val !== null;
  }

  private sanitizeProfileOutput(data: Record<string, unknown>): IExtractedCandidateProfileDTO {
    const skills = Array.isArray(data.skills)
      ? data.skills.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim())
      : [];

    const rawExperiences = Array.isArray(data.experiences) ? data.experiences : [];
    const experiences: IExperienceEntryDTO[] = rawExperiences
      .filter((exp): exp is Record<string, unknown> => {
        if (!this.isRecord(exp)) return false;
        return typeof exp.company === 'string' && exp.company.trim().length > 0;
      })
      .map((exp) => ({
        company: typeof exp.company === 'string' ? exp.company.trim() : '',
        title: typeof exp.title === 'string' ? exp.title.trim() : null,
        startMonth: typeof exp.startMonth === 'string' ? exp.startMonth.trim() : null,
        startYear: typeof exp.startYear === 'string' ? exp.startYear.trim() : null,
        endMonth: typeof exp.endMonth === 'string' ? exp.endMonth.trim() : null,
        endYear: typeof exp.endYear === 'string' ? exp.endYear.trim() : null,
        ongoing: Boolean(exp.ongoing),
        location: typeof exp.location === 'string' ? exp.location.trim() : null,
        description: typeof exp.description === 'string' ? exp.description.trim() : null,
      }));

    const rawEducation = Array.isArray(data.education) ? data.education : [];
    const education: IEducationEntryDTO[] = rawEducation
      .filter((edu): edu is Record<string, unknown> => {
        if (!this.isRecord(edu)) return false;
        return typeof edu.school === 'string' && edu.school.trim().length > 0;
      })
      .map((edu) => ({
        school: typeof edu.school === 'string' ? edu.school.trim() : '',
        degree: typeof edu.degree === 'string' ? edu.degree.trim() : null,
        field: typeof edu.field === 'string' ? edu.field.trim() : null,
        startMonth: typeof edu.startMonth === 'string' ? edu.startMonth.trim() : null,
        startYear: typeof edu.startYear === 'string' ? edu.startYear.trim() : null,
        endMonth: typeof edu.endMonth === 'string' ? edu.endMonth.trim() : null,
        endYear: typeof edu.endYear === 'string' ? edu.endYear.trim() : null,
        ongoing: Boolean(edu.ongoing),
      }));

    return {
      fullName: typeof data.fullName === 'string' ? data.fullName.trim() : null,
      professionalTitle: typeof data.professionalTitle === 'string' ? data.professionalTitle.trim() : null,
      professionalArea: typeof data.professionalArea === 'string' ? data.professionalArea.trim() : null,
      seniority: typeof data.seniority === 'string' ? data.seniority.trim() : null,
      phone: typeof data.phone === 'string' ? data.phone.trim() : null,
      location: typeof data.location === 'string' ? data.location.trim() : null,
      summary: typeof data.summary === 'string' ? data.summary.trim() : null,
      skills,
      experiences,
      education,
    };
  }

  private getEmptyProfile(): IExtractedCandidateProfileDTO {
    return {
      fullName: null,
      professionalTitle: null,
      professionalArea: null,
      seniority: null,
      phone: null,
      location: null,
      summary: null,
      skills: [],
      experiences: [],
      education: [],
    };
  }
}
