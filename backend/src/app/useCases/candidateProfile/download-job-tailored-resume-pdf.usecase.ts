import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  TAILORED_RESUMES_REPOSITORY_TOKEN,
  type ITailoredResumesRepository,
} from '../../repositories/tailored-resumes.repository.interface';
import {
  PDF_RENDERER_TOKEN,
  type IPdfRenderer,
} from '../../providers/pdf-renderer.interface';

export interface DownloadPdfResult {
  filename: string;
  buffer: Buffer;
}

@Injectable()
export class DownloadJobTailoredResumePdfUseCase {
  constructor(
    @Inject(TAILORED_RESUMES_REPOSITORY_TOKEN)
    private readonly repository: ITailoredResumesRepository,
    @Inject(PDF_RENDERER_TOKEN)
    private readonly pdfRenderer: IPdfRenderer,
  ) {}

  async execute(userId: string, jobId: string): Promise<DownloadPdfResult> {
    const resume = await this.repository.findByUserAndJob(userId, jobId);
    if (!resume || !resume.markdownContent) {
      throw new NotFoundException(
        'Nenhum currículo gerado para esta vaga ainda. Gere o currículo primeiro.',
      );
    }

    let pdfBuffer: Buffer;
    if (resume.pdfBase64) {
      pdfBuffer = Buffer.from(resume.pdfBase64, 'base64');
    } else {
      pdfBuffer = await this.pdfRenderer.renderMarkdownToPdf(
        resume.markdownContent,
        {
          title: `Curriculo_${resume.targetRole}`,
        },
      );
      // Salva em background
      await this.repository.upsert({
        userId: resume.userId,
        jobId: resume.jobId,
        targetRole: resume.targetRole,
        markdownContent: resume.markdownContent,
        pdfBase64: pdfBuffer.toString('base64'),
        matchScore: resume.matchScore,
        summary: resume.summary,
        highlightedKeywords: resume.highlightedKeywords,
      });
    }

    const sanitizedRole = (resume.targetRole || 'curriculo')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    const filename = `curriculo_${sanitizedRole}_ats.pdf`;

    return {
      filename,
      buffer: pdfBuffer,
    };
  }
}
