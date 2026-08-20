import { ICandidateProfileInputDTO, ICandidateProfileOutputDTO } from '../../domain/dtos/candidate-profile.dtos';

export const CANDIDATE_PROFILES_REPOSITORY_TOKEN = Symbol.for('CANDIDATE_PROFILES_REPOSITORY_TOKEN');

export interface ICandidateProfilesRepository {
  upsert(userId: string, data: ICandidateProfileInputDTO): Promise<ICandidateProfileOutputDTO>;
  findByUserId(userId: string): Promise<ICandidateProfileOutputDTO | null>;
}
