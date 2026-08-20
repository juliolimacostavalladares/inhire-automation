import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CandidateProfileSource, CandidateProfileStatus, Prisma } from "@prisma/client";
import pdfParse from "pdf-parse";
import { PrismaService } from "../prisma/prisma.service";
import type { UpdateProfileDto } from "./dto/profile.dto";
import { parseLinkedInPdf } from "./profile-parser";
import type { ExperienceEntry, EducationEntry } from "./profile-parser";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["application/pdf"]);

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    return this.prisma.candidateProfile.findUnique({ where: { userId } });
  }

  async importPdf(userId: string, input: { linkedinProfileUrl: string; file: Express.Multer.File }) {
    const { file, linkedinProfileUrl } = input;
    const isPdfSignature = Boolean(file && file.buffer.subarray(0, 5).toString("ascii") === "%PDF-");
    if (!file || !ALLOWED_MIME.has(file.mimetype) || !file.originalname.toLowerCase().endsWith(".pdf") || !isPdfSignature) {
      throw new BadRequestException("Envie um arquivo PDF válido.");
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      throw new BadRequestException("O currículo deve ter entre 1 byte e 10 MB.");
    }
    if (!this.isLinkedInProfileUrl(linkedinProfileUrl)) {
      throw new BadRequestException("Informe uma URL válida de perfil do LinkedIn.");
    }

    const parsed = await pdfParse(file.buffer).catch(() => {
      throw new BadRequestException("Não foi possível ler o PDF enviado.");
    });
    const text = parsed.text.replace(/\u0000/g, "").trim();
    if (text.length < 30) throw new BadRequestException("O PDF não contém texto suficiente para extrair o perfil.");

    const extracted = parseLinkedInPdf(text);

    const jsonData = {
      professionalTitle: extracted.professionalTitle,
      phone: extracted.phone,
      location: extracted.location,
      summary: extracted.summary,
      skills: extracted.skills as Prisma.InputJsonValue,
      experiences: extracted.experiences as unknown as Prisma.InputJsonValue,
      education: extracted.education as unknown as Prisma.InputJsonValue,
    };

    const profile = await this.prisma.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        status: CandidateProfileStatus.NEEDS_REVIEW,
        source: CandidateProfileSource.LINKEDIN_PDF_UPLOAD,
        linkedinProfileUrl: linkedinProfileUrl.trim(),
        sourceFileName: file.originalname.slice(0, 255),
        sourceFileMime: file.mimetype,
        sourceFileSize: file.size,
        extractedText: text,
        sourceImportedAt: new Date(),
        ...jsonData,
      },
      update: {
        status: CandidateProfileStatus.NEEDS_REVIEW,
        source: CandidateProfileSource.LINKEDIN_PDF_UPLOAD,
        linkedinProfileUrl: linkedinProfileUrl.trim(),
        sourceFileName: file.originalname.slice(0, 255),
        sourceFileMime: file.mimetype,
        sourceFileSize: file.size,
        extractedText: text,
        sourceImportedAt: new Date(),
        reviewedAt: null,
        ...jsonData,
      },
    });
    return this.publicProfile(profile);
  }

  async update(userId: string, input: UpdateProfileDto) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Importe seu currículo antes de confirmar o perfil.");
    const updated = await this.prisma.candidateProfile.update({
      where: { userId },
      data: {
        ...input,
        workModalities: input.workModalities as Prisma.InputJsonValue | undefined,
        contractTypes: input.contractTypes as Prisma.InputJsonValue | undefined,
        skills: input.skills as Prisma.InputJsonValue | undefined,
        experiences: input.experiences as Prisma.InputJsonValue | undefined,
        education: input.education as Prisma.InputJsonValue | undefined,
        status: CandidateProfileStatus.COMPLETE,
        reviewedAt: new Date(),
        extractedText: null,
      },
    });
    return this.publicProfile(updated);
  }

  private isLinkedInProfileUrl(value: string) {
    try {
      const url = new URL(value);
      return (url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com")) && url.pathname.startsWith("/in/");
    } catch { return false; }
  }

  private publicProfile(profile: Awaited<ReturnType<PrismaService["candidateProfile"]["findUnique"]>>) {
    if (!profile) return null;
    const { extractedText: _extractedText, ...safe } = profile;
    return safe;
  }
}

// Re-export types for use in other modules (e.g., frontend type generation)
export type { ExperienceEntry, EducationEntry };
