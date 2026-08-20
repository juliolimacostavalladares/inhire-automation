import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Put,
  Post,
  UploadedFile,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiKeyGuard, AllowJwt, RequireUser } from '../guards/api-key.guard';
import { CurrentAuth, type AuthContext } from '../guards/auth-context';
import { ImportProfileDto, UpdateProfileDto } from '../dto/profile.dto';
import { GetCandidateProfileUseCase } from '../../../app/useCases/candidateProfile/get-candidate-profile.usecase';
import { ImportCandidateProfileUseCase } from '../../../app/useCases/candidateProfile/import-candidate-profile.usecase';
import { UpdateCandidateProfileUseCase } from '../../../app/useCases/candidateProfile/update-candidate-profile.usecase';
import { AnalyzeCandidateProfileUseCase } from '../../../app/useCases/candidateProfile/analyze-candidate-profile.usecase';

@Controller(['profile', 'me/profile'])
@UseGuards(ApiKeyGuard)
@AllowJwt()
@RequireUser()
export class ProfileController {
  constructor(
    private readonly getCandidateProfileUseCase: GetCandidateProfileUseCase,
    private readonly importCandidateProfileUseCase: ImportCandidateProfileUseCase,
    private readonly updateCandidateProfileUseCase: UpdateCandidateProfileUseCase,
    private readonly analyzeCandidateProfileUseCase: AnalyzeCandidateProfileUseCase,
  ) {}

  @Get()
  async get(@CurrentAuth() auth: AuthContext) {
    if (auth.type !== 'jwt') {
      throw new UnauthorizedException('Authentication required');
    }
    return this.getCandidateProfileUseCase.execute(auth.userId);
  }

  @Post(['import', 'import-pdf'])
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async importPdf(
    @CurrentAuth() auth: AuthContext,
    @Body() body: ImportProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (auth.type !== 'jwt') {
      throw new UnauthorizedException('Authentication required');
    }
    if (!file) throw new BadRequestException('Selecione o arquivo PDF.');
    return this.importCandidateProfileUseCase.execute({
      userId: auth.userId,
      linkedinProfileUrl: body.linkedinProfileUrl,
      file,
    });
  }

  @Put()
  @Patch()
  async update(
    @CurrentAuth() auth: AuthContext,
    @Body() body: UpdateProfileDto,
  ) {
    if (auth.type !== 'jwt') {
      throw new UnauthorizedException('Authentication required');
    }
    return this.updateCandidateProfileUseCase.execute(auth.userId, body);
  }

  @Post('analyze')
  async analyze(@CurrentAuth() auth: AuthContext) {
    if (auth.type !== 'jwt') {
      throw new UnauthorizedException('Authentication required');
    }
    return this.analyzeCandidateProfileUseCase.execute(auth.userId);
  }
}
