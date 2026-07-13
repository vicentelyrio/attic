import { useState } from 'react'

import { getJob, type JobView, type ResolveReq, useResolveJob } from '@domain'

export function useConflictResolution() {
  const resolve = useResolveJob()
  const [conflict, setConflict] = useState<JobView | null>(null)

  return {
    conflict,
    openResolve: async (id: string) => setConflict(await getJob(id)),
    applyResolve: (req: ResolveReq) => {
      if (!conflict) return
      resolve.mutate({ id: conflict.id, req })
      setConflict(null)
    },
    closeConflict: () => setConflict(null),
  }
}
