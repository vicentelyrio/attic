import { type RefObject, useEffect, useState } from 'react'

export function useElementWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return width
}
