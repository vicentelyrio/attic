import { type ReactNode, useEffect, useRef, useState } from 'react'

import classes from './card.module.css'

export type LazyMountProps = {
  /** Shown until the element scrolls near the viewport. */
  fallback: ReactNode
  children: ReactNode
}

/**
 * Defers mounting `children` until the element is within `rootMargin` of the
 * viewport, then keeps it mounted. Used to avoid fetching/decoding previews for
 * cards that are far below the fold. Intersection is clipped by the scroll
 * container automatically, so no root element needs to be passed.
 */
export function LazyMount({ fallback, children }: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div ref={ref} className={classes.lazy}>
      {visible ? children : fallback}
    </div>
  )
}
