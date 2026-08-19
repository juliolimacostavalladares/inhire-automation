import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CandidateProfileSource, CandidateProfileStatus, Prisma } from "@prisma/client";
import pdfParse from "pdf-parse";
import { PrismaService } from "../prisma/prisma.service";
import type { UpdateProfileDto } from "./dto/profile.dto";

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

    const extracted = this.extract(text);
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
        ...this.toJsonData(extracted),
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
        ...this.toJsonData(extracted),
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

  private extract(text: string) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const section = (names: string[]) => {
      const index = lines.findIndex((line) => names.some((name) => line.toLowerCase() === name));
      if (index < 0) return [];
      return lines.slice(index + 1, index + 9).filter((line) => !this.isHeading(line));
    };
    const summaryLines = section(["sobre", "about", "resumo", "summary"]);
    const experienceLines = section(["experiência", "experiencia", "experience", "experiences"]);
    const educationLines = section(["formação", "formacao", "educação", "educacao", "education"]);
    const skills = section(["competências", "competencias", "skills"])
      .join(",").split(/[,;|•]/).map((item) => item.trim()).filter(Boolean).slice(0, 30);
    const title = lines.find((line) => line.length >= 4 && line.length <= 120) ?? null;
    return {
      professionalTitle: title,
      summary: summaryLines.join(" ").slice(0, 10000) || null,
      skills,
      experiences: experienceLines.map((value) => ({ raw: value })),
      education: educationLines.map((value) => ({ raw: value })),
    };
  }

  private isHeading(value: string) {
    return value.length < 60 && /^[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ0-9 &/-]+$/.test(value);
  }

  private toJsonData(extracted: ReturnType<ProfileService["extract"]>) {
    return {
      professionalTitle: extracted.professionalTitle,
      summary: extracted.summary,
      skills: extracted.skills as Prisma.InputJsonValue,
      experiences: extracted.experiences as Prisma.InputJsonValue,
      education: extracted.education as Prisma.InputJsonValue,
    };
  }

  private publicProfile(profile: Awaited<ReturnType<PrismaService["candidateProfile"]["findUnique"]>>) {
    if (!profile) return null;
    const { extractedText: _extractedText, ...safe } = profile;
    return safe;
  }
}
