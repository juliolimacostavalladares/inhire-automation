import { http } from '@/lib/api/http'

export type ProfileStatus = 'PENDING_IMPORT' | 'PROCESSING' | 'NEEDS_REVIEW' | 'COMPLETE' | 'FAILED'

export interface CandidateProfile {
  id: string
  userId: string
  status: ProfileStatus
  source?: string | null
  linkedinProfileUrl?: string | null
  phone?: string | null
  professionalTitle?: string | null
  professionalArea?: string | null
  seniority?: string | null
  location?: string | null
  country?: string | null
  workModalities?: string[] | null
  contractTypes?: string[] | null
  salaryExpectation?: string | null
  skills?: string[] | null
  summary?: string | null
  experiences?: Array<Record<string, unknown>> | null
  education?: Array<Record<string, unknown>> | null
  alertsEnabled: boolean
  sourceFileName?: string | null
  sourceImportedAt?: string | null
  reviewedAt?: string | null
}

export async function getProfile() {
  const { data } = await http.get<CandidateProfile | null>('/me/profile')
  return data
}

export async function importProfile(input: { linkedinProfileUrl: string; file: File }) {
  const form = new FormData()
  form.append('linkedinProfileUrl', input.linkedinProfileUrl)
  form.append('file', input.file)
  const { data } = await http.post<CandidateProfile>('/me/profile/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  })
  return data
}

export async function updateProfile(input: Partial<CandidateProfile>) {
  const { data } = await http.patch<CandidateProfile>('/me/profile', input)
  return data
}
