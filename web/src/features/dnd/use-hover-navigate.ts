import { useEffect, useRef, useState } from 'react'

const HOVER_WAIT_MS = 1000
const HOVER_BLINK_MS = 1000

/** Auto-navigates into a drop target after it's been hovered (while
 *  dragging) for a sustained period, mirroring OS file-manager dwell-to-open.
 *  The last stretch of the wait blinks the drop highlight as a warning
 *  before navigation actually fires. */
export function useHoverNavigate(active: boolean, onExpire: () => void) {
  const [blinking, setBlinking] = useState(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!active) {
      setBlinking(false)
      return
    }

    const blinkId = setTimeout(() => setBlinking(true), HOVER_WAIT_MS)
    const navId = setTimeout(
      () => onExpireRef.current(),
      HOVER_WAIT_MS + HOVER_BLINK_MS,
    )

    return () => {
      clearTimeout(blinkId)
      clearTimeout(navId)
      setBlinking(false)
    }
  }, [active])

  return { blinking }
}
