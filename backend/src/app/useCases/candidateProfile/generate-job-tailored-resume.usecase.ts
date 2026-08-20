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

export interface ResumeProgressEvent {
  step:
    | 'loading_profile'
    | 'building_prompt'
    | 'generating_ai'
    | 'rendering_pdf'
    | 'saving'
    | 'complete'
    | 'cached';
  message: string;
  percent: number;
}

export type ResumeProgressFn = (event: ResumeProgressEvent) => void;

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
    onProgress?: ResumeProgressFn,
  ): Promise<ITailoredResumeOutputDTO> {
    const { userId, jobId, forceRegenerate = false, language = 'pt-BR' } = command;

    const emit = (event: ResumeProgressEvent) => onProgress?.(event);

    emit({ step: 'loading_profile', message: 'Carregando perfil e dados da vaga…', percent: 10 });

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
        emit({ step: 'cached', message: 'Currículo já gerado, retornando versão salva.', percent: 100 });
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

    const markdownTemplate = `<div style="font-size: 2.2em; font-weight: bold; margin-top: 0px; margin-bottom: 4px;">NOME DO CANDIDATO EM MAIÚSCULAS</div>
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

*   **Nome do Curso/Grau** | Instituição (Ano Início – Ano Fim)`;

    const systemPrompt = `Você é um Consultor Especialista em Carreira Tech e Otimização de Currículos para ATS (Applicant Tracking Systems).
Sua missão é adaptar o perfil real do candidato para a vaga alvo, gerando um currículo Markdown de altíssimo impacto.

REGRAS INEGOCIÁVEIS:
1. VERACIDADE ABSOLUTA: Use EXCLUSIVAMENTE as experiências, empresas, períodos, cargos reais e habilidades declaradas pelo candidato. NUNCA invente fatos.
2. ENQUADRAMENTO ESTRATÉGICO: Reorganize e reescreva os bullet points para evidenciar impacto, tecnologias e requisitos da vaga alvo.
3. MÉTRICAS E PALAVRAS-CHAVE: Destaque tecnologias e métricas em **negrito**.
4. VERBOS DE AÇÃO: Inicie cada bullet point com verbos assertivos (ex: "Desenvolvi", "Liderei", "Implementei").
5. IDIOMA: Responda em ${language === 'en' ? 'Inglês' : 'Português do Brasil'}.

FORMATO DE SAÍDA OBRIGATÓRIO — RETORNE APENAS UM OBJETO JSON VÁLIDO, SEM NENHUM TEXTO ANTES OU DEPOIS:
{
  "markdown": "<currículo completo em Markdown seguindo o template abaixo, com todas as seções preenchidas>",
  "targetRole": "<cargo alvo alinhado à vaga>",
  "matchScore": <número inteiro de 0 a 100 representando o % de aderência à vaga>,
  "summary": "<1-2 frases explicando a estratégia de alinhamento do perfil à vaga>",
  "highlightedKeywords": ["<keyword1>", "<keyword2>", "<até 10 palavras-chave técnicas da vaga presentes no perfil>"]
}

TEMPLATE DO CAMPO "markdown" (use exatamente esta estrutura):
${markdownTemplate}`;

    const prompt = `CANDIDATO:\n${JSON.stringify(candidateContext, null, 2)}\n\nVAGA ALVO:\n${JSON.stringify(jobContext, null, 2)}\n\nRetorne SOMENTE o objeto JSON conforme o formato especificado. NÃO escreva nenhum texto fora do JSON.`;

    emit({ step: 'building_prompt', message: 'Construindo prompt ATS personalizado…', percent: 25 });

    let aiResult: ITailoredResumeAiResponse;
    emit({ step: 'generating_ai', message: 'A IA está gerando seu currículo otimizado… (isso pode levar alguns minutos)', percent: 35 });
    try {
      aiResult = await this.aiService.generateStructuredJson<ITailoredResumeAiResponse>({
        prompt,
        systemPrompt,
        timeoutMs: 300_000,
      });
    } catch (error) {
      // Fallback: se o modelo retornou Markdown/HTML diretamente sem wrapper JSON,
      // o AiService lança InternalServerErrorException. Tentamos recuperar o rawText.
      if (
        error instanceof Error &&
        'rawText' in error &&
        typeof (error as unknown as { rawText: string }).rawText === 'string'
      ) {
        const raw = (error as unknown as { rawText: string }).rawText;
        if (raw.length > 100) {
          this.logger.warn('IA retornou Markdown bruto sem wrapper JSON — usando fallback automático');
          aiResult = {
            markdown: raw,
            targetRole: job.title,
            matchScore: 80,
            summary: 'Currículo gerado e alinhado à vaga.',
            highlightedKeywords: [],
          };
        } else {
          this.logger.error('Falha ao gerar currículo via IA:', error);
          throw new BadRequestException('Não foi possível gerar o currículo com IA no momento. Tente novamente.');
        }
      } else {
        this.logger.error('Falha ao gerar currículo via IA:', error);
        throw new BadRequestException('Não foi possível gerar o currículo com IA no momento. Tente novamente.');
      }
    }

    if (!aiResult.markdown || typeof aiResult.markdown !== 'string') {
      throw new BadRequestException('A IA não retornou um formato de currículo válido.');
    }

    // Renderizar PDF via Playwright
    emit({ step: 'rendering_pdf', message: 'Renderizando PDF com formatação ATS via Playwright…', percent: 75 });
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
    emit({ step: 'saving', message: 'Salvando currículo gerado…', percent: 92 });
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

    emit({ step: 'complete', message: 'Currículo gerado com sucesso!', percent: 100 });
    return saved;
  }
}
