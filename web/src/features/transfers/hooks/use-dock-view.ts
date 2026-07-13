import { useState } from 'react'

import type { View } from '../helpers'

export function useDockView() {
  const [view, setView] = useState<View>('hidden')

  return {
    view,
    setView,
    toggle: () => setView((v) => (v === 'hidden' ? 'expanded' : 'hidden')),
  }
}
