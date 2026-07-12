import { type Job, useCancelJob, useClearJobs } from '@domain'

export function useJobActions(activeJobs: Job[]) {
  const cancelJob = useCancelJob()
  const clearJobs = useClearJobs()

  return {
    cancel: (id: string) => cancelJob.mutate(id),
    cancelAll: () => {
      for (const j of activeJobs) cancelJob.mutate(j.id)
    },
    clear: () => clearJobs.mutate(),
    clearPending: clearJobs.isPending,
  }
}
