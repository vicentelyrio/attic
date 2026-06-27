import type { Root } from '@domain'

interface Props {
  roots: Root[]
  current: string | null
  onChange: (root: string) => void
}

export function RootPicker({ roots, current, onChange }: Props) {
  return (
    <select
      className="rootpicker"
      value={current ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      {roots.map((r) => (
        <option key={r.name} value={r.name}>
          {r.name}
        </option>
      ))}
    </select>
  )
}
