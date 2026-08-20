import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { ICandidateProfileOutputDTO } from '../../../domain/dtos';
import {
  CandidateProfileSource,
  CandidateProfileStatus,
} from '../../../domain/enums';
import {
  CANDIDATE_PROFILES_REPOSITORY_TOKEN,
  ICandidateProfilesRepository,
} from '../../repositories/candidate-profiles.repository.interface';
import { parseLinkedInPdf } from '../../../infra/utils/profile-parser';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['application/pdf']);

@Injectable()
export class ImportCandidateProfileUseCase {
  constructor(
    @Inject(CANDIDATE_PROFILES_REPOSITORY_TOKEN)
    private readonly repository: ICandidateProfilesRepository,
  ) {}

  async execute(input: {
    userId: string;
    linkedinProfileUrl: string;
    file: Express.Multer.File;
  }): Promise<ICandidateProfileOutputDTO> {
    const { userId, file, linkedinProfileUrl } = input;
    const isPdfSignature = Boolean(
      file && file.buffer.subarray(0, 5).toString('ascii') === '%PDF-',
    );
    if (
      !file ||
      !ALLOWED_MIME.has(file.mimetype) ||
      !file.originalname.toLowerCase().endsWith('.pdf') ||
      !isPdfSignature
    ) {
      throw new BadRequestException('Envie um arquivo PDF válido.');
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        'O currículo deve ter entre 1 byte e 10 MB.',
      );
    }
    if (!this.isLinkedInProfileUrl(linkedinProfileUrl)) {
      throw new BadRequestException(
        'Informe uma URL válida de perfil do LinkedIn.',
      );
    }

    const rawParsed = await pdfParse(file.buffer).catch(() => {
      throw new BadRequestException('Não foi possível ler o PDF enviado.');
    });
    if (rawParsed.text.replace(/\s/g, '').length < 20) {
      throw new BadRequestException(
        'O PDF não contém texto suficiente para extrair o perfil.',
      );
    }

    const extracted = await parseLinkedInPdf(file.buffer).catch(() => {
      throw new BadRequestException(
        'Não foi possível processar a estrutura do PDF.',
      );
    });

    return this.repository.upsert(userId, {
      userId,
      status: CandidateProfileStatus.NEEDS_REVIEW,
      source: CandidateProfileSource.LINKEDIN_PDF_UPLOAD,
      linkedinProfileUrl: linkedinProfileUrl.trim(),
      sourceFileName: file.originalname.slice(0, 255),
      sourceFileMime: file.mimetype,
      sourceFileSize: file.size,
      extractedText: rawParsed.text.replaceAll(String.fromCharCode(0), '').trim(),
      sourceImportedAt: new Date(),
      reviewedAt: null,
      professionalTitle: extracted.professionalTitle,
      phone: extracted.phone,
      location: extracted.location,
      summary: extracted.summary,
      skills: extracted.skills,
      experiences: extracted.experiences,
      education: extracted.education,
    });
  }

  private isLinkedInProfileUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return (
        (url.hostname === 'linkedin.com' ||
          url.hostname.endsWith('.linkedin.com')) &&
        url.pathname.startsWith('/in/')
      );
    } catch {
      return false;
    }
  }
}
