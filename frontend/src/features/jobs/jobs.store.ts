import { create } from 'zustand'
import { getApiErrorMessage } from '@/lib/api/http'
import { getJob, listJobs, type JobsQuery } from './jobs.api'
import type { Job } from './jobs.data'

interface JobsState {
  jobs: Job[]
  total: number
  selectedJob: Job | null
  favorites: Set<string>
  loading: boolean
  selectedLoading: boolean
  error: string | null
  detailError: string | null
  fetchJobs: (query?: JobsQuery) => Promise<void>
  selectJob: (id: string) => Promise<void>
  clearSelection: () => void
  toggleFavorite: (id: string) => void
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  total: 0,
  selectedJob: null,
  favorites: new Set(),
  loading: false,
  selectedLoading: false,
  error: null,
  detailError: null,
  fetchJobs: async (query) => {
    set({ loading: true, error: null })
    try {
      const result = await listJobs(query)
      set({ jobs: result.data, total: result.meta.total, loading: false })
    } catch (error) {
      set({ jobs: [], total: 0, loading: false, error: getApiErrorMessage(error) })
    }
  },
  selectJob: async (id) => {
    const cached = get().jobs.find((job) => job.id === id)
    set({ selectedLoading: true, detailError: null })
    try {
      const selectedJob = await getJob(id)
      set({ selectedJob: { ...cached, ...selectedJob }, selectedLoading: false, detailError: null })
    } catch (error) {
      set({
        selectedJob: cached ?? null,
        selectedLoading: false,
        detailError: getApiErrorMessage(error, 'Não foi possível carregar os detalhes da vaga.'),
      })
    }
  },
  clearSelection: () => set({ selectedJob: null, error: null, detailError: null }),
  toggleFavorite: (id) => set((state) => {
    const favorites = new Set(state.favorites)
    if (favorites.has(id)) favorites.delete(id)
    else favorites.add(id)
    return { favorites }
  }),
}))
