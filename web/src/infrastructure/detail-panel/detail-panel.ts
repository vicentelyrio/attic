import { useEffect, useMemo, useState } from 'react'
import type { Entry } from '@domain'

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return (
    el?.tagName === 'INPUT' ||
    el?.tagName === 'TEXTAREA' ||
    el?.isContentEditable === true
  )
}

export function useDetailPanel(selected: Set<string>, entries?: Entry[]) {
  const [open, setOpen] = useState(false)

  const selectedFile = useMemo(() => {
    if (selected.size !== 1) return undefined
    const [name] = selected
    return entries?.find((e) => e.name === name && !e.is_dir)
  }, [selected, entries])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (e.code === 'Space' && selectedFile) {
        e.preventDefault()
        setOpen((prev) => !prev)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedFile, open])

  return {
    entry: open ? selectedFile : undefined,
    open: () => setOpen(true),
    close: () => setOpen(false),
  }
}
