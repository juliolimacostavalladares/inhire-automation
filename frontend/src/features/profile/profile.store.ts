import { create } from 'zustand'
import { getApiErrorMessage } from '@/lib/api/http'
import { getProfile, importProfile, updateProfile, type CandidateProfile } from './profile.api'

interface ProfileState {
  profile: CandidateProfile | null
  loading: boolean
  error: string | null
  hydrate: () => Promise<CandidateProfile | null>
  import: (input: { linkedinProfileUrl: string; file: File }) => Promise<CandidateProfile>
  save: (input: Partial<CandidateProfile>) => Promise<CandidateProfile>
  reset: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: false,
  error: null,
  hydrate: async () => {
    set({ loading: true, error: null })
    try {
      const profile = await getProfile()
      set({ profile, loading: false })
      return profile
    } catch (error) {
      set({ loading: false, error: getApiErrorMessage(error) })
      throw error
    }
  },
  import: async (input) => {
    set({ loading: true, error: null })
    try {
      const profile = await importProfile(input)
      set({ profile, loading: false })
      return profile
    } catch (error) {
      set({ loading: false, error: getApiErrorMessage(error, 'Não foi possível processar seu currículo.') })
      throw error
    }
  },
  save: async (input) => {
    set({ loading: true, error: null })
    try {
      const profile = await updateProfile(input)
      set({ profile, loading: false })
      return profile
    } catch (error) {
      set({ loading: false, error: getApiErrorMessage(error, 'Não foi possível salvar seu perfil.') })
      throw error
    }
  },
  reset: () => set({ profile: null, loading: false, error: null }),
}))
