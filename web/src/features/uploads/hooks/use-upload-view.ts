import { useState } from 'react'

import { useHotkeys } from '@mantine/hooks'

import type { UploadView } from '../helpers'

export function useUploadView() {
  const [view, setView] = useState<UploadView>('hidden')

  useHotkeys([['mod+U', () => setView('modal')]])

  return {
    view,
    setView,
    open: () => setView('modal'),
    expand: () => setView('modal'),
    minimize: () => setView('collapsed'),
    hide: () => setView('hidden'),
  }
}
