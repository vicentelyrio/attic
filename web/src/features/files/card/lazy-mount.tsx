import { type ReactNode, useEffect, useRef, useState } from 'react'

import classes from './card.module.css'

export type LazyMountProps = {
  /** Shown while the element is away from the viewport. */
  fallback: ReactNode
  children: ReactNode
}

/**
 * Mounts `children` only while the element is within `rootMargin` of the
 * viewport, and unmounts it once it scrolls away. Bounds the number of live
 * previews (which fetch/decode/highlight) to roughly what is on screen, so
 * scrolling a large directory does not accumulate heavy preview instances.
 */
export function LazyMount({ fallback, children }: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={classes.lazy}>
      {visible ? children : fallback}
    </div>
  )
}
