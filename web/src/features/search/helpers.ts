import type { ReactNode } from 'react'

import type { RecentEntry } from '@domain'

const HEAD = 2
const TAIL = 2

export function crumb(hit: RecentEntry): string {
  const segments = hit.parent ? hit.parent.split('/').filter(Boolean) : []
  const parts = [hit.root, ...segments]

  if (parts.length <= HEAD + TAIL + 1) return parts.join('/')

  return [...parts.slice(0, HEAD), '…', ...parts.slice(-TAIL)].join('/')
}

export type ActionDef = {
  icon: ReactNode
  label: string
  onClick: () => void
}
