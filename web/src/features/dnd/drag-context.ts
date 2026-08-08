import { createContext, useContext } from 'react'

import type { DragPayload } from './types'

/** The in-flight drag payload, sourced from EntryDndProvider's own state
 *  rather than dnd-kit's live `active.data.current` — the latter can go
 *  stale mid-drag when the drag source unmounts (e.g. a route change
 *  triggered by hover-to-navigate). */
export const DragPayloadContext = createContext<DragPayload | null>(null)

export function useDragPayload() {
  return useContext(DragPayloadContext)
}
