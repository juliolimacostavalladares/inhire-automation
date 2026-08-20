import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ICandidateProfileInputDTO,
  ICandidateProfileOutputDTO,
} from '../../../domain/dtos';
import { CandidateProfileStatus } from '../../../domain/enums';
import {
  CANDIDATE_PROFILES_REPOSITORY_TOKEN,
  ICandidateProfilesRepository,
} from '../../repositories/candidate-profiles.repository.interface';

@Injectable()
export class UpdateCandidateProfileUseCase {
  constructor(
    @Inject(CANDIDATE_PROFILES_REPOSITORY_TOKEN)
    private readonly repository: ICandidateProfilesRepository,
  ) {}

  async execute(
    userId: string,
    data: Partial<ICandidateProfileInputDTO>,
  ): Promise<ICandidateProfileOutputDTO> {
    const existing = await this.repository.findByUserId(userId);
    if (!existing) {
      throw new NotFoundException(
        'Importe seu currículo antes de confirmar o perfil.',
      );
    }

    return this.repository.upsert(userId, {
      ...existing,
      ...data,
      userId,
      status: CandidateProfileStatus.COMPLETE,
      reviewedAt: new Date(),
      extractedText: null,
    });
  }
}
