import { createContext, useContext } from 'react'

import type { DragPayload } from './types'

export const DragPayloadContext = createContext<DragPayload | null>(null)

export function useDragPayload() {
  return useContext(DragPayloadContext)
}
