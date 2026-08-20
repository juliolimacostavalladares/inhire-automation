import { BadRequestException } from '@nestjs/common';
import { ImportCandidateProfileUseCase } from './import-candidate-profile.usecase';
import { ExtractCandidateProfileAiUseCase } from './extract-candidate-profile-ai.usecase';
import { ICandidateProfilesRepository } from '../../repositories/candidate-profiles.repository.interface';
import { CandidateProfileStatus } from '../../../domain/enums';

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation(() =>
    Promise.resolve({
      text: 'Texto extraído do PDF com perfil profissional e histórico relevante para teste.',
    }),
  );
});

describe('ImportCandidateProfileUseCase (Dynamic AI Extraction)', () => {
  let useCase: ImportCandidateProfileUseCase;
  let upsertMock: jest.Mock;
  let extractExecuteMock: jest.Mock;

  beforeEach(() => {
    upsertMock = jest.fn();
    extractExecuteMock = jest.fn();

    const mockRepo: ICandidateProfilesRepository = {
      findByUserId: jest.fn(),
      upsert: upsertMock,
    };

    const mockExtractor = {
      execute: extractExecuteMock,
    } as unknown as ExtractCandidateProfileAiUseCase;

    useCase = new ImportCandidateProfileUseCase(mockRepo, mockExtractor);
  });

  it('imports valid PDF and delegates extraction to AI use case', async () => {
    extractExecuteMock.mockResolvedValue({
      fullName: 'Dev Teste',
      professionalTitle: 'Engenheiro de Software',
      professionalArea: 'Tecnologia',
      seniority: 'Pleno',
      phone: '1199999999',
      location: 'São Paulo',
      summary: 'Resumo teste',
      skills: ['Node.js', 'TypeScript'],
      experiences: [],
      education: [],
    });

    upsertMock.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      status: CandidateProfileStatus.NEEDS_REVIEW,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockPdfBuffer = Buffer.from('%PDF-1.4 mock content for pdf upload test');
    const mockFile = {
      buffer: mockPdfBuffer,
      mimetype: 'application/pdf',
      originalname: 'curriculo.pdf',
      size: mockPdfBuffer.length,
    } as Express.Multer.File;

    const result = await useCase.execute({
      userId: 'user-1',
      linkedinProfileUrl: 'https://linkedin.com/in/devteste',
      file: mockFile,
    });

    expect(result.id).toBe('profile-1');
    expect(extractExecuteMock).toHaveBeenCalled();
    expect(upsertMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        userId: 'user-1',
        professionalTitle: 'Engenheiro de Software',
        status: CandidateProfileStatus.NEEDS_REVIEW,
      }),
    );
  });

  it('rejects invalid file type or missing signature', async () => {
    const invalidFile = {
      buffer: Buffer.from('NOT_A_PDF'),
      mimetype: 'text/plain',
      originalname: 'test.txt',
      size: 10,
    } as Express.Multer.File;

    await expect(
      useCase.execute({
        userId: 'user-1',
        linkedinProfileUrl: 'https://linkedin.com/in/test',
        file: invalidFile,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid LinkedIn URL', async () => {
    const mockPdfBuffer = Buffer.from('%PDF-1.4 content');
    const mockFile = {
      buffer: mockPdfBuffer,
      mimetype: 'application/pdf',
      originalname: 'cv.pdf',
      size: mockPdfBuffer.length,
    } as Express.Multer.File;

    await expect(
      useCase.execute({
        userId: 'user-1',
        linkedinProfileUrl: 'https://notlinkedin.com/user',
        file: mockFile,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
