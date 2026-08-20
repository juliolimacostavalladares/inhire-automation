import { Module } from '@nestjs/common';
import { AiModule } from '../../../infra/providers/ai/ai.module';
import { ProfileController } from '../../http/controllers/profile.controller';
import { GetCandidateProfileUseCase } from '../../../app/useCases/candidateProfile/get-candidate-profile.usecase';
import { ImportCandidateProfileUseCase } from '../../../app/useCases/candidateProfile/import-candidate-profile.usecase';
import { UpdateCandidateProfileUseCase } from '../../../app/useCases/candidateProfile/update-candidate-profile.usecase';
import { ExtractCandidateProfileAiUseCase } from '../../../app/useCases/candidateProfile/extract-candidate-profile-ai.usecase';
import { AnalyzeCandidateProfileUseCase } from '../../../app/useCases/candidateProfile/analyze-candidate-profile.usecase';
import { CANDIDATE_PROFILES_REPOSITORY_TOKEN } from '../../../app/repositories/candidate-profiles.repository.interface';
import { PrismaCandidateProfilesRepository } from '../../../infra/repositories/prisma-candidate-profiles.repository';

@Module({
  imports: [AiModule],
  controllers: [ProfileController],
  providers: [
    {
      provide: CANDIDATE_PROFILES_REPOSITORY_TOKEN,
      useClass: PrismaCandidateProfilesRepository,
    },
    GetCandidateProfileUseCase,
    ImportCandidateProfileUseCase,
    UpdateCandidateProfileUseCase,
    ExtractCandidateProfileAiUseCase,
    AnalyzeCandidateProfileUseCase,
  ],
  exports: [
    CANDIDATE_PROFILES_REPOSITORY_TOKEN,
    GetCandidateProfileUseCase,
    ImportCandidateProfileUseCase,
    UpdateCandidateProfileUseCase,
    ExtractCandidateProfileAiUseCase,
    AnalyzeCandidateProfileUseCase,
  ],
})
export class ProfileModule {}
