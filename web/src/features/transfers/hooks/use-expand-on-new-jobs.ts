import { useEffect, useRef } from 'react'

import type { Job } from '@domain'

export function useExpandOnNewJobs(jobs: Job[] | undefined, onNew: () => void) {
  const known = useRef<Set<string> | null>(null)
  const handler = useRef(onNew)
  handler.current = onNew

  useEffect(() => {
    if (!jobs) return
    if (known.current === null) {
      known.current = new Set(jobs.map((j) => j.id))
      return
    }
    const fresh = jobs.some((j) => !known.current?.has(j.id))
    for (const j of jobs) known.current.add(j.id)
    if (fresh) handler.current()
  }, [jobs])
}
