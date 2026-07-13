import { useEffect, useRef } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import type { Job, JobStatus } from '@domain'

export function useRefreshOnComplete(jobs: Job[] | undefined) {
  const qc = useQueryClient()
  const seen = useRef<Record<string, JobStatus>>({})

  useEffect(() => {
    if (!jobs) return
    let completed = false
    for (const j of jobs) {
      if (seen.current[j.id] !== j.status && j.status === 'done')
        completed = true
      seen.current[j.id] = j.status
    }
    if (completed) qc.invalidateQueries({ queryKey: ['list'] })
  }, [jobs, qc])
}
