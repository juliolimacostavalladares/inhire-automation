import { NotFoundException } from '@nestjs/common';
import { DownloadJobTailoredResumePdfUseCase } from './download-job-tailored-resume-pdf.usecase';
import type { ITailoredResumesRepository } from '../../repositories/tailored-resumes.repository.interface';
import type { IPdfRenderer } from '../../providers/pdf-renderer.interface';

describe('DownloadJobTailoredResumePdfUseCase', () => {
  let useCase: DownloadJobTailoredResumePdfUseCase;
  let repository: jest.Mocked<ITailoredResumesRepository>;
  let pdfRenderer: jest.Mocked<IPdfRenderer>;

  beforeEach(() => {
    repository = {
      findByUserAndJob: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    };
    pdfRenderer = {
      renderHtmlToPdf: jest.fn(),
      renderMarkdownToPdf: jest.fn(),
    };
    useCase = new DownloadJobTailoredResumePdfUseCase(repository, pdfRenderer);
  });

  it('returns buffer from base64 when already stored', async () => {
    const rawPdf = Buffer.from('hello-pdf-content');
    repository.findByUserAndJob.mockResolvedValueOnce({
      id: 'res-1',
      userId: 'u-1',
      jobId: 'j-1',
      targetRole: 'Senior Frontend Engineer',
      markdownContent: '# Resume',
      pdfBase64: rawPdf.toString('base64'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute('u-1', 'j-1');
    expect(result.buffer).toEqual(rawPdf);
    expect(result.filename).toBe('curriculo_senior_frontend_engineer_ats.pdf');
    expect(pdfRenderer.renderMarkdownToPdf.mock.calls).toHaveLength(0);
  });

  it('renders and stores PDF when base64 is missing', async () => {
    const generatedPdf = Buffer.from('generated-pdf');
    repository.findByUserAndJob.mockResolvedValueOnce({
      id: 'res-1',
      userId: 'u-1',
      jobId: 'j-1',
      targetRole: 'Tech Lead',
      markdownContent: '# Resume Markdown',
      pdfBase64: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    pdfRenderer.renderMarkdownToPdf.mockResolvedValueOnce(generatedPdf);

    const result = await useCase.execute('u-1', 'j-1');
    expect(result.buffer).toEqual(generatedPdf);
    expect(result.filename).toBe('curriculo_tech_lead_ats.pdf');
    expect(repository.upsert.mock.calls).toHaveLength(1);
  });

  it('throws NotFoundException when resume not found', async () => {
    repository.findByUserAndJob.mockResolvedValueOnce(null);
    await expect(useCase.execute('u-1', 'j-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
