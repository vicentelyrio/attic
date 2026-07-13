import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import type { Entry } from '@domain'

import classes from './rename-field.module.css'

export type RenameFieldProps = {
  entry: Entry
  pending?: boolean
  onSubmit: (name: string) => void
  onCancel: () => void
}

function selectBasename(input: HTMLInputElement, entry: Entry) {
  const { name } = entry
  const dot = name.lastIndexOf('.')
  const end = !entry.is_dir && dot > 0 ? dot : name.length
  input.setSelectionRange(0, end)
}

export function RenameField({
  entry,
  pending,
  onSubmit,
  onCancel,
}: RenameFieldProps) {
  const [value, setValue] = useState(entry.name)
  const ref = useRef<HTMLInputElement>(null)
  const done = useRef(false)
  const settled = useRef(false)

  useEffect(() => {
    const input = ref.current
    if (!input) return
    input.focus()
    selectBasename(input, entry)
    const t = setTimeout(() => {
      settled.current = true
    }, 150)
    return () => clearTimeout(t)
  }, [entry])

  const commit = () => {
    if (done.current) return
    done.current = true
    onSubmit(value)
  }

  const cancel = () => {
    if (done.current) return
    done.current = true
    onCancel()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation()
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (!settled.current) {
      event.target.focus()
      return
    }
    commit()
  }

  const swallow = (event: MouseEvent) => event.stopPropagation()

  return (
    <input
      ref={ref}
      className={classes.field}
      value={value}
      disabled={pending}
      aria-label="New name"
      spellCheck={false}
      onChange={(event) => setValue(event.currentTarget.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onClick={swallow}
      onDoubleClick={swallow}
    />
  )
}
