import { Inject, Injectable } from '@nestjs/common';
import { ICandidateProfileOutputDTO } from '../../../domain/dtos';
import {
  CANDIDATE_PROFILES_REPOSITORY_TOKEN,
  ICandidateProfilesRepository,
} from '../../repositories/candidate-profiles.repository.interface';

@Injectable()
export class GetCandidateProfileUseCase {
  constructor(
    @Inject(CANDIDATE_PROFILES_REPOSITORY_TOKEN)
    private readonly repository: ICandidateProfilesRepository,
  ) {}

  async execute(userId: string): Promise<ICandidateProfileOutputDTO | null> {
    return this.repository.findByUserId(userId);
  }
}
