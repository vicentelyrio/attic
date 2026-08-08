import type { QueryClient } from '@tanstack/react-query'

import type { Job, JobStatus } from '@domain'

const SETTLED: JobStatus[] = ['done', 'failed', 'canceled']

export function waitForJob(qc: QueryClient, id: string): Promise<JobStatus> {
  return new Promise((resolve) => {
    const check = () => {
      const job = qc.getQueryData<Job[]>(['jobs'])?.find((j) => j.id === id)
      if (!job || !SETTLED.includes(job.status)) return false
      resolve(job.status)
      return true
    }

    if (check()) return
    const unsubscribe = qc.getQueryCache().subscribe(() => {
      if (check()) unsubscribe()
    })
  })
}
