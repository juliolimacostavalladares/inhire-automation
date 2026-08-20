import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  ITailoredResumeAiResponse,
  ITailoredResumeOutputDTO,
} from '../../../domain/dtos/tailored-resume.dtos';
import {
  CANDIDATE_PROFILES_REPOSITORY_TOKEN,
  type ICandidateProfilesRepository,
} from '../../repositories/candidate-profiles.repository.interface';
import {
  JOBS_REPOSITORY_TOKEN,
  type IJobsRepository,
} from '../../repositories/jobs.repository.interface';
import {
  TAILORED_RESUMES_REPOSITORY_TOKEN,
  type ITailoredResumesRepository,
} from '../../repositories/tailored-resumes.repository.interface';
import {
  USERS_REPOSITORY_TOKEN,
  type IUsersRepository,
} from '../../repositories/users.repository.interface';
import {
  PDF_RENDERER_TOKEN,
  type IPdfRenderer,
} from '../../providers/pdf-renderer.interface';
import { AiService } from '../../../infra/providers/ai/ai.service';

export interface GenerateJobTailoredResumeCommand {
  userId: string;
  jobId: string;
  forceRegenerate?: boolean;
  language?: 'pt-BR' | 'en';
}

@Injectable()
export class GenerateJobTailoredResumeUseCase {
  private readonly logger = new Logger(GenerateJobTailoredResumeUseCase.name);

  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository,
    @Inject(CANDIDATE_PROFILES_REPOSITORY_TOKEN)
    private readonly candidateProfilesRepository: ICandidateProfilesRepository,
    @Inject(JOBS_REPOSITORY_TOKEN)
    private readonly jobsRepository: IJobsRepository,
    @Inject(TAILORED_RESUMES_REPOSITORY_TOKEN)
    private readonly tailoredResumesRepository: ITailoredResumesRepository,
    @Inject(PDF_RENDERER_TOKEN)
    private readonly pdfRenderer: IPdfRenderer,
    private readonly aiService: AiService,
  ) {}

  async execute(
    command: GenerateJobTailoredResumeCommand,
  ): Promise<ITailoredResumeOutputDTO> {
    const { userId, jobId, forceRegenerate = false, language = 'pt-BR' } = command;

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const profile = await this.candidateProfilesRepository.findByUserId(userId);
    if (!profile) {
      throw new BadRequestException(
        'Preencha seu perfil profissional antes de gerar um currículo para esta vaga.',
      );
    }

    const job = await this.jobsRepository.findById(jobId);
    if (!job) {
      throw new NotFoundException('Vaga não encontrada.');
    }

    // Se já existe e não pediu para forçar regeneração, retornar o currículo existente
    if (!forceRegenerate) {
      const existing = await this.tailoredResumesRepository.findByUserAndJob(
        userId,
        jobId,
      );
      if (existing && existing.markdownContent && existing.pdfBase64) {
        return existing;
      }
    }

    // Montar contexto do candidato
    const candidateContext = {
      name: user.name,
      email: user.email,
      phone: profile.phone ?? '',
      location: profile.location ?? (profile.country ?? 'Brasil'),
      linkedinProfileUrl: profile.linkedinProfileUrl ?? '',
      professionalTitle: profile.professionalTitle ?? '',
      professionalArea: profile.professionalArea ?? '',
      seniority: profile.seniority ?? '',
      summary: profile.summary ?? '',
      skills: profile.skills ?? [],
      experiences: profile.experiences ?? [],
      education: profile.education ?? [],
    };

    // Montar contexto da vaga
    const jobContext = {
      title: job.title,
      company: job.tenant?.name ?? 'Empresa Confidencial',
      location: job.location ?? 'Não especificado',
      workplaceType: job.workplaceType ?? 'Não especificado',
      descriptionHtml: job.descriptionHtml ?? '',
    };

    const systemPrompt = `Você é um Consultor Especialista em Carreira Tech e Otimização de Currículos para ATS (Applicant Tracking Systems) e Recrutadores Técnicos.
Sua missão é adaptar o perfil real do candidato para a vaga alvo fornecida, gerando um currículo Markdown de altíssimo impacto, 100% alinhado aos filtros e palavras-chave da vaga.

REGRAS INEGOCIÁVEIS:
1. VERACIDADE ABSOLUTA: Use EXCLUSIVAMENTE as experiências, empresas, períodos, cargos reais e habilidades declaradas pelo candidato. NUNCA invente fatos, empresas, datas, graduações ou competências fictícias que não estejam no perfil.
2. ENQUADRAMENTO ESTRATÉGICO: Reorganize, priorize e reescreva os bullet points das experiências reais para evidenciar o impacto, tecnologias e requisitos pedidos na vaga alvo.
3. MÉTRICAS E PALAVRAS-CHAVE: Destaque palavras-chave técnicas e métricas em **negrito** (ex: **React.js**, **+82% de performance**, **IA Generativa**).
4. VERBOS DE AÇÃO: Inicie cada bullet point de experiência com verbos de ação assertivos (ex: "Desenvolvi", "Liderei", "Implementei", "Otimizei").
5. IDIOMA: Responda no idioma "${language === 'en' ? 'Inglês' : 'Português do Brasil'}".
6. FORMATO E TEMPLATE EXATO:
O Markdown gerado deve seguir ESTRITAMENTE a seguinte estrutura de layout e tags HTML para o cabeçalho:

<div style="font-size: 2.2em; font-weight: bold; margin-top: 0px; margin-bottom: 4px;">NOME DO CANDIDATO EM MAIÚSCULAS</div>
<div style="font-size: 1.05em; font-weight: 600; margin-bottom: 6px; color: #1e293b;">Título Profissional Alinhado à Vaga</div>
<div style="font-size: 0.9em; margin-bottom: 4px; color: #475569;">Cidade, Estado | Telefone | <a href="mailto:email">email</a> | <a href="linkedin_url">LinkedIn</a></div>
<div style="font-size: 0.9em; color: #334155; font-style: italic;">Foco em: [Diferencial e competências chave para esta vaga]</div>

---

### RESUMO PROFISSIONAL
[Parágrafo conciso e impactante destacando anos de experiência, especialidade, impacto com as tecnologias pedidas na vaga e diferencial competitivo com IA/eficiência]

---

### EXPERIÊNCIA PROFISSIONAL

**Cargo Alinhado | Nome da Empresa**  
*Mês Ano – Mês Ano (Duração) | Localização ou Remoto*
*   **Ação & Tecnologia:** Descrição com métricas, verbos fortes e palavras-chave em **negrito**.
*   **Impacto no Negócio:** Outro feito mensurável relevante.

---

### HABILIDADES TÉCNICAS

*   **Categoria / Domínio Principal:** Lista de tecnologias em **negrito** e ferramentas dominadas.
*   **Ferramentas, Metodologias & IA:** Tecnologias adicionais e diferenciais.
*   **Soft Skills & Práticas:** Práticas relevantes.

---

### FORMAÇÃO ACADÊMICA & CERTIFICAÇÕES

*   **Nome do Curso/Grau** | Instituição (Ano Início – Ano Fim)
`;

    const prompt = `CANDIDATO:
${JSON.stringify(candidateContext, null, 2)}

VAGA ALVO:
${JSON.stringify(jobContext, null, 2)}

Gere o currículo ATS e retorne estritamente o JSON com a estrutura solicitada.`;

    let aiResult: ITailoredResumeAiResponse;
    try {
      aiResult = await this.aiService.generateStructuredJson<ITailoredResumeAiResponse>({
        prompt,
        systemPrompt,
      });
    } catch (error) {
      this.logger.error('Falha ao gerar currículo via IA:', error);
      throw new BadRequestException(
        'Não foi possível gerar o currículo com IA no momento. Tente novamente.',
      );
    }

    if (!aiResult.markdown || typeof aiResult.markdown !== 'string') {
      throw new BadRequestException('A IA não retornou um formato de currículo válido.');
    }

    // Renderizar PDF via Playwright
    let pdfBase64: string | null = null;
    try {
      const pdfBuffer = await this.pdfRenderer.renderMarkdownToPdf(
        aiResult.markdown,
        {
          title: `Curriculo - ${user.name} - ${job.title}`,
        },
      );
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (error) {
      this.logger.error('Erro ao converter Markdown para PDF via Playwright:', error);
      // Mantém a criação mesmo se o PDF falhar, permitindo retry
    }

    // Persistir no banco de dados
    const saved = await this.tailoredResumesRepository.upsert({
      userId,
      jobId,
      targetRole: aiResult.targetRole || job.title,
      markdownContent: aiResult.markdown,
      pdfBase64,
      matchScore: Math.min(100, Math.max(0, Math.round(Number(aiResult.matchScore) || 85))),
      summary: aiResult.summary || null,
      highlightedKeywords: Array.isArray(aiResult.highlightedKeywords)
        ? aiResult.highlightedKeywords
        : [],
    });

    return saved;
  }
}
