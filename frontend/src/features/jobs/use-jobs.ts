import { useJobsStore } from './jobs.store'

export function useJobs() {
  return useJobsStore()
}
